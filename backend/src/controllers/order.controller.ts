import type { Response } from "express";
import prisma from "../config/prisma.js";
import type { AuthRequest } from "../middlewares/auth.middleware.js";
import stripe from "../config/stripe.js";
import { generateBill } from "../utils/generateBill.js";
import { uploadBill } from "../utils/uploadBill.js";
import { sendEmail } from "../utils/sendEmail.js";
type BillItem = {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  image: string | null;
};
export const generateOrderBill = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {

    const id = req.params.id as string;

    // Find order and customer
    const order = await prisma.order.findUnique({
      where: {
        id: id,
      },

      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!order) {
      res.status(404).json({
        success: false,
        message: "Order not found",
      });
      return;
    }

    // If bill already exists, don't generate again
    if (order.billUrl) {
      res.status(400).json({
        success: false,
        message: "Bill already generated",
        billUrl: order.billUrl,
      });
      return;
    }

    // Get items from order
    const items = order.items as BillItem[];

    // Generate PDF
    const pdfBuffer = await generateBill({
      orderNumber: order.orderNumber,

      customerName: order.user.name,
      customerEmail: order.user.email,
      customerPhone: order.user.phone,

      address: order.address,
      city: order.city,
      state: order.state,
      pincode: order.pincode,

      items: items,

      totalAmount: Number(order.totalAmount),

      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
    });

    // Upload PDF to Cloudinary
    const billUrl = await uploadBill(
      pdfBuffer,
      order.orderNumber
    );

    // Save bill URL in database
    await prisma.order.update({
      where: {
        id: id,
      },

      data: {
        billUrl: billUrl,
      },
    });

    // Send bill to customer's email
    await sendEmail(
      order.user.email,

      `Bill for Order ${order.orderNumber}`,

      `
        <h2>Nilamadhamb Furniture</h2>

        <p>Hello ${order.user.name},</p>

        <p>
          Your bill for order
          <b>${order.orderNumber}</b>
          is attached with this email.
        </p>

        <p>
          Total Amount:
          <b>Rs. ${Number(order.totalAmount)}</b>
        </p>

        <p>
          Thank you for shopping with
          Nilamadhamb Furniture.
        </p>
      `,

      pdfBuffer,

      `${order.orderNumber}-bill.pdf`
    );

    res.status(200).json({
      success: true,
      message: "Bill generated and sent successfully",
      billUrl: billUrl,
    });

  } catch (error) {

    console.error(
      "Generate bill error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Bill generation failed",
    });
  }
};
export const placeOrder = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const { items, paymentMethod } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({
        success: false,
        message: "Order items are required",
      });
      return;
    }

    if (paymentMethod !== "COD" && paymentMethod !== "ONLINE") {
      res.status(400).json({
        success: false,
        message: "Payment method must be COD or ONLINE",
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    if (
      !user.address ||
      !user.city ||
      !user.state ||
      !user.pincode
    ) {
      res.status(400).json({
        success: false,
        message: "Please add delivery address before placing order",
      });
      return;
    }

    const orderItems = [];

    let totalAmount = 0;

    for (const item of items) {
      const productId = item.productId;
      const quantity = Number(item.quantity);

      if (
        !productId ||
        !Number.isInteger(quantity) ||
        quantity <= 0
      ) {
        res.status(400).json({
          success: false,
          message: "Invalid product or quantity",
        });
        return;
      }

      const product = await prisma.product.findUnique({
        where: {
          id: productId,
        },
      });

      if (!product || !product.isActive) {
        res.status(404).json({
          success: false,
          message: "Product not found",
        });
        return;
      }

      if (product.stock < quantity) {
        res.status(400).json({
          success: false,
          message: `Only ${product.stock} ${product.name} available`,
        });
        return;
      }

      const price = Number(product.price);

      totalAmount = totalAmount + price * quantity;

      orderItems.push({
        productId: product.id,
        name: product.name,
        quantity: quantity,
        price: price,

        image:
          product.images.length > 0
            ? product.images[0]
            : null,
      });
    }

    const orderNumber = `NMF-${Date.now()}`;

    // COD ORDER
   

    if (paymentMethod === "COD") {
      const order = await prisma.order.create({
        data: {
          orderNumber: orderNumber,

          userId: userId,

          items: orderItems,

          totalAmount: totalAmount,

          paymentMethod: "COD",
          paymentStatus: "PENDING",
          orderStatus: "CONFIRMED",

          address: user.address,
          city: user.city,
          state: user.state,
          pincode: user.pincode,

          latitude: user.latitude,
          longitude: user.longitude,
        },
      });
      //reduce the stock
      for (const item of orderItems) {

    await prisma.product.update({
      where: {
        id: item.productId,
      },

      data: {
        stock: {
          decrement: item.quantity,
        },
      },
    });
  }

      res.status(201).json({
        success: true,
        message: "COD order placed successfully",
        order: order,
      });

      return;
    }

    //online order

    const order = await prisma.order.create({
      data: {
        orderNumber: orderNumber,

        userId: userId,

        items: orderItems,

        totalAmount: totalAmount,

        paymentMethod: "ONLINE",
        paymentStatus: "PENDING",
        orderStatus: "PENDING",

        address: user.address,
        city: user.city,
        state: user.state,
        pincode: user.pincode,

        latitude: user.latitude,
        longitude: user.longitude,
      },
    });

  

    const session = await stripe.checkout.sessions.create({
      mode: "payment",

      line_items: orderItems.map((item) => ({
        price_data: {
          currency: "inr",

          product_data: {
            name: item.name,
          },

          unit_amount: Math.round(item.price * 100),
        },

        quantity: item.quantity,
      })),

      metadata: {
        orderId: order.id,
      },

      success_url:
        `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,

      cancel_url:
        `${process.env.CLIENT_URL}/payment-cancelled`,
    });

   
    // SEND CHECKOUT URL
    

    res.status(201).json({
      success: true,
      message: "Order created. Complete payment to confirm the order.",

      order: order,

      checkoutUrl: session.url,
    });

  } catch (error) {
    console.error("Place order error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
export const getMyOrders = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const orders = await prisma.order.findMany({
      where: {
        userId: userId,
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders: orders,
    });

  } catch (error) {
    console.error("Get my orders error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
export const getAllOrders = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const orders = await prisma.order.findMany({
      orderBy: {
        createdAt: "desc",
      },

      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders: orders,
    });

  } catch (error) {
    console.error("Get all orders error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
export const getOrderByIdAdmin = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const id  = req.params.id as string;

    const order = await prisma.order.findUnique({
      where: {
        id: id,
      },

      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!order) {
      res.status(404).json({
        success: false,
        message: "Order not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      order: order,
    });

  } catch (error) {
    console.error("Get order error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
export const updateOrderStatus = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const  id = req.params.id as string;

    const { orderStatus } = req.body;

    const allowedStatuses = [
      "CONFIRMED",
      "PROCESSING",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
    ];

    if (!allowedStatuses.includes(orderStatus)) {
      res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
      return;
    }

    const order = await prisma.order.findUnique({
      where: {
        id: id,
      },
    });

    if (!order) {
      res.status(404).json({
        success: false,
        message: "Order not found",
      });
      return;
    }

    // Online order must be paid before admin processes it
    if (
      order.paymentMethod === "ONLINE" &&
      order.paymentStatus !== "PAID"
    ) {
      res.status(400).json({
        success: false,
        message: "Online payment is not completed",
      });
      return;
    }

    const updatedOrder = await prisma.order.update({
      where: {
        id: id,
      },

      data: {
        orderStatus: orderStatus,
      },
    });

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order: updatedOrder,
    });

  } catch (error) {
    console.error("Update order status error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
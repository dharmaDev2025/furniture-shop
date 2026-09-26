import type { Response } from "express";
import stripe from "../config/stripe.js";
import prisma from "../config/prisma.js";
import type { AuthRequest } from "../middlewares/auth.middleware.js";

// Type for products stored inside order.items
type OrderItem = {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  image: string | null;
};

export const verifyPayment = async (
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

    const { sessionId } = req.body;

    if (!sessionId) {
      res.status(400).json({
        success: false,
        message: "Session ID is required",
      });
      return;
    }

    // Get payment information from Stripe
    const session =
      await stripe.checkout.sessions.retrieve(sessionId);

    // Check payment
    if (session.payment_status !== "paid") {
      res.status(400).json({
        success: false,
        message: "Payment not completed",
      });
      return;
    }

    // Get order ID from Stripe
    const orderId = session.metadata?.orderId;

    if (!orderId) {
      res.status(400).json({
        success: false,
        message: "Order ID not found",
      });
      return;
    }

    // Find order
    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
      },
    });

    if (!order) {
      res.status(404).json({
        success: false,
        message: "Order not found",
      });
      return;
    }

    // Customer can verify only their own order
    if (order.userId !== userId) {
      res.status(403).json({
        success: false,
        message: "You cannot verify this order",
      });
      return;
    }

    // IMPORTANT:
    // If already paid, don't reduce stock again
    if (order.paymentStatus === "PAID") {
      res.status(200).json({
        success: true,
        message: "Payment already verified",
        order: order,
      });
      return;
    }

    // Get items from order
    const orderItems = order.items as OrderItem[];

    // Reduce stock
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

    // Mark payment as paid
    const updatedOrder = await prisma.order.update({
      where: {
        id: orderId,
      },

      data: {
        paymentStatus: "PAID",
        orderStatus: "CONFIRMED",
      },
    });

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      order: updatedOrder,
    });

  } catch (error) {
    console.error("Verify payment error:", error);

    res.status(500).json({
      success: false,
      message: "Payment verification failed",
    });
  }
};
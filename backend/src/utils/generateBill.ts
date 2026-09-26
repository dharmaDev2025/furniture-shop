import PDFDocument from "pdfkit";

type BillItem = {
  name: string;
  quantity: number;
  price: number;
};

type BillData = {
  orderNumber: string;

  customerName: string;
  customerEmail: string;
  customerPhone: string;

  address: string;
  city: string;
  state: string;
  pincode: string;

  items: BillItem[];

  totalAmount: number;

  paymentMethod: string;
  paymentStatus: string;
};

export const generateBill = (
  data: BillData
): Promise<Buffer> => {

  return new Promise((resolve, reject) => {

    const doc = new PDFDocument({
      margin: 50,
    });

    const chunks: Buffer[] = [];

    // Collect PDF data
    doc.on("data", (chunk) => {
      chunks.push(chunk);
    });

    // PDF completed
    doc.on("end", () => {
      const pdfBuffer = Buffer.concat(chunks);

      resolve(pdfBuffer);
    });

    // Error
    doc.on("error", reject);


    // =========================
    // SHOP DETAILS
    // =========================

    doc
      .fontSize(22)
      .text("NILAMADHAMB FURNITURE", {
        align: "center",
      });

    doc
      .fontSize(12)
      .text("Balikhanda, Balasore", {
        align: "center",
      });

    doc.moveDown();

    doc
      .fontSize(18)
      .text("INVOICE", {
        align: "center",
      });

    doc.moveDown();


    // =========================
    // ORDER DETAILS
    // =========================

    doc
      .fontSize(11)
      .text(`Order Number: ${data.orderNumber}`);

    doc.text(
      `Date: ${new Date().toLocaleDateString("en-IN")}`
    );

    doc.moveDown();


    // =========================
    // CUSTOMER DETAILS
    // =========================

    doc
      .fontSize(14)
      .text("Customer Details");

    doc.moveDown(0.5);

    doc
      .fontSize(11)
      .text(`Name: ${data.customerName}`);

    doc.text(`Email: ${data.customerEmail}`);

    doc.text(`Phone: ${data.customerPhone}`);

    doc.text(
      `Address: ${data.address}, ${data.city}, ${data.state} - ${data.pincode}`
    );

    doc.moveDown();


    // =========================
    // PRODUCT DETAILS
    // =========================

    doc
      .fontSize(14)
      .text("Order Items");

    doc.moveDown();

    data.items.forEach((item, index) => {

      const itemTotal =
        item.price * item.quantity;

      doc
        .fontSize(11)
        .text(`${index + 1}. ${item.name}`);

      doc.text(
        `Quantity: ${item.quantity}`
      );

      doc.text(
        `Price: Rs. ${item.price}`
      );

      doc.text(
        `Total: Rs. ${itemTotal}`
      );

      doc.moveDown();
    });


    // =========================
    // TOTAL
    // =========================

    doc
      .fontSize(14)
      .text(
        `Total Amount: Rs. ${data.totalAmount}`,
        {
          align: "right",
        }
      );

    doc.moveDown();

    doc
      .fontSize(11)
      .text(
        `Payment Method: ${data.paymentMethod}`
      );

    doc.text(
      `Payment Status: ${data.paymentStatus}`
    );

    doc.moveDown(2);

    doc.text(
      "Thank you for shopping with Nilamadhamb Furniture!",
      {
        align: "center",
      }
    );


    // Finish PDF
    doc.end();
  });
};
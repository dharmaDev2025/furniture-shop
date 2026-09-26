import "dotenv/config";
import bcrypt from "bcryptjs";
import prisma from "../src/config/prisma.js";

const createAdmin = async () => {
  try {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    const phone = process.env.ADMIN_PHONE || "0000000000";

    if (!email || !password) {
      throw new Error(
        "ADMIN_EMAIL and ADMIN_PASSWORD are required"
      );
    }

    const existingAdmin = await prisma.user.findUnique({
      where: {
        email: email.toLowerCase(),
      },
    });

    if (existingAdmin) {
      console.log("Admin already exists");
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.create({
      data: {
        name: "Nilamadhamb Furniture Admin",
        email: email.toLowerCase(),
        password: hashedPassword,
        phone,
        role: "ADMIN",
      },
    });

    console.log("Admin created successfully");
  } catch (error) {
    console.error("Create admin error:", error);
  } finally {
    await prisma.$disconnect();
  }
};

createAdmin();
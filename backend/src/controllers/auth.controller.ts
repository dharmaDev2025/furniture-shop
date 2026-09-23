import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import prisma from "../config/prisma.js";
import jwt from "jsonwebtoken";

export const registerUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    
    const { name, email, phone, password } = req.body;

    
    if (!name || !email || !password) {
      res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
      return;
    }

    
    const existingUser = await prisma.user.findUnique({
      where: {
        email: email.toLowerCase(),
      },
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: "User with this email already exists",
      });
      return;
    }

  
    const hashedPassword = await bcrypt.hash(password, 10);

    
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        phone: phone || null,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });
    res.status(201).json({
      success: true,
      message: "Registration successful",
      user,
    });
  } catch (error) {
    console.error("Register error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
export const loginUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {

    const { email, password } = req.body;


    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
      return;
    }


    const user = await prisma.user.findUnique({
      where: {
        email: email.toLowerCase(),
      },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
      return;
    }


    if (!user.password) {
      res.status(401).json({
        success: false,
        message: "Please login with Google",
      });
      return;
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordCorrect) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
      return;
    }

    
    if (!user.isActive) {
      res.status(403).json({
        success: false,
        message: "Your account is inactive",
      });
      return;
    }


    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error("JWT_SECRET is not defined");
    }

    // 8. Generate JWT
    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
      },
      jwtSecret,
      {
        expiresIn: "7d",
      }
    );

    // 9. Send response
    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import prisma from "../config/prisma.js";
import jwt from "jsonwebtoken";
import { sendEmail } from "../utils/sendEmail.js";
import { OAuth2Client } from "google-auth-library";
import crypto from "crypto";
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
        resetOtp: "",
        resetOtpExpireAt: new Date(0),
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
export const googleLogin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Google ID token sent by frontend
    const { credential } = req.body;

    if (!credential) {
      res.status(400).json({
        success: false,
        message: "Google credential is required",
      });
      return;
    }

    const googleClientId = process.env.GOOGLE_CLIENT_ID;

    if (!googleClientId) {
      throw new Error("GOOGLE_CLIENT_ID is not defined");
    }

    const googleClient = new OAuth2Client(googleClientId);

    // Verify Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: googleClientId,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      res.status(401).json({
        success: false,
        message: "Invalid Google credential",
      });
      return;
    }

    const googleId = payload.sub;
    const email = payload.email;
    const name = payload.name;

    if (!email || !name) {
      res.status(400).json({
        success: false,
        message: "Google account information is incomplete",
      });
      return;
    }

    // Check whether this Google account already exists
    let user = await prisma.user.findUnique({
      where: {
        googleId: googleId,
      },
    });

    // If Google ID isn't found, check whether same email already exists
    if (!user) {
      user = await prisma.user.findUnique({
        where: {
          email: email.toLowerCase(),
        },
      });
    }

    // Existing email/password account → connect Google account
    if (user) {
      if (!user.googleId) {
        user = await prisma.user.update({
          where: {
            id: user.id,
          },
          data: {
            googleId: googleId,
          },
        });
      }
    } else {
      // Completely new customer
      user = await prisma.user.create({
        data: {
          name: name,
          email: email.toLowerCase(),
          phone: "",
          googleId: googleId,
          password: null,
          resetOtp: "",
          resetOtpExpireAt: new Date(0),
        },
      });
    }

    if (!user.isActive) {
      res.status(403).json({
        success: false,
        message: "Account is inactive",
      });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error("JWT_SECRET is not defined");
    }

    // Generate OUR Furniture Shop JWT
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

    res.status(200).json({
      success: true,
      message: "Google login successful",
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
    console.error("Google login error:", error);

    res.status(401).json({
      success: false,
      message: "Google authentication failed",
    });
  }
};
export const forgotPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        message: "Email is required",
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: {
        email: email.toLowerCase(),
      },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    // Generate 6-digit OTP
    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // Hash OTP before storing it
    const hashedOtp = await bcrypt.hash(otp, 10);

    // OTP expires after 10 minutes
    const otpExpiry = new Date(
      Date.now() + 10 * 60 * 1000
    );

    // Save hashed OTP + expiry
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        resetOtp: hashedOtp,
        resetOtpExpireAt: otpExpiry,
      },
    });

    // Send actual OTP to customer's email
    await sendEmail(
      user.email,
      "Furniture Shop - Password Reset OTP",
      `
        <h2>Password Reset</h2>

        <p>Hello ${user.name},</p>

        <p>Your password reset OTP is:</p>

        <h1>${otp}</h1>

        <p>This OTP is valid for 10 minutes.</p>

        <p>If you did not request this, please ignore this email.</p>
      `
    );

    res.status(200).json({
      success: true,
      message: "OTP sent to your email",
    });
  } catch (error) {
    console.error("Forgot password error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to send OTP",
    });
  }
};
export const verifyResetOtp = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: {
        email: email.toLowerCase(),
      },
    });

    if (!user || !user.resetOtp || !user.resetOtpExpireAt) {
      res.status(400).json({
        success: false,
        message: "Invalid OTP request",
      });
      return;
    }

    // Check expiration
    if (user.resetOtpExpireAt < new Date()) {
      res.status(400).json({
        success: false,
        message: "OTP has expired",
      });
      return;
    }

    // Compare entered OTP with stored hashed OTP
    const isOtpValid = await bcrypt.compare(
      otp,
      user.resetOtp
    );

    if (!isOtpValid) {
      res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (error) {
    console.error("Verify OTP error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
export const resetPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      res.status(400).json({
        success: false,
        message: "Email, OTP and new password are required",
      });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: {
        email: email.toLowerCase(),
      },
    });

    if (!user || !user.resetOtp || !user.resetOtpExpireAt) {
      res.status(400).json({
        success: false,
        message: "Invalid password reset request",
      });
      return;
    }
    // Check OTP expiration
    if (user.resetOtpExpireAt < new Date()) {
      res.status(400).json({
        success: false,
        message: "OTP has expired",
      });
      return;
    }

    // Verify OTP again
    const isOtpValid = await bcrypt.compare(
      otp,
      user.resetOtp
    );

    if (!isOtpValid) {
      res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
      return;
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(
      newPassword,
      10
    );

    // Update password and remove used OTP
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashedPassword,
        resetOtp: "",
        resetOtpExpireAt: null,
      },
    });

    res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const resendResetOtp = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        message: "Email is required",
      });
      return;
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: {
        email: email.toLowerCase(),
      },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    // Generate new 6-digit OTP
    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // Hash new OTP
    const hashedOtp = await bcrypt.hash(otp, 10);

    // New expiry time - 10 minutes
    const otpExpiry = new Date(
      Date.now() + 10 * 60 * 1000
    );

    // Replace old OTP with new OTP
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        resetOtp: hashedOtp,
        resetOtpExpiresAt: otpExpiry,
      },
    });

    // Send new OTP
    await sendEmail(
      user.email,
      "Furniture Shop - New Password Reset OTP",
      `
        <h2>Password Reset</h2>

        <p>Hello ${user.name},</p>

        <p>Your new OTP is:</p>

        <h1>${otp}</h1>

        <p>This OTP is valid for 10 minutes.</p>
      `
    );

    res.status(200).json({
      success: true,
      message: "New OTP sent successfully",
    });

  } catch (error) {
    console.error("Resend OTP error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to resend OTP",
    });
  }
};


export const adminLogin = async (
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

    const admin = await prisma.user.findUnique({
      where: {
        email: email.toLowerCase(),
      },
    });

    if (!admin || admin.role !== "ADMIN" || !admin.password) {
      res.status(401).json({
        success: false,
        message: "Invalid admin credentials",
      });
      return;
    }

    if (!admin.isActive) {
      res.status(403).json({
        success: false,
        message: "Admin account is inactive",
      });
      return;
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      admin.password
    );

    if (!isPasswordCorrect) {
      res.status(401).json({
        success: false,
        message: "Invalid admin credentials",
      });
      return;
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 1000000).toString();

    // Hash OTP before storing it
    const hashedOtp = await bcrypt.hash(otp, 10);

    // OTP expires after 5 minutes
    const otpExpiresAt = new Date(
      Date.now() + 5 * 60 * 1000
    );

    await prisma.user.update({
      where: {
        id: admin.id,
      },
      data: {
        adminLoginOtp: hashedOtp,
        adminLoginOtpExpiresAt: otpExpiresAt,
      },
    });

    await sendEmail(
      admin.email,
      "Admin Login OTP - Nilamadhamb Furniture",
      `
        <h2>Admin Login Verification</h2>
        <p>Your OTP is:</p>
        <h1>${otp}</h1>
        <p>This OTP expires in 5 minutes.</p>
      `
    );

    res.status(200).json({
      success: true,
      message: "OTP sent to admin email",
    });

  } catch (error) {
    console.error("Admin login error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
export const verifyAdminLoginOtp = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
      return;
    }

    const admin = await prisma.user.findUnique({
      where: {
        email: email.toLowerCase(),
      },
    });

    if (
      !admin ||
      admin.role !== "ADMIN" ||
      !admin.adminLoginOtp ||
      !admin.adminLoginOtpExpiresAt
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
      return;
    }

    // Check expiry
    if (new Date() > admin.adminLoginOtpExpiresAt) {
      res.status(400).json({
        success: false,
        message: "OTP has expired",
      });
      return;
    }

    // Compare entered OTP with hashed OTP
    const isOtpCorrect = await bcrypt.compare(
      otp.toString(),
      admin.adminLoginOtp
    );

    if (!isOtpCorrect) {
      res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error("JWT_SECRET is not defined");
    }

    // OTP is correct → remove it
    await prisma.user.update({
      where: {
        id: admin.id,
      },
      data: {
        adminLoginOtp: null,
        adminLoginOtpExpiresAt: null,
      },
    });

    // NOW generate admin JWT
    const token = jwt.sign(
      {
        userId: admin.id,
        role: admin.role,
      },
      jwtSecret,
      {
        expiresIn: "7d",
      }
    );

    res.status(200).json({
      success: true,
      message: "Admin login successful",
      token: token,
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });

  } catch (error) {
    console.error("Verify admin OTP error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


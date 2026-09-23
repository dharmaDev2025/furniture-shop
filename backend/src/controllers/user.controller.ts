import type { Response } from "express";
import prisma from "../config/prisma.js";
import type { AuthRequest } from "../middlewares/auth.middleware.js";

export const getProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    console.log(userId);

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Profile fetched successfully",
      user,
    });
  } catch (error) {
    console.error("Get profile error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });

  }
};
export const updateProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
    try {
        const userId=req.user?.id;

        if(!userId){
            res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return; 
        }
        
        const{name,phone}=req.body;
           if (!name && !phone) {
      res.status(400).json({
        success: false,
        message: "Please provide name or phone to update",
      });
      return;
    }
    const updateData: {
  name?: string;
  phone?: string;
} = {};

if (name) {
  updateData.name = name;
}

if (phone) {
  updateData.phone = phone;
}

const updatedUser = await prisma.user.update({
  where: {
    id: userId,
  },
  data: updateData,
  select: {
    id: true,
    name: true,
    email: true,
    phone: true,
    role: true,
    updatedAt: true,
  },
});
  res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
        
    } catch (error) {
           
        console.error("Update profile error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
        
    }
}
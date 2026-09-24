import type { Request, Response } from "express";
import { Readable } from "stream";

import prisma from "../config/prisma.js";
import cloudinary from "../config/cloudinary.js";
const uploadToCloudinary = (
  fileBuffer: Buffer
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "furniture-shop/products",
        resource_type: "image",
      },

      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        if (!result) {
          reject(new Error("Cloudinary upload failed"));
          return;
        }

        resolve(result.secure_url);
      }
    );

    Readable.from(fileBuffer).pipe(uploadStream);
  });
};

export const createProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      name,
      description,
      price,
      category,
      stock,
      material,
      color,
      dimensions,
    } = req.body;

    // Required fields
    if (!name || !price || !category) {
      res.status(400).json({
        success: false,
        message: "Name, price and category are required",
      });
      return;
    }

    // Get images received by Multer
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      res.status(400).json({
        success: false,
        message: "At least one product image is required",
      });
      return;
    }

    // Upload all images to Cloudinary
    const imageUrls = await Promise.all(
      files.map((file) => uploadToCloudinary(file.buffer))
    );

    // Create product in PostgreSQL
    const product = await prisma.product.create({
      data: {
        name,
        description: description || null,

        price: Number(price),
        category,

        stock: stock ? Number(stock) : 0,

        material: material || null,
        color: color || null,
        dimensions: dimensions || null,

        images: imageUrls,
      },
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error("Create product error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

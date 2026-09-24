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
export const getAllProducts=async(req:Request,res:Response):Promise<void>=>{
  try {
    const products=await prisma.product.findMany({
      where:{
        isActive:true,
      },

      orderBy:{
        createdAt:"desc"
      }
    });
    res.status(200).json({
      success:true,
      count:products.length,
      products,
    });

    
  } catch (error) {
     console.error("Get products error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
    
  }
export const getProductById=async(
  req:Request,res:Response
):Promise<void>=>{
  try {
    const id=req.params.id as string;
    const product=await prisma.product.findFirst({
      where:{
        id:id,
        isActive:true,

      }
    })
    
  } catch (error) {
    
  }
}
export const updateProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = req.params.id as string;

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

    // Check product exists
    const existingProduct = await prisma.product.findUnique({
      where: {
        id: id,
      },
    });

    if (!existingProduct) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    // Create update object
    const updateData: any = {};

    if (name !== undefined) {
      updateData.name = name;
    }

    if (description !== undefined) {
      updateData.description = description;
    }

    if (price !== undefined) {
      updateData.price = Number(price);
    }

    if (category !== undefined) {
      updateData.category = category;
    }

    if (stock !== undefined) {
      updateData.stock = Number(stock);
    }

    if (material !== undefined) {
      updateData.material = material;
    }

    if (color !== undefined) {
      updateData.color = color;
    }

    if (dimensions !== undefined) {
      updateData.dimensions = dimensions;
    }

    // Update product
    const updatedProduct = await prisma.product.update({
      where: {
        id: id,
      },
      data: updateData,
    });

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product: updatedProduct,
    });

  } catch (error) {
    console.error("Update product error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}
export const deactivateProduct=async(req:Request,res:Response):Promise<void>=>{
  try {
    const id=req.params.id as string;

    const product=await prisma.product.findUnique({
      where:{
        id,
      }
    });
    if(!product){
      res.status(404).json({
        success:false,
        message:"product not found"
      })
      return;

    }
    const updateProduct=await prisma.product.update({
      where:{
        id,
      },
      data:{
        isActive:false
      }
    })
       res.status(200).json({
      success: true,
      message: "Product deactivated successfully",
      product: updateProduct,
    });
    
  } catch (error) {
     console.error("Deactivate product error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
    
  }

import type { NextFunction,Request,Response } from "express";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js"

interface JwtPayload{
    userId:string,
    role:string

}

export const protect=async(req:Request,res:Response,next:NextFunction):Promise<void>=>{
    try {
        const authHeader=req.headers.authorization;
        if(!authHeader||!authHeader.startsWith("Bearer ")){
            res.status(401).json({
                success:false,
                message:"Authorization token is required"
            });
            return;
        }
        const token=authHeader.split(" ")[1];
        if(!token){
             res.status(401).json({
                success:false,
                message:"Authorization token is required"
            })
            return
        }
        const jwtSecret=process.env.JWT_SECRET;
        if(!jwtSecret){
              throw new Error("JWT_SECRET is not defined");
            
        }
         const decoded=jwt.verify(token,jwtSecret) as JwtPayload;
          const user = await prisma.user.findUnique({
      where: {
        id: decoded.userId,
      },
    });
       if (!user) {
      res.status(401).json({
        success: false,
        message: "User not found",
      });
      return;
    }
    
    if (!user.isActive) {
      res.status(403).json({
        success: false,
        message: "Account is inactive",
      });
      return;
    }

    next();

    } catch (error) {
          res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
          
    }
}
export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}




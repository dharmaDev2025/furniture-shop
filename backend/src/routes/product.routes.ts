import { Router } from "express";

import { createProduct } from "../controllers/product.controller.js";

import { protect } from "../middlewares/auth.middleware.js";
import { adminOnly } from "../middlewares/admin.middleware.js";
import upload from "../middlewares/upload.middleware.js";

const router = Router();

router.post(
  "/",
  protect,
  adminOnly,
  upload.array("images", 5),
  createProduct
);

export default router;
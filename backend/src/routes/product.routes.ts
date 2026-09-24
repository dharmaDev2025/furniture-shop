import { Router } from "express";

import { createProduct,updateProduct,deactivateProduct,getAllProducts,getProductById } from "../controllers/product.controller.js";

import { protect } from "../middlewares/auth.middleware.js";
import { adminOnly } from "../middlewares/admin.middleware.js";
import upload from "../middlewares/upload.middleware.js";

const router = Router();
router.get(
  "/",
  protect,
  getAllProducts
);
router.get(
  "/:id",
  protect,
  getProductById
);

router.post(
  "/",
  protect,
  adminOnly,
  upload.array("images", 5),
  createProduct
);
router.patch(
  "/:id/deactivate",
  protect,
  adminOnly,
  deactivateProduct
);
router.put(
  "/:id",
  protect,
  adminOnly,
  updateProduct
);
export default router;
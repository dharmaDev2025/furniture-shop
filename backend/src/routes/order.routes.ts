import { Router } from "express";
import {
  placeOrder,
  getMyOrders,
  getAllOrders,
  getOrderByIdAdmin,updateOrderStatus,generateOrderBill
} from "../controllers/order.controller.js";

import { protect } from "../middlewares/auth.middleware.js";
import { adminOnly } from "../middlewares/admin.middleware.js";

const router = Router();

router.post("/", protect, placeOrder);
router.post(
  "/admin/:id/generate-bill",
  protect,
  adminOnly,
  generateOrderBill
);
router.get("/myorders", protect, getMyOrders);
router.get(
  "/admin/all",
  protect,
  adminOnly,
  getAllOrders
);

router.get(
  "/admin/:id",
  protect,
  adminOnly,
  getOrderByIdAdmin
);

router.patch(
  "/admin/:id/status",
  protect,
  adminOnly,
  updateOrderStatus
);

export default router;
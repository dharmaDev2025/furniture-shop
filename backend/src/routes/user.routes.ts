import { Router } from "express";
import { getProfile,updateProfile,updateAddress } from "../controllers/user.controller.js";
import { protect

 } from "../middlewares/auth.middleware.js";
 const router = Router();
 router.get("/profile", protect, getProfile);
 router.put("/profile", protect, updateProfile);
 router.put("/address", protect, updateAddress);
 export default router;
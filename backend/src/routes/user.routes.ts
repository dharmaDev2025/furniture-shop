import { Router } from "express";
import { getProfile,updateProfile } from "../controllers/user.controller.js";
import { protect

 } from "../middlewares/auth.middleware.js";
 const router = Router();
 router.get("/profile", protect, getProfile);
 router.put("/profile", protect, updateProfile);
 export default router;
import { Router } from "express";
import {
  registerUser,
  loginUser,googleLogin,verifyResetOtp,resendResetOtp,forgotPassword,resetPassword
} from "../controllers/auth.controller.js";

const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google", googleLogin);
router.post("/forgot-password", forgotPassword);

router.post("/resend-reset-otp", resendResetOtp);


router.post("/verify-reset-otp", verifyResetOtp);


router.post("/reset-password", resetPassword);

export default router;
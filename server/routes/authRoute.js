import express from "express";
import {
  getMe,
  login,
  logout,
  refresh,
  register,
} from "../controllers/authController.js";
import { protect } from "../middleware/protect.js";

export const authRouter = express.Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.get("/refresh", refresh);
authRouter.delete("/logout", logout);
authRouter.get("/getMe", protect, getMe);

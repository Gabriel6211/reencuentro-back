import express from "express";
import { loginUser, registerUser } from "../controllers/authController";

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user
 * Public endpoint - no authentication required
 */
router.post("/register", registerUser);

/**
 * POST /api/auth/login
 * Login a user
 * Public endpoint - no authentication required
 */
router.post("/login", loginUser);

export default router;

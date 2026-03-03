import "dotenv/config";
import jwt from "jsonwebtoken";
import { User } from "../models/userModel.js";

function createAccessToken(user) {
  return jwt.sign(
    {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" },
  );
}

function createRefreshToken(user) {
  return jwt.sign({ id: user._id }, process.env.REFRESH_ACCESS_TOKEN, {
    expiresIn: "7d",
  });
}

function sendRefreshToken(res, token) {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export async function register(req, res) {
  try {
    const { name, email, password } = req.body;
    const duplicate = await User.findOne({ email });
    if (duplicate)
      return res.status(400).json({
        success: false,
        message: "Email already in use.",
      });
    const user = await User.create({ name, emial, password });
    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    sendRefreshToken(res, refreshToken);
    return res.status(201).json({
      success: true,
      message: `${user.name} added to database`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

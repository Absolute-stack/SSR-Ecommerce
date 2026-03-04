import "dotenv/config";
import mongoose from "mongoose";

export async function connectDB() {
  try {
    const DB = process.env.DB;
    if (!DB) throw new Error("DB missing");
    await mongoose.connect(DB);
    console.log(`MongoDB connected Successfully`);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

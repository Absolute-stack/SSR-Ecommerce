import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      trim: true,
      type: String,
      required: true,
    },
    email: {
      trim: true,
      unique: true,
      type: String,
      lowercase: true,
      required: true,
    },
    password: {
      type: String,
      minLength: 8,
      select: false,
      required: true,
    },
    role: {
      type: String,
      enum: ["customer", "admin"],
      default: "admin",
    },
    refreshToken: {
      type: String,
      select: false,
    },
  },
  { timestamps: true },
);

userSchema.index({ createdAt: -1 });

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function (candidate) {
  return await bcrypt.compare(candidate, this.password);
};

export const User = mongoose.model("User", userSchema);

import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      trim: true,
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      trim: true,
      type: String,
      required: true,
    },
    sizes: {
      type: [{ type: String }],
      required: true,
    },
    images: {
      type: [{ type: String }],
      required: true,
    },
    stock: {
      type: Number,
      default: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

productSchema.index({ isActive: 1 });
productSchema.index({ category: 1, price: 1 });
productSchema.index({ createdAt: -1, _id: -1 });
productSchema.index({ name: "text", description: "text" });

export const Product = mongoose.model("Product", productSchema);

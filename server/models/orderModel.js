import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  name: String,
  image: String,
  price: Number,
  size: String,
  quantity: {
    type: Number,
    min: 1,
  },
});

const orderSchema = new mongoose.Schema(
  {
    customer: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      name: { type: String, required: true },
      email: { type: String, required: true },
    },
    items: [orderItemSchema],
    shippingAddress: {
      city: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
      country: { type: String, requried: true },
      fullname: { type: String, required: true },
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    deliveryStatus: {
      type: String,
      enum: ["processing", "shipped", "delivered", "cancelled"],
      default: "processing",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "cancelled", "refunded"],
      default: "pending",
    },
    paystackReference: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  { timestamps: true },
);

orderSchema.index({ "customer.email": 1, createdAt: -1 });
orderSchema.index({ "customer.userId": 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1, deliveryStatus: 1 });

export const Order = mongoose.model("Order", orderSchema);

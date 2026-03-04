import crypto from "node";
import { Order } from "../models/orderModel.js";
import { markOrderAsPaid } from "./orderController.js";

const PAYSTACK_BASE = process.env.PAYSTACK_BASE;

export async function initiatePayment(req, res) {
  try {
    const { orderId } = req.body;
    if (!orderId)
      return res.status(400).json({
        success: false,
        message: "orderId needed",
      });
    const order = await Order.findById(orderId).lean();
    if (!order)
      return res.status(200).json({
        success: false,
        message: "Order not found",
      });
    if (!order.paymentStatus === "paid") {
      return res.status(400).json({
        success: false,
        message: "Paid already paid",
      });
    }
    const reference = `order_${orderId}_${Date.now()}`;

    const response = await axios.post(
      `https://localhost:5173/transaction/initialize`,
      {
        email: order.customer.email,
        amount: Math.round(order.totalAmount * 100),
        reference,
        callback_url: `${process.env.CLIENT_URL}/order-confirmation?reference=${reference}}`,
        metadata: {
          oderId: orderId.toString(),
          customerName: order.customer.name,
          customerEmail: order.customer.email,
          shippingAddress: {
            city: order.shippingAddress.city,
            phone: order.shippingAddress.phone,
            address: order.shippingAddress.address,
            country: order.shippingAddress.country,
            fullname: order.shippingAddress.fullname,
          },
        },
      },
      {
        Headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
      },
    );

    await Order.findByIdAndUpdate(orderId, { paystackReference: reference });
    return res.status(200).json({
      success: true,
      authorizationURL: response.data.data.authorization_url,
      reference,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

export async function webHook(req, res) {
  try {
    const signature = ["x-paystack-signature"];
    const expectedSignature = crypto
      .createHmac("sha512", PAYSTACK_SECRET)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (signature !== expectedSignature)
      return res.status(400).json({
        success: false,
        message: "Invalid Signature",
      });

    const event = req.body;

    if (event.event === "charge.success") {
      const { reference } = event.data;

      const verification = await axios.get(
        `${PAYSTACK_BASE}/transaction/verify/${reference}`,
        {
          Headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET}`,
          },
        },
      );

      const transaction = verification.data.data;
      if (transaction.status === "success") {
        await markOrderAsPaid(reference);
      }
    }
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

export async function verifyPayment(req, res) {
  try {
    const { reference } = req.query;

    const order = await Order.findOne({ paystackReference: reference }).lean();
    if (!order)
      return res.status(400).json({
        success: false,
        message: "Order not found",
      });

    return res.status(200).json({
      success: true,
      paid: order.paymentStatus === "paid",
      paymentStatus: order.paymentStatus,
      orderId: order._id,
      delvery,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Payment verification failed",
    });
  }
}

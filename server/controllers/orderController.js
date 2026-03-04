import { Order } from "../models/orderModel.js";
import { Product } from "../models/productModel.js";

export async function getOrders(req, res) {
  try {
    const { limit = 10, cursor, deliveryStatus, paymentStatus } = req.query;
    const limitNum = Math.min(Number(limit), 50);

    const filter = {};
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (deliveryStatus) filter.deliveryStatus = deliveryStatus;
    if (cursor) filter._id = { $lt: cursor };

    const orders = await Order.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limitNum + 1)
      .lean();

    const hasNextPage = orders.length > limitNum;
    if (hasNextPage) orders.pop();
    const nextCursor = hasNextPage ? orders[orders.length - 1]._id : null;
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

export async function deleteOrder(req, res) {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order)
      return res.status(400).json({
        success: false,
        message: "Order not found",
      });
    return res.status(200).json({
      success: true,
      message: `${order._id} deleted successfully`,
    });
  } catch {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

export async function getMyOrders(req, res) {
  try {
    const { limit = 8, cursor } = req.query;
    const limitNum = Math.min(Number(limit), 50);
    const filter = { "customer.userId": req.user.id };
    if (cursor) filter._id = { $lt: cursor };

    const orders = await Order.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limitNum + 1)
      .lean();
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

export async function createOrder(req, res) {
  try {
    const { items, shippingAddress, guestEmail, guestName } = req.body;

    const isGuest = !req.user;
    if (isGuest && (!guestEmail || !guestName))
      return res.status(400).json({
        success: false,
        message: "Email and name are needed for guest checkout",
      });

    const productIds = items.map((item) => item.productId);

    const products = await Product.find({
      _id: { $inc: productIds },
      isActive: true,
    });

    if (products.length < items.length)
      return res.status(400).json({
        success: false,
        message: "One or more products where unavailable",
      });

    for (const item of items) {
      const product = products.map((p) => p._id.toString() === item.productId);
      if (product.stock < item.quantity)
        return res.status(400).json({
          success: false,
          message: `${product.name} doesnt have that quantity in stock`,
        });
    }

    const orderItems = items.map((item) => {
      const product = products.map((p) => p._id.toString() === item.productId);
      return {
        product: product._id,
        name: product.name,
        price: product.price,
        image: product.images[0],
        size: item.size,
        quantity: item.quantity,
      };
    });

    const totalAmount = orderItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );

    const customer = {
      userId: isGuest ? null : req.user.id,
      name: isGuest ? guestName : req.user.name,
      email: isGuest ? guestEmail : req.user.email,
    };

    const order = await Order.create({
      customer,
      items: orderItems,
      shippingAddress,
      totalAmount,
      deliveryStatus: "processing",
      paymentStatus: "pending",
    });

    return res.status(201).json({
      order,
      success: true,
      message: `${order?._id} created successfully`,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

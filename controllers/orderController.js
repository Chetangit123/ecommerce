const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const Errorhander = require("../utils/errorhander");
const catchAsyncErros = require("../middleware/catchAsyncErrors");

exports.newOrder = catchAsyncErros(async (req, res, next) => {
    const {
        shippingInfo,
        orderItems,
        paymentInfo,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
      } = req.body;
    
      const order = await Order.create({
        shippingInfo,
        orderItems,
        paymentInfo,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
        paidAt: Date.now(),
        user: req.user._id,
      });
  res.status(201).json({
    success: true,

    order,
  });
});

//get single order

exports.getSingleOrder = catchAsyncErros(async (req, res, next) => {
  const order = await Order.findById(req.params.id).populate(
    "user",
    "name email"
  );

  if (!order) {
    return next(new Errorhander("No order found with that id", 404));
  }

  res.status(200).json({
    success: true,
    order,
  });
});

//get Logged in user orders

exports.myOrders = catchAsyncErros(async (req, res, next) => {
  const orders = await Order.find({ user: req.user._id });

  res.status(200).json({
    success: true,
    orders,
  });
});

//getAll Orders for admin

exports.getAllOrders = catchAsyncErros(async (req, res, next) => {
  const orders = await Order.find();

  let totalAmount = 0;
  orders.forEach((order) => {
    totalAmount += order.totalPrice;
  });

  res.status(200).json({
    success: true,
    totalAmount,
    orders,
  });
});

//Update order Status --Admin

exports.updateOrder = catchAsyncErros(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new Errorhander("No order found with that id", 404));
  }

  if (order.orderStatus === "Delivered") {
    return next(new Errorhander("Order is already Delivered", 400));
  }

  order.orderItems.forEach(async (order) => {
    await updateStock(order.product, order.quantity);
  });

  order.orderStatus = req.body.status;

  if (req.body.status === "Delivered") {
    order.deliveredAt = Date.now();
  }

  await order.save({ validateBeofreSave: false });

  res.status(200).json({
    success: true,
  });


});

async function updateStock(id, quantity) {
    const product = await Product.findById(id);

    product.Stock -= quantity;

   product.save({ validateBeofreSave: false });
  }

//delete Orders for admin

exports.deleteOrder = catchAsyncErros(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new Errorhander("No order found with that id", 404));
  }

  await order.remove();

  res.status(200).json({
    success: true,
  });
});

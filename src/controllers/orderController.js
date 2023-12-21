const { auto_create_id_order } = require("../config/generateId");
const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
exports.createOrder = async (req, res) => {
  const userId = req.user.id;
  const { products, status, totalPrice, paymentInfo } = req.body;

  // Kiểm tra số lượng sản phẩm trong đơn hàng có đáp ứng đủ không
  products.forEach(async (element) => {
    const product = await Product.findOne({ id: element.productId });
    if (!product) {
      return res
        .status(404)
        .json({ message: `Không tìm thấy sản phẩm: ${product.name}` });
    }
    if (parseInt(product.available) < parseInt(element.quantity)) {
      return res.status(404).json({
        message: `Sản phẩm: ${product.name} không đủ số lượng! Hiện tại trong kho còn ${product.available}`,
      });
    }
  });
  const id = await auto_create_id_order();
  const order = new Order({
    id,
    userId,
    products,
    status,
    totalPrice,
    paymentInfo,
  });

  order
    .save()
    .then(async (result) => {
      const user = await User.findOne({ id: userId });
      console.log(user);
      user.cart.items = [];
      user
        .save()
        .then((success) => {
          products.forEach(async (element) => {
            const product = await Product.findOne({ id: element.productId });
            if (!product) {
              return res
                .status(404)
                .json({ message: `Không tìm thấy sản phẩm: ${product.name}` });
            }
            product.available =
              parseInt(product.available) - parseInt(element.quantity);
            product.available = product.available.toString();
            await product.save();
          });
          return res.status(200).json({
            message: "Create Successfully",
            data: { newOrder: order },
          });
        })
        .catch((err) =>
          res.status(500).json({ message: "Có lỗi xảy ra", err: err.message })
        );
    })
    .catch((err) =>
      res.status(500).json({ message: "Có lỗi xảy ra", err: err.message })
    );
};

exports.getAllOrder = async (req, res) => {
  try {
    let orders = await Order.find();
    console.log(orders);
    let ordersInfo = [];
    let order = {};
    for (var item of orders) {
      order = item;
      const user = await User.findOne({ id: item.userId });
      let userName = user.fullname ?? "Thông tin người dùng đã bị xóa!";
      let address = user.address ?? "Thông tin người dùng đã bị xóa!";
      ordersInfo.push({ order, userName, address });
      console.log(ordersInfo);
    }
    res
      .status(200)
      .json({ message: "Successfully!", data: { orders: ordersInfo } });
  } catch (err) {
    res.status(500).json({ message: "Có lỗi xảy ra", err: err });
  }
};

exports.getOrderByUserId = async (req, res) => {
  try {
    const userId = req.params.userId;
    const orders = await Order.find({ userId: userId });
    res.status(200).json({ message: "Successfully!", orders: orders });
  } catch (err) {
    res.status(500).json({ message: "Có lỗi xảy ra", err: err });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const id = req.params.id;
    const order = await Order.find({ id: id });
    res.status(200).json({ message: "Successfully!", order: order });
  } catch (err) {
    res.status(500).json({ message: "Có lỗi xảy ra", err: err });
  }
};

exports.updateStatusOrder = async (req, res) => {
  try {
    const { id, status } = req.body;
    const currentOrder = await Order.findOne({ id: id });
    if (currentOrder) {
      currentOrder.status = status || currentOrder.status;
      currentOrder.save();

      res.status(201).json({ message: "Successfully!", order: currentOrder });
    } else {
      res.status(404).json({
        message:
          "Update fail! The order cannot be found. Please review and ensure that it already exists.",
      });
    }
  } catch (err) {
    res.status(500).json({ message: "Có lỗi xảy ra", err: err });
  }
};

exports.analyzeDataAndReport = async (req, res) => {
  try {
    const listProduct = await Order.aggregate([
      {
        $unwind: "$products",
      },
      {
        $group: {
          _id: "$products.productId",
          totalQuantity: { $sum: "$products.quantity" },
          totalPrice: {
            $sum: { $multiply: ["$products.price", "$products.quantity"] },
          },
        },
      },
      {
        $lookup: {
          from: "products", // Tên của collection product
          localField: "_id",
          foreignField: "id",
          as: "productDetails",
        },
      },
      {
        $unwind: "$productDetails",
      },
      {
        $group: {
          _id: "$productDetails.category",
          totalRevenue: { $sum: "$totalPrice" },
        },
      },
    ]);
    return res.status(200).json({ data: listProduct });
  } catch (err) {
    res.status(500).json({ message: "Có lỗi xảy ra", err: err });
  }
};

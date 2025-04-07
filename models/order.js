const mongoose = require("mongoose");

// Định nghĩa cấu trúc của Order
const orderSchema = new mongoose.Schema({
  items: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" }, // Tham chiếu (_id) đến bảng Product
      quantity: Number, // Số lượng sản phẩm trong đơn hàng
    },
  ],
  user: {
    // Tham chiếu (_id) đến bảng User, khi dùng populate Mongoose sẽ thay _id bằng toàn bộ dữ liệu từ collection User
    _id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    email: String, // Lưu tên của người mua để tiện hiển thị
  },
});

module.exports = mongoose.model("Order", orderSchema);

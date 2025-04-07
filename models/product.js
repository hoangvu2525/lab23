const mongoose = require("mongoose"); // Import thư viện Mongoose để làm việc với MongoDB

// Định nghĩa cấu trúc cho products
const productSchema = new mongoose.Schema({
  title: String, 
  price: Number, 
  description: String, 
  imageUrl: String, 

  // Tham chiếu (_id) đến bảng User, khi dùng populate Mongoose sẽ thay _id bằng toàn bộ dữ liệu từ collection User
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }

});

module.exports = mongoose.model("Product", productSchema);


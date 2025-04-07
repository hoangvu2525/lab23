const Product = require("../models/product");
const fs = require("fs");
const path = require("path");

// Lấy danh sách sản phẩm
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find(); // Lấy tất cả sản phẩm trong database
    res.json(products); // Trả về danh sách sản phẩm dưới dạng JSON
  } catch (error) {
    console.error("Lỗi khi lấy danh sách sản phẩm:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Lấy thông tin sản phẩm cần chỉnh sửa
exports.getEditProduct = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id }); // Tìm sản phẩm theo ID
    if (!product) {
      return res.status(404).json({ message: "Sản phẩm không tồn tại" });
    }
    res.json(product); // Trả về thông tin sản phẩm nếu tìm thấy
  } catch (error) {
    console.error("Lỗi khi lấy sản phẩm:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Thêm sản phẩm mới
exports.postAddProduct = async (req, res) => {
  try {
    const { title, price, description, imageUrl } = req.body; // Lấy dữ liệu từ request body
    const product = new Product({ title, price, description, imageUrl }); // Tạo một sản phẩm mới
    await product.save(); // Lưu sản phẩm vào database
    res.status(201).json({ message: "Thêm sản phẩm thành công", product }); // Trả về thông báo thành công
  } catch (error) {
    console.error("Lỗi khi thêm sản phẩm:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Xóa sản phẩm theo ID
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({ _id: req.params.id }); // Tìm và xóa sản phẩm theo ID
    if (!product) {
      return res.status(404).json({ message: "Sản phẩm không tồn tại" });
    }

    // Xóa ảnh nếu có
    if (product.imageUrl) {
      const imagePath = path.join(__dirname, "..", product.imageUrl);
      fs.unlink(imagePath, (err) => {
        if (err) {
          console.error("Lỗi khi xóa ảnh:", err);
        }
      });
    }

    res.json({ message: "Xóa sản phẩm thành công" }); // Trả về thông báo thành công
  } catch (error) {
    console.error("Lỗi khi xóa sản phẩm:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

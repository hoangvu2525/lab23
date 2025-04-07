const express = require("express");
const adminController = require("../controllers/adminController");
const isAuth = require("../middleware/isAuthenticated");

const router = express.Router();

router.get("/products", adminController.getProducts); // Lấy danh sách sản phẩm
router.get("/edit-product/:id", isAuth, adminController.getEditProduct); // Lấy thông tin sản phẩm cần chỉnh sửa
router.post("/add-product", isAuth, adminController.postAddProduct); //  Thêm sản phẩm mới
router.delete("/delete-product/:id", isAuth, adminController.deleteProduct); // Xóa sản phẩm theo ID

module.exports = router;

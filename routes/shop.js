const express = require("express");
const router = express.Router();
const shopController = require("../controllers/shopController");
const isAuth = require("../middleware/isAuthenticated");

router.get("/", shopController.getProducts); // Lấy danh sách tất cả sản phẩm
router.post("/add-product", isAuth, shopController.postAddProduct); // Thêm sản phẩm mới
router.post("/add-to-cart", isAuth, shopController.postAddToCart); // Thêm sản phẩm vào giỏ hàng
router.get("/cart", isAuth, shopController.getCart); // Lấy giỏ hàng
router.post("/cart-delete-item", isAuth, shopController.postCartDeleteProduct); // Xóa sản phẩm khỏi giỏ hàng
router.delete("/delete-product/:id", isAuth, shopController.deleteProduct); // Xóa sản phẩm theo ID
router.put("/product/:id", isAuth, shopController.updateProduct); // Cập nhật sản phẩm theo ID
router.get("/product/:id", isAuth, shopController.getProductById); // Lấy chi tiết sản phẩm
router.get("/orders", isAuth, shopController.getOrders); // Lấy danh sách đơn hàng
router.post("/orders", isAuth, shopController.postOrder); // Tạo đơn hàng
router.get("/orders/:invoiceId", isAuth, shopController.getInvoice);
module.exports = router;

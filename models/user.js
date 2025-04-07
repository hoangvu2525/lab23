const mongoose = require("mongoose");

// Định nghĩa cấu trúc cho users
const userSchema = new mongoose.Schema({
  email: String,
  password: String,

  cart: {
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        quantity: Number,
      },
    ],
  },
});

// Thêm sản phẩm vào giỏ hàng
userSchema.methods.addToCart = function (product) {
  const cartProductIndex = this.cart.items.findIndex(
    (cp) => cp.product.toString() === product._id.toString()
  );
  let newQuantity = 1;
  const updatedCartItems = [...this.cart.items];

  if (cartProductIndex >= 0) {
    newQuantity = this.cart.items[cartProductIndex].quantity + 1;
    updatedCartItems[cartProductIndex].quantity = newQuantity;
  } else {
    updatedCartItems.push({ product: product._id, quantity: newQuantity });
  }

  this.cart.items = updatedCartItems;
  return this.save();
};

// Xóa sản phẩm khỏi giỏ hàng
userSchema.methods.deleteItemFromCart = function (productId) {
  this.cart.items = this.cart.items.filter(
    (item) => item.product.toString() !== productId.toString()
  );
  return this.save();
};

module.exports = mongoose.model("User", userSchema);

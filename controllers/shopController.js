const Product = require("../models/product");
const Order = require("../models/order");
const { validationResult, body } = require("express-validator");
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
// Hàm kiểm tra lỗi chung
const productErrors = (req) => {
  return [
    body("title")
      .isLength({ min: 3 })
      .withMessage("Title phải có ít nhất 3 ký tự")
      .matches(/^[a-zA-Z0-9 À-ỹ]+$/)
      .withMessage("Title chỉ được chứa chữ và số, không có ký tự đặc biệt"),
    // body("imageUrl").isURL().withMessage("URL hình ảnh không hợp lệ"),
    body("price").isFloat().withMessage("Giá phải là một số thực"),
    body("description")
      .isLength({ min: 5 })
      .withMessage("Description phải có ít nhất 5 ký tự"),
  ];
};

// Lấy danh sách tất cả sản phẩm
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find(); // Lấy tất cả sản phẩm từ database
    res.json(products); // Trả về danh sách sản phẩm dưới dạng JSON
  } catch (error) {
    console.error("Lỗi khi lấy danh sách sản phẩm:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Thêm sản phẩm mới
exports.postAddProduct = async (req, res) => {
  await Promise.all(
    productErrors(req).map((validation) => validation.run(req))
  ); // Chạy kiểm tra lỗi
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // console.log(errors.array({ onlyFirstError: false }));
    // Xóa file đã upload nếu có lỗi
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Lỗi khi xóa file tạm:", err);
      });
    }
    return res.status(400).json({
      success: false,
      errors: errors.array({ onlyFirstError: false }),
    });
  }

  const { title, price, description } = req.body;
  const imageUrl = req.file ? req.file.path.replace(/\\/g, "/") : null; // Chuyển đổi đường dẫn cho phù hợp

  if (!imageUrl) {
    return res.status(400).json({
      success: false,
      errors: [{ msg: "Vui lòng tải lên một hình ảnh hợp lệ" }],
    });
  }

  try {
    const newProduct = new Product({
      title,
      imageUrl,
      price,
      description,
    });
    await newProduct.save();
    res.status(201).json({ success: true, message: "Sản phẩm đã được thêm!" });
  } catch (error) {
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Lỗi khi xóa file tạm:", err);
      });
    }
    res.status(500).json({ success: false, message: "Lỗi máy chủ", error });
  }
};

// Cập nhật sản phẩm theo ID
exports.updateProduct = async (req, res) => {
  await Promise.all(
    productErrors(req).map((validation) => validation.run(req))
  ); // Chạy kiểm tra lỗi
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Lỗi khi xóa file tạm:", err);
      });
    }

    return res.status(400).json({
      success: false,
      errors: errors.array({ onlyFirstError: false }),
    });
  }

  const { id } = req.params;
  const { title, price, description } = req.body;
  const imageUrl = req.file ? req.file.path.replace(/\\/g, "/") : undefined;

  try {
    const product = await Product.findById(id);
    if (!product) {
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error("Lỗi khi xóa file tạm:", err);
        });
      }
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy sản phẩm" });
    }

    product.title = title;
    if (imageUrl) {
      // Xóa ảnh cũ nếu có
      if (product.imageUrl) {
        const oldImagePath = path.join(__dirname, "..", product.imageUrl);
        fs.unlink(oldImagePath, (err) => {
          if (err) console.error("Lỗi khi xóa ảnh cũ:", err);
        });
      }
      product.imageUrl = imageUrl;
    }
    product.price = price;
    product.description = description;
    await product.save();

    res
      .status(200)
      .json({ success: true, message: "Sản phẩm đã được cập nhật!" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi máy chủ", error });
  }
};

// Thêm sản phẩm vào giỏ hàng của user
exports.postAddToCart = async (req, res, next) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      const error = new Error();
      error.status = 400;
      return next(error);
    }

    const product = await Product.findOne({ _id: productId }); // Tìm sản phẩm theo ID
    if (!product) {
      const error = new Error();
      error.status = 404;
      return next(error);
    }

    await req.user.addToCart(product); // Thêm sản phẩm vào giỏ hàng của user
    res.status(200).json({ message: "Sản phẩm đã thêm vào giỏ hàng" });
  } catch (error) {
    return next(error);
  }
};

// Lấy giỏ hàng của user
exports.getCart = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Không tìm thấy user" });
    }

    const userWithCart = await req.user.populate("cart.items"); // Lấy thông tin sản phẩm trong giỏ hàng
    const cartProducts = userWithCart.cart.items.map((item) => ({
      _id: item.product._id,
      quantity: item.quantity,
      product: item.product,
    }));

    res.json({ products: cartProducts }); // Trả về danh sách sản phẩm trong giỏ hàng
  } catch (error) {
    console.error("Lỗi khi lấy giỏ hàng:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Xóa sản phẩm khỏi giỏ hàng
exports.postCartDeleteProduct = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Không tìm thấy user" });
    }

    const { productId } = req.body; // Nhận ID sản phẩm cần xóa
    await req.user.deleteItemFromCart(productId); // Xóa sản phẩm khỏi giỏ hàng

    res.status(200).json({ message: "Xóa sản phẩm khỏi giỏ hàng thành công" });
  } catch (error) {
    console.error("Lỗi khi xóa sản phẩm khỏi giỏ hàng:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Xóa sản phẩm theo ID
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({ _id: req.params.id }); // Tìm và xóa sản phẩm
    if (!product) {
      return res.status(404).json({ message: "Sản phẩm không tồn tại" });
    }
    res.json({ message: "Xóa sản phẩm thành công" });
  } catch (error) {
    console.error("Lỗi khi xóa sản phẩm:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Lấy thông tin sản phẩm theo ID
exports.getProductById = async (req, res) => {
  try {
    // Tìm sản phẩm trong database bằng _id được truyền từ request params
    const product = await Product.findOne({ _id: req.params.id });

    if (!product) {
      return res.status(404).json({ message: "Sản phẩm không tồn tại" });
    }

    // Trả về thông tin sản phẩm dưới dạng JSON
    res.json(product);
  } catch (error) {
    // Bắt lỗi trong quá trình truy vấn database và trả về lỗi 500
    console.error("Lỗi khi lấy sản phẩm:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Lấy danh sách đơn hàng của user
exports.getOrders = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Không tìm thấy user" });
    }

    const orders = await Order.find({ "user._id": req.user._id }); // Lấy danh sách đơn hàng kèm sản phẩm

    res.json(orders);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách đơn hàng:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Tạo đơn hàng mới
exports.postOrder = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Không tìm thấy user" });
    }

    await req.user.populate("cart.items.product"); // Lấy giỏ hàng của user

    const order = new Order({
      items: req.user.cart.items.map((item) => ({
        product: {
          _id: item.product._id,
          title: item.product.title,
          price: item.product.price,
        },
        quantity: item.quantity,
      })),
      user: { _id: req.user._id, email: req.user.email },
    });

    await order.save(); // Lưu đơn hàng vào database
    req.user.cart.items = []; // Xóa giỏ hàng sau khi đặt hàng
    await req.user.save();

    res.status(201).json({ message: "Tạo đơn hàng thành công", order });
  } catch (error) {
    console.error("Lỗi khi tạo đơn hàng:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

exports.getInvoice = (req, res, next) => {
  console.log('check params',req.params )
  const orderId = req.params.invoiceId;
  
   Order.findById(orderId).populate({
    path: 'items.product',
    model: 'Product'
  }).then(order => {
    if(!order){
      return next(new Error('No order found'))
    }
    console.log('check order: ', order)
    if(order.user._id.toString() !==  req.user._id.toString()){
      return next(new Error('Unauthorized'))
    }
    
  const invoiceName = 'invoice-' + orderId + '.pdf';
  const invoicePath = path.join('data', 'invoices', invoiceName)
  
  const pdfDoc = new PDFDocument()
  res.setHeader("Content-Type", "application/pdf ")
  res.setHeader("Content-Disposition", 'inline; filename="' + invoiceName + '"')
  pdfDoc.pipe(fs.createWriteStream(invoicePath));
  pdfDoc.pipe(res);
  pdfDoc.fontSize(26).text('Invoice', {underline: true});
  pdfDoc.text('------------------------------');
  let totalPrice = 0;
order.items.forEach(prod => {
  console.log(prod)
  totalPrice = totalPrice + prod.quantity * prod.product.price;
  pdfDoc.fontSize(14).text(prod.product.title + ' - '  + prod.quantity + ' x ' + prod.product.price )
});
pdfDoc.text('-----');

pdfDoc.fontSize(20).text("Total Price: $" + totalPrice);
  pdfDoc.end()
  
  const file = fs.createReadStream(invoicePath);
  
  file.pipe(res)
   }).catch(err => next (err))

}  
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const { validationResult } = require("express-validator");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "tranhoangvu2525@gmail.com", // Thay bằng Gmail của bạn
    pass: "ygqf xuvb lxlt hmqv", // Thay bằng App Password hoặc mật khẩu Gmail
  },
});

exports.checkSession = (req, res) => {
  if (req.session.user) {
    res.json({ isLoggedIn: true, user: req.session.user });
  } else {
    res.json({ isLoggedIn: false });
  }
};

exports.getLogin = (req, res, next) => {
  console.log(req.session.isLoggedIn);
  res.status(200).json({
    isAuthenticated: req.session.isLoggedIn || false,
    user: req.session.user || null,
  });
};

exports.postLogin = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0].msg; // Lấy thông báo lỗi đầu tiên
    return res.status(422).json({
      message: firstError, // Trả về thông báo lỗi cụ thể
      errors: errors.array(),
    });
  }

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Email chưa được đăng ký" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Mật khẩu không chính xác" });
    }

    req.session.isLoggedIn = true;
    req.session.user = user;
    req.session.save((err) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ message: "Lỗi server" });
      }
      res.status(200).json({ message: "Đăng nhập thành công", user });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ message: "Lỗi server" });
    }
    res.clearCookie("connect.sid"); // Xóa cookie session
    res.status(200).json({ message: "Đăng xuất thành công" });
  });
};

exports.postSignUp = async (req, res, next) => {
  const { email, password, confirmPassword } = req.body;

  // Kiểm tra validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(422)
      .json({ message: "Dữ liệu không hợp lệ", errors: errors.array() });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({
      email: email,
      password: hashedPassword,
      cart: { items: [] },
    });

    await user.save();

    await req.session.save();

    // Gửi email thông báo đăng ký thành công
    const mailOptions = {
      from: "tranhoangvu2525@gmail.com",
      to: email,
      subject: "Chào mừng bạn đến với hệ thống của chúng tôi!",
      text: `Xin chào ${email},\n\nCảm ơn bạn đã đăng ký tài khoản. Bây giờ bạn có thể đăng nhập và sử dụng dịch vụ của chúng tôi.\n\nTrân trọng!`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Lỗi gửi email:", error);
      } else {
        console.log("Email đã gửi:", info.response);
      }
    });

    res.status(201).json({
      message: "Đăng ký thành công",
      user: {
        email: user.email,
        _id: user._id,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

const express = require("express");
const router = express.Router();
const User = require("../models/user");
const authController = require("../controllers/authController");
const { check, body } = require("express-validator");

router.get("/login", authController.getLogin);
router.post(
  "/login",

  [
    check("email")
      .notEmpty()
      .withMessage("Email không được để trống")
      .isEmail()
      .withMessage("Email không hợp lệ")
      .custom(async (value) => {
        const user = await User.findOne({ email: value });
        if (!user) {
          throw new Error("Email chưa được đăng ký");
        }
      }),
    check("password").notEmpty().withMessage("Mật khẩu không được để trống"),
  ],

  authController.postLogin
);
router.post("/logout", authController.postLogout);
router.get("/check-session", authController.checkSession);
router.post(
  "/signup",

  [
    check("email")
      .isEmail()
      .withMessage("Email không hợp lệ")
      .custom(async (value) => {
        const existingUser = await User.findOne({ email: value });
        if (existingUser) {
          throw new Error("Email đã tồn tại");
        }
      }),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Mật khẩu phải có ít nhất 8 ký tự"),
    body("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Mật khẩu xác nhận không khớp");
      }
      return true;
    }),
  ],

  authController.postSignUp
);

module.exports = router;

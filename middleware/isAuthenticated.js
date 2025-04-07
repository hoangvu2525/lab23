const tokens = require("csrf")();
const isAuth = (req, res, next) => {
  // Kiểm tra đăng nhập
  if (!req.session.user) {
    return res.status(401).json({
      message: "Bạn cần đăng nhập để thực hiện thao tác này",
    });
  }

  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    const csrfToken = req.headers["x-csrf-token"];

    if (!csrfToken || !tokens.verify(req.session.csrfSecret, csrfToken)) {
      return res.status(403).json({
        message: "Token bảo mật không hợp lệ (CSRF check failed)",
      });
    }
  }

  next();
};

module.exports = isAuth;

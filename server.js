const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const User = require("./models/user");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const csrf = require("csrf");
const multer = require("multer");
const path = require("path");
require("dotenv").config();

// Import các routes
const shopRoutes = require("./routes/shop");
const adminRoutes = require("./routes/admin");
const authRoutes = require("./routes/auth");
const errorHandler = require("./middleware/errorHandler");

const MOGODB_URI = process.env.MONGO_URL;

const corsOptions = {
  origin: process.env.CLIENT_URL, // Chỉ cho phép request từ origin này
  credentials: true, // Cho phép gửi credentials (cookies, session)
};

const app = express();
const store = new MongoDBStore({
  uri: MOGODB_URI,
  collection: "session",
});

// Khởi tạo CSRF tokens
const tokens = new csrf();

// Đảm bảo thư mục `images/` tồn tại

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      new Date().toISOString().replace(/[:.]/g, "-") + "-" + file.originalname
    );
  },
});
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/webp"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
);

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: "my secret",
    resave: false,
    saveUninitialized: false,
    store: store,
    cookie: {
      httpOnly: true,
      secure: false, // Đặt thành true nếu sử dụng HTTPS
    },
  })
);

// Middleware gán user từ session nếu có
app.use((req, res, next) => {
  if (!req.session.csrfSecret) {
    req.session.csrfSecret = tokens.secretSync();
  }
  next();
});

// Middleware gán user từ session nếu có
app.use(async (req, res, next) => {
  if (req.session.user) {
    try {
      const user = await User.findById(req.session.user._id);
      if (user) {
        req.user = user;
      }
    } catch (err) {
      console.error("Lỗi khi tìm user từ session:", err);
    }
  }
  next();
});

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = tokens.create(req.session.csrfSecret); // Sửa cách tạo CSRF token
  next();
});

// Thêm route để lấy CSRF token (phần thêm mới)
app.get("/csrf-token", (req, res) => {
  res.json({ csrfToken: tokens.create(req.session.csrfSecret) });
});

app.use("/images", express.static(path.join(__dirname, "images")));

// Sử dụng các routes
app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use((req, res, next) => {
  res.status(404).json({ message: "Không tìm thấy trang!" });
});

// Middleware xử lý lỗi
app.use(errorHandler);

// Kết nối tới MongoDB bằng Mongoose
mongoose
  .connect(MOGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB!");
    app.listen(process.env.PORT, () => {
      console.log("Server đang chạy trên cổng 5000");
    });
  })
  .catch((err) => {
    console.error("Lỗi kết nối MongoDB:", err);
  });

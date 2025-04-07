const errorHandler = (err, req, res, next) => {
  console.error(err); // Log lỗi để debug

  const statusCode = err.status || 500; // Mặc định 500 nếu không có status
  res.sendStatus(statusCode); // Chỉ trả về status code, không có JSON response
};

module.exports = errorHandler;

// const { MongoClient } = require("mongodb");

// let _db;

// const mongoConnect = (callback) => {
//   MongoClient.connect(
//     "mongodb+srv://tranhoangvu2525:123123123@cluster0.ehigq.mongodb.net/shop?retryWrites=true&w=majority&appName=Cluster0"
//   )
//     .then((client) => {
//       console.log("Connected to MongoDB!");
//       _db = client.db("shop");
//       callback();
//     })
//     .catch((err) => {
//       console.log("Lỗi kết nối MongoDB:", err);
//       throw err;
//     });
// };

// const getDb = () => {
//   if (_db) {
//     return _db;
//   }
//   throw "Không tìm thấy Database!";
// };

// module.exports = {
//   mongoConnect,
//   getDb,
// };

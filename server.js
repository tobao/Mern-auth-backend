require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const userRoute = require('./routes/userRoute')
const errorHandler = require('./middleware/errorMiddleware')

const app = express()

//Middlewares
app.use(express.json())
app.use(express.urlencoded({extended:false}))
app.use(cookieParser())
app.use(bodyParser.json())
app.use(
  cors({
    origin:['http://localhost:3000','https://btn-authz.vercel.app'],
    credentials:true
  })
)
/*
  1. app.use(express.json())
    Middleware này được sử dụng để phân tích (parse) các yêu cầu với định dạng JSON. Nó sẽ biến đổi phần thân của yêu cầu (request body) thành một đối tượng JavaScript và gán đối tượng này cho req.body.

    Mục đích: Cho phép ứng dụng xử lý dữ liệu JSON trong các yêu cầu HTTP, thường được sử dụng khi bạn gửi dữ liệu JSON từ phía client đến server.
  
  2. app.use(express.urlencoded({extended: false}))
    Middleware này được sử dụng để phân tích (parse) các yêu cầu có dữ liệu từ các form HTML (application/x-www-form-urlencoded). Nếu extended được đặt là false, thì chỉ các chuỗi và mảng đơn giản có thể được phân tích. Nếu extended là true, thì các đối tượng phức tạp và nested có thể được phân tích.

    Mục đích: Cho phép ứng dụng xử lý dữ liệu được gửi từ các form HTML.
  
  3. app.use(cookieParser())
    Middleware này được sử dụng để phân tích (parse) cookie trong các yêu cầu HTTP. Nó sẽ thêm thuộc tính cookies vào đối tượng yêu cầu (req.cookies), chứa các cookie được gửi từ client.

    Mục đích: Cho phép ứng dụng truy cập và xử lý cookie được gửi từ client.
  
  4. app.use(bodyParser.json())
    Middleware này tương tự như express.json(), được sử dụng để phân tích các yêu cầu với định dạng JSON. Mặc dù bodyParser là một thư viện tách biệt trước đây, nhưng hiện nay các chức năng của nó đã được tích hợp trực tiếp vào Express.

    Mục đích: Đảm bảo ứng dụng có thể xử lý dữ liệu JSON trong các yêu cầu HTTP, mặc dù với các phiên bản mới hơn của Express, express.json() có thể được sử dụng thay thế cho bodyParser.json().
  
  5. app.use(cors({ origin: ['http://localhost:3000', 'https://authz-app.vercel.app'], credentials: true }))
    Middleware này được sử dụng để cho phép Cross-Origin Resource Sharing (CORS). Nó cho phép ứng dụng của bạn chấp nhận các yêu cầu từ các domain khác (khác nguồn gốc).

    origin: Chỉ định các domain được phép gửi yêu cầu đến server của bạn. Trong trường hợp này, chỉ các yêu cầu từ http://localhost:3000 và https://authz-app.vercel.app mới được chấp nhận.

    credentials: Khi được đặt là true, điều này cho phép gửi cookie và các thông tin xác thực khác cùng với các yêu cầu cross-origin.

    Mục đích: Cho phép các yêu cầu từ các nguồn gốc khác (cross-origin) được xử lý bởi server của bạn, đặc biệt quan trọng khi bạn có một ứng dụng frontend và backend chạy trên các domain khác nhau.

Tổng kết
Các middleware này giúp ứng dụng Express của bạn xử lý và quản lý dữ liệu yêu cầu một cách hiệu quả, từ việc phân tích dữ liệu JSON và dữ liệu từ form HTML, đến việc quản lý cookie và cho phép các yêu cầu cross-origin. Chúng giúp chuẩn bị dữ liệu để các route handler trong ứng dụng có thể xử lý yêu cầu một cách dễ dàng và chính xác.
*/

//Routes
app.use("/api/users", userRoute)
//Sử dụng app.use("/api/users", userRoute) để gắn các tuyến đường từ userRoute vào dưới đường dẫn /api/users.

app.get("/", (req, res) => {
  res.send("Home Page");
})

//Error Handler
app.use(errorHandler)

const PORT = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on ${PORT}`);
    });
  })
  .catch((err) => console.log(err));
const asyncHandler = require('express-async-handler') //một thư viện giúp xử lý các hàm middleware bất đồng bộ trong Express mà không cần viết nhiều khối try-catch. Nó tự động bắt lỗi và chuyển tiếp chúng đến bộ xử lý lỗi của Express.
const User = require('../models/userModel')           //mô hình (model) người dùng được định nghĩa trong MongoDB/Mongoose. Nó cho phép truy cập và thao tác với các tài liệu (document) người dùng trong cơ sở dữ liệu.
const jwt = require('jsonwebtoken')                   //Được sử dụng để tạo và xác thực các JSON Web Token (JWT), thường dùng trong việc xác thực và ủy quyền người dùng.

const protect = asyncHandler (async (req,res,next) =>{
  try {
    const token = req.cookies.token|| req.headers.authorization?.split(' ')[1];
    //Token được lấy từ cookie của yêu cầu (request)
    if(!token){
      res.status(401)
      throw new Error('Invalid email or password')
    }

    //Verify token
    const verified = jwt.verify(token,process.env.JWT_SECRET) //jwt.verify để xác thực token với khóa bí mật (JWT_SECRET). Nếu token hợp lệ, nó sẽ trả về đối tượng đã giải mã (decoded object).
    //Get user id from token
    const user = await User.findById(verified.id)
    .select('-password')
      /*Từ đối tượng đã giải mã, lấy ID người dùng và tìm người dùng trong cơ sở dữ liệu bằng User.findById. 
      Đồng thời cũng loại bỏ trường mật khẩu (-password) khỏi kết quả trả về. */

    if(!user){
      res.status(404)
      throw new Error('User not found')
    }
    if(user.role==='suspended'){
      res.status(400)
      throw new Error('User suspended, please contract support')
    }

    req.user = user
    next()
    //Lưu thông tin người dùng vào thuộc tính user của đối tượng req để các middleware và route handler khác có thể truy cập. Sau đó gọi hàm next() để tiếp tục xử lý yêu cầu.
  } catch (error) {
    res.status(401)
    throw new Error('Not Authorized. Please login')
  }
})

const adminOnly =  asyncHandler (async (req,res,next) =>{
  if(req.user && req.user.role ==='admin'){
    next()
  }
  else{
    res.status(401)
    throw new Error('Not Authorized as an admin')
  }
})

const authorOnly = asyncHandler (async (req,res,next) =>{
  if(req.user.role ==='author' || req.user.role ==='admin'){
    next()
  }
  else{
    res.status(401)
    throw new Error('Not Authorized as an author')
  }
})

const verifiedOnly = asyncHandler(async (req,res,next) =>{
  if(req.user|| req.user.isVerified){
    next()
  }
  else{
    res.status(401)
    throw new Error('Not Authorized, account not verified')
  }
})

module.exports = {
  protect,
  verifiedOnly,
  authorOnly,
  adminOnly,
}
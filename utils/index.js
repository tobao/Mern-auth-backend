const jwt = require('jsonwebtoken')
//Thư viện jsonwebtoken là thư viện phổ biến để tạo và xác minh JSON Web Tokens (JWT).
//Được sử dụng để mã hóa và giải mã các token JWT.
const crypto = require('crypto')

const generateToken = (id) => {
  return jwt.sign({id}, process.env.JWT_SECRET, {expiresIn:'1d'} )
}
/*
  'generateToken' - sử dụng cú pháp arrow function. Hàm này nhận một tham số id.
  ==>Mục đích: Hàm generateToken sẽ được sử dụng để tạo ra một JWT dựa trên id của người dùng.
  Va trả về kết quả của hàm jwt.sign(). Hàm sign() có ba tham số:
    Payload: {id} - đây là đối tượng chứa dữ liệu mà bạn muốn mã hóa trong token. Ở đây, nó chỉ chứa id của người dùng.
    Secret: process.env.JWT_SECRET - đây là chuỗi bí mật được sử dụng để mã hóa và giải mã token. Giá trị này được lấy từ biến môi trường (.env).
    Options: {expiresIn: '1d'} - đây là đối tượng chứa các tùy chọn cho token. Ở đây, tùy chọn expiresIn: '1d' chỉ định rằng token sẽ hết hạn sau 1 ngày (1 day). Có thể thay thế thành các đơn vị thời gian khác như '20h' tức là 20 giờ , '60' là 60 giây
    ==>Mục đích: Tạo một JWT có chứa id của người dùng và có thời hạn sử dụng là 1 ngày. JWT này sẽ được mã hóa bằng chuỗi bí mật được lưu trong biến môi trường.
*/

//Hash Token
const hashToken = (token) => {
  return crypto.createHash("sha256").update(token.toString()).digest("hex")
}

/*
  * Hàm hashToken nhận vào một tham số 'token'. Hàm này trả về một chuỗi đã được mã hóa.
  * crypto.createHash("sha256")
      createHash là một phương thức của module crypto trong Node.js, dùng để tạo một đối tượng Hash.
      "sha256" là thuật toán băm được sử dụng, trong trường hợp này là SHA-256 (Secure Hash Algorithm 256-bit).
  * .update(token.toString())
      update là phương thức của đối tượng Hash, dùng để cập nhật dữ liệu cần băm.
      token.toString() chuyển đổi token thành chuỗi trước khi cập nhật vào đối tượng
  * .digest("hex"):
      digest là phương thức của đối tượng Hash, dùng để hoàn tất quá trình băm và trả về giá trị băm.
      "hex" chỉ định rằng giá trị băm trả về sẽ được mã hóa thành chuỗi thập lục phân (hexadecimal).
  * Tổng Quan Về Quy Trình
      Bước 1: Khởi tạo thuật toán băm SHA-256.
      Bước 2: Cập nhật dữ liệu cần băm (ở đây là token đã được chuyển thành chuỗi).
      Bước 3: Hoàn tất quá trình băm và trả về giá trị băm dưới dạng chuỗi thập lục phân.
*/

module.exports = {
  generateToken,
  hashToken,
}
/* Lưu ý khi định nghĩa JWT_SECRET:
  Độ dài và độ phức tạp: Chuỗi bí mật nên dài và phức tạp để tránh việc bị đoán hoặc tấn công brute force. Một chuỗi bí mật mạnh thường có độ dài ít nhất 32 ký tự và bao gồm cả chữ cái viết hoa, chữ cái viết thường, chữ số và ký tự đặc biệt.
  Bảo mật: Chuỗi bí mật này nên được giữ kín và không nên được lưu trữ trực tiếp trong mã nguồn. Thay vào đó, bạn nên lưu trữ nó trong biến môi trường (.env) hoặc một kho lưu trữ bí mật an toàn khác.
  Tính duy nhất: Mỗi ứng dụng nên có chuỗi bí mật riêng của mình để đảm bảo rằng token từ ứng dụng này không thể được giải mã bởi ứng dụng khác.
*/
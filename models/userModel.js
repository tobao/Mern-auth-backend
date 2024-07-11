const mongoose = require("mongoose")
const bcrypt = require('bcryptjs')

const userSchema =  mongoose.Schema(
  {
    name:{
      type:String,
      required: [true, 'Please add a name'] //Bắt buộc phải có trường này
    },
    email:{
      type:String,
      required: [true, 'Please add an email'],
      unique:true, //Giá trị email phải là duy nhất trong cơ sở dữ liệu.
      trim: true, //Xóa khoảng trắng ở đầu và cuối của chuỗi.
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        "Please enter a valid emaial",
      ] //Sử dụng biểu thức chính quy (regex) để kiểm tra định dạng email
    },
    password:{
      type:String,
      required: [true, 'Please add a password']
    },
    photo:{
      type:String,
      required: [true, 'Please add a photo'],
      default:'https://raw.githubusercontent.com/zinotrust/auth-app-styles/master/assets/avatarr.png' //Giá trị mặc định là URL ảnh đại diện.
    },
    phone:{
      type:String,
      default:'(+84)'
    },
    bio:{
      type:String,
      default:'bio'
    },
    role:{
      type:String,
      required:true,
      default:'subscriber'
      // subcribber, author, admin (subpended)

    },
    isVerified:{
      type:Boolean,
      default:false
    },
    userAgent:{
      type:Array,
      required:true,
      default:[]
    },
  },
  {
    timestamps:true, //Tự động thêm các trường createdAt và updatedAt vào mỗi document.
    minimize:false //Lưu tất cả các trường, kể cả các trường trống.
  }
)
//Encrypt password before saving to DB
userSchema.pre('save',async function(next){
  if(!this.isModified('password')){
    return next()
  }
  //Hash password
  const salt = await bcrypt.genSalt(10)
  const hashedPassword = await bcrypt.hash(this.password, salt)
  this.password = hashedPassword;
  next()
})

/*
  userSchema.pre('save', async function(next) { ... }) là một hook trong Mongoose.
    Hook pre này sẽ được gọi trước khi một tài liệu (document) được lưu (save) vào cơ sở dữ liệu. 
    Trong trường hợp này, nó sẽ được gọi trước khi một tài liệu người dùng (user) được lưu.

  this.isModified('password') kiểm tra xem trường password có được chỉnh sửa hay không. 
    Nếu mật khẩu không thay đổi, hàm sẽ gọi next() và kết thúc quá trình. 
    Điều này giúp tránh việc mã hóa lại mật khẩu nếu mật khẩu không thay đổi, giúp tối ưu hiệu năng.

  const salt = await bcrypt.genSalt(10);: Tạo một salt với độ dài 10 rounds (mặc định là 10). 
    Salt là một chuỗi ngẫu nhiên được thêm vào mật khẩu trước khi mã hóa để tăng tính bảo mật.

  const hashedPassword = await bcrypt.hash(this.password, salt);: Mã hóa mật khẩu người dùng (this.password) bằng salt vừa tạo ra. 
    Kết quả là một chuỗi mã hóa được lưu trữ trong hashedPassword.

  this.password = hashedPassword;: Gán mật khẩu đã mã hóa (hashedPassword) vào trường password của tài liệu người dùng.

  next() được gọi để tiếp tục quá trình lưu tài liệu vào cơ sở dữ liệu. Nếu không gọi next(), quá trình lưu sẽ bị dừng lại và không bao giờ hoàn thành.
  -----
  (*)LƯU Ý ĐẶC BIỆT:
    `this` trong đoạn mã hook `pre` của Mongoose trỏ đến tài liệu hiện tại (document) đang được xử lý. 
      Khi bạn sử dụng hook `pre` trong một schema của Mongoose, this tự động được gán để trỏ đến tài liệu đó.
    Để giải thích chi tiết hơn:
      (+)this trong Mongoose Middleware
        Trong ngữ cảnh của middleware `pre`, `this` đại diện cho tài liệu đang được lưu hoặc cập nhật trong cơ sở dữ liệu. 
          Điều này có nghĩa là bạn có thể truy cập và thay đổi các thuộc tính của tài liệu này bằng cách sử dụng this.
      (+)isModified và password
        this.isModified('password'): Đây là một phương thức của Mongoose để kiểm tra xem một thuộc tính cụ thể (password trong trường hợp này) có được chỉnh sửa kể từ lần cuối cùng tài liệu được lưu hay không. Nếu thuộc tính password đã được thay đổi, phương thức này sẽ trả về true, ngược lại sẽ trả về false.
        this.password: Đây là cách bạn truy cập thuộc tính password của tài liệu hiện tại. Bạn có thể đọc và ghi giá trị cho thuộc tính này.
    Ví dụ minh họa
      Giả sử bạn có một tài liệu người dùng (user) và bạn đang lưu tài liệu này vào cơ sở dữ liệu. 
      Khi bạn gọi user.save(), Mongoose sẽ kích hoạt hook pre('save') trước khi lưu tài liệu. 
      Trong hook này, this trỏ đến đối tượng user.
    Tóm tắt
      this trong middleware của Mongoose trỏ đến tài liệu hiện tại đang được xử lý.
      this.isModified('password'): kiểm tra xem thuộc tính password có được chỉnh sửa hay không.
      this.password: cho phép truy cập và thay đổi giá trị của thuộc tính password trong tài liệu hiện tại.
      Middleware pre('save') đảm bảo rằng mật khẩu của người dùng luôn được mã hóa trước khi lưu vào cơ sở dữ liệu.
*/

const User = mongoose.model('User', userSchema) //Tạo một model User từ schema userSchema đã định nghĩa.
module.exports = User //xuất model User để có thể sử dụng ở các file khác trong dự án.

/*
  1.timestamps: true
  Khi bạn đặt tùy chọn timestamps: true trong schema của Mongoose, nó sẽ tự động thêm hai trường createdAt và updatedAt vào mỗi document trong collection.
    createdAt: Trường này sẽ lưu trữ thời điểm khi document được tạo.
    updatedAt: Trường này sẽ lưu trữ thời điểm khi document được cập nhật lần cuối.
  Đây là một cách thuận tiện để theo dõi lịch sử thay đổi của document mà không cần phải tự tay thêm và quản lý các trường này.
  
  (*)Ví dụ về timestamp:
    Khi bạn tạo một người dùng mới:
      const newUser = new User({
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'securepassword123'
      });
      await newUser.save();
    Document lưu trữ dưới dạng JSON trong MongoDB sẽ trông như sau:
       {
        "_id": "60d5f69c8e620b6b2f8b4567",
        "name": "John Doe",
        "email": "john.doe@example.com",
        "password": "securepassword123",
        "createdAt": "2021-06-25T14:56:12.837Z",
        "updatedAt": "2021-06-25T14:56:12.837Z",
        "__v": 0
      }
    Khi bạn cập nhật người dùng này sau đó, trường updatedAt sẽ được cập nhật tự động:
      newUser.name = 'Jane Doe';
      await newUser.save();
    Document cập nhật trong MongoDB  ==>  "updatedAt": "2021-06-25T15:00:01.123Z",  "__v": 1

  2.minimize: false
    Tùy chọn minimize: false trong schema của Mongoose kiểm soát việc lưu các trường trống hoặc không.
      minimize: true (mặc định): Khi được đặt là true, Mongoose sẽ loại bỏ các trường trống (object trống) khỏi document trước khi lưu vào cơ sở dữ liệu.
      minimize: false: Khi được đặt là false, Mongoose sẽ giữ lại các trường trống trong document.
    Ví dụ, nếu bạn có một document với một trường trống:
      const newUser = new User({
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'securepassword123',
        bio: ''
      });
      await newUser.save();
    Nếu minimize: true, document lưu trữ sẽ không chứa trường bio vì nó trống
    Nếu minimize: false, document lưu trữ sẽ giữ lại trường bio ngay cả khi nó trống
*/

/*
  userModel này định nghĩa một schema cho người dùng 
  Với các trường cơ bản như tên, email, mật khẩu, ảnh đại diện, số điện thoại, tiểu sử, vai trò, trạng thái xác minh và thông tin user agent. 
  Nó bao gồm các quy tắc xác thực và các giá trị mặc định để đảm bảo tính toàn vẹn dữ liệu. 
  Sau khi định nghĩa schema, file này tạo một model từ schema và xuất model đó để sử dụng ở các phần khác của ứng dụng.
*/
const asyncHandler = require('express-async-handler')
const User = require('../models/userModel')
const bcrypt = require('bcryptjs')
const { generateToken, hashToken } = require('../utils')
const parser = require('ua-parser-js')
const jwt = require('jsonwebtoken')
const sendEmail = require('../utils/sendEmail')
const Token = require('../models/tokenModel')
const crypto = require('crypto')
const Cryptr = require('cryptr')
const { OAuth2Client } = require("google-auth-library") //OAuth2Client: Thư viện dùng để tương tác với các dịch vụ OAuth2 của Google.


const cryptr = new Cryptr(process.env.CRYPTR_KEY)

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID) //client: Một đối tượng OAuth2Client được khởi tạo với GOOGLE_CLIENT_ID, giúp xác thực token từ Google.
//=======================Register User=====================================
const registerUser = asyncHandler(async (req,res) => {
  // res.send('Register user')

  //Lấy các thông tin cần thiết từ body của request. Đây là các thông tin được người dùng cung cấp khi đăng ký.
  const { name, email, password } = req.body
  // console.log(name,email,password)

  //Validation 
  if (!name || !email || !password) {
    //Kiểm tra xem tất cả các trường name, email, và password có được cung cấp hay không. Nếu thiếu trường nào, trả về lỗi 400.
    res.status(400)
    throw new Error('Please fill in all the required fields ')
  }

  if(password.length <6){
    //Kiểm tra độ dài của mật khẩu phải ít nhất là 6 ký tự.
    res.status(400)
    throw new Error('Password mush be up to 6 characters')
  }

  //CHeck if user exists - Tìm kiếm người dùng với email đã cung cấp. Nếu người dùng đã tồn tại, trả về lỗi 400.
  const userExists = await User.findOne({email})

  if(userExists){
    res.status(400)
    throw new Error('Email already in use')
  }
  
  //Get UserAgent
  const  ua = parser(req.headers['user-agent']);
    // console.log(ua)
  const userAgent = [ua.ua]
/*
  req.headers['user-agent']: Header User-Agent chứa thông tin về trình duyệt và hệ điều hành của client. Đây là một chuỗi được gửi từ trình duyệt của người dùng đến máy chủ để thông báo về môi trường mà người dùng đang sử dụng.
  parser(req.headers['user-agent']): Sử dụng một thư viện phân tích cú pháp (parser) để phân tích chuỗi User-Agent từ header của yêu cầu HTTP. Thư viện này có thể là một thư viện như ua-parser-js.
  const ua = parser(req.headers['user-agent']); sẽ phân tích chuỗi này và trả về một đối tượng chứa các thông tin đã được phân tích.
  
  Minh họa nếu console.log(ua):
    {
      ua: 'Thunder Client (https://www.thunderclient.com)',
      browser: { name: undefined, version: undefined, major: undefined },
      engine: { name: undefined, version: undefined },
      os: { name: undefined, version: undefined },
      device: { vendor: undefined, model: undefined, type: undefined },
      cpu: { architecture: undefined }
    }
  ------
  ua.ua: Truy cập thuộc tính ua của đối tượng ua trả về từ parser. Thuộc tính này thường chứa chuỗi thông tin User-Agent.
  const userAgent = [ua.ua]; Tạo một mảng chứa chuỗi User-Agent để lưu trữ trong cơ sở dữ liệu.
  -------
  Mục đích của UserAgent
    Xác định thiết bị và trình duyệt: User-Agent có thể cung cấp thông tin chi tiết về loại thiết bị (máy tính để bàn, điện thoại di động, máy tính bảng), trình duyệt (Chrome, Firefox, Safari), và hệ điều hành (Windows, macOS, Linux, Android, iOS) mà người dùng đang sử dụng.
    Bảo mật: Lưu trữ thông tin User-Agent có thể giúp phát hiện và ngăn chặn các hành vi đáng ngờ hoặc gian lận. Ví dụ, nếu một người dùng đăng nhập từ nhiều thiết bị hoặc trình duyệt khác nhau trong một khoảng thời gian ngắn, điều này có thể báo hiệu một hoạt động đáng ngờ.
    Phân tích và tối ưu hóa: Thông tin User-Agent có thể được sử dụng để phân tích và tối ưu hóa trải nghiệm người dùng. Ví dụ, bạn có thể xem xét tỷ lệ người dùng sử dụng các trình duyệt và thiết bị khác nhau để tối ưu hóa giao diện và chức năng của trang web hoặc ứng dụng của bạn cho các môi trường phổ biến nhất.
    ==>Tóm lại, việc lưu trữ User-Agent cung cấp một cách để theo dõi và phân tích thông tin về môi trường của người dùng, giúp cải thiện bảo mật và tối ưu hóa trải nghiệm người dùng.
*/
  //Create new user
  const user = await User.create({
    name,
    email,
    password,
    userAgent,
  })

  //Generate Token - Gọi hàm generateToken để tạo token xác thực cho người dùng mới.
  const token = generateToken(user._id)

  //Send HTTP  - only cookie --> Gửi cookie HTTP-only chứa token đến client. Cookie này sẽ được bảo vệ và không thể truy cập bởi JavaScript phía client.
  res.cookie('token',token,{
    path:'/',
    httpOnly:true,
    expires: new Date(Date.now() + 1000 * 86400), //1 day
    sameSite: 'none',
    secure: true,
  })

  {/* Note:
    path: '/':
      Giải thích: Thiết lập path xác định phạm vi đường dẫn của cookie. Cookie sẽ được gửi trong mọi yêu cầu có đường dẫn bắt đầu bằng giá trị này.
      Mục đích: path: '/' có nghĩa là cookie sẽ có sẵn trên toàn bộ ứng dụng web. Mọi yêu cầu đến bất kỳ URL nào trên trang web đều sẽ bao gồm cookie này.

    httpOnly: true:
      Giải thích: Thiết lập httpOnly làm cho cookie không thể truy cập được bằng JavaScript phía client. Chỉ server mới có thể truy cập được cookie này.
      Mục đích: Tăng cường bảo mật bằng cách giảm nguy cơ tấn công XSS (Cross-Site Scripting). Điều này ngăn không cho các script độc hại truy cập vào cookie từ phía client.

    expires: new Date(Date.now() + 1000 * 86400):
      Giải thích: Thiết lập expires xác định thời điểm cookie hết hạn. Trong trường hợp này, new Date(Date.now() + 1000 * 86400) tạo ra một đối tượng ngày tháng đại diện cho thời gian hiện tại cộng thêm 86400 giây (1 ngày).
      Mục đích: Xác định thời gian sống của cookie. Cookie sẽ tự động bị xóa sau 1 ngày.
      --------
      (*)Lưu ý:  Date.now() trả về số mili giây đã trôi qua kể từ ngày 1 tháng 1 năm 1970 (epoch time). Đây là thời gian hiện tại dưới dạng số mili giây.
        ~Ví dụ: Nếu thời gian hiện tại là 2023-06-15T12:00:00Z, Date.now() có thể trả về một số như 1686820800000.
          `1000` -> Một giây có 1000 mili giây. Mục đích ta cần chuyển đổi đơn vị từ giây sang mili giây.
          `86400` --> Một ngày có 86400 giây (24 giờ x 60 phút x 60 giây). Mục đích: Sử dụng để xác định số giây trong một ngày.
        ~Tính toán chi tiết:
          Một ngày có bao nhiêu mili giây: 1000 * 86400 = 86400000
            1000 mili giây (1 giây) x 86400 giây (1 ngày) = 86400000 mili giây.
          Cộng số mili giây của một ngày vào thời gian hiện tại:
            Date.now() + 86400000 sẽ cho ra thời gian hiện tại cộng thêm một ngày.
          Tạo một đối tượng Date mới:
            new Date(Date.now() + 86400000) sẽ tạo một đối tượng Date đại diện cho thời gian một ngày sau thời điểm hiện tại.
        ~Ví dụ thực tế: 
          Giả sử thời gian hiện tại là 2023-06-15T12:00:00Z.
            Date.now() trả về 1686820800000 (mili giây).
            1000 * 86400 trả về 86400000 (mili giây).
            1686820800000 + 86400000 = 1686907200000.
            new Date(1686907200000) sẽ trả về đối tượng Date đại diện cho thời gian 2023-06-16T12:00:00Z.

    sameSite: 'none':
      Giải thích: Thiết lập sameSite kiểm soát cách cookie được gửi trong các yêu cầu cross-site (giữa các trang web khác nhau).
        Strict: Cookie chỉ được gửi trong các yêu cầu đến cùng một site.
        Lax: Cookie được gửi trong các yêu cầu GET cross-site, nhưng không cho các yêu cầu POST cross-site.
        None: Cookie sẽ được gửi trong mọi yêu cầu, bất kể cùng một site hay cross-site.
      Mục đích: sameSite: 'none' cho phép cookie được gửi trong mọi yêu cầu cross-site. Điều này hữu ích trong các ứng dụng yêu cầu tính năng đăng nhập một lần (SSO) hoặc cần chia sẻ thông tin phiên làm việc giữa các trang web khác nhau.
 */}

  if (user) {
    const {_id, name, email, phone, bio, photo, role, isVerified} = user
    res.status(201).json({
      _id, name, email, phone, bio, photo, role, isVerified, token 
    })
  } else {
    res.status(400)
    throw new Error('Invalid user data')
  }
})

  /*
    registerUser là một hàm bất đồng bộ (asynchronous) được sử dụng để xử lý yêu cầu đăng ký người dùng.
    Khi tuyến đường /register được gọi, hàm registerUser sẽ được thực thi, thực hiện các logic cần thiết (như lưu người dùng vào cơ sở dữ liệu, xác thực dữ liệu, v.v.) và trả về phản hồi cho client.
  */

//=======================Login User=====================================
const loginUser = asyncHandler(async (req,res) => {
  const {email, password } = req.body
  //Validation
  if (!email || !password) {
    //Kiểm tra xem tất cả các trường  email, và password có được cung cấp hay không. Nếu thiếu trường nào, trả về lỗi 400.
    res.status(400)
    throw new Error('Please add email or password ')
  }

  const user = await User.findOne({email})
  if(!user){
    res.status(400)
    throw new Error('User not found. Please Signup!')
  }

  const passwordIsConrrect = await bcrypt.compare(password, user.password)
  if(!passwordIsConrrect){
    res.status(400)
    throw new Error('Invalid email or password')
  }

  //Trigger 2FA for unknow UserAgent
  const  ua = parser(req.headers['user-agent']); //phân tích chuỗi UserAgent từ tiêu đề yêu cầu HTTP 
  const thisUserAgent = ua.ua  // trích xuất thông tin UserAgent từ đối tượng ua và lưu vào biến thisUserAgent.
  console.log(thisUserAgent)
  const allowedAgent = user.userAgent.includes(thisUserAgent) // kiểm tra xem UserAgent hiện tại (thisUserAgent) có nằm trong danh sách các UserAgent đã được lưu trữ của người dùng hay không (user.userAgent).

  if(!allowedAgent){
    // Genrate 6 digit code
    const loginCode = Math.floor(100000 + Math.random() * 900000)
    /*
      * Math.floor --> trả về một số thập phân ngẫu nhiên nằm trong khoảng từ 0 (bao gồm) đến 1 (không bao gồm)
          ví dụ: 0.234567, 0.876543, 0.123456, v.v.
      * Math.random() * 900000
          Khi nhân Math.random() với 900000, ta sẽ có một số thập phân ngẫu nhiên nằm trong khoảng từ 0 đến 899999.999999.
          Nếu Math.random() trả về 0.5 thì 0.5 * 900000 = 450000
      * 100000 + Math.random() * 900000
          Khi thêm 100000 vào kết quả ở bước trước, ta sẽ có một số thập phân ngẫu nhiên nằm trong khoảng từ 100000 đến 999999.999999.
          Điều này đảm bảo rằng số ngẫu nhiên luôn có ít nhất 6 chữ số.
          Ví dụ: Nếu Math.random() * 900000 trả về 450000, thì 100000 + 450000 = 550000
      * Math.floor(100000 + Math.random() * 900000)
          Ví dụ: Nếu 100000 + Math.random() * 900000 trả về 550000.876543, thì Math.floor(550000.876543) = 550000.
  */
    console.log(loginCode)
    //Encrypt login code before saving to DB
    const encryptedLoginCode = cryptr.encrypt(loginCode.toString())

    //Delete Token if it exits in DB
    let userToken = await Token.findOne({userId: user._id}) //Tìm kiếm token xác minh cũ của người dùng.
    if(userToken){
      await userToken.deleteOne()
    }

    //Save Token to DB
    await new Token({
      userId: user._id,
      lToken: encryptedLoginCode,
      createdAt: Date.now(),
      expiresAt: Date.now() + 60 * (60*1000) //60 mins
    }).save()

    res.status(400) 
    throw new Error('New browser or Device detected')
  } 

  //Generate Token - Gọi hàm generateToken để tạo token xác thực cho người dùng mới.
  const token = generateToken(user._id)

  if(user && passwordIsConrrect) {
    //Send HTTP  - only cookie 
    res.cookie('token',token,{
      path:'/',
      httpOnly:true,
      expires: new Date(Date.now() + 1000 * 86400), //1 day
      sameSite: 'none',
      secure: true,
    })

    const {_id, name, email, phone, bio, photo, role, isVerified} = user
    res.status(200).json({
      _id, name, email, phone, bio, photo, role, isVerified, token 
    })

  } else {
    res.status(500)
    throw new Error('Something went wrong, please try again!')
  }
})

  /* Tương tự, loginUser: Đây là một hàm bất đồng bộ (asynchronous function) được sử dụng để xử lý yêu cầu đăng nhập của người dùng. */

//=======================Send Login Code =====================================
const sendLoginCode= asyncHandler(async (req,res) => {
  const {email} = req.params
  const user = await User.findOne({ email })
  if(!user){
    res.status(404)
    throw new Error('User not found')
  }

  //Find Login Code in DB
  let userToken = await Token.findOne({
    userId:user._id,
    expiresAt: {$gt: Date.now()}
  })
  if(!userToken){
    res.status(404)
    throw new Error('Invalid or Expired token, please login again')
  }

  const loginCode = userToken.lToken
  //decrypt login code 
  const decryptedLoginCode = cryptr.decrypt(loginCode.toString())

  //Send Login Code
  const subject = 'Login Access Code - AUTH:Z'
  const send_to = email
  const send_from = process.env.EMAIL_USER
  const reply_to = 'noreply@baoto.com'
  const template = 'loginCode'
  const name = user.name
  const link = decryptedLoginCode

  try {
    await sendEmail(subject, send_to, send_from, reply_to, template, name, link)
    res.status(200).json({message:`Access Code sent to ${email}`})
  } catch (error) {
    res.status(500)
    throw new Error('Email not send, please try again!')
  }

}) 

//=======================Login with Code =====================================
const loginWithCode= asyncHandler(async (req,res) => {
  const {email} = req.params
  const {loginCode} = req.body

  const user = await User.findOne({ email })
  if(!user){
    res.status(404)
    throw new Error('User not found')
  }

  //Find user Login Token
  let userToken = await Token.findOne({
    userId:user._id,
    expiresAt: {$gt: Date.now()}
  })

  if(!userToken){
    res.status(404)
    throw new Error('Invalid or Expired token, please login again')
  }
  //Decrypt token 
  const decryptedLoginCode = cryptr.decrypt(userToken.lToken)
 
  if (loginCode !== decryptedLoginCode) {
    res.status(400)
    throw new Error('Incorrect login code, please try again')
  } else {
    //Register userAgent
    const  ua = parser(req.headers['user-agent']); //phân tích chuỗi UserAgent từ tiêu đề yêu cầu HTTP 
    const thisUserAgent = ua.ua 
    user.userAgent.push(thisUserAgent)
    await user.save()

    //Generate Token 
    const token = generateToken(user._id)

    //Send HTTP  - only cookie 
    res.cookie('token',token,{
      path:'/',
      httpOnly:true,
      expires: new Date(Date.now() + 1000 * 86400), //1 day
      sameSite: 'none',
      secure: true,
    })

    const {_id, name, email, phone, bio, photo, role, isVerified} = user
    res.status(201).json({
      _id, name, email, phone, bio, photo, role, isVerified, token 
    })

  }
}) 
//=======================Send Verification Email =====================================
const sendVerificationEmail = asyncHandler(async (req,res) => {
  // res.send("Email")
  const user = await User.findById(req.user._id)
  if(!user){
    res.status(404)
    throw new Error('User not found!')
  }
  if(user.verified){
    res.status(400)
    throw new Error('User already verified')
  }

  //Delete Token if it exits in DB
  let token = await Token.findOne({userId: user._id}) //Tìm kiếm token xác minh cũ của người dùng.
  if(token){
    await token.deleteOne()
  }

  //Create verification token and save
  const verificationToken = crypto.randomBytes(32).toString("hex") + user._id
    /*
      Tạo một chuỗi ngẫu nhiên 32 byte và kết hợp với ID của người dùng để tạo token xác minh.
      crypto.randomBytes(32).toString("hex") tạo một chuỗi ngẫu nhiên dưới dạng thập lục phân.
    */
    console.log(verificationToken)
    // res.send("Token")
  
  //Hash Token and Save - Băm token bằng hàm hashToken và Lưu token đã băm vào cơ sở dữ liệu cùng với ID người dùng, thời gian tạo và thời gian hết hạn.
  const hashedToken = hashToken(verificationToken)
  await new Token({
    userId: user._id,
    vToken: hashedToken,
    createdAt: Date.now(),
    expiresAt: Date.now() + 60 * (60*1000) //60 mins
  }).save()
    /*
      Date.now():Trả về số milliseconds đã trôi qua kể từ 00:00:00 UTC ngày 1 tháng 1 năm 1970 (mốc thời gian Unix).
        ==>Đây là thời gian hiện tại tính bằng milliseconds.
      60 * (60 * 1000):
        1000 milliseconds bằng 1 giây. 
        60 * 1000 milliseconds bằng 60 giây, tức là 1 phút.
        Mà 60 phút bằng 1 giờ: 60 * (60 * 1000) mili giây
        ==> Như vậy, 60 * (60 * 1000) milliseconds bằng 60 phút, tức là 1 giờ.

      Thực hiện 'Date.now()' cho thời gian hiện tại +  '60 * (60 * 1000)' để thêm 1 giờ vào thời gian hiện tại.
      ==>Kết quả là thời gian hết hạn sẽ là 1 giờ kể từ thời điểm hiện tại.
    */

  //Construc Verification URL - Tạo URL xác minh bằng cách kết hợp URL frontend từ biến môi trường với token xác minh.
  const verificationUrl = `${process.env.FRONTEND_URL}/verify/${verificationToken}`

  //Send Email
  const subject = 'Verify Your Account - AUTH:Z'
  const send_to = user.email
  const send_from = process.env.EMAIL_USER
  const reply_to = 'noreply@baoto.com'
  const template = 'verifyEmail'
  const name = user.name
  const link = verificationUrl

  try {
    await sendEmail(subject, send_to, send_from, reply_to, template, name, link)
    res.status(200).json({message:'Verification Email Send'})
  } catch (error) {
    res.status(500)
    throw new Error('Email not send, please try again!')
  }


}) 

//=======================Verify User=====================================
const verifyUser = asyncHandler(async (req,res) => {
  const { verificationToken} = req.params

  const hashedToken = hashToken(verificationToken)

  const userToken = await Token.findOne({
    vToken: hashedToken,
    expiresAt: {$gt: Date.now()}
  })

  if(!userToken){
    res.status(404)
    throw new Error('Invalid or Expired Token')
  }

  //Find User
  const user = await User.findOne({_id: userToken.userId})

  if(userToken.isVerified){
    res.status(400)
    throw new Error('User is already verified')
  }

  //Now verify user
  user.isVerified = true
  await user.save()

  res.status(200).json({message:'Account Verification Successful'})
})

//=======================Logout User=====================================
const logoutUser = asyncHandler(async (req,res) => {
  // res.send('Logout')
   //Send HTTP  - only cookie 
   res.cookie('token','',{
    path:'/',
    httpOnly:true,
    expires: new Date(0),
    sameSite: 'none',
    secure: true,
  })
  return res.status(200).json({message:'Logout successfull'})
})

//=======================Get User=====================================
const getUser = asyncHandler(async (req,res) => {
  // res.send('Get User')
  const user = await User.findById(req.user._id)

  if (user) {
    const {_id, name, email, phone, bio, photo, role, isVerified} = user
    res.status(200).json({
      _id, name, email, phone, bio, photo, role, isVerified
    })
  } else{
    res.status(404)
    throw new Error('User not found...')
  }
})

//=======================Update User=====================================
const updateUser = asyncHandler(async (req,res) => {
  // res.send('Update user')
  const user = await User.findById(req.user._id)

  if(user){
    const {name, email, phone, bio, photo, role, isVerified} = user

    user.email = req.body.email || email
    user.name = req.body.name || name
    user.phone = req.body.phone || phone
    user.bio = req.body.bio || bio
    user.photo = req.body.photo|| bio

    const updatedUser = await user.save()

    res.status(200).json({
      _id: updatedUser._id, name: updatedUser.name, email: updatedUser.email, phone: updatedUser.phone, bio: updatedUser.bio, photo: updatedUser.photo, role: updatedUser.role, isVerified: updatedUser.isVerified
    })

  }else{
    res.status(404)
    throw new Error('User not found...')
  }
})

//=======================Delete User=====================================
const deleteUser = asyncHandler(async (req,res) => {
  // res.send('Delete')
  const user = User.findById(req.params.id) //Khi bạn gọi User.findById(req.params.id), nó trả về một tài liệu MongoDB.
  // Có thể dùng trực tiếp : const user = await User.findByIdAndDelete(req.params.id)
  if(!user){
    res.status(404)
    throw new Error('User not found...')
  }
  // await user.remove() --> Giá trị của user được gán trả về 1 tài liệu MongoDB. Ta dùng remove() để thực hiện xóa tài liệu. Tuy nhiên nó đã bị loại bỏ trong phiên bản mới
  await User.deleteOne({ _id: req.params.id }) // Vì deleteOne() là phương thức của mô hình (model method) nên ta phải dùng User
  res.status(200).json({
    message:'User deleted successfully'
  })
})
{/*
  - Sử dụng findByIdAndDelete:  User.findByIdAndDelete(req.params.id) sẽ tìm người dùng với id được truyền vào và xóa trực tiếp từ cơ sở dữ liệu.
      ==>Nếu người dùng tồn tại, nó sẽ trả về đối tượng người dùng đã bị xóa, ngược lại, trả về null.
  - Sử dụng deleteOne:  User.deleteOne({ _id: req.params.id }) sẽ xóa người dùng với _id tương ứng từ cơ sở dữ liệu.

  - '.remove()' từng được sử dụng trong các phiên bản cũ hơn của Mongoose nhưng hiện tại đã không còn được hỗ trợ. 
    Thay vào đó, bạn nên sử dụng các phương thức hiện tại như .deleteOne(), .deleteMany(), hoặc .findByIdAndDelete() để thực hiện các thao tác xóa dữ liệu trong cơ sở dữ liệu MongoDB.

  - deleteMany(filter): Xóa nhiều tài liệu phù hợp với bộ lọc.
      Ví dụ: await User.deleteMany({ role: 'admin' });
      Hoặc xóa phiên  đăng nhập đã hết hạn trong hệ thống xác thực của bạn:  
        const now = new Date();
        await Session.deleteMany({ expiresAt: { $lt: now } });
*/}

//=======================Get Users=====================================
const getUsers = asyncHandler(async (req,res) => {
  // res.send('Get User')
  const users = await User.find().sort('-createdAt').select('-password')
  if(!users){
    res.status(500)
    throw new Error('Something went wrong...')
  }
  res.status(200).json(users)
})

//=======================Login Status=====================================
const getLoginStatus = asyncHandler(async (req,res) => {
  // res.send('login status')
  const token = req.cookies.token
  if(!token){
    return res.json(false)
  }

  //Verify Token
  const verified = jwt.verify(token,process.env.JWT_SECRET)

  if(verified){
    return res.json(true)
  }
  return res.json(false)
}) 

//=======================Upgrade User - Change Role =====================================
const upgradeUser = asyncHandler(async (req,res) => {
  // res.send('upgrade')
  const {role, id} = req.body

  const user = await User.findById(id)

  if(!user){
    res.status(404)
    throw new Error('User not found')
  }
  user.role = role
  await user.save()

  res.status(200).json({
    message: `User role updated to ${role}`
  })
}) 

//=======================Forgot Password=====================================
const forgotPassword = asyncHandler(async (req,res) => {
  const {email} = req.body
  const user = await User.findOne({email})

  if(!user){
    res.status(404)
    throw new Error('No user with this email')
  }

  //Delete Token if it exits in DB
  let token = await Token.findOne({userId: user._id}) //Tìm kiếm token xác minh cũ của người dùng.
  if(token){
    await token.deleteOne()
  }

  //Create reset token and save
  const resetToken = crypto.randomBytes(32).toString("hex") + user._id
  
  console.log(resetToken)
  
  //Hash Token and Save - Băm token bằng hàm hashToken và Lưu token đã băm vào cơ sở dữ liệu cùng với ID người dùng, thời gian tạo và thời gian hết hạn.
  const hashedToken = hashToken(resetToken)
  await new Token({
    userId: user._id,
    rToken: hashedToken,
    createdAt: Date.now(),
    expiresAt: Date.now() + 60 * (60*1000) //60 mins
  }).save()
    
  //Construc Reset URL 
  const resetUrl = `${process.env.FRONTEND_URL}/resetPassword/${resetToken}`

  //Send Email
  const subject = 'Password Reset Request - AUTH:Z'
  const send_to = user.email
  const send_from = process.env.EMAIL_USER
  const reply_to = 'noreply@baoto.com'
  const template = 'forgotPassword'
  const name = user.name
  const link = resetUrl

  try {
    await sendEmail(subject, send_to, send_from, reply_to, template, name, link)
    res.status(200).json({message:'Password Reset Email Send'})
  } catch (error) {
    res.status(500)
    throw new Error('Email not send, please try again!')
  }
}) 
//=======================Reset Password=====================================
const resetPassword = asyncHandler(async (req,res) => {
  const {resetToken} = req.params
  const {password} = req.body

  const hashedToken = hashToken(resetToken)

  const userToken = await Token.findOne({
    rToken: hashedToken,
    expiresAt: {$gt: Date.now()}
  })

  if(!userToken){
    res.status(404)
    throw new Error('Invalid or Expired Token')
  }

  //Find User
  const user = await User.findOne({_id: userToken.userId})

  //Now reset password
  user.password = password
  await user.save()

  res.status(200).json({message:'Password Reset Successful, Please login'})
}) 

//=======================Change Password=====================================
const changePassword = asyncHandler(async (req,res) => {
  const {oldPassword, password} = req.body
  const user = await User.findById(req.user._id)

  if(!user){
    res.status(404)
    throw new Error('No user with this email')
  }

  if(!oldPassword|| !password){
    res.status(400);
    throw new Error('Please enter old and new password')
  }

  //Check if old password is correct
  const passswordIsConrrect = await bcrypt.compare(oldPassword, user.password)
  //Save new password
  if(user && passswordIsConrrect){
    user.password = password
    await user.save()
    res.status(200).json({message:'Password Change Successful, Please re-login'})
  } else{
    res.status(400);
    throw new Error('Old password is incorrect')
  }
}) 

//=======================Send Automated Email =====================================
const sendAutomatedEmail = asyncHandler(async (req,res) => {
  // res.send('Email Send')
  const {subject, send_to, reply_to, template, url} = req.body
  if (!subject || !send_to || !reply_to || !template) {
    res.status(500);
    throw new Error("Missing email parameter");
  }

  
  //Get user
  const user = await User.findOne({email: send_to})
  if(!user){
    res.status(404)
    throw new Error('User not found')
  }

  const send_from = process.env.EMAIL_USER
  const name = user.name
  const link= `${process.env.FRONTEND_URL}${url}`
  // console.log(subject, send_to, send_from, reply_to, template, name, link)
  try {
    await sendEmail(subject, send_to, send_from, reply_to, template, name, link)
    res.status(200).json({message:'Email Send'})
  } catch (error) {
    res.status(500)
    throw new Error('Email not send, please try again!')
  }
}) 

//=======================Login With Google =====================================
const loginWithGoogle = asyncHandler(async (req,res) => {
  const { userToken } = req.body; // Token nhận từ phía client sau khi người dùng đăng nhập Google. Token này sẽ được gửi qua req.body.
  //   console.log(userToken);

  const ticket = await client.verifyIdToken({
    //verifyIdToken: Hàm này xác thực userToken và kiểm tra tính hợp lệ. Nó cũng kiểm tra xem token này có thuộc về ứng dụng với GOOGLE_CLIENT_ID hay không.
    idToken: userToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });


  const payload = ticket.getPayload();
  // console.log(payload)
  const { name, email, picture, sub } = payload;
  const password = Date.now() + sub;
  /*
    payload: Chứa thông tin người dùng từ token. Các thông tin này bao gồm:
    name: Tên người dùng
    email: Email người dùng
    picture: Ảnh đại diện của người dùng
    sub: Một mã duy nhất cho mỗi người dùng
    password: Tạo một mật khẩu tạm thời dựa trên thời gian hiện tại và sub. Mật khẩu này chỉ dùng để lưu trong cơ sở dữ liệu, không dùng để đăng nhập
  */

  // Get UserAgent
  const ua = parser(req.headers["user-agent"]);
  const userAgent = [ua.ua];
  /*
    parser: Hàm phân tích thông tin User-Agent từ tiêu đề HTTP của yêu cầu, giúp biết được người dùng đang sử dụng trình duyệt và hệ điều hành gì.
    userAgent: Lưu trữ thông tin UserAgent của người dùng.
  */

  // Check if user exists
  const user = await User.findOne({ email }); //User.findOne: Kiểm tra xem người dùng có tồn tại trong cơ sở dữ liệu với email đã lấy từ token không.

  if (!user) { //Nếu người dùng không tồn tại, tạo mới
    //   Create new user
    const newUser = await User.create({
      name,
      email,
      password,
      photo: picture,
      isVerified: true,
      userAgent,
    });

    //Tạo token xác thực và gửi lại cho người dùng
    if (newUser) {
      // Generate Token
      const token = generateToken(newUser._id); //generateToken: Hàm tạo token xác thực dựa trên ID người dùng.

      // Send HTTP-only cookie
      res.cookie("token", token, {
        path: "/",
        httpOnly: true,
        expires: new Date(Date.now() + 1000 * 86400), // 1 day
        sameSite: "none",
        secure: true,
      });

        /*
          res.cookie: Gửi cookie chứa token đến client. Cookie này:
            httpOnly: Chỉ có thể truy cập từ server, không thể truy cập từ JavaScript phía client.
            expires: Thời gian hết hạn của cookie là 1 ngày.
            sameSite: Bảo vệ chống tấn công CSRF.
            secure: Chỉ gửi qua kết nối HTTPS.
            res.status(201).json: Trả về thông tin người dùng và token dưới dạng JSON.
        */

      const { _id, name, email, phone, bio, photo, role, isVerified } = newUser;

      res.status(201).json({
        _id,
        name,
        email,
        phone,
        bio,
        photo,
        role,
        isVerified,
        token,
      });

    }
  }

  // User exists, login - Nếu người dùng đã tồn tại, đăng nhập
  /*
    Nếu người dùng đã tồn tại, tạo token xác thực mới và gửi lại cho client bằng cách sử dụng res.cookie.
    Trả về thông tin người dùng và token dưới dạng JSON.
  */
  if (user) {
    const token = generateToken(user._id);

    // Send HTTP-only cookie
    res.cookie("token", token, {
      path: "/",
      httpOnly: true,
      expires: new Date(Date.now() + 1000 * 86400), // 1 day
      sameSite: "none",
      secure: true,
    });

    const { _id, name, email, phone, bio, photo, role, isVerified } = user;

    res.status(201).json({
      _id,
      name,
      email,
      phone,
      bio,
      photo,
      role,
      isVerified,
      token,
    });
  }
})
 
module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getUser,
  updateUser,
  deleteUser,
  getUsers,
  getLoginStatus,
  upgradeUser,
  sendAutomatedEmail,
  sendVerificationEmail,
  verifyUser,
  forgotPassword,
  resetPassword,
  changePassword,
  sendLoginCode,
  loginWithCode,
  loginWithGoogle,
}
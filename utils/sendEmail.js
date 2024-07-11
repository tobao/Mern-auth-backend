const nodemailer = require('nodemailer')                  //được sử dụng để gửi email
const hbs = require('nodemailer-express-handlebars')      //plugin cho nodemailer để sử dụng template email với Handlebars.
const path = require('path')                              //Module này được sử dụng để làm việc với đường dẫn file và thư mục.

//Hàm này là hàm bất đồng bộ (async) để gửi email. Nó nhận các tham số: Tiêu đề email, Địa chỉ email người nhận, Địa chỉ email người gửi, Tên template email được sử dụng, Tên người nhận sẽ được chèn vào email hay link: Một liên kết sẽ được chèn vào email.
const sendEmail = async (subject, send_to, send_from, reply_to, template, name, link) => {
  //Create Email Transporter
  const transporter = nodemailer.createTransport({
    service:'gmail', //nếu sử dụng gmail thì thêm vào, outlook thì không cần
    host: process.env.EMAIL_HOST,
    port: 587,
    auth:{
      user:process.env.EMAIL_USER,
      pass:process.env.EMAIL_PASS
    },
    tls:{
      rejectUnauthorized: false
    }
  })
  /*
    transporter: Đối tượng này được sử dụng để cấu hình và gửi email.
    host: Địa chỉ máy chủ SMTP từ biến môi trường process.env.EMAIL_HOST.
    port: Cổng SMTP (587 là cổng thông thường cho TLS).
    auth: Thông tin xác thực với tên người dùng (user) và mật khẩu (pass) từ biến môi trường.
    tls: Tùy chọn bảo mật TLS với rejectUnauthorized: false để chấp nhận các chứng chỉ không được xác thực.
  */


  const handleBarOption = {
    viewEngine:{
      extName: '.handlebars',
      partialsDir:  path.resolve('./views'),
      defaultLayout: false
    },
    viewPath:path.resolve('./views'),
    extName: '.handlebars'
  }

  /*
    viewEngine: Cấu hình view engine cho Handlebars.
      extName: Phần mở rộng của các file template ('.handlebars').
      partialsDir: Thư mục chứa các file partial của template.
      defaultLayout: Không sử dụng layout mặc định.
    viewPath: Đường dẫn tới thư mục chứa các file template.
    extName: Phần mở rộng của các file template ('.handlebars').
  */
  transporter.use('compile', hbs(handleBarOption))

  //Option for sending email
  const options = {
    from: send_from,
    to: send_to,
    replyTo: reply_to,
    subject,
    template,
    context:{
      name,
      link
    }
  }

  /*
    options: Đối tượng chứa các tùy chọn để gửi email.
      from: Địa chỉ email người gửi.
      to: Địa chỉ email người nhận.
      replyTo: Địa chỉ email sẽ nhận phản hồi.
      subject: Tiêu đề email.
      template: Tên template Handlebars sẽ được sử dụng.
      context: Các biến sẽ được truyền vào template (tên và liên kết).
  */

  //Send Email
  transporter.sendMail(options, function(err,info){
    if(err){
      console.log(err)
    }
    else{
      console.log(info)
    }
  })
}


/*
  transporter.sendMail: Gửi email với các tùy chọn đã cấu hình.
  Hàm callback nhận hai tham số:
    err: Lỗi nếu có.
    info: Thông tin về email đã gửi nếu thành công.
*/

module.exports = sendEmail
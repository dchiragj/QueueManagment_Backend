const nodemailer = require('nodemailer');
const { SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD } = require('../config/env');


class SendEmail {
  async send(to, subject, text, html) {
    try {
      let transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT == 465, // true for 465, false for 587/others
        auth: {
          user: SMTP_USERNAME,
          pass: SMTP_PASSWORD,
        },  
        tls: {
          rejectUnauthorized: false,
        },
        logger: true,
        debug: true,
      });

      let info = await transporter.sendMail({
  from: `Queue <${SMTP_USERNAME}>`,
  to,
  subject,
  text,
  html,
});
console.log('Message sent: %s', info.messageId);

return true;   // 👈 ADD THIS LINE

    } catch (e) {
      console.log('ERROR send', e);
      return false;
    }
  }
}

const sendEmailObj = new SendEmail();
module.exports = sendEmailObj;

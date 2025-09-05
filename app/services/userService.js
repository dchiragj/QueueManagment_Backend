const crypto = require('crypto');
const User = require('../models/user');
const constants = require('../config/constants');
const filteredBody = require('../utils/filteredBody');
const sendEmailService = require('../utils/sendemail');
const { ADMIN_EMAIL, SMTP_USERNAME } = require('../config/env');

const get6DigCode = () => {
  return Math.floor(100000 + Math.random() * 900000);
};

const sendEmail = async (msg) => {
  try {
    await sendEmailService.send(msg.to, msg.subject, msg.text, msg.html);
  } catch (e) {
    console.log('ERROR IN sendEmail', e);
  }
};

class UserService {
  /**
   * @description Get User
   */
  async getUser(id) {
    try {
      const user = await User.findOne({ _id: id });
      if (user) return user.toJSON();
    } catch (e) {
      throw e;
    }
  }

  /**
   * @description Get User
   */
  // async getUserRaw(id) {
  //   try {
  //     const result = await User.findOne({ _id: id });
  //     return result;
  //   } catch (e) {
  //     throw e;
  //   }
  // }
async getUserRaw(id) {
  return await User.findOne({ where: { id } }); // Sequelize ma 'id'
}

  async getUserByUsername(username) {
    const normalized_username = String(username)
      .toUpperCase()
      .trim();
    const user = await User.findOne({
      $or: [{ email: username }, { normalized_email: normalized_username }],
    });
    if (user) return user.toAuthJSON();

    return null;
  }

  async getUserByUsernameRaw(username) {
    const normalized_username = String(username)
      .toUpperCase()
      .trim();
    const user = await User.findOne({
      $or: [{ email: username }, { normalized_email: normalized_username }],
    });
    return user;
  }

  async validateUserCredential(username, password, role) {
    const normalized_username = String(username)
      .toUpperCase()
      .trim();
    const user = await User.findOne({
      $or: [{ email: username }, { normalized_email: normalized_username }],
    });

    if (
      user &&
      user.authenticateUser(password) &&
      (user.role === role || user.role === constants.USER_ROLE_TYPES.BOTH)
    ) {
      return user.toAuthJSON();
    }
    return null;
  }

  // Send Success Emails
// userService.js
async sendVerificationCode(user) {
  try {
    // Always create new random code
    const activationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Save new code in DB for current user
    await User.update(
      { verificationCode: activationCode },
      { where: { id: user.id } }
    );

    // Prepare message
    const clientMsg = {
      to: user.email, // always the signup email from DB
      from: ADMIN_EMAIL,
      subject: 'Activate your Queue account',
      text: `Hi ${user.firstName} ${user.lastName},\nYour activation code is: ${activationCode}`,
    };
console.log(clientMsg,"clientMsg");

    // Send mail
    sendEmail(clientMsg);
  } catch (err) {
    console.log('Error Sending Emails', err);
  }
}


  /**
   * @description Add new User
   * @param {Object} obj
   */
  // addNewUser(obj) {
  //   return new Promise(async (resolve, reject) => {
  //     try {
  //       const body = filteredBody(obj, constants.WHITELIST.user.register);
  //       body.email = String(body.email).toLowerCase();
  //       User.findOne(
  //         {
  //           $or: [
  //             {
  //               email: body.email,
  //             },
  //           ],
  //         },
  //         (err, existingUser) => {
  //           if (err) {
  //             reject(err);
  //             return;
  //           }

  //           // If user is not unique, return error
  //           if (existingUser) {
  //             reject({
  //               message: 'That email is already in use.',
  //             });
  //             return;
  //           }

  //           const verificationCode = get6DigCode();
  //           // If username is unique and password was provided, submit account
  //           const user = new User({
  //             ...body,
  //             name: body.firstName + ' ' + body.lastName,
  //             extra1: body.password,
  //             normalized_email: String(body.email).toUpperCase(),
  //             verificationCode: verificationCode,
  //             isEmailVerified: false,
  //             isOnboarding: true,
  //           });

  //           user.save(async (err2, item) => {
  //             if (err2) {
  //               reject(err2);
  //               return;
  //             }

  //             await this.sendVerificationCode(user);
  //             resolve(item.toAuthJSON());
  //           });
  //         },
  //       );
  //     } catch (e) {
  //       reject(e);
  //     }
  //   });
  // }
addNewUser(obj) {
  return new Promise(async (resolve, reject) => {
    try {
      const body = filteredBody(obj, constants.WHITELIST.user.register);
      body.email = String(body.email).toLowerCase();

      // Use Sequelize to find if the user already exists
      const existingUser = await User.findOne({ where: { email: body.email } });

      if (existingUser) {
        reject({ message: 'That email is already in use.' });
        return;
      }

      const verificationCode = get6DigCode();

      // Create the new user with Sequelize
      const user = await User.create({
        ...body,
        name: `${body.firstName} ${body.lastName}`,
        extra1: body.password,  // This is equivalent to `password` field
        normalized_email: body.email.toUpperCase(),
        verificationCode: verificationCode,
        isEmailVerified: false,
        isOnboarding: true,
      });

      await this.sendVerificationCode(user);
      resolve(user.toAuthJSON ? user.toAuthJSON() : user); // Adjust this if needed

    } catch (e) {
      reject(e);
    }
  });
}

async forgotPassword(username) {
  console.log(username,"username");
  
  const normalized_username = String(username).toUpperCase().trim();
  const token = crypto.randomBytes(32).toString("hex");

  const query = {
    $or: [{ email: username }, { normalized_email: normalized_username }],
  };

  const userResult = await User.findOne(query);
  if (!userResult) return false;

  // update token + expiry
  await User.findOneAndUpdate(query, {
    resetPasswordToken: token,
    resetPasswordExpires: Date.now() + 3600000, // 1h
  });

  const resetUrl = `https://dashboard.queue.app/reset-password?token=${token}&email=${userResult.email}`;

  console.log(resetUrl,"reseurl");
  
  const clientMsg = { 
    to: userResult.email,
    from: SMTP_USERNAME, // ✅ must match auth user
    subject: "Reset Queue password",
    text: `Hi ${userResult.firstName}, use the link to reset your password: ${resetUrl}`,
    html: `Hi ${userResult.firstName},<br/>
           <a href="${resetUrl}">Click here</a> to reset your password.<br/><br/>Queue Team`,
  };
  console.log(clientMsg,"clientMsg");
  

  // ✅ await & propagate error
  const sent = await sendEmailService.send(
    clientMsg.to,
    clientMsg.subject,
    clientMsg.text,
    clientMsg.html
  );
  console.log(sent,"sent");
  

  if (!sent) {
    throw new Error("Failed to send reset email");
  }

  return true;
}


  async resetPassword(username, password, token) {
    const normalized_username = String(username)
      .toUpperCase()
      .trim();

    const query = {
      $or: [{ email: username }, { normalized_email: normalized_username }],
      $and: [{ resetPasswordToken: token }, { resetPasswordExpires: { $gt: Date.now() } }],
    };
    const userResult = await User.findOne(query);
    if (userResult) {
      const promisResult = await new Promise(async (resolve, reject) => {
        User.findOneAndUpdate(
          query,
          { password, $unset: { resetPasswordToken: 1, resetPasswordExpires: 1 } },
          { new: true },
          async (err) => {
            if (err) reject(err);
            return resolve(true);
          },
        );
      });
      return promisResult;
    }
    throw Error('Invalid token');
  }

  // async verifyEmailCode(user_id, code) {
  //   console.log(user_id,"code",code);
    
  //   try {
  //     const user = await this.getUserRaw(user_id);
  //     if (!user) throw Error('User not exists');

  //     const condition = {
  //       _id: user_id,
  //     };
  //     const doc = {
  //       isEmailVerified: true,
  //     };
  // console.log(user.dataValues.verificationCode,code,"ghasdiahh");

  //     if (user && String(user.dataValues.verificationCode) === String(code)) {
  //       console.log("hello");
        
  //       const promisResult = await new Promise(async (resolve, reject) => {
  //         User.findOneAndUpdate(condition, doc, async (err) => {
  //           if (err) reject(err);
  //           return resolve(true);
  //         });
  //       });

  //       if (promisResult) return this.getUserRaw(user_id);
  //     }
  //     return;
  //   } catch (err) {
  //     throw err;
  //   }
  // }
async verifyEmailCode(user_id, code) {
  try {
    const user = await User.findByPk(user_id);
    if (!user) throw Error("User not exists");
    if (String(user.verificationCode) === String(code)) {
      await User.update(
        { isEmailVerified: true },
        { where: { id: user_id } }
      );
      return await User.findByPk(user_id);  // return updated user
    }

    return null; // wrong code
  } catch (err) {
    throw err;
  }
}


  // async updateUserProfile(user_id, obj) {
  //   try {
  //     const user = await this.getUser(user_id);
  //     if (!user) throw Error('User not exists');

  //     obj = {
  //       ...obj,
  //       isOnboarding: false,
  //     };
  //     const promisResult = await new Promise(async (resolve, reject) => {
  //       User.findOneAndUpdate({ _id: user_id }, obj, async (err) => {
  //         if (err) reject(err);
  //         return resolve(true);
  //       });
  //     });
  //     if (promisResult) return this.getUser(user_id);
  //   } catch (err) {
  //     throw err;
  //   }
  // }

  async updateUserProfile(user_id, obj) {
  try {
    const user = await this.getUser(user_id);
    if (!user) throw Error('User not exists');

    obj = {
      ...obj,
      isOnboarding: false,
    };

    // Update with Sequelize
    const [updatedCount] = await User.update(obj, {
      where: { id: user_id },
    });

    if (updatedCount === 0) throw Error('Update failed');

    // Return updated user
    return await this.getUser(user_id);
  } catch (err) {
    throw err;
  }
}

}

const userService = new UserService();
module.exports = userService;

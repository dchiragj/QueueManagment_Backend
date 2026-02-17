const crypto = require('crypto');
const User = require('../models/user');
const constants = require('../config/constants');
const filteredBody = require('../utils/filteredBody');
const sendEmailService = require('../utils/sendemail');
const { ADMIN_EMAIL, SMTP_USERNAME } = require('../config/env');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');
const path = require('path');
const fs = require('fs');
const Business = require('../models/business');
const DeletedUser = require('../models/deletedUser');

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
      // const user = await User.findOne({ _id: id });
      const user = await User.findOne({ where: { id } });
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
      $or: [{ email: username }, { NormalizedEmail: normalized_username }],
    });
    if (user) return user.toAuthJSON();

    return null;
  }

  async getUserByUsernameRaw(username) {
    const normalized_username = String(username)
      .toUpperCase()
      .trim();
    const user = await User.findOne({
      $or: [{ email: username }, { NormalizedEmail: normalized_username }],
    });
    return user;
  }

  // UserService
  async validateUserCredential(username, password) {
    try {
      const normalized_username = String(username).toUpperCase().trim();
      const user = await User.findOne({
        where: {
          [Op.or]: [
            { email: username },
            { NormalizedEmail: normalized_username }
          ]
        }
      });
      if (!user) {
        console.log('User not found');
        return null;
      }
      const isValid = await user.authenticateUser(password);
      // if (isValid && (user.dataValues.role === role || user.dataValues.role === 'both')) {
      //   return user.toAuthJSON();
      // }
      if (isValid) {
        return user.toAuthJSON();
      }
      return null;
    } catch (error) {
      console.error('Validation error:', error);
      return null;
    }
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
  //             NormalizedEmail: String(body.email).toUpperCase(),
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
    console.log(1234567890);

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
          NormalizedEmail: body.email.toUpperCase(),
          verificationCode: verificationCode,
          isEmailVerified: false,
          isOnboarding: true,
          // Business fields (optional unless merchant)


          // businessName: body.businessName?.trim() || null,
          // businessAddress: body.businessAddress?.trim() || null,
          // businessRegistrationNumber: body.businessRegistrationNumber?.trim() || null,
          // businessPhone: body.businessPhone?.trim() || null,
        });

        await Business.create({
          uid: user.id,
          businessName: body.businessName?.trim() || null,  // Camel
          businessAddress: body.businessAddress?.trim() || null,
          businessRegistrationNumber: body.businessRegistrationNumber?.trim() || null,
          businessPhoneNumber: body.businessPhone?.trim() || null,  // Note: body.businessPhone → businessPhoneNumber
          // Timestamps auto
        });

        await this.sendVerificationCode(user);
        resolve(user.toAuthJSON ? user.toAuthJSON() : user); // Adjust this if needed

      } catch (e) {
        reject(e);
      }
    });
  }

  // async forgotPassword(username) {
  //   console.log(username,"username");

  //   const normalized_username = String(username).toUpperCase().trim();
  //   const token = crypto.randomBytes(32).toString("hex");

  //   const query = {
  //     $or: [{ email: username }, { NormalizedEmail: normalized_username }],
  //   };

  //   console.log(query,"query");

  //   const userResult = await User.findOne({ where: query });  // 👈 fix here

  //   console.log(userResult,"userRe");

  //   if (!userResult) return false;

  //   // update token + expiry
  //   // await User.findOneAndUpdate(query, {
  //   //   resetPasswordToken: token,
  //   //   resetPasswordExpires: Date.now() + 3600000, // 1h
  //   // });
  // await User.update(
  //   {
  //     resetPasswordToken: token,
  //     resetPasswordExpires: Date.now() + 3600000, // 1h
  //   },
  //   {
  //     where: query,
  //   }
  // );
  //   const resetUrl = `https://dashboard.queue.app/reset-password?token=${token}&email=${userResult.email}`;

  //   console.log(resetUrl,"reseurl");

  //   const clientMsg = { 
  //     to: userResult.email,
  //     from: SMTP_USERNAME, // ✅ must match auth user
  //     subject: "Reset Queue password",
  //     text: `Hi ${userResult.firstName}, use the link to reset your password: ${resetUrl}`,
  //     html: `Hi ${userResult.firstName},<br/>
  //            <a href="${resetUrl}">Click here</a> to reset your password.<br/><br/>Queue Team`,
  //   };
  //   console.log(clientMsg,"clientMsg");


  //   // ✅ await & propagate error
  //   const sent = await sendEmailService.send(
  //     clientMsg.to,
  //     clientMsg.subject,
  //     clientMsg.text,
  //     clientMsg.html
  //   );
  //   console.log(sent,"sent");


  //   if (!sent) {
  //     throw new Error("Failed to send reset email");
  //   }

  //   return true;
  // }

  // async forgotPassword(username) {
  //   const normalized_username = String(username).trim();  
  //   const token = crypto.randomBytes(32).toString("hex");

  //   // Use Sequelize.Op.or for the OR condition
  //   const query = {
  //     [Op.or]: [
  //       { email: username },
  //       { NormalizedEmail: normalized_username },
  //     ],
  //   };
  //   // Find user with corrected query
  //   const userResult = await User.findOne({ where: query });
  //   if (!userResult) return false;

  //   // Update token and expiry with corrected query
  //   await User.update(
  //     {
  //       resetPasswordToken: token,
  //       resetPasswordExpires: Date.now() + 3600000, // 1h
  //     },
  //     {
  //       where: query,
  //     }
  //   );


  //   const resetUrl = `${process.env.RESET_PASS_DOMAIN}/reset-password?token=${token}&email=${userResult.email}`;

  //   const clientMsg = {
  //     to: userResult.email,
  //     from: SMTP_USERNAME, // Must match auth user
  //     subject: "Reset Queue password",
  //     text: `Hi ${userResult.firstName}, use the link to reset your password: ${resetUrl}`,
  //     html: `Hi ${userResult.firstName},<br/>
  //            <a href="${resetUrl}">Click here</a> to reset your password.<br/><br/>Queue Team`,
  //   };
  //   // Send email
  //   const sent = await sendEmailService.send(
  //     clientMsg.to,
  //     clientMsg.subject,
  //     clientMsg.text,
  //     clientMsg.html
  //   );
  //   if (!sent) {
  //     throw new Error("Failed to send reset email");
  //   }

  //   return true;
  // }
  //   async resetPassword(username, password, token) {    
  //     const normalized_username = String(username)
  //       .toUpperCase()
  //       .trim();

  //     const query = {
  //       $or: [{ email: username }, { NormalizedEmail: normalized_username }],
  //       $and: [{ resetPasswordToken: token }, { resetPasswordExpires: { $gt: Date.now() } }],
  //     };
  //     const userResult = await User.findOne(query);
  //     if (userResult) {
  //       const promisResult = await new Promise(async (resolve, reject) => {
  //         User.findOneAndUpdate(
  //           query,
  //           { password, $unset: { resetPasswordToken: 1, resetPasswordExpires: 1 } },
  //           { new: true },
  //           async (err) => {
  //             if (err) reject(err);
  //             return resolve(true);
  //           },
  //         );
  //       });
  //       return promisResult;
  //     }
  //     throw Error('Invalid token');
  //   }
  async forgotPassword(username) {
    try {
      console.log('forgotPassword called for:', username);
      const normalized_username = String(username).trim().toUpperCase();
      const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

      const query = {
        [Op.or]: [
          { email: username },
          { NormalizedEmail: normalized_username },
        ],
      };

      const userResult = await User.findOne({ where: query });
      if (!userResult) {
        console.log('User not found for forgotPassword');
        return false;
      }
      console.log('User found:', userResult.id);

      // Use standard Date object - Sequelize handles the dialect specific conversion
      const userotp = await User.update(
        {
          Otp: otp,
          OtpExpiry: sequelize.literal(
            `'${otpExpiry.toISOString().slice(0, 19).replace('T', ' ')}'`
          ),
        },
        { where: query }
      );
      console.log('User OTP updated', userotp);

      const clientMsg = {
        to: userResult.email,
        from: process.env.SMTP_USERNAME, // Ensure this env var is loaded
        subject: 'Your OTP for Password Reset',
        text: `Hi ${userResult.firstName}, your OTP for password reset is: ${otp}. It expires in 10 minutes.`,
        html: `Hi ${userResult.firstName},<br/>
             <p>Your OTP for password reset is: <strong>${otp}</strong></p>
             <p>This OTP expires in 10 minutes. Please do not share it with anyone.</p><br/>Queue Team`,
      };

      console.log('Sending email...');
      const sent = await sendEmailService.send(
        clientMsg.to,
        clientMsg.subject,
        clientMsg.text,
        clientMsg.html
      );

      if (!sent) {
        console.error('Email sending failed');
        throw new Error('Failed to send OTP email');
      }
      console.log('Email sent successfully');

      return { success: true, email: userResult.email };
    } catch (error) {
      console.error('forgotPassword error:', error);
      throw error;
    }
  }


  async verifyOtp(email, otp) {
    try {
      const normalized_username = String(email).toUpperCase().trim();
      // Use Sequelize literal to handle date comparison properly
      const userResult = await User.findOne({
        where: {
          [Op.and]: [
            { [Op.or]: [{ email }, { NormalizedEmail: normalized_username }] },
            { Otp: otp },
            sequelize.where(
              sequelize.col('OtpExpiry'),
              { [Op.gt]: sequelize.fn('GETDATE') }
            )
          ],
        },
      });
      if (!userResult) {
        throw new Error("Invalid or expired OTP");
      }

      return { success: true, userId: userResult.id };
    } catch (error) {
      console.error("verifyOtp error:", error);
      throw error;
    }
  }


  async resetPassword(email, password) {
    try {
      // Fetch user to validate OtpExpiry
      const userResult = await User.findOne({
        where: { email: email },
      });

      if (!userResult) {
        throw new Error('User not found');
      }

      // Validate OtpExpiry
      const currentTime = new Date();
      if (!userResult.OtpExpiry || userResult.OtpExpiry < currentTime) {
        throw new Error('OTP has expired or is not valid');
      }

      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Perform update with only password, leaving Otp and OtpExpiry unchanged
      const [updated] = await User.update(
        {
          password: hashedPassword,
        },
        {
          where: { email: email },
          transaction: null, // Disabled for now, enable if needed
        }
      );

      if (updated === 0) {
        const postUpdateUser = await User.findOne({ where: { email: email } });
        console.log('Post-update user data:', postUpdateUser?.toJSON() || 'Record not found');
        throw new Error('Failed to update password, possible database constraint or schema issue');
      }

      return { status: 'ok', message: 'Password updated successfully' };
    } catch (error) {
      console.error('resetPassword error:', error.message, 'Stack:', error.stack);
      throw error;
    }
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

  async updateUserProfile(user_id, obj, req) {
    try {
      // console.log('updateUserProfile input:', { user_id, obj, file });
      const user = await this.getUser(user_id);
      if (!user) throw new Error('User not exists');

      const { firstName, lastName, address, gender } = obj;

      if (!firstName) throw new Error('First name is required');
      if (!lastName) throw new Error('Last name is required');
      if (!address) throw new Error('Address is required');
      if (!gender) throw new Error('Gender is required');

      const file = req.files?.ProfileUrl;
      let profileImageUrl = null;

      if (file) {
        const uploadDir = path.join(process.cwd(), 'uploads');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        const fileName = `${Date.now()}-${file.name}`;
        const uploadPath = path.join(uploadDir, fileName);

        await file.mv(uploadPath);
        profileImageUrl = `uploads/${fileName}`;
      }

      const updateObj = {
        firstName,
        lastName,
        address,
        gender,
        isOnboarding: false,
        updatedAt: new Date(),
        ProfileUrl: profileImageUrl,
      };

      Object.keys(updateObj).forEach((key) => updateObj[key] === undefined && delete updateObj[key]);

      console.log('Updating user with:', updateObj);
      const [updatedCount] = await User.update(updateObj, {
        where: { id: user_id },
      });

      if (updatedCount === 0) {
        throw new Error('Update failed, possible database constraint or schema issue');
      }

      const updatedUser = await this.getUser(user_id);
      if (updatedUser.ProfileUrl) {
        updatedUser.ProfileUrl = updatedUser.ProfileUrl;
      }
      return updatedUser;
    } catch (err) {
      console.error('updateUserProfile error:', err.message, 'Stack:', err.stack);
      throw new Error(err.message || 'Failed to update user profile');
    }
  }

  async deleteUser(user_id) {
    const transaction = await sequelize.transaction();
    try {
      const user = await User.findByPk(user_id, { transaction });
      if (!user) throw new Error('User not found');

      const userData = user.toJSON();
      const originalUserId = userData.id;
      delete userData.id; // Let DeletedUser generate its own id

      await DeletedUser.create({
        ...userData,
        originalUserId: originalUserId,
        isDeleted: true
      }, { transaction });

      await User.destroy({ where: { id: user_id }, transaction });

      await transaction.commit();
      return true;
    } catch (err) {
      await transaction.rollback();
      console.error('deleteUser error:', err.message);
      throw err;
    }
  }

}

const userService = new UserService();
module.exports = userService;

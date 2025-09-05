const { createResponse, createError } = require('./../../utils/helpers');
const UserService = require('../../services/userService');

class AuthController {
  /**
   * @description Sign in with email and password
   */
  async signIn(req, res) {
    try {
      const { username, password, role } = req.body;
      const user = await UserService.validateUserCredential(username, password, role);
      if (user) {
        createResponse(res, 'ok', 'Login successful', user);
      } else {
        createError(res, {}, { message: 'Invalid Credentials' });
      }
    } catch (e) {
      createError(res, e);
    }
  }

  /**
   * @description signup new user
   */
  async   signUp(req, res) {
    try {
      const user = await UserService.addNewUser(req.body);
      if (user) {
        // await UserService.sendVerificationCode(user);
        createResponse(res, 'ok', 'Signup successful', user);
      } else {
        createError(res, {}, { message: 'Unable to create new user,please try again' });
      }
    } catch (e) {
      createError(res, e);
    }
  }

  /**
   * @description forgot password
   */
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      const user = await UserService.forgotPassword(email);
      
      if (user) {
        console.log(user,"user");
        createResponse(res, 'ok', 'Password sent to email');
      } else {
        createError(res, {}, { message: 'Unable to send reset password email,please try again' });
      }
    } catch (e) {
      createError(res, e);
    }
  }

  /**
   * @description reset password
   */
  async resetPassword(req, res) {
    try {
      const { email, password, token } = req.body;
      const user = await UserService.resetPassword(email, password, token);
      if (user) {
        createResponse(res, 'ok', 'Password updated successfully');
      } else {
        createError(res, {}, { message: 'Unable to reset password,please try again' });
      }
    } catch (e) {
      createError(res, e);
    }
  }

  async verificationCode(req, res) {
    try {
      const user = req.user;
      const userDetails = await UserService.getUserRaw(user.id);
      if (userDetails) {
        await UserService.sendVerificationCode(userDetails);
        return createResponse(res, 'ok', 'Verification code sent.');
      }
      createError(res, {}, { message: 'User not found' });
    } catch (e) {
      createError(res, e);
    }
  }

  async verifyEmailCode(req, res) {
  try {
    const user = req.user; // JWT payload
    const { code } = req.body;
    if (!code) {
      return createError(res, { message: "Code is required" });
    }

    const result = await UserService.verifyEmailCode(user.id, code);

    if (result) {
      return createResponse(res, "ok", "Verified successfully.");
    }

    return createError(res, {
      message: "Verification failed, please re-enter or request another code",
    });
  } catch (e) {
    return createError(res, e);
  }
}

}

const authController = new AuthController();
module.exports = authController;

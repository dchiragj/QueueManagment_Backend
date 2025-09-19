const UserService = require('../../services/userService');
const { createResponse, createError } = require('./../../utils/helpers');

class UserController {
  /**
   * @description get current user profile
   */
  async getMyProfile(req, res) {
    try {
      const { user } = req;
      if (user) {
        createResponse(res, 'ok', 'My Profile', user.toJSON());
      } else {
        createError(res, {}, { message: 'User not found' });
      }
    } catch (e) {
      createError(res, e);
    }
  }

  /**
   * @description update user
   */
  async updateUser(req, res) {
    try {
      if (req.user) {
        const result = await UserService.updateUserProfile(req.user.id, req.body,req.file);
        if (result) {
          createResponse(res, 'ok', 'User profile updated successfully', result);
        } else {
          createError(res, {}, { message: 'Unable to update user profile' });
        }
      } else {
        createError(res, {}, { message: 'User not found' });
      }
    } catch (e) {
      createError(res, e);
    }
  }
}

const userController = new UserController();
module.exports = userController;

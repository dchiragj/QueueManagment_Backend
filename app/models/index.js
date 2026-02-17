// models/associations.js
const Queue = require('./queue');
const Token = require('./token');
const User = require('./user');
const Business = require('./business');
const DeletedUser = require('./deletedUser');

// Queue -> Token
Queue.hasMany(Token, { foreignKey: 'queueId', as: 'tokens' });
Token.belongsTo(Queue, { foreignKey: 'queueId', as: 'queue' });

// Queue -> User
Queue.belongsTo(User, { foreignKey: 'uid', as: 'user' });
Queue.belongsTo(User, { foreignKey: 'merchant', as: 'merchantUser' });

// Queue -> Business
Queue.belongsTo(Business, { foreignKey: 'businessId', as: 'business' });
Business.hasMany(Queue, { foreignKey: 'businessId', as: 'queues' });

// Token -> User, Category
Token.belongsTo(User, { foreignKey: 'customerId', as: 'customer' });
// Token.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

module.exports = { Queue, Token, User, Business, DeletedUser };
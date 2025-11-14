module.exports = {
  // Admin Emails
  RADIUS: 3000, // in m
  DATE_FORMAT: 'YYYY-MMM-DD',
  ADMIN_EMAILS: [''],
  WHITELIST: {
    user: {
      register: ['firstName', 'lastName', 'email', 'password', 'mobileNumber', 'role','businessName','businessAddress','businessRegistrationNumber','businessPhone'],
      updateProfile: ['name', 'mobile'],
      updateEmail: ['email'],
      updatePassword: ['password'],
    },
  },
  USER_ROLE_TYPES: Object.freeze({
    BOTH: 'both',
    MERCHANT: 'merchant',
    CUSTOMER: 'customer',
  }),
  PS_TYPES: Object.freeze({
    NONE: 0,
    PROBLEMS: 1,
    SOLUTIONS: 2,
  }),
  QUEUE_STATUS: Object.freeze({
    NONE: 0,
    WAITING: 1,
    SERVING: 2,
    COMPLETED: 3,
    CANCELLED: 4,
  }),
  QUEUE_STATUS_NAME: Object.freeze({
    0: 'NONE',
    1: 'WAITING',
    2: 'SERVING',
    3: 'COMPLETED',
    4: 'CANCELLED',
  }),
  TOKEN_STATUS: Object.freeze({
    NONE: 0,
    WAITING: 1,
    SERVING: 2,
    POSTPONED: 3,
    OPTED_OUT: 4,
    SKIPPED: 5,
    COMPLETED: 6,
    CANCELLED: 7,
  }),
  TOKEN_STATUS_NAME: Object.freeze({
    0: 'NONE',
    1: 'WAITING',
    2: 'SERVING',
    3: 'POSTPONED',
    4: 'OPTED_OUT',
    5: 'SKIPPED',
    6: 'COMPLETED',
    7: 'CANCELLED',
  }),
  JOIN_METHODS: {
    PRIVATE: 'private',
    LINK:    'link',
    LOCATION:'location',
    QR:      'qr',
  },
};

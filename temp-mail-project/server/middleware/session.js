const session = require('koa-session2');
const config = require('../config');

module.exports = () => {
  return session({
    key: 'tempmail.sid',
    secret: config.SESSION_SECRET,
    cookie: {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    },
    rolling: true,
    renew: true
  });
};

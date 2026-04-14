require('dotenv').config();

module.exports = {
  // 服务器配置
  PORT: process.env.PORT || 3000,
  
  // 默认邮箱后缀
  DEFAULT_MAIL_SUFFIX: process.env.DEFAULT_MAIL_SUFFIX || '@tempmail.com',
  
  // IMAP 配置
  IMAP_HOST: process.env.IMAP_HOST || 'imap.example.com',
  IMAP_PORT: parseInt(process.env.IMAP_PORT) || 993,
  IMAP_USER: process.env.IMAP_USER || '',
  IMAP_PASS: process.env.IMAP_PASS || '',
  IMAP_TLS: process.env.IMAP_TLS === 'true',
  
  // 轮询间隔（毫秒）
  POLL_INTERVAL: parseInt(process.env.POLL_INTERVAL) || 60000,
  
  // Session 密钥
  SESSION_SECRET: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  
  // 验证码过期时间（分钟）
  CODE_EXPIRES_MINUTES: parseInt(process.env.CODE_EXPIRES_MINUTES) || 10
};

const Router = require('koa-router');
const tempEmailService = require('../services/tempEmailService');
const { auth } = require('../middleware/auth');

const router = new Router({ prefix: '/api/emails' });

// 创建临时邮箱
router.post('/', auth, async (ctx) => {
  try {
    const { customAddress } = ctx.request.body;
    const result = tempEmailService.createTempEmail(ctx.session.userId, customAddress);
    
    if (result.success) {
      // 自动设置为活跃邮箱
      tempEmailService.setActiveEmail(ctx.session.userId, result.emailId);
    }
    
    ctx.body = result;
  } catch (error) {
    ctx.status = 500;
    ctx.body = { success: false, message: error.message };
  }
});

// 获取用户的临时邮箱列表
router.get('/list', auth, async (ctx) => {
  try {
    const result = tempEmailService.getUserTempEmails(ctx.session.userId);
    ctx.body = result;
  } catch (error) {
    ctx.status = 500;
    ctx.body = { success: false, message: error.message };
  }
});

// 获取当前活跃邮箱
router.get('/active', auth, async (ctx) => {
  try {
    const email = tempEmailService.getActiveTempEmail(ctx.session.userId);
    ctx.body = { success: true, email };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { success: false, message: error.message };
  }
});

// 切换活跃邮箱
router.put('/active/:emailId', auth, async (ctx) => {
  try {
    const emailId = parseInt(ctx.params.emailId);
    const result = tempEmailService.setActiveEmail(ctx.session.userId, emailId);
    ctx.body = result;
  } catch (error) {
    ctx.status = 500;
    ctx.body = { success: false, message: error.message };
  }
});

// 删除临时邮箱
router.delete('/:emailId', auth, async (ctx) => {
  try {
    const emailId = parseInt(ctx.params.emailId);
    const result = tempEmailService.deleteTempEmail(ctx.session.userId, emailId);
    ctx.body = result;
  } catch (error) {
    ctx.status = 500;
    ctx.body = { success: false, message: error.message };
  }
});

// 获取邮箱的邮件列表
router.get('/:emailId/messages', auth, async (ctx) => {
  try {
    const emailId = parseInt(ctx.params.emailId);
    const page = parseInt(ctx.query.page) || 1;
    const pageSize = parseInt(ctx.query.pageSize) || 20;
    
    const result = tempEmailService.getEmailMessages(emailId, page, pageSize);
    ctx.body = result;
  } catch (error) {
    ctx.status = 500;
    ctx.body = { success: false, message: error.message };
  }
});

// 获取单封邮件详情
router.get('/messages/:messageId', auth, async (ctx) => {
  try {
    const messageId = parseInt(ctx.params.messageId);
    const result = tempEmailService.getMessage(messageId);
    ctx.body = result;
  } catch (error) {
    ctx.status = 500;
    ctx.body = { success: false, message: error.message };
  }
});

// 删除邮件
router.delete('/messages/:messageId', auth, async (ctx) => {
  try {
    const messageId = parseInt(ctx.params.messageId);
    const result = tempEmailService.deleteMessage(ctx.session.userId, messageId);
    ctx.body = result;
  } catch (error) {
    ctx.status = 500;
    ctx.body = { success: false, message: error.message };
  }
});

// 一键删除当前邮箱的所有邮件
router.delete('/:emailId/messages/all', auth, async (ctx) => {
  try {
    const emailId = parseInt(ctx.params.emailId);
    const result = tempEmailService.deleteAllMessagesForEmail(ctx.session.userId, emailId);
    ctx.body = result;
  } catch (error) {
    ctx.status = 500;
    ctx.body = { success: false, message: error.message };
  }
});

// 获取可用的邮箱后缀
router.get('/suffixes', auth, async (ctx) => {
  try {
    const suffixes = tempEmailService.getAvailableSuffixes();
    ctx.body = { success: true, suffixes };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { success: false, message: error.message };
  }
});

module.exports = router;

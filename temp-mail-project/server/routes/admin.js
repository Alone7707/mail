const Router = require('koa-router');
const userService = require('../services/userService');
const tempEmailService = require('../services/tempEmailService');
const { adminAuth } = require('../middleware/auth');

const router = new Router({ prefix: '/api/admin' });

// 获取所有用户
router.get('/users', adminAuth, async (ctx) => {
  try {
    const result = userService.getAllUsers();
    ctx.body = result;
  } catch (error) {
    ctx.status = 500;
    ctx.body = { success: false, message: error.message };
  }
});

// 删除用户
router.delete('/users/:userId', adminAuth, async (ctx) => {
  try {
    const userId = parseInt(ctx.params.userId);
    
    // 不允许删除自己
    if (userId === ctx.session.userId) {
      ctx.body = { success: false, message: '不能删除自己的账户' };
      return;
    }
    
    const result = userService.deleteUser(userId);
    ctx.body = result;
  } catch (error) {
    ctx.status = 500;
    ctx.body = { success: false, message: error.message };
  }
});

// 设置管理员权限
router.put('/users/:userId/admin', adminAuth, async (ctx) => {
  try {
    const userId = parseInt(ctx.params.userId);
    const { isAdmin } = ctx.request.body;
    
    // 不允许取消自己的管理员权限
    if (userId === ctx.session.userId && !isAdmin) {
      ctx.body = { success: false, message: '不能取消自己的管理员权限' };
      return;
    }
    
    const result = userService.setAdminStatus(userId, isAdmin);
    ctx.body = result;
  } catch (error) {
    ctx.status = 500;
    ctx.body = { success: false, message: error.message };
  }
});

// 获取所有系统配置
router.get('/configs', adminAuth, async (ctx) => {
  try {
    const result = tempEmailService.getAllSystemConfigs();
    ctx.body = result;
  } catch (error) {
    ctx.status = 500;
    ctx.body = { success: false, message: error.message };
  }
});

// 更新系统配置
router.put('/configs/:key', adminAuth, async (ctx) => {
  try {
    const key = ctx.params.key;
    const { value, description } = ctx.request.body;
    
    const result = tempEmailService.updateSystemConfig(key, value, description);
    ctx.body = result;
  } catch (error) {
    ctx.status = 500;
    ctx.body = { success: false, message: error.message };
  }
});

// 更新全局邮箱后缀
router.put('/suffixes', adminAuth, async (ctx) => {
  try {
    const { suffixes } = ctx.request.body;
    
    if (!Array.isArray(suffixes)) {
      ctx.body = { success: false, message: '后缀必须是数组格式' };
      return;
    }
    
    const result = tempEmailService.updateGlobalSuffixes(suffixes);
    ctx.body = result;
  } catch (error) {
    ctx.status = 500;
    ctx.body = { success: false, message: error.message };
  }
});

module.exports = router;

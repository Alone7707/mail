const Router = require('koa-router');
const userService = require('../services/userService');

const router = new Router({ prefix: '/api/auth' });

// 发送验证码
router.post('/send-code', async (ctx) => {
  try {
    const { email } = ctx.request.body;
    
    if (!email) {
      ctx.body = { success: false, message: '邮箱不能为空' };
      return;
    }

    const result = userService.sendVerificationCode(email);
    ctx.body = result;
  } catch (error) {
    ctx.status = 500;
    ctx.body = { success: false, message: error.message };
  }
});

// 注册
router.post('/register', async (ctx) => {
  try {
    const { username, email, password, code } = ctx.request.body;
    
    if (!username || !email || !password) {
      ctx.body = { success: false, message: '用户名、邮箱和密码不能为空' };
      return;
    }

    const result = userService.register(username, email, password, code);
    ctx.body = result;
  } catch (error) {
    ctx.status = 500;
    ctx.body = { success: false, message: error.message };
  }
});

// 登录
router.post('/login', async (ctx) => {
  try {
    const { emailOrUsername, password } = ctx.request.body;
    
    if (!emailOrUsername || !password) {
      ctx.body = { success: false, message: '请输入用户名/邮箱和密码' };
      return;
    }

    const result = userService.login(emailOrUsername, password);
    
    if (result.success) {
      // 设置 session
      ctx.session.userId = result.user.id;
      ctx.session.username = result.user.username;
      ctx.session.isAdmin = result.user.is_admin === 1;
      
      delete result.user.password;
    }
    
    ctx.body = result;
  } catch (error) {
    ctx.status = 500;
    ctx.body = { success: false, message: error.message };
  }
});

// 登出
router.post('/logout', async (ctx) => {
  ctx.session = null;
  ctx.body = { success: true, message: '已退出登录' };
});

// 获取当前用户信息
router.get('/me', async (ctx) => {
  if (!ctx.session || !ctx.session.userId) {
    ctx.body = { success: false, message: '未登录' };
    return;
  }

  const user = userService.getUserById(ctx.session.userId);
  
  if (user) {
    ctx.body = { success: true, user };
  } else {
    ctx.session = null;
    ctx.body = { success: false, message: '用户不存在' };
  }
});

// 更新用户信息
router.put('/me', async (ctx) => {
  if (!ctx.session || !ctx.session.userId) {
    ctx.body = { success: false, message: '未登录' };
    return;
  }

  const { username, email, password } = ctx.request.body;
  const result = userService.updateUser(ctx.session.userId, { username, email, password });
  
  if (result.success && username) {
    ctx.session.username = username;
  }
  
  ctx.body = result;
});

module.exports = router;

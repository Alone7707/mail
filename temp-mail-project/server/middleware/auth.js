// 认证中间件 - 检查用户是否已登录
async function auth(ctx, next) {
  if (!ctx.session || !ctx.session.userId) {
    ctx.status = 401;
    ctx.body = { success: false, message: '未登录或登录已过期' };
    return;
  }
  
  await next();
}

// 管理员中间件 - 检查用户是否是管理员
async function adminAuth(ctx, next) {
  if (!ctx.session || !ctx.session.userId) {
    ctx.status = 401;
    ctx.body = { success: false, message: '未登录或登录已过期' };
    return;
  }
  
  if (!ctx.session.isAdmin) {
    ctx.status = 403;
    ctx.body = { success: false, message: '需要管理员权限' };
    return;
  }
  
  await next();
}

module.exports = {
  auth,
  adminAuth
};

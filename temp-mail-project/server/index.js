const Koa = require('koa');
const { bodyParser } = require('@koa/bodyparser');
const cors = require('@koa/cors');
const path = require('path');
const fs = require('fs');

// 初始化数据库
require('./db/init');

const config = require('./config');
const sessionMiddleware = require('./middleware/session');
const emailService = require('./services/emailService');

// 导入路由
const authRoutes = require('./routes/auth');
const emailRoutes = require('./routes/emails');
const adminRoutes = require('./routes/admin');

const app = new Koa();

// 信任代理（用于生产环境获取真实 IP）
app.proxy = true;

// CORS
app.use(cors({
  origin: function (ctx) {
    // 允许的开发环境端口
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001'
    ];
    const requestOrigin = ctx.get('Origin');
    if (allowedOrigins.includes(requestOrigin)) {
      return requestOrigin;
    }
    return process.env.CLIENT_URL || 'http://localhost:5173';
  },
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization']
}));

// Session
app.use(sessionMiddleware());

// Body Parser
app.use(bodyParser());

// 日志中间件
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms`);
});

// 错误处理
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    console.error('Error:', error);
    ctx.status = error.status || 500;
    ctx.body = {
      success: false,
      message: error.message || '服务器内部错误'
    };
  }
});

// 注册路由
app.use(authRoutes.routes()).use(authRoutes.allowedMethods());
app.use(emailRoutes.routes()).use(emailRoutes.allowedMethods());
app.use(adminRoutes.routes()).use(adminRoutes.allowedMethods());

// 静态文件服务（生产环境）
const publicPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(publicPath)) {
  const serve = require('koa-static');
  app.use(serve(publicPath));

  // SPA 回退路由
  const historyApiFallback = require('koa2-connect-history-api-fallback');
  app.use(historyApiFallback({
    index: '/index.html',
    whiteList: ['/api']
  }));
}

// 启动服务器
const PORT = config.PORT;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);

  // 启动邮件轮询服务
  emailService.startPolling();
});

module.exports = app;

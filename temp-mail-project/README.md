# 临时邮箱系统

一个基于 Vue3 + Element Plus + Koa.js + SQLite 的临时邮箱系统。

## 功能特性

- ✅ 用户注册/登录（支持邮箱验证码）
- ✅ 自动生成临时邮箱地址
- ✅ 支持多个邮箱后缀配置
- ✅ IMAP 邮件轮询接收
- ✅ 历史邮箱记录与切换
- ✅ 邮件管理（查看、删除）
- ✅ 用户设置（修改用户名、密码）
- ✅ 管理员后台（用户管理、全局配置）

## 技术栈

**前端：**
- Vue 3
- Element Plus
- Vue Router
- Axios
- Vite

**后端：**
- Node.js
- Koa.js
- Koa Router
- Better-SQLite3
- JWT 认证
- Node IMAP

## 快速开始

### 环境要求

- Node.js >= 18.x
- pnpm 或 npm

### 安装步骤

#### 1. 克隆项目

```bash
cd temp-mail-project
```

#### 2. 安装依赖

```bash
# 安装前端依赖
cd client
npm install

# 安装后端依赖
cd ../server
npm install
```

#### 3. 配置环境变量

在 `server` 目录下创建 `.env` 文件：

```env
# 服务器配置
PORT=4000
CLIENT_URL=http://localhost:5173

# 默认邮箱后缀
DEFAULT_MAIL_SUFFIX=@tempmail.com

# IMAP 配置（用于接收邮件）
IMAP_HOST=imap.example.com
IMAP_PORT=993
IMAP_USER=your-email@example.com
IMAP_PASS=your-password
IMAP_TLS=true

# 轮询间隔（毫秒）
POLL_INTERVAL=60000

# Session 密钥
SESSION_SECRET=your-secret-key-change-in-production

# 验证码过期时间（分钟）
CODE_EXPIRES_MINUTES=10
```

#### 4. 初始化数据库

```bash
cd server
npm run init-db
```

#### 5. 启动服务

```bash
# 终端 1 - 启动后端
cd server
npm start

# 终端 2 - 启动前端
cd client
npm run dev
```

访问 http://localhost:5173 使用应用。

## 目录结构

```
temp-mail-project/
├── client/                 # 前端项目
│   ├── src/
│   │   ├── api/           # API 请求
│   │   ├── assets/        # 静态资源
│   │   ├── components/    # 组件
│   │   ├── router/        # 路由配置
│   │   ├── stores/        # Pinia 状态管理
│   │   ├── views/         # 页面视图
│   │   └── App.vue
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
└── server/                # 后端项目
    ├── config/           # 配置文件
    ├── db/              # 数据库初始化
    ├── middleware/      # 中间件
    ├── routes/          # 路由
    ├── services/        # 业务逻辑
    ├── index.js         # 入口文件
    └── package.json
```

## API 接口

### 认证相关

- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/logout` - 用户登出
- `GET /api/auth/me` - 获取当前用户信息

### 邮箱相关

- `GET /api/emails/temp` - 获取当前临时邮箱
- `POST /api/emails/temp/generate` - 生成新临时邮箱
- `GET /api/emails/history` - 获取历史邮箱列表
- `GET /api/emails/list` - 获取邮件列表
- `GET /api/emails/:id` - 获取邮件详情
- `DELETE /api/emails/:id` - 删除邮件
- `DELETE /api/emails/batch` - 批量删除邮件

### 用户设置

- `PUT /api/user/profile` - 更新用户资料
- `PUT /api/user/password` - 修改密码

### 管理员接口

- `GET /api/admin/users` - 获取用户列表
- `PUT /api/admin/users/:id/role` - 修改用户角色
- `DELETE /api/admin/users/:id` - 删除用户
- `GET /api/admin/configs` - 获取全局配置
- `POST /api/admin/configs` - 添加全局配置
- `DELETE /api/admin/configs/:id` - 删除配置

## 注意事项

1. **IMAP 配置**：需要配置有效的 IMAP 邮箱账户才能接收邮件
2. **端口占用**：如果 3000 端口被占用，可以在 `.env` 中修改 `PORT` 变量
3. **生产环境**：请修改 `SESSION_SECRET` 为随机字符串，启用 HTTPS
4. **数据库**：SQLite 数据库文件位于 `server/data/temp_mail.db`

## 开发说明

### 前端开发

```bash
cd client
npm run dev      # 开发模式
npm run build    # 构建生产版本
npm run preview  # 预览生产构建
```

### 后端开发

```bash
cd server
npm start        # 启动服务
npm run init-db  # 重新初始化数据库
```

## 常见问题

### 端口被占用

如果启动时提示端口被占用，可以：

1. 修改 `server/.env` 中的 `PORT` 值
2. 或者关闭占用端口的进程

### IMAP 登录失败

检查以下配置：
- IMAP 用户名和密码是否正确
- IMAP 服务器地址和端口是否正确
- 邮箱是否开启了 IMAP 服务
- 防火墙是否阻止了连接

### 数据库错误

如果遇到数据库相关错误，可以尝试：

```bash
cd server
rm data/temp_mail.db
npm run init-db
```

## License

ISC

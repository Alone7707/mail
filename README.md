# 临时邮箱项目 (Temp Mail)

一个基于 Vue3 + Element Plus 前端和 Node.js + Koa.js 后端的临时邮箱系统，使用 SQLite 数据库。

## 功能特性

- **用户注册/登录**：支持邮箱验证和验证码注册
- **临时邮箱生成**：自动生成临时邮箱，支持自定义后缀
- **邮件接收**：通过 IMAP 轮询获取邮件
- **历史邮箱**：查看和管理使用过的邮箱地址
- **邮件管理**：查看、删除邮件（单个或批量）
- **个人设置**：修改用户名和密码
- **管理员后台**：用户管理和全局配置

## 技术栈

### 前端
- Vue 3
- Element Plus
- Pinia (状态管理)
- Vue Router
- Axios
- Vite

### 后端
- Node.js
- Koa.js
- SQLite
- JWT 认证
- IMAP 邮件服务

## 项目结构

```
temp-mail-project/
├── client/          # 前端项目
│   ├── src/
│   │   ├── api/     # API 接口
│   │   ├── router/  # 路由配置
│   │   ├── stores/  # Pinia 状态管理
│   │   ├── views/   # 页面组件
│   │   ├── App.vue  # 根组件
│   │   └── main.js  # 入口文件
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── server/          # 后端项目
    ├── config/      # 配置文件
    ├── controllers/ # 控制器
    ├── middleware/  # 中间件
    ├── models/      # 数据模型
    ├── routes/      # 路由
    ├── services/    # 服务层
    ├── utils/       # 工具函数
    └── app.js       # 应用入口
```

## 快速开始

### 环境要求
- Node.js >= 16.x
- npm >= 8.x

### 安装步骤

#### 1. 克隆项目
```bash
cd temp-mail-project
```

#### 2. 安装后端依赖并启动
```bash
cd server
npm install
npm run dev
```

后端服务将在 http://localhost:4000 启动

#### 3. 安装前端依赖并启动（新终端）
```bash
cd client
npm install
npm run dev
```

前端服务将在 http://localhost:3000 启动

### 环境变量配置

在后端创建 `.env` 文件，配置以下环境变量：

```env
# 数据库配置
DB_PATH=./data/temp-mail.db

# JWT 配置
JWT_SECRET=your-secret-key-here

# 默认邮箱后缀
DEFAULT_MAIL_SUFFIX=@example.com

# IMAP 配置
IMAP_HOST=imap.example.com
IMAP_PORT=993
IMAP_USER=admin@example.com
IMAP_PASS=your-password
IMAP_SECURE=true

# 服务器端口
PORT=4000
```

## API 文档

### 认证相关
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/logout` - 用户登出

### 邮箱相关
- `GET /api/email/current` - 获取当前邮箱
- `POST /api/email/generate` - 生成新邮箱
- `GET /api/email/history` - 获取历史邮箱
- `POST /api/email/switch/:id` - 切换邮箱
- `DELETE /api/email/:id` - 删除邮箱

### 邮件相关
- `GET /api/mails` - 获取邮件列表
- `GET /api/mails/:id` - 获取邮件详情
- `DELETE /api/mails/:id` - 删除邮件
- `DELETE /api/mails/batch` - 批量删除邮件

### 用户设置
- `PUT /api/user/profile` - 更新用户信息
- `PUT /api/user/password` - 修改密码

### 管理员接口
- `GET /api/admin/users` - 获取所有用户
- `PUT /api/admin/users/:id` - 更新用户信息
- `DELETE /api/admin/users/:id` - 删除用户
- `GET /api/admin/configs` - 获取全局配置
- `POST /api/admin/configs` - 添加全局配置

## 使用说明

1. **注册账号**：访问首页，点击注册，填写邮箱、用户名、密码和验证码
2. **登录系统**：使用注册的账号登录
3. **生成邮箱**：登录后自动生成临时邮箱，可点击"生成新邮箱"创建更多
4. **查看邮件**：在邮件列表中查看收到的邮件，点击查看详情
5. **切换邮箱**：在历史邮箱列表中切换到其他邮箱
6. **管理邮件**：可删除单封邮件或一键清空所有邮件

## 注意事项

- 首次运行需要配置 IMAP 邮箱账户用于接收邮件
- 管理员账号需要在数据库中手动设置 `is_admin` 字段为 1
- 生产环境请修改 JWT_SECRET 为安全随机字符串
- 建议定期清理过期的临时邮箱和邮件数据

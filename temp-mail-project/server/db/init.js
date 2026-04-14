const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'tempmail.db');
const db = new Database(dbPath);

// 启用外键约束
db.pragma('foreign_keys = ON');

// 创建用户表
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    is_admin INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// 创建临时邮箱表
db.exec(`
  CREATE TABLE IF NOT EXISTS temp_emails (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    email_address TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);

// 创建邮件表
db.exec(`
  CREATE TABLE IF NOT EXISTS emails (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    temp_email_id INTEGER NOT NULL,
    from_address TEXT NOT NULL,
    subject TEXT,
    body_text TEXT,
    body_html TEXT,
    received_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_read INTEGER DEFAULT 0,
    FOREIGN KEY (temp_email_id) REFERENCES temp_emails(id) ON DELETE CASCADE
  )
`);

// 创建系统配置表
db.exec(`
  CREATE TABLE IF NOT EXISTS system_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    config_key TEXT UNIQUE NOT NULL,
    config_value TEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// 创建验证码表
db.exec(`
  CREATE TABLE IF NOT EXISTS verification_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    used INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// 插入默认管理员账户（密码为 admin123）
const bcrypt = require('bcryptjs');
const hashedPassword = bcrypt.hashSync('admin123', 10);
db.prepare(`
  INSERT OR IGNORE INTO users (username, email, password, is_admin) 
  VALUES ('admin', 'admin@example.com', ?, 1)
`).run(hashedPassword);

// 插入默认系统配置
db.exec(`
  INSERT OR IGNORE INTO system_configs (config_key, config_value, description) 
  VALUES ('global_email_suffixes', '["@tempmail.com","@quickmail.com"]', '全局邮箱后缀列表，JSON格式')
`);

console.log('Database initialized successfully!');

module.exports = db;

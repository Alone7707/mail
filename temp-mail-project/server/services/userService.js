const db = require('../db/init');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');

class UserService {
  // 用户注册
  register(username, email, password, code = null) {
    try {
      // 验证验证码（如果启用）
      if (code) {
        const verificationCode = db.prepare(`
          SELECT * FROM verification_codes 
          WHERE email = ? AND code = ? AND used = 0 AND expires_at > datetime('now')
        `).get(email, code);

        if (!verificationCode) {
          return { success: false, message: '验证码无效或已过期' };
        }

        // 标记验证码为已使用
        db.prepare(`UPDATE verification_codes SET used = 1 WHERE id = ?`).run(verificationCode.id);
      }

      // 检查用户名或邮箱是否已存在
      const existingUser = db.prepare(`
        SELECT id FROM users WHERE username = ? OR email = ?
      `).get(username, email);

      if (existingUser) {
        return { success: false, message: '用户名或邮箱已被注册' };
      }

      // 加密密码
      const hashedPassword = bcrypt.hashSync(password, 10);

      // 插入新用户
      const result = db.prepare(`
        INSERT INTO users (username, email, password) VALUES (?, ?, ?)
      `).run(username, email, hashedPassword);

      return { success: true, userId: result.lastInsertRowid };
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, message: '注册失败：' + error.message };
    }
  }

  // 用户登录
  login(emailOrUsername, password) {
    try {
      const user = db.prepare(`
        SELECT * FROM users WHERE email = ? OR username = ?
      `).get(emailOrUsername, emailOrUsername);

      if (!user) {
        return { success: false, message: '用户不存在' };
      }

      const isValid = bcrypt.compareSync(password, user.password);
      if (!isValid) {
        return { success: false, message: '密码错误' };
      }

      // 移除密码字段
      delete user.password;
      return { success: true, user };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: '登录失败：' + error.message };
    }
  }

  // 获取用户信息
  getUserById(userId) {
    try {
      const user = db.prepare(`
        SELECT id, username, email, is_admin, created_at FROM users WHERE id = ?
      `).get(userId);

      return user || null;
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  }

  // 更新用户信息
  updateUser(userId, updates) {
    try {
      const fields = [];
      const values = [];

      if (updates.username) {
        fields.push('username = ?');
        values.push(updates.username);
      }

      if (updates.email) {
        fields.push('email = ?');
        values.push(updates.email);
      }

      if (updates.password) {
        fields.push('password = ?');
        values.push(bcrypt.hashSync(updates.password, 10));
      }

      if (fields.length === 0) {
        return { success: false, message: '没有要更新的字段' };
      }

      fields.push("updated_at = datetime('now')");
      values.push(userId);

      const stmt = db.prepare(`
        UPDATE users SET ${fields.join(', ')} WHERE id = ?
      `);

      stmt.run(...values);

      return { success: true };
    } catch (error) {
      console.error('Update user error:', error);
      return { success: false, message: '更新失败：' + error.message };
    }
  }

  // 发送验证码
  sendVerificationCode(email) {
    try {
      // 生成 6 位随机码
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + config.CODE_EXPIRES_MINUTES * 60000);

      // 清除旧的未使用验证码
      db.prepare(`
        DELETE FROM verification_codes 
        WHERE email = ? AND used = 0 AND expires_at < datetime('now')
      `).run(email);

      // 插入新验证码
      db.prepare(`
        INSERT INTO verification_codes (email, code, expires_at) VALUES (?, ?, ?)
      `).run(email, code, expiresAt.toISOString().replace('T', ' ').substring(0, 19));

      // TODO: 实际项目中需要集成邮件发送服务
      console.log(`Verification code for ${email}: ${code}`);

      return { success: true, message: '验证码已发送（请查看控制台）' };
    } catch (error) {
      console.error('Send code error:', error);
      return { success: false, message: '发送验证码失败：' + error.message };
    }
  }

  // 获取所有用户（管理员）
  getAllUsers() {
    try {
      const users = db.prepare(`
        SELECT id, username, email, is_admin, created_at FROM users ORDER BY created_at DESC
      `).all();

      return { success: true, users };
    } catch (error) {
      console.error('Get all users error:', error);
      return { success: false, message: error.message };
    }
  }

  // 删除用户（管理员）
  deleteUser(userId) {
    try {
      db.prepare(`DELETE FROM users WHERE id = ?`).run(userId);
      return { success: true };
    } catch (error) {
      console.error('Delete user error:', error);
      return { success: false, message: error.message };
    }
  }

  // 设置用户管理员权限（管理员）
  setAdminStatus(userId, isAdmin) {
    try {
      db.prepare(`UPDATE users SET is_admin = ?, updated_at = datetime('now') WHERE id = ?`)
        .run(isAdmin ? 1 : 0, userId);
      return { success: true };
    } catch (error) {
      console.error('Set admin status error:', error);
      return { success: false, message: error.message };
    }
  }
}

module.exports = new UserService();

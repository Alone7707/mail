const db = require('../db/init');
const config = require('../config');

class TempEmailService {
  // 生成随机邮箱地址
  generateRandomEmail() {
    const randomStr = Math.random().toString(36).substring(2, 10);
    const timestamp = Date.now().toString(36);
    return `${randomStr}${timestamp}${config.DEFAULT_MAIL_SUFFIX}`;
  }

  // 创建临时邮箱
  createTempEmail(userId, customAddress = null) {
    try {
      let emailAddress;
      
      if (customAddress) {
        // 使用自定义地址（需要验证后缀是否合法）
        const suffixes = this.getAvailableSuffixes();
        const isValidSuffix = suffixes.some(suffix => customAddress.endsWith(suffix));
        
        if (!isValidSuffix) {
          return { success: false, message: '无效的邮箱后缀' };
        }
        emailAddress = customAddress;
      } else {
        // 自动生成
        emailAddress = this.generateRandomEmail();
      }

      // 检查是否已存在
      const existing = db.prepare(`
        SELECT id FROM temp_emails WHERE email_address = ?
      `).get(emailAddress);

      if (existing) {
        return { success: false, message: '该邮箱地址已存在' };
      }

      // 插入新邮箱
      const result = db.prepare(`
        INSERT INTO temp_emails (user_id, email_address) VALUES (?, ?)
      `).run(userId, emailAddress);

      return { 
        success: true, 
        emailId: result.lastInsertRowid,
        emailAddress 
      };
    } catch (error) {
      console.error('Create temp email error:', error);
      return { success: false, message: '创建失败：' + error.message };
    }
  }

  // 获取用户的临时邮箱列表
  getUserTempEmails(userId) {
    try {
      const emails = db.prepare(`
        SELECT * FROM temp_emails 
        WHERE user_id = ? 
        ORDER BY created_at DESC
      `).all(userId);

      return { success: true, emails };
    } catch (error) {
      console.error('Get user temp emails error:', error);
      return { success: false, message: error.message };
    }
  }

  // 获取当前活跃邮箱
  getActiveTempEmail(userId) {
    try {
      const email = db.prepare(`
        SELECT * FROM temp_emails 
        WHERE user_id = ? AND is_active = 1 
        ORDER BY created_at DESC 
        LIMIT 1
      `).get(userId);

      return email || null;
    } catch (error) {
      console.error('Get active temp email error:', error);
      return null;
    }
  }

  // 切换活跃邮箱
  setActiveEmail(userId, emailId) {
    try {
      // 先取消所有活跃状态
      db.prepare(`UPDATE temp_emails SET is_active = 0 WHERE user_id = ?`).run(userId);
      
      // 设置新的活跃邮箱
      db.prepare(`UPDATE temp_emails SET is_active = 1 WHERE id = ? AND user_id = ?`).run(emailId, userId);
      
      return { success: true };
    } catch (error) {
      console.error('Set active email error:', error);
      return { success: false, message: error.message };
    }
  }

  // 删除临时邮箱
  deleteTempEmail(userId, emailId) {
    try {
      // 检查邮箱是否属于该用户
      const email = db.prepare(`SELECT * FROM temp_emails WHERE id = ? AND user_id = ?`).get(emailId, userId);
      
      if (!email) {
        return { success: false, message: '邮箱不存在或不属于当前用户' };
      }

      // 删除邮箱（关联的邮件会级联删除）
      db.prepare(`DELETE FROM temp_emails WHERE id = ?`).run(emailId);
      
      return { success: true };
    } catch (error) {
      console.error('Delete temp email error:', error);
      return { success: false, message: error.message };
    }
  }

  // 获取邮箱的邮件列表
  getEmailMessages(emailId, page = 1, pageSize = 20) {
    try {
      const offset = (page - 1) * pageSize;
      
      const messages = db.prepare(`
        SELECT * FROM emails 
        WHERE temp_email_id = ? 
        ORDER BY received_at DESC 
        LIMIT ? OFFSET ?
      `).all(emailId, pageSize, offset);

      const total = db.prepare(`
        SELECT COUNT(*) as count FROM emails WHERE temp_email_id = ?
      `).get(emailId).count;

      return { 
        success: true, 
        messages,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      };
    } catch (error) {
      console.error('Get email messages error:', error);
      return { success: false, message: error.message };
    }
  }

  // 获取单封邮件详情
  getMessage(messageId) {
    try {
      const message = db.prepare(`SELECT * FROM emails WHERE id = ?`).get(messageId);
      
      if (!message) {
        return { success: false, message: '邮件不存在' };
      }

      // 标记为已读
      db.prepare(`UPDATE emails SET is_read = 1 WHERE id = ?`).run(messageId);

      return { success: true, message };
    } catch (error) {
      console.error('Get message error:', error);
      return { success: false, message: error.message };
    }
  }

  // 删除邮件
  deleteMessage(userId, messageId) {
    try {
      // 验证邮件是否属于用户的邮箱
      const message = db.prepare(`
        SELECT e.* FROM emails e
        JOIN temp_emails te ON e.temp_email_id = te.id
        WHERE e.id = ? AND te.user_id = ?
      `).get(messageId, userId);

      if (!message) {
        return { success: false, message: '邮件不存在或无权删除' };
      }

      db.prepare(`DELETE FROM emails WHERE id = ?`).run(messageId);
      
      return { success: true };
    } catch (error) {
      console.error('Delete message error:', error);
      return { success: false, message: error.message };
    }
  }

  // 一键删除当前邮箱的所有邮件
  deleteAllMessagesForEmail(userId, emailId) {
    try {
      // 验证邮箱是否属于用户
      const email = db.prepare(`SELECT * FROM temp_emails WHERE id = ? AND user_id = ?`).get(emailId, userId);
      
      if (!email) {
        return { success: false, message: '邮箱不存在或不属于当前用户' };
      }

      db.prepare(`DELETE FROM emails WHERE temp_email_id = ?`).run(emailId);
      
      return { success: true };
    } catch (error) {
      console.error('Delete all messages error:', error);
      return { success: false, message: error.message };
    }
  }

  // 获取可用的邮箱后缀
  getAvailableSuffixes() {
    try {
      // 从系统配置获取全局后缀
      const configRow = db.prepare(`
        SELECT config_value FROM system_configs WHERE config_key = 'global_email_suffixes'
      `).get();

      let globalSuffixes = [];
      if (configRow && configRow.config_value) {
        try {
          globalSuffixes = JSON.parse(configRow.config_value);
        } catch (e) {
          globalSuffixes = [config.DEFAULT_MAIL_SUFFIX];
        }
      } else {
        globalSuffixes = [config.DEFAULT_MAIL_SUFFIX];
      }

      return globalSuffixes;
    } catch (error) {
      console.error('Get available suffixes error:', error);
      return [config.DEFAULT_MAIL_SUFFIX];
    }
  }

  // 更新全局邮箱后缀（管理员）
  updateGlobalSuffixes(suffixes) {
    try {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO system_configs (config_key, config_value, description, updated_at)
        VALUES ('global_email_suffixes', ?, ?, datetime('now'))
      `);

      stmt.run(JSON.stringify(suffixes), '全局邮箱后缀列表，JSON 格式');
      
      return { success: true };
    } catch (error) {
      console.error('Update global suffixes error:', error);
      return { success: false, message: error.message };
    }
  }

  // 获取系统配置
  getSystemConfig(key) {
    try {
      const config = db.prepare(`SELECT * FROM system_configs WHERE config_key = ?`).get(key);
      return config || null;
    } catch (error) {
      console.error('Get system config error:', error);
      return null;
    }
  }

  // 更新系统配置（管理员）
  updateSystemConfig(key, value, description = null) {
    try {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO system_configs (config_key, config_value, description, updated_at)
        VALUES (?, ?, ?, datetime('now'))
      `);

      stmt.run(key, value, description);
      
      return { success: true };
    } catch (error) {
      console.error('Update system config error:', error);
      return { success: false, message: error.message };
    }
  }

  // 获取所有系统配置（管理员）
  getAllSystemConfigs() {
    try {
      const configs = db.prepare(`SELECT * FROM system_configs ORDER BY created_at DESC`).all();
      return { success: true, configs };
    } catch (error) {
      console.error('Get all system configs error:', error);
      return { success: false, message: error.message };
    }
  }
}

module.exports = new TempEmailService();

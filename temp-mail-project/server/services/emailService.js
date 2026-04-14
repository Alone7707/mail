const Imap = require('imap');
const { simpleParser } = require('mailparser');
const db = require('../db/init');
const config = require('../config');

class EmailService {
  constructor() {
    this.imap = null;
    this.isPolling = false;
  }

  // 连接 IMAP 服务器
  connectImap() {
    return new Promise((resolve, reject) => {
      if (!config.IMAP_USER || !config.IMAP_PASS) {
        console.log('IMAP not configured, skipping connection');
        resolve(null);
        return;
      }

      this.imap = new Imap({
        user: config.IMAP_USER,
        password: config.IMAP_PASS,
        host: config.IMAP_HOST,
        port: config.IMAP_PORT,
        tls: config.IMAP_TLS,
        tlsOptions: { servername: config.IMAP_HOST }
      });

      this.imap.once('ready', () => {
        console.log('IMAP connected successfully');
        resolve(this.imap);
      });

      this.imap.once('error', (err) => {
        console.error('IMAP error:', err);
        reject(err);
      });

      this.imap.connect();
    });
  }

  // 断开 IMAP 连接
  disconnectImap() {
    if (this.imap) {
      this.imap.end();
      this.imap = null;
      console.log('IMAP disconnected');
    }
  }

  // 轮询获取邮件
  async pollEmails() {
    if (this.isPolling || !this.imap) return;
    
    this.isPolling = true;
    
    try {
      // 获取所有活跃的临时邮箱
      const tempEmails = db.prepare(`
        SELECT id, email_address FROM temp_emails WHERE is_active = 1
      `).all();

      if (tempEmails.length === 0) {
        this.isPolling = false;
        return;
      }

      // 打开 INBOX
      this.imap.openBox('INBOX', false, async (err, box) => {
        if (err) {
          console.error('Error opening inbox:', err);
          this.isPolling = false;
          return;
        }

        // 搜索所有未读邮件
        this.imap.search(['UNSEEN'], (err, results) => {
          if (err || results.length === 0) {
            this.isPolling = false;
            return;
          }

          const fetch = this.imap.fetch(results, { bodies: '', markSeen: true });
          
          fetch.on('message', (msg, seqno) => {
            simpleParser(msg.on('data', chunk => {}), (err, parsed) => {
              if (err) {
                console.error('Error parsing email:', err);
                return;
              }

              // 检查收件人是否匹配临时邮箱
              const toAddresses = this.extractEmails(parsed.to);
              
              for (const toAddr of toAddresses) {
                const tempEmail = tempEmails.find(te => 
                  te.email_address.toLowerCase() === toAddr.toLowerCase()
                );

                if (tempEmail) {
                  // 保存邮件到数据库
                  this.saveEmail(tempEmail.id, parsed);
                }
              }
            });
          });

          fetch.once('end', () => {
            console.log(`Processed ${results.length} emails`);
            this.isPolling = false;
          });

          fetch.once('error', (err) => {
            console.error('Fetch error:', err);
            this.isPolling = false;
          });
        });
      });
    } catch (error) {
      console.error('Poll error:', error);
      this.isPolling = false;
    }
  }

  // 从地址对象中提取邮箱地址
  extractEmails(addressObj) {
    if (!addressObj) return [];
    
    if (Array.isArray(addressObj)) {
      return addressObj.map(addr => addr.address || addr);
    }
    
    return [addressObj.address || addressObj];
  }

  // 保存邮件到数据库
  saveEmail(tempEmailId, parsed) {
    try {
      const stmt = db.prepare(`
        INSERT INTO emails (temp_email_id, from_address, subject, body_text, body_html)
        VALUES (?, ?, ?, ?, ?)
      `);

      stmt.run(
        tempEmailId,
        parsed.from?.address || 'Unknown',
        parsed.subject || '',
        parsed.text || '',
        parsed.html || ''
      );

      console.log(`Email saved for temp email ID: ${tempEmailId}`);
    } catch (error) {
      console.error('Error saving email:', error);
    }
  }

  // 启动轮询服务
  startPolling() {
    if (config.IMAP_USER && config.IMAP_PASS) {
      this.connectImap().then(() => {
        // 立即执行一次
        this.pollEmails();
        
        // 定时轮询
        setInterval(() => {
          this.pollEmails();
        }, config.POLL_INTERVAL);
      }).catch(err => {
        console.error('Failed to start IMAP polling:', err);
      });
    } else {
      console.log('IMAP credentials not configured, email polling disabled');
    }
  }
}

module.exports = new EmailService();

import request from './request'

// 认证相关 API
export const authApi = {
  // 发送验证码
  sendCode(email) {
    return request.post('/auth/send-code', { email })
  },
  
  // 注册
  register(data) {
    return request.post('/auth/register', data)
  },
  
  // 登录
  login(data) {
    return request.post('/auth/login', data)
  },
  
  // 登出
  logout() {
    return request.post('/auth/logout')
  },
  
  // 获取当前用户信息
  getCurrentUser() {
    return request.get('/auth/me')
  },
  
  // 更新用户信息
  updateUserInfo(data) {
    return request.put('/auth/me', data)
  }
}

// 邮箱相关 API
export const emailApi = {
  // 创建临时邮箱
  createEmail(data) {
    return request.post('/emails', data)
  },
  
  // 获取邮箱列表
  getEmailList() {
    return request.get('/emails/list')
  },
  
  // 获取活跃邮箱
  getActiveEmail() {
    return request.get('/emails/active')
  },
  
  // 切换活跃邮箱
  setActiveEmail(emailId) {
    return request.put(`/emails/active/${emailId}`)
  },
  
  // 删除邮箱
  deleteEmail(emailId) {
    return request.delete(`/emails/${emailId}`)
  },
  
  // 获取邮件列表
  getMessages(emailId, page = 1, pageSize = 20) {
    return request.get(`/emails/${emailId}/messages`, { params: { page, pageSize } })
  },
  
  // 获取邮件详情
  getMessage(messageId) {
    return request.get(`/emails/messages/${messageId}`)
  },
  
  // 删除邮件
  deleteMessage(messageId) {
    return request.delete(`/emails/messages/${messageId}`)
  },
  
  // 一键删除所有邮件
  deleteAllMessages(emailId) {
    return request.delete(`/emails/${emailId}/messages/all`)
  },
  
  // 获取可用后缀
  getSuffixes() {
    return request.get('/emails/suffixes')
  }
}

// 管理员 API
export const adminApi = {
  // 获取所有用户
  getUsers() {
    return request.get('/admin/users')
  },
  
  // 删除用户
  deleteUser(userId) {
    return request.delete(`/admin/users/${userId}`)
  },
  
  // 设置管理员权限
  setAdminStatus(userId, isAdmin) {
    return request.put(`/admin/users/${userId}/admin`, { isAdmin })
  },
  
  // 获取系统配置
  getConfigs() {
    return request.get('/admin/configs')
  },
  
  // 更新系统配置
  updateConfig(key, data) {
    return request.put(`/admin/configs/${key}`, data)
  },
  
  // 更新全局后缀
  updateSuffixes(suffixes) {
    return request.put('/admin/suffixes', { suffixes })
  }
}

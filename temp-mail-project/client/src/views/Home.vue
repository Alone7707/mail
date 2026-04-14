<template>
  <div class="home-container">
    <!-- 顶部导航 -->
    <el-header class="header">
      <div class="header-content">
        <h1 class="logo">临时邮箱</h1>
        <div class="user-info">
          <span>{{ userStore.user?.username }}</span>
          <el-button v-if="userStore.isAdmin" @click="$router.push('/admin')" size="small">
            管理后台
          </el-button>
          <el-button @click="$router.push('/settings')" size="small">设置</el-button>
          <el-button @click="handleLogout" size="small">退出</el-button>
        </div>
      </div>
    </el-header>

    <el-main class="main-content">
      <el-row :gutter="20">
        <!-- 左侧：邮箱列表 -->
        <el-col :span="8">
          <el-card class="email-list-card">
            <template #header>
              <div class="card-header">
                <span>我的邮箱</span>
                <el-button type="primary" size="small" @click="showCreateDialog = true">
                  <el-icon><Plus /></el-icon> 新建
                </el-button>
              </div>
            </template>

            <el-empty v-if="emails.length === 0" description="暂无邮箱，创建一个吧" />
            
            <div v-else class="email-list">
              <div 
                v-for="email in emails" 
                :key="email.id"
                :class="['email-item', { active: activeEmailId === email.id }]"
                @click="switchEmail(email.id)"
              >
                <div class="email-address">{{ email.email_address }}</div>
                <div class="email-meta">
                  <span class="create-time">{{ formatDate(email.created_at) }}</span>
                  <el-button 
                    type="danger" 
                    size="small" 
                    link
                    @click.stop="deleteEmail(email.id)"
                  >
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 右侧：邮件列表 -->
        <el-col :span="16">
          <el-card class="messages-card">
            <template #header>
              <div class="card-header">
                <span v-if="activeEmail">
                  当前邮箱：{{ activeEmail.email_address }}
                  <el-button 
                    type="danger" 
                    size="small" 
                    style="margin-left: 10px"
                    @click="deleteAllMessages"
                  >
                    一键删除所有邮件
                  </el-button>
                </span>
                <span v-else>请选择或创建一个邮箱</span>
              </div>
            </template>

            <el-empty v-if="!activeEmail || messages.length === 0" description="暂无邮件" />
            
            <div v-else class="message-list">
              <div 
                v-for="msg in messages" 
                :key="msg.id"
                :class="['message-item', { unread: msg.is_read === 0 }]"
                @click="viewMessage(msg.id)"
              >
                <div class="message-from">
                  <el-icon><User /></el-icon>
                  {{ msg.from_address }}
                </div>
                <div class="message-subject">{{ msg.subject || '(无主题)' }}</div>
                <div class="message-time">{{ formatDate(msg.received_at) }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </el-main>

    <!-- 创建邮箱对话框 -->
    <el-dialog v-model="showCreateDialog" title="创建临时邮箱" width="400px">
      <el-form :model="createForm" label-width="100px">
        <el-form-item label="自定义地址">
          <el-input 
            v-model="createForm.customAddress" 
            placeholder="可选，留空则自动生成"
          />
          <div class="form-tip">可使用后缀：{{ suffixes.join(', ') }}</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="createEmail">创建</el-button>
      </template>
    </el-dialog>

    <!-- 邮件详情对话框 -->
    <el-dialog v-model="showMessageDetail" title="邮件详情" width="700px">
      <div v-if="currentMessage" class="message-detail">
        <div class="detail-row">
          <strong>发件人：</strong>{{ currentMessage.from_address }}
        </div>
        <div class="detail-row">
          <strong>主题：</strong>{{ currentMessage.subject || '(无主题)' }}
        </div>
        <div class="detail-row">
          <strong>时间：</strong>{{ formatDate(currentMessage.received_at) }}
        </div>
        <el-divider />
        <div class="message-body">
          <div v-html="currentMessage.body_html || currentMessage.body_text"></div>
        </div>
        <div class="detail-actions" style="margin-top: 20px; text-align: right;">
          <el-button type="danger" @click="deleteCurrentMessage">删除此邮件</el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { emailApi, authApi } from '@/api'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const emails = ref([])
const activeEmailId = ref(null)
const messages = ref([])
const showCreateDialog = ref(false)
const showMessageDetail = ref(false)
const currentMessage = ref(null)

const createForm = reactive({
  customAddress: ''
})

const suffixes = ref(['@tempmail.com'])

const activeEmail = computed(() => {
  return emails.value.find(e => e.id === activeEmailId.value)
})

// 加载邮箱列表
const loadEmails = async () => {
  try {
    const res = await emailApi.getEmailList()
    if (res.success) {
      emails.value = res.emails
      
      // 查找活跃邮箱
      const activeRes = await emailApi.getActiveEmail()
      if (activeRes.success && activeRes.email) {
        activeEmailId.value = activeRes.email.id
        loadMessages(activeRes.email.id)
      } else if (emails.value.length > 0) {
        activeEmailId.value = emails.value[0].id
        loadMessages(emails.value[0].id)
      }
    }
  } catch (error) {
    console.error('Load emails failed:', error)
  }
}

// 加载邮件列表
const loadMessages = async (emailId) => {
  try {
    const res = await emailApi.getMessages(emailId)
    if (res.success) {
      messages.value = res.messages
    }
  } catch (error) {
    console.error('Load messages failed:', error)
  }
}

// 加载可用后缀
const loadSuffixes = async () => {
  try {
    const res = await emailApi.getSuffixes()
    if (res.success) {
      suffixes.value = res.suffixes
    }
  } catch (error) {
    console.error('Load suffixes failed:', error)
  }
}

// 创建邮箱
const createEmail = async () => {
  try {
    const data = createForm.customAddress ? { customAddress: createForm.customAddress } : {}
    const res = await emailApi.createEmail(data)
    
    if (res.success) {
      ElMessage.success('邮箱创建成功')
      showCreateDialog.value = false
      createForm.customAddress = ''
      await loadEmails()
    } else {
      ElMessage.error(res.message || '创建失败')
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '创建失败')
  }
}

// 切换邮箱
const switchEmail = async (emailId) => {
  try {
    const res = await emailApi.setActiveEmail(emailId)
    if (res.success) {
      activeEmailId.value = emailId
      loadMessages(emailId)
    }
  } catch (error) {
    ElMessage.error('切换失败')
  }
}

// 删除邮箱
const deleteEmail = async (emailId) => {
  try {
    await ElMessageBox.confirm('确定要删除该邮箱吗？关联的邮件也将被删除', '提示', {
      type: 'warning'
    })
    
    const res = await emailApi.deleteEmail(emailId)
    if (res.success) {
      ElMessage.success('删除成功')
      await loadEmails()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 查看邮件
const viewMessage = async (messageId) => {
  try {
    const res = await emailApi.getMessage(messageId)
    if (res.success) {
      currentMessage.value = res.message
      showMessageDetail.value = true
      // 刷新邮件列表（标记已读）
      if (activeEmailId.value) {
        loadMessages(activeEmailId.value)
      }
    }
  } catch (error) {
    ElMessage.error('获取邮件详情失败')
  }
}

// 删除当前邮件
const deleteCurrentMessage = async () => {
  try {
    if (!currentMessage.value) return
    
    const res = await emailApi.deleteMessage(currentMessage.value.id)
    if (res.success) {
      ElMessage.success('删除成功')
      showMessageDetail.value = false
      currentMessage.value = null
      if (activeEmailId.value) {
        loadMessages(activeEmailId.value)
      }
    }
  } catch (error) {
    ElMessage.error('删除失败')
  }
}

// 一键删除所有邮件
const deleteAllMessages = async () => {
  try {
    if (!activeEmailId.value) return
    
    await ElMessageBox.confirm('确定要删除该邮箱的所有邮件吗？', '警告', {
      type: 'warning'
    })
    
    const res = await emailApi.deleteAllMessages(activeEmailId.value)
    if (res.success) {
      ElMessage.success('删除成功')
      messages.value = []
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 登出
const handleLogout = async () => {
  try {
    await authApi.logout()
  } catch (error) {
    // ignore
  }
  userStore.logout()
  router.push('/login')
}

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

onMounted(() => {
  loadEmails()
  loadSuffixes()
})
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  background: #f5f7fa;
}

.header {
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 0;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 60px;
  padding: 0 20px;
}

.logo {
  font-size: 20px;
  color: #667eea;
  margin: 0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.email-list-card, .messages-card {
  margin-bottom: 20px;
}

.email-list {
  max-height: 500px;
  overflow-y: auto;
}

.email-item {
  padding: 12px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: background 0.2s;
}

.email-item:hover {
  background: #f5f7fa;
}

.email-item.active {
  background: #e6f0ff;
  border-left: 3px solid #667eea;
}

.email-address {
  font-weight: 500;
  margin-bottom: 5px;
}

.email-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #999;
}

.message-list {
  max-height: 500px;
  overflow-y: auto;
}

.message-item {
  padding: 12px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: background 0.2s;
}

.message-item:hover {
  background: #f5f7fa;
}

.message-item.unread {
  background: #f0f9ff;
  font-weight: 500;
}

.message-from {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 5px;
}

.message-subject {
  color: #333;
  margin-bottom: 5px;
}

.message-time {
  font-size: 12px;
  color: #999;
}

.form-tip {
  font-size: 12px;
  color: #999;
  margin-top: 5px;
}

.message-detail {
  line-height: 1.6;
}

.detail-row {
  margin-bottom: 10px;
}

.message-body {
  margin-top: 20px;
  padding: 15px;
  background: #f9f9f9;
  border-radius: 5px;
  max-height: 400px;
  overflow-y: auto;
}
</style>

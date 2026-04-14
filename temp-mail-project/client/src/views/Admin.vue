<template>
  <div class="admin-container">
    <el-header class="header">
      <div class="header-content">
        <h1 class="logo" @click="$router.push('/')">临时邮箱 - 管理后台</h1>
        <div class="user-info">
          <span>{{ userStore.user?.username }}</span>
          <el-button @click="$router.push('/')" size="small">返回主页</el-button>
          <el-button @click="handleLogout" size="small">退出</el-button>
        </div>
      </div>
    </el-header>

    <el-main class="main-content">
      <el-tabs v-model="activeTab">
        <!-- 用户管理 -->
        <el-tab-pane label="用户管理" name="users">
          <el-table :data="users" style="width: 100%">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="username" label="用户名" />
            <el-table-column prop="email" label="邮箱" />
            <el-table-column label="管理员" width="100">
              <template #default="{ row }">
                <el-tag :type="row.is_admin ? 'success' : 'info'">
                  {{ row.is_admin ? '是' : '否' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="注册时间" />
            <el-table-column label="操作" width="200">
              <template #default="{ row }">
                <el-button 
                  size="small" 
                  @click="toggleAdmin(row)"
                >
                  {{ row.is_admin ? '取消管理员' : '设为管理员' }}
                </el-button>
                <el-button 
                  size="small" 
                  type="danger" 
                  @click="deleteUser(row.id)"
                  :disabled="row.id === userStore.user?.id"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- 系统配置 -->
        <el-tab-pane label="系统配置" name="configs">
          <el-card class="config-card">
            <template #header>
              <span>全局邮箱后缀配置</span>
            </template>
            <el-form label-width="120px">
              <el-form-item label="邮箱后缀列表">
                <el-input 
                  v-model="suffixesText" 
                  type="textarea"
                  placeholder='请输入邮箱后缀，每行一个，例如：@tempmail.com'
                  :rows="5"
                />
                <div class="form-tip">JSON 数组格式，每行一个后缀</div>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" :loading="saving" @click="saveSuffixes">保存配置</el-button>
              </el-form-item>
            </el-form>
          </el-card>
        </el-tab-pane>
      </el-tabs>
    </el-main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { adminApi, authApi } from '@/api'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const activeTab = ref('users')
const users = ref([])
const saving = ref(false)
const suffixesText = ref('')

const loadUsers = async () => {
  try {
    const res = await adminApi.getUsers()
    if (res.success) {
      users.value = res.users
    }
  } catch (error) {
    ElMessage.error('获取用户列表失败')
  }
}

const loadConfigs = async () => {
  try {
    const res = await adminApi.getConfigs()
    if (res.success) {
      const suffixConfig = res.configs.find(c => c.config_key === 'global_email_suffixes')
      if (suffixConfig && suffixConfig.config_value) {
        try {
          const suffixes = JSON.parse(suffixConfig.config_value)
          suffixesText.value = suffixes.join('\n')
        } catch (e) {
          suffixesText.value = suffixConfig.config_value
        }
      }
    }
  } catch (error) {
    console.error('Load configs failed:', error)
  }
}

const toggleAdmin = async (user) => {
  try {
    const res = await adminApi.setAdminStatus(user.id, !user.is_admin)
    if (res.success) {
      ElMessage.success('操作成功')
      loadUsers()
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '操作失败')
  }
}

const deleteUser = async (userId) => {
  try {
    await ElMessageBox.confirm('确定要删除该用户吗？', '警告', { type: 'warning' })
    
    const res = await adminApi.deleteUser(userId)
    if (res.success) {
      ElMessage.success('删除成功')
      loadUsers()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const saveSuffixes = async () => {
  saving.value = true
  try {
    const lines = suffixesText.value.split('\n').filter(s => s.trim())
    const suffixes = lines.map(s => s.trim())
    
    const res = await adminApi.updateSuffixes(suffixes)
    if (res.success) {
      ElMessage.success('保存成功')
    }
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

const handleLogout = async () => {
  try {
    await authApi.logout()
  } catch (error) {}
  userStore.logout()
  router.push('/login')
}

onMounted(() => {
  loadUsers()
  loadConfigs()
})
</script>

<style scoped>
.admin-container {
  min-height: 100vh;
  background: #f5f7fa;
}

.header {
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 0;
}

.header-content {
  max-width: 1400px;
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
  cursor: pointer;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.main-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.config-card {
  margin-top: 20px;
}

.form-tip {
  font-size: 12px;
  color: #999;
  margin-top: 5px;
}
</style>

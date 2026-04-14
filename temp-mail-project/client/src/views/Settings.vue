<template>
  <div class="settings-container">
    <el-header class="header">
      <div class="header-content">
        <h1 class="logo" @click="$router.push('/')">临时邮箱</h1>
        <div class="user-info">
          <span>{{ userStore.user?.username }}</span>
          <el-button @click="$router.push('/')" size="small">返回主页</el-button>
          <el-button @click="handleLogout" size="small">退出</el-button>
        </div>
      </div>
    </el-header>

    <el-main class="main-content">
      <el-card class="settings-card">
        <template #header>
          <span>账户设置</span>
        </template>

        <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
          <el-form-item label="用户名" prop="username">
            <el-input v-model="form.username" placeholder="请输入用户名" />
          </el-form-item>

          <el-form-item label="邮箱" prop="email">
            <el-input v-model="form.email" placeholder="请输入邮箱" />
          </el-form-item>

          <el-form-item label="新密码" prop="password">
            <el-input v-model="form.password" type="password" placeholder="留空则不修改密码" show-password />
          </el-form-item>

          <el-form-item label="确认密码" prop="confirmPassword">
            <el-input v-model="form.confirmPassword" type="password" placeholder="请再次输入新密码" show-password />
          </el-form-item>

          <el-form-item>
            <el-button type="primary" :loading="loading" @click="handleSubmit">保存修改</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </el-main>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { authApi } from '@/api'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const formRef = ref(null)
const loading = ref(false)

const form = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const validateConfirmPassword = (rule, value, callback) => {
  if (value && value !== form.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度 3-20 位', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  confirmPassword: [
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

const loadUserInfo = async () => {
  try {
    const res = await authApi.getCurrentUser()
    if (res.success) {
      form.username = res.user.username
      form.email = res.user.email
    }
  } catch (error) {
    ElMessage.error('获取用户信息失败')
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    loading.value = true
    try {
      const data = {
        username: form.username,
        email: form.email
      }
      
      if (form.password) {
        data.password = form.password
      }

      const res = await authApi.updateUserInfo(data)
      
      if (res.success) {
        ElMessage.success('修改成功')
        // 更新本地存储的用户信息
        const user = JSON.parse(localStorage.getItem('user') || '{}')
        user.username = form.username
        localStorage.setItem('user', JSON.stringify(user))
        userStore.setUser(user, localStorage.getItem('token'))
      } else {
        ElMessage.error(res.message || '修改失败')
      }
    } catch (error) {
      ElMessage.error(error.response?.data?.message || '修改失败')
    } finally {
      loading.value = false
    }
  })
}

const handleLogout = async () => {
  try {
    await authApi.logout()
  } catch (error) {
    // ignore
  }
  userStore.logout()
  router.push('/login')
}

onMounted(() => {
  loadUserInfo()
})
</script>

<style scoped>
.settings-container {
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
  cursor: pointer;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.main-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.settings-card {
  margin-top: 20px;
}
</style>

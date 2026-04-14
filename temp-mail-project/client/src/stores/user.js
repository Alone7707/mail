import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
  const token = ref(localStorage.getItem('token') || null)

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.isAdmin || false)

  function setUser(userData, userToken) {
    user.value = userData
    token.value = userToken
    
    if (userData && userToken) {
      localStorage.setItem('user', JSON.stringify(userData))
      localStorage.setItem('token', userToken)
    } else {
      localStorage.removeItem('user')
      localStorage.removeItem('token')
    }
  }

  function logout() {
    setUser(null, null)
  }

  return {
    user,
    token,
    isLoggedIn,
    isAdmin,
    setUser,
    logout
  }
})

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../utils/supabase'

export const useAuthStore = defineStore('auth', () => {
  const getCookie = (name: string) => {
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) return JSON.parse(decodeURIComponent(parts.pop()?.split(';').shift() || 'null'))
    return null
  }

  const user = ref<any>(getCookie('user_session'))

  function setUser(userData: any, remember: boolean) {
    user.value = userData
    let expires = ""
    if (remember) {
      const d = new Date()
      d.setTime(d.getTime() + (7 * 24 * 60 * 60 * 1000))
      expires = `; expires=${d.toUTCString()}`
    }
    document.cookie = `user_session=${encodeURIComponent(JSON.stringify(userData))}${expires}; path=/; SameSite=Lax`
  }

  async function refreshUser() {
    if (!user.value) return
    const { data } = await supabase
      .from('users')
      .select('id, username, sodu')
      .eq('id', user.value.id)
      .single()
    
    if (data) {
      const isRemembered = document.cookie.includes('expires=')
      setUser(data, isRemembered)
    }
  }

  function logout() {
    user.value = null
    document.cookie = "user_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
  }

  return { user, setUser, logout, refreshUser }
})


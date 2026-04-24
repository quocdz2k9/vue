<script setup lang="ts">
import { ref } from 'vue'
import { supabase } from '../utils/supabase'
import bcrypt from 'bcryptjs'
import { useToast } from "vue-toastification"
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'

const toast = useToast()
const auth = useAuthStore()
const router = useRouter()

const username = ref('')
const password = ref('')
const remember = ref(false)
const loading = ref(false)

async function handleLogin() {
  if (!username.value || !password.value) {
    toast.error('Hãy nhập đủ thông tin')
    return
  }
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username.value)
      .maybeSingle()

    if (error) throw error
    if (!data) {
      toast.error('Tài khoản không tồn tại')
      return
    }

    const match = await bcrypt.compare(password.value, data.password)
    if (!match) {
      toast.error('Mật khẩu không chính xác')
    } else {
      auth.setUser({ id: data.id, username: data.username, sodu: data.sodu }, remember.value)
      toast.success('Đăng nhập thành công')
      router.push('/') // Điều hướng về trang chủ
    }
  } catch (e: any) {
    toast.error('Lỗi: ' + e.message)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-[calc(100vh-56px)] flex items-center justify-center px-4">
    <div class="w-full max-w-[360px]">
      <div class="mb-10 text-center">
        <h2 class="text-2xl font-bold text-gray-900 uppercase tracking-tighter">Đăng nhập</h2>
        <p class="text-sm text-gray-400 mt-1">Hệ thống quản lý trực tuyến</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <div class="space-y-1">
          <label class="text-[11px] font-bold text-gray-400 uppercase ml-1">Tài khoản</label>
          <input v-model="username" :disabled="loading" class="w-full border border-gray-200 rounded px-4 py-3 focus:border-black outline-none" placeholder="tên đăng nhập" />
        </div>
        <div class="space-y-1">
          <label class="text-[11px] font-bold text-gray-400 uppercase ml-1">Mật khẩu</label>
          <input v-model="password" type="password" :disabled="loading" class="w-full border border-gray-200 rounded px-4 py-3 focus:border-black outline-none" placeholder="••••••••" />
        </div>
        <div class="flex items-center gap-2 py-1">
          <input v-model="remember" type="checkbox" id="remember" class="w-4 h-4 accent-black border-gray-200 rounded" />
          <label for="remember" class="text-xs font-bold text-gray-500 select-none cursor-pointer">Ghi nhớ đăng nhập 7 ngày</label>
        </div>
        <button type="submit" :disabled="loading" class="w-full bg-black text-white py-4 rounded font-bold text-sm uppercase tracking-widest disabled:bg-gray-200 mt-2">
          {{ loading ? 'Đang xử lý...' : 'Đăng nhập' }}
        </button>
      </form>

      <div class="mt-8 pt-6 border-t border-gray-50 text-center">
        <router-link to="/register" class="text-xs font-bold text-gray-400 uppercase tracking-tight">Chưa có tài khoản? Đăng ký</router-link>
      </div>
    </div>
  </div>
</template>


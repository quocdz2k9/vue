<script setup lang="ts">
import { ref } from 'vue'
import { supabase } from '../utils/supabase'
import bcrypt from 'bcryptjs'
import { useToast } from "vue-toastification"
import { useRouter } from 'vue-router'

const toast = useToast()
const router = useRouter()

const username = ref('')
const password = ref('')
const repassword = ref('')
const loading = ref(false)

async function handleRegister() {
  if (!username.value || !password.value || !repassword.value) {
    toast.error('Hãy nhập đủ thông tin')
    return
  }
  if (password.value !== repassword.value) {
    toast.error('Mật khẩu không trùng khớp')
    return
  }

  loading.value = true
  try {
    const { data: existing } = await supabase.from('users').select('id').eq('username', username.value).maybeSingle()
    if (existing) {
      toast.error('Tài khoản đã tồn tại')
      return
    }

    const hashedPassword = await bcrypt.hash(password.value, 10)
    const { error } = await supabase.from('users').insert({
      username: username.value,
      password: hashedPassword,
      sodu: 0,
      role: 'user'
    })

    if (error) throw error
    toast.success('Đã tạo tài khoản thành công')
    router.push('/login') // Chuyển về trang đăng nhập
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
        <h2 class="text-2xl font-bold text-gray-900 uppercase tracking-tighter">Đăng ký</h2>
        <p class="text-sm text-gray-400 mt-1">Tạo tài khoản hệ thống mới</p>
      </div>

      <form @submit.prevent="handleRegister" class="space-y-4">
        <div class="space-y-1">
          <label class="text-[11px] font-bold text-gray-400 uppercase ml-1">Tài khoản</label>
          <input v-model="username" :disabled="loading" class="w-full border border-gray-200 rounded px-4 py-3 focus:border-black outline-none" placeholder="tên đăng nhập" />
        </div>
        <div class="space-y-1">
          <label class="text-[11px] font-bold text-gray-400 uppercase ml-1">Mật khẩu</label>
          <input v-model="password" type="password" :disabled="loading" class="w-full border border-gray-200 rounded px-4 py-3 focus:border-black outline-none" placeholder="••••••••" />
        </div>
        <div class="space-y-1">
          <label class="text-[11px] font-bold text-gray-400 uppercase ml-1">Xác nhận mật khẩu</label>
          <input v-model="repassword" type="password" :disabled="loading" class="w-full border border-gray-200 rounded px-4 py-3 focus:border-black outline-none" placeholder="••••••••" />
        </div>
        <button type="submit" :disabled="loading" class="w-full bg-black text-white py-4 rounded font-bold text-sm uppercase tracking-widest disabled:bg-gray-200 mt-2">
          {{ loading ? 'Đang xử lý...' : 'Tạo tài khoản' }}
        </button>
      </form>

      <div class="mt-8 pt-6 border-t border-gray-50 text-center">
        <router-link to="/login" class="text-xs font-bold text-gray-400 uppercase tracking-tight">Đã có tài khoản? Đăng nhập</router-link>
      </div>
    </div>
  </div>
</template>


<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useToast } from "vue-toastification"
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const toast = useToast()
const router = useRouter()
const isMenuOpen = ref(false)

const handleLogout = () => {
  isMenuOpen.value = false
  auth.logout()
  toast.success("Đã đăng xuất thành công")
  router.push('/login')
}

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

const navigate = (path: string) => {
  isMenuOpen.value = false
  router.push(path)
}
</script>

<template>
  <nav class="bg-white border-b border-gray-100 fixed top-0 w-full z-50 h-14">
    <div class="max-w-7xl mx-auto px-4 h-full flex justify-between items-center">
      <router-link to="/" class="text-lg font-bold text-black tracking-tighter">HETHONG306</router-link>

      <div class="flex items-center gap-4">
        <template v-if="auth.user">
          <div class="hidden md:flex flex-col items-end">
            <span class="text-sm font-bold text-gray-900 leading-none">{{ auth.user.username }}</span>
            <span class="text-[11px] text-blue-600 font-medium mt-1">{{ auth.user.sodu?.toLocaleString() }}đ</span>
          </div>
          
          <button @click="toggleMenu" class="flex flex-col gap-1.5 p-1">
            <div class="w-6 h-0.5 bg-black transition-all" :class="{'rotate-45 translate-y-2': isMenuOpen}"></div>
            <div class="w-6 h-0.5 bg-black transition-all" :class="{'opacity-0': isMenuOpen}"></div>
            <div class="w-6 h-0.5 bg-black transition-all" :class="{'-rotate-45 -translate-y-2': isMenuOpen}"></div>
          </button>
        </template>

        <template v-else>
          <router-link to="/login" class="text-sm font-medium text-gray-500">Đăng nhập</router-link>
          <router-link to="/register" class="text-sm font-medium text-white bg-black px-4 py-1.5 rounded">Bắt đầu</router-link>
        </template>
      </div>
    </div>

    <div v-if="isMenuOpen" 
         class="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity" 
         @click="isMenuOpen = false">
    </div>

    <div class="fixed top-14 right-0 w-64 bg-white h-screen z-50 border-l border-gray-100 transition-transform duration-300"
         :class="isMenuOpen ? 'translate-x-0' : 'translate-x-full'">
      
      <div v-if="auth.user" class="p-6">
        <div class="flex items-center gap-3 mb-8 pb-6 border-b border-gray-50">
          <div class="w-10 h-10 bg-gray-100 rounded flex items-center justify-center font-bold text-gray-700 border border-gray-200">
            {{ auth.user.username.charAt(0).toUpperCase() }}
          </div>
          <div>
            <p class="text-sm font-black uppercase">{{ auth.user.username }}</p>
            <p class="text-[11px] text-blue-600 font-bold">{{ auth.user.sodu?.toLocaleString() }}đ</p>
          </div>
        </div>

        <div class="flex flex-col gap-4">
          <button @click="navigate('/')" class="text-left text-[11px] font-bold uppercase tracking-widest text-gray-400 hover:text-black">Trang chủ</button>
          <button @click="navigate('/history')" class="text-left text-[11px] font-bold uppercase tracking-widest text-gray-400 hover:text-black">Lịch sử giao dịch</button>
          <button @click="handleLogout" class="text-left text-[11px] font-bold uppercase tracking-widest text-red-500 mt-4">Đăng xuất</button>
        </div>
      </div>
    </div>
  </nav>
</template>


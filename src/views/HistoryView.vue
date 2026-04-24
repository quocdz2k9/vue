<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '../utils/supabase'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'
import { useToast } from "vue-toastification"

const auth = useAuthStore()
const router = useRouter()
const toast = useToast()
const transactions = ref<any[]>([])
const loading = ref(true)

async function fetchHistory() {
  if (!auth.user) return
  try {
    const { data } = await supabase
      .from('history')
      .select('*')
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false })
    transactions.value = data || []
  } finally { loading.value = false }
}

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text)
  toast.success("Đã copy mã!")
}

// Hàm xử lý parse JSON an toàn
const parseCodes = (rawJson: any) => {
  try {
    if (typeof rawJson === 'object') return rawJson
    return JSON.parse(rawJson)
  } catch (e) {
    return [rawJson] // Nếu không phải JSON, trả về mảng chứa text gốc
  }
}

onMounted(fetchHistory)
</script>

<template>
  <div class="min-h-screen pt-20 bg-white">
    <div class="max-w-4xl mx-auto px-4 pb-12">
      <div class="flex justify-between items-center mb-10 border-l-4 border-black pl-4">
        <div>
          <h2 class="text-xl font-black uppercase tracking-tighter">Lịch sử giao dịch</h2>
          <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Danh sách mã quà tặng đã mua</p>
        </div>
        <button @click="router.push('/')" class="text-[10px] font-black uppercase text-gray-400 border border-gray-100 px-4 py-2 rounded-lg hover:text-black transition-colors">Trang chủ</button>
      </div>

      <div v-if="loading" class="text-center py-20 text-[10px] font-bold uppercase text-gray-400 animate-pulse">Đang tải dữ liệu...</div>

      <div v-else class="space-y-6">
        <div v-for="item in transactions" :key="item.id" class="p-6 border border-gray-100 rounded-3xl bg-white shadow-sm border-b-4 border-b-gray-100">
          <div class="flex justify-between items-start mb-4">
            <div>
              <p class="text-[9px] font-black text-blue-500 uppercase tracking-widest">{{ item.game_name }}</p>
              <h4 class="font-black text-sm uppercase tracking-tighter mt-1">{{ item.package_name }}</h4>
            </div>
            <div class="text-right">
              <span class="text-sm font-black text-red-500">-{{ item.giatien.toLocaleString() }}đ</span>
              <p class="text-[9px] text-gray-300 font-bold uppercase mt-1">{{ new Date(item.created_at).toLocaleString('vi-VN') }}</p>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
            <div v-for="(code, idx) in parseCodes(item.code_text)" :key="idx" 
                 class="flex items-center justify-between bg-gray-50 border border-gray-100 p-3 rounded-xl group hover:border-blue-200 transition-colors">
              <code class="text-xs font-mono font-bold text-black truncate mr-2">{{ code }}</code>
              <button @click="copyToClipboard(code)" class="text-[10px] font-bold text-blue-500 uppercase opacity-40 group-hover:opacity-100">Copy</button>
            </div>
          </div>
        </div>

        <div v-if="transactions.length === 0" class="text-center py-24 border-2 border-dashed border-gray-50 rounded-3xl">
          <div class="text-4xl mb-4">🛒</div>
          <p class="text-[10px] font-bold uppercase tracking-widest text-gray-400">Bạn chưa thực hiện giao dịch nào</p>
        </div>
      </div>
    </div>
  </div>
</template>


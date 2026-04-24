<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '../utils/supabase'
import { useAuthStore } from '../stores/auth'
import { useToast } from "vue-toastification"

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const toast = useToast()

const game = ref<any>(null)
const packages = ref<any[]>([])
const loading = ref(true)
const buying = ref(false)
const selectedPkg = ref<any>(null)

async function fetchGameData() {
  const gameId = route.params.id
  loading.value = true
  try {
    const { data: gData } = await supabase.from('games').select('*').eq('id', gameId).single()
    if (!gData) return router.push('/')
    game.value = gData

    const { data: pData } = await supabase
      .from('packages')
      .select('*, codes(count)')
      .eq('game_id', gameId)
      .eq('codes.is_used', false)
    packages.value = pData || []
  } finally { loading.value = false }
}

async function handleBuy() {
  if (!auth.user || !selectedPkg.value) return
  if (auth.user.sodu < selectedPkg.value.giatien) return toast.error("Số dư không đủ")

  buying.value = true
  try {
    const { data: codeData, error: codeErr } = await supabase
      .from('codes').select('*').eq('package_id', selectedPkg.value.id).eq('is_used', false).limit(1).single()

    if (codeErr || !codeData) {
      toast.error("Gói này đã hết mã code!")
      return fetchGameData()
    }

    const newBalance = auth.user.sodu - selectedPkg.value.giatien
    await supabase.from('codes').update({ is_used: true }).eq('id', codeData.id)
    await supabase.from('users').update({ sodu: newBalance }).eq('id', auth.user.id)

    await supabase.from('history').insert({
      user_id: auth.user.id,
      game_name: game.value.name,
      package_name: selectedPkg.value.name,
      code_text: codeData.code_text, // Lưu JSON nguyên bản vào đây
      giatien: selectedPkg.value.giatien
    })

    auth.setUser({ ...auth.user, sodu: newBalance }, true)
    
    selectedPkg.value = null // Đóng modal xác nhận
    toast.success("Mua thành công! Đang chuyển hướng...")
    
    // Đợi 2 giây rồi chuyển trang
    setTimeout(() => {
      router.push('/history')
    }, 2000)

  } catch (e: any) {
    toast.error("Lỗi: " + e.message)
  } finally {
    buying.value = false
  }
}

onMounted(fetchGameData)
</script>

<template>
  <div class="min-h-screen pt-14 bg-white">
    <div v-if="selectedPkg" class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div class="bg-white w-full max-w-sm p-8 rounded-2xl text-center shadow-2xl border border-gray-100">
        <h3 class="text-lg font-black uppercase tracking-tighter">Xác nhận thanh toán</h3>
        <p class="text-xs text-gray-400 mt-1 uppercase font-bold">{{ selectedPkg.name }}</p>
        <div class="mt-8 mb-8 text-2xl font-black text-red-500">{{ selectedPkg.giatien.toLocaleString() }}đ</div>
        <div class="flex gap-2">
          <button @click="selectedPkg = null" :disabled="buying" class="flex-1 py-3 text-[10px] font-bold uppercase border border-gray-100 rounded-xl">Hủy</button>
          <button @click="handleBuy" :disabled="buying" class="flex-1 py-3 text-[10px] font-bold uppercase bg-black text-white rounded-xl">
            {{ buying ? 'Đang xử lý...' : 'Xác nhận' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="game" class="max-w-4xl mx-auto px-4 py-8">
      <button @click="router.push('/')" class="mb-6 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black">← DANH MỤC GAME</button>
      <div class="flex items-center gap-6 border-b border-gray-50 pb-8">
        <img :src="game.image" class="w-24 h-24 rounded-2xl border border-gray-100 shadow-sm object-cover" />
        <div>
          <h2 class="text-2xl font-black uppercase tracking-tighter">{{ game.name }}</h2>
          <p class="text-xs text-gray-400 font-bold mt-1 uppercase tracking-widest italic">Nạp tự động - Nhận code ngay</p>
        </div>
      </div>

      <div class="mt-8 space-y-3">
        <div v-for="pkg in packages" :key="pkg.id" class="p-5 border border-gray-100 rounded-2xl flex justify-between items-center">
          <div>
            <h4 class="font-bold text-sm uppercase">{{ pkg.name }}</h4>
            <p class="text-[9px] font-black text-blue-500 mt-2 uppercase tracking-tighter">Còn lại: {{ pkg.codes?.[0]?.count || 0 }}</p>
          </div>
          <div class="flex items-center gap-4">
            <div class="text-sm font-black">{{ pkg.giatien.toLocaleString() }}đ</div>
            <button @click="selectedPkg = pkg" :disabled="!pkg.codes?.[0]?.count" class="bg-black text-white px-5 py-2 rounded-lg text-[10px] font-bold uppercase disabled:bg-gray-100">Mua</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


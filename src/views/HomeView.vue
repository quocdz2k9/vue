<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { supabase } from '../utils/supabase'
import { useRouter } from 'vue-router'

const router = useRouter()
const games = ref<any[]>([])
const loading = ref(false)
const searchQuery = ref('')

async function fetchGames() {
  loading.value = true
  try {
    const { data } = await supabase.from('games').select('*').order('id', { ascending: true })
    games.value = data || []
  } finally { loading.value = false }
}

const filteredGames = computed(() => {
  return games.value.filter(game => 
    game.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

onMounted(() => { fetchGames() })
</script>

<template>
  <div class="min-h-screen pt-14 bg-white">
    <div class="max-w-7xl mx-auto px-4 py-8">
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div class="border-l-2 border-black pl-4">
          <h2 class="text-xl font-bold uppercase tracking-tighter text-black">Cửa hàng Game</h2>
          <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Chọn game để xem gói nạp</p>
        </div>
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="TÌM KIẾM GAME..." 
          class="w-full md:w-64 border-b-2 border-gray-100 focus:border-black outline-none py-2 text-[11px] font-bold uppercase tracking-widest" 
        />
      </div>

      <div v-if="loading" class="text-center py-20 text-[10px] font-bold uppercase tracking-widest text-gray-400 animate-pulse">
        Đang tải danh sách game...
      </div>

      <div v-else-if="filteredGames.length === 0" class="text-center py-20 border-2 border-dashed border-gray-50 rounded-3xl">
        <div class="text-3xl mb-2">🔍</div>
        <p class="text-[10px] font-bold uppercase tracking-widest text-gray-400">Không tìm thấy game: "{{ searchQuery }}"</p>
      </div>

      <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
        <div 
          v-for="game in filteredGames" 
          :key="game.id" 
          class="flex flex-col group cursor-pointer" 
          @click="router.push(`/game/${game.id}`)"
        >
          <div class="aspect-square bg-gray-50 border border-gray-100 rounded-2xl overflow-hidden shadow-sm group-hover:shadow-md transition-all">
            <img :src="game.image" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          </div>
          <div class="mt-3 text-center">
            <h3 class="text-[11px] font-bold text-gray-800 uppercase truncate px-1">{{ game.name }}</h3>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


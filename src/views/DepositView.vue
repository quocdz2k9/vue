<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useToast } from "vue-toastification"
import { usePayOS } from '@payos/payos-checkout'
import CryptoJS from 'crypto-js'

const auth = useAuthStore()
const toast = useToast()
const amount = ref<number>(20000)
const loading = ref(false)

// Lấy thông tin từ .env
const CLIENT_ID = import.meta.env.VITE_PAYOS_CLIENT_ID
const API_KEY = import.meta.env.VITE_PAYOS_API_KEY
const CHECKSUM_KEY = import.meta.env.VITE_PAYOS_CHECKSUM_KEY

const payosConfig = ref({
  RETURN_URL: window.location.origin + '/history',
  ELEMENT_ID: "payos-checkout-iframe",
  CHECKOUT_URL: "",
  embedded: false,
  onSuccess: (event: any) => {
    toast.success("Nạp tiền thành công!")
    auth.refreshUser()
  }
})

const { open } = usePayOS(payosConfig.value)

// Hàm tạo chữ ký Signature (Bắt buộc phải có)
function createSignature(orderCode: number, amount: number, description: string) {
  // 1. Sắp xếp dữ liệu theo thứ tự alphabet của key
  const dataStr = `amount=${amount}&cancelUrl=${window.location.origin}/deposit&description=${description}&orderCode=${orderCode}&returnUrl=${window.location.origin}/history`
  
  // 2. Mã hóa HMAC SHA256 với CHECKSUM_KEY
  return CryptoJS.HmacSHA256(dataStr, CHECKSUM_KEY).toString(CryptoJS.enc.Hex)
}

async function handleDeposit() {
  if (amount.value < 1000) return toast.error("Số tiền tối thiểu là 1.000đ")
  loading.value = true

  try {
    const orderCode = Number(Date.now().toString().slice(-6))
    const description = `NAP ${auth.user?.username || 'USER'}`
    
    // Tạo Signature
    const signature = createSignature(orderCode, amount.value, description)

    // Dữ liệu đúng chuẩn PayOS yêu cầu
    const body = {
      orderCode: orderCode,
      amount: amount.value,
      description: description,
      cancelUrl: window.location.origin + '/deposit',
      returnUrl: window.location.origin + '/history',
      signature: signature // Gắn chữ ký vào đây
    }

    const response = await fetch('https://api-merchant.payos.vn/v2/payment-requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': CLIENT_ID,
        'x-api-key': API_KEY
      },
      body: JSON.stringify(body)
    })

    const resData = await response.json()

    if (resData.code === "00") {
      payosConfig.value.CHECKOUT_URL = resData.data.checkoutUrl
      setTimeout(() => open(), 500) // Đợi 1 chút để link kịp nạp
    } else {
      toast.error("PayOS: " + resData.desc)
    }
  } catch (e: any) {
    toast.error("Lỗi: " + e.message)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen pt-20 bg-white">
    <div class="max-w-md mx-auto px-4">
      <div class="border-l-4 border-black pl-4 mb-8">
        <h2 class="text-xl font-black uppercase italic tracking-tighter">Nạp tiền VietQR</h2>
        <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tự động cộng tiền 24/7</p>
      </div>

      <div class="bg-gray-50 p-8 rounded-3xl border border-gray-100 shadow-sm">
        <div class="grid grid-cols-2 gap-3 mb-6">
          <button v-for="val in [20000, 50000, 100000, 500000]" :key="val"
            @click="amount = val"
            :class="amount === val ? 'bg-black text-white border-black' : 'bg-white text-black border-gray-200'"
            class="py-4 rounded-2xl font-black text-xs border-2 transition-all active:scale-95">
            {{ val.toLocaleString() }}đ
          </button>
        </div>

        <div class="relative mb-8">
            <input type="number" v-model="amount" 
                class="w-full p-5 bg-white border-2 border-gray-100 rounded-2xl text-center font-black text-2xl focus:border-blue-500 focus:outline-none transition-all"
                placeholder="Nhập số tiền khác...">
            <span class="absolute right-4 top-1/2 -translate-y-1/2 font-black text-gray-300">đ</span>
        </div>

        <button @click="handleDeposit" :disabled="loading"
          class="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-blue-200 active:scale-95 transition-all disabled:bg-gray-300">
          {{ loading ? 'Đang khởi tạo...' : 'Xác nhận nạp tiền' }}
        </button>

        <div class="mt-8 flex items-center justify-center gap-2 grayscale opacity-50">
            <span class="text-[9px] font-bold uppercase tracking-widest text-gray-400">Powered by PayOS</span>
        </div>
      </div>
      
      <div id="payos-checkout-iframe"></div>
    </div>
  </div>
</template>


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

// Lấy thông tin từ biến môi trường trên Vercel
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
    if (auth.refreshUser) auth.refreshUser()
  }
})

const { open } = usePayOS(payosConfig.value)

// HÀM TẠO CHỮ KÝ: Quan trọng nhất là THỨ TỰ alphabet của các key
function createSignature(orderCode: number, amount: number, description: string, cancelUrl: string, returnUrl: string) {
  // Thứ tự bắt buộc: amount -> cancelUrl -> description -> orderCode -> returnUrl
  const dataStr = `amount=${amount}&cancelUrl=${cancelUrl}&description=${description}&orderCode=${orderCode}&returnUrl=${returnUrl}`
  
  return CryptoJS.HmacSHA256(dataStr, CHECKSUM_KEY).toString(CryptoJS.enc.Hex)
}

async function handleDeposit() {
  if (amount.value < 1000) return toast.error("Số tiền tối thiểu là 1.000đ")
  if (!CLIENT_ID || !API_KEY || !CHECKSUM_KEY) return toast.error("Thiếu cấu hình API Key trên Vercel!")
  
  loading.value = true

  try {
    const orderCode = Number(Date.now().toString().slice(-6))
    const description = `NAP${orderCode}` // Description không nên quá dài hoặc có ký tự đặc biệt
    const cancelUrl = window.location.origin + '/deposit'
    const returnUrl = window.location.origin + '/history'

    // 1. Tạo Signature đúng chuẩn
    const signature = createSignature(orderCode, amount.value, description, cancelUrl, returnUrl)

    // 2. Body gửi lên PayOS
    const body = {
      orderCode,
      amount: amount.value,
      description,
      cancelUrl,
      returnUrl,
      signature
    }

    // 3. Gọi qua Proxy đã cấu hình trong vercel.json
    const response = await fetch('/payos-proxy/v2/payment-requests', {
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
      // Gán link thanh toán và mở bảng quét mã
      payosConfig.value.CHECKOUT_URL = resData.data.checkoutUrl
      // Cập nhật lại cấu hình cho PayOS SDK
      setTimeout(() => open(), 200)
    } else {
      toast.error(`Lỗi PayOS: ${resData.desc}`)
    }
  } catch (e: any) {
    toast.error("Không thể kết nối đến máy chủ thanh toán")
    console.error(e)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen pt-20 bg-gray-50">
    <div class="max-w-md mx-auto px-4">
      <div class="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-blue-100/50">
        <div class="mb-8 text-center">
          <h2 class="text-2xl font-black italic uppercase tracking-tighter text-gray-900">Nạp Tiền VietQR</h2>
          <div class="h-1.5 w-12 bg-blue-600 mx-auto mt-2 rounded-full"></div>
        </div>

        <div class="grid grid-cols-2 gap-4 mb-6">
          <button v-for="val in [20000, 50000, 100000, 500000]" :key="val"
            @click="amount = val"
            :class="amount === val ? 'bg-blue-600 text-white scale-105 shadow-lg shadow-blue-200' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'"
            class="py-4 rounded-2xl font-bold text-sm transition-all duration-300 border-2 border-transparent">
            {{ val.toLocaleString() }}đ
          </button>
        </div>

        <div class="relative mb-8 group">
          <input type="number" v-model="amount"
            class="w-full p-6 bg-gray-50 border-2 border-gray-100 rounded-3xl text-center font-black text-3xl focus:border-blue-500 focus:bg-white focus:outline-none transition-all"
            placeholder="0">
          <div class="absolute inset-y-0 right-6 flex items-center pointer-events-none">
            <span class="font-black text-gray-300 text-xl">đ</span>
          </div>
        </div>

        <button @click="handleDeposit" :disabled="loading"
          class="w-full py-6 bg-gray-900 text-white rounded-3xl font-black uppercase tracking-[0.2em] text-sm hover:bg-blue-700 active:scale-95 transition-all disabled:bg-gray-200 disabled:text-gray-400">
          <span v-if="!loading">Xác nhận nạp ngay</span>
          <span v-else class="flex items-center justify-center gap-2">
             <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
             Đang khởi tạo...
          </span>
        </button>

        <p class="text-[10px] text-center mt-6 font-bold text-gray-400 uppercase tracking-widest">
          🛡️ Giao dịch an toàn qua cổng PayOS
        </p>
      </div>
      
      <div id="payos-checkout-iframe"></div>
    </div>
  </div>
</template>


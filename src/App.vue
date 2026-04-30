<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import DataPanel from './components/DataPanel.vue'
import ChartPanel from './components/ChartPanel.vue'
import type { JsonlData } from './types'

const jsonlData = ref<JsonlData[]>([])
const filePath = ref('')
const isLoading = ref(false)
const lastUpdate = ref<Date | null>(null)
let intervalId: ReturnType<typeof setInterval> | null = null

async function loadJsonlFile(file: File) {
  isLoading.value = true
  try {
    const text = await file.text()
    const lines = text.trim().split('\n')
    jsonlData.value = lines
      .map((line, index) => {
        try {
          return { index, data: JSON.parse(line) }
        } catch {
          return { index, data: { error: 'Invalid JSON', raw: line } }
        }
      })
      .filter((item) => item.data !== null)
    lastUpdate.value = new Date()
  } catch (error) {
    console.error('Failed to load file:', error)
  } finally {
    isLoading.value = false
  }
}

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files && input.files[0]) {
    filePath.value = input.files[0].name
    loadJsonlFile(input.files[0])
  }
}

function startAutoRefresh() {
  if (intervalId) clearInterval(intervalId)
  intervalId = setInterval(async () => {
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    if (input?.files?.[0]) {
      await loadJsonlFile(input.files[0])
    }
  }, 10000)
}

function stopAutoRefresh() {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
}

function formatTime(date: Date | null): string {
  if (!date) return ''
  return date.toLocaleTimeString()
}

onMounted(() => {
  startAutoRefresh()
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<template>
  <div class="min-h-screen bg-gray-100 flex flex-col">
    <header class="bg-white shadow-sm px-6 py-4">
      <div class="flex items-center justify-between flex-wrap gap-4">
        <h1 class="text-xl font-bold text-gray-800">JSONL 文件分析器</h1>
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2">
            <label class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded cursor-pointer transition-colors">
              <span>选择文件</span>
              <input 
                type="file" 
                accept=".jsonl,.json" 
                @change="handleFileSelect" 
                class="hidden"
              />
            </label>
            <span v-if="filePath" class="text-sm text-gray-600">{{ filePath }}</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-2 h-2 rounded-full" :class="intervalId ? 'bg-green-500 animate-pulse' : 'bg-gray-400'"></div>
            <span class="text-sm text-gray-500">自动刷新 (10s)</span>
          </div>
          <div v-if="lastUpdate" class="text-sm text-gray-400">
            最后更新: {{ formatTime(lastUpdate) }}
          </div>
          <div v-if="isLoading" class="text-sm text-blue-500">
            加载中...
          </div>
        </div>
      </div>
    </header>

    <main class="flex-1 p-4 flex gap-4 min-h-0" style="height: calc(100vh - 72px);">
      <div class="flex-1 min-w-0">
        <DataPanel :data="jsonlData" />
      </div>
      <div class="flex-1 min-w-0">
        <ChartPanel :data="jsonlData" />
      </div>
    </main>
  </div>
</template>

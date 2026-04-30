<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { JsonlData } from '../types'
import JsonTree from './JsonTree.vue'

const props = defineProps<{
  data: JsonlData[]
}>()

const currentIndex = ref(0)
const collapsedPaths = ref<Set<string>>(new Set())

const currentRow = computed(() => props.data[currentIndex.value])

watch(() => props.data.length, (newLen) => {
  if (currentIndex.value >= newLen && newLen > 0) {
    currentIndex.value = newLen - 1
  }
})

// 初始化当前行的矩阵折叠状态
watch(currentRow, (row) => {
  if (row?.data) {
    initCollapsedPaths(row.data, 'root')
  }
}, { immediate: true })

function isMatrixLike(value: any): boolean {
  if (!Array.isArray(value)) return false
  if (value.length === 0) return false
  const firstNonEmpty = value.find((item: any) => Array.isArray(item) && item.length > 0)
  if (!firstNonEmpty) return false
  return Array.isArray(firstNonEmpty) && firstNonEmpty.length > 3
}

function initCollapsedPaths(obj: any, path: string) {
  if (isMatrixLike(obj)) {
    collapsedPaths.value.add(path)
  }
  if (Array.isArray(obj)) {
    obj.forEach((item, i) => {
      initCollapsedPaths(item, `${path}[${i}]`)
    })
  } else if (typeof obj === 'object' && obj !== null) {
    Object.keys(obj).forEach(key => {
      initCollapsedPaths(obj[key], `${path}.${key}`)
    })
  }
}

function toggleCollapse(path: string) {
  const newSet = new Set(collapsedPaths.value)
  if (newSet.has(path)) {
    newSet.delete(path)
  } else {
    newSet.add(path)
  }
  collapsedPaths.value = newSet
}
</script>

<template>
  <div class="h-full flex flex-col bg-white rounded-lg shadow">
    <div class="p-3 border-b flex items-center gap-4 flex-wrap">
      <label class="font-medium">行号:</label>
      <input
        v-model.number="currentIndex"
        type="number"
        :min="0"
        :max="Math.max(0, data.length - 1)"
        class="w-24 px-3 py-1.5 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <span class="text-gray-500 text-sm">共 {{ data.length }} 行</span>
      <button
        @click="currentIndex = Math.max(0, currentIndex - 1)"
        class="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
      >上一行</button>
      <button
        @click="currentIndex = Math.min(data.length - 1, currentIndex + 1)"
        class="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
      >下一行</button>
      <button
        @click="collapsedPaths = new Set()"
        class="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
      >全部展开</button>
    </div>
    
    <div class="flex-1 overflow-auto p-4 font-mono text-sm">
      <div v-if="currentRow" class="flex items-start gap-2">
        <span class="text-gray-400 select-none">{{ currentIndex + 1 }}:</span>
        <JsonTree :value="currentRow.data" path="root" :collapsed-paths="collapsedPaths" @toggle="toggleCollapse" />
      </div>
      <div v-else class="text-gray-400 text-center py-8">
        暂无数据，请选择 JSONL 文件
      </div>
    </div>
  </div>
</template>
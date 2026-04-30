<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  value: any
  path: string
  collapsedPaths: Set<string>
}>()

const emit = defineEmits<{
  toggle: [path: string]
}>()

function isMatrixLike(value: any): boolean {
  if (!Array.isArray(value)) return false
  if (value.length === 0) return false
  const firstNonEmpty = value.find((item: any) => Array.isArray(item) && item.length > 0)
  if (!firstNonEmpty) return false
  return Array.isArray(firstNonEmpty) && firstNonEmpty.length > 3
}

function isCollapsed(path: string): boolean {
  return props.collapsedPaths.has(path)
}

const isPrimitive = computed(() => {
  const v = props.value
  return v === null || v === undefined || typeof v !== 'object'
})

const isEmptyObject = computed(() => {
  const v = props.value
  return typeof v === 'object' && v !== null && Object.keys(v).length === 0
})

const isEmptyArray = computed(() => {
  return Array.isArray(props.value) && props.value.length === 0
})

const isMatrix = computed(() => isMatrixLike(props.value))

const isCollapsedMatrix = computed(() => isMatrix.value && isCollapsed(props.path))

const isExpandedMatrix = computed(() => isMatrix.value && !isCollapsed(props.path))

const isObject = computed(() => {
  return typeof props.value === 'object' && props.value !== null && !Array.isArray(props.value)
})

const isArray = computed(() => {
  return Array.isArray(props.value)
})

const keys = computed(() => {
  if (isObject.value) {
    return Object.keys(props.value)
  }
  return []
})

const arrayItems = computed(() => {
  if (Array.isArray(props.value)) {
    return props.value.map((item, i) => ({ item, index: i }))
  }
  return []
})

function toggle(path: string) {
  emit('toggle', path)
}

function formatValue(v: any): string {
  if (v === null) return 'null'
  if (v === undefined) return 'undefined'
  if (typeof v === 'string') return `"${v}"`
  return String(v)
}

function getValueClass(v: any): string {
  if (v === null) return 'text-gray-500'
  if (v === undefined) return 'text-gray-400'
  if (typeof v === 'string') return 'text-green-600'
  if (typeof v === 'number') return 'text-blue-600'
  if (typeof v === 'boolean') return 'text-orange-600'
  return ''
}
</script>

<template>
  <!-- 原始类型 -->
  <span v-if="isPrimitive" :class="getValueClass(value)">{{ formatValue(value) }}</span>
  
  <!-- 空对象 -->
  <span v-else-if="isEmptyObject">{}</span>
  
  <!-- 空数组 -->
  <span v-else-if="isEmptyArray">[]</span>
  
  <!-- 折叠的矩阵 -->
  <span 
    v-else-if="isCollapsedMatrix" 
    class="cursor-pointer text-purple-600 hover:underline"
    @click="toggle(path)"
  >
    [Array({{ value.length }}) {{ value[0]?.length || 0 }}×{{ value.length }}...] ▶
  </span>
  
  <!-- 展开的矩阵 -->
  <span v-else-if="isExpandedMatrix">
    <span class="cursor-pointer text-purple-600 hover:underline" @click="toggle(path)">▼ </span>
    <span>[</span>
    <div class="pl-4">
      <div v-for="({ item, index }) in arrayItems" :key="index">
        <span class="text-gray-400">{{ index }}: </span>
        <JsonTree 
          :value="item" 
          :path="`${path}[${index}]`" 
          :collapsed-paths="collapsedPaths"
          @toggle="toggle"
        />
      </div>
    </div>
    <span>]</span>
  </span>
  
  <!-- 普通对象 -->
  <span v-else-if="isObject">
    <span>{</span>
    <div class="pl-4">
      <div v-for="key in keys" :key="key">
        <span class="text-blue-600">{{ key }}</span>: 
        <JsonTree 
          :value="value[key]" 
          :path="`${path}.${key}`" 
          :collapsed-paths="collapsedPaths"
          @toggle="toggle"
        />
      </div>
    </div>
    <span>}</span>
  </span>
  
  <!-- 普通数组 -->
  <span v-else-if="isArray">
    <span>[</span>
    <div class="pl-4">
      <div v-for="({ item, index }) in arrayItems" :key="index">
        <span class="text-gray-400">{{ index }}: </span>
        <JsonTree 
          :value="item" 
          :path="`${path}[${index}]`" 
          :collapsed-paths="collapsedPaths"
          @toggle="toggle"
        />
      </div>
    </div>
    <span>]</span>
  </span>
  
  <!-- 回退 -->
  <span v-else>{{ String(value) }}</span>
</template>

import { useState } from 'react'
import { Typography, Input } from 'tdesign-react'
import { ChevronRightIcon, ChevronDownIcon } from 'tdesign-icons-react'

const { Text } = Typography

interface FileListProps {
  data: Array<{ lineNumber: number; data: Record<string, unknown>; raw: string }>
  selectedLine: number
  onSelectLine: (line: number) => void
  fileName: string
}

// 检查是否是全是 number 的数组
const isNumberArray = (arr: unknown[]): boolean => {
  return arr.length > 0 && arr.every(item => typeof item === 'number')
}

// 检查是否是全是 number 数组的矩阵
const isNumberMatrix = (arr: unknown[]): boolean => {
  if (arr.length === 0) return false
  const firstItem = arr[0]
  if (!Array.isArray(firstItem)) return false
  const colCount = (firstItem as unknown[]).length
  return arr.every(item => 
    Array.isArray(item) && 
    (item as unknown[]).length === colCount &&
    isNumberArray(item as unknown[])
  )
}

interface TreeNodeProps {
  keyName: string
  value: unknown
  depth: number
  defaultExpanded?: boolean
}

const TreeNode: React.FC<TreeNodeProps> = ({ keyName, value, depth, defaultExpanded = false }) => {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const isArray = Array.isArray(value)
  const isObject = value !== null && typeof value === 'object' && !isArray
  
  const getTypeLabel = () => {
    if (isArray) {
      if (isNumberMatrix(value as unknown[])) {
        const rows = (value as unknown[]).length
        const cols = ((value as unknown[])[0] as unknown[]).length
        return `number[][] [${rows}×${cols}]`
      }
      if (isNumberArray(value as unknown[])) {
        return `number[] (${(value as unknown[]).length})`
      }
      return `array[${(value as unknown[]).length}]`
    }
    if (isObject) return `object{${Object.keys(value as object).length}}`
    if (typeof value === 'string') return `string "${value.slice(0, 20)}${value.length > 20 ? '...' : ''}"`
    if (typeof value === 'number') return `number ${value}`
    if (typeof value === 'boolean') return `boolean ${value}`
    if (value === null) return 'null'
    return String(value)
  }

  const typeLabel = getTypeLabel()
  const canExpand = isArray || isObject
  const isMatrix = isArray && (isNumberArray(value as unknown[]) || isNumberMatrix(value as unknown[]))
  
  // 矩阵类型默认折叠
  const shouldExpand = canExpand && !isMatrix ? expanded : false

  return (
    <div style={{ paddingLeft: depth * 16 }}>
      <div 
        className="flex items-center gap-1 py-1 cursor-pointer hover:bg-gray-100 rounded px-1"
        onClick={() => canExpand && !isMatrix && setExpanded(!expanded)}
      >
        {canExpand && !isMatrix ? (
          shouldExpand ? (
            <ChevronDownIcon className="text-gray-400 w-4 h-4 flex-shrink-0" />
          ) : (
            <ChevronRightIcon className="text-gray-400 w-4 h-4 flex-shrink-0" />
          )
        ) : (
          <span className="w-4 h-4 flex-shrink-0" />
        )}
        <span className="text-blue-600 text-sm">{keyName}</span>
        <span className="text-gray-400 text-sm">:</span>
        <span className={`text-sm ${isMatrix ? 'text-orange-500 font-medium' : 'text-gray-600'}`}>
          {typeLabel}
        </span>
      </div>
      
      {shouldExpand && isObject && (
        <div>
          {Object.entries(value as object).map(([k, v]) => (
            <TreeNode key={k} keyName={k} value={v} depth={depth + 1} />
          ))}
        </div>
      )}
      
      {shouldExpand && isArray && !(isNumberArray(value as unknown[]) || isNumberMatrix(value as unknown[])) && (
        <div>
          {(value as unknown[]).slice(0, 10).map((item, idx) => (
            <TreeNode key={idx} keyName={`[${idx}]`} value={item} depth={depth + 1} />
          ))}
          {(value as unknown[]).length > 10 && (
            <div style={{ paddingLeft: (depth + 1) * 16 }} className="text-gray-400 text-sm py-1">
              ... 共 {(value as unknown[]).length} 项
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const FileList: React.FC<FileListProps> = ({ data, selectedLine, onSelectLine, fileName }) => {
  const [jumpToLine, setJumpToLine] = useState<string>('')
  
  const lastItem = data.length > 0 ? data[data.length - 1] : null
  const lastItemT = lastItem?.data?.t
  
  const handleJump = () => {
    const lineNum = parseInt(jumpToLine, 10)
    if (!isNaN(lineNum) && lineNum >= 1 && lineNum <= data.length) {
      onSelectLine(lineNum - 1)
      setJumpToLine('')
    }
  }

  // 获取所有唯一的 key 路径
  const allKeys = data.length > 0 
    ? [...new Set(data.flatMap(item => Object.keys(item.data)))]
    : []

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <Text strong className="text-base">{fileName || '未选择文件'}</Text>
        <div className="mt-2 space-y-1 text-sm">
          <div className="text-gray-600">
            总条目数: <span className="font-medium text-blue-600">{data.length}</span>
          </div>
          {lastItemT !== undefined && (
            <div className="text-gray-600 truncate">
              最后条目 t: <span className="font-medium text-green-600">{String(lastItemT)}</span>
            </div>
          )}
        </div>
        
        <div className="mt-3">
          <Input
            placeholder="跳转到条目 (1-n)"
            value={jumpToLine}
            onChange={(value) => setJumpToLine(String(value))}
            onEnter={() => handleJump()}
            size="small"
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-auto">
        {data.length === 0 ? (
          <div className="p-4 text-gray-500 text-center">暂无数据</div>
        ) : (
          <div className="p-3">
            <Text strong className="text-sm text-gray-600 mb-2 block">数据键值树</Text>
            <div className="bg-gray-50 rounded-lg p-2">
              {allKeys.map(key => {
                const values = data.map(item => item.data[key])
                const sampleValue = values[0]
                return (
                  <TreeNode 
                    key={key} 
                    keyName={key} 
                    value={sampleValue}
                    depth={0}
                    defaultExpanded={false}
                  />
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default FileList

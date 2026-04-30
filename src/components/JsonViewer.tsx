import { useState } from 'react'
import { Card, Tag, Space, Typography } from 'tdesign-react'
import { ChevronRightIcon, ChevronDownIcon } from 'tdesign-icons-react'

const { Text } = Typography

interface JsonViewerProps {
  data: Record<string, unknown>
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
  isLast?: boolean
}

const TreeNode: React.FC<TreeNodeProps> = ({ keyName, value, depth, isLast = false }) => {
  const [expanded, setExpanded] = useState(depth === 0 ? false : true)
  const isArray = Array.isArray(value)
  const isObject = value !== null && typeof value === 'object' && !isArray
  const isMatrix = isArray && (isNumberArray(value as unknown[]) || isNumberMatrix(value as unknown[]))
  
  const formatValue = (v: unknown): string => {
    if (v === null) return 'null'
    if (v === undefined) return 'undefined'
    if (typeof v === 'string') return `"${v}"`
    return String(v)
  }

  const getValueDisplay = () => {
    if (isArray) {
      if (isNumberMatrix(value as unknown[])) {
        const rows = (value as unknown[]).length
        const cols = ((value as unknown[])[0] as unknown[]).length
        return <span className="text-red-500 font-medium">number[][] [{rows}×{cols}]</span>
      }
      if (isNumberArray(value as unknown[])) {
        return <span className="text-orange-500 font-medium">number[] ({value.length})</span>
      }
      if ((value as unknown[]).length === 0) {
        return <span className="text-gray-400">[]</span>
      }
      return null
    }
    if (isObject) {
      const keys = Object.keys(value as object)
      if (keys.length === 0) return <span className="text-purple-400">{'{}'}</span>
      return null
    }
    return <span className={typeof value === 'string' ? 'text-green-600' : typeof value === 'number' ? 'text-blue-600' : 'text-gray-600'}>{formatValue(value)}</span>
  }

  const valueDisplay = getValueDisplay()
  const canExpand = (isArray && (value as unknown[]).length > 0) || (isObject && Object.keys(value as object).length > 0)

  return (
    <div>
      <div 
        className={`flex items-start gap-1 py-0.5 hover:bg-gray-100 rounded px-1 ${depth > 0 ? 'ml-4' : ''}`}
        onClick={() => canExpand && setExpanded(!expanded)}
        style={{ cursor: canExpand ? 'pointer' : 'default' }}
      >
        {canExpand ? (
          expanded ? (
            <ChevronDownIcon className="text-gray-400 w-3 h-3 mt-1 flex-shrink-0" />
          ) : (
            <ChevronRightIcon className="text-gray-400 w-3 h-3 mt-1 flex-shrink-0" />
          )
        ) : (
          <span className="w-3 h-3 mt-1 flex-shrink-0" />
        )}
        
        <span className="text-blue-600 text-sm">{keyName}</span>
        <span className="text-gray-400 text-sm">:</span>
        
        {valueDisplay ? (
          <span className="text-sm">{valueDisplay}</span>
        ) : (
          <span className="text-gray-400 text-sm">
            {isArray ? `[${(value as unknown[]).length}]` : `{${Object.keys(value as object).length}}`}
          </span>
        )}
      </div>
      
      {expanded && isObject && (
        <div className="border-l border-gray-200 ml-2">
          {Object.entries(value as object).map(([k, v], idx) => (
            <TreeNode 
              key={k} 
              keyName={k} 
              value={v} 
              depth={depth + 1}
              isLast={idx === Object.keys(value as object).length - 1}
            />
          ))}
        </div>
      )}
      
      {expanded && isArray && (
        <div className="border-l border-gray-200 ml-2">
          {(value as unknown[]).map((item, idx) => (
            <TreeNode 
              key={idx} 
              keyName={`[${idx}]`} 
              value={item} 
              depth={depth + 1}
              isLast={idx === (value as unknown[]).length - 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const JsonViewer: React.FC<JsonViewerProps> = ({ data }) => {
  const entries = Object.entries(data)

  const getTypeColor = (value: unknown): string => {
    if (Array.isArray(value)) return '#D3190C'
    if (value === null) return '#909FA6'
    switch (typeof value) {
      case 'string': return '#165DFF'
      case 'number': return '#FF7D00'
      case 'boolean': return '#14A9A9'
      case 'object': return '#722ED1'
      default: return '#909FA6'
    }
  }

  const getTypeLabel = (value: unknown): string => {
    if (Array.isArray(value)) {
      if (isNumberMatrix(value)) return 'matrix'
      if (isNumberArray(value)) return 'vector'
      return 'array'
    }
    if (value === null) return 'null'
    return typeof value
  }

  return (
    <Card className="w-full" bordered>
      <Space direction="vertical" size="small" className="w-full">
        <Text strong>数据结构概览</Text>
        <div className="flex flex-wrap gap-2">
          {entries.map(([key, value]) => (
            <Tag
              key={key}
              style={{ 
                backgroundColor: `${getTypeColor(value)}15`,
                color: getTypeColor(value),
                borderColor: getTypeColor(value)
              }}
            >
              {key}: {getTypeLabel(value)}
            </Tag>
          ))}
        </div>
        
        <Text strong className="mt-4">详细数据</Text>
        <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm overflow-auto max-h-[600px]">
          {entries.map(([key, value]) => (
            <TreeNode key={key} keyName={key} value={value} depth={0} />
          ))}
        </div>
      </Space>
    </Card>
  )
}

export default JsonViewer

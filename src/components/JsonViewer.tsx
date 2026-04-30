import { Card, Tag, Space, Typography } from 'tdesign-react'

const { Text } = Typography

interface JsonViewerProps {
  data: Record<string, unknown>
}

interface TypeInfo {
  key: string
  value: unknown
  type: string
  typeColor: string
}

const getTypeInfo = (key: string, value: unknown): TypeInfo => {
  let type = ''
  if (Array.isArray(value)) {
    type = 'array'
  } else if (value === null) {
    type = 'null'
  } else {
    type = typeof value
  }
  
  let typeColor = '#909FA6'
  switch (type) {
    case 'string':
      typeColor = '#165DFF'
      break
    case 'number':
      typeColor = '#FF7D00'
      break
    case 'boolean':
      typeColor = '#14A9A9'
      break
    case 'object':
      typeColor = '#722ED1'
      break
    case 'array':
      typeColor = '#D3190C'
      break
    case 'null':
      typeColor = '#909FA6'
      break
  }

  return { key, value, type, typeColor }
}

const JsonViewer: React.FC<JsonViewerProps> = ({ data }) => {
  const entries = Object.entries(data)
  const typeInfoList = entries.map(([key, value]) => getTypeInfo(key, value))

  const formatValue = (value: unknown): string => {
    if (value === null) return 'null'
    if (value === undefined) return 'undefined'
    if (typeof value === 'string') return `"${value}"`
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value)
  }

  const renderNestedValue = (value: unknown, depth: number = 0): React.ReactNode => {
    if (value === null) {
      return <span className="text-gray-500 italic">null</span>
    }
    if (value === undefined) {
      return <span className="text-gray-400 italic">undefined</span>
    }
    if (Array.isArray(value)) {
      if (value.length === 0) return <span className="text-orange-600">[]</span>
      return (
        <div className="pl-4 border-l-2 border-gray-200">
          {value.slice(0, 5).map((item, idx) => (
            <div key={idx} className="flex items-start gap-2 py-0.5">
              <span className="text-gray-400">{idx}:</span>
              {renderNestedValue(item, depth + 1)}
            </div>
          ))}
          {value.length > 5 && (
            <div className="text-gray-400 text-sm pl-4">... 共 {value.length} 项</div>
          )}
        </div>
      )
    }
    if (typeof value === 'object') {
      const keys = Object.keys(value as object)
      if (keys.length === 0) return <span className="text-purple-600">{'{}'}</span>
      return (
        <div className="pl-4 border-l-2 border-purple-200">
          {keys.slice(0, 5).map((k) => (
            <div key={k} className="flex items-start gap-2 py-0.5">
              <span className="text-purple-600">"{k}":</span>
              {renderNestedValue((value as Record<string, unknown>)[k], depth + 1)}
            </div>
          ))}
          {keys.length > 5 && (
            <div className="text-gray-400 text-sm pl-4">... 共 {keys.length} 个属性</div>
          )}
        </div>
      )
    }
    return <span>{formatValue(value)}</span>
  }

  return (
    <Card className="w-full" bordered>
      <Space direction="vertical" size="small" className="w-full">
        <Text strong>数据结构概览</Text>
        <div className="flex flex-wrap gap-2">
          {typeInfoList.map((info) => (
            <Tag
              key={info.key}
              style={{ 
                backgroundColor: `${info.typeColor}15`,
                color: info.typeColor,
                borderColor: info.typeColor
              }}
            >
              {info.key}: {info.type}
            </Tag>
          ))}
        </div>
        
        <Text strong className="mt-4">详细数据</Text>
        <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm overflow-auto max-h-96">
          {entries.map(([key, value]) => (
            <div key={key} className="flex items-start gap-2 py-1 hover:bg-gray-100 px-2 rounded">
              <span className="text-blue-600 min-w-[100px]">"{key}"</span>
              <span className="text-gray-400">:</span>
              <span className="flex-1 break-all">
                {renderNestedValue(value)}
              </span>
            </div>
          ))}
        </div>
      </Space>
    </Card>
  )
}

export default JsonViewer

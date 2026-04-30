import { Typography, Empty } from 'tdesign-react'

const { Text } = Typography

interface FileListProps {
  data: Array<{ lineNumber: number; data: Record<string, unknown>; raw: string }>
  selectedLine: number
  onSelectLine: (line: number) => void
  fileName: string
}

const FileList: React.FC<FileListProps> = ({ data, selectedLine, onSelectLine, fileName }) => {
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <Text strong>{fileName || '未选择文件'}</Text>
        <span className="block text-sm text-gray-500 mt-1">
          {data.length} 条记录
        </span>
      </div>
      
      <div className="flex-1 overflow-auto">
        {data.length === 0 ? (
          <Empty description="暂无数据" />
        ) : (
          <div className="p-2">
            {data.map((item, index) => {
              const preview = Object.entries(item.data)
                .slice(0, 2)
                .map(([k, v]) => `${k}: ${typeof v === 'string' ? v.slice(0, 20) : JSON.stringify(v)?.slice(0, 20)}`)
                .join(', ')
              
              return (
                <div
                  key={item.lineNumber}
                  onClick={() => onSelectLine(index)}
                  className={`
                    p-3 mb-2 rounded-lg cursor-pointer transition-all
                    ${selectedLine === index 
                      ? 'bg-blue-50 border-blue-200 border' 
                      : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                    }
                  `}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-medium ${selectedLine === index ? 'text-blue-600' : 'text-gray-700'}`}>
                      行 {item.lineNumber}
                    </span>
                    <span className="text-xs text-gray-400">
                      {Object.keys(item.data).length} 字段
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 block truncate">
                    {preview || '空对象'}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default FileList

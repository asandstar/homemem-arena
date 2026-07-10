import { Download, Copy, Check } from 'lucide-react'
import { useState } from 'react'

interface DownloadButtonProps {
  filename: string
  json: string
}

export function DownloadButton({ filename, json }: DownloadButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleDownload = () => {
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(json)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={handleDownload}
        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
      >
        <Download size={16} />
        下载 JSON
      </button>
      <button
        type="button"
        onClick={handleCopy}
        className="flex items-center gap-2 px-4 py-2 bg-secondary text-foreground rounded hover:bg-gray-200"
      >
        {copied ? <Check size={16} /> : <Copy size={16} />}
        {copied ? '已复制' : '复制到剪贴板'}
      </button>
    </div>
  )
}

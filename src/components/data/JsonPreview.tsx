import { useMemo } from 'react'

interface JsonPreviewProps {
  json: string
}

function highlightJson(json: string): string {
  return json
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/("(?:[^"\\]|\\.)*")/g, '<span class="text-green-400">$1</span>')
    .replace(/\b(\d+\.?\d*)\b/g, '<span class="text-orange-400">$1</span>')
    .replace(/\b(true|false|null)\b/g, '<span class="text-purple-400">$1</span>')
    .replace(/([{}[\]])/g, '<span class="text-cyan-400">$1</span>')
}

export function JsonPreview({ json }: JsonPreviewProps) {
  const highlighted = useMemo(() => highlightJson(json), [json])

  return (
    <pre
      className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto text-sm max-h-[500px] font-mono leading-relaxed"
      dangerouslySetInnerHTML={{ __html: highlighted }}
    />
  )
}

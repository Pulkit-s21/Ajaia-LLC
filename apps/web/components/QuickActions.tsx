import { Plus, Upload } from "lucide-react"
import { useRef } from "react"

type Props = {
  createDoc: () => void
  handleImport: React.ChangeEventHandler<HTMLInputElement>
}

export default function QuickActions({ createDoc, handleImport }: Props) {
  const importRef = useRef<HTMLInputElement>(null)
  const supportedFiles = [".md, .tsx, .docx"]

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6 sm:mb-8">
      <button
        onClick={createDoc}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm"
      >
        <Plus size={16} />
        New document
      </button>
      <button
        onClick={() => importRef.current?.click()}
        className="flex items-center gap-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
      >
        <Upload size={16} />
        Import file
      </button>
      <input
        ref={importRef}
        type="file"
        accept=".txt,.md,.docx"
        className="hidden"
        onChange={handleImport}
      />
      <span className="text-xs text-gray-500 hidden sm:block">
        Supported: {supportedFiles}
      </span>
    </div>
  )
}

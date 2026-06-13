import { FileText } from "lucide-react"

export default function Brand() {
  return (
    <div className="flex flex-col items-center mb-8">
      <div className="flex items-center gap-2 mb-2">
        <FileText className="text-blue-600" size={32} />
        <span className="text-2xl sm:text-3xl font-bold text-gray-900">
          Ajaia Docs
        </span>
      </div>
      <p className="text-gray-600 text-sm">Collaborative document editing</p>
    </div>
  )
}

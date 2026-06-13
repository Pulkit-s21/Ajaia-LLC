import { Trash2, Paperclip } from "lucide-react"
import { docsApi, Document } from "@/lib/api"
import toast from "react-hot-toast"

type Props = {
  doc: Document
  canEdit: boolean
  setDoc: React.Dispatch<React.SetStateAction<Document | null>>
}

export default function Attachments({ doc, canEdit, setDoc }: Props) {
  async function handleDeleteAttachment(attachmentId: string) {
    try {
      await docsApi.deleteAttachment(doc.id, attachmentId)
      setDoc((prev) =>
        prev
          ? {
              ...prev,
              attachments: prev.attachments.filter(
                (a) => a.id !== attachmentId,
              ),
            }
          : prev,
      )
      toast.success("Attachment deleted")
    } catch {
      toast.error("Failed to delete attachment")
    }
  }
  return (
    <>
      {doc.attachments.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Paperclip size={12} />
            Attachments
          </p>
          <div className="flex flex-wrap gap-2">
            {doc.attachments.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-1.5 text-xs text-blue-700 border border-blue-200 bg-blue-50 rounded-lg px-3 py-1.5 font-medium"
              >
                <Paperclip size={11} />
                <a
                  href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/uploads/${a.filename}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {a.originalName}
                </a>
                {canEdit && (
                  <button
                    onClick={() => handleDeleteAttachment(a.id)}
                    className="ml-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete attachment"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

import { useRouter } from "next/navigation"
import { ArrowLeft, Share2, Upload, Loader2, Check, Save } from "lucide-react"
import { useRef } from "react"

type SaveState = "saved" | "saving" | "unsaved"

type Props = {
  canEdit: boolean
  isOwner: boolean
  title: string
  saveState: SaveState
  setShowShare: (show: boolean) => void
  handleAttachment: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

function SaveIndicator({ saveState }: { saveState: SaveState }) {
  if (saveState === "saving")
    return (
      <span className="flex items-center gap-1 text-xs text-gray-500">
        <Loader2 size={13} className="animate-spin" />
        <span className="hidden sm:inline">Saving…</span>
      </span>
    )
  if (saveState === "saved")
    return (
      <span className="flex items-center gap-1 text-xs text-gray-500">
        <Check size={13} className="text-green-600" />
        <span className="hidden sm:inline">Saved</span>
      </span>
    )
  return (
    <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
      <Save size={13} />
      <span className="hidden sm:inline">Unsaved</span>
    </span>
  )
}

export default function DocNavbar({
  canEdit,
  isOwner,
  title,
  saveState,
  setShowShare,
  handleAttachment,
  handleTitleChange,
}: Props) {
  const router = useRouter()
  const attachRef = useRef<HTMLInputElement>(null)

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
        <button
          onClick={() => router.push("/dashboard")}
          className="text-gray-500 hover:text-gray-800 transition-colors p-1 rounded hover:bg-gray-100"
        >
          <ArrowLeft size={18} />
        </button>

        {canEdit ? (
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            className="flex-1 font-semibold text-gray-900 bg-transparent border-none outline-none text-base placeholder-gray-400 truncate"
            placeholder="Document title"
          />
        ) : (
          <span className="flex-1 font-semibold text-gray-900 truncate">
            {title}
          </span>
        )}

        <div className="flex items-center gap-2 ml-auto shrink-0">
          <SaveIndicator saveState={saveState} />

          {!isOwner && (
            <span className="text-xs text-gray-600 font-medium border border-gray-300 bg-gray-50 rounded px-2 py-0.5 hidden sm:block">
              {canEdit ? "Can edit" : "View only"}
            </span>
          )}

          {canEdit && (
            <>
              <button
                onClick={() => attachRef.current?.click()}
                className="flex items-center gap-1.5 text-sm text-gray-700 hover:text-gray-900 border border-gray-300 hover:border-gray-400 hover:bg-gray-50 p-2 sm:px-3 sm:py-1.5 rounded-lg transition-all"
                title="Attach file"
              >
                <Upload size={14} />
                <span className="hidden sm:inline">Attach</span>
              </button>
              <input
                ref={attachRef}
                type="file"
                accept=".txt,.md,.doc,.docx"
                className="hidden"
                onChange={handleAttachment}
              />
            </>
          )}

          {isOwner && (
            <button
              onClick={() => setShowShare(true)}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm p-2 sm:px-3 sm:py-1.5 rounded-lg transition-colors font-semibold"
            >
              <Share2 size={14} />
              <span className="hidden sm:inline">Share</span>
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

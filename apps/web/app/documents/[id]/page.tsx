"use client"

import { useEffect, useState, useCallback, useRef, lazy } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { docsApi, Document } from "@/lib/api"
import { Loader2 } from "lucide-react"
import dynamic from "next/dynamic"
import toast from "react-hot-toast"
import ShareModal from "@/components/ShareModal"

const DocNavbar = lazy(() => import("@/components/DocNavbar"))
const Attachments = lazy(() => import("@/components/Attachments"))

const RichEditor = dynamic(() => import("@/components/RichEditor"), {
  ssr: false,
})

type SaveState = "saved" | "saving" | "unsaved"

export default function DocumentPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const { user, loading: authLoading } = useAuth()
  const [doc, setDoc] = useState<Document | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [canEdit, setCanEdit] = useState(false)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [saveState, setSaveState] = useState<SaveState>("saved")
  const [showShare, setShowShare] = useState(false)
  const [fetching, setFetching] = useState(true)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!authLoading && !user) router.replace("/")
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user) return
    docsApi
      .get(id)
      .then((res) => {
        setDoc(res.data.document)
        setTitle(res.data.document.title)
        setContent(res.data.document.content)
        setIsOwner(res.data.isOwner)
        setCanEdit(res.data.permission === "edit")
      })
      .catch(() => {
        toast.error("Document not found or access denied")
        router.push("/dashboard")
      })
      .finally(() => setFetching(false))
  }, [id, user])

  const save = useCallback(
    async (t: string, c: string) => {
      setSaveState("saving")
      try {
        await docsApi.update(id, { title: t, content: c })
        setSaveState("saved")
      } catch {
        setSaveState("unsaved")
        toast.error("Failed to save")
      }
    },
    [id],
  )

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setTitle(val)
    setSaveState("unsaved")
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => save(val, content), 1500)
  }

  function handleContentChange(html: string) {
    setContent(html)
    setSaveState("unsaved")
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => save(title, html), 1500)
  }

  async function handleAttachment(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const toastId = toast.loading("Uploading…")
    try {
      const res = await docsApi.uploadAttachment(id, file)
      setDoc((prev) =>
        prev
          ? { ...prev, attachments: [...prev.attachments, res.data.attachment] }
          : prev,
      )
      toast.success("File attached", { id: toastId })
      if (res.data.importedContent) {
        if (confirm("Import file content into this document?")) {
          const merged = content + "\n" + res.data.importedContent
          setContent(merged)
          save(title, merged)
        }
      }
    } catch {
      toast.error("Upload failed", { id: toastId })
    }
    e.target.value = ""
  }

  if (authLoading || fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        <Loader2 className="animate-spin" size={28} />
      </div>
    )
  }

  if (!doc) return null

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Navbar */}
      <DocNavbar
        canEdit={canEdit}
        isOwner={isOwner}
        title={title}
        saveState={saveState}
        setShowShare={setShowShare}
        handleAttachment={handleAttachment}
        handleTitleChange={handleTitleChange}
      />

      <main className="flex-1 max-w-4xl w-full mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Attachments */}
        <Attachments doc={doc} canEdit={canEdit} setDoc={setDoc} />

        {/* Editor area */}
        <RichEditor
          content={content}
          onChange={handleContentChange}
          editable={canEdit}
        />
      </main>

      {showShare && (
        <ShareModal docId={id} onClose={() => setShowShare(false)} />
      )}
    </div>
  )
}

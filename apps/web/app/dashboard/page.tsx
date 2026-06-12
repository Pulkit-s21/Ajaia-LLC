"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { docsApi } from "@/lib/api"
import { FileText, Trash2, Users, Clock, Paperclip } from "lucide-react"
import { Grid } from "react-window"
import type { CellComponentProps } from "react-window"
import { AutoSizer } from "react-virtualized-auto-sizer"
import { useDashboardHelper } from "../hooks/dashboard"
import Navbar from "../../components/Navbar"
import QuickActions from "../../components/QuickActions"
import toast from "react-hot-toast"

interface Doc {
  id: string
  title: string
  updatedAt: string
  owner: { id: string; name: string; email: string }
  permission?: string
  attachments: [
    {
      id: string
      documentId: string
      filename: string
      originalName: string
      mimeType: string
      size: number
      createdAt: string
    },
  ]
}

type OwnedCellProps = {
  docs: Doc[]
  columnCount: number
  onNavigate: (id: string) => void
  onDelete: (id: string, e: React.MouseEvent) => void
  onFormat: (iso: string) => string
}

function OwnedDocCell({
  rowIndex,
  columnIndex,
  style,
  docs,
  columnCount,
  onNavigate,
  onDelete,
  onFormat,
}: CellComponentProps<OwnedCellProps>) {
  const doc = docs[rowIndex * columnCount + columnIndex]
  if (!doc) return <div style={style} />
  return (
    <div style={{ ...style, padding: 6 }}>
      <div
        onClick={() => onNavigate(doc.id)}
        className="h-full bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all group flex flex-col justify-between"
      >
        <div className="min-w-0 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <FileText size={18} className="text-blue-500 shrink-0 mt-0.5" />
              <p className="font-medium text-gray-900 truncate text-sm">
                {doc.title}
              </p>
            </div>
            <div className="">
              <button
                onClick={(e) => onDelete(doc.id, e)}
                className="opacity-100 sm:group-hover:opacity-100 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all p-1.5 rounded"
                title="Delete"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <Clock size={11} />
            {onFormat(doc.updatedAt)} . {doc.owner.name}
          </p>
          <p className="text-base text-blue-700 flex items-center gap-1">
            {doc.attachments.length ? <Paperclip size={14} /> : ""}
            {doc.attachments?.length ? doc.attachments.length : ""}
          </p>
        </div>
      </div>
    </div>
  )
}

type SharedCellProps = {
  docs: Doc[]
  columnCount: number
  onNavigate: (id: string) => void
}

function SharedDocCell({
  rowIndex,
  columnIndex,
  style,
  docs,
  columnCount,
  onNavigate,
}: CellComponentProps<SharedCellProps>) {
  const doc = docs[rowIndex * columnCount + columnIndex]
  if (!doc) return <div style={style} />
  return (
    <div style={{ ...style, padding: 6 }}>
      <div
        onClick={() => onNavigate(doc.id)}
        className="h-full bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:border-purple-300 hover:shadow-sm transition-all flex flex-col justify-between"
      >
        <div className="min-w-0">
          <div className="flex items-start gap-2 mb-2">
            <FileText size={16} className="text-purple-500 shrink-0 mt-0.5" />
            <p className="font-medium text-gray-900 truncate text-sm">
              {doc.title}
            </p>
          </div>
          <p className="text-xs text-gray-500">
            Shared by {doc.owner.name} ·{" "}
            <span className="capitalize">{doc.permission}</span>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [owned, setOwned] = useState<Doc[]>([])
  const [shared, setShared] = useState<Doc[]>([])
  const [fetching, setFetching] = useState(true)
  const { handleImport } = useDashboardHelper()

  useEffect(() => {
    if (!loading && !user) router.replace("/")
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    async function fetchDocs() {
      try {
        const res = await docsApi.list()
        setOwned(res.data.owned)
        setShared(res.data.shared)
      } catch {
        toast.error("Failed to load documents")
      } finally {
        setFetching(false)
      }
    }
    void fetchDocs()
  }, [user])

  async function createDoc() {
    try {
      const res = await docsApi.create({ title: "Untitled Document" })
      router.push(`/documents/${res.data.document.id}`)
    } catch {
      toast.error("Failed to create document")
    }
  }

  async function deleteDoc(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm("Delete this document? This cannot be undone.")) return
    try {
      await docsApi.delete(id)
      setOwned((prev) => prev.filter((d) => d.id !== id))
      toast.success("Document deleted")
    } catch {
      toast.error("Failed to delete document")
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  if (loading || !user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Actions */}
        <QuickActions createDoc={createDoc} handleImport={handleImport} />

        {fetching ? (
          <div className="text-center py-20 text-gray-500 text-sm">
            Loading…
          </div>
        ) : (
          <>
            {/* Owned documents */}
            <section className="mb-10">
              <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">
                My Documents
              </h2>
              {owned.length === 0 ? (
                <div className="bg-white border border-dashed border-gray-300 rounded-xl p-6 sm:p-10 text-center">
                  <FileText className="mx-auto text-gray-400 mb-3" size={40} />
                  <p className="text-gray-700 text-sm font-medium">
                    No documents yet
                  </p>
                  <p className="text-gray-500 text-xs mt-1 mb-3">
                    Create your first document to get started
                  </p>
                  <button
                    onClick={createDoc}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium hover:underline"
                  >
                    Create document →
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    height: Math.min(Math.ceil(owned.length / 3) * 140, 420),
                  }}
                >
                  <AutoSizer
                    renderProp={({ width = 0, height = 0 }) => {
                      const columnCount = width < 640 ? 1 : width < 1024 ? 2 : 3
                      const rowCount = Math.ceil(owned.length / columnCount)
                      return (
                        <Grid
                          cellComponent={OwnedDocCell}
                          cellProps={{
                            docs: owned,
                            columnCount,
                            onNavigate: (id) => router.push(`/documents/${id}`),
                            onDelete: deleteDoc,
                            onFormat: formatDate,
                          }}
                          columnCount={columnCount}
                          columnWidth={`${100 / columnCount}%`}
                          rowCount={rowCount}
                          rowHeight={130}
                          style={{ width, height }}
                        />
                      )
                    }}
                  />
                </div>
              )}
            </section>

            {/* Shared with me */}
            {shared.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Users size={13} />
                  Shared with me
                </h2>
                <div
                  style={{
                    height: Math.min(Math.ceil(shared.length / 3) * 140, 420),
                  }}
                >
                  <AutoSizer
                    renderProp={({ width = 0, height = 0 }) => {
                      const columnCount = width < 640 ? 1 : width < 1024 ? 2 : 3
                      const rowCount = Math.ceil(shared.length / columnCount)
                      return (
                        <Grid
                          cellComponent={SharedDocCell}
                          cellProps={{
                            docs: shared,
                            columnCount,
                            onNavigate: (id) => router.push(`/documents/${id}`),
                          }}
                          columnCount={columnCount}
                          columnWidth={`${100 / columnCount}%`}
                          rowCount={rowCount}
                          rowHeight={130}
                          style={{ width, height }}
                        />
                      )
                    }}
                  />
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  )
}

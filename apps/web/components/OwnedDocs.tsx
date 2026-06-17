import type { CellComponentProps } from "react-window"
import { FileText, Trash2, Clock, Paperclip } from "lucide-react"
import { useRouter } from "next/navigation"
import { AutoSizer } from "react-virtualized-auto-sizer"
import { Grid } from "react-window"
import { useDashboardHelper } from "@/app/hooks/dashboard"
import { Doc } from "@/lib/api"

type OwnedCellProps = {
  docs: Doc[]
  columnCount: number
  onNavigate: (id: string) => void
  onDelete: (id: string, e: React.MouseEvent) => void
  onFormat: (iso: string) => string
}

type Props = {
  owned: Doc[]
  createDoc: () => void
  deleteDoc: (id: string, e: React.MouseEvent) => void
}

export default function OwnedDocs({ owned, createDoc, deleteDoc }: Props) {
  const router = useRouter()
  const { formatDate } = useDashboardHelper()

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
      <div className="group" style={{ ...style, padding: 6 }}>
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
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => onDelete(doc.id, e)}
                  className="text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all p-1.5 rounded"
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

  return (
    <section className="mb-10">
      <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">
        My Documents
      </h2>
      {owned.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-6 sm:p-10 text-center">
          <FileText className="mx-auto text-gray-400 mb-3" size={40} />
          <p className="text-gray-700 text-sm font-medium">No documents yet</p>
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
                    onNavigate: (id: string) => router.push(`/documents/${id}`),
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
  )
}

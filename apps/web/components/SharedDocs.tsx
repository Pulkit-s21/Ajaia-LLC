import type { CellComponentProps } from "react-window"
import { FileText, Users } from "lucide-react"
import { AutoSizer } from "react-virtualized-auto-sizer"
import { Grid } from "react-window"
import { useRouter } from "next/navigation"
import { Doc } from "@/lib/api"

type Props = {
  shared: Doc[]
}

type SharedCellProps = {
  docs: Doc[]
  columnCount: number
  onNavigate: (id: string) => void
}

export default function SharedDocs({ shared }: Props) {
  const router = useRouter()

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

  return (
    <>
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
  )
}

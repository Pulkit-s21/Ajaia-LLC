import toast from "react-hot-toast"
import { docsApi } from "../../lib/api"
import { useRouter } from "next/navigation"

export function useDashboardHelper() {
  const router = useRouter()

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const allowed = [".txt", ".md", ".docx"]
    const ext = "." + file.name.split(".").pop()?.toLowerCase()
    if (!allowed.includes(ext)) {
      toast.error("Only .txt, .md, and .docx files are supported for import")
      return
    }
    const toastId = toast.loading("Importing file…")
    try {
      const res = await docsApi.import(file)
      toast.success("File imported as new document", { id: toastId })
      router.push(`/documents/${res.data.document.id}`)
    } catch {
      toast.error("Import failed", { id: toastId })
    }
    e.target.value = ""
  }

  async function createDoc() {
    try {
      const res = await docsApi.create({ title: "Untitled Document" })
      router.push(`/documents/${res.data.document.id}`)
    } catch {
      toast.error("Failed to create document")
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return { handleImport, createDoc, formatDate }
}

"use client"

import { lazy } from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { docsApi } from "@/lib/api"
import { useDashboardHelper } from "../hooks/dashboard"
import { Doc } from "@/lib/api"
import toast from "react-hot-toast"
import SuspenseComp from "../../components/SuspenseComp"

const SharedDocs = lazy(() => import("../../components/SharedDocs"))
const Loader = lazy(() => import("../../components/Loader"))
const Navbar = lazy(() => import("../../components/Navbar"))
const QuickActions = lazy(() => import("../../components/QuickActions"))
const OwnedDocs = lazy(() => import("../../components/OwnedDocs"))

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [owned, setOwned] = useState<Doc[]>([])
  const [shared, setShared] = useState<Doc[]>([])
  const [fetching, setFetching] = useState(true)
  const { handleImport, createDoc } = useDashboardHelper()

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

  if (loading || !user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <SuspenseComp>
        {/* Navbar */}
        <Navbar />

        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* Actions */}
          <QuickActions createDoc={createDoc} handleImport={handleImport} />

          {fetching ? (
            <Loader size="sm" color="primary" />
          ) : (
            <>
              {/* Owned documents */}
              <OwnedDocs
                owned={owned}
                createDoc={createDoc}
                deleteDoc={deleteDoc}
              />

              {/* Shared with me */}
              <SharedDocs shared={shared} />
            </>
          )}
        </main>
      </SuspenseComp>
    </div>
  )
}

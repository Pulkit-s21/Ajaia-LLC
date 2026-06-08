"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { docsApi } from "@/lib/api";
import toast from "react-hot-toast";
import {
  FileText,
  Plus,
  LogOut,
  Upload,
  Trash2,
  Users,
  ChevronRight,
  Clock,
} from "lucide-react";

interface Doc {
  id: string;
  title: string;
  updatedAt: string;
  owner: { id: string; name: string; email: string };
  permission?: string;
}

export default function DashboardPage() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [owned, setOwned] = useState<Doc[]>([]);
  const [shared, setShared] = useState<Doc[]>([]);
  const [fetching, setFetching] = useState(true);
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [user, loading, router]);

  useEffect(() => {
    if (user) fetchDocs();
  }, [user]);

  async function fetchDocs() {
    try {
      const res = await docsApi.list();
      setOwned(res.data.owned);
      setShared(res.data.shared);
    } catch {
      toast.error("Failed to load documents");
    } finally {
      setFetching(false);
    }
  }

  async function createDoc() {
    try {
      const res = await docsApi.create({ title: "Untitled Document" });
      router.push(`/documents/${res.data.document.id}`);
    } catch {
      toast.error("Failed to create document");
    }
  }

  async function deleteDoc(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Delete this document? This cannot be undone.")) return;
    try {
      await docsApi.delete(id);
      setOwned((prev) => prev.filter((d) => d.id !== id));
      toast.success("Document deleted");
    } catch {
      toast.error("Failed to delete document");
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = [".txt", ".md", ".docx"];
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!allowed.includes(ext)) {
      toast.error("Only .txt, .md, and .docx files are supported for import");
      return;
    }
    const toastId = toast.loading("Importing file…");
    try {
      const res = await docsApi.import(file);
      toast.success("File imported as new document", { id: toastId });
      router.push(`/documents/${res.data.document.id}`);
    } catch {
      toast.error("Import failed", { id: toastId });
    }
    e.target.value = "";
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="text-blue-600" size={22} />
            <span className="font-semibold text-gray-900">Ajaia Docs</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700 hidden sm:block">
              {user.name}
            </span>
            <button
              onClick={() => {
                logout();
                router.push("/");
              }}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-red-600 transition-colors"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Actions */}
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
            Supported: .txt, .md, .docx
          </span>
        </div>

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
                <div className="space-y-2">
                  {owned.map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => router.push(`/documents/${doc.id}`)}
                      className="flex items-center bg-white border border-gray-200 rounded-xl px-4 py-3.5 cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all group"
                    >
                      <FileText
                        size={18}
                        className="text-blue-500 shrink-0 mr-3"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {doc.title}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <Clock size={11} />
                          {formatDate(doc.updatedAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        <button
                          onClick={(e) => deleteDoc(doc.id, e)}
                          className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all p-1.5 rounded"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                        <ChevronRight
                          size={16}
                          className="text-gray-400 group-hover:text-blue-500 transition-colors"
                        />
                      </div>
                    </div>
                  ))}
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
                <div className="space-y-2">
                  {shared.map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => router.push(`/documents/${doc.id}`)}
                      className="flex items-center bg-white border border-gray-200 rounded-xl px-4 py-3.5 cursor-pointer hover:border-purple-300 hover:shadow-sm transition-all group"
                    >
                      <FileText
                        size={18}
                        className="text-purple-500 shrink-0 mr-3"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {doc.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Shared by {doc.owner.name} ·{" "}
                          <span className="capitalize">{doc.permission}</span>
                        </p>
                      </div>
                      <ChevronRight
                        size={16}
                        className="text-gray-400 group-hover:text-purple-500 transition-colors ml-3"
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

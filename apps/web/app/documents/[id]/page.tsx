"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { docsApi } from "@/lib/api";
import dynamic from "next/dynamic";
import toast from "react-hot-toast";
import ShareModal from "@/components/ShareModal";
import {
  ArrowLeft,
  Share2,
  Save,
  Upload,
  Check,
  Loader2,
  Paperclip,
} from "lucide-react";

const RichEditor = dynamic(() => import("@/components/RichEditor"), {
  ssr: false,
});

interface Document {
  id: string;
  title: string;
  content: string;
  ownerId: string;
  owner: { id: string; name: string; email: string };
  attachments: { id: string; originalName: string; filename: string }[];
}

type SaveState = "saved" | "saving" | "unsaved";

export default function DocumentPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [doc, setDoc] = useState<Document | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [showShare, setShowShare] = useState(false);
  const [fetching, setFetching] = useState(true);
  const attachRef = useRef<HTMLInputElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    docsApi
      .get(id)
      .then((res) => {
        setDoc(res.data.document);
        setTitle(res.data.document.title);
        setContent(res.data.document.content);
        setIsOwner(res.data.isOwner);
        setCanEdit(res.data.permission === "edit");
      })
      .catch(() => {
        toast.error("Document not found or access denied");
        router.push("/dashboard");
      })
      .finally(() => setFetching(false));
  }, [id, user]);

  const save = useCallback(
    async (t: string, c: string) => {
      setSaveState("saving");
      try {
        await docsApi.update(id, { title: t, content: c });
        setSaveState("saved");
      } catch {
        setSaveState("unsaved");
        toast.error("Failed to save");
      }
    },
    [id]
  );

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setTitle(val);
    setSaveState("unsaved");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(val, content), 1500);
  }

  function handleContentChange(html: string) {
    setContent(html);
    setSaveState("unsaved");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(title, html), 1500);
  }

  async function handleAttachment(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const toastId = toast.loading("Uploading…");
    try {
      const res = await docsApi.uploadAttachment(id, file);
      setDoc((prev) =>
        prev
          ? { ...prev, attachments: [...prev.attachments, res.data.attachment] }
          : prev
      );
      toast.success("File attached", { id: toastId });
      if (res.data.importedContent) {
        if (confirm("Import file content into this document?")) {
          const merged = content + "\n" + res.data.importedContent;
          setContent(merged);
          save(title, merged);
        }
      }
    } catch {
      toast.error("Upload failed", { id: toastId });
    }
    e.target.value = "";
  }

  function SaveIndicator() {
    if (saveState === "saving")
      return (
        <span className="flex items-center gap-1 text-xs text-gray-500">
          <Loader2 size={13} className="animate-spin" />
          <span className="hidden sm:inline">Saving…</span>
        </span>
      );
    if (saveState === "saved")
      return (
        <span className="flex items-center gap-1 text-xs text-gray-500">
          <Check size={13} className="text-green-600" />
          <span className="hidden sm:inline">Saved</span>
        </span>
      );
    return (
      <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
        <Save size={13} />
        <span className="hidden sm:inline">Unsaved</span>
      </span>
    );
  }

  if (authLoading || fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        <Loader2 className="animate-spin" size={28} />
      </div>
    );
  }

  if (!doc) return null;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Navbar */}
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
            <SaveIndicator />

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

      {/* Editor area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <RichEditor
          content={content}
          onChange={handleContentChange}
          editable={canEdit}
        />

        {/* Attachments */}
        {doc.attachments.length > 0 && (
          <div className="mt-6">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Paperclip size={12} />
              Attachments
            </p>
            <div className="flex flex-wrap gap-2">
              {doc.attachments.map((a) => (
                <a
                  key={a.id}
                  href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/uploads/${a.filename}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-blue-700 border border-blue-200 bg-blue-50 rounded-lg px-3 py-1.5 hover:bg-blue-100 transition-colors font-medium"
                >
                  <Paperclip size={11} />
                  {a.originalName}
                </a>
              ))}
            </div>
          </div>
        )}
      </main>

      {showShare && (
        <ShareModal docId={id} onClose={() => setShowShare(false)} />
      )}
    </div>
  );
}

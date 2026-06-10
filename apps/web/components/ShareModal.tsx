"use client";

import { useState, useEffect } from "react";
import { sharingApi } from "@/lib/api";
import toast from "react-hot-toast";
import { X, UserPlus, Trash2 } from "lucide-react";

interface Share {
  id: string;
  permission: string;
  user: { id: string; name: string; email: string };
}

interface Props {
  docId: string;
  onClose: () => void;
}

export default function ShareModal({ docId, onClose }: Props) {
  const [shares, setShares] = useState<Share[]>([]);
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<"view" | "edit">("view");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    sharingApi
      .list(docId)
      .then((res) => setShares(res.data.shares))
      .catch(() => toast.error("Failed to load shares"))
      .finally(() => setLoading(false));
  }, [docId]);

  async function addShare(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      const res = await sharingApi.share(docId, {
        email: email.trim(),
        permission,
      });
      setShares((prev) => {
        const existing = prev.findIndex((s) => s.id === res.data.share.id);
        if (existing !== -1) {
          const updated = [...prev];
          updated[existing] = res.data.share;
          return updated;
        }
        return [...prev, res.data.share];
      });
      setEmail("");
      toast.success(`Shared with ${res.data.share.user.name}`);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to share";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  async function changePermission(share: Share, newPermission: "view" | "edit") {
    try {
      const res = await sharingApi.share(docId, {
        email: share.user.email,
        permission: newPermission,
      });
      setShares((prev) =>
        prev.map((s) => (s.id === share.id ? res.data.share : s))
      );
      toast.success("Permission updated");
    } catch {
      toast.error("Failed to update permission");
    }
  }

  async function revoke(shareId: string) {
    try {
      await sharingApi.revoke(docId, shareId);
      setShares((prev) => prev.filter((s) => s.id !== shareId));
      toast.success("Access revoked");
    } catch {
      toast.error("Failed to revoke access");
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Share document</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 hover:bg-gray-100 p-1 rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-4">
          <form onSubmit={addShare} className="flex flex-col sm:flex-row gap-2 mb-6">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full sm:flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="flex gap-2">
              <select
                value={permission}
                onChange={(e) =>
                  setPermission(e.target.value as "view" | "edit")
                }
                className="flex-1 sm:flex-none border border-gray-300 rounded-lg px-2 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="view">View</option>
                <option value="edit">Edit</option>
              </select>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shrink-0"
              >
                <UserPlus size={15} />
                Share
              </button>
            </div>
          </form>

          <div>
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">
              People with access
            </p>
            {loading ? (
              <p className="text-sm text-gray-500 text-center py-4">
                Loading…
              </p>
            ) : shares.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                Not shared with anyone yet
              </p>
            ) : (
              <ul className="space-y-2">
                {shares.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 border border-gray-100"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {s.user.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {s.user.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-3 shrink-0">
                      <select
                        value={s.permission}
                        onChange={(e) =>
                          changePermission(s, e.target.value as "view" | "edit")
                        }
                        className="text-xs text-gray-700 font-medium bg-white border border-gray-200 rounded px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="view">View</option>
                        <option value="edit">Edit</option>
                      </select>
                      <button
                        onClick={() => revoke(s.id)}
                        className="text-gray-500 hover:text-red-600 hover:bg-red-50 p-1 rounded transition-colors"
                        title="Revoke access"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

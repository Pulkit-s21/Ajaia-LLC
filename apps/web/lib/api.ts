import axios from "axios"

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      window.location.href = "/"
    }
    return Promise.reject(err)
  },
)

// Auth
export const authApi = {
  register: (data: { email: string; name: string; password: string }) =>
    api.post("/api/auth/register", data),
  login: (data: { email: string; password: string }) =>
    api.post("/api/auth/login", data),
  me: () => api.get("/api/auth/me"),
}

// Documents
export const docsApi = {
  list: () => api.get("/api/documents"),
  get: (id: string) => api.get(`/api/documents/${id}`),
  create: (data?: { title?: string; content?: string }) =>
    api.post("/api/documents", data),
  update: (id: string, data: { title?: string; content?: string }) =>
    api.patch(`/api/documents/${id}`, data),
  delete: (id: string) => api.delete(`/api/documents/${id}`),
  import: (file: File) => {
    const form = new FormData()
    form.append("file", file)
    return api.post("/api/documents/import", form, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  },
  uploadAttachment: (id: string, file: File) => {
    const form = new FormData()
    form.append("file", file)
    return api.post(`/api/documents/${id}/upload`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  },
  deleteAttachment: (id: string, attachmentId: string) =>
    api.delete(`/api/documents/${id}/attachments/${attachmentId}`),
}

// Sharing
export const sharingApi = {
  list: (docId: string) => api.get(`/api/documents/${docId}/shares`),
  share: (
    docId: string,
    data: { email: string; permission: "view" | "edit" },
  ) => api.post(`/api/documents/${docId}/shares`, data),
  revoke: (docId: string, shareId: string) =>
    api.delete(`/api/documents/${docId}/shares/${shareId}`),
}

export interface Doc {
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

export interface Document {
  id: string
  title: string
  content: string
  ownerId: string
  owner: { id: string; name: string; email: string }
  attachments: { id: string; originalName: string; filename: string }[]
}

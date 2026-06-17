"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { authApi } from "@/lib/api"
import dynamic from "next/dynamic"
import toast from "react-hot-toast"

const Brand = dynamic(() => import("@/components/Brand"))
const ModeToggle = dynamic(() => import("@/components/ModeToggle"))
const Form = dynamic(() => import("@/components/Form"))

export default function AuthPage() {
  const { user, login, loading } = useAuth()
  const router = useRouter()
  const [mode, setMode] = useState<"login" | "register">("login")
  const [form, setForm] = useState({ email: "", name: "", password: "" })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard")
  }, [user, loading, router])

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res =
        mode === "login"
          ? await authApi.login({ email: form.email, password: form.password })
          : await authApi.register(form)
      login(res.data.token, res.data.user)
      router.push("/dashboard")
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Something went wrong"
      if (msg === "User not found") {
        setMode("register")
        toast.error("No user found - please create one")
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return null

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <title>{mode === "login" ? "Login" : "Register"} | Ajaia Docs</title>
      <meta name="description" content="Access the dashboard securely" />

      <div className="w-full max-w-md">
        {/* Brand */}
        <Brand />

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
          {/* Mode toggle */}
          <ModeToggle mode={mode} setMode={setMode} />

          <Form
            mode={mode}
            form={form}
            submitting={submitting}
            setForm={setForm}
            handleSubmit={handleSubmit}
          />
        </div>
      </div>
    </div>
  )
}

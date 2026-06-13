import { FileText, LogOut } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { useRouter } from "next/navigation"
import { Tooltip } from "react-tooltip"

export default function Navbar() {
  const { user, logout } = useAuth()
  const router = useRouter()

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="text-blue-600" size={22} />
          <span className="font-semibold text-gray-900">Ajaia Docs</span>
        </div>
        <div className="flex items-center gap-4">
          <span
            data-tooltip-id="user-avatar"
            data-tooltip-content={user?.name}
            className="text-sm font-medium text-gray-100  bg-gray-800 rounded-full px-3 py-2"
          >
            {user?.name?.split("")[0]}
          </span>
          <button
            onClick={() => {
              logout()
              router.push("/")
            }}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-red-600 transition-colors"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>
      <Tooltip id="user-avatar" place="left" />
    </header>
  )
}

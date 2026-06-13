type Props = {
  mode: string
  setMode: React.Dispatch<React.SetStateAction<"login" | "register">>
}

export default function ModeToggle({ mode, setMode }: Props) {
  return (
    <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
      {(["login", "register"] as const).map((m) => (
        <button
          key={m}
          onClick={() => setMode(m)}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
            mode === m
              ? "bg-white shadow-sm text-gray-900"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          {m === "login" ? "Sign in" : "Create account"}
        </button>
      ))}
    </div>
  )
}

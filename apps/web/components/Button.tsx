type Props = {
  mode: string
  submitting: true | false
}

export default function Button({ submitting, mode }: Props) {
  return (
    <button
      type="submit"
      disabled={submitting}
      className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-lg text-sm font-semibold transition-colors mt-2"
    >
      {submitting
        ? "Please wait…"
        : mode === "login"
          ? "Sign in"
          : "Create account"}
    </button>
  )
}

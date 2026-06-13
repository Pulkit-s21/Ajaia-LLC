interface Form {
  email: string
  name: string
  password: string
}

type Props = {
  form: Form
  label: string
  type: string
  field: keyof Form
  placeHolder: string
  setForm: React.Dispatch<React.SetStateAction<Form>>
}

export default function InputField({
  form,
  label,
  type,
  field,
  placeHolder,
  setForm,
}: Props) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-800 mb-1.5">
        {label}
      </label>
      <input
        type={type}
        required
        value={form[field]}
        onChange={(e) => setForm({ ...form, [field]: e.target.value })}
        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder={placeHolder}
      />
    </div>
  )
}

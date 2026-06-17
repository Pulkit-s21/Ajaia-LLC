import dynamic from "next/dynamic"

interface Form {
  email: string
  name: string
  password: string
}

type Props = {
  mode: string
  form: Form
  submitting: true | false
  setForm: React.Dispatch<React.SetStateAction<Form>>
  handleSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void
}

const InputField = dynamic(() => import("@/components/InputField"))
const Button = dynamic(() => import("@/components/Button"))

export default function Form({
  handleSubmit,
  mode,
  form,
  submitting,
  setForm,
}: Props) {
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "register" && (
          <InputField
            label="Full Name"
            type="text"
            field="name"
            form={form}
            setForm={setForm}
            placeHolder="Jane Smith"
          />
        )}

        <InputField
          label="Email"
          type="email"
          field="email"
          form={form}
          setForm={setForm}
          placeHolder="you@example.com"
        />

        <InputField
          label="Password"
          type="password"
          field="password"
          form={form}
          setForm={setForm}
          placeHolder="****"
        />

        <Button mode={mode} submitting={submitting} />
    </form>
  )
}

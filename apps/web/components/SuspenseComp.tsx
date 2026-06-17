"use client"

import { Suspense } from "react"
import Loader from "./Loader"

interface Props {
  children: React.ReactNode
}

export default function SuspenseComp({ children }: Props) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center">
          <Loader size="md" color="primary" />
        </div>
      }
    >
      {children}
    </Suspense>
  )
}

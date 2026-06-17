"use client"

import { Suspense } from "react"
import Loader from "./Loader"

interface Props {
  children: React.ReactNode
}

export default function SuspenseComp({ children }: Props) {
  return (
    <Suspense fallback={<Loader size="sm" color="primary" />}>
      {children}
    </Suspense>
  )
}

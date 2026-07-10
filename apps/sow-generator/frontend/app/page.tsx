import { Suspense } from "react"
import { AppWrapper } from "@/components/app-wrapper"

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AppWrapper />
    </Suspense>
  )
}

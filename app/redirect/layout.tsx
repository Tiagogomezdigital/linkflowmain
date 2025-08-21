import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Redirecionando - LinkFlow",
  description: "Redirecionando para WhatsApp...",
}

export default function RedirectLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="min-h-screen bg-black text-white">{children}</div>
}

"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Loader2, MessageCircle, CheckCircle, Search, Users } from "lucide-react"

export default function RedirectPage() {
  const searchParams = useSearchParams()
  const [step, setStep] = useState(1) // 1: buscando, 2: encontrada, 3: redirecionando
  const [countdown, setCountdown] = useState(3)

  const whatsappUrl = searchParams?.get("to") || ""
  const phone = searchParams?.get("phone") || ""
  const group = searchParams?.get("group") || ""

  console.log("[v0] RedirectPage component mounted")
  console.log("[v0] Current URL:", window.location.href)
  console.log("[v0] Search params:", Object.fromEntries(searchParams?.entries() || []))
  console.log("[v0] Redirect page loaded with params:", { whatsappUrl, phone, group })
  console.log("[v0] Current step:", step)

  useEffect(() => {
    console.log("[v0] Main useEffect triggered with whatsappUrl:", whatsappUrl)

    if (!whatsappUrl) {
      console.log("[v0] No WhatsApp URL found, redirecting to home")
      setTimeout(() => (window.location.href = "/"), 2000)
      return
    }

    console.log("[v0] Starting redirect sequence")

    // Etapa 1: Buscando vaga (2 segundos)
    const timer1 = setTimeout(() => {
      console.log("[v0] Step 2: Vaga encontrada")
      setStep(2)
    }, 2000)

    // Etapa 2: Vaga encontrada (2 segundos)
    const timer2 = setTimeout(() => {
      console.log("[v0] Step 3: Redirecionando")
      setStep(3)
    }, 4000)

    return () => {
      console.log("[v0] Cleaning up timers")
      clearTimeout(timer1)
      clearTimeout(timer2)
    }
  }, [whatsappUrl])

  useEffect(() => {
    console.log("[v0] Step changed to:", step)

    if (step === 3) {
      console.log("[v0] Starting countdown from 3")
      const countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          console.log("[v0] Countdown:", prev)
          if (prev <= 1) {
            clearInterval(countdownInterval)
            console.log("[v0] Redirecting to WhatsApp:", whatsappUrl)
            window.location.href = whatsappUrl
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => {
        console.log("[v0] Cleaning up countdown interval")
        clearInterval(countdownInterval)
      }
    }
  }, [step, whatsappUrl])

  const formatPhone = (phoneNumber: string) => {
    if (!phoneNumber) return "Carregando..."
    const cleaned = phoneNumber.replace(/\D/g, "")
    if (cleaned.length >= 10) {
      const ddd = cleaned.substring(cleaned.length - 9, cleaned.length - 7)
      const number = cleaned.substring(cleaned.length - 7)
      return `(${ddd}) ${number.substring(0, 4)}-${number.substring(4)}`
    }
    return phoneNumber
  }

  const renderContent = () => {
    if (step === 1) {
      return (
        <>
          <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="w-10 h-10 text-white animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Buscando Vaga</h1>
          <p className="text-slate-400 mb-6">Procurando vaga disponível...</p>
          <div className="bg-slate-900 rounded-lg p-4">
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
              <span className="text-white text-sm">Verificando disponibilidade</span>
            </div>
          </div>
        </>
      )
    }

    if (step === 2) {
      return (
        <>
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Vaga Encontrada!</h1>
          <p className="text-green-400 mb-6 font-semibold">Perfeito! Temos uma vaga para você</p>
          <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-4">
            <div className="flex items-center justify-center gap-2">
              <Users className="w-4 h-4 text-green-400" />
              <span className="text-green-400 text-sm font-medium">Vaga Confirmada</span>
            </div>
          </div>
        </>
      )
    }

    return (
      <>
        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <MessageCircle className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Redirecionando</h1>
        <p className="text-slate-400 mb-6">Conectando com WhatsApp...</p>
        <div className="bg-slate-900 rounded-lg p-4 mb-4">
          <p className="text-white font-mono text-lg font-bold">{formatPhone(phone)}</p>
          {group && <p className="text-xs text-slate-500 mt-1">{group}</p>}
        </div>
        <div className="flex items-center justify-center gap-2 mb-4">
          <Loader2 className="w-5 h-5 text-green-400 animate-spin" />
          <span className="text-lg font-bold text-white">{countdown}</span>
        </div>
        <button
          onClick={() => (window.location.href = whatsappUrl)}
          className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          Ir para WhatsApp Agora
        </button>
      </>
    )
  }

  console.log("[v0] Rendering step:", step)

  if (!whatsappUrl && step === 1) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 border border-red-500 rounded-2xl p-6 text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Erro</h1>
          <p className="text-red-400 mb-6">Link inválido ou expirado</p>
          <p className="text-slate-400 text-sm">Redirecionando para página inicial...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-6 text-center">
        <div className="text-xs text-slate-500 mb-2">
          Debug: Step {step} | URL: {whatsappUrl ? "OK" : "MISSING"}
        </div>
        {renderContent()}
      </div>
    </div>
  )
}

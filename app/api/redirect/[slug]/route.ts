import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { ensureBrazilianCountryCode } from "@/lib/utils"
import { registerClick } from "@/lib/api/clicks"
import { getNextNumber } from "@/lib/api/numbers"

const supabase = supabaseAdmin

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const userAgent = request.headers.get("user-agent") || ""
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      request.headers.get("x-nf-client-connection-ip") ||
      request.headers.get("client-ip") ||
      "unknown"
    const referrer = request.headers.get("referer") || ""

    if (process.env.NODE_ENV !== "production") {
      console.log(`🔍 Redirecionamento via API para slug: ${slug}`)
    }

    // Detectar tipo de dispositivo
    const deviceType = userAgent.toLowerCase().includes("mobile") ? "mobile" : "desktop"

    // Buscar próximo número disponível
    const numberData = await getNextNumber(slug)

    if (process.env.NODE_ENV !== "production") {
      console.log("📊 Resultado da função getNextNumber:", { numberData })
    }

    if (!numberData) {
      if (process.env.NODE_ENV !== "production") {
        console.error("❌ Erro ao buscar número para slug:", slug)
      }
      return NextResponse.redirect(
        new URL("/error", process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_LINK_BASE_URL || request.url),
      )
    }

    const { number_id, phone, final_message } = numberData

    if (process.env.NODE_ENV !== "production") {
      console.log("✅ Dados obtidos:", {
        number_id,
        phone,
        final_message,
        slug,
      })
    }

    // Registrar clique usando a função TypeScript da interface
    try {
      await registerClick({
        groupSlug: slug,
        numberPhone: phone,
        ipAddress: ip,
        userAgent: userAgent,
        deviceType: deviceType,
        referrer: referrer,
      })

      if (process.env.NODE_ENV !== "production") {
        console.log("✅ Clique registrado com sucesso!")
      }
    } catch (clickError) {
      if (process.env.NODE_ENV !== "production") {
        console.error("⚠️ Erro ao registrar clique:", clickError)
      }
      // Não bloquear o redirecionamento por erro de clique
    }

    const message = encodeURIComponent(final_message || "Olá! Vim através do link.")
    const phoneWithCountryCode = ensureBrazilianCountryCode(phone)
    const whatsappUrl = `https://wa.me/${phoneWithCountryCode}?text=${message}`

    if (process.env.NODE_ENV !== "production") {
      console.log("🚀 Redirecionando para:", whatsappUrl)
      console.log("📱 Número formatado:", {
        original: phone,
        withCountryCode: phoneWithCountryCode,
      })
      console.log("💬 Mensagem final:", final_message)
    }

    return NextResponse.redirect(whatsappUrl)
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("💥 Erro no redirecionamento:", error)
    }
    return NextResponse.redirect(
      new URL("/error", process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_LINK_BASE_URL || request.url),
    )
  }
}

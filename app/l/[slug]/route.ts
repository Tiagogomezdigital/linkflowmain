import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { registerClick } from "@/lib/api/clicks"
import { getNextNumber } from "@/lib/api/numbers"

// Usar apenas cliente admin para segurança do servidor
const supabase = supabaseAdmin

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const userAgent = request.headers.get("user-agent") || ""
    // Netlify pode usar cabeçalhos diferentes para o IP do cliente
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      request.headers.get("x-nf-client-connection-ip") ||
      request.headers.get("client-ip") ||
      "unknown"
    const referrer = request.headers.get("referer") || ""

    if (process.env.NODE_ENV !== 'production') {
      console.log(`🔍 Iniciando redirecionamento para slug: ${slug}`)
    }

    // Webhook Debug
    try {
      const webhookPayload = {
        url: request.url,
        timestamp: new Date().toISOString()
      }

      // Envia o webhook sem aguardar resposta (fire and forget) para não atrasar o redirect
      fetch('https://n8n.inovamatrix.com.br/webhook/debug', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload),
      }).catch(err => console.error('❌ Erro silencioso no envio do webhook:', err))

    } catch (err) {
      console.error('❌ Erro geral no bloco do webhook:', err)
    }

    // Detectar tipo de dispositivo
    const deviceType = userAgent.toLowerCase().includes("mobile") ? "mobile" : "desktop"

    // Buscar próximo número disponível
    const numberData = await getNextNumber(slug)

    if (process.env.NODE_ENV !== 'production') {
      console.log("📊 Resultado da função getNextNumber:", { numberData })
    }

    if (!numberData) {
      if (process.env.NODE_ENV !== 'production') {
        console.error("❌ Erro ao buscar número para slug:", slug)
      }
      return NextResponse.redirect(
        new URL("/error", process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_LINK_BASE_URL || request.url),
      )
    }

    const { number_id, phone, final_message } = numberData

    if (process.env.NODE_ENV !== 'production') {
      console.log("✅ Dados obtidos:", {
        number_id,
        phone,
        final_message,
        slug,
      })
    }

    // Registrar clique usando a função TypeScript da interface
    if (process.env.NODE_ENV !== 'production') {
      console.log("🔍 Dados para registrar clique:", {
        groupSlug: slug,
        numberPhone: phone,
        ipAddress: ip,
        userAgent: userAgent,
        deviceType: deviceType,
        referrer: referrer,
      })
    }

    try {
      await registerClick({
        groupSlug: slug,
        numberPhone: phone,
        ipAddress: ip,
        userAgent: userAgent,
        deviceType: deviceType,
        referrer: referrer,
      })

      if (process.env.NODE_ENV !== 'production') {
        console.log("✅ Clique registrado com sucesso!")
      }
    } catch (clickError) {
      if (process.env.NODE_ENV !== 'production') {
        console.error("⚠️ Erro ao registrar clique:", JSON.stringify(clickError, null, 2))
      }
    }

    // Construir URL do WhatsApp
    // Garantir que o número tenha o código do país brasileiro (55)
    const cleanPhone = phone.replace(/\D/g, "")
    const phoneWithCountryCode = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`
    const message = encodeURIComponent(final_message || "Olá! Vim através do link.")
    const whatsappUrl = `https://wa.me/${phoneWithCountryCode}?text=${message}`

    if (process.env.NODE_ENV !== 'production') {
      console.log("📱 Número formatado:", {
        original: phone,
        cleaned: cleanPhone,
        withCountryCode: phoneWithCountryCode,
        whatsappUrl,
      })
    }

    // Em vez de redirecionamento direto, ir para página intermediária
    const redirectUrl = new URL("/redirect", process.env.NEXT_PUBLIC_SITE_URL || request.url)
    redirectUrl.searchParams.set("to", whatsappUrl)
    redirectUrl.searchParams.set("phone", phone)
    redirectUrl.searchParams.set("group", slug)

    if (process.env.NODE_ENV !== 'production') {
      console.log("🚀 Redirecionando para página intermediária:", redirectUrl.toString())
    }

    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error("💥 Erro no redirecionamento:", error)
    }
    return NextResponse.redirect(
      new URL("/error", process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_LINK_BASE_URL || request.url),
    )
  }
}

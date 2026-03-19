import { NextRequest, NextResponse } from "next/server"
import type { SessionUser } from "@/lib/users"

function dashboardUrl() {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "")
  return base ? `${base}/dashboard` : "/dashboard"
}

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id")

  if (!sessionId) {
    return NextResponse.redirect(dashboardUrl())
  }

  try {
    // Proxy to the NanoToxi AI Express backend — it holds the Stripe key
    const backendUrl = process.env.BACKEND_URL || "http://localhost:4242"
    const res = await fetch(
      `${backendUrl}/api/checkout/success?session_id=${sessionId}`,
      { headers: { "Content-Type": "application/json" } }
    )

    if (!res.ok) {
      console.error("Backend checkout/success failed:", res.status)
      return NextResponse.redirect(dashboardUrl())
    }

    const data = await res.json()
    const customerId: string | undefined = data.customerId
    const customerEmail: string = data.email || "user@nanotoxi.com"
    const customerName: string = data.name || customerEmail.split("@")[0]

    const response = NextResponse.redirect(dashboardUrl())

    // Mark user as a paying subscriber
    if (customerId) {
      response.cookies.set("stripe_customer_id", customerId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      })
    }

    // Auto-create an auth_session for users arriving from the landing page
    // (they won't have a dashboard session cookie yet)
    const existingSession = request.cookies.get("auth_session")?.value
    if (!existingSession) {
      const sessionUser: SessionUser = {
        email: customerEmail,
        name: customerName,
        role: "user",
        trialExpiry: null, // paying subscriber — no expiry
      }
      response.cookies.set("auth_session", JSON.stringify(sessionUser), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      })
    }

    return response
  } catch (error) {
    console.error("Checkout success error:", error)
    return NextResponse.redirect(dashboardUrl())
  }
}

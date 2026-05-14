import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { BACKEND_URL } from "@/lib/users"

function dashboardUrl() {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "")
  return base ? `${base}/dashboard` : "/dashboard"
}

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id")
  if (!sessionId) return NextResponse.redirect(dashboardUrl())

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sessionAny = session as any
    const customerId: string | undefined =
      typeof session.customer === "string" ? session.customer : sessionAny.customer?.id

    const response = NextResponse.redirect(dashboardUrl())

    if (customerId) {
      response.cookies.set("stripe_customer_id", customerId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      })
    }

    // Update subscription_status in backend DB (best effort)
    const jwt = request.cookies.get("nanotoxi_jwt")?.value
    if (jwt && sessionId) {
      fetch(`${BACKEND_URL}/api/v1/stripe/checkout/success?session_id=${sessionId}`, {
        headers: { Authorization: `Bearer ${jwt}` },
      }).catch(() => {})
    }

    return response
  } catch (error) {
    console.error("Checkout success error:", error)
    return NextResponse.redirect(dashboardUrl())
  }
}

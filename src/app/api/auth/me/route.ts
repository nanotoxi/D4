import { NextRequest, NextResponse } from "next/server"
import { BACKEND_URL, isTrialExpired } from "@/lib/users"

export async function GET(request: NextRequest) {
  const jwt = request.cookies.get("nanotoxi_jwt")?.value
  const sessionCookie = request.cookies.get("auth_session")?.value

  if (!jwt && !sessionCookie) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    if (jwt) {
      const res = await fetch(`${BACKEND_URL}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${jwt}` },
      })
      if (res.ok) {
        const me = await res.json()
        const user = {
          id: me.id, email: me.email, name: me.name,
          role: me.role === "admin" ? "developer" : me.role,
          subscription_status: me.subscription_status || "none",
          trialExpiry: me.trial_expires_at || null,
        }
        const isExpired = me.subscription_status !== "active" && isTrialExpired(user.trialExpiry)
        return NextResponse.json({
          user, isExpired,
          isDeveloper: user.role === "developer",
          hasStripeSubscription: me.subscription_status === "active",
          hasAccess: user.role === "developer" || me.subscription_status === "active" || !isExpired,
        })
      }
    }
    if (!sessionCookie) return NextResponse.json({ error: "Session expired" }, { status: 401 })
    const user = JSON.parse(sessionCookie)
    const isExpired = user.subscription_status !== "active" && isTrialExpired(user.trialExpiry)
    return NextResponse.json({
      user, isExpired,
      isDeveloper: user.role === "developer",
      hasStripeSubscription: user.subscription_status === "active",
      hasAccess: user.role === "developer" || user.subscription_status === "active" || !isExpired,
    })
  } catch {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 })
  }
}
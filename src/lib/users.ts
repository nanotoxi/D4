const BACKEND_URL = process.env.BACKEND_URL || "https://d2.up.railway.app"

export interface SessionUser {
  id: string
  email: string
  name: string
  role: "developer" | "user" | "admin"
  subscription_status: string
  trialExpiry: string | null
}

export function isTrialExpired(trialExpiry: string | null): boolean {
  if (!trialExpiry) return false
  return new Date(trialExpiry) < new Date()
}

export async function authenticateUser(email: string, password: string): Promise<SessionUser | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) return null
    const data = await res.json()
    const meRes = await fetch(`${BACKEND_URL}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${data.access_token}` },
    })
    if (!meRes.ok) return null
    const me = await meRes.json()
    return {
      id: me.id,
      email: me.email,
      name: me.name,
      role: me.role === "admin" ? "developer" : me.role,
      subscription_status: me.subscription_status || "none",
      trialExpiry: me.trial_expires_at || null,
      _access_token: data.access_token,
      _refresh_token: data.refresh_token,
    } as unknown as SessionUser
  } catch {
    return null
  }
}

export { BACKEND_URL }
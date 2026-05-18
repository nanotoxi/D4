import { NextRequest, NextResponse } from "next/server"
import { BACKEND_URL } from "@/lib/users"

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()
    if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 })

    // Validate token by calling /auth/me on the real backend
    const r = await fetch(`${BACKEND_URL}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    })

    const data = await r.json()
    if (!r.ok) return NextResponse.json(data, { status: r.status })

    const response = NextResponse.json({ user: data })
    response.cookies.set("auth_session", JSON.stringify(data), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    })
    return response
  } catch (err) {
    console.error("Exchange token error:", err)
    return NextResponse.json({ error: "Failed to exchange token" }, { status: 500 })
  }
}

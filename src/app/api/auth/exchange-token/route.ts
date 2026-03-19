import { NextRequest, NextResponse } from "next/server"

const EXPRESS_API_URL = process.env.EXPRESS_API_URL || "http://localhost:4242"

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()
    if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 })

    const r = await fetch(`${EXPRESS_API_URL}/api/auth/exchange-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })

    const data = await r.json()
    if (!r.ok) return NextResponse.json(data, { status: r.status })

    const response = NextResponse.json({ user: data.user })
    response.cookies.set("auth_session", JSON.stringify(data.user), {
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

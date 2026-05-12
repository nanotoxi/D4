import { NextRequest, NextResponse } from "next/server"
import { authenticateUser } from "@/lib/users"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }
    const sessionUser = await authenticateUser(email, password) as (typeof sessionUser & { _access_token?: string; _refresh_token?: string }) | null
    if (!sessionUser) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }
    const { _access_token, _refresh_token, ...user } = sessionUser as typeof sessionUser & { _access_token: string; _refresh_token: string }
    const response = NextResponse.json({ user })
    response.cookies.set("nanotoxi_jwt", _access_token, {
      httpOnly: true, secure: process.env.NODE_ENV === "production",
      sameSite: "lax", path: "/", maxAge: 60 * 15,
    })
    response.cookies.set("nanotoxi_refresh", _refresh_token, {
      httpOnly: true, secure: process.env.NODE_ENV === "production",
      sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7,
    })
    response.cookies.set("auth_session", JSON.stringify(user), {
      httpOnly: true, secure: process.env.NODE_ENV === "production",
      sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7,
    })
    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Login failed" }, { status: 500 })
  }
}
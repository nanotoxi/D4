import { NextRequest, NextResponse } from "next/server"
import { BACKEND_URL } from "@/lib/users"

export async function POST(request: NextRequest) {
  const jwt = request.cookies.get("nanotoxi_jwt")?.value
  if (jwt) {
    fetch(`${BACKEND_URL}/api/v1/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${jwt}` },
    }).catch(() => {})
  }
  const response = NextResponse.json({ success: true })
  response.cookies.delete("nanotoxi_jwt")
  response.cookies.delete("nanotoxi_refresh")
  response.cookies.delete("auth_session")
  response.cookies.delete("stripe_customer_id")
  return response
}
import { NextRequest, NextResponse } from "next/server"
import { BACKEND_URL } from "@/lib/users"

export async function POST(request: NextRequest) {
  const jwt = request.cookies.get("nanotoxi_jwt")?.value
  if (!jwt) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  try {
    const formData = await request.formData()
    const res = await fetch(`${BACKEND_URL}/api/v1/predict/bulk/`, {
      method: "POST",
      headers: { Authorization: `Bearer ${jwt}` },
      body: formData,
    })
    const data = await res.json()
    if (!res.ok) return NextResponse.json({ error: data.detail || "Upload failed" }, { status: res.status })
    return NextResponse.json(data)
  } catch (error) {
    console.error("Bulk upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}

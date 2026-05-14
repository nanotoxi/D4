import { NextRequest, NextResponse } from "next/server"
import { BACKEND_URL } from "@/lib/users"

export async function GET(request: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  const jwt = request.cookies.get("nanotoxi_jwt")?.value
  if (!jwt) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  const { jobId } = await params
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/predict/bulk/${jobId}`, {
      headers: { Authorization: `Bearer ${jwt}` },
    })
    const data = await res.json()
    if (!res.ok) return NextResponse.json({ error: data.detail || "Not found" }, { status: res.status })
    return NextResponse.json(data)
  } catch (error) {
    console.error("Bulk status error:", error)
    return NextResponse.json({ error: "Failed to get status" }, { status: 500 })
  }
}

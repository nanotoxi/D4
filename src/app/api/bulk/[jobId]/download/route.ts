import { NextRequest, NextResponse } from "next/server"
import { BACKEND_URL } from "@/lib/users"

export async function GET(request: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  const jwt = request.cookies.get("nanotoxi_jwt")?.value
  if (!jwt) return new NextResponse("Not authenticated", { status: 401 })
  const { jobId } = await params
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/predict/bulk/${jobId}/download`, {
      headers: { Authorization: `Bearer ${jwt}` },
    })
    if (!res.ok) return new NextResponse("Download failed", { status: res.status })
    const blob = await res.blob()
    return new NextResponse(blob as BodyInit, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="toxicity_results_${jobId}.xlsx"`,
      },
    })
  } catch {
    return new NextResponse("Download failed", { status: 500 })
  }
}

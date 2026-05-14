import { NextRequest, NextResponse } from "next/server"
import { BACKEND_URL } from "@/lib/users"

export async function GET(request: NextRequest) {
  try {
    const jwt = request.cookies.get("nanotoxi_jwt")?.value
    if (!jwt) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }
    const headers = { Authorization: `Bearer ${jwt}` }
    const [statsRes, seriesRes] = await Promise.all([
      fetch(`${BACKEND_URL}/api/v1/dashboard/stats`, { headers }),
      fetch(`${BACKEND_URL}/api/v1/dashboard/predictions-over-time?days=90`, { headers }),
    ])
    if (!statsRes.ok) {
      return NextResponse.json({ error: "Failed to fetch stats" }, { status: statsRes.status })
    }
    const data = await statsRes.json()
    let daily_series: { day: string; count: string; safe_count: string; toxic_count: string }[] = []
    if (seriesRes.ok) {
      const seriesData = await seriesRes.json()
      daily_series = (seriesData.series || []).map(
        (s: { date: string; total: number; toxic: number; nontoxic: number }) => ({
          day: s.date,
          count: String(s.total),
          safe_count: String(s.nontoxic),
          toxic_count: String(s.toxic),
        })
      )
    }
    return NextResponse.json({
      total_predictions: data.total_predictions,
      toxic_count: data.toxic_count,
      nontoxic_count: data.nontoxic_count,
      avg_confidence: data.avg_confidence,
      predictions_today: data.predictions_today,
      total: String(data.total_predictions ?? 0),
      safe_count: String(data.nontoxic_count ?? 0),
      daily_series,
      totalSimulations: data.total_predictions,
      toxicCount: data.toxic_count,
      safePredictions: data.nontoxic_count,
    })
  } catch (error) {
    console.error("Stats route error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

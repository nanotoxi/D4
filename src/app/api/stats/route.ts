import { NextRequest, NextResponse } from "next/server"
import { BACKEND_URL } from "@/lib/users"

export async function GET(request: NextRequest) {
  try {
    const jwt = request.cookies.get("nanotoxi_jwt")?.value
    if (!jwt) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }
    const res = await fetch(`${BACKEND_URL}/api/v1/dashboard/stats`, {
      headers: { Authorization: `Bearer ${jwt}` },
    })
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch stats" }, { status: res.status })
    }
    const data = await res.json()
    return NextResponse.json({
      total_predictions: data.total_predictions,
      toxic_count: data.toxic_count,
      nontoxic_count: data.nontoxic_count,
      avg_confidence: data.avg_confidence,
      predictions_today: data.predictions_today,
      // section-cards aliases
      total: String(data.total_predictions ?? 0),
      safe_count: String(data.nontoxic_count ?? 0),
      daily_series: data.daily_series ?? [],
      // legacy camelCase aliases
      totalSimulations: data.total_predictions,
      toxicCount: data.toxic_count,
      safePredictions: data.nontoxic_count,
    })
  } catch (error) {
    console.error("Stats route error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
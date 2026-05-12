import { NextRequest, NextResponse } from "next/server"
import { BACKEND_URL } from "@/lib/users"

export async function GET(request: NextRequest) {
  try {
    const jwt = request.cookies.get("nanotoxi_jwt")?.value
    if (!jwt) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100)
    const offset = parseInt(searchParams.get("offset") || "0")
    const page = Math.floor(offset / limit) + 1

    const res = await fetch(
      `${BACKEND_URL}/api/v1/predictions/history?page=${page}&limit=${limit}`,
      { headers: { Authorization: `Bearer ${jwt}` } }
    )

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch history" }, { status: res.status })
    }

    const data = await res.json()

    // Map FastAPI prediction records to the shape research-archive expects
    const simulations = (data.predictions || []).map((p: Record<string, unknown>) => {
      const confRaw = typeof p.confidence === "number" ? p.confidence : 0
      return {
        id: p.prediction_id,
        particle_id: p.nanoparticle_name,
        request_id: p.prediction_id,
        material: p.nanoparticle_name,
        core_size: p.primary_size_nm ?? 0,
        zeta_potential: p.zeta_potential_mv ?? 0,
        dosage: p.dose_max_ugml ?? 0,
        toxicity_result: String(p.toxicity_label || "").toUpperCase() === "TOXIC" ? "TOXIC" : "NON-TOXIC",
        confidence: confRaw <= 1 ? Math.round(confRaw * 1000) / 10 : confRaw,
        aggregation_factor: p.aggregation_factor ?? 1,
        created_at: p.created_at,
        user_email: "",
      }
    })

    return NextResponse.json({ simulations, total: simulations.length })
  } catch (error) {
    console.error("Simulations proxy error:", error)
    return NextResponse.json({ error: "Failed to fetch simulations" }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from "next/server"

const ML_API_URL = process.env.ML_API_URL || "http://localhost:5000"
const EXPRESS_API_URL = process.env.EXPRESS_API_URL || "http://localhost:4242"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const cookieHeader = request.headers.get("cookie") || ""

    const {
      nanoparticle_id,
      core_size,
      zeta_potential,
      surface_area,
      bandgap_energy,
      dosage,
      exposure_time,
      environmental_pH,
      protein_corona,
      bioContext,
    } = body

    const mlPayload: Record<string, unknown> = {
      nanoparticle_id: nanoparticle_id || "NP-UNKNOWN",
      core_size: Number(core_size),
      zeta_potential: Number(zeta_potential),
      surface_area: Number(surface_area),
      bandgap_energy: Number(bandgap_energy),
      dosage: Number(dosage),
      exposure_time: Number(exposure_time),
    }

    if (bioContext) {
      if (environmental_pH != null) mlPayload.environmental_pH = Number(environmental_pH)
      if (protein_corona != null) mlPayload.protein_corona = Boolean(protein_corona)
    }

    const mlRes = await fetch(`${ML_API_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mlPayload),
    })

    if (!mlRes.ok) {
      const errText = await mlRes.text()
      return NextResponse.json(
        { error: `ML backend error: ${errText}` },
        { status: mlRes.status }
      )
    }

    const mlData = await mlRes.json()

    // Save simulation to DB via Express (fire-and-forget)
    fetch(`${EXPRESS_API_URL}/api/simulations`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: cookieHeader },
      body: JSON.stringify({
        nanoparticle_id: mlPayload.nanoparticle_id,
        core_size: mlPayload.core_size,
        zeta_potential: mlPayload.zeta_potential,
        surface_area: mlPayload.surface_area,
        dosage: mlPayload.dosage,
        exposure_time: mlPayload.exposure_time,
        toxicity_prediction: mlData?.stage2?.toxicity_prediction ?? null,
        confidence: mlData?.stage2?.confidence ?? null,
        cytotoxicity: mlData?.stage3?.cytotoxicity ?? null,
        risk_level: mlData?.stage2?.risk_level ?? null,
      }),
    }).catch(() => {/* non-critical */})

    return NextResponse.json(mlData)
  } catch (error) {
    console.error("Predict route error:", error)
    return NextResponse.json(
      { error: "Failed to run prediction" },
      { status: 500 }
    )
  }
}

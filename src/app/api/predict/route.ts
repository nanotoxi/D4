import { NextRequest, NextResponse } from "next/server"
import { BACKEND_URL } from "@/lib/users"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const jwt = request.cookies.get("nanotoxi_jwt")?.value
    if (!jwt) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }
    const payload = {
      nanoparticle_name: body.nanoparticle_id || "Unknown NP",
      np_type: body.np_type || "Inorganic",
      primary_size_nm: Number(body.primary_size_nm || body.core_size || 20),
      hydrodynamic_size_nm: Number(body.hydrodynamic_size_nm || (body.core_size ? body.core_size * 2 : 40)),
      zeta_potential_mv: Number(body.zeta_potential_mv || body.zeta_potential || 0),
      morphology: body.morphology || "Spherical",
      is_coated: Boolean(body.is_coated || false),
      surface_chemistry: body.surface_chemistry || null,
      cell_type: body.cell_type || "HeLa",
      dose_min_ugml: Number(body.dose_min_ugml || body.dosage || 10),
      dose_max_ugml: Number(body.dose_max_ugml || (body.dosage ? body.dosage * 2 : 100)),
      exposure_time_h: Number(body.exposure_time_h || body.exposure_time || 24),
      temperature_c: Number(body.temperature_c || 37),
      ph: Number(body.environmental_pH || body.ph || 7.4),
      is_therapeutic: Boolean(body.is_therapeutic || false),
      include_shap: true,
      include_rag: Boolean(body.include_rag || false),
    }
    const res = await fetch(`${BACKEND_URL}/api/v1/predict/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}` },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      return NextResponse.json({ error: errData.detail || `Backend error ${res.status}` }, { status: res.status })
    }
    const data = await res.json()
    const aggFactor = data.stage1?.aggregation_factor ?? "1.0x"
    const aggNum = parseFloat(String(aggFactor).replace("x", "")) || 1.0
    return NextResponse.json({
      prediction_id: data.prediction_id,
      nanoparticle_id: payload.nanoparticle_name,
      stage1: {
        aggregation_factor: aggFactor,
        aggregation_factor_num: aggNum,
        hydrodynamic_diameter: data.stage1?.predicted_hydrodynamic_diameter,
        predicted_hydrodynamic_diameter: data.stage1?.predicted_hydrodynamic_diameter,
        stability_assessment: data.stage1?.stability_assessment,
        zeta_shift: 0,
      },
      stage2: {
        toxicity_prediction: data.toxicity_label === "Toxic" ? "TOXIC" : "SAFE",
        toxicity_label: data.toxicity_label,
        confidence: data.confidence,
        risk_level: data.risk_level,
        risk_score: data.confidence,
        top_features: data.shap_explanation?.top_features ?? [],
      },
      stage3: null,
      explanation: data.rag_explanation || null,
    })
  } catch (error) {
    console.error("Predict route error:", error)
    return NextResponse.json({ error: "Failed to run prediction" }, { status: 500 })
  }
}

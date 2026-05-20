"use client"

import * as React from "react"
import {
  FlaskConical,
  Zap,
  Upload,
  Download,
  AlertCircle,
  CheckCircle2,
  Info,
  Loader2,
  Atom,
  BookOpen,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface PredictionResult {
  particle_id: string
  stage1: {
    aggregation_factor: number
    hydrodynamic_diameter: number
    zeta_shift: number
  }
  stage2: {
    toxicity_prediction: "SAFE" | "TOXIC"
    confidence: number
    risk_score: number
    top_features?: { feature: string; value: number }[]
  }
  stage3?: {
    ros_generation: number
    apoptosis_likelihood: number
    necrosis_likelihood: number
    primary_pathway: string
  }
  explanation?: string
}

function FieldInfo({ tip }: { tip: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="size-3.5 text-muted-foreground cursor-help inline-block ml-1" />
        </TooltipTrigger>
        <TooltipContent className="max-w-[220px] text-xs">{tip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function mapMLResponse(mlData: Record<string, unknown>, particleId: string): PredictionResult {
  const stage1Raw = (mlData.stage1 || {}) as Record<string, unknown>
  const stage2Raw = (mlData.stage2 || {}) as Record<string, unknown>
  const stage3Raw = (mlData.stage3 || {}) as Record<string, unknown>

  const aggFactorStr = String(stage1Raw.aggregation_factor || "1.00").replace("x", "")
  const hydDiamStr = String(stage1Raw.predicted_hydrodynamic_diameter || stage1Raw.hydrodynamic_diameter || "0")

  const aggregation_factor = parseFloat(aggFactorStr) || 1.0
  const hydrodynamic_diameter = parseFloat(hydDiamStr) || 0

  const confidenceRaw = typeof stage2Raw.confidence === "number" ? stage2Raw.confidence : 0
  const confidence = confidenceRaw <= 1 ? Math.round(confidenceRaw * 1000) / 10 : confidenceRaw

  const risk_score =
    typeof stage2Raw.composite_score === "number"
      ? stage2Raw.composite_score
      : typeof stage2Raw.risk_score === "number"
      ? stage2Raw.risk_score
      : 0

  const rawTox = String(stage2Raw.toxicity_prediction || "").toUpperCase()
  const toxicity_prediction: "SAFE" | "TOXIC" = rawTox === "TOXIC" ? "TOXIC" : "SAFE"

  let stage3: PredictionResult["stage3"] | undefined
  if (stage3Raw && Object.keys(stage3Raw).length > 0) {
    const cytotoxic = String(stage3Raw.cytotoxicity || "").toUpperCase() === "YES"
    stage3 = {
      ros_generation: typeof stage3Raw.ros_generation === "number" ? stage3Raw.ros_generation : cytotoxic ? 60 : 10,
      apoptosis_likelihood:
        typeof stage3Raw.apoptosis_likelihood === "number" ? stage3Raw.apoptosis_likelihood : cytotoxic ? 50 : 5,
      necrosis_likelihood:
        typeof stage3Raw.necrosis_likelihood === "number" ? stage3Raw.necrosis_likelihood : cytotoxic ? 20 : 3,
      primary_pathway:
        typeof stage3Raw.primary_pathway === "string"
          ? stage3Raw.primary_pathway
          : cytotoxic
          ? "Oxidative Stress → ROS-mediated Apoptosis"
          : "No significant cytotoxic pathway detected",
    }
  }

  return {
    particle_id: String(mlData.nanoparticle_id || particleId),
    stage1: {
      aggregation_factor,
      hydrodynamic_diameter,
      zeta_shift: typeof stage1Raw.zeta_shift === "number" ? stage1Raw.zeta_shift : 0,
    },
    stage2: {
      toxicity_prediction,
      confidence,
      risk_score,
      top_features: Array.isArray(stage2Raw.top_features)
        ? (stage2Raw.top_features as { feature: string; value: number }[])
        : undefined,
    },
    stage3,
    explanation: typeof mlData.explanation === "string" ? mlData.explanation : undefined,
  }
}

// Values must exactly match the model's training vocabulary
const NP_TYPES = ["Inorganic", "Organic", "Hybrid"]
const MORPHOLOGIES = [
  "Spherical", "Nanorod", "Cubic", "Core-Shell", "Dendrimer",
  "Fibrous", "Hexagonal", "Nanotube", "Nanowire", "2D Sheet", "Porous", "Other",
]
const CELL_TYPES = [
  "A549", "BEAS-2B", "Caco-2", "HT-29", "HeLa", "HepG2",
  "L929", "MCF-7", "MDA-MB-231", "RAW264.7", "Other",
]

export default function ToxicityEnginePage() {
  const [loading, setLoading] = React.useState(false)
  const [result, setResult] = React.useState<PredictionResult | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [batchFile, setBatchFile] = React.useState<File | null>(null)
  const [batchLoading, setBatchLoading] = React.useState(false)
  const [batchProgress, setBatchProgress] = React.useState(0)
  const [batchJobId, setBatchJobId] = React.useState<string | null>(null)
  const [batchStatus, setBatchStatus] = React.useState<"idle" | "processing" | "done" | "failed">("idle")

  // Form state
  const [nanoparticleName, setNanoparticleName] = React.useState("")
  const [npType, setNpType] = React.useState("Inorganic")
  const [primarySizeNm, setPrimarySizeNm] = React.useState("")
  const [hydrodynamicSizeNm, setHydrodynamicSizeNm] = React.useState("")
  const [zetaPotentialMv, setZetaPotentialMv] = React.useState("")
  const [morphology, setMorphology] = React.useState("Spherical")
  const [isCoated, setIsCoated] = React.useState(false)
  const [surfaceChemistry, setSurfaceChemistry] = React.useState("")
  const [cellType, setCellType] = React.useState("HeLa")
  const [doseMinUgml, setDoseMinUgml] = React.useState("")
  const [doseMaxUgml, setDoseMaxUgml] = React.useState("")
  const [exposureTimeH, setExposureTimeH] = React.useState("")
  const [ph, setPh] = React.useState("")
  const [isTherapeutic, setIsTherapeutic] = React.useState(false)
  const [includeRag, setIncludeRag] = React.useState(false)

  const handleSinglePredict = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    setError(null)

    try {
      const payload: Record<string, unknown> = {
        nanoparticle_id: nanoparticleName || `NP-${Date.now()}`,
        np_type: npType,
        primary_size_nm: parseFloat(primarySizeNm),
        hydrodynamic_size_nm: hydrodynamicSizeNm ? parseFloat(hydrodynamicSizeNm) : parseFloat(primarySizeNm) * 2,
        zeta_potential_mv: parseFloat(zetaPotentialMv),
        morphology,
        is_coated: isCoated,
        surface_chemistry: isCoated && surfaceChemistry ? surfaceChemistry : null,
        cell_type: cellType,
        dose_min_ugml: parseFloat(doseMinUgml),
        dose_max_ugml: doseMaxUgml ? parseFloat(doseMaxUgml) : parseFloat(doseMinUgml) * 2,
        exposure_time_h: parseFloat(exposureTimeH),
        environmental_pH: ph ? parseFloat(ph) : 7.4,
        is_therapeutic: isTherapeutic,
        include_rag: includeRag,
      }

      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(errData.error || `HTTP ${res.status}`)
      }

      const mlData = await res.json()
      const mapped = mapMLResponse(mlData, payload.nanoparticle_id as string)
      setResult(mapped)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Prediction failed")
    } finally {
      setLoading(false)
    }
  }

  const handleBatchUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setBatchFile(e.target.files[0])
  }

  const handleBatchRun = async () => {
    if (!batchFile) return
    setBatchLoading(true)
    setBatchProgress(10)
    setBatchJobId(null)
    setBatchStatus("processing")
    try {
      const formData = new FormData()
      formData.append("file", batchFile)
      const res = await fetch("/api/bulk", { method: "POST", body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Upload failed")
      const jobId: string = data.job_id
      setBatchJobId(jobId)
      setBatchProgress(20)
      let attempts = 0
      const poll = async (): Promise<void> => {
        attempts++
        if (attempts > 90) { setBatchStatus("failed"); setBatchLoading(false); return }
        const sr = await fetch(`/api/bulk/${jobId}`)
        const sd = await sr.json()
        if (sd.total_rows && sd.processed_rows) {
          setBatchProgress(Math.min(20 + Math.round((sd.processed_rows / sd.total_rows) * 75), 95))
        }
        if (sd.status === "done") {
          setBatchProgress(100)
          setBatchStatus("done")
          setBatchLoading(false)
        } else if (sd.status === "failed") {
          setBatchStatus("failed")
          setBatchLoading(false)
        } else {
          await new Promise((r) => setTimeout(r, 2000))
          return poll()
        }
      }
      await poll()
    } catch {
      setBatchStatus("failed")
      setBatchLoading(false)
    }
  }

  return (
    <div className="px-4 lg:px-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <FlaskConical className="size-6 text-primary" />
          Nano-Toxicity Engine
        </h1>
        <p className="text-muted-foreground">
          RF v2 Final — Aggregation → Toxicity Screening → SHAP Explanation
        </p>
      </div>

      <Tabs defaultValue="single">
        <TabsList className="mb-4">
          <TabsTrigger value="single" className="flex items-center gap-1.5">
            <Atom className="size-3.5" /> Single Particle
          </TabsTrigger>
          <TabsTrigger value="batch" className="flex items-center gap-1.5">
            <Upload className="size-3.5" /> Batch Upload (Excel)
          </TabsTrigger>
        </TabsList>

        {/* ── Single Particle Tab ── */}
        <TabsContent value="single">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Input Form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Lab Bench — Input Configuration</CardTitle>
                <CardDescription>
                  Enter nanoparticle physicochemical properties to run a full prediction.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSinglePredict} className="space-y-5">
                  {/* Particle Identity */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="particle-name" className="text-xs">
                        Nanoparticle Name
                        <FieldInfo tip="Identifier for this nanoparticle sample (e.g. CuO_30nm)." />
                      </Label>
                      <Input
                        id="particle-name"
                        type="text"
                        placeholder="e.g. CuO_30nm"
                        value={nanoparticleName}
                        onChange={(e) => setNanoparticleName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">
                        NP Type
                        <FieldInfo tip="Material category: Inorganic (metal oxides, QDs), Organic (carbon-based, lipid), or Hybrid." />
                      </Label>
                      <Select value={npType} onValueChange={setNpType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {NP_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Physical Properties */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                      Physical Properties
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="primary-size" className="text-xs">
                          Primary Size (nm)
                          <FieldInfo tip="Core particle diameter measured by TEM or XRD." />
                        </Label>
                        <Input
                          id="primary-size"
                          type="number"
                          placeholder="e.g. 25"
                          step="0.1"
                          required
                          value={primarySizeNm}
                          onChange={(e) => setPrimarySizeNm(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="hydro-size" className="text-xs">
                          Hydrodynamic Size (nm)
                          <FieldInfo tip="DLS diameter in solution. Leave blank to auto-estimate as 2× primary size." />
                        </Label>
                        <Input
                          id="hydro-size"
                          type="number"
                          placeholder="auto"
                          step="0.1"
                          value={hydrodynamicSizeNm}
                          onChange={(e) => setHydrodynamicSizeNm(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="zeta" className="text-xs">
                          Zeta Potential (mV)
                          <FieldInfo tip="Surface charge; negative values (< −30 mV) indicate colloidal stability." />
                        </Label>
                        <Input
                          id="zeta"
                          type="number"
                          placeholder="e.g. -28"
                          step="0.1"
                          required
                          value={zetaPotentialMv}
                          onChange={(e) => setZetaPotentialMv(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">
                          Morphology
                          <FieldInfo tip="Physical shape of the nanoparticle." />
                        </Label>
                        <Select value={morphology} onValueChange={setMorphology}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {MORPHOLOGIES.map((m) => (
                              <SelectItem key={m} value={m}>{m}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Surface */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Surface Coating</p>
                        <p className="text-xs text-muted-foreground">Has a functional surface coating</p>
                      </div>
                      <Switch checked={isCoated} onCheckedChange={setIsCoated} />
                    </div>
                    {isCoated && (
                      <div className="space-y-1">
                        <Label htmlFor="surface-chem" className="text-xs">
                          Surface Chemistry
                          <FieldInfo tip="Coating type or functional group (e.g. PEG, APTES, citrate)." />
                        </Label>
                        <Input
                          id="surface-chem"
                          type="text"
                          placeholder="e.g. PEG, citrate, amine"
                          value={surfaceChemistry}
                          onChange={(e) => setSurfaceChemistry(e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Exposure */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                      Exposure Parameters
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">
                          Cell Type
                          <FieldInfo tip="Target cell line for cytotoxicity assessment." />
                        </Label>
                        <Select value={cellType} onValueChange={setCellType}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CELL_TYPES.map((c) => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="exposure-time" className="text-xs">
                          Exposure Time (h)
                          <FieldInfo tip="Duration of nanoparticle exposure to cells." />
                        </Label>
                        <Input
                          id="exposure-time"
                          type="number"
                          placeholder="e.g. 24"
                          step="1"
                          required
                          value={exposureTimeH}
                          onChange={(e) => setExposureTimeH(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="dose-min" className="text-xs">
                          Min Dose (μg/mL)
                          <FieldInfo tip="Minimum concentration of NPs in cell culture medium." />
                        </Label>
                        <Input
                          id="dose-min"
                          type="number"
                          placeholder="e.g. 10"
                          step="0.1"
                          required
                          value={doseMinUgml}
                          onChange={(e) => setDoseMinUgml(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="dose-max" className="text-xs">
                          Max Dose (μg/mL)
                          <FieldInfo tip="Maximum dose. Leave blank to auto-set as 2× min dose." />
                        </Label>
                        <Input
                          id="dose-max"
                          type="number"
                          placeholder="auto"
                          step="0.1"
                          value={doseMaxUgml}
                          onChange={(e) => setDoseMaxUgml(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="ph" className="text-xs">
                          pH
                          <FieldInfo tip="Physiological pH of the biological compartment (e.g. 7.4 plasma, 4.5 lysosome)." />
                        </Label>
                        <Input
                          id="ph"
                          type="number"
                          placeholder="7.4"
                          step="0.1"
                          min="1"
                          max="14"
                          value={ph}
                          onChange={(e) => setPh(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Options */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Therapeutic Application</p>
                        <p className="text-xs text-muted-foreground">Nanoparticle is designed for drug delivery</p>
                      </div>
                      <Switch checked={isTherapeutic} onCheckedChange={setIsTherapeutic} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">AI Scientific Explanation</p>
                        <p className="text-xs text-muted-foreground">RAG-powered mechanistic interpretation (slower)</p>
                      </div>
                      <Switch checked={includeRag} onCheckedChange={setIncludeRag} />
                    </div>
                  </div>

                  {error && (
                    <div className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-xs text-destructive">
                      <AlertCircle className="size-3.5 inline mr-1" />
                      {error}
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="size-4 mr-2 animate-spin" />
                        Running Prediction…
                      </>
                    ) : (
                      <>
                        <Zap className="size-4 mr-2" />
                        Run Prediction
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Result Card */}
            <div className="space-y-4">
              {!result && !loading && (
                <Card className="border-dashed flex flex-col items-center justify-center h-full min-h-[300px] text-center">
                  <CardContent className="pt-8">
                    <FlaskConical className="size-12 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Configure parameters on the left and click <strong>Run Prediction</strong> to see results.
                    </p>
                  </CardContent>
                </Card>
              )}

              {loading && (
                <Card className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
                  <CardContent className="pt-8 space-y-3">
                    <Loader2 className="size-10 text-primary mx-auto animate-spin" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Running RF v2 Final Model…</p>
                      <p className="text-xs text-muted-foreground">Stage 1: Aggregation Dynamics</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {result && (
                <>
                  {/* Risk Card */}
                  <Card className={result.stage2.toxicity_prediction === "TOXIC"
                    ? "border-destructive/50 bg-destructive/5"
                    : "border-green-500/50 bg-green-500/5"
                  }>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Prediction Result</CardTitle>
                        <Badge
                          variant={result.stage2.toxicity_prediction === "TOXIC" ? "destructive" : "outline"}
                          className={result.stage2.toxicity_prediction === "SAFE"
                            ? "border-green-500 text-green-600 bg-green-500/10"
                            : ""
                          }
                        >
                          {result.stage2.toxicity_prediction === "TOXIC"
                            ? <><AlertCircle className="size-3 mr-1" /> TOXIC</>
                            : <><CheckCircle2 className="size-3 mr-1" /> SAFE</>
                          }
                        </Badge>
                      </div>
                      <CardDescription>ID: {result.particle_id}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Confidence Gauge */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Model Confidence</span>
                          <span className="font-medium tabular-nums">{result.stage2.confidence}%</span>
                        </div>
                        <Progress value={result.stage2.confidence} className="h-2" />
                      </div>

                      <Separator />

                      {/* Stage 1 */}
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                          Stage 1 — Aggregation Dynamics
                        </p>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="rounded-md bg-muted/50 p-2">
                            <p className="text-xs text-muted-foreground">Agg. Factor</p>
                            <p className="text-sm font-semibold tabular-nums">{result.stage1.aggregation_factor}×</p>
                          </div>
                          <div className="rounded-md bg-muted/50 p-2">
                            <p className="text-xs text-muted-foreground">Hydro. Diam.</p>
                            <p className="text-sm font-semibold tabular-nums">{result.stage1.hydrodynamic_diameter} nm</p>
                          </div>
                          <div className="rounded-md bg-muted/50 p-2">
                            <p className="text-xs text-muted-foreground">Zeta Shift</p>
                            <p className="text-sm font-semibold tabular-nums">{result.stage1.zeta_shift} mV</p>
                          </div>
                        </div>
                      </div>

                      {/* SHAP Top Features */}
                      {result.stage2.top_features && result.stage2.top_features.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                            Top Predictive Features (SHAP)
                          </p>
                          <div className="space-y-1.5">
                            {result.stage2.top_features.slice(0, 5).map((f) => (
                              <div key={f.feature} className="space-y-0.5">
                                <div className="flex justify-between text-xs">
                                  <span className="truncate">{f.feature}</span>
                                  <span className="tabular-nums font-medium ml-2">{(f.value * 100).toFixed(1)}%</span>
                                </div>
                                <Progress value={Math.abs(f.value) * 100} className="h-1" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Stage 3 */}
                      {result.stage3 && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                            Stage 3 — Mechanistic Cytotoxicity
                          </p>
                          <div className="space-y-2">
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span>ROS Generation</span>
                                <span className="tabular-nums font-medium text-destructive">{result.stage3.ros_generation}%</span>
                              </div>
                              <Progress value={result.stage3.ros_generation} className="h-1.5" />
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span>Apoptosis Likelihood</span>
                                <span className="tabular-nums font-medium">{result.stage3.apoptosis_likelihood}%</span>
                              </div>
                              <Progress value={result.stage3.apoptosis_likelihood} className="h-1.5" />
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span>Necrosis Likelihood</span>
                                <span className="tabular-nums font-medium">{result.stage3.necrosis_likelihood}%</span>
                              </div>
                              <Progress value={result.stage3.necrosis_likelihood} className="h-1.5" />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              <span className="font-medium text-foreground">Primary pathway:</span>{" "}
                              {result.stage3.primary_pathway}
                            </p>
                          </div>
                        </div>
                      )}

                      <Button variant="outline" size="sm" className="w-full">
                        <Download className="size-4 mr-2" />
                        Download Result Card (PDF)
                      </Button>
                    </CardContent>
                  </Card>

                  {/* AI Scientific Explanation */}
                  <Card className="border-primary/30 bg-primary/5">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <BookOpen className="size-4 text-primary" />
                        AI Scientific Explanation
                      </CardTitle>
                      <CardDescription className="text-xs">
                        RAG-powered analysis — mechanistic interpretation of your prediction result
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {result.explanation ? (
                        <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                          {result.explanation}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Enable <strong>AI Scientific Explanation</strong> before running the prediction to get a RAG-powered mechanistic interpretation.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ── Batch Upload Tab ── */}
        <TabsContent value="batch">
          <Card className="max-w-xl">
            <CardHeader>
              <CardTitle className="text-base">Batch Excel Prediction</CardTitle>
              <CardDescription>
                Upload an <code>.xlsx</code> file where each row is a nanoparticle. Required columns:{" "}
                <code>nanoparticle_name, np_type, primary_size_nm, zeta_potential_mv, cell_type, dose_min_ugml, exposure_time_h</code>.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center gap-3 text-center hover:border-primary/50 transition-colors">
                <Upload className="size-8 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Drop your Excel file here</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Supports .xlsx and .xls</p>
                </div>
                <Input
                  id="batch-file"
                  type="file"
                  accept=".xlsx,.xls"
                  className="max-w-[200px]"
                  onChange={handleBatchUpload}
                />
              </div>

              {batchFile && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
                  <CheckCircle2 className="size-4 text-green-500 shrink-0" />
                  <span className="truncate">{batchFile.name}</span>
                </div>
              )}

              {(batchLoading || batchStatus === "done") && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{batchStatus === "done" ? "Complete!" : "Processing rows…"}</span>
                    <span>{batchProgress}%</span>
                  </div>
                  <Progress value={batchProgress} className={batchStatus === "done" ? "[&>div]:bg-green-500" : ""} />
                </div>
              )}

              {batchJobId && (
                <p className="text-xs text-muted-foreground">Job ID: <code className="font-mono">{batchJobId}</code></p>
              )}

              {batchStatus === "failed" && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="size-4" />
                  Processing failed. Please check your file format and try again.
                </div>
              )}

              <Button
                className="w-full"
                disabled={!batchFile || batchLoading}
                onClick={handleBatchRun}
              >
                {batchLoading ? (
                  <><Loader2 className="size-4 mr-2 animate-spin" /> Processing…</>
                ) : (
                  <><Zap className="size-4 mr-2" /> Run Batch Prediction</>
                )}
              </Button>

              {batchStatus === "done" && batchJobId && (
                <Button
                  variant="default"
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => window.open(`/api/bulk/${batchJobId}/download`, "_blank")}
                >
                  <Download className="size-4 mr-2" />
                  Download Results Excel
                </Button>
              )}

              <Button variant="outline" className="w-full" size="sm">
                <Download className="size-4 mr-2" />
                Download Template Excel
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

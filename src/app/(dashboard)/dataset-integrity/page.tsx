"use client"

import * as React from "react"
import {
  Database,
  Upload,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Layers,
  Atom,
  BarChart3,
} from "lucide-react"
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"
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
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

const categoryData = [
  { category: "Metal Oxides", count: 5840, color: "var(--primary)" },
  { category: "Noble Metals", count: 3210, color: "hsl(var(--chart-2))" },
  { category: "Carbon-based", count: 2180, color: "hsl(var(--chart-3))" },
  { category: "Polymeric", count: 1890, color: "hsl(var(--chart-4))" },
  { category: "Quantum Dots", count: 980, color: "hsl(var(--chart-5))" },
  { category: "Dendrimers", count: 691, color: "var(--destructive)" },
]

const completenessData = [
  { field: "Core Size", pct: 100 },
  { field: "Zeta Potential", pct: 98.4 },
  { field: "Surface Area", pct: 94.1 },
  { field: "Bandgap Energy", pct: 87.3 },
  { field: "Dosage", pct: 100 },
  { field: "Exposure Time", pct: 99.2 },
  { field: "pH", pct: 61.8 },
  { field: "Protein Corona", pct: 44.7 },
  { field: "Temperature", pct: 72.5 },
]

const pieConfig = {
  count: { label: "Samples" },
  "Metal Oxides": { label: "Metal Oxides", color: "var(--primary)" },
  "Noble Metals": { label: "Noble Metals", color: "hsl(var(--chart-2))" },
  "Carbon-based": { label: "Carbon-based", color: "hsl(var(--chart-3))" },
  "Polymeric": { label: "Polymeric", color: "hsl(var(--chart-4))" },
  "Quantum Dots": { label: "Quantum Dots", color: "hsl(var(--chart-5))" },
  "Dendrimers": { label: "Dendrimers", color: "var(--destructive)" },
} satisfies ChartConfig

export default function DatasetIntegrityPage() {
  const [uploading, setUploading] = React.useState(false)
  const [uploadProgress, setUploadProgress] = React.useState(0)
  const total = categoryData.reduce((s, d) => s + d.count, 0)

  const handleUpload = async () => {
    setUploading(true)
    setUploadProgress(0)
    for (let i = 0; i <= 100; i += 5) {
      await new Promise(r => setTimeout(r, 80))
      setUploadProgress(i)
    }
    setUploading(false)
  }

  return (
    <div className="px-4 lg:px-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Database className="size-6 text-primary" />
          Dataset Integrity
        </h1>
        <p className="text-muted-foreground">
          The NanoToxi AI moat — 14,791+ validated samples across 6 nanoparticle categories.
        </p>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Samples", value: "14,791", icon: Atom, color: "text-primary" },
          { label: "Categories", value: "6", icon: Layers, color: "text-primary" },
          { label: "Avg. Completeness", value: "84.2%", icon: BarChart3, color: "text-primary" },
          { label: "Community Submissions", value: "312", icon: Upload, color: "text-primary" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1.5 text-xs">
                <Icon className={`size-3.5 ${color}`} />
                {label}
              </CardDescription>
              <p className="text-2xl font-semibold tabular-nums">{value}</p>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Distribution Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sample Distribution by Category</CardTitle>
            <CardDescription>All {total.toLocaleString()} validated samples</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={pieConfig} className="h-[240px] w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent nameKey="category" />} />
                <Pie
                  data={categoryData}
                  dataKey="count"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ name, percent }: { name?: string; percent?: number }) =>
                    `${name ?? ''}: ${((percent ?? 0) * 100).toFixed(1)}%`
                  }
                  labelLine={false}
                >
                  {categoryData.map((entry) => (
                    <Cell key={entry.category} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            {/* Legend */}
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
              {categoryData.map((d) => (
                <div key={d.category} className="flex items-center gap-2 text-xs">
                  <div className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                  <span className="text-muted-foreground">{d.category}</span>
                  <span className="ml-auto tabular-nums font-medium">{d.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Field Completeness */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Field Completeness Tracker</CardTitle>
            <CardDescription>Percentage of samples with each property recorded</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {completenessData.map(({ field, pct }) => (
              <div key={field} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>{field}</span>
                  <span className={`tabular-nums font-medium ${pct < 70 ? "text-destructive" : pct < 90 ? "text-yellow-500" : "text-green-500"}`}>
                    {pct}%
                  </span>
                </div>
                <Progress
                  value={pct}
                  className="h-1.5"
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Data Contribution Portal */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="size-4 text-primary" />
            Community Data Contribution
          </CardTitle>
          <CardDescription>
            Strengthen the model by contributing your validated nanoparticle toxicity datasets. All submissions undergo peer review before integration.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contrib-name" className="text-xs">Your Name / Institution</Label>
              <Input id="contrib-name" placeholder="e.g. MIT Materials Lab" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contrib-file" className="text-xs">Dataset File (.csv, .xlsx)</Label>
              <Input id="contrib-file" type="file" accept=".csv,.xlsx,.xls" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="contrib-notes" className="text-xs">Notes (methodology, cell lines, assays used)</Label>
            <Input id="contrib-notes" placeholder="Briefly describe your experimental conditions…" />
          </div>

          {uploading && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Uploading…</span><span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          <Button onClick={handleUpload} disabled={uploading} className="gap-2">
            <Upload className="size-4" />
            {uploading ? "Uploading…" : "Submit Dataset for Review"}
          </Button>

          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-md p-3">
            <CheckCircle2 className="size-4 text-green-500 shrink-0 mt-0.5" />
            <span>
              Accepted datasets are credited to the contributor in the model changelog and earn priority access to future NanoToxi AI features.
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

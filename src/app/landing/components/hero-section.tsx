"use client"

import Link from "next/link"
import { ArrowRight, FlaskConical, ShieldCheck, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DotPattern } from "@/components/dot-pattern"

export function HeroSection() {
  return (
    <section id="hero" className="relative overflow-hidden bg-gradient-to-b from-background to-background/80 pt-20 pb-24">
      <div className="absolute inset-0">
        <DotPattern className="opacity-100" size="md" fadeStyle="ellipse" />
      </div>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-8 flex justify-center">
            <Badge variant="outline" className="px-4 py-2 border-primary/40 gap-2">
              <FlaskConical className="w-3 h-3" />
              RF v6 Model · 14,791 Validated Samples · SHAP Explainability
            </Badge>
          </div>
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            Predict Nanoparticle
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {" "}Toxicity{" "}
            </span>
            in Seconds
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            NanoToxi AI is an in-silico safety assessment platform for nanoparticles.
            Run toxicity simulations, get SHAP explanations, and export batch results — all without a wet lab.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" className="text-base cursor-pointer" asChild>
              <Link href="/sign-up">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="text-base cursor-pointer" asChild>
              <a href="#pricing">
                View Pricing
              </a>
            </Button>
          </div>
          <div className="mt-12 flex justify-center gap-8 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><ShieldCheck className="size-4 text-green-500" /> 14-day free trial</span>
            <span className="flex items-center gap-1.5"><Zap className="size-4 text-primary" /> Instant results</span>
            <span className="flex items-center gap-1.5"><FlaskConical className="size-4 text-primary" /> No wet lab needed</span>
          </div>
        </div>
      </div>
    </section>
  )
}

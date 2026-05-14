"use client"

import Link from "next/link"
import { ArrowRight, FlaskConical } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CTASection() {
  return (
    <section className="py-16 lg:py-24 bg-primary/5 border-y border-primary/10">
      <div className="container mx-auto px-4 lg:px-8 text-center">
        <FlaskConical className="mx-auto mb-4 size-10 text-primary" />
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
          Ready to run your first simulation?
        </h2>
        <p className="mx-auto mb-8 max-w-xl text-lg text-muted-foreground">
          Join researchers using NanoToxi AI to accelerate nanoparticle safety screening.
          Start with a 14-day free trial — no credit card required.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Button size="lg" asChild>
            <Link href="/sign-up">
              Start Free Trial
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <a href="#pricing">See Pricing</a>
          </Button>
        </div>
      </div>
    </section>
  )
}

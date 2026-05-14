import { PricingPlans } from "@/components/pricing-plans"
import { Badge } from "@/components/ui/badge"

export function PricingSection() {
  return (
    <section id="pricing" className="py-24 sm:py-32 bg-muted/40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-12">
          <Badge variant="outline" className="mb-4">Pricing</Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            One plan. Full access.
          </h2>
          <p className="text-lg text-muted-foreground">
            Start with a 14-day free trial. No credit card required upfront.
          </p>
        </div>
        <PricingPlans mode="pricing" />
      </div>
    </section>
  )
}

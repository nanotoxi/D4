import Stripe from "stripe"

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set")
    _stripe = new Stripe(key, { typescript: true })
  }
  return _stripe
}

// Keep named export for backwards compat — lazy proxy
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop]
  },
})

export const PRICE_IDS = {
  individual: process.env.NEXT_PUBLIC_STRIPE_INDIVIDUAL_PRICE_ID!,
} as const

export type PlanId = keyof typeof PRICE_IDS

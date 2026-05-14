import type { Metadata } from "next"
import { LandingPageContent } from "./landing-page-content"

export const metadata: Metadata = {
  title: "NanoToxi AI — In-Silico Nanoparticle Toxicity Prediction",
  description: "Predict nanoparticle toxicity in seconds using our RF v6 ML model trained on 14,791 validated samples. SHAP explanations, batch predictions, and RAG-powered insights.",
  keywords: ["nanoparticle toxicity", "nanotoxicology", "in silico", "RF model", "SHAP", "nanomedicine safety"],
  openGraph: {
    title: "NanoToxi AI — In-Silico Nanoparticle Toxicity Prediction",
    description: "Predict nanoparticle toxicity in seconds. 14,791 validated samples. SHAP explainability. Batch predictions.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NanoToxi AI — In-Silico Nanoparticle Toxicity Prediction",
    description: "Predict nanoparticle toxicity in seconds. 14,791 validated samples. SHAP explainability.",
  },
}

export default function LandingPage() {
  return <LandingPageContent />
}

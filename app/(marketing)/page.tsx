"use client"

import { HeroSection } from "@/components/sections/hero-section"
import { POSSection } from "@/components/sections/pos-section"
import { DistributionSection } from "@/components/sections/distribution-section"
import { CloudSection } from "@/components/sections/cloud-section"
import { RSGESection } from "@/components/sections/rsge-section"
import { IntegrationsSection } from "@/components/sections/integrations-section"
import { CTASection } from "@/components/sections/cta-section"
import { Navigation } from "@/components/navigation"

export default function MarketingPage() {
    return (
        <main className="relative bg-background overflow-x-hidden dark">
            <Navigation />
            <div className="scroll-snap-y hide-scrollbar">
                <HeroSection />
                <POSSection />
                <DistributionSection />
                <CloudSection />
                <RSGESection />
                <IntegrationsSection />
                <CTASection />
            </div>
        </main>
    )
}

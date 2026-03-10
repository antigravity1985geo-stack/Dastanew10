"use client"

import { useEffect, useRef, useState } from "react"
import { CreditCard, Receipt, Scan, Wifi, Check } from "lucide-react"

export function POSSection() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.2 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const features = [
    { icon: CreditCard, text: "უნაღდო გადახდები" },
    { icon: Receipt, text: "ელ. ქვითრები" },
    { icon: Scan, text: "შტრიხკოდის სკანერი" },
    { icon: Wifi, text: "ოფლაინ რეჟიმი" },
  ]

  return (
    <section
      id="pos"
      ref={sectionRef}
      className="min-h-screen flex items-center py-16 md:py-20 relative overflow-hidden scroll-snap-start"
    >
      {/* Background Effect */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] md:w-[800px] h-[400px] md:h-[800px] bg-primary/10 rounded-full blur-[100px] md:blur-[150px]" />
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 md:gap-16 items-center">
          {/* Left Side - 3D POS Terminal Animation */}
          <div
            className={`relative perspective-1000 transition-all duration-1000 order-2 lg:order-1 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-20"
            }`}
          >
            {/* POS Terminal 3D Model */}
            <div className="relative mx-auto w-full max-w-xs md:max-w-sm lg:max-w-md">
              {/* Main Terminal Body */}
              <div className="relative preserve-3d animate-float">
                {/* Screen */}
                <div className="glass rounded-2xl p-4 md:p-6 relative overflow-hidden">
                  {/* Screen Header */}
                  <div className="flex items-center justify-between mb-3 md:mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-accent animate-pulse" />
                      <span className="text-xs md:text-sm text-muted-foreground">მზადაა</span>
                    </div>
                    <Wifi className="w-3 h-3 md:w-4 md:h-4 text-accent" />
                  </div>

                  {/* Transaction Animation */}
                  <div className="space-y-2 md:space-y-3 mb-4 md:mb-6">
                    <div className="flex justify-between items-center p-2 md:p-3 bg-secondary/50 rounded-lg animate-shimmer">
                      <span className="text-sm md:text-base text-foreground">პროდუქტი #1</span>
                      <span className="text-sm md:text-base text-primary font-bold">25.00 GEL</span>
                    </div>
                    <div
                      className="flex justify-between items-center p-2 md:p-3 bg-secondary/50 rounded-lg animate-shimmer"
                      style={{ animationDelay: "0.2s" }}
                    >
                      <span className="text-sm md:text-base text-foreground">პროდუქტი #2</span>
                      <span className="text-sm md:text-base text-primary font-bold">18.50 GEL</span>
                    </div>
                    <div
                      className="flex justify-between items-center p-2 md:p-3 bg-secondary/50 rounded-lg animate-shimmer"
                      style={{ animationDelay: "0.4s" }}
                    >
                      <span className="text-sm md:text-base text-foreground">პროდუქტი #3</span>
                      <span className="text-sm md:text-base text-primary font-bold">32.00 GEL</span>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="border-t border-border pt-3 md:pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-base md:text-lg text-foreground">სულ:</span>
                      <span className="text-xl md:text-2xl font-bold gradient-text">75.50 GEL</span>
                    </div>
                  </div>

                  {/* Payment Success Animation */}
                  <div className="mt-3 md:mt-4 flex items-center justify-center gap-2 p-2 md:p-3 bg-accent/20 rounded-lg">
                    <Check className="w-4 h-4 md:w-5 md:h-5 text-accent animate-pulse" />
                    <span className="text-sm md:text-base text-accent font-medium">გადახდა წარმატებულია</span>
                  </div>
                </div>

                {/* Card Reader Animation */}
                <div className="mt-3 md:mt-4 glass rounded-xl p-3 md:p-4 flex items-center gap-3 md:gap-4">
                  <div className="w-10 md:w-12 h-6 md:h-8 rounded bg-gradient-to-r from-primary to-accent animate-pulse" />
                  <div className="flex-1">
                    <div className="h-2 bg-muted rounded animate-shimmer" />
                  </div>
                </div>

                {/* Floating Icons - hidden on mobile */}
                <div className="hidden md:flex absolute -top-4 -right-4 w-12 h-12 glass rounded-full items-center justify-center animate-orbit">
                  <CreditCard className="w-6 h-6 text-primary" />
                </div>
                <div
                  className="hidden md:flex absolute -bottom-4 -left-4 w-12 h-12 glass rounded-full items-center justify-center animate-orbit"
                  style={{ animationDelay: "4s" }}
                >
                  <Receipt className="w-6 h-6 text-accent" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Content */}
          <div
            className={`transition-all duration-1000 delay-300 order-1 lg:order-2 text-center lg:text-left ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-20"
            }`}
          >
            <span className="text-primary font-semibold mb-2 md:mb-4 block text-sm md:text-base">POS ტერმინალი</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 md:mb-6">
              თანამედროვე
              <br />
              <span className="gradient-text">გაყიდვების წერტილი</span>
            </h2>
            <p className="text-sm md:text-lg text-muted-foreground mb-6 md:mb-8 leading-relaxed max-w-lg mx-auto lg:mx-0">
              სრულად ინტეგრირებული POS სისტემა, რომელიც აკავშირებს გაყიდვებს,
              მარაგს და ფინანსურ აღრიცხვას ერთ პლატფორმაზე. მუშაობს ოფლაინ
              რეჟიმშიც.
            </p>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-2 md:gap-4 max-w-lg mx-auto lg:mx-0">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 md:gap-3 glass p-3 md:p-4 rounded-xl animate-scale-in"
                  style={{ animationDelay: `${0.5 + index * 0.1}s` }}
                >
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                    <feature.icon className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                  </div>
                  <span className="text-xs md:text-sm lg:text-base text-foreground">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

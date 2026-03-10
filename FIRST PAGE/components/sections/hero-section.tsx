"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronDown, Zap, Shield, Globe, Cloud } from "lucide-react"

export function HeroSection() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden scroll-snap-start"
    >
      {/* Video Background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 min-w-full min-h-full w-auto h-auto object-cover"
        >
          <source src="/videos/hero-background.webm" type="video/webm" />
        </video>
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-background/70" />
      </div>

      {/* 3D Floating Elements - hidden on small screens */}
      <div className="absolute inset-0 perspective-1000 hidden md:block z-10">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute w-4 h-4 rounded-full bg-primary/30 animate-float"
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + (i % 3) * 20}%`,
              animationDelay: `${i * 0.5}s`,
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 md:px-6 text-center relative z-20">
        <div className="flex flex-col items-center gap-6 md:gap-8">
          {/* Badge - First to appear */}
          <div 
            className={`inline-flex items-center gap-2 glass px-3 md:px-4 py-2 rounded-full transition-all duration-700 ease-out ${
              isVisible 
                ? "opacity-100 translate-y-0" 
                : "opacity-0 translate-y-8"
            }`}
            style={{ transitionDelay: "0.2s" }}
          >
            <Cloud className="w-4 h-4 text-primary" />
            <span className="text-xs md:text-sm text-muted-foreground">
              DASTA CLOUD - ახალი თაობის ERP
            </span>
          </div>

          {/* Feature Pills - Appear one by one */}
          <div className="flex flex-wrap justify-center gap-2 md:gap-4 px-2">
            {[
              { icon: Shield, text: "დაცული მონაცემები", delay: 0.6 },
              { icon: Globe, text: "100% ქართული", delay: 1.0 },
              { icon: Zap, text: "რეალ-თაიმ სინქრო", delay: 1.4 },
            ].map((feature, index) => (
              <div
                key={index}
                className={`flex items-center gap-2 glass px-3 md:px-4 py-2 rounded-full transition-all duration-700 ease-out ${
                  isVisible 
                    ? "opacity-100 translate-y-0 scale-100" 
                    : "opacity-0 translate-y-8 scale-95"
                }`}
                style={{ transitionDelay: `${feature.delay}s` }}
              >
                <feature.icon className="w-3 h-3 md:w-4 md:h-4 text-primary" />
                <span className="text-xs md:text-sm text-foreground">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-6 h-6 md:w-8 md:h-8 text-muted-foreground" />
        </div>
      </div>
    </section>
  )
}

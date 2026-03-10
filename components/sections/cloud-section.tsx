"use client"

import { useEffect, useRef, useState } from "react"
import { Cloud, Shield, Lock, Server, Database, CheckCircle, Zap, Globe } from "lucide-react"

export function CloudSection() {
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

  const securityFeatures = [
    { icon: Lock, title: "End-to-End შიფრაცია", desc: "AES-256 დაშიფვრა" },
    { icon: Shield, title: "DDoS დაცვა", desc: "24/7 მონიტორინგი" },
    { icon: Server, title: "რეზერვირება", desc: "99.99% uptime" },
    { icon: Database, title: "ავტო-ბექაპი", desc: "ყოველ საათში" },
  ]

  const advantages = [
    "საერთაშორისო სტანდარტების სერთიფიცირება",
    "ევროკავშირის GDPR სტანდარტი",
    "ქართულ ბაზარზე უნიკალური",
    "მონაცემთა ლოკალური შენახვა",
    "რეალ-თაიმ რეპლიკაცია",
    "დისასტერ რიქავერი",
  ]

  return (
    <section
      id="cloud"
      ref={sectionRef}
      className="min-h-screen flex items-center py-16 md:py-20 relative overflow-hidden scroll-snap-start"
    >
      {/* Unique Background - Different from others */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] md:w-[1000px] h-[500px] md:h-[1000px] rounded-full border border-primary/10 animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] md:w-[800px] h-[400px] md:h-[800px] rounded-full border border-primary/20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[600px] h-[300px] md:h-[600px] rounded-full border border-primary/30" />
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        {/* Section Header */}
        <div
          className={`text-center mb-10 md:mb-16 transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <div className="inline-flex items-center gap-2 glass px-3 md:px-4 py-2 rounded-full mb-4 md:mb-6">
            <Shield className="w-3 h-3 md:w-4 md:h-4 text-primary" />
            <span className="text-xs md:text-sm text-primary font-medium">
              განსხვავებული სხვა ქართული პროექტებისგან
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 md:mb-6">
            DASTA CLOUD
            <br />
            <span className="gradient-text">უსაფრთხოება</span>
          </h2>
          <p className="text-sm md:text-xl text-muted-foreground max-w-2xl mx-auto px-2">
            თქვენი მონაცემები საიმედოდ დაცულია ევროპული სტანდარტებით.
            ქართულ ბაზარზე ერთადერთი სრულად სერთიფიცირებული Cloud გადაწყვეტა.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 md:gap-16 items-center">
          {/* Left Side - Cloud Animation */}
          <div
            className={`relative transition-all duration-1000 order-2 lg:order-1 ${
              isVisible ? "opacity-100 scale-100" : "opacity-0 scale-90"
            }`}
          >
            {/* Main Cloud Icon */}
            <div className="relative mx-auto w-60 h-60 md:w-80 md:h-80">
              {/* Outer Glow Ring */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 animate-pulse blur-xl" />
              
              {/* Main Cloud Container */}
              <div className="absolute inset-6 md:inset-8 glass rounded-full flex items-center justify-center glow-primary">
                <Cloud className="w-16 h-16 md:w-24 md:h-24 text-primary animate-float" />
              </div>

              {/* Orbiting Security Icons - hidden on small mobile */}
              <div className="hidden sm:block">
                {[Shield, Lock, Server, Database].map((Icon, index) => (
                  <div
                    key={index}
                    className="absolute w-10 h-10 md:w-12 md:h-12 glass rounded-full flex items-center justify-center"
                    style={{
                      animation: `orbit 12s linear infinite`,
                      animationDelay: `${index * 3}s`,
                      top: "50%",
                      left: "50%",
                      marginTop: "-20px",
                      marginLeft: "-20px",
                    }}
                  >
                    <Icon className="w-5 h-5 md:w-6 md:h-6 text-accent" />
                  </div>
                ))}
              </div>

              {/* Data Flow Particles - reduced and hidden on mobile */}
              <div className="hidden lg:block">
                {[38, 48, 55, 45].map((leftPos, index) => (
                  <div
                    key={index}
                    className="absolute w-2 h-2 rounded-full bg-primary animate-data-flow"
                    style={{
                      left: `${leftPos}%`,
                      animationDelay: `${index * 0.5}s`,
                      opacity: 0.5,
                    }}
                  />
                ))}
              </div>

              {/* Connection Lines */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 320 320">
                <circle
                  cx="160"
                  cy="160"
                  r="100"
                  fill="none"
                  stroke="url(#cloudGradient)"
                  strokeWidth="1"
                  strokeDasharray="10,5"
                  className="animate-rotate-slow"
                />
                <defs>
                  <linearGradient id="cloudGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--primary)" />
                    <stop offset="100%" stopColor="var(--accent)" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Security Badge */}
            <div className="absolute -bottom-2 md:-bottom-4 left-1/2 -translate-x-1/2 glass px-4 md:px-6 py-2 md:py-3 rounded-full flex items-center gap-2 md:gap-3">
              <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-accent" />
              <span className="text-xs md:text-base text-foreground font-medium">ISO 27001 სერთიფიცირებული</span>
            </div>
          </div>

          {/* Right Side - Features & Advantages */}
          <div
            className={`transition-all duration-1000 delay-300 order-1 lg:order-2 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-20"
            }`}
          >
            {/* Security Features Grid */}
            <div className="grid grid-cols-2 gap-2 md:gap-4 mb-6 md:mb-8">
              {securityFeatures.map((feature, index) => (
                <div
                  key={index}
                  className="glass p-3 md:p-5 rounded-xl animate-scale-in hover:glow-primary transition-all duration-300"
                  style={{ animationDelay: `${0.5 + index * 0.1}s` }}
                >
                  <feature.icon className="w-6 h-6 md:w-8 md:h-8 text-primary mb-2 md:mb-3" />
                  <h4 className="text-sm md:text-base text-foreground font-semibold mb-0.5 md:mb-1">{feature.title}</h4>
                  <p className="text-xs md:text-sm text-muted-foreground">{feature.desc}</p>
                </div>
              ))}
            </div>

            {/* Unique Advantages */}
            <div className="glass p-4 md:p-6 rounded-xl">
              <div className="flex items-center gap-2 mb-3 md:mb-4">
                <Zap className="w-4 h-4 md:w-5 md:h-5 text-chart-3" />
                <span className="text-sm md:text-base text-foreground font-semibold">რატომ ვართ განსხვავებული</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                {advantages.map((advantage, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-muted-foreground animate-slide-up"
                    style={{ animationDelay: `${0.8 + index * 0.1}s` }}
                  >
                    <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-accent shrink-0" />
                    <span className="text-xs md:text-sm">{advantage}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Trust Badge */}
            <div className="mt-4 md:mt-6 flex flex-wrap items-center justify-center gap-4 md:gap-6">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Globe className="w-3 h-3 md:w-4 md:h-4" />
                <span className="text-xs md:text-sm">EU GDPR</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Shield className="w-3 h-3 md:w-4 md:h-4" />
                <span className="text-xs md:text-sm">SOC 2</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Lock className="w-3 h-3 md:w-4 md:h-4" />
                <span className="text-xs md:text-sm">ISO 27001</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

"use client"

import { useEffect, useRef, useState } from "react"
import { Truck, MapPin, Package, BarChart3, Route, Clock } from "lucide-react"

export function DistributionSection() {
  const [isVisible, setIsVisible] = useState(false)
  const [activeRoute, setActiveRoute] = useState(0)
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

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveRoute((prev) => (prev + 1) % 4)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  const routes = [
    { name: "თბილისი", packages: 45, status: "მიწოდებაში" },
    { name: "ბათუმი", packages: 23, status: "დაგეგმილი" },
    { name: "ქუთაისი", packages: 31, status: "მიწოდებაში" },
    { name: "რუსთავი", packages: 18, status: "დასრულებული" },
  ]

  const stats = [
    { icon: Truck, value: "500+", label: "მანქანა" },
    { icon: Package, value: "10K+", label: "შეკვეთა/დღე" },
    { icon: Route, value: "98%", label: "დროზე მიწოდება" },
    { icon: Clock, value: "24/7", label: "მონიტორინგი" },
  ]

  return (
    <section
      id="distribution"
      ref={sectionRef}
      className="min-h-screen flex items-center py-16 md:py-20 relative overflow-hidden scroll-snap-start"
    >
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute bottom-0 right-0 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-accent/10 rounded-full blur-[100px] md:blur-[150px]" />
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 md:gap-16 items-center">
          {/* Left Side - Content */}
          <div
            className={`transition-all duration-1000 text-center lg:text-left ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-20"
            }`}
          >
            <span className="text-accent font-semibold mb-2 md:mb-4 block text-sm md:text-base">დისტრიბუცია</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 md:mb-6">
              ლოჯისტიკის
              <br />
              <span className="gradient-text">სრული კონტროლი</span>
            </h2>
            <p className="text-sm md:text-lg text-muted-foreground mb-6 md:mb-8 leading-relaxed max-w-lg mx-auto lg:mx-0">
              რეალ-თაიმ თვალყურის დევნება, ოპტიმალური მარშრუტები და სრული
              გამჭვირვალობა თქვენი დისტრიბუციის ქსელზე. GPS ტრეკინგი და
              ავტომატური ანგარიშგება.
            </p>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 max-w-lg mx-auto lg:mx-0 lg:max-w-none">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="glass p-3 md:p-4 rounded-xl text-center animate-scale-in"
                  style={{ animationDelay: `${0.5 + index * 0.1}s` }}
                >
                  <stat.icon className="w-5 h-5 md:w-6 md:h-6 text-accent mx-auto mb-1 md:mb-2" />
                  <div className="text-lg md:text-2xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-xs md:text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side - Distribution Map Animation */}
          <div
            className={`relative transition-all duration-1000 delay-300 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-20"
            }`}
          >
            {/* Map Container */}
            <div className="glass rounded-2xl p-4 md:p-6 relative overflow-hidden">
              {/* Map Grid Background */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(100,200,150,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(100,200,150,0.05)_1px,transparent_1px)] bg-[size:30px_30px] md:bg-[size:40px_40px]" />

              {/* Map Header */}
              <div className="flex items-center justify-between mb-4 md:mb-6 relative z-10">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-accent" />
                  <span className="text-sm md:text-base text-foreground font-medium">ცოცხალი რუკა</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                  <span className="text-xs md:text-sm text-muted-foreground">ლაივ</span>
                </div>
              </div>

              {/* Animated Routes */}
              <div className="relative h-48 md:h-64 mb-4 md:mb-6">
                {/* Central Hub */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 md:w-16 md:h-16 rounded-full bg-accent/20 flex items-center justify-center glow-accent">
                  <Package className="w-6 h-6 md:w-8 md:h-8 text-accent" />
                </div>

                {/* Route Lines */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 200">
                  {[
                    { x1: 150, y1: 100, x2: 50, y2: 30 },
                    { x1: 150, y1: 100, x2: 250, y2: 40 },
                    { x1: 150, y1: 100, x2: 40, y2: 160 },
                    { x1: 150, y1: 100, x2: 260, y2: 170 },
                  ].map((line, index) => (
                    <line
                      key={index}
                      x1={line.x1}
                      y1={line.y1}
                      x2={line.x2}
                      y2={line.y2}
                      stroke={activeRoute === index ? "var(--accent)" : "var(--border)"}
                      strokeWidth="2"
                      strokeDasharray="5,5"
                      className="transition-all duration-500"
                      style={{
                        strokeDashoffset: activeRoute === index ? 0 : 100,
                      }}
                    />
                  ))}
                </svg>

                {/* Destination Points */}
                {[
                  { top: "5%", left: "10%" },
                  { top: "10%", right: "10%" },
                  { bottom: "10%", left: "5%" },
                  { bottom: "5%", right: "5%" },
                ].map((pos, index) => (
                  <div
                    key={index}
                    className={`absolute w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center transition-all duration-500 ${
                      activeRoute === index
                        ? "bg-accent scale-125 glow-accent"
                        : "bg-secondary"
                    }`}
                    style={pos as React.CSSProperties}
                  >
                    <MapPin
                      className={`w-3 h-3 md:w-4 md:h-4 ${
                        activeRoute === index ? "text-accent-foreground" : "text-muted-foreground"
                      }`}
                    />
                  </div>
                ))}

                {/* Moving Truck */}
                <div
                  className="absolute w-8 h-8 md:w-10 md:h-10 glass rounded-lg flex items-center justify-center animate-pulse transition-all duration-1000"
                  style={{
                    top: `${30 + activeRoute * 10}%`,
                    left: `${20 + activeRoute * 15}%`,
                  }}
                >
                  <Truck className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                </div>
              </div>

              {/* Route List */}
              <div className="space-y-2">
                {routes.map((route, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-2 md:p-3 rounded-lg transition-all duration-300 ${
                      activeRoute === index ? "bg-accent/20" : "bg-secondary/30"
                    }`}
                  >
                    <div className="flex items-center gap-2 md:gap-3">
                      <MapPin
                        className={`w-3 h-3 md:w-4 md:h-4 ${
                          activeRoute === index ? "text-accent" : "text-muted-foreground"
                        }`}
                      />
                      <span className="text-sm md:text-base text-foreground">{route.name}</span>
                    </div>
                    <div className="flex items-center gap-2 md:gap-4">
                      <span className="text-xs md:text-sm text-muted-foreground">
                        {route.packages}
                      </span>
                      <span
                        className={`text-[10px] md:text-xs px-2 py-1 rounded-full ${
                          route.status === "მიწოდებაში"
                            ? "bg-primary/20 text-primary"
                            : route.status === "დასრულებული"
                            ? "bg-accent/20 text-accent"
                            : "bg-chart-3/20 text-chart-3"
                        }`}
                      >
                        {route.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

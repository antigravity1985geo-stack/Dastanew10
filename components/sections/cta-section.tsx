"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, Phone, Mail, MessageCircle, Cloud } from "lucide-react"

export function CTASection() {
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

  return (
    <section
      ref={sectionRef}
      className="min-h-screen flex items-center py-16 md:py-20 relative overflow-hidden scroll-snap-start"
    >
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-transparent to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] md:w-[800px] h-[400px] md:h-[800px] rounded-full border border-primary/20 animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[600px] h-[300px] md:h-[600px] rounded-full border border-primary/30 animate-pulse" style={{ animationDelay: "0.5s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] md:w-[400px] h-[200px] md:h-[400px] rounded-full border border-primary/40 animate-pulse" style={{ animationDelay: "1s" }} />

        {/* Floating particles - fixed positions to avoid hydration mismatch */}
        <div className="hidden md:block">
          {[
            { left: 10, top: 20, delay: 0, duration: 5 },
            { left: 25, top: 45, delay: 1, duration: 6 },
            { left: 40, top: 15, delay: 2, duration: 4.5 },
            { left: 55, top: 70, delay: 0.5, duration: 5.5 },
            { left: 70, top: 30, delay: 1.5, duration: 6.5 },
            { left: 85, top: 55, delay: 2.5, duration: 4 },
            { left: 15, top: 75, delay: 3, duration: 5 },
            { left: 30, top: 90, delay: 0.8, duration: 7 },
            { left: 60, top: 10, delay: 1.8, duration: 5.2 },
            { left: 90, top: 40, delay: 2.2, duration: 6.2 },
            { left: 5, top: 50, delay: 3.5, duration: 4.8 },
            { left: 45, top: 85, delay: 4, duration: 5.8 },
            { left: 75, top: 65, delay: 0.3, duration: 6.8 },
            { left: 20, top: 35, delay: 1.2, duration: 4.2 },
            { left: 50, top: 25, delay: 2.8, duration: 7.2 },
          ].map((particle, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-primary/30 animate-float"
              style={{
                left: `${particle.left}%`,
                top: `${particle.top}%`,
                animationDelay: `${particle.delay}s`,
                animationDuration: `${particle.duration}s`,
              }}
            />
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div
          className={`max-w-4xl mx-auto text-center transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 glass px-3 md:px-4 py-2 rounded-full mb-6 md:mb-8 animate-pulse">
            <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-primary" />
            <span className="text-xs md:text-sm text-foreground">მზად ხართ დასაწყებად?</span>
          </div>

          {/* Main Heading */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-foreground mb-4 md:mb-6 px-2">
            გარდაქმენით თქვენი
            <br />
            <span className="gradient-text">ბიზნესი დღესვე</span>
          </h2>

          <p className="text-sm md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 md:mb-12 px-2">
            შეუერთდით 500+ კომპანიას, რომლებიც უკვე იყენებენ DASTA CLOUD სისტემას.
            უფასო დემო და 14 დღიანი საცდელი პერიოდი.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center mb-10 md:mb-16 px-4">
            <Button
              size="lg"
              className="bg-primary text-primary-foreground px-6 md:px-10 py-5 md:py-7 text-base md:text-lg glow-primary hover:opacity-90 transition-all group w-full sm:w-auto"
            >
              დაიწყეთ უფასოდ
              <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="px-6 md:px-10 py-5 md:py-7 text-base md:text-lg border-border text-foreground hover:bg-secondary w-full sm:w-auto"
            >
              <MessageCircle className="mr-2 h-4 w-4 md:h-5 md:w-5" />
              კონსულტაცია
            </Button>
          </div>

          {/* Contact Options */}
          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-4 md:gap-8 mb-10 md:mb-16">
            <a href="tel:+995557504141" className="flex items-center justify-center gap-2 text-sm md:text-base text-muted-foreground hover:text-foreground transition-colors">
              <Phone className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              <span>+995 557 50 41 41</span>
            </a>
            <a href="mailto:info@dastacloud.ge" className="flex items-center justify-center gap-2 text-sm md:text-base text-muted-foreground hover:text-foreground transition-colors">
              <Mail className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              <span>info@dastacloud.ge</span>
            </a>
          </div>

          {/* Trust Badges */}
          <div className="glass rounded-xl md:rounded-2xl p-4 md:p-8">
            <p className="text-xs md:text-sm text-muted-foreground mb-4 md:mb-6">ენდობიან ლიდერი კომპანიები</p>
            <div className="flex flex-wrap justify-center items-center gap-4 md:gap-8 lg:gap-12">
              {["კომპანია A", "კომპანია B", "კომპანია C", "კომპანია D", "კომპანია E"].map((company, index) => (
                <div
                  key={index}
                  className="text-sm md:text-lg font-bold text-muted-foreground/50 hover:text-foreground transition-colors cursor-pointer"
                >
                  {company}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 md:mt-20 pt-6 md:pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Cloud className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-foreground font-semibold">DASTA CLOUD</span>
            </div>
            <div className="flex items-center gap-4 md:gap-6 text-xs md:text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">პირობები</a>
              <a href="#" className="hover:text-foreground transition-colors">კონფიდენციალურობა</a>
              <a href="#" className="hover:text-foreground transition-colors">კონტაქტი</a>
            </div>
            <p className="text-xs md:text-sm text-muted-foreground">
              &copy; 2026 DASTA CLOUD. ყველა უფლება დაცულია.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

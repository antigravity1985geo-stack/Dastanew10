"use client"

import { useEffect, useRef, useState } from "react"
import { FileText, Send, CheckCircle, ArrowRight, RefreshCw, Clock, AlertCircle } from "lucide-react"

export function RSGESection() {
  const [isVisible, setIsVisible] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
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
    if (isVisible) {
      const interval = setInterval(() => {
        setCurrentStep((prev) => (prev + 1) % 4)
      }, 2000)
      return () => clearInterval(interval)
    }
  }, [isVisible])

  const steps = [
    { icon: FileText, label: "ინვოისი", status: "შექმნილი" },
    { icon: Send, label: "გაგზავნა", status: "RS.GE-ზე" },
    { icon: RefreshCw, label: "სინქრო", status: "მიმდინარე" },
    { icon: CheckCircle, label: "დადასტურება", status: "წარმატებული" },
  ]

  const features = [
    {
      title: "ავტომატური გაგზავნა",
      desc: "ინვოისები ავტომატურად იგზავნება RS.GE-ზე",
      icon: Send,
    },
    {
      title: "რეალ-თაიმ სინქრონიზაცია",
      desc: "მონაცემები სინქრონიზდება წამებში",
      icon: RefreshCw,
    },
    {
      title: "შეცდომების აღმოფხვრა",
      desc: "ავტომატური ვალიდაცია გაგზავნამდე",
      icon: AlertCircle,
    },
    {
      title: "ისტორიის ჩანაწერი",
      desc: "ყველა ტრანზაქცია ინახება",
      icon: Clock,
    },
  ]

  return (
    <section
      id="rsge"
      ref={sectionRef}
      className="min-h-screen flex items-center py-16 md:py-20 relative overflow-hidden scroll-snap-start"
    >
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/3 right-0 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-chart-3/10 rounded-full blur-[100px] md:blur-[150px]" />
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 md:gap-16 items-center">
          {/* Left Side - Content */}
          <div
            className={`transition-all duration-1000 text-center lg:text-left order-2 lg:order-1 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-20"
            }`}
          >
            <span className="text-chart-3 font-semibold mb-2 md:mb-4 block text-sm md:text-base">RS.GE ინტეგრაცია</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 md:mb-6">
              სრული
              <br />
              <span className="gradient-text">RS.GE კავშირი</span>
            </h2>
            <p className="text-sm md:text-lg text-muted-foreground mb-6 md:mb-8 leading-relaxed max-w-lg mx-auto lg:mx-0">
              ავტომატური ინტეგრაცია შემოსავლების სამსახურთან. ინვოისების გაგზავნა,
              სტატუსების მიღება და სრული აღრიცხვა ერთ კლიკით. დაივიწყეთ
              მექანიკური მუშაობა.
            </p>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-2 md:gap-4 max-w-lg mx-auto lg:mx-0">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="glass p-3 md:p-4 rounded-xl animate-scale-in"
                  style={{ animationDelay: `${0.5 + index * 0.1}s` }}
                >
                  <feature.icon className="w-5 h-5 md:w-6 md:h-6 text-chart-3 mb-1 md:mb-2" />
                  <h4 className="text-sm md:text-base text-foreground font-medium mb-0.5 md:mb-1">{feature.title}</h4>
                  <p className="text-xs md:text-sm text-muted-foreground">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side - RS.GE Animation */}
          <div
            className={`relative transition-all duration-1000 delay-300 order-1 lg:order-2 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-20"
            }`}
          >
            {/* Main Container */}
            <div className="glass rounded-2xl p-4 md:p-8 relative overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between mb-6 md:mb-8">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-chart-3/20 flex items-center justify-center">
                    <FileText className="w-4 h-4 md:w-5 md:h-5 text-chart-3" />
                  </div>
                  <div>
                    <span className="text-sm md:text-base text-foreground font-semibold block">RS.GE კონსოლი</span>
                    <span className="text-xs md:text-sm text-muted-foreground">რეალ-თაიმ სტატუსი</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                  <span className="text-xs md:text-sm text-accent">დაკავშირებულია</span>
                </div>
              </div>

              {/* Process Steps Animation */}
              <div className="relative mb-6 md:mb-8">
                <div className="flex items-center justify-between relative">
                  {/* Progress Line Background */}
                  <div className="absolute top-1/2 left-0 right-0 h-1 bg-border -translate-y-1/2 z-0" />
                  
                  {/* Active Progress Line */}
                  <div
                    className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-chart-3 to-accent -translate-y-1/2 z-0 transition-all duration-500"
                    style={{ width: `${(currentStep / 3) * 100}%` }}
                  />

                  {/* Steps */}
                  {steps.map((step, index) => (
                    <div
                      key={index}
                      className={`relative z-10 flex flex-col items-center transition-all duration-500 ${
                        index <= currentStep ? "scale-110" : "scale-100"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-500 ${
                          index < currentStep
                            ? "bg-accent glow-accent"
                            : index === currentStep
                            ? "bg-chart-3 glow-primary animate-pulse"
                            : "bg-secondary"
                        }`}
                      >
                        <step.icon
                          className={`w-4 h-4 md:w-6 md:h-6 ${
                            index <= currentStep ? "text-foreground" : "text-muted-foreground"
                          }`}
                        />
                      </div>
                      <span
                        className={`mt-1 md:mt-2 text-[10px] md:text-xs font-medium ${
                          index <= currentStep ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sample Invoice */}
              <div className="bg-secondary/50 rounded-xl p-3 md:p-4 mb-3 md:mb-4">
                <div className="flex items-center justify-between mb-2 md:mb-3">
                  <span className="text-sm md:text-base text-foreground font-medium">ინვოისი #2024-0847</span>
                  <span
                    className={`text-[10px] md:text-xs px-2 py-1 rounded-full ${
                      currentStep === 3
                        ? "bg-accent/20 text-accent"
                        : currentStep >= 1
                        ? "bg-chart-3/20 text-chart-3"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {steps[currentStep].status}
                  </span>
                </div>
                <div className="space-y-1 md:space-y-2 text-xs md:text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>მყიდველი:</span>
                    <span className="text-foreground">შპს &quot;მაგალითი&quot;</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>თანხა:</span>
                    <span className="text-foreground font-bold">1,250.00 GEL</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>დღგ:</span>
                    <span className="text-foreground">227.27 GEL</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button className="w-full glass py-2 md:py-3 rounded-xl flex items-center justify-center gap-2 text-sm md:text-base text-foreground hover:bg-secondary/80 transition-all group">
                <span>RS.GE პორტალის გახსნა</span>
                <ArrowRight className="w-3 h-3 md:w-4 md:h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Floating Success Indicator */}
              {currentStep === 3 && (
                <div className="absolute -top-2 -right-2 md:-top-4 md:-right-4 w-12 h-12 md:w-16 md:h-16 bg-accent rounded-full flex items-center justify-center glow-accent animate-scale-in">
                  <CheckCircle className="w-6 h-6 md:w-8 md:h-8 text-accent-foreground" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

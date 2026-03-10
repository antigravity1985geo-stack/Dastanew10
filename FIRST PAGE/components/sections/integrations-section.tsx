"use client"

import { useEffect, useRef, useState } from "react"
import { Zap, Check, ArrowRight, Package, Bike, Car, ShoppingBag, Clock, MapPin } from "lucide-react"

export function IntegrationsSection() {
  const [isVisible, setIsVisible] = useState(false)
  const [activeIntegration, setActiveIntegration] = useState(0)
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
      setActiveIntegration((prev) => (prev + 1) % 2)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const integrations = [
    {
      name: "Glovo",
      color: "bg-chart-3",
      icon: Bike,
      orders: 156,
      status: "აქტიური",
      features: ["ავტო-სინქრო", "მენიუს მართვა", "შეკვეთების ტრეკინგი"],
    },
    {
      name: "Bolt Food",
      color: "bg-accent",
      icon: Car,
      orders: 89,
      status: "აქტიური",
      features: ["რეალ-თაიმ", "ფასების მართვა", "ანალიტიკა"],
    },
  ]

  const recentOrders = [
    { platform: "Glovo", item: "პიცა მარგარიტა", time: "2 წუთის წინ", price: "25.00 GEL" },
    { platform: "Bolt", item: "ბურგერი კომბო", time: "5 წუთის წინ", price: "32.50 GEL" },
    { platform: "Glovo", item: "სუშის სეტი", time: "8 წუთის წინ", price: "48.00 GEL" },
    { platform: "Bolt", item: "სალათა ცეზარი", time: "12 წუთის წინ", price: "18.00 GEL" },
  ]

  return (
    <section
      id="integrations"
      ref={sectionRef}
      className="min-h-screen flex items-center py-16 md:py-20 relative overflow-hidden scroll-snap-start"
    >
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute bottom-0 left-1/4 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-accent/10 rounded-full blur-[100px] md:blur-[150px]" />
        <div className="absolute top-1/4 right-1/4 w-[200px] md:w-[400px] h-[200px] md:h-[400px] bg-chart-3/10 rounded-full blur-[80px] md:blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        {/* Section Header */}
        <div
          className={`text-center mb-10 md:mb-16 transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <span className="text-accent font-semibold mb-2 md:mb-4 block text-sm md:text-base">ინტეგრაციები</span>
          <h2 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 md:mb-6">
            Glovo & Bolt
            <br />
            <span className="gradient-text">ერთ პლატფორმაზე</span>
          </h2>
          <p className="text-sm md:text-xl text-muted-foreground max-w-2xl mx-auto px-2">
            მართეთ შეკვეთები ყველა პლატფორმიდან ერთი დაშბორდით.
            ავტომატური სინქრონიზაცია და რეალ-თაიმ ანალიტიკა.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 md:gap-12">
          {/* Left Side - Integration Cards */}
          <div
            className={`space-y-4 md:space-y-6 transition-all duration-1000 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-20"
            }`}
          >
            {integrations.map((integration, index) => (
              <div
                key={index}
                className={`glass rounded-xl md:rounded-2xl p-4 md:p-6 transition-all duration-500 cursor-pointer ${
                  activeIntegration === index
                    ? "ring-2 ring-primary scale-[1.02]"
                    : "hover:bg-secondary/30"
                }`}
                onClick={() => setActiveIntegration(index)}
              >
                <div className="flex items-start justify-between mb-3 md:mb-4">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className={`w-10 h-10 md:w-14 md:h-14 ${integration.color} rounded-lg md:rounded-xl flex items-center justify-center`}>
                      <integration.icon className="w-5 h-5 md:w-7 md:h-7 text-foreground" />
                    </div>
                    <div>
                      <h3 className="text-base md:text-xl font-bold text-foreground">{integration.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5 md:mt-1">
                        <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                        <span className="text-xs md:text-sm text-accent">{integration.status}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg md:text-2xl font-bold text-foreground">{integration.orders}</div>
                    <div className="text-xs md:text-sm text-muted-foreground">შეკვეთა დღეს</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 md:gap-2">
                  {integration.features.map((feature, fIndex) => (
                    <div
                      key={fIndex}
                      className="flex items-center gap-1 bg-secondary/50 px-2 md:px-3 py-1 rounded-full text-xs md:text-sm"
                    >
                      <Check className="w-3 h-3 text-accent" />
                      <span className="text-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Connect More */}
            <div className="glass rounded-xl p-3 md:p-4 flex items-center justify-between group hover:bg-secondary/30 transition-all cursor-pointer">
              <div className="flex items-center gap-2 md:gap-3">
                <Zap className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                <span className="text-sm md:text-base text-foreground">მეტი ინტეგრაციის დამატება</span>
              </div>
              <ArrowRight className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground group-hover:translate-x-1 group-hover:text-primary transition-all" />
            </div>
          </div>

          {/* Right Side - Live Orders Feed */}
          <div
            className={`transition-all duration-1000 delay-300 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-20"
            }`}
          >
            <div className="glass rounded-xl md:rounded-2xl p-4 md:p-6 h-full">
              {/* Header */}
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                  <span className="text-sm md:text-base text-foreground font-semibold">ცოცხალი შეკვეთები</span>
                </div>
                <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                  <span>ლაივ</span>
                </div>
              </div>

              {/* Orders List */}
              <div className="space-y-3 md:space-y-4">
                {recentOrders.map((order, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 md:p-4 rounded-lg md:rounded-xl transition-all duration-500 animate-slide-up ${
                      order.platform === "Glovo" ? "bg-chart-3/10" : "bg-accent/10"
                    }`}
                    style={{ animationDelay: `${0.5 + index * 0.15}s` }}
                  >
                    <div className="flex items-center gap-2 md:gap-3">
                      <div
                        className={`w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center shrink-0 ${
                          order.platform === "Glovo" ? "bg-chart-3" : "bg-accent"
                        }`}
                      >
                        {order.platform === "Glovo" ? (
                          <Bike className="w-4 h-4 md:w-5 md:h-5 text-foreground" />
                        ) : (
                          <Car className="w-4 h-4 md:w-5 md:h-5 text-foreground" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="text-sm md:text-base text-foreground font-medium block truncate">{order.item}</span>
                        <div className="flex items-center gap-1 md:gap-2 text-xs md:text-sm text-muted-foreground">
                          <Clock className="w-3 h-3 shrink-0" />
                          <span className="truncate">{order.time}</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-sm md:text-base text-foreground font-bold whitespace-nowrap ml-2">{order.price}</span>
                  </div>
                ))}
              </div>

              {/* Stats Bar */}
              <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-border grid grid-cols-3 gap-2 md:gap-4">
                <div className="text-center">
                  <div className="text-lg md:text-2xl font-bold text-foreground">245</div>
                  <div className="text-xs md:text-sm text-muted-foreground">სულ დღეს</div>
                </div>
                <div className="text-center">
                  <div className="text-lg md:text-2xl font-bold text-accent">98%</div>
                  <div className="text-xs md:text-sm text-muted-foreground">შესრულებული</div>
                </div>
                <div className="text-center">
                  <div className="text-lg md:text-2xl font-bold text-chart-3">12 წთ</div>
                  <div className="text-xs md:text-sm text-muted-foreground">საშ. დრო</div>
                </div>
              </div>

              {/* Delivery Animation */}
              <div className="mt-4 md:mt-6 glass rounded-xl p-3 md:p-4 relative overflow-hidden">
                <div className="flex items-center gap-2 md:gap-3">
                  <MapPin className="w-4 h-4 md:w-5 md:h-5 text-primary shrink-0" />
                  <span className="text-sm md:text-base text-foreground">კურიერი მიემართება</span>
                </div>
                <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-accent rounded-full animate-shimmer"
                    style={{ width: "65%" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

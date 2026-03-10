import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X, Cloud } from "lucide-react"

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Smooth scroll handler
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    const targetId = href.replace("#", "")
    const targetElement = document.getElementById(targetId)

    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }

    setIsMobileMenuOpen(false)
  }

  const navLinks = [
    { href: "#pos", label: "POS" },
    { href: "#distribution", label: "დისტრიბუცია" },
    { href: "#cloud", label: "Cloud" },
    { href: "#rsge", label: "RS.GE" },
    { href: "#integrations", label: "ინტეგრაციები" },
  ]

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled ? "glass py-3" : "py-4 md:py-6"
        }`}
    >
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-primary flex items-center justify-center glow-primary">
            <Cloud className="w-5 h-5 md:w-6 md:h-6 text-primary-foreground" />
          </div>
          <span className="text-lg md:text-xl font-bold text-foreground">DASTA CLOUD</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className="text-muted-foreground hover:text-foreground transition-colors duration-300"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" className="text-foreground">
              შესვლა
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button className="bg-primary text-primary-foreground hover:opacity-90">
              დაწყება
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-foreground p-2 rounded-lg hover:bg-secondary/50 transition-colors"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
        >
          <div className="relative w-6 h-6">
            <span
              className={`absolute left-0 block h-0.5 w-6 bg-current transition-all duration-300 ease-out ${isMobileMenuOpen ? "top-3 rotate-45" : "top-1"
                }`}
            />
            <span
              className={`absolute left-0 top-3 block h-0.5 w-6 bg-current transition-all duration-300 ease-out ${isMobileMenuOpen ? "opacity-0 scale-x-0" : "opacity-100"
                }`}
            />
            <span
              className={`absolute left-0 block h-0.5 w-6 bg-current transition-all duration-300 ease-out ${isMobileMenuOpen ? "top-3 -rotate-45" : "top-5"
                }`}
            />
          </div>
        </button>
      </div>

      {/* Mobile Menu with smooth animation */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-500 ease-in-out ${isMobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
      >
        <div className="glass mt-2 mx-4 rounded-lg p-4">
          {navLinks.map((link, index) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className={`block py-3 text-muted-foreground hover:text-foreground transition-all duration-300 border-b border-border/30 last:border-0 transform ${isMobileMenuOpen
                ? "translate-y-0 opacity-100"
                : "translate-y-2 opacity-0"
                }`}
              style={{ transitionDelay: isMobileMenuOpen ? `${index * 50}ms` : "0ms" }}
            >
              {link.label}
            </a>
          ))}
          <div className="flex gap-2 mt-4 pt-2">
            <Link href="/dashboard" className="flex-1">
              <Button variant="ghost" className="w-full text-foreground">
                შესვლა
              </Button>
            </Link>
            <Link href="/dashboard" className="flex-1">
              <Button className="w-full bg-primary text-primary-foreground">
                დაწყება
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

import Link from "next/link"
import { Instagram, Facebook, Twitter, Youtube } from "lucide-react"

const footerLinks = {
  about: [
    { name: "Our Story", href: "#" },
    { name: "Our Mission", href: "#mission" },
    { name: "The Process", href: "#process" },
    { name: "Impact Reports", href: "#" },
    { name: "Team", href: "#" },
  ],
  getInvolved: [
    { name: "Donate", href: "#" },
    { name: "Volunteer", href: "#" },
    { name: "Partner With Us", href: "#" },
    { name: "Fundraise", href: "#" },
    { name: "Spread the Word", href: "#" },
  ],
  resources: [
    { name: "Contact Us", href: "#" },
    { name: "FAQs", href: "#" },
    { name: "Moringa Facts", href: "#" },
    { name: "Blog", href: "#" },
    { name: "Press", href: "#" },
  ],
}

const socialLinks = [
  { name: "Instagram", icon: Instagram, href: "#" },
  { name: "Facebook", icon: Facebook, href: "#" },
  { name: "Twitter", icon: Twitter, href: "#" },
  { name: "YouTube", icon: Youtube, href: "#" },
]

export function Footer() {
  return (
    <footer id="contact" className="bg-foreground text-background py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="font-serif text-xl font-semibold">
              Miracle Greens
            </Link>
            <p className="mt-4 text-background/70 text-sm leading-relaxed">
              A nonprofit organization growing moringa trees to produce nutrient-rich capsules for distribution to
              communities in need.
            </p>
            <div className="flex gap-3 mt-6">
              {socialLinks.map((social) => (
                <Link
                  key={social.name}
                  href={social.href}
                  className="h-10 w-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-background/20 transition-colors"
                >
                  <social.icon className="h-4 w-4" />
                  <span className="sr-only">{social.name}</span>
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-4">About</h3>
            <ul className="space-y-3">
              {footerLinks.about.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-background/70 hover:text-background transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Get Involved</h3>
            <ul className="space-y-3">
              {footerLinks.getInvolved.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-background/70 hover:text-background transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Resources</h3>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-background/70 hover:text-background transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-background/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-background/60">
            © {new Date().getFullYear()} Miracle Greens. A registered nonprofit organization.
          </p>
          <div className="flex gap-6">
            <Link href="#" className="text-sm text-background/60 hover:text-background transition-colors">
              Privacy Policy
            </Link>
            <Link href="#" className="text-sm text-background/60 hover:text-background transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

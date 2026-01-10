import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { HowItWorks } from "@/components/how-it-works"
import { ShopSection } from "@/components/shop-section"
import { Categories } from "@/components/categories"
import { FeaturedProducts } from "@/components/featured-products"
import { Benefits } from "@/components/benefits"
import { Testimonials } from "@/components/testimonials"
import { Newsletter } from "@/components/newsletter"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <HowItWorks />
      <ShopSection />
      <Categories />
      <FeaturedProducts />
      <Benefits />
      <Testimonials />
      <Newsletter />
      <Footer />
    </main>
  )
}

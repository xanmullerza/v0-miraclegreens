'use client';
import Link from 'next/link';
import { Menu, TreeDeciduous, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const navigation = [
	{ name: 'Our Story', href: '#story' },
	{ name: 'How It Works', href: '#how-it-works' },
	{ name: 'Shop', href: '/shop' },
	{ name: 'Our Vision', href: '/vision' },
];

export function Header() {
	return (
		<header className="sticky top-0 z-50 bg-primary border-b border-primary/80">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div className="flex h-16 items-center justify-between">
					{/* Mobile menu */}
					<Sheet>
						<SheetTrigger asChild className="lg:hidden">
							<Button
								variant="ghost"
								size="icon"
								className="text-primary-foreground hover:bg-primary-foreground/10"
							>
								<Menu className="h-5 w-5" />
								<span className="sr-only">Open menu</span>
							</Button>
						</SheetTrigger>
						<SheetContent side="left" className="w-[300px] bg-background">
							<div className="flex flex-col gap-6 mt-8">
								{navigation.map((item) => (
									<Link
										key={item.name}
										href={item.href}
										className="text-lg font-medium text-foreground hover:text-primary transition-colors"
									>
										{item.name}
									</Link>
								))}
								<Button className="gap-2 mt-4" asChild>
									<Link href="/shop">
										<ShoppingBag className="h-4 w-4" />
										Visit Shop
									</Link>
								</Button>
								<Button className="gap-2 mt-2" variant="ghost" asChild>
									<Link href="/donate">
										<TreeDeciduous className="h-4 w-4" />
										Donate
									</Link>
								</Button>
							</div>
						</SheetContent>
					</Sheet>

					{/* Desktop navigation */}
					<nav className="hidden lg:flex lg:gap-8">
						{navigation.map((item) => (
							<Link
								key={item.name}
								href={item.href}
								className="text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground transition-colors"
							>
								{item.name}
							</Link>
						))}
					</nav>

					{/* Logo */}
					<Link href="/" className="flex items-center gap-2">
						<span className="font-serif text-xl md:text-2xl font-semibold text-primary-foreground tracking-tight">
							Miracle Greens
						</span>
					</Link>

					<div className="flex items-center gap-2">
						<Button variant="secondary" size="sm" className="hidden sm:flex gap-2" asChild>
							<Link href="/shop">
								<ShoppingBag className="h-4 w-4" />
								Shop
							</Link>
						</Button>
						<Button
							variant="ghost"
							size="sm"
							className="hidden md:flex gap-2 text-primary-foreground hover:bg-primary-foreground/10"
							asChild
						>
							<Link href="/donate">
								<TreeDeciduous className="h-4 w-4" />
								Donate
							</Link>
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="sm:hidden text-primary-foreground hover:bg-primary-foreground/10"
							asChild
						>
							<Link href="/shop">
								<ShoppingBag className="h-5 w-5" />
								<span className="sr-only">Shop</span>
							</Link>
						</Button>
					</div>
				</div>
			</div>
		</header>
	);
}

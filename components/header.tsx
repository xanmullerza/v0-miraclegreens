'use client';
import Link from 'next/link';
import { Menu, TreeDeciduous, ShoppingBag, LayoutGrid, Calendar, BarChart3, LayoutDashboard, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';
// import { ModeToggle } from '@/components/mode-toggle';

const showShop = false;
const showPlan = false;
const showDashboard = true;

const navigation = [
	{ name: 'Our Story', href: '#story' },
	{ name: 'How It Works', href: '#how-it-works' },
	...(showShop ? [{ name: 'Shop', href: '/shop' }] : []),
	{ name: 'Our Vision', href: '/vision' },
];

export function Header() {
	const [user, setUser] = useState<any>(null);

	useEffect(() => {
		const getUser = async () => {
			const { data: { user } } = await supabase.auth.getUser();
			setUser(user);
		};
		getUser();

		const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
			setUser(session?.user ?? null);
		});

		return () => subscription.unsubscribe();
	}, []);

	return (
		<header className="sticky top-0 z-50 bg-emerald-500 border-b border-emerald-600 text-white">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div className="flex h-16 items-center justify-between">
					{/* Mobile menu (only Shop & Donate) */}
					<Sheet>
						<SheetTrigger asChild className="lg:hidden">
							<Button
								variant="ghost"
								size="icon"
								className="text-white hover:bg-white/10"
							>
								<Menu className="h-5 w-5" />
								<span className="sr-only">Open menu</span>
							</Button>
						</SheetTrigger>
						<SheetContent side="left" className="w-[300px] bg-background">
							<div className="flex flex-col gap-6 mt-8">
								{showDashboard && (
									<Button className="gap-2 mt-4" asChild>
										<Link href="/dashboard">
											<LayoutDashboard className="h-4 w-4" />
											Dashboard
										</Link>
									</Button>
								)}
								<Button className="gap-2 mt-2" asChild>
									<Link href="/browse">
										<LayoutGrid className="h-4 w-4" />
										Browse Resources
									</Link>
								</Button>
								{showPlan && (
									<Button className="gap-2 mt-2" asChild>
										<Link href="/plan">
											<Calendar className="h-4 w-4" />
											Plan Meals
										</Link>
									</Button>
								)}
								{showShop && (
									<Button className="gap-2 mt-2" asChild>
										<Link href="/shop">
											<ShoppingBag className="h-4 w-4" />
											Visit Shop
										</Link>
									</Button>
								)}
								<Button className="gap-2 mt-2" asChild>
									<Link href="/donate">
										<TreeDeciduous className="h-4 w-4" />
										Donate
									</Link>
								</Button>

								{/* <div className="flex items-center gap-2 mt-2">
									<ModeToggle />
									<span className="text-muted-foreground text-sm">Switch Theme</span>
								</div> */}
							</div>
						</SheetContent>
					</Sheet>

					{/* Logo */}
					<Link href="/" className="flex items-center gap-2">
						<span className="font-serif text-xl md:text-2xl font-semibold text-white tracking-tight">
							Miracle Greens
						</span>
					</Link>

					{/* Right-side buttons (Shop + Donate remain) */}
					<div className="flex items-center gap-2">
						<Button variant="secondary" size="sm" className="hidden sm:flex gap-2" asChild>
							<Link href="/browse">
								<LayoutGrid className="h-4 w-4" />
								Browse
							</Link>
						</Button>
						{user ? (
							<>
								<Button variant="secondary" size="sm" className="hidden lg:flex gap-2" asChild>
									<Link href="/dashboard/profile">
										<User className="h-4 w-4" />
										<span className="max-w-[100px] truncate">{user.email?.split('@')[0]}</span>
									</Link>
								</Button>
								<Button
									variant="ghost"
									size="icon"
									className="hidden lg:flex text-emerald-100 hover:text-white hover:bg-emerald-600"
									onClick={async () => {
										await supabase.auth.signOut();
										setUser(null);
										window.location.reload();
									}}
								>
									<LogOut className="h-4 w-4" />
									<span className="sr-only">Sign out</span>
								</Button>
							</>
						) : (
							showDashboard && (
								<Button variant="secondary" size="sm" className="hidden lg:flex gap-2" asChild>
									<Link href="/login">
										<User className="h-4 w-4" />
										Login
									</Link>
								</Button>
							)
						)}
						{showPlan && (
							<Button variant="secondary" size="sm" className="hidden sm:flex gap-2" asChild>
								<Link href="/plan">
									<Calendar className="h-4 w-4" />
									Plan
								</Link>
							</Button>
						)}
						{showShop && (
							<Button variant="secondary" size="sm" className="hidden sm:flex gap-2" asChild>
								<Link href="/shop">
									<ShoppingBag className="h-4 w-4" />
									Shop
								</Link>
							</Button>
						)}
						<Button
							variant="secondary"
							size="sm"
							className="hidden md:flex gap-2"
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
					{/* <ModeToggle className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground ml-2" /> */}
				</div>
			</div>
		</header >
	);
}

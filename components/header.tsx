'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, LayoutDashboard, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';
// import { ModeToggle } from '@/components/mode-toggle';

const showDashboard = true;

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

								{/* <div className="flex items-center gap-2 mt-2">
									<ModeToggle />
									<span className="text-muted-foreground text-sm">Switch Theme</span>
								</div> */}
							</div>
						</SheetContent>
					</Sheet>

					{/* Logo */}
					<Link href="/" className="flex items-center gap-2">
					<div className="relative h-8 w-28 sm:h-10 sm:w-40">
								alt="Vitala Logo"
								fill
								className="object-contain brightness-0 invert"
								priority
							/>
						</div>
					</Link>

					{/* Right-side buttons */}
					<div className="flex items-center gap-2">
						{user ? (
							<>
								<Button variant="secondary" size="sm" className="hidden lg:flex gap-2" asChild>
									<Link href="/profile">
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
									<Link href="/auth/login">
										<User className="h-4 w-4" />
										Login
									</Link>
								</Button>
							)
						)}
						{showDashboard && (
							<Button variant="secondary" size="sm" className="hidden sm:flex gap-2" asChild>
								<Link href="/dashboard">
									<LayoutDashboard className="h-4 w-4" />
									Dashboard
								</Link>
							</Button>
						)}
					</div>
					{/* <ModeToggle className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground ml-2" /> */}
				</div>
			</div>
		</header >
	);
}

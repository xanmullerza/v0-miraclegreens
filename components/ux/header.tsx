'use client';
import Link from 'next/link';
import { LayoutDashboard, User, LogOut, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';

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
					{/* Logo */}
					<Link href="/" className="flex items-center gap-2">
						<Leaf className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
						<span className="font-semibold text-lg text-white">VITALA</span>
					</Link>
					<div className="flex items-center gap-2">
						{user ? (
							<>
								<Button variant="secondary" size="sm" className="hidden lg:flex gap-2" asChild>
									<Link href="/users/profile">
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
								<Link href="/cookbook">
									<LayoutDashboard className="h-4 w-4" />
									Cookbook
								</Link>
							</Button>
						)}
					</div>
				</div>
			</div>
		</header >
	);
}

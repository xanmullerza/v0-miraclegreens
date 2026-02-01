import Link from 'next/link';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function UnauthorizedPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#020617] flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md text-center space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 text-rose-500">
                    <ShieldAlert size={40} />
                </div>

                <div className="space-y-4">
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase italic">
                        Access Denied
                    </h1>
                    <p className="text-slate-500 text-sm font-medium leading-relaxed">
                        Your account is not authorized to access the Administration Dashboard.
                        This area is restricted to specific personnel only.
                    </p>
                </div>

                <div className="flex flex-col gap-3 pt-4">
                    <Button
                        asChild
                        className="h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 font-bold uppercase tracking-widest text-xs rounded-xl shadow-lg"
                    >
                        <Link href="/dashboard">
                            Return to Dashboard
                        </Link>
                    </Button>
                    <Button
                        asChild
                        variant="ghost"
                        className="h-12 text-slate-500 hover:text-rose-500 font-bold uppercase tracking-widest text-xs rounded-xl"
                    >
                        <Link href="/">
                            Go Home
                        </Link>
                    </Button>
                </div>

                <p className="text-[10px] text-slate-400 font-mono">
                    Error Code: 403_FORBIDDEN
                </p>
            </div>
        </div>
    );
}

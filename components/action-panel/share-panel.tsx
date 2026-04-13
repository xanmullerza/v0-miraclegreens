'use client';

import React, { useState } from 'react';
import { Copy, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import * as Icons from 'simple-icons';

interface Recipe {
    id: string;
    title: string;
    image?: string | null;
}

interface SharePanelProps {
    recipe?: Recipe;
    onClose: () => void;
    isInline?: boolean;
}

// Helper component to render simple-icons SVG
function SimpleIcon({ icon, size = 20 }: { icon: any; size?: number }) {
    if (!icon) return null;
    return (
        <svg 
            width={size} 
            height={size} 
            viewBox="0 0 24 24" 
            fill="currentColor"
            dangerouslySetInnerHTML={{ __html: icon.svg }}
        />
    );
}

export function SharePanel({ recipe, onClose, isInline = false }: SharePanelProps) {
    const [copied, setCopied] = useState(false);

    const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/?recipeId=${recipe?.id || ''}` : '';
    const shareText = recipe 
        ? `Check out this delicious recipe for ${recipe.title} on Miracle Greens! 🥗`
        : `Check out Miracle Greens - Modern Nutrition & Recipe Management! 🥗`;

    const handleCopyLink = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        toast.success('Link copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
    };

    const mainPlatforms = [
        {
            name: 'WhatsApp',
            icon: Icons.siWhatsapp,
            color: 'bg-[#25D366]',
            hoverColor: 'hover:bg-[#128C7E]',
            url: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`
        },
        {
            name: 'Telegram',
            icon: Icons.siTelegram,
            color: 'bg-[#0088cc]',
            hoverColor: 'hover:bg-[#0077b5]',
            url: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`
        },
        {
            name: 'Facebook',
            icon: Icons.siFacebook,
            color: 'bg-[#1877F2]',
            hoverColor: 'hover:bg-[#0e5a8a]',
            url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
        },
        {
            name: 'X',
            icon: Icons.siX,
            color: 'bg-black',
            hoverColor: 'hover:bg-slate-900',
            url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
        }
    ];

    const extraPlatforms = [
        {
            name: 'Reddit',
            icon: Icons.siReddit,
            color: 'bg-[#FF4500]',
            hoverColor: 'hover:bg-[#FF5700]',
            url: `https://www.reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}`
        },
        {
            name: 'Discord',
            icon: Icons.siDiscord,
            color: 'bg-[#5865F2]',
            hoverColor: 'hover:bg-[#4752c4]',
            url: `https://discord.com/channels/@me` // Note: Discord doesn't have a direct share URL scheme like others, usually copy-paste
        },
        {
            name: 'Instagram',
            icon: Icons.siInstagram,
            color: 'bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888]',
            hoverColor: 'opacity-90',
            url: `https://www.instagram.com/` // Custom sharing on IG is also restricted
        },
        {
            name: 'Email',
            icon: Icons.siMinutemailer,
            color: 'bg-slate-600',
            hoverColor: 'hover:bg-slate-700',
            url: `mailto:?subject=${encodeURIComponent(recipe?.title || 'Shared Recipe')}&body=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`
        }
    ];

    return (
        <div className={cn(
            isInline ? "flex-1 w-full" : "absolute inset-0 z-50 flex items-end justify-center bg-black/20 backdrop-blur-[2px] p-4",
            "animate-in fade-in duration-200"
        )}>
            <div className={cn(
                "bg-white dark:bg-slate-900 overflow-hidden",
                isInline 
                    ? "w-full h-full flex flex-col p-4" 
                    : "w-full rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-800 p-6 animate-in slide-in-from-bottom duration-300"
            )}>
                {recipe && (
                    <div className="flex items-center gap-3 p-3 mb-6 rounded-2xl bg-emerald-50/50 dark:bg-emerald-900/10 shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all duration-300 active:scale-95 hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(16,185,129,0.35)]">
                        {recipe.image ? (
                            <img src={recipe.image} alt={recipe.title} className="w-12 h-12 rounded-lg object-cover" />
                        ) : (
                            <div className="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
                                🥗
                            </div>
                        ) }
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{recipe.title}</p>
                            <p className="text-[10px] text-slate-400 truncate">{shareUrl}</p>
                        </div>
                    </div>
                )}

                <div className="space-y-6 mb-8">
                    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4">
                        {mainPlatforms.map((platform) => (
                            <div key={platform.name} className="flex flex-col items-center gap-2">
                                <a
                                    href={platform.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={cn(
                                        "w-12 h-12 rounded-2xl flex items-center justify-center text-white transition-all transform active:scale-95 shadow-lg",
                                        platform.color,
                                        platform.hoverColor
                                    )}
                                >
                                    <SimpleIcon icon={platform.icon} size={20} />
                                </a>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{platform.name}</span>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4 animate-in slide-in-from-top-4 duration-300">
                        {extraPlatforms.map((platform) => (
                            <div key={platform.name} className="flex flex-col items-center gap-2">
                                <a
                                    href={platform.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={cn(
                                        "w-12 h-12 rounded-2xl flex items-center justify-center text-white transition-all transform active:scale-95 shadow-lg",
                                        platform.color,
                                        platform.hoverColor
                                    )}
                                >
                                    <SimpleIcon icon={platform.icon} size={20} />
                                </a>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{platform.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <button
                    onClick={handleCopyLink}
                    className={cn(
                        "w-full h-12 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 border-2 active:scale-95",
                        copied
                            ? "bg-emerald-500 text-white border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.35)]"
                            : "bg-emerald-500/10 dark:bg-emerald-900/20 hover:bg-emerald-500/20 dark:hover:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700/50 group hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:border-emerald-400 dark:hover:border-emerald-500"
                    )}
                >
                    {copied ? (
                        <>
                            <Check size={18} className="text-white" />
                            <span className="text-xs font-bold uppercase tracking-widest">Link Copied!</span>
                        </>
                    ) : (
                        <>
                            <Copy size={18} className="text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-300" />
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 uppercase tracking-widest">Copy Recipe Link</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

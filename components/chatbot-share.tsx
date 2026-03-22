'use client';

import React, { useState } from 'react';
import { Facebook, Send, MessageCircle, Copy, Check, X, Twitter, Mail, Instagram, Share2, Plus, MessageSquare, Flame } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Recipe {
    id: string;
    title: string;
    image?: string | null;
}

interface ChatbotShareProps {
    recipe?: Recipe;
    onClose: () => void;
}

export function ChatbotShare({ recipe, onClose }: ChatbotShareProps) {
    const [copied, setCopied] = useState(false);
    const [showMore, setShowMore] = useState(false);

    const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/dashboard/library/meals/${recipe?.id || ''}` : '';
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
            icon: MessageCircle,
            color: 'bg-[#25D366]',
            hoverColor: 'hover:bg-[#128C7E]',
            url: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`
        },
        {
            name: 'Telegram',
            icon: Send,
            color: 'bg-[#0088cc]',
            hoverColor: 'hover:bg-[#0077b5]',
            url: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`
        },
        {
            name: 'Facebook',
            icon: Facebook,
            color: 'bg-[#1877F2]',
            hoverColor: 'hover:bg-[#0e5a8a]',
            url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
        },
        {
            name: 'X',
            icon: Twitter,
            color: 'bg-black',
            hoverColor: 'hover:bg-slate-900',
            url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
        }
    ];

    const extraPlatforms = [
        {
            name: 'Reddit',
            icon: Flame,
            color: 'bg-[#FF4500]',
            hoverColor: 'hover:bg-[#FF5700]',
            url: `https://www.reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}`
        },
        {
            name: 'Discord',
            icon: MessageSquare,
            color: 'bg-[#5865F2]',
            hoverColor: 'hover:bg-[#4752c4]',
            url: `https://discord.com/channels/@me` // Note: Discord doesn't have a direct share URL scheme like others, usually copy-paste
        },
        {
            name: 'Instagram',
            icon: Instagram,
            color: 'bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888]',
            hoverColor: 'opacity-90',
            url: `https://www.instagram.com/` // Custom sharing on IG is also restricted
        },
        {
            name: 'Email',
            icon: Mail,
            color: 'bg-slate-600',
            hoverColor: 'hover:bg-slate-700',
            url: `mailto:?subject=${encodeURIComponent(recipe?.title || 'Shared Recipe')}&body=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`
        }
    ];

    return (
        <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/20 backdrop-blur-[2px] p-4 animate-in fade-in duration-200">
            <div className="w-full bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-800 p-6 animate-in slide-in-from-bottom duration-300 overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Share Recipe</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Share with friends and family</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400"
                    >
                        <X size={20} />
                    </button>
                </div>

                {recipe && (
                    <div className="flex items-center gap-3 p-3 mb-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
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
                                    <platform.icon size={20} />
                                </a>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{platform.name}</span>
                            </div>
                        ))}
                        
                        {!showMore && (
                            <div className="flex flex-col items-center gap-2">
                                <button
                                    onClick={() => setShowMore(true)}
                                    className="w-12 h-12 rounded-2xl flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all transform active:scale-95 shadow-md border border-slate-200 dark:border-slate-700"
                                >
                                    <Plus size={20} />
                                </button>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">More</span>
                            </div>
                        )}
                    </div>

                    {showMore && (
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
                                        <platform.icon size={20} />
                                    </a>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{platform.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <button
                    onClick={handleCopyLink}
                    className="w-full h-12 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl flex items-center justify-center gap-3 transition-colors border border-slate-200 dark:border-slate-700 group"
                >
                    {copied ? (
                        <>
                            <Check size={18} className="text-emerald-500" />
                            <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Link Copied!</span>
                        </>
                    ) : (
                        <>
                            <Copy size={18} className="text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white" />
                            <span className="text-xs font-bold text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white uppercase tracking-widest">Copy Recipe Link</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

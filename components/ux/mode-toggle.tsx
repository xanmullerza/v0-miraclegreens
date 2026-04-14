'use client';

import * as React from 'react';
import { Shapes } from 'lucide-react';
import { useTheme } from 'next-themes';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function ModeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const options = ['material', 'neon', 'free'] as const;
  type ThemeOption = (typeof options)[number];
  const normalizedTheme =
    theme === 'light'
      ? 'material'
      : theme === 'dark'
        ? 'neon'
        : theme === 'system'
          ? 'material'
          : theme;
  const currentTheme = options.includes(normalizedTheme as ThemeOption)
    ? (normalizedTheme as ThemeOption)
    : 'material';
  const nextTheme = options[(options.indexOf(currentTheme) + 1) % options.length];

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(nextTheme)}
      className={cn(className)}
      title={`Switch to ${nextTheme} theme`}
    >
      <Shapes className="h-[1.2rem] w-[1.2rem]" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

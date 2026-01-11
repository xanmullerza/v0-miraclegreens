'use client';

import type React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, Check, TreeDeciduous } from 'lucide-react';

export function Newsletter() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
      setEmail('');
    }
  };

  return (
    <section className="py-16 md:py-24 bg-primary">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-primary-foreground mb-4">
            Help Us Grow Our Future
          </h2>
          <p className="text-primary-foreground/80 mb-8 leading-relaxed">
            For just R500, you can sponsor an Eternal Moringa Tree that will produce nutrition for
            the needy for decades. Join us in building a sustainable solution to malnutrition.
          </p>
          {submitted ? (
            <div className="flex items-center justify-center gap-2 text-primary-foreground">
              <div className="h-8 w-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <Check className="h-4 w-4" />
              </div>
              <span className="font-medium">Thank you for joining our mission!</span>
            </div>
          ) : (
            <div className="space-y-4">
              <Button variant="secondary" size="lg" className="gap-2">
                <TreeDeciduous className="h-4 w-4" />
                Sponsor a Tree — R500
              </Button>

              <p className="text-primary-foreground/60 text-sm">or subscribe for updates</p>

              <form
                onSubmit={handleSubmit}
                className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
              >
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/60"
                  required
                />
                <Button
                  variant="outline"
                  className="gap-2 bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                >
                  Subscribe
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

'use client';

import { PageContainer } from '@/components/ui/page-container';
import { Footer } from '@/components/ux/footer';
import { SupportContent } from '@/components/static/support-content';

export default function SupportPage() {
  return (
    <PageContainer maxWidth="max-w-4xl">
      <div className="py-16 md:py-24">
        <SupportContent />
      </div>
      <Footer />
    </PageContainer>
  );
}

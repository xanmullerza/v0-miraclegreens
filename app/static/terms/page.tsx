'use client';

import { PageContainer } from '@/components/ui/page-container';
import { Footer } from '@/components/ux/footer';
import { TermsContent } from '@/components/static/terms-content';

export default function TermsOfServicePage() {
  return (
    <PageContainer maxWidth="max-w-4xl">
      <div className="py-16 md:py-24">
        <TermsContent />
      </div>
      <Footer />
    </PageContainer>
  );
}

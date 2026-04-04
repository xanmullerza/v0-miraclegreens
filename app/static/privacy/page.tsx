'use client';

import { PageContainer } from '@/components/ui/page-container';
import { Footer } from '@/components/ux/footer';
import { PrivacyContent } from '@/components/static/privacy-content';

export default function PrivacyPolicyPage() {
  return (
    <PageContainer maxWidth="max-w-4xl">
      <div className="py-16 md:py-24">
        <PrivacyContent />
      </div>
      <Footer />
    </PageContainer>
  );
}

'use client';

import { PageContainer } from '@/components/ui/page-container';
import { Footer } from '@/components/footer';
import { Shield, Mail } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <PageContainer maxWidth="max-w-4xl">
      <div className="space-y-8 animate-in fade-in duration-700 py-16 md:py-24 px-4">
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Shield className="text-emerald-500" size={24} />
            </div>
            <h1 className="text-4xl font-black uppercase italic text-slate-900 dark:text-white">Privacy Policy</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-lg">Last updated: February 25, 2026</p>
        </div>

        <div className="prose dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-black uppercase italic text-slate-900 dark:text-white mb-4">Introduction</h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              Vitala ("we", "us", "our" or "Company") operates the Vitala website and application. This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service and the choices you have associated with that data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black uppercase italic text-slate-900 dark:text-white mb-4">Information Collection and Use</h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
              We collect several different types of information for various purposes to provide and improve our Service to you.
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300">
              <li>Personal Data: Email address, first name, last name, profile information</li>
              <li>Usage Data: Browser type, IP address, pages visited, time and date of visits</li>
              <li>Nutritional Data: Food preferences, dietary restrictions, meal history</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-black uppercase italic text-slate-900 dark:text-white mb-4">Use of Data</h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              Vitala uses the collected data for various purposes:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 mt-3">
              <li>To provide and maintain our Service</li>
              <li>To notify you about changes to our Service</li>
              <li>To provide customer support</li>
              <li>To gather analysis or valuable information so we can improve our Service</li>
              <li>To monitor the usage of our Service</li>
              <li>To detect, prevent and address technical issues</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-black uppercase italic text-slate-900 dark:text-white mb-4">Security of Data</h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              The security of your data is important to us, but remember that no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black uppercase italic text-slate-900 dark:text-white mb-4">Contact Us</h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <div className="flex items-center gap-2 mt-4 text-slate-700 dark:text-slate-300">
              <Mail size={18} className="text-emerald-500" />
              <span>privacy@vitala.app</span>
            </div>
          </section>
        </div>
      </div>
    </PageContainer>
  );
}

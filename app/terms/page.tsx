'use client';

import { PageContainer } from '@/components/ui/page-container';
import { Footer } from '@/components/footer';
import { BookOpen, Mail } from 'lucide-react';

export default function TermsOfServicePage() {
  return (
    <>
      <PageContainer maxWidth="max-w-4xl">
        <div className="space-y-8 animate-in fade-in duration-700 py-16 md:py-24 px-4">
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <BookOpen className="text-amber-500" size={24} />
              </div>
              <h1 className="text-4xl font-black uppercase italic text-slate-900 dark:text-white">Terms of Service</h1>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-lg">Last updated: February 25, 2026</p>
          </div>

          <div className="prose dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-black uppercase italic text-slate-900 dark:text-white mb-4">Agreement to Terms</h2>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                By accessing and using the Vitala website, application, and services, you accept and agree to be bound by and comply with these Terms and Conditions. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black uppercase italic text-slate-900 dark:text-white mb-4">Use License</h2>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                Permission is granted to temporarily download one copy of the materials (information or software) on Vitala for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 mt-3">
                <li>Modify or copying the materials</li>
                <li>Using the materials for any commercial purpose or for any public display</li>
                <li>Attempting to decompile or reverse engineer any software contained on Vitala</li>
                <li>Removing any copyright or other proprietary notations from the materials</li>
                <li>Transferring the materials to another person or other websites</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-black uppercase italic text-slate-900 dark:text-white mb-4">Disclaimer</h2>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                The materials on Vitala are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black uppercase italic text-slate-900 dark:text-white mb-4">Limitations</h2>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                In no event shall Vitala or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Vitala.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black uppercase italic text-slate-900 dark:text-white mb-4">Accuracy of Materials</h2>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                The materials appearing on Vitala could include technical, typographical, or photographic errors. Vitala does not warrant that any of the materials on its website are accurate, complete, or current. Vitala may make changes to the materials contained on its website at any time without notice.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black uppercase italic text-slate-900 dark:text-white mb-4">Links</h2>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                Vitala has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by Vitala of the site. Use of any such linked website is at the user's own risk.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black uppercase italic text-slate-900 dark:text-white mb-4">Modifications</h2>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                Vitala may revise these terms of service for its website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black uppercase italic text-slate-900 dark:text-white mb-4">Contact Us</h2>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <div className="flex items-center gap-2 mt-4 text-slate-700 dark:text-slate-300">
                <Mail size={18} className="text-amber-500" />
                <span>legal@vitala.app</span>
              </div>
            </section>
          </div>
        </div>
      </PageContainer>
      <Footer />
    </>
  );
}

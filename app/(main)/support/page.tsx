'use client';

import { PageContainer } from '@/components/ui/page-container';
import { Footer } from '@/components/footer';
import { HelpCircle, Mail, MessageCircle, Phone } from 'lucide-react';

export default function SupportPage() {
  return (
    <PageContainer maxWidth="max-w-4xl">
      <div className="space-y-8 animate-in fade-in duration-700 py-16 md:py-24 px-4">
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center">
              <HelpCircle className="text-indigo-500" size={24} />
            </div>
            <h1 className="text-4xl font-black uppercase italic text-slate-900 dark:text-white">Support Center</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-lg">We're here to help! Find answers and get support.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Email Support */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                <Mail className="text-indigo-500" size={20} />
              </div>
              <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-wider">Email Support</h3>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
              Send us an email and we'll get back to you within 24 hours.
            </p>
            <a href="mailto:support@vitala.app" className="text-indigo-500 font-bold text-sm hover:underline">
              support@vitala.app
            </a>
          </div>

          {/* Live Chat */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <MessageCircle className="text-emerald-500" size={20} />
              </div>
              <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-wider">Live Chat</h3>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
              Chat with our team in real-time during business hours (9am-6pm EST).
            </p>
            <button className="text-emerald-500 font-bold text-sm hover:underline">
              Start Chat
            </button>
          </div>

          {/* Phone Support */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Phone className="text-amber-500" size={20} />
              </div>
              <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-wider">Phone Support</h3>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
              Call us for urgent issues. Available Monday-Friday, 9am-6pm EST.
            </p>
            <a href="tel:+1-555-VITALA-1" className="text-amber-500 font-bold text-sm hover:underline">
              +1 (555) 848-2521
            </a>
          </div>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-black uppercase italic text-slate-900 dark:text-white mb-4">Frequently Asked Questions</h2>
            
            <div className="space-y-4">
              <details className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 group cursor-pointer">
                <summary className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                  How do I create a Vitala account?
                  <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="text-slate-600 dark:text-slate-400 mt-3">
                  You can create a new account by visiting our sign-up page and providing your email address and password. If you have any issues during registration, please contact our support team.
                </p>
              </details>

              <details className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 group cursor-pointer">
                <summary className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                  How do I reset my password?
                  <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="text-slate-600 dark:text-slate-400 mt-3">
                  Click the "Forgot Password" link on the login page and follow the instructions sent to your email address. You'll receive a password reset link valid for 24 hours.
                </p>
              </details>

              <details className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 group cursor-pointer">
                <summary className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                  Can I export my nutritional data?
                  <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="text-slate-600 dark:text-slate-400 mt-3">
                  Yes! You can export your meal history, nutritional data, and recipes in various formats from your account settings. This feature helps you maintain a backup of your data.
                </p>
              </details>

              <details className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 group cursor-pointer">
                <summary className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                  How accurate is the nutritional information?
                  <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="text-slate-600 dark:text-slate-400 mt-3">
                  Our nutritional data is sourced from verified databases and updated regularly. However, actual nutrition content may vary based on production methods and specific brands. Always consult with a nutritionist for personalized advice.
                </p>
              </details>

              <details className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 group cursor-pointer">
                <summary className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                  Is my data secure and private?
                  <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="text-slate-600 dark:text-slate-400 mt-3">
                  Yes, we use industry-standard encryption and security protocols to protect your data. Please review our Privacy Policy for more details on how we handle your information.
                </p>
              </details>
            </div>
          </section>

          <section className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-8 border border-slate-200 dark:border-slate-800">
            <h2 className="text-2xl font-black uppercase italic text-slate-900 dark:text-white mb-4">Didn't find what you need?</h2>
            <p className="text-slate-700 dark:text-slate-300 mb-6">
              Our support team is ready to help. Reach out via email, chat, or phone and we'll assist you as quickly as possible.
            </p>
            <a href="mailto:support@vitala.app" className="inline-block px-6 py-3 bg-indigo-500 text-white font-bold rounded-lg hover:bg-indigo-600 transition-colors">
              Contact Support
            </a>
          </section>
        </div>
      </div>
    </PageContainer>
  );
}

import React from 'react';
import { PrivacyPanel, SupportPanel, TermsPanel, SettingsPanel } from '../static-panels';

export function StaticPagesView({ activeView, onBack }: any) {
    if (activeView === 'profile') return <SettingsPanel onClose={onBack} />;
    if (activeView === 'privacy') return <PrivacyPanel onClose={onBack} />;
    if (activeView === 'support') return <SupportPanel onClose={onBack} />;
    if (activeView === 'terms') return <TermsPanel onClose={onBack} />;
    return null;
}

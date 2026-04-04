import React from 'react';
import { PanelWrapper } from './panel-wrapper';
import { PrivacyContent } from '@/components/static/privacy-content';
import { SupportContent } from '@/components/static/support-content';
import { TermsContent } from '@/components/static/terms-content';
import ProfilePage from '@/app/users/profile/page';

export function PrivacyPanel({ onClose }: { onClose: () => void }) {
    return (
        <PanelWrapper title="Privacy" onClose={onClose}>
            <div className="py-6">
                <PrivacyContent />
            </div>
        </PanelWrapper>
    );
}

export function SupportPanel({ onClose }: { onClose: () => void }) {
    return (
        <PanelWrapper title="Support" onClose={onClose}>
            <div className="py-6">
                <SupportContent />
            </div>
        </PanelWrapper>
    );
}

export function TermsPanel({ onClose }: { onClose: () => void }) {
    return (
        <PanelWrapper title="Terms" onClose={onClose}>
            <div className="py-6">
                <TermsContent />
            </div>
        </PanelWrapper>
    );
}

export function SettingsPanel({ onClose }: { onClose: () => void }) {
    return (
        <PanelWrapper title="Settings" onClose={onClose}>
            <ProfilePage />
        </PanelWrapper>
    );
}

import React from 'react';
import { PanelWrapper } from './panel-wrapper';
import { PrivacyContent } from '@/components/static/privacy-content';
import { SupportContent } from '@/components/static/support-content';
import { TermsContent } from '@/components/static/terms-content';
import { ProfileContent } from '@/components/static/profile-content';

export function PrivacyPanel({ onClose }: { onClose: () => void }) {
    return (
        <PanelWrapper title="Privacy">
            <div className="py-6">
                <PrivacyContent />
            </div>
        </PanelWrapper>
    );
}

export function SupportPanel({ onClose }: { onClose: () => void }) {
    return (
        <PanelWrapper title="Support">
            <div className="py-6">
                <SupportContent />
            </div>
        </PanelWrapper>
    );
}

export function TermsPanel({ onClose }: { onClose: () => void }) {
    return (
        <PanelWrapper title="Terms">
            <div className="py-6">
                <TermsContent />
            </div>
        </PanelWrapper>
    );
}

export function SettingsPanel({ onClose }: { onClose: () => void }) {
    return (
        <PanelWrapper title="Settings">
            <ProfileContent />
        </PanelWrapper>
    );
}

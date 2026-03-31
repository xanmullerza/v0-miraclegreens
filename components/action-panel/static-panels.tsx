import React from 'react';
import { PanelWrapper } from './panel-wrapper';
import PrivacyPolicyPage from '@/app/static/privacy/page';
import SupportPage from '@/app/static/support/page';
import TermsPage from '@/app/static/terms/page';
import ProfilePage from '@/app/users/profile/page';

export function PrivacyPanel({ onClose }: { onClose: () => void }) {
    return (
        <PanelWrapper title="Privacy" onClose={onClose}>
            <PrivacyPolicyPage />
        </PanelWrapper>
    );
}

export function SupportPanel({ onClose }: { onClose: () => void }) {
    return (
        <PanelWrapper title="Support" onClose={onClose}>
            <SupportPage />
        </PanelWrapper>
    );
}

export function TermsPanel({ onClose }: { onClose: () => void }) {
    return (
        <PanelWrapper title="Terms" onClose={onClose}>
            <TermsPage />
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

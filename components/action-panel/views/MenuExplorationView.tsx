import React from 'react';
import { CookbookMenuPanel, PlannerMenuPanel, WidgetsMenuPanel } from '../menu-panels';
import { DashboardView } from '../dashboard-view';
import { DesktopGuide } from '../desktop-guide';

export function MenuExplorationView({
    activeView, previousView, navigateTo, onBack,
    handleGoHome, isAdmin, setShowOnlyMyRecipes
}: any) {
    if (activeView === 'dashboard') {
        return (
            <DashboardView
                setActiveView={navigateTo}
                setShowOnlyMyRecipes={setShowOnlyMyRecipes}
                isAdmin={isAdmin}
            />
        );
    }

    if (activeView === 'desktop-guide') {
        return <DesktopGuide setActiveView={navigateTo} />;
    }

    if (activeView === 'cookbook') {
        return <CookbookMenuPanel onBack={() => handleGoHome(previousView)} navigateTo={navigateTo} />;
    }

    if (activeView === 'plannerMenu') {
        return <PlannerMenuPanel onBack={onBack} navigateTo={navigateTo} />;
    }

    if (activeView === 'widgetsMenu') {
        return <WidgetsMenuPanel onBack={onBack} navigateTo={navigateTo} />;
    }

    return null;
}

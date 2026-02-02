"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type EnergyUnit = "kcal" | "kJ";
export type MeasurementUnit = "metric" | "imperial";
export type GoalType = 'lose-fat' | 'maintain' | 'build-muscle';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active';
export type NutrientDisplayMode = 'value' | 'percentage' | 'both';
export type NutrientStrategy = 'balanced' | 'low-carb' | 'high-protein' | 'keto' | 'high-carb';

interface UserProfile {
    name: string;
    nickname: string;
    gender: 'male' | 'female';
    age: number | '';
    weight: number | '';
    height: number | '';
    goal: GoalType;
    dietType: string;
    activityLevel: ActivityLevel;
    nutrientStrategy: NutrientStrategy;
    exclusions: string[];
}

interface UserPreferencesContextType {
    energyUnit: EnergyUnit;
    setEnergyUnit: (unit: EnergyUnit) => void;
    measurementUnit: MeasurementUnit;
    setMeasurementUnit: (unit: MeasurementUnit) => void;
    nutrientDisplayMode: NutrientDisplayMode;
    setNutrientDisplayMode: (mode: NutrientDisplayMode) => void;
    profile: UserProfile;
    updateProfile: (updates: Partial<UserProfile>) => void;
    skipPlannerQuiz: boolean;
    setSkipPlannerQuiz: (skip: boolean) => void;
    dailyTargets: {
        energy: number;
        protein: number;
        carbs: number;
        fat: number;
    };
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(
    undefined
);

export function UserPreferencesProvider({ children }: { children: React.ReactNode }) {
    const [energyUnit, setEnergyUnitState] = useState<EnergyUnit>("kJ");
    const [measurementUnit, setMeasurementUnitState] = useState<MeasurementUnit>("metric");
    const [nutrientDisplayMode, setNutrientDisplayModeState] = useState<NutrientDisplayMode>("both");
    const [profile, setProfileState] = useState<UserProfile>({
        name: "",
        nickname: "",
        gender: "female",
        age: "",
        weight: "",
        height: "",
        goal: "maintain",
        dietType: "anything",
        activityLevel: "sedentary",
        nutrientStrategy: "balanced",
        exclusions: []
    });
    const [skipPlannerQuiz, setSkipPlannerQuizState] = useState(false);

    useEffect(() => {
        const savedUnit = localStorage.getItem("energyUnit") as EnergyUnit;
        if (savedUnit === "kcal" || savedUnit === "kJ") {
            setEnergyUnitState(savedUnit);
        }

        const savedMUnit = localStorage.getItem("measurementUnit") as MeasurementUnit;
        if (savedMUnit === "metric" || savedMUnit === "imperial") {
            setMeasurementUnitState(savedMUnit);
        }

        const savedNMode = localStorage.getItem("nutrientDisplayMode") as NutrientDisplayMode;
        if (savedNMode === "value" || savedNMode === "percentage" || savedNMode === "both") {
            setNutrientDisplayModeState(savedNMode);
        }

        const savedProfile = localStorage.getItem("userProfile");
        if (savedProfile) {
            try {
                setProfileState(JSON.parse(savedProfile));
            } catch (e) {
                console.error("Failed to parse user profile", e);
            }
        }

        const savedSkip = localStorage.getItem("skipPlannerQuiz");
        if (savedSkip !== null) {
            setSkipPlannerQuizState(savedSkip === "true");
        }
    }, []);

    const setEnergyUnit = (unit: EnergyUnit) => {
        setEnergyUnitState(unit);
        localStorage.setItem("energyUnit", unit);
    };

    const setMeasurementUnit = (unit: MeasurementUnit) => {
        setMeasurementUnitState(unit);
        localStorage.setItem("measurementUnit", unit);
    };

    const setNutrientDisplayMode = (mode: NutrientDisplayMode) => {
        setNutrientDisplayModeState(mode);
        localStorage.setItem("nutrientDisplayMode", mode);
    };

    const updateProfile = (updates: Partial<UserProfile>) => {
        const newProfile = { ...profile, ...updates };
        setProfileState(newProfile);
        localStorage.setItem("userProfile", JSON.stringify(newProfile));
    };

    const setSkipPlannerQuiz = (skip: boolean) => {
        setSkipPlannerQuizState(skip);
        localStorage.setItem("skipPlannerQuiz", String(skip));
    };

    // --- Calculation Engine ---
    const calculateDailyTargets = () => {
        const weight = Number(profile.weight) || 70;
        const height = Number(profile.height) || 170;
        const age = Number(profile.age) || 30;
        const gender = profile.gender || 'female';

        // BMR (Mifflin-St Jeor)
        const s = gender === 'male' ? 5 : -161;
        const bmr = (10 * weight) + (6.25 * height) - (5 * age) + s;

        // Activity Factor
        const activityFactors: Record<string, number> = {
            sedentary: 1.2,
            light: 1.375,
            moderate: 1.55,
            active: 1.725
        };
        const factor = activityFactors[profile.activityLevel] || 1.2;
        let tdee = bmr * factor;

        // Goal Adjustment
        if (profile.goal === 'lose-fat') tdee -= 500;
        if (profile.goal === 'build-muscle') tdee += 500;
        tdee = Math.max(tdee, 1200);

        // Strategy Allocation
        let pPct = 0.25, cPct = 0.45, fPct = 0.30;

        switch (profile.nutrientStrategy) {
            case 'low-carb':
                pPct = 0.35; cPct = 0.15; fPct = 0.50;
                break;
            case 'high-protein':
                pPct = 0.40; cPct = 0.35; fPct = 0.25;
                break;
            case 'keto':
                pPct = 0.25; cPct = 0.05; fPct = 0.70;
                break;
            case 'high-carb':
                pPct = 0.20; cPct = 0.60; fPct = 0.20;
                break;
        }

        // Child logic override for protein (approx 1g/kg)
        let protein: number;
        if (age < 14) {
            protein = weight * 1.0;
            const remainingCals = tdee - (protein * 4);
            // Distribute remaining cals based on strategy ratios
            const macroRatioSum = cPct + fPct;
            const adjustedCPct = cPct / macroRatioSum;
            const adjustedFPct = fPct / macroRatioSum;
            return {
                energy: tdee,
                protein,
                carbs: (remainingCals * adjustedCPct) / 4,
                fat: (remainingCals * adjustedFPct) / 9
            };
        }

        return {
            energy: tdee,
            protein: (tdee * pPct) / 4,
            carbs: (tdee * cPct) / 4,
            fat: (tdee * fPct) / 9
        };
    };

    const dailyTargets = calculateDailyTargets();

    return (
        <UserPreferencesContext.Provider value={{
            energyUnit,
            setEnergyUnit,
            measurementUnit,
            setMeasurementUnit,
            nutrientDisplayMode,
            setNutrientDisplayMode,
            profile,
            updateProfile,
            skipPlannerQuiz,
            setSkipPlannerQuiz,
            dailyTargets
        }}>
            {children}
        </UserPreferencesContext.Provider>
    );
}

export function useUserPreferences() {
    const context = useContext(UserPreferencesContext);
    if (context === undefined) {
        throw new Error("useUserPreferences must be used within a UserPreferencesProvider");
    }
    return context;
}

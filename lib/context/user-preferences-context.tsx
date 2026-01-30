"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type EnergyUnit = "kcal" | "kJ";
export type MeasurementUnit = "metric" | "imperial";
export type GoalType = 'lose-fat' | 'maintain' | 'build-muscle';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active';
export type NutrientDisplayMode = 'value' | 'percentage' | 'both';

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
            setSkipPlannerQuiz
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

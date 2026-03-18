"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { calculateIndividualTargets, GoalType, ActivityLevel, NutrientStrategy } from "@/lib/utils/nutrition-calculator";
import { DailyPlan } from "@/lib/utils/meal-generator";
import { supabase } from "@/lib/supabase";

export type EnergyUnit = "kcal" | "kJ";
export type MeasurementUnit = "metric" | "imperial";
export type NutrientDisplayMode = 'value' | 'percentage' | 'both';
export type HeaderStyle = 'labels' | 'icons';

export interface FamilyMember {
    id: string;
    name: string;
    gender: 'male' | 'female';
    age: number;
    weight: number;
    height: number;
    activityLevel: ActivityLevel;
    goal: GoalType;
}

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
    healthConditions: string[];
    country: string;
    familyMembers: FamilyMember[];
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
    showHeroes: boolean;
    setShowHeroes: (show: boolean) => void;
    headerStyle: HeaderStyle;
    setHeaderStyle: (style: HeaderStyle) => void;
    dailyTargets: {
        energy: number;
        protein: number;
        carbs: number;
        fat: number;
    };
    dailyPlan: DailyPlan | null;
    updateDailyPlan: (plan: DailyPlan | null) => void;
    showRDADrawer: boolean;
    setShowRDADrawer: (show: boolean) => void;
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(
    undefined
);

export function UserPreferencesProvider({ children }: { children: React.ReactNode }) {
    const [energyUnit, setEnergyUnitState] = useState<EnergyUnit>("kJ");
    const [measurementUnit, setMeasurementUnitState] = useState<MeasurementUnit>("metric");
    const [nutrientDisplayMode, setNutrientDisplayModeState] = useState<NutrientDisplayMode>("both");
    const [showHeroes, setShowHeroesState] = useState(true);
    const [headerStyle, setHeaderStyleState] = useState<HeaderStyle>('labels');
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
        exclusions: [],
        healthConditions: [],
        country: "Oceania",
        familyMembers: []
    });
    const [skipPlannerQuiz, setSkipPlannerQuizState] = useState(false);
    const [dailyPlan, setDailyPlanState] = useState<DailyPlan | null>(null);
    const [showRDADrawer, setShowRDADrawer] = useState(false);

    // Load initial data from localStorage and cloud
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

        const savedSkip = localStorage.getItem("skipPlannerQuiz");
        if (savedSkip !== null) {
            setSkipPlannerQuizState(savedSkip === "true");
        }

        const savedShowHeroes = localStorage.getItem("showHeroes");
        if (savedShowHeroes !== null) {
            setShowHeroesState(savedShowHeroes === "true");
        }

        const savedHeaderStyle = localStorage.getItem("headerStyle") as HeaderStyle;
        if (savedHeaderStyle === 'labels' || savedHeaderStyle === 'icons') {
            setHeaderStyleState(savedHeaderStyle);
        }

        const savedPlan = localStorage.getItem("dailyPlan");
        if (savedPlan) {
            try {
                setDailyPlanState(JSON.parse(savedPlan));
            } catch (e) {
                console.error("Failed to parse daily plan", e);
            }
        }

        // 1. First load from LocalStorage (fast)
        const savedProfile = localStorage.getItem("userProfile");
        if (savedProfile) {
            try {
                const parsed = JSON.parse(savedProfile);
                if (!parsed.familyMembers) parsed.familyMembers = [];
                setProfileState(parsed);
            } catch (e) {
                console.error("Failed to parse user profile", e);
            }
        }

        // 2. Then sync from Cloud (consistent across devices)
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .maybeSingle()
                    .then(({ data, error }) => {
                        if (error) {
                            console.error('Error fetching profile:', error);
                            return;
                        }
                        
                        if (data) {
                            const cloudProfile: UserProfile = {
                                name: data.full_name || "",
                                nickname: data.nickname || "",
                                gender: data.gender || "female",
                                age: data.age || "",
                                weight: data.weight || "",
                                height: data.height || "",
                                goal: data.goal || "maintain",
                                dietType: data.dietary_preferences?.dietType || "anything",
                                activityLevel: data.activity_level || "sedentary",
                                nutrientStrategy: data.nutrient_strategy || "balanced",
                                exclusions: data.dietary_preferences?.exclusions || [],
                                healthConditions: data.health_conditions || [],
                                country: data.country || "Australia",
                                familyMembers: data.family_members || []
                            };
                            setProfileState(cloudProfile);
                            localStorage.setItem("userProfile", JSON.stringify(cloudProfile));
                        } else {
                            // Profile doesn't exist yet, create one with defaults
                            supabase.from('profiles').insert({
                                id: session.user.id,
                                full_name: session.user.user_metadata?.full_name || "",
                                avatar_url: session.user.user_metadata?.avatar_url || null
                            }).then(({ error }) => {
                                if (error) console.error('Error creating profile:', error);
                            });
                        }
                    });
            }
        });

        // 3. Request Persistent Storage (Best practice for Mobile)
        if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
            navigator.storage.persist().then(persistent => {
                if (persistent) {
                    console.log("Storage will not be cleared except by explicit user action");
                }
            });
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

    const setShowHeroes = (show: boolean) => {
        setShowHeroesState(show);
        localStorage.setItem("showHeroes", show ? "true" : "false");
    };

    const setHeaderStyle = (style: HeaderStyle) => {
        setHeaderStyleState(style);
        localStorage.setItem("headerStyle", style);
    };

    const updateProfile = async (updates: Partial<UserProfile>) => {
        // Construct new profile
        const newProfile = { ...profile, ...updates };

        // 1. Update React State (UI responsiveness)
        setProfileState(newProfile);

        // 2. Save to LocalDevice (Safety fallback)
        localStorage.setItem("userProfile", JSON.stringify(newProfile));

        // 3. Sync to Cloud
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            const { error } = await supabase.from('profiles').upsert({
                id: session.user.id,
                full_name: newProfile.name,
                nickname: newProfile.nickname,
                gender: newProfile.gender,
                age: newProfile.age || null,
                weight: newProfile.weight || null,
                height: newProfile.height || null,
                goal: newProfile.goal,
                nutrient_strategy: newProfile.nutrientStrategy,
                activity_level: newProfile.activityLevel,
                dietary_preferences: {
                    dietType: newProfile.dietType,
                    exclusions: newProfile.exclusions
                },
                country: newProfile.country,
                health_conditions: newProfile.healthConditions,
                family_members: newProfile.familyMembers,
                updated_at: new Date().toISOString()
            } as any);

            if (error) {
                console.error('Cloud sync failed:', error.message);
                // We don't toast error here to avoid annoying user if offline, 
                // since it's already saved locally.
            }
        }
    };

    const setSkipPlannerQuiz = (skip: boolean) => {
        setSkipPlannerQuizState(skip);
        localStorage.setItem("skipPlannerQuiz", String(skip));
    };

    const updateDailyPlan = (plan: DailyPlan | null) => {
        setDailyPlanState(plan);
        if (plan) {
            localStorage.setItem("dailyPlan", JSON.stringify(plan));
        } else {
            localStorage.removeItem("dailyPlan");
        }
    };

    const dailyTargets = calculateIndividualTargets({
        weight: Number(profile.weight) || 70,
        height: Number(profile.height) || 170,
        age: Number(profile.age) || 30,
        gender: profile.gender || 'female',
        activityLevel: profile.activityLevel,
        goal: profile.goal,
        nutrientStrategy: profile.nutrientStrategy,
        measurementUnit: measurementUnit
    });

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
            showHeroes,
            setShowHeroes,
            headerStyle,
            setHeaderStyle,
            dailyTargets,
            dailyPlan,
            updateDailyPlan,
            showRDADrawer,
            setShowRDADrawer
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

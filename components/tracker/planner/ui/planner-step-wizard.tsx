import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DietCard, GoalCard, ActivityCard } from './preference-cards';
import { Leaf, Flame, Activity, Footprints, Armchair, Dumbbell, Zap, TrendingDown, Target, User, Ruler, Weight } from 'lucide-react';
import { cn } from '@/lib/utils';

export const PlannerStepWizard = ({ state, actions, handleGenerate }: any) => {
    const { step, age, weight, height, gender, diet, goal, activityLevel, calories, generating } = state;
    const { setAge, setWeight, setHeight, setGender, setDiet, setGoal, setActivityLevel, setCalories, setStep } = actions;

    if (step === 1) {
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="space-y-1.5">
                        <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><User size={10}/> Age</Label>
                        <Input type="number" value={age} onChange={(e) => setAge(Number(e.target.value))} className="h-10 bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 font-bold text-xs" />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><Weight size={10}/> Weight (kg)</Label>
                        <Input type="number" value={weight} onChange={(e) => setWeight(Number(e.target.value))} className="h-10 bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 font-bold text-xs" />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><Ruler size={10}/> Height (cm)</Label>
                        <Input type="number" value={height} onChange={(e) => setHeight(Number(e.target.value))} className="h-10 bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 font-bold text-xs" />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><Activity size={10}/> Gender</Label>
                        <div className="flex gap-1.5">
                            <Button variant={gender === 'female' ? 'default' : 'outline'} className="flex-1 h-10 rounded-xl text-[9px] uppercase font-black tracking-widest" onClick={() => setGender('female')}>Female</Button>
                            <Button variant={gender === 'male' ? 'default' : 'outline'} className="flex-1 h-10 rounded-xl text-[9px] uppercase font-black tracking-widest" onClick={() => setGender('male')}>Male</Button>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Biological Target</Label>
                    <div className="grid grid-cols-3 gap-3">
                        <GoalCard type="lose-fat" selected={goal === 'lose-fat'} onClick={() => setGoal('lose-fat')} icon={TrendingDown} label="Fat Loss" />
                        <GoalCard type="maintain" selected={goal === 'maintain'} onClick={() => setGoal('maintain')} icon={Target} label="Maintain" />
                        <GoalCard type="build-muscle" selected={goal === 'build-muscle'} onClick={() => setGoal('build-muscle')} icon={Zap} label="Muscle Build" />
                    </div>
                </div>

                <div className="space-y-3">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Activity Level</Label>
                    <div className="grid grid-cols-4 gap-3">
                        <ActivityCard type="sedentary" selected={activityLevel === 'sedentary'} onClick={() => setActivityLevel('sedentary')} icon={Armchair} />
                        <ActivityCard type="light" selected={activityLevel === 'light'} onClick={() => setActivityLevel('light')} icon={Footprints} />
                        <ActivityCard type="moderate" selected={activityLevel === 'moderate'} onClick={() => setActivityLevel('moderate')} icon={Activity} />
                        <ActivityCard type="active" selected={activityLevel === 'active'} onClick={() => setActivityLevel('active')} icon={Dumbbell} />
                    </div>
                </div>

                <div className="flex justify-center pt-4">
                   <Button 
                        onClick={handleGenerate} 
                        disabled={generating}
                        className="h-12 px-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-600/20 active:scale-95 transition-all w-full"
                    >
                        {generating ? 'Processing Molecular Data...' : 'Calculate & Generate Plan'}
                    </Button>
                </div>
            </div>
        );
    }



    if (step === 2) {
        return (
            <div className="py-20 flex flex-col items-center justify-center space-y-6 animate-pulse">
                <div className="w-20 h-20 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
                <div className="text-center space-y-2">
                    <h3 className="text-xl font-black uppercase tracking-tighter">Analyzing Nutrient Density</h3>
                    <p className="text-sm font-medium text-slate-500">Cross-referencing pantry items and RDA targets...</p>
                </div>
            </div>
        );
    }
    
    return null;
}

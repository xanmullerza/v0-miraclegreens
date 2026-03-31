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
                    <div className="space-y-2 group">
                        <Label className="text-[9px] font-black uppercase tracking-widest text-white flex items-center gap-1.5 px-1 transition-colors group-hover:text-emerald-400"><User size={10}/> Age</Label>
                        <Input type="number" value={age} onChange={(e) => setAge(Number(e.target.value))} className="h-10 bg-slate-50/5 dark:bg-slate-900 border-slate-100/10 dark:border-slate-800 font-bold text-xs rounded-full px-4 text-white focus:border-emerald-500 transition-all" />
                    </div>
                    <div className="space-y-2 group">
                        <Label className="text-[9px] font-black uppercase tracking-widest text-white flex items-center gap-1.5 px-1 transition-colors group-hover:text-emerald-400"><Weight size={10}/> Weight</Label>
                        <Input type="number" value={weight} onChange={(e) => setWeight(Number(e.target.value))} className="h-10 bg-slate-50/5 dark:bg-slate-900 border-slate-100/10 dark:border-slate-800 font-bold text-xs rounded-full px-4 text-white focus:border-emerald-500 transition-all" />
                    </div>
                    <div className="space-y-2 group">
                        <Label className="text-[9px] font-black uppercase tracking-widest text-white flex items-center gap-1.5 px-1 transition-colors group-hover:text-emerald-400"><Ruler size={10}/> Height</Label>
                        <Input type="number" value={height} onChange={(e) => setHeight(Number(e.target.value))} className="h-10 bg-slate-50/5 dark:bg-slate-900 border-slate-100/10 dark:border-slate-800 font-bold text-xs rounded-full px-4 text-white focus:border-emerald-500 transition-all" />
                    </div>
                    <div className="space-y-2 group">
                        <Label className="text-[9px] font-black uppercase tracking-widest text-white flex items-center gap-1.5 px-1 transition-colors group-hover:text-emerald-400"><Activity size={10}/> Gender</Label>
                        <div className="flex p-1 bg-slate-100/5 dark:bg-slate-800/50 rounded-full h-10 border border-slate-100/10 dark:border-slate-800">
                            <button 
                                onClick={() => setGender('female')}
                                className={cn(
                                    "flex-1 rounded-full text-[8px] font-black uppercase tracking-widest transition-all",
                                    gender === 'female' ? "bg-emerald-500 text-white shadow-sm" : "text-white/60 hover:text-emerald-400"
                                )}
                            >
                                Female
                            </button>
                            <button 
                                onClick={() => setGender('male')}
                                className={cn(
                                    "flex-1 rounded-full text-[8px] font-black uppercase tracking-widest transition-all",
                                    gender === 'male' ? "bg-emerald-500 text-white shadow-sm" : "text-white/60 hover:text-emerald-400"
                                )}
                            >
                                Male
                            </button>
                        </div>
                    </div>
                </div>

                <div className="space-y-3 group">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-white px-1 transition-colors group-hover:text-emerald-400">Biological Target</Label>
                    <div className="grid grid-cols-3 gap-2">
                        <GoalCard type="lose-fat" selected={goal === 'lose-fat'} onClick={() => setGoal('lose-fat')} icon={TrendingDown} label="Fat Loss" />
                        <GoalCard type="maintain" selected={goal === 'maintain'} onClick={() => setGoal('maintain')} icon={Target} label="Maintain" />
                        <GoalCard type="build-muscle" selected={goal === 'build-muscle'} onClick={() => setGoal('build-muscle')} icon={Zap} label="Muscle Build" />
                    </div>
                </div>

                <div className="space-y-3 group">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-white px-1 transition-colors group-hover:text-emerald-400">Activity Level</Label>
                    <div className="grid grid-cols-4 gap-2">
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
                        className="h-11 px-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-600/20 active:scale-95 transition-all w-full"
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

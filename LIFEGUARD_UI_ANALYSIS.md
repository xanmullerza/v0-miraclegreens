# Lifeguard Page - Complete UI & Component Analysis

## Overview
The Lifeguard page is a comprehensive survival simulation tool that guides users through a multi-step emergency preparedness scenario. The page is divided into 5 main navigation steps, with the most complex being the "lifeline" step which contains 20+ distinct UI sections and 15+ data dashboards.

---

## MAIN NAVIGATION STEPS (Lines 586-1870)

### Step 1: Security Assessment (`step='security'`)
**Lines:** ~650-720
**Purpose:** Assesses whether user has access to shelter/safe space
- **Card Component:** Warning card with amber border (Safety Advisory)
- **Two-Button Grid:** 
  - "Yes, I am Safe" (emerald hover) → proceeds to water step
  - "No, I need Shelter" (rose hover) → triggers safety advisory
- **Conditional Advisory Panel:** Rose-themed alert with shelter guidance text and "Next" button

**Data Required:**
- Security status state (`securityStatus`)
- User's shelter availability assessment

---

### Step 2: Water Assessment (`step='water'`)
**Lines:** ~720-830
**Purpose:** Evaluates water source availability and provides purification guidance
- **Card Component:** Water assessment card with blue border
- **Three-Button Grid:**
  - "Clean Water" (blue hover)
  - "Dirty Source" (amber hover) → triggers purification advisory
  - "No Source" (rose hover) → triggers water-finding advisory
- **Conditional Advisory Panels:** 
  - Amber alert for dirty water purification methods
  - Rose alert for no-water finding strategies
- **Continue Buttons:** Routes to ingredients step

**Data Required:**
- Water status state (`waterStatus`)
- Purification method information
- Water-finding strategies

---

### Step 3: Ingredients (`step='ingredients'`)
**Lines:** ~830-900
**Purpose:** Allows user to build their inventory/pantry
- **Inventory Display Section:**
  - Title: "Active Pantry" with item count badge (amber)
  - Empty state with dashed border
  - Scrollable list (max-h-[400px]) of inventory items
  - Each item card shows: name, weight input (grams), delete button

- **Interactive Food Search:**
  - Integrated with HeroSearch component
  - Real-time search results
  - Food cards display: image, name, energy (kcal/100g)

- **Project Lifeline Button:**
  - Primary action to start simulation
  - Shows loading spinner when searching
  - Disabled during calculations

**Data Required:**
- Inventory array of items with: id, name, weight_g, nutrition data
- Search results from food library
- Loading states

---

### Step 4: Lifeline (MAIN DASHBOARD) (`step='lifeline'`)
**Lines:** 900+
**Purpose:** Comprehensive survival simulation and analysis dashboard

This is the massive section with 15+ interactive panels. See detailed breakdown below.

---

## DETAILED LIFELINE DASHBOARD SECTIONS (After `step='lifeline'` condition)

### 1. LONGEVITY METER (Sticky Header)
**Lines:** ~770-850
**Type:** Sticky header (top-16 md:top-20)
**Visual:** Gradient background (slate-900 to slate-800) with amber accent border
**Components:**

- **Title + Survival Days Calculation:**
  - "Survival:" label (amber-400)
  - Large days number (2xl md:3xl font-black italic)
  - Formula: `Math.min(Math.ceil(energyDays + 20), 30)` (20-day body fat reserve)
  - "days" label (amber-300)

- **Status Ring (Compact):**
  - Pulsing circular indicator (w-12 md:w-16)
  - Border color: emerald/rose based on energy status
  - Display: "✓" or "✗" with "OK" or "CRIT" status
  - Background gradient effect

- **Profile Indicator Pill:**
  - Shows "STARV" or "MAINT" based on `profileType`
  - Emerald or rose background

- **Day Slider Section (Below border):**
  - Current day display: `Day {simulationDay}`
  - Energy display: Real-time kcal coloring (emerald/rose)
  - "Switch" button: Toggles between maintenance/starvation modes
  - Range slider: 0-30 days, step 1
  - Day labels: "Now" and "30 Days"

**Data Required:**
- `inventory` array with nutrition data
- `simulationDay` state (0-30)
- `profileType` state (maintenance/starvation)
- `SURVIVAL_PROFILES[profileType]` constants
- `INITIAL_STORES` body reserves
- `simStatus.results.energy`

---

### 2. SCENARIO COMPARISON TOGGLE
**Lines:** ~850-870
**Type:** Button group
**Visual:** Flex gap with center alignment

- **Primary Button:** "⚖️ Compare Scenario"
  - Indigo background (500-600 hover)
  - Disabled when already in comparison mode
  - Triggers: `startComparison()` function

- **Secondary Button (Conditional):** "✕ Close Comparison"
  - Slate background (500-600 hover)
  - Only visible when `comparisonMode === true`
  - Disables comparison view

**Data Required:**
- `comparisonMode` state
- `inventory` array (copies to comparison)
- `waterStatus` (copies to comparison)

---

### 3. VISUAL SURVIVAL CALENDAR (30-Day Timeline)
**Lines:** ~870-960
**Type:** Multi-row data visualization dashboard
**Visual:** Gradient background (slate-50 to slate-100 dark) with indigo accent

**Components:**

- **Header:**
  - Calendar icon (indigo-500)
  - Title: "Survival Timeline"
  - Subtitle: "30-day nutrient depletion forecast"

- **Four Nutrient Rows:**
  - **Icon + Label + Status Badge Row:**
    - Emoji icon (🔥🍊💊💧)
    - Nutrient name (Energy, Vitamin C, B1, Water)
    - Day count badge (emerald/amber/rose based on `daysLeft > 20 ? 10 : critical`)

  - **30-Day Bar Visualization:**
    - 30 colored squares (flex gap-0.5 h-4)
    - Color: gradient (nutrient-specific) for remaining days
    - Slate-200 for depleted days
    - Hover shows day number tooltip

- **Water Status Warning (Conditional):**
  - Shows if `waterStatus !== 'clean'`
  - Amber or rose alert text
  - Percentage penalty: -25% nutrients (dirty) or -15% energy (none)

**Nutrient Calculations:**
- **Energy:** `Math.ceil((INITIAL_STORES.energy + inventory_kcal) / profile.energy_floor)`
- **Vitamin C:** `Math.ceil((INITIAL_STORES.vit_c * profile.vit_c_floor + inventory_vitC) / profile.vit_c_floor)`
- **B1:** `Math.ceil((INITIAL_STORES.b1 * profile.b1_floor + inventory_b1) / profile.b1_floor)`
- **Water:** 30 days (clean), 8 days (dirty), 3 days (none)

**Data Required:**
- `inventory` with micronutrient data
- `INITIAL_STORES` body reserves
- `SURVIVAL_PROFILES[profileType]`
- `waterStatus` state
- All inventory nutrition data for each food item

---

### 4. COMPARISON PANEL
**Lines:** ~940-1040
**Type:** Side-by-side scenario comparison
**Visual:** Gradient background (indigo-50 to purple-50 dark) with indigo border-2

**Visibility:** Only when `comparisonMode && comparisonSimStatus`

**Two-Column Grid (md:grid-cols-2):**

- **Left Column - Current Scenario (Emerald):**
  - Header: "Current Scenario" (emerald-600 dark:emerald-400)
  - Display items:
    - Survival Window (days): calculation with `INITIAL_STORES.energy + adjustedInventory_kcal`
    - Item count
    - Water source status

- **Right Column - Alternate Scenario (Indigo):**
  - Header: "Alternate Scenario" (indigo-600 dark:indigo-400)
  - Same display items as left
  - **Editable Water Source Selector:**
    - Three buttons: "clean", "dirty", "none"
    - Updates `comparisonWaterStatus` state
    - Dynamic styling based on selection

- **Tip Alert (Indigo-themed):**
  - "💡 Tip: Adjust comparison inventory items below..."
  - Encourages user interaction

**Data Required:**
- `inventory` and `comparisonInventory` arrays
- `waterStatus` and `comparisonWaterStatus` states
- `simulationDay` for calculations
- `INITIAL_STORES`, `SURVIVAL_PROFILES`
- `comparisonSimStatus` object with results

---

### 5. COMPARISON INVENTORY EDITOR
**Lines:** ~1040-1080
**Type:** Interactive inventory adjustment panel
**Visual:** Light slate background (slate-50 dark:slate-800/30) with indigo accent border

**Visibility:** Only when `comparisonMode === true`

- **Header:** "Edit Comparison Inventory"

- **Scrollable Item List (max-h-40):**
  - For each item in `comparisonInventory`:
    - Range slider (0-2000g, step 50g)
    - Weight display (right-aligned in grams)
    - Delete button (X icon, rose hover)
  - Updates via: `setComparisonInventory()` with new weight

**Data Required:**
- `comparisonInventory` item array
- Weight state for each item
- Nutritional reference data

---

### 6. INVENTORY MANAGER (Survival Pantry)
**Lines:** ~1080-1290
**Type:** Interactive inventory management panel
**Visual:** Light background (slate-50 dark:slate-800/30) with slate border

**Components:**

- **Header Section:**
  - Library icon (blue-500)
  - Title: "Survival Pantry"
  - Item count badge (blue-500/20)
  - "Add Item" button (blue text, Plus icon)

- **Conditional Food Search Box (when `isHeroActive`):**
  - Text input: "Search foods..."
  - Loading spinner (Loader2 blue-500 animate-spin)
  - Results dropdown (max-h-40 overflow-y-auto):
    - For each result: white/dark card, food name (uppercase), energy value
    - Click adds to inventory

- **Main Inventory Display:**
  - If empty: "No items yet. Click 'Add Item' to start."
  - If populated: For each item in `inventory`:
    - Item name (truncated uppercase)
    - Weight display: `{weight_g}g • ~{kcal} kcal`
    - Delete button (X icon rose text)
    - Weight range slider (0-5000g, step 50g, blue accent)
    - 0g/5kg labels

**Data Required:**
- `inventory` array
- `isHeroActive` state
- `heroSearchQuery`, `heroResults`
- `isHeroSearching` state
- Item nutrition data for kcal calculation

---

### 7. SCENARIO PRESETS (Quick-Load Kits)
**Lines:** ~1290-1380
**Type:** Preset scenario cards panel
**Visual:** Gradient background (cyan-50 to blue-50 dark) with cyan accent border-2

- **Header:**
  - Wallet icon (cyan-500)
  - Title: "Scenario Presets"
  - Subtitle: "Quick-load survival kits"

- **Three-Column Grid (md:grid-cols-3):**
  - **Desert 🏜️:** "High-energy, minimal water"
    - Foods: Peanut Butter, Beef Jerky, Honey, Dates, Almonds
  - **Mountain ⛰️:** "Preserved, high-calorie"
    - Foods: Canned Beans, Dark Chocolate, Trail Mix, Hardtack, Cheese
  - **Urban 🏙️:** "Balanced, accessible"
    - Foods: Rice, Canned Vegetables, Pasta, Oats, Canned Tuna

- **Preset Card Features:**
  - Large emoji
  - Scenario name + description
  - Ingredient tags (truncated with abbreviations)
  - "Load Kit →" button (cyan-400 hover)
  - On click: searches for each food, populates inventory, shows success toast + boost

**Data Required:**
- Food search functionality (`searchLocalFood()`)
- Preset food lists and metadata
- Inventory management
- Toast notification system

---

### 8. CRITICAL ALERTS (Nutrient Warnings)
**Lines:** ~1380-1440
**Type:** Conditional warning dashboard
**Visual:** Rose-themed (rose-50 dark:rose-500/10) with rose border-2

**Visibility:** Only when alerts array length > 0

**Calculated Alerts:**
- Shows nutrients with < 10 days remaining
- Filters from: Energy, Vitamin C, B1

- **Header:**
  - Zap icon (rose-500 animate-pulse)
  - Title: "⚠️ Critical Nutrient Alerts"

- **Three-Column Grid (md:grid-cols-3):**
  - For each alert:
    - Icon + nutrient name
    - Days left badge (rose-500 text-white)
    - Severity text:
      - "🚨 CRITICAL - Add sources NOW" (≤3 days)
      - "⚠️ Depletion risk soon" (≤7 days)
      - "⚠️ Monitor levels" (7-10 days)

**Data Required:**
- `adjustedInventory` nutrition data
- `simStatus.results` for current nutrient levels
- `INITIAL_STORES` and `SURVIVAL_PROFILES`
- `SURVIVAL_PROFILES[profileType]` floor values

---

### 9. RECIPE MEAL PLANNER
**Lines:** ~1440-1620
**Type:** AI-generated emergency recipes panel
**Visual:** Gradient background (orange-50 to amber-50 dark) with orange border-2

**Visibility:** Only when `inventory.length > 0`

**Empty State:**
- Centered text: "No recipes generated yet"
- Button: "🔥 Generate Recipes" (orange-500)
  - Shows spinner during `isGeneratingRecipes`
  - Disabled while generating

**Populated State (when recipes exist):**
- Header row: recipe count, "⟳ Refresh" button

- **For Each Recipe Card:**
  - **Header Section:**
    - Large emoji icon (🔥💊🍽️⚡)
    - Recipe name (uppercase) + description
    - Efficiency percentage (top-right)
    - Efficiency circle: Gradient background (emerald/amber/rose)
      - Zap icon inside

  - **Nutrition Stats Grid (4 columns):**
    - Energy (red bg): kcal value
    - Vitamin C (orange bg): mg value
    - B1 (purple bg): mg value
    - Days (blue bg): potential_days value

  - **Ingredients Section:**
    - "Ingredients ({servingSize}g serving)"
    - Tag list: ingredient names with amounts (truncated, orange-themed)

  - **Details & Action Bar:**
    - Prep time badge: "⏱️ {prepTime} min"
    - Servings badge: "📦 {servings} servings"
    - Difficulty badge: "simple|moderate|complex" (emerald/amber/rose)
    - "🍽️ Consume" button (orange-500 hover:orange-600)
      - Disabled if servings === 0
      - On click: reduces inventory weights, regenerates recipes

**Recipe Generation Logic:**
Generates 4 recipe types based on inventory:
1. **Maximum Calorie Fuel** - highest energy items
2. **Nutrient Protocol** - vitamin-rich foods
3. **Balanced Survival Mix** - mixed ingredients
4. **Quick Energy Pack** - fast-prep high-energy items

**Data Required:**
- `inventory` array with full nutrition
- `SURVIVAL_PROFILES[profileType]`
- Recipe generation algorithm outputs
- `generatedRecipes` state
- `isGeneratingRecipes` loading state

---

### 10. MEAL RECOMMENDATIONS (Optimal Meal Plans)
**Lines:** ~1620-1800
**Type:** AI-suggested meal strategies
**Visual:** Gradient background (purple-50 to indigo-50 dark) with purple border

**Visibility:** Only when `inventory.length > 0`

- **Header:**
  - ChefHat icon (purple-500)
  - Title: "Optimal Meal Plans"
  - Subtitle: "Maximize survival potential"
  - Water status badge (conditional, amber): "-25% nutrients" or "-15% energy"

- **Three Meal Suggestion Cards (grid-cols-3):**

  **1. Energy Boost 🔥**
  - "Maximize caloric intake"
  - Shows 2-3 top-energy items
  - Benefit: `+{avgEnergy * 3} kcal`
  - Serving: 250g

  **2. Vitamin Protocol 💊**
  - "Prevent deficiency symptoms"
  - Shows vitamin-rich items
  - Benefit: "+400mg Vit C" or "✓ Sufficient"
  - Serving: 125g

  **3. Balanced Meal 🍽️**
  - "Mix all food groups available"
  - Shows top 3 items
  - Benefit: "Sustains {days} days"
  - Serving: 300g

- **Each Card Contains:**
  - Meal name + description
  - Item list (first 2, "+X more" if needed)
  - Impact display (purple-themed)
  - "Consume →" button (purple-500 hover:purple-600)
    - Reduces inventory weights
    - Shows success toast
    - Adds boost message

**Meal Calculations:**
- Filters inventory by energy/nutrition thresholds
- Projects days sustained: `{totalEnergy} / profile.energy_floor`
- Checks for critical nutrient deficits

**Data Required:**
- `inventory` with nutrition data
- `SURVIVAL_PROFILES[profileType]`
- `INITIAL_STORES` for deficit calculations
- `waterStatus` for penalty adjustments
- Consumption callback function

---

### 11. NUTRIENT CASCADE TIMELINE
**Lines:** ~1800-1870
**Type:** Visual depletion sequence chart
**Visual:** Slate background (slate-50 dark:slate-800/30) with slate border

- **Header:**
  - Calendar icon (purple-500)
  - Title: "Nutrient Cascade Timeline"

- **Four Nutrient Rows (sorted by depletion day ASC):**
  - **Thiamine (B1) 💊** → from-purple-500 to-purple-600
  - **Vitamin C 🍊** → from-orange-500 to-orange-600
  - **Potassium ⚡** → from-yellow-500 to-yellow-600
  - **Energy Stores 🔥** → from-red-500 to-red-600

- **For Each Row:**
  - Icon + label (left)
  - Status badge (right): "Day {daysLeft}" with color:
    - Green (emerald-500): > 20 days
    - Amber (amber-500): > 10 days
    - Red (rose-500): ≤ 10 days
  - Full-width gradient bar: width = `(daysLeft / 30) * 100%` (min 100%)
  - Smooth CSS transitions

**Cascade Calculations:**
- **B1:** `(INITIAL_STORES.b1 * profile.b1_floor + inventory_b1) / profile.b1_floor`
- **Vitamin C:** `(INITIAL_STORES.vit_c * profile.vit_c_floor + inventory_vitC) / profile.vit_c_floor`
- **Potassium:** `(INITIAL_STORES.potassium + inventory_potassium) / profile.potassium_floor`
- **Energy:** `(INITIAL_STORES.energy + inventory_kcal) / profile.energy_floor`

**Data Required:**
- `inventory` nutrition data
- `INITIAL_STORES` object
- `SURVIVAL_PROFILES[profileType]`
- Micronutrient lookup logic

---

### 12. SURVIVAL REQUIREMENTS DASHBOARD
**Lines:** ~1850-1920
**Type:** Metric display grid
**Visual:** Slate background (slate-50 dark:slate-800/30) with slate border

- **Header:**
  - Zap icon (purple-500)
  - Title: "Survival Requirements"

- **Six-Item Grid (md:grid-cols-3):**
  Each card displays a daily requirement:

  1. **Energy:** `{profile.energy_floor}` kcal/day
  2. **Water:** `{profile.water_floor}` L/day
  3. **Thiamine:** `{profile.b1_floor}` mg/day
  4. **Vitamin C:** `{profile.vit_c_floor}` mg/day
  5. **Sodium:** `{profile.sodium_floor}` mg/day
  6. **Potassium:** `{profile.potassium_floor}` mg/day

- **Card Layout:**
  - Icon (nutrient-specific, colored background)
  - Label (uppercase)
  - Large value (text-lg font-black italic)
  - Unit (small text)
  - Total for simulation: "Total: {req.val * simulationDay} ({simulationDay}d)"

**Data Required:**
- `SURVIVAL_PROFILES[profileType]` daily floor values
- `simulationDay` for total calculation
- Icon/metric mappings

---

### 13. DEFICIT ANALYSIS
**Lines:** ~1920-2050
**Type:** Required vs Actual comparison dashboard
**Visual:** Gradient background (slate-50 to slate-100 dark) with slate border

- **Header:**
  - Scale icon (blue-500)
  - Title: "Deficit Analysis"

- **Two-Column Grid (md:grid-cols-2):**
  Each item analyzes 4 key nutrients:

  **1. Energy**
  - Required: `profile.energy_floor * simulationDay` kcal
  - Actual: `simStatus.results.energy`
  - Unit: kcal
  - Deficit: calculated difference

  **2. Hydration**
  - Required: `profile.water_floor * simulationDay` L
  - Actual: `simStatus.results.water`
  - Unit: L

  **3. Thiamine (B1)**
  - Required: `profile.b1_floor * simulationDay` mg
  - Actual: `simStatus.results.b1`
  - Unit: mg

  **4. Vitamin C**
  - Required: `profile.vit_c_floor * simulationDay` mg
  - Actual: `simStatus.results.vit_c`
  - Unit: mg

- **For Each Nutrient Card:**
  - Header: nutrient name + percentage met badge
    - Color: rose/red if deficient, emerald if sufficient
  - Required bar (100% width, gray)
  - Actual bar (width = percentMet %, emerald/rose)
  - Shortfall text (if deficient): "Shortfall: {deficit} {unit}"

**Calculations:**
- `percentMet = (actual / required) * 100`
- `isDeficient = actual < required`

**Data Required:**
- `SURVIVAL_PROFILES[profileType]`
- `simStatus.results` object with all metrics
- `simulationDay` for scaling

---

### 14. CRITICAL TIMELINE (When Nutrients Run Out)
**Lines:** ~2050-2120
**Type:** Event milestone dashboard
**Visual:** Amber background (amber-50 dark:amber-500/5) with amber border

- **Header:**
  - Calendar icon (amber-600 dark:amber-400)
  - Title: "Critical Timeline"

- **Four Critical Event Rows:**

  1. **Energy Depletion** 
     - Days until: calculated from energy stores
     - Critical threshold: 21 days
  
  2. **Dehydration Risk**
     - Days until: calculated from water
     - Critical threshold: 3 days
  
  3. **Vitamin C Depletion**
     - Days until: calculated from vit_c stores
     - Critical threshold: 14 days
  
  4. **Thiamine Deficiency**
     - Days until: calculated from B1 stores
     - Critical threshold: 7 days

- **For Each Row:**
  - Card with left border-l-4 (emerald/rose based on criticality)
  - Centered item count
  - Label (uppercase, tracking-widest)
  - Calculated days or "Beyond Sim" if > 365
  - Right badge: day count (emerald/rose background)
  - Severity styling:
    - If `daysUntil <= critical`: rose-themed (red background)
    - Else: emerald-themed (green background)

**Data Required:**
- Energy, hydration, B1, Vitamin C calculations
- `INITIAL_STORES` reserves
- `inventory` nutrition totals
- `SURVIVAL_PROFILES[profileType]` floor values

---

### 15. WATER PURIFICATION GUIDE
**Lines:** ~2120-2210
**Type:** Conditional educational protocol panel
**Visual:** Gradient background (blue-50 to cyan-50 dark) with blue border-2

**Visibility:** Only when `waterStatus !== 'clean'`

**If waterStatus === 'dirty' (3 methods shown):**

1. **Method 1: Boiling (Most Effective) 🔥**
   - "Bring water to rolling boil for 1 minute (3 min above 6,500 ft). Kills 99.9% pathogens. First, filter through cloth to remove particles."

2. **Method 2: Chemical (Bleach) 💊**
   - "Add 2 drops unscented bleach per quart. Stir well and wait 30 minutes. Cup in hand - liquid should smell faintly of chlorine."

3. **Method 3: Solar (SODIS) ☀️**
   - "Clear plastic bottle in direct sun for 6-8 hours. UV radiation inactivates pathogens. Works if weather is clear."

**If waterStatus === 'none' (2 methods shown):**

1. **Finding Water 🌊**
   - "Look for: green vegetation areas, animal tracks, morning dew on leaves (collect with cloth). Avoid seawater and urine—both cause severe dehydration."

2. **Dehydration Warning ⚠️**
   - "Even 2% fluid loss impairs cognition. Dark urine = dehydrated. Prioritize finding water immediately. Rationing without water found = fatal strategy."

**Data Required:**
- `waterStatus` state
- Educational text content
- User awareness messaging

---

### 16. RECOVERY PROTOCOLS (Safety Net)
**Lines:** ~2210-2290
**Type:** Smart adaptive intervention panel
**Visual:** Gradient background (emerald-50 to teal-50 dark) with emerald border-2

**Visibility:** Only when `simStatus.activeSymptoms.length > 0 && inventory.length > 0`

- **Header:**
  - Plus icon (emerald-600 dark:emerald-400)
  - Title: "Recovery Protocols"
  - Subtitle: "Add foods to extend survival"

- **Up to 3 Symptom Cards (showing first 3):**
  - For each symptom in `simStatus.activeSymptoms`:
    - Header: symptom name + required nutrient badge
    - Description text (specific guidance per nutrient):
      - B1: "Add whole grains, legumes, nuts to restore thiamine levels"
      - Vit C: "Add citrus, peppers, kale, or berries for ascorbic acid"
      - Potassium: "Add potatoes, beans, spinach, or bananas"
      - Sodium: "Add salt, dried fish, or cured meats to restore electrolytes"
      - Energy: "Add oils, nuts, grains, or any calorie-dense foods"
      - Water: "Prioritize finding clean water source immediately"

**Data Required:**
- `simStatus.activeSymptoms` array with:
  - name (e.g., "Scurvy")
  - nutrient (e.g., "vit_c")
  - symptom description
  - terminal risk level
- Adaptive recovery guidance text

---

### 17. EMERGENCY FOOD RANKING
**Lines:** ~2290-2380
**Type:** Reference library visualization
**Visual:** Slate background (slate-50 dark:slate-800/30) with slate border

- **Header:**
  - Library icon (amber-500)
  - Title: "Emergency Food Ranking"
  - Subtitle: "Top survival foods by score"

- **Nine-Item Grid (sm:grid-cols-2 md:grid-cols-3):**

  **Food Database (ranked by efficiency):**
  1. 🍚 Rice: 130 kcal, score 95, [Carbs, B1], shelf ∞
  2. 🫘 Beans: 95 kcal, score 98, [Protein, B1, Fiber], shelf ∞
  3. 🥜 Nuts: 160 kcal, score 96, [Fats, Minerals], shelf 2y
  4. 🍯 Honey: 65 kcal, score 92, [Sugar, Energy], shelf ∞
  5. 🥛 Powdered Milk: 110 kcal, score 89, [Protein, Calcium], shelf 1y
  6. 🌾 Oats: 150 kcal, score 94, [Carbs, B1, Fiber], shelf 2y
  7. 🥜 Peanut Butter: 188 kcal, score 97, [Protein, Fats, B1], shelf 1y
  8. 🍇 Dried Fruit: 80 kcal, score 85, [Sugars, Vit C, Fiber], shelf 1y
  9. 🐟 Canned Fish: 60 kcal, score 91, [Protein, Omega3], shelf 5y

- **For Each Food Card:**
  - Large emoji icon (text-2xl)
  - Rank badge (top-right): #1-9 (emerald/amber based on score)
  - Food name (uppercase)
  - kcal/100g value
  - Nutrient tags (sky-themed): [tag1, tag2, ...]
  - Shelf life: "Shelf: {duration}"

**Data Required:**
- Hardcoded food reference database
- Efficiency scoring algorithm
- Nutrient classification
- Shelf-life information

---

### 18. BIOLOGICAL RESERVES (Key Metrics Grid)
**Lines:** ~2380-2520
**Type:** Real-time metric dashboard
**Visual:** Six-card grid layout

- **Section Header:**
  - Activity icon (amber-500)
  - Title: "Biological Reserves"

- **Six Metric Cards:**

  Each card displays current physiological status:

  1. **Energy**
     - Icon: Zap (lightning)
     - Value: `simStatus.results.energy` kcal
     - Color: rose/emerald based on level

  2. **Hydration**
     - Icon: Utensils
     - Value: `simStatus.results.water` days
     - Color: blue-themed

  3. **Thiamine (B1)**
     - Icon: Sparkles
     - Value: `simStatus.results.b1` mg
     - Color: purple-themed

  4. **Vitamin C**
     - Icon: Plus
     - Value: `simStatus.results.vit_c` mg
     - Color: orange-themed

  5. **Potassium**
     - Icon: Activity
     - Value: `simStatus.results.potassium` mg
     - Color: yellow-themed

  6. **Sodium**
     - Icon: Info
     - Value: `simStatus.results.sodium` mg
     - Color: slate-themed

- **Card Layout:**
  - Top row: label + icon pill
  - Large italic value (xl font-black)
  - Unit label (uppercase)
  - Color coding:
    - ≤ 0: rose-500 text
    - > 0: slate-900 dark:white text

**Data Required:**
- `simStatus.results` object:
  - energy (kcal)
  - water (days)
  - b1 (mg)
  - vit_c (mg)
  - potassium (mg)
  - sodium (mg)

---

### 19. DIAGNOSTIC WARNINGS (Active Symptoms)
**Lines:** ~2520-2650
**Type:** Medical alert system
**Visual:** Two-column layout (Reserves + Diagnostics side-by-side)

- **Section Header:**
  - Info icon (rose-500)
  - Title: "Diagnostic Warnings"

**If No Active Symptoms:**
- Emerald-themed success card:
  - Sparkles icon + "Bio-Integrity Maintained"
  - Message: "Current inventory sustains all critical functions through Day {simulationDay}"

**If Symptoms Exist (up to full list):**
- For each symptom in `simStatus.activeSymptoms`:
  - Rose-themed card (rise-50 dark:rose-500/5) with rose border-2
  - Header: Activity icon + symptom name (large rose-600)
  - Full symptom description text (uppercase, leading text)
  - Terminal risk box (rose-500/10): "Terminal Risk: {terminal}"
  - Animation: animate-in zoom-in-95 duration-300

**Symptom Data Example:**
- name: "Scurvy"
- symptom: "Joint pain, bleeding gums, slow wound healing"
- nutrient: "vit_c"
- terminal: "Death in 2 weeks without Vitamin C source"

**Data Required:**
- `simStatus.activeSymptoms` array with:
  - name (symptom name)
  - symptom (full description)
  - nutrient (cause)
  - terminal (death timeline)

---

### 20. PROTOCOL LIFELINES (Recipe Recommendations)
**Lines:** ~2650-2750
**Type:** Suggested solution panel
**Visual:** White/dark cards with slate border

**Title Section (pt-12 border-t):**
- Large heading: "Protocol Lifelines"
- "Adjust Pantry" button (ghost variant)

**Two-Column Grid (md:grid-cols-2):**

**Empty State:**
- Full-width (md:col-span-2) dashed border card
- Text: "No matching protocols in library"
- Subtitle: "Add more diverse ingredients to unlock recommendations"

**Populated State (when suggestions exist):**
- For each `suggestion` (recipe from `suggestions` array):
  - **Card Layout:**
    - Image/icon (w-16 h-16, ChefHat fallback)
    - Recipe title (lg font-black uppercase italic)
    - Calories display (emerald-500 bold): "{calories} KCAL SHIELD"
    - "Consume Protocol" button (slate-900 hover:black)
      - On click: `eatMeal(recipe)`
      - Full width h-12

**Data Required:**
- `suggestions` array with:
  - id, title, image, calories
- `eatMeal()` callback function
- Recommendation algorithm outputs

---

### 21. BIOLOGICAL HIERARCHY OF NEEDS (Context Footer)
**Lines:** ~2750-2800
**Type:** Educational info banner
**Visual:** Dark slate-900 (text-white) with amber accent, large rounded (4rem)

- **Header Section:**
  - Info icon in amber-500/20 pill background
  - Large title (text-xl font-black uppercase italic)
  - "Biological Hierarchy of Needs"

- **Three-Column Grid (md:grid-cols-3):**

  1. **Stability (3 Hrs)**
     - "Regulate core temp or face hypothermia"
     - Amber text color

  2. **Hydration (3 Days)**
     - "Without water, blood thickens and kidneys fail"
     - Blue text color

  3. **Nutrition (3 Weeks)**
     - "Body begins consuming vital organs for energy"
     - Emerald text color

- **Each Column:**
  - Left border-l-2 (slate-800)
  - Padding: pl-6
  - Label: font-black text-xs uppercase tracking-widest
  - Detail: font-medium text-[10px] text-slate-400 italic

**Data Required:**
- Static educational content
- Biological hierarchy factsheets

---

## DATA FLOW & KEY STATE VARIABLES

### Primary State Variables
```typescript
step: 'security' | 'water' | 'ingredients' | 'lifeline' | 'results'
securityStatus: 'safe' | 'unsafe' | null
waterStatus: 'clean' | 'dirty' | 'none' | null
inventory: InventoryItem[]
simulationDay: 0-30
profileType: 'maintenance' | 'starvation'
comparisonMode: boolean
comparisonInventory: InventoryItem[]
comparisonWaterStatus: 'clean' | 'dirty' | 'none' | null
generatedRecipes: EmergencyRecipe[]
simStatus: { results: {...}, activeSymptoms: [...], isTerminal: boolean }
```

### Key Calculated Values
- **adjustedInventory:** Inventory with water penalties applied
- **simStatus:** Result of `calculateSurvivalStatus()` function
- **comparisonSimStatus:** Alternate scenario simulation result
- **suggestions:** AI-recommended meals based on symptom analysis

---

## INTERACTION PATTERNS

### Navigation Flow
1. Security Assessment → Water Assessment → Ingredients Selection → Lifeline Dashboard
2. Within Lifeline: Slider adjusts simulation day (0-30)
3. Profile Type Toggle: switches between maintenance & starvation modes
4. Comparison Mode: duplicates inventory for "what-if" analysis

### Data Mutations
- **Add Inventory:** Search → Select → Weight adjustment
- **Remove Inventory:** Clear individual items or entire inventory
- **Consume Meal:** Select recipe → Reduce inventory weights
- **Scenario Preset:** Load predefined food kit

### Real-Time Calculations
- All dashboards update reactively based on:
  - `simulationDay` changes (slider)
  - `inventory` modifications
  - `waterStatus` changes
  - `profileType` toggles

---

## VISUAL DESIGN PATTERNS

### Color Schemes by Section
- **Emerald/Green:** Optimal status, success states
- **Amber/Orange:** Warnings, moderate risk
- **Rose/Red:** Critical alerts, terminal states
- **Blue/Cyan:** Water-related info
- **Purple/Indigo:** Comparison mode, advanced features
- **Slate:** Neutral, informational content

### Typography Hierarchy
- **Titles:** text-2xl font-black uppercase italic
- **Section Headers:** text-[10px] font-black uppercase tracking-widest
- **Values:** text-lg md:text-2xl font-black italic
- **Labels:** text-[8px] font-bold uppercase

### Interactive Element Sizes
- Buttons: h-12 to h-20 depending on context
- Cards: p-4 to p-8 padding
- Spacing: gap-3 to gap-12 between sections
- Rounded corners: rounded-2xl, rounded-3xl, rounded-[3rem]

---

## FILE STATISTICS
- **Total Lines:** ~1870
- **Main Return JSX Lines:** 586-1870 (1,284 lines)
- **Lifeline Step Content:** ~1000+ lines (majority of complexity)
- **Number of Sections:** 21 major UI sections
- **Number of Dashboards:** 15+ data visualization components
- **Conditional Renders:** 8 (based on step, waterStatus, activeSymptoms, etc.)
- **Component Imports:** 18 lucide-react icons

---

## KEY DEPENDENCIES

### External Functions
- `calculateSurvivalStatus()` - Core simulation engine
- `searchLocalFood()` - Food library search
- `supabase` - Cloud persistence
- `HeroSearch` - Reusable search component
- `toast` (sonner) - Notification system

### Constants
- `SURVIVAL_PROFILES` - Maintenance/Starvation profile data
- `INITIAL_STORES` - Body reserves at start
- `SURVIVAL_PROFILES[profileType]` - Daily requirement floors

### Context/Hooks
- `useUserPreferences()` - Energy unit preference (kJ/kcal)
- `useRouter()` - Navigation
- localStorage - Local persistence
- Supabase - Cloud sync

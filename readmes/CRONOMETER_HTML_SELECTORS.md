# Cronometer HTML Parser - Selector Reference

This document provides the CSS selectors and XPath references needed to extract data from Cronometer food pages for the N8N parser nodes.

---

## Page Structure Overview

A typical Cronometer food page (e.g., `https://cronometer.com/food.html?food=1`) has:

1. **Food Name/Title** - At the top of the page
2. **Nutrition Facts Label** - The main nutrition summary box
3. **Serving Sizes Table** - Shows measures (cup, tbsp, etc.) with gram weights
4. **Nutrition Facts Table** - Detailed breakdown of all nutrients
5. **Micronutrients Section** - Vitamins, minerals, amino acids (often in a separate section)

---

## CSS Selectors for N8N HTML Parse Node

### Food Name/Title

```css
/* Primary heading */
h1

/* Alternative - food name heading */
.food-name
main h1
[data-testid="food-name"]

/* Backup - first h1 in main content */
main h1:first-of-type
```

**Expected output:** `"Sour dressing, non-butterfat, cultured, filled cream-type"`

---

### Nutrition Facts (Macros)

The nutrition facts are displayed in a table. Look for rows with:

**Calories/Energy:**
```css
/* Row containing "Calories" or "Energy" */
tr:has(td:contains("Calories")) td:nth-child(2)
tr:has(td:contains("Energy")) td:nth-child(2)

/* More reliable: find by data attribute */
[data-nutrient="energy"] .value
[data-nutrient="calories"] .value
```

**Protein:**
```css
tr:has(td:contains("Protein")) td:nth-child(2)
[data-nutrient="protein"] .value
```

**Carbohydrates:**
```css
tr:has(td:contains("Total Carbohydrate")) td:nth-child(2)
tr:has(td:contains("Carbs")) td:nth-child(2)
[data-nutrient="carbohydrates"] .value
```

**Fat:**
```css
tr:has(td:contains("Total Fat")) td:nth-child(2)
[data-nutrient="fat"] .value
```

**Kilojoules (kJ):**
```css
tr:has(td:contains("Kilojoules")) td:nth-child(2)
[data-nutrient="energy_kj"] .value
```

---

### Serving Sizes Table

Cronometer displays serving sizes in a table with two main columns: **Measure** and **Grams**

```html
<!-- Expected HTML structure -->
<table>
  <thead>
    <tr>
      <th>Measure</th><th>Grams</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>cup</td><td>235</td>
    </tr>
    <tr>
      <td>tbsp</td><td>12</td>
    </tr>
  </tbody>
</table>
```

**CSS Selector:**
```css
/* Find the servings table - may need to adjust based on actual page structure */
table:has(th:contains("Measure"))
[data-testid="serving-sizes"] table
.servings-table table

/* Extract individual rows */
table:has(th:contains("Measure")) tbody tr

/* Parse each row */
tr:selected td:nth-child(1)  /* Measure label */
tr:selected td:nth-child(2)  /* Gram value */
```

**Expected output:**
```json
[
  { "label": "cup", "weight_g": 235 },
  { "label": "tbsp", "weight_g": 12 }
]
```

---

### Micronutrients (Vitamins & Minerals)

Usually displayed in a section below the macros, often with two columns.

**Common patterns:**

```css
/* Vitamins section */
[data-testid="vitamins"] table
.vitamin-section table

/* Minerals section */
[data-testid="minerals"] table
.mineral-section table

/* All nutrient rows */
table tbody tr:has(td:contains("Vitamin"))
table tbody tr:has(td:contains("Magnesium"))
table tbody tr:has(td:contains("Calcium"))
/* etc... */
```

**Expected structure:**
```html
<tr>
  <td>Vitamin A</td>
  <td>3 µg</td>
  <td>0.2%</td>
</tr>
<tr>
  <td>Calcium</td>
  <td>142 mg</td>
  <td>11%</td>
</tr>
```

**Parse logic:**
- Column 1: Nutrient name (e.g., "Vitamin A", "Calcium")
- Column 2: Value with unit (e.g., "3 µg", "142 mg")
- Column 3: % Daily Value (can ignore)

Extract numeric value and convert to standard units (mg, µg, g) if needed.

---

## XPath Alternatives

If CSS selectors don't work, try XPath:

```xpath
/* Food name */
//h1
//h1[contains(text(), 'dressing')]
//main/h1

/* Nutrition value by label */
//tr[td[contains(text(), 'Calories')]]//td[2]
//td[contains(text(), 'Protein')]//parent::tr//td[2]

/* Serving size rows */
//table[.//th[contains(text(), 'Measure')]]/tbody/tr

/* Micronutrients */
//tr[td[contains(text(), 'Vitamin')]]
//tr[td[contains(text(), 'Magnesium')]]
```

---

## N8N Implementation Notes

1. **Use "HTML to JSON" node** or **"Code" node** to parse
2. **Test selectors** by running the workflow on a real Cronometer page
3. **Handle variations** - Different food types may have slightly different HTML structures
4. **Sanitize output** - Remove units and convert to numbers (e.g., "142 mg" → 142)
5. **Error handling** - If selector finds nothing, store as `null` or `undefined`

---

## Quick Test Command

To verify selectors in browser console:

```javascript
/* Food name */
document.querySelector('h1').textContent

/* Nutrition values - find by label */
Array.from(document.querySelectorAll('tr')).find(tr => 
  tr.textContent.includes('Calories')
)?.querySelectorAll('td')[1]?.textContent

/* Serving sizes - get all rows */
Array.from(document.querySelectorAll('table')[0]?.querySelectorAll('tbody tr') || []).map(tr => ({
  label: tr.cells[0]?.textContent.trim(),
  weight_g: tr.cells[1]?.textContent.trim()
}))
```

---

## Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| Selectors return empty | Page structure changed | Inspect live page, update selectors |
| Values include units | Parser not converting | Strip units (e.g., "142 mg" → 142) |
| Serving sizes missing | Table has different structure | Check XPath or data attributes |
| Micronutrients incomplete | Section is paginated/lazy-loaded | May need JavaScript execution in N8N |
| Numbers have commas | Regional formatting | Replace commas before parsing |

---

## Questions for Debugging

1. Does the live Cronometer page show all data you expect?
2. Are there multiple tables on the page? (Which one is the nutrition table?)
3. Does the page use data attributes (`data-testid`, `data-nutrient`) or just plain HTML?
4. Is any content lazy-loaded (requires scrolling/JS)?
5. Does the page have pagination for micronutrients?

If you encounter issues, open the Cronometer page in a browser, right-click → Inspect, and share the HTML structure for that section.

---

## Example: Full Food Data Extraction

Here's a complete example of what the N8N parser should extract from food ID 1:

```json
{
  "name": "Sour dressing, non-butterfat, cultured, filled cream-type",
  "energy_kcal": 178,
  "energy_kj": 745,
  "protein_g": 3.3,
  "carbs_g": 4.68,
  "fat_g": 16.9,
  "servings": [
    { "label": "1 cup", "weight_g": 235 },
    { "label": "1 tbsp", "weight_g": 12 }
  ],
  "micronutrients": {
    "Water": 74.79,
    "Ash": 0.71,
    "Calcium": 142,
    "Iron": 0.08,
    "Magnesium": 8,
    "Phosphorus": 89,
    "Potassium": 94,
    "Sodium": 48,
    "Zinc": 0.24,
    "Copper": 0.01,
    "Manganese": 0.002,
    "Selenium": 14.1,
    "Vitamin A": 3,
    "Vitamin C": 0.9,
    "Vitamin D": 0,
    "Vitamin E": 0.08,
    "Vitamin K": 0,
    "B1 (Thiamine)": 0.04,
    "B2 (Riboflavin)": 0.16,
    "B3 (Niacin)": 0.07,
    "B5 (Pantothenic Acid)": 0.4,
    "B6 (Pyridoxine)": 0.02,
    "B9 (Folate)": 12,
    "B12 (Cobalamin)": 0.33,
    "Choline": 14.9,
    "Saturated Fat": 13.3,
    "Monounsaturated Fat": 2.3,
    "Polyunsaturated Fat": 0.5,
    "Trans Fat": 0,
    "Cholesterol": 5
  }
}
```

Good luck with the parser setup!

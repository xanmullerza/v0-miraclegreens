import React, { useState } from 'react';
import './CooklangRecipe.css'; // Assuming you have a CSS file for styling

const CooklangRecipe = ({ recipe }) => {
  const [isJsonView, setIsJsonView] = useState(false);
  const [cuisine, setCuisine] = useState(recipe.cuisine || '');
  const [mealType, setMealType] = useState(recipe.mealType || '');

  const toggleJsonView = () => {
    setIsJsonView(!isJsonView);
  };

  return (
    <div className='cooklang-recipe'>
      <h1>{recipe.title}</h1>
      <div className='nutrition-tab'>
        <h2>Nutritional Information</h2>
        <p>Calories: {recipe.nutrition.calories}</p>
        <p>Protein: {recipe.nutrition.protein}g</p>
        <p>Fat: {recipe.nutrition.fat}g</p>
        <p>Carbohydrates: {recipe.nutrition.carbs}g</p>
      </div>
      <div className='editable-fields'>
        <input type='text' value={cuisine} onChange={(e) => setCuisine(e.target.value)} placeholder='Cuisine' />
        <input type='text' value={mealType} onChange={(e) => setMealType(e.target.value)} placeholder='Meal Type' />
      </div>
      <div className='recipe-stats'>
        <div className='stats-grid'>
          {recipe.stats.map((stat, index) => (
            <div key={index} className='stat-card'>
              <h3>{stat.name}</h3>
              <p>{stat.value}</p>
            </div>
          ))}
        </div>
      </div>
      <button onClick={toggleJsonView}>Toggle JSON View</button>
      {isJsonView && <pre>{JSON.stringify(recipe, null, 2)}</pre>}
    </div>
  );
};

export default CooklangRecipe;
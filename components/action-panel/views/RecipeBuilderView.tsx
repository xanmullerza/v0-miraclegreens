import React from 'react';
import { RecipeBuilderPanel } from '../recipe-builder-panel';

export function RecipeBuilderView({
    recipeStep, setRecipeStep, recipeTitle, setRecipeTitle,
    recipeServings, setRecipeServings, recipeType, setRecipeType, recipePrepTime, setRecipePrepTime,
    recipeCookTime, setRecipeCookTime, recipeIngredients, setRecipeIngredients,
    recipeInstructions, setRecipeInstructions, recipeImage, setRecipeImage,
    recipeSaving, handleAddInstruction,
    handleUpdateInstruction, handleRemoveInstruction, builderRef,
    recipeUploading, handleRecipeImageUpload, handleSaveRecipe
}: any) {
    return (
        <RecipeBuilderPanel
            recipeStep={recipeStep}
            setRecipeStep={setRecipeStep}
            recipeTitle={recipeTitle}
            setRecipeTitle={setRecipeTitle}
            recipeServings={recipeServings}
            setRecipeServings={setRecipeServings}
            recipeType={recipeType}
            setRecipeType={setRecipeType}
            recipePrepTime={recipePrepTime}
            setRecipePrepTime={setRecipePrepTime}
            recipeCookTime={recipeCookTime}
            setRecipeCookTime={setRecipeCookTime}
            recipeIngredients={recipeIngredients}
            setRecipeIngredients={setRecipeIngredients}
            recipeInstructions={recipeInstructions}
            setRecipeInstructions={setRecipeInstructions}
            recipeImage={recipeImage}
            setRecipeImage={setRecipeImage}
            recipeSaving={recipeSaving}
            handleAddInstruction={handleAddInstruction}
            handleUpdateInstruction={handleUpdateInstruction}
            handleRemoveInstruction={handleRemoveInstruction}
            builderRef={builderRef}
            recipeUploading={recipeUploading}
            handleRecipeImageUpload={handleRecipeImageUpload}
            handleSaveRecipe={handleSaveRecipe}
        />
    );
}

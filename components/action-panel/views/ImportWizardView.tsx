import React from 'react';
import { ImportView } from '../import-view';
import { PanelWrapper } from '../panel-wrapper';

export function ImportWizardView({
    navigateTo, isLoading, recipeLoading,
    recipeSaving, successRecipe, setSuccessRecipe,
    pastedRecipeURL, setPastedRecipeURL,
    pastedRecipeContent, setPastedRecipeContent,
    handlePasteRecipeContent, handlePasteRecipeURL,
    handleSaveAndViewRecipe, handleManualRecipeCreation,
    isDragging, setIsDragging, processRecipeImage,
    fileInputRef, isRecording, recordingTime,
    startAudioRecording, stopAudioRecording,
    videoURL, setVideoURL,
    // Recipe builder props
    recipeStep, setRecipeStep, recipeTitle, setRecipeTitle,
    recipeServings, setRecipeServings, recipePrepTime, setRecipePrepTime,
    recipeCookTime, setRecipeCookTime, recipeIngredients, setRecipeIngredients,
    recipeInstructions, setRecipeInstructions, recipeImage, setRecipeImage,
    handleAddInstruction, handleUpdateInstruction, handleRemoveInstruction, builderRef,
    recipeUploading, handleRecipeImageUpload, handleSaveRecipe, recipeType, setRecipeType
}: any) {
    return (
        <PanelWrapper title="Recipe Import" noPadding>
            <ImportView
                setActiveView={navigateTo}
                isLoading={isLoading}
                recipeLoading={recipeLoading}
                recipeSaving={recipeSaving}
                successRecipe={successRecipe}
                setSuccessRecipe={setSuccessRecipe}
                pastedRecipeURL={pastedRecipeURL}
                setpastedRecipeURL={setPastedRecipeURL}
                pastedRecipeContent={pastedRecipeContent}
                setPastedRecipeContent={setPastedRecipeContent}
                handlePasteRecipeContent={handlePasteRecipeContent}
                handlePasteRecipeURL={handlePasteRecipeURL}
                handleSaveAndViewRecipe={handleSaveAndViewRecipe}
                handleManualRecipeCreation={handleManualRecipeCreation}
                isDragging={isDragging}
                setIsDragging={setIsDragging}
                processRecipeImage={processRecipeImage}
                fileInputRef={fileInputRef}
                isRecording={isRecording}
                recordingTime={recordingTime}
                startAudioRecording={startAudioRecording}
                stopAudioRecording={stopAudioRecording}
                videoURL={videoURL}
                setVideoURL={setVideoURL}
                // Recipe builder props
                recipeStep={recipeStep}
                setRecipeStep={setRecipeStep}
                recipeTitle={recipeTitle}
                setRecipeTitle={setRecipeTitle}
                recipeServings={recipeServings}
                setRecipeServings={setRecipeServings}
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
                handleAddInstruction={handleAddInstruction}
                handleUpdateInstruction={handleUpdateInstruction}
                handleRemoveInstruction={handleRemoveInstruction}
                builderRef={builderRef}
                recipeUploading={recipeUploading}
                handleRecipeImageUpload={handleRecipeImageUpload}
                handleSaveRecipe={handleSaveRecipe}
                recipeType={recipeType}
                setRecipeType={setRecipeType}
            />
        </PanelWrapper>
    );
}

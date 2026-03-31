import React from 'react';
import { ImportView } from '../import-view';
import { PanelWrapper } from '../panel-wrapper';

export function ImportWizardView({
    onBack, navigateTo, isLoading, recipeLoading,
    recipeSaving, successRecipe, setSuccessRecipe,
    pastedRecipeURL, setPastedRecipeURL,
    pastedRecipeContent, setPastedRecipeContent,
    handlePasteRecipeContent, handlePasteRecipeURL,
    handleSaveAndViewRecipe, handleManualRecipeCreation,
    isDragging, setIsDragging, processRecipeImage,
    fileInputRef, isRecording, recordingTime,
    startAudioRecording, stopAudioRecording,
    videoURL, setVideoURL
}: any) {
    return (
        <PanelWrapper title="Recipe Import" onClose={onBack} noPadding>
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
            />
        </PanelWrapper>
    );
}

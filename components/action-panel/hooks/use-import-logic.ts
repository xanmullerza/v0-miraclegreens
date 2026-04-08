import { useState, useRef } from 'react';
import { useZumAssistant } from '@/lib/hooks/use-zum-assistant';

export function useImportLogic({
    onImportSuccess
}: {
    onImportSuccess?: (recipe: any) => Promise<void>;
}) {
    const { 
        handlePasteRecipeContent: handlePasteRecipeContentHook,
        handlePasteRecipeURL: handlePasteRecipeURLHook,
        successRecipe, setSuccessRecipe, recipeLoading, setRecipeLoading,
        processRecipeImage, startAudioRecording, stopAudioRecording,
        isRecording, recordingTime, isLoading, setIsLoading
    } = useZumAssistant();

    const [isCreatingRecipe, setIsCreatingRecipe] = useState(false);
    const [pastedRecipeContent, setPastedRecipeContent] = useState('');
    const [pastedRecipeURL, setPastedRecipeURL] = useState('');
    const [videoURL, setVideoURL] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handlePasteRecipeContent = async (setMessages: (fn: any) => void) => {
        if (!pastedRecipeContent.trim()) return;

        setMessages((prev: any) => [...prev, { id: Date.now().toString(), type: 'user', content: `📝 Pasted recipe content`, timestamp: new Date() }]);
        setIsLoading(true);

        try {
            await handlePasteRecipeContentHook(pastedRecipeContent);
            setIsCreatingRecipe(false);
            setPastedRecipeContent('');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setMessages((prev: any) => [...prev, { id: (Date.now() + 1).toString(), type: 'bot', content: `❌ Sorry, I encountered an error: ${errorMessage}`, timestamp: new Date() }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasteRecipeURL = async (setMessages: (fn: any) => void) => {
        if (!pastedRecipeURL.trim()) return;

        setMessages((prev: any) => [...prev, { id: Date.now().toString(), type: 'user', content: `🔗 Pasted recipe URL`, timestamp: new Date() }]);
        setIsLoading(true);

        try {
            await handlePasteRecipeURLHook(pastedRecipeURL);
            setIsCreatingRecipe(false);
            setPastedRecipeURL('');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setMessages((prev: any) => [...prev, { id: (Date.now() + 1).toString(), type: 'bot', content: `❌ Sorry, I encountered an error: ${errorMessage}`, timestamp: new Date() }]);
        } finally {
            setIsLoading(false);
        }
    };

    const resetImporter = () => {
        setIsCreatingRecipe(false);
        setPastedRecipeContent('');
        setPastedRecipeURL('');
        setVideoURL('');
        setSuccessRecipe(null);
        setIsDragging(false);
    };

    return {
        isCreatingRecipe, setIsCreatingRecipe,
        pastedRecipeContent, setPastedRecipeContent,
        pastedRecipeURL, setPastedRecipeURL,
        videoURL, setVideoURL,
        isDragging, setIsDragging,
        fileInputRef,
        successRecipe, setSuccessRecipe,
        recipeLoading, setRecipeLoading,
        isLoading, setIsLoading,
        isRecording, recordingTime,
        startAudioRecording, stopAudioRecording,
        processRecipeImage,
        handlePasteRecipeContent,
        handlePasteRecipeURL,
        resetImporter
    };
}

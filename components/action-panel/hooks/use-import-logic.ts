import { useState, useRef } from 'react';
import { useZumAssistant } from '@/lib/hooks/use-zum-assistant';
import { toast } from 'sonner';
import { parseCooklang } from '@/lib/utils/recipe-parser';

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
        isRecording, recordingTime, isLoading, setIsLoading,
        messages, setMessages
    } = useZumAssistant();

    const [isCreatingRecipe, setIsCreatingRecipe] = useState(false);
    const [pastedRecipeContent, setPastedRecipeContent] = useState('');
    const [pastedRecipeURL, setPastedRecipeURL] = useState('');
    const [cooklangText, setCooklangText] = useState('');
    const [videoURL, setVideoURL] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handlePasteRecipeContent = async (setMessages: (fn: any) => void) => {
        if (!pastedRecipeContent.trim()) return;

        setMessages((prev: any) => [...prev, { id: Date.now().toString(), type: 'user', content: `📝 Pasted recipe content`, timestamp: new Date() }]);
        setIsLoading(true);
        setRecipeLoading(true);

        try {
            await handlePasteRecipeContentHook(pastedRecipeContent);
            setIsCreatingRecipe(false);
            setPastedRecipeContent('');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setMessages((prev: any) => [...prev, { id: (Date.now() + 1).toString(), type: 'bot', content: `❌ Sorry, I encountered an error: ${errorMessage}`, timestamp: new Date() }]);
        } finally {
            setIsLoading(false);
            setRecipeLoading(false);
        }
    };

    const handlePasteRecipeURL = async (setMessages: (fn: any) => void) => {
        if (!pastedRecipeURL.trim()) return;

        setMessages((prev: any) => [...prev, { id: Date.now().toString(), type: 'user', content: `🔗 Pasted recipe URL`, timestamp: new Date() }]);
        setIsLoading(true);
        setRecipeLoading(true);

        try {
            await handlePasteRecipeURLHook(pastedRecipeURL);
            setIsCreatingRecipe(false);
            setPastedRecipeURL('');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setMessages((prev: any) => [...prev, { id: (Date.now() + 1).toString(), type: 'bot', content: `❌ Sorry, I encountered an error: ${errorMessage}`, timestamp: new Date() }]);
        } finally {
            setIsLoading(false);
            setRecipeLoading(false);
        }
    };

    const handleImportCooklangContent = async () => {
        if (!cooklangText.trim()) return;

        setMessages((prev: any) => [...prev, { id: Date.now().toString(), type: 'user', content: `📄 Pasted Cooklang content`, timestamp: new Date() }]);
        setIsLoading(true);
        setRecipeLoading(true);

        try {
            const recipe = parseCooklang(cooklangText);
            setSuccessRecipe(recipe);
            setMessages((prev: any) => [...prev, { id: (Date.now() + 1).toString(), type: 'bot', content: `✅ Successfully parsed "${recipe.title}" from Cooklang.`, timestamp: new Date(), recipeData: recipe }]);
            setCooklangText('');
            return recipe;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setMessages((prev: any) => [...prev, { id: (Date.now() + 1).toString(), type: 'bot', content: `❌ Could not parse Cooklang content: ${errorMessage}`, timestamp: new Date() }]);
            throw error;
        } finally {
            setIsLoading(false);
            setRecipeLoading(false);
        }
    };

    const handleCooklangFileUpload = async (file: File) => {
        if (!file) return;

        setIsLoading(true);
        setRecipeLoading(true);

        try {
            const recipeContent = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = () => reject(reader.error);
                reader.readAsText(file);
            });

            const recipe = parseCooklang(recipeContent);
            setSuccessRecipe(recipe);
            setMessages((prev: any) => [...prev, { id: (Date.now() + 1).toString(), type: 'bot', content: `✅ Successfully parsed "${recipe.title}" from ${file.name}.`, timestamp: new Date(), recipeData: recipe }]);
            return recipe;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            toast.error(`Failed to parse Cooklang file: ${errorMessage}`);
            throw error;
        } finally {
            setIsLoading(false);
            setRecipeLoading(false);
        }
    };

    const resetImporter = () => {
        setIsCreatingRecipe(false);
        setPastedRecipeContent('');
        setPastedRecipeURL('');
        setCooklangText('');
        setVideoURL('');
        setSuccessRecipe(null);
        setIsDragging(false);
    };

    return {
        isCreatingRecipe, setIsCreatingRecipe,
        pastedRecipeContent, setPastedRecipeContent,
        pastedRecipeURL, setPastedRecipeURL,
        cooklangText, setCooklangText,
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
        handleImportCooklangContent,
        handleCooklangFileUpload,
        resetImporter
    };
}

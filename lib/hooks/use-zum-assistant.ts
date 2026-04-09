'use client';

import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

import { ParsedRecipe } from '@/types/recipe';

export interface Message {
    id: string;
    type: 'user' | 'bot';
    content: string;
    timestamp: Date;
    recipeData?: ParsedRecipe;
}

const INITIAL_MESSAGES: Message[] = [
    {
        id: '1',
        type: 'bot',
        content: "Hi! I'm Zum, your AI nutrition assistant. How can I help you today? I can analyze recipes, help with meal planning, or answer nutrition questions. I can also add recipes from URLs! Just share a recipe link.",
        timestamp: new Date(),
    }
];

export function useZumAssistant() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [recipeLoading, setRecipeLoading] = useState(false);
    const [successRecipe, setSuccessRecipe] = useState<ParsedRecipe | null>(null);
    const [input, setInput] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [conversationHistory, setConversationHistory] = useState<any[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    const MediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const getWebhookUrl = () => {
        const url = process.env.NEXT_PUBLIC_N8N_CRONOMETER_WEBHOOK_URL;
        if (!url) {
            toast.error('Assistant service is unset. Check environment variables.');
            return null;
        }
        return url;
    };

    // Initialize messages from local storage or default
    useEffect(() => {
        const savedMessages = localStorage.getItem('chatbot-messages');
        if (savedMessages) {
            try {
                const parsed = JSON.parse(savedMessages);
                setMessages(parsed.map((m: any) => ({
                    ...m,
                    timestamp: new Date(m.timestamp)
                })));
            } catch (e) {
                setMessages(INITIAL_MESSAGES);
            }
        } else {
            setMessages(INITIAL_MESSAGES);
        }
    }, []);

    // Save messages to local storage
    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem('chatbot-messages', JSON.stringify(messages));
        }
    }, [messages]);

    const handleSend = async (customMessage?: string) => {
        const messageText = customMessage || input;
        if (!messageText.trim()) return;

        // URL detection
        const urlRegex = /(https?:\/\/[^\s]+)/gi;
        const match = messageText.match(urlRegex);
        const detectedUrl = match ? match[0] : null;

        if (detectedUrl && !customMessage) {
            // If it's a URL, use the special handler
            await handlePasteRecipeURL(detectedUrl);
            setInput('');
            return;
        }

        const userMessage: Message = {
            id: Date.now().toString(),
            type: 'user',
            content: messageText,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        if (!customMessage) setInput('');
        setIsLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            const userId = user?.id || 'anonymous';

            const webhookUrl = getWebhookUrl();
            if (!webhookUrl) throw new Error('Unconfigured');

            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: messageText,
                    userId: userId,
                    contentType: 'text'
                })
            });

            if (!response.ok) throw new Error(`API error: ${response.status}`);

            const data = await response.json();

            let botResponse = data.output || data.response || data.content || data.message || (typeof data === 'string' ? data : JSON.stringify(data));

            const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                type: 'bot',
                content: botResponse,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error('Error calling n8n webhook:', error);
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                type: 'bot',
                content: 'Sorry, I encountered an error. Please try again.',
                timestamp: new Date(),
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const startAudioRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            audioChunksRef.current = [];
            mediaRecorder.ondataavailable = (event) => audioChunksRef.current.push(event.data);
            mediaRecorder.onstop = () => stream.getTracks().forEach(track => track.stop());
            MediaRecorderRef.current = mediaRecorder;
            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            recordingIntervalRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
        } catch (error) {
            console.error('Error accessing microphone:', error);
            toast.error('Cannot access microphone.');
        }
    };

    const stopAudioRecording = async () => {
        if (!MediaRecorderRef.current) return;
        setIsRecording(false);
        if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
        MediaRecorderRef.current.stop();

        setTimeout(async () => {
            if (audioChunksRef.current.length > 0) {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                await handleAudioUpload(audioBlob);
            }
        }, 100);
    };

    const handleAudioUpload = async (audioBlob: Blob) => {
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            type: 'user',
            content: `🎤 Sent audio message`,
            timestamp: new Date(),
        }]);
        setIsLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            const formData = new FormData();
            formData.append('file', audioBlob, 'audio.webm');
            formData.append('userId', user?.id || 'anonymous');
            formData.append('contentType', 'audio');

            const webhookUrl = getWebhookUrl();
            if (!webhookUrl) throw new Error('Unconfigured');

            const response = await fetch(webhookUrl, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error(`API error: ${response.status}`);
            const data = await response.json();
            let transcribedText = data.responseText || data.output || data.response || data.content || data.message || '';

            if (!transcribedText) throw new Error('No transcription received');

            setMessages(prev => [...prev.slice(0, -1), {
                id: Date.now().toString(),
                type: 'user',
                content: transcribedText,
                timestamp: new Date(),
            }]);

            await handleSend(transcribedText);
        } catch (error) {
            console.error('Error processing audio:', error);
            setMessages(prev => [...prev.slice(0, -1), {
                id: (Date.now() + 1).toString(),
                type: 'bot',
                content: 'Sorry, I encountered an error transcribing your audio.',
                timestamp: new Date(),
            }]);
        } finally {
            setIsLoading(false);
            setRecordingTime(0);
        }
    };

    const processRecipeImage = async (file: File) => {
        if (!file) return;
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            type: 'user',
            content: `📷 Uploaded image: ${file.name}`,
            timestamp: new Date(),
        }]);
        setIsLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            const formData = new FormData();
            formData.append('file', file);
            formData.append('message', `Analyze this image: ${file.name}`);
            formData.append('userId', user?.id || 'anonymous');
            formData.append('contentType', 'image');

            const webhookUrl = getWebhookUrl();
            if (!webhookUrl) throw new Error('Unconfigured');

            const response = await fetch(webhookUrl, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error(`API error: ${response.status}`);
            const responseText = await response.text();
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                setMessages(prev => [...prev, {
                    id: (Date.now() + 1).toString(),
                    type: 'bot',
                    content: "❌ I could not extract a recipe from this image.",
                    timestamp: new Date(),
                }]);
                return;
            }

            if (Array.isArray(data) && data.length > 0) data = data[0];
            if (typeof data === 'object' && data.isRecipe !== false) {
                const recipeData: ParsedRecipe = {
                    title: data.title || 'Untitled Recipe',
                    ingredients_text: data.ingredients_text || '',
                    instructions_text: data.instructions_text || '',
                    servings: data.servings || 4,
                    prep_time: data.prep_time || 30,
                    cook_time: data.cook_time || 0,
                    source_url: 'image-upload',
                    image_url: data.image_url || data.image || undefined,
                    image: data.image || data.image_url || undefined,
                    type: data.type || data.meal_type || 'dinner',
                    meal_type: data.meal_type || undefined,
                };
                setSuccessRecipe(recipeData);
                setMessages(prev => [...prev, {
                    id: (Date.now() + 1).toString(),
                    type: 'bot',
                    content: `✅ I've extracted "${recipeData.title}" from your image!`,
                    timestamp: new Date(),
                    recipeData,
                }]);
                return recipeData;
            }
        } catch (error) {
            console.error('Error processing recipe image:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasteRecipeContent = async (content: string) => {
        if (!content.trim()) return;
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            type: 'user',
            content: `📝 Pasted recipe content`,
            timestamp: new Date(),
        }]);
        setIsLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            const webhookUrl = getWebhookUrl();
            if (!webhookUrl) throw new Error('Unconfigured');

            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: content, userId: user?.id || 'anonymous', contentType: 'recipe-content' })
            });

            if (!response.ok) throw new Error(`API error: ${response.status}`);
            const data = await response.json();
            const recipe = data.recipe || data.data;
            if (recipe && recipe.title) {
                const recipeData: ParsedRecipe = {
                    title: recipe.title,
                    ingredients_text: recipe.ingredients_text || recipe.ingredients || '',
                    instructions_text: recipe.instructions_text || recipe.instructions || '',
                    servings: recipe.servings || 4,
                    prep_time: recipe.prep_time || 30,
                    cook_time: recipe.cook_time || 0,
                    source_url: 'pasted-content',
                    image_url: recipe.image_url || recipe.image || undefined,
                    image: recipe.image || recipe.image_url || undefined,
                    type: recipe.type || recipe.meal_type || 'dinner',
                    meal_type: recipe.meal_type || undefined,
                };
                setSuccessRecipe(recipeData);
                setMessages(prev => [...prev, {
                    id: (Date.now() + 1).toString(),
                    type: 'bot',
                    content: `✅ Successfully parsed "${recipeData.title}"!`,
                    timestamp: new Date(),
                    recipeData,
                }]);
                return recipeData;
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasteRecipeURL = async (url: string) => {
        if (!url.trim()) return;
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            type: 'user',
            content: `🔗 Pasted recipe URL`,
            timestamp: new Date(),
        }]);
        setIsLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            const webhookUrl = getWebhookUrl();
            if (!webhookUrl) throw new Error('Unconfigured');

            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: url, userId: user?.id || 'anonymous', contentType: 'recipe-url' })
            });

            const data = await response.json();
            const recipe = data.recipe || data.data;
            if (recipe && recipe.title) {
                const recipeData: ParsedRecipe = {
                    title: recipe.title,
                    ingredients_text: recipe.ingredients_text || recipe.ingredients || '',
                    instructions_text: recipe.instructions_text || recipe.instructions || '',
                    servings: recipe.servings || 4,
                    prep_time: recipe.prep_time || 30,
                    cook_time: recipe.cook_time || 0,
                    source_url: url,
                    image_url: recipe.image_url || recipe.image || undefined,
                    image: recipe.image || recipe.image_url || undefined,
                    type: recipe.type || recipe.meal_type || 'dinner',
                    meal_type: recipe.meal_type || undefined,
                };
                setSuccessRecipe(recipeData);
                setMessages(prev => [...prev, {
                    id: (Date.now() + 1).toString(),
                    type: 'bot',
                    content: `✅ Imported "${recipeData.title}"!`,
                    timestamp: new Date(),
                    recipeData,
                }]);
                return recipeData;
            }
        } finally {
            setIsLoading(false);
        }
    };

    const saveCurrentConversation = async () => {
        if (messages.length <= INITIAL_MESSAGES.length) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        try {
            await supabase.from('chatbot_conversations').insert({
                title: `Conversation - ${new Date().toLocaleDateString()}`,
                messages: messages.map(m => ({ type: m.type, content: m.content, timestamp: m.timestamp })),
                created_at: new Date().toISOString(),
            });
        } catch (e) {
            console.error('Failed to save conversation:', e);
        }
    };

    const loadHistory = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setIsLoadingHistory(true);
        try {
            const { data } = await supabase
                .from('chatbot_conversations')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);
            setConversationHistory(data || []);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const startNewConversation = () => {
        saveCurrentConversation();
        setMessages(INITIAL_MESSAGES);
        setSuccessRecipe(null);
        localStorage.removeItem('chatbot-messages');
    };

    return {
        messages, setMessages, isLoading, setIsLoading, input, setInput,
        handleSend, isRecording, recordingTime, startAudioRecording, stopAudioRecording,
        processRecipeImage, handlePasteRecipeContent, handlePasteRecipeURL,
        successRecipe, setSuccessRecipe, recipeLoading, setRecipeLoading,
        conversationHistory, isLoadingHistory, loadHistory, startNewConversation,
        saveCurrentConversation
    };
}

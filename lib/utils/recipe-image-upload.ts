/**
 * Utility functions for handling recipe images from URLs
 */

import { supabase } from '@/lib/supabase';

/**
 * Download an image from a URL and upload it to Supabase storage
 * @param imageUrl - URL of the image to download
 * @param recipeTitle - Title of the recipe (used for filename)
 * @returns Public URL of the uploaded image, or null if failed
 */
export async function downloadAndUploadRecipeImage(
    imageUrl: string,
    recipeTitle: string
): Promise<string | null> {
    try {
        // Validate URL
        if (!imageUrl || !imageUrl.startsWith('http')) {
            console.warn('Invalid image URL:', imageUrl);
            return null;
        }

        // Fetch the image
        const response = await fetch(imageUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; BookoFood/1.0)'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status}`);
        }

        // Get the image blob
        const blob = await response.blob();

        // Validate it's actually an image
        if (!blob.type.startsWith('image/')) {
            throw new Error('Downloaded file is not an image');
        }

        // Create a filename
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 9);
        const extension = blob.type.split('/')[1] || 'jpg';
        const fileName = `recipe-${timestamp}-${random}.${extension}`;

        // Upload to Supabase
        const { data, error: uploadError } = await supabase.storage
            .from('recipes')
            .upload(fileName, blob, {
                cacheControl: '3600',
                upsert: false,
                contentType: blob.type
            });

        if (uploadError) {
            console.error('Supabase upload error:', uploadError);
            return null;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('recipes')
            .getPublicUrl(fileName);

        return publicUrl;
    } catch (error) {
        console.error('Error downloading/uploading recipe image:', error);
        return null;
    }
}

/**
 * Convert image blob to data URL (for preview before upload)
 * @param blob - Image blob
 * @returns Promise that resolves to data URL string
 */
export async function blobToDataURL(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

/**
 * Fetch an image as a blob from a URL (with CORS handling)
 * @param imageUrl - URL of the image
 * @returns Promise that resolves to the image blob
 */
export async function fetchImageBlob(imageUrl: string): Promise<Blob> {
    try {
        const response = await fetch(imageUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; BookoFood/1.0)'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status}`);
        }

        return await response.blob();
    } catch (error) {
        console.error('Error fetching image blob:', error);
        throw error;
    }
}

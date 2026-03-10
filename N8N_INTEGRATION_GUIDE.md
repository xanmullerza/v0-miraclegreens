# n8n Multimodal Workflow Integration Guide

## Overview
This document explains how to integrate the multimodal n8n workflow into your Vitala Greens application. The workflow handles:
- **Text inputs** - Direct messaging
- **Audio inputs** - Speech-to-text transcription via Groq Whisper
- **Image inputs** - Vision analysis via Groq Llava

## Setup Instructions

### 1. Environment Variables
Add the following environment variable to your `.env.local` file:

```
GROQ_API_KEY=your_groq_api_key_here
```

To get a Groq API key:
1. Visit [console.groq.com](https://console.groq.com)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy and paste it into your `.env.local`

### 2. n8n Workflow Setup
The workflow file is located at: `Privvy/multimodal.json`

**Key Configuration:**
- **Webhook URL**: `https://vitalagreens.app.n8n.cloud/webhook/chat`
- **Webhook Path**: `/chat`
- **Response Mode**: Response Node (synchronous)

### 3. Import the Workflow
1. Go to your n8n instance at `https://vitalagreens.app.n8n.cloud`
2. Click "Create" → "Import workflow"
3. Upload or paste the contents of `Privvy/multimodal.json`
4. The workflow will auto-map the Groq credential from your environment variables

### 4. Workflow Components

#### Content Type Router
Routes incoming requests based on content type:
- **audio**: Triggers audio transcription
- **image**: Triggers image analysis  
- **text** (default): Direct text processing

#### Text Processing Flow
```
Webhook → Content Type Router → Format Text → AI Agent → Respond
                                                ↓
                                         Groq Chat Model
                                             ↓
                                         Simple Memory
```

#### Audio Processing Flow
```
Webhook → Content Type Router → Process Audio → Audio Transcription → Format Response → Respond
                                                     ↓
                                              Groq Whisper Model
```

#### Image Processing Flow
```
Webhook → Content Type Router → Process Image → Image to Base64 → HTTP Request GROQ LLAVA1 → Format Text1 → Respond
```

### 5. API Integration in Your App

To call the webhook from your Next.js app:

```typescript
// Text message
const response = await fetch('https://vitalagreens.app.n8n.cloud/webhook/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Your message here',
    userId: 'user-id-123',
    contentType: 'text'
  })
});

// Audio (FormData)
const formData = new FormData();
formData.append('file', audioBlob, 'audio.webm');
formData.append('userId', 'user-id-123');
formData.append('contentType', 'audio');

const response = await fetch('https://vitalagreens.app.n8n.cloud/webhook/chat', {
  method: 'POST',
  body: formData
});

// Image (FormData)
const formData = new FormData();
formData.append('file', imageBlob, 'image.jpg');
formData.append('message', 'What is in this image?');
formData.append('userId', 'user-id-123');
formData.append('contentType', 'image');

const response = await fetch('https://vitalagreens.app.n8n.cloud/webhook/chat', {
  method: 'POST',
  body: formData
});
```

### 6. Models Used

- **Text/General**: `meta-llama/llama-4-maverick-17b-128e-instruct`
- **Vision**: `llama-3.2-90b-vision-preview`
- **Audio Transcription**: `whisper-large-v3-turbo`

### 7. AI Assistant Configuration

The assistant is configured as **Zum**, a child-friendly assistant with these characteristics:
- Bilingual (English & Afrikaans)
- Explains concepts in ELI5 (Explain Like I'm 5) manner
- No NSFW content
- Default language is English

To modify the personality, edit the "AI Agent" node's system message in the workflow.

### 8. Memory Management

Session memory is tracked per `userId`, allowing the AI to remember conversation context within a session.

## Troubleshooting

### API Key Issues
- Verify `GROQ_API_KEY` is set in your n8n environment variables
- Check that the API key has not exceeded rate limits
- Ensure the API key has proper permissions for all three APIs (chat, vision, transcription)

### Webhook Issues
- Confirm webhook URL is accessible
- Check n8n instance is running and responding
- Verify POST requests include proper content-type headers

### Audio Processing
- Ensure audio files are in supported formats (WebM recommended)
- Check file size is within Groq's limits
- Verify the multipart-form-data encoding is correct

### Image Processing
- Images should be JPEG or PNG
- Maximum recommended size: 5MB
- Base64 encoding is handled automatically

## Security Notes
- Never commit `.env` files with API keys to version control
- Use environment variables for all sensitive data
- Consider implementing rate limiting for the webhook
- Add authentication headers to webhook calls if needed

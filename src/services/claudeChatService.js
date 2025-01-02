import fetch, { Headers } from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const ERROR_DEFAULT = 'Sorry, I am unable to process your request right now. Please try again later.'
const claudeApiKey = process.env.CLAUDE_API_KEY
const claudeMaxTokens = 1024
const claudeAnthropicVersion = '2023-06-01'

const claudeApiModels = {
    claudeSonnet: { model: 'claude-3-5-sonnet-latest' },
    claudeOpus: { model: 'claude-3-opus-latest' },
}

const streamGenerateContent = async (message, socket, attachments) => {
    const url = `https://api.anthropic.com/v1/messages`
    const headers = new Headers({
        'Content-Type': 'application/json',
        'x-api-key': claudeApiKey,
        'anthropic-version': claudeAnthropicVersion,
    });

    const messages = [{
        role: 'user',
        content: [
            { type: 'text', text: message }
        ]
    }];

    if (attachments && attachments.length > 0) {
        for (const attachment of attachments) {
            if (attachment.type.startsWith('image/') || attachment.type === 'application/pdf') {
                messages[0].content.push({
                    type: 'image',
                    source: {
                        type: 'base64',
                        media_type: attachment.type,
                        data: attachment.content.toString('base64')
                    }
                });
            } else {
                messages[0].content.push({
                    type: 'text',
                    text: `File content (${attachment.type}):\n${attachment.content.toString('utf-8')}`
                });
            }
        }
    }

    const data = {
        model: claudeApiModels.claudeSonnet.model,
        messages,
        max_tokens: claudeMaxTokens,
        stream: true,
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`API response: ${errorText}`);
            throw new Error(`API request failed with status ${response.status}`);
        }

        let buffer = '';
        response.body.on('data', (chunk) => {
            buffer += chunk.toString();
            const lines = buffer.split('\n');
            buffer = lines.pop(); // Keep the last incomplete line in the buffer

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const jsonData = line.slice(6).trim(); // Remove 'data: ' prefix
                    if (jsonData === '[DONE]') return;

                    try {
                        const parsedData = JSON.parse(jsonData);
                        if (parsedData.type === 'content_block_delta') {
                            console.log(`text: ${parsedData.delta.text}`)
                            socket.emit('claude-message', formatText(parsedData.delta.text) || '');
                        }
                    } catch (e) {
                        console.error('Error parsing JSON:', e);
                    }
                }
            }
        });

        // Process any remaining data in the buffer
        if (buffer) {
            const jsonData = buffer.slice(6).trim();
            if (jsonData && jsonData !== '[DONE]') {
                try {
                    const parsedData = JSON.parse(jsonData);
                    if (parsedData.type === 'content_block_delta') {
                        socket.emit('claude-message', formatText(parsedData.delta.text) || '');
                    }
                } catch (e) {
                    console.error('Error parsing JSON:', e);
                }
            }
        }
    } catch (error) {
        console.error('Error generating Claude response:', error);
        throw new Error(ERROR_DEFAULT);
    }
}

const formatText = (text) => {
    return text.replace(/\n/g, '<br />');
}

export { streamGenerateContent }
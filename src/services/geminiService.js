import fetch, { Headers } from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const ERROR_DEFAULT = 'Sorry, I am unable to process your request right now. Please try again later.'
const geminiApiKey = process.env.GEMINI_API_KEY

const geminiModels = {
  geminiFlash: { model: 'gemini-1.5-flash', temperature: 0.6 },
};

const streamGenerateContent = async (prompt, socket, attachments) => {
  const model = geminiModels.geminiFlash;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model.model}:streamGenerateContent?alt=sse&key=${geminiApiKey}`;

  const headers = new Headers({
    'Content-Type': 'application/json',
  });

  const parts = [{ text: prompt }];

  if (attachments && attachments.length > 0) {
    for (const attachment of attachments) {
      parts.push({
        inlineData: {
          mimeType: attachment.type,
          data: attachment.content.toString('base64')
        }
      });
    }
  }

  const data = {
    contents: [{ parts }],
    generationConfig: {
      temperature: 0.6, // 0.2-0.5 more focused and predictable response, higher generates more diverse and creative outputs
      topK: 4,
      topP: 0.8,
      maxOutputTokens: 8192, // the higher the value the longer the response
      responseMimeType: "text/plain"
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }

    // Listen for the streamed data chunks
    response.body.on('data', (chunk) => {
      const chunkText = chunk.toString();
      console.log('Chunk received:', chunkText);

      if (chunkText.startsWith('data: ')) {
        const jsonData = chunkText.replace('data: ', '');
        try {
          const parsedData = JSON.parse(jsonData);
          // Extract the actual content you want to emit
          const content = parsedData.candidates[0].content.parts[0].text;
          socket.emit('gemini-message', formatText(content));
        } catch (error) {
          console.error('Failed to parse chunk:', error);
        }
      }
    });

    response.body.on('end', () => {
      console.log('Stream finished.');
      socket.emit('ai-response-end', 'Stream finished.');
    });
  } catch (error) {
    console.error('Error:', error.message || error);
  }
}

const formatText = (text) => {
  return text.replace(/\n/g, '<br />');
}

export { streamGenerateContent };
import fetch, { Headers } from 'node-fetch'
import dotenv from 'dotenv'
import OpenAI from 'openai'

dotenv.config();

const ERROR_DEFAULT = 'Sorry, I am unable to process your request right now. Please try again later.'
const openaiApiKey = process.env.OPENAI_API_KEY
const openaiMaxTokens = 500

const openaiApiModels = {
  gpt35Turbo: { model: 'gpt-3.5-turbo' },
  gpt40: { model: 'gpt-4' },
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

const streamGenerateContent = async (message, socket, attachments) => {

  const url = `https://api.openai.com/v1/chat/completions`
  const headers = new Headers({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${openaiApiKey}`,
  });

  const messages = [{
    role: 'user',
    content: []
  }]

  messages[0].content.push({ type: 'text', text: message })

  if (attachments && attachments.length > 0) {
    for (const attachment of attachments) {
      if (attachment.type.startsWith('image/')) {
        messages[0].content.push({
          type: 'image_url',
          image_url: {
            url: `data:${attachment.type};base64,${attachment.content.toString('base64')}`
          }
        })
      } else {
        messages[0].content.push({
          type: 'text',
          text: `File content (${attachment.type}):\n${attachment.content.toString('utf-8')}`
        })
      }
    }
  }

  try {
    const stream = await openai.chat.completions.create({
      model: openaiApiModels.gpt40.model,
      messages: messages,
      max_tokens: openaiMaxTokens,
      stream: true
    })

    console.log(`stream: ${JSON.stringify(stream)}`)

    for await (const chunk of stream) {
      if (chunk.choices[0]?.delta?.content) {
        const content = chunk.choices[0].delta.content
        socket.emit('openai-message', formatText(content))
      }
    }

    socket.emit('ai-response-end', 'Stream finished.')
  } catch (error) {
    console.error('Error generating OpenAI response:', error);
    socket.emit('openai-message', ERROR_DEFAULT)
  }
}

const formatText = (text) => {
  return text.replace(/\n/g, '<br />');
}

export { streamGenerateContent }
import fetch from 'node-fetch'
import dotenv from 'dotenv'

dotenv.config()

const ERROR_DEFAULT = 'Sorry, I am unable to process your request right now. Please try again later.'
const perplexityApiKey = process.env.PERPLEXITY_API_KEY
const perplexityMaxTokens = 1024

const perplexityApiModels = {
    llamasmall: { model: 'llama-3.1-sonar-small-128k-online' },
    llamalarge: { model: 'llama-3.1-sonar-large-128k-online' },
    llamahuge: { model: 'llama-3.1-sonar-huge-128k-online' },
    sonarpro: { model: 'sonar-pro '},
}

const streamGenerateContent = async (message, socket, attachments) => {
    const url = 'https://api.perplexity.ai/chat/completions'
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${perplexityApiKey}`
    }

    const messages = [{ role: 'user', content: message }]

    if (attachments && attachments.length > 0) {
        for (const attachment of attachments) {
            if (attachment.type.startsWith('image/')) {
                messages.push({
                    role: 'user',
                    content: [{
                        type: 'image',
                        image_url: {
                            url: `data:${attachment.type};base64,${attachment.content.toString('base64')}`
                        }
                    }]
                })
            } else {
                // For non-image files, we'll add them as text
                messages.push({
                    role: 'user',
                    content: `File content (${attachment.type}):\n${attachment.content.toString('utf-8')}`
                })
            }
        }
    }

    const data = {
        model: perplexityApiModels.sonarpro.model,
        messages,
        max_tokens: perplexityMaxTokens,
        stream: true
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(data)
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error(`API response: ${errorText}`)
            throw new Error(`API request failed with status ${response.status}`)
        }

        let buffer = ''
        response.body.on('data', (chunk) => {
            buffer += chunk.toString()
            const lines = buffer.split('\n')
            buffer = lines.pop()

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const jsonData = line.slice(5).trim()
                    if (jsonData === '[DONE]') return

                    try {
                        const parsedData = JSON.parse(jsonData)
                        if (parsedData.choices && parsedData.choices[0].delta && parsedData.choices[0].delta.content) {
                            const content = parsedData.choices[0].delta.content
                            socket.emit('perplexity-message', formatText(content))
                        }
                    } catch (e) {
                        console.error('Error parsing JSON:', e)
                    }
                }
            }
        })

        response.body.on('end', () => {
            if (buffer) {
                const jsonData = buffer.trim()
                if (jsonData && jsonData !== '[DONE]') {
                    try {
                        const parsedData = JSON.parse(jsonData)
                        if (parsedData.choices && parsedData.choices[0].delta && parsedData.choices[0].delta.content) {
                            const content = parsedData.choices[0].delta.content
                            socket.emit('perplexity-message', formatText(content))
                        }
                    } catch (e) {
                        console.error('Error parsing JSON:', e)
                    }
                }
            }
            socket.emit('ai-response-end', 'Stream finished.')
        })
    } catch (error) {
        console.error('Error generating Perplexity AI response:', error)
        socket.emit('perplexity-message', ERROR_DEFAULT)
    }
}

const formatText = (text) => {
    return text.replace(/\n/g, '<br />')
}

export { streamGenerateContent }

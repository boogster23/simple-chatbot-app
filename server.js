import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import dotenv from 'dotenv'
import { streamGenerateContent as generateGeminiContent } from './src/services/geminiService.js'
import { streamGenerateContent as generateClaudeContent } from './src/services/claudeChatService.js'
import { streamGenerateContent as generatePerplexityContent } from './src/services/perplexityService.js'

// Load environment variables from .env file
dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
  },
  maxHttpBufferSize: 20 * 1024 * 1024,
  pingTimeout: 120000,
  pingInterval: 60000
})

const processAttachments = (attachments) => {
  if (!attachments || attachments.length === 0) {
    return null;
  }
  return attachments.map(att => {
    if (!att || !att.content) {
      console.error('Invalid attachment:', att);
      return null;
    }
    return {
      ...att,
      content: Buffer.from(att.content, 'base64')
    };
  }).filter(Boolean); // Remove any null entries
}

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)

  socket.on('gemini-message', async (data) => {
    const { text, attachments } = data
    const processedAttachments = processAttachments(attachments)
    await generateGeminiContent(text, socket, processedAttachments)
  });

  socket.on('claude-message', async (data) => {
    const { text, attachments } = data
    const processedAttachments = processAttachments(attachments)
    await generateClaudeContent(text, socket, processedAttachments)
  });

  socket.on('perplexity-message', async (data) => {
    const { text, attachments } = data
    const processedAttachments = processAttachments(attachments)
    await generatePerplexityContent(text, socket, processedAttachments)
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
  });
});

server.listen(process.env.API_PORT, () => {
  console.log('Server listening on port 3003')
});
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
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)

  socket.on('gemini-message', async (message) => {
    await generateGeminiContent(message, socket)
  });

  socket.on('claude-message', async (message) => {
    await generateClaudeContent(message, socket)
  });

  socket.on('perplexity-message', async (message) => {
    await generatePerplexityContent(message, socket)
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
  });
});

server.listen(process.env.API_PORT, () => {
  console.log('Server listening on port 3003')
});
# simple-chatbot-app

A Vue 3 chatbot application that integrates with different AI Models using direct API url calls except for OpenAI.  
Currently supports OpenAI, Gemini, Perplexity and Claude AI models.  

Attachment support for OpenAI and Perplexity is still in progress... 

## Project setup

1. Clone the repository
2. Install dependencies:
```
npm install
```
3. Set up environment variables:
Create a `.env` file in the root directory and add the following:

```
# NODE API Variables
API_PORT=3003 #or whatever port number you want
GEMINI_API_KEY=your_gemini_api_key_here
CLAUDE_API_KEY=your_claude_api_key_here

# VUE Front-end Variables
VITE_API_URL='http://localhost:3003' #port number you set up for API_PORT
```

- For OpenAI API Key, visit [OpenAI](https://help.openai.com/en/articles/4936850-where-do-i-find-my-openai-api-key)
- For Perplexity API Key, visit [Perplexity AI](https://www.perplexity.ai/hub/faq/pplx-api)
- For Gemini API key, visit [Google AI Studio](https://makersuite.google.com/app/apikey)
- For Claude API key, sign up at [Anthropic](https://www.anthropic.com) or [Claude AI](https://claude.ai)

### Start the Node.js server
Run the backend server:
```
npm start
```

### Run the Vue.js frontend
Start the development server with hot-reload:
```
npm run dev
```

For full functionality, make sure both the Node.js server and the Vue.js frontend are running simultaneously.

## Additional Information

- This project was bootstrapped using [Bolt](https://bolt.new), a tool for quickly creating front-end applications.
- The frontend is built with Vue 3 and uses Vite as the build tool.

## Customize configuration
See [Vite Configuration Reference](https://vitejs.dev/config/).

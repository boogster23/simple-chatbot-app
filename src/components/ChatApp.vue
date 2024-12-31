<template>
    <div class="min-h-screen bg-gray-100 flex flex-col">
        <div class="bg-white p-4 shadow-sm">
            <select v-model="selectedModel"
                class="w-full max-w-xs border rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500">
                <option v-for="model in aiModels" :key="model.value" :value="model.value">
                    {{ model.label }}
                </option>
            </select>
        </div>

        <div class="flex-1 p-4 overflow-y-auto">
            <div class="max-w-3xl mx-auto">
                <ChatMessage v-for="(message, index) in messages" :key="index" :message="message" />
            </div>
        </div>

        <div class="max-w-3xl mx-auto w-full">
            <ChatInput @send="handleSend" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import ChatMessage from './ChatMessage.vue'
import ChatInput from './ChatInput.vue'
import io from 'socket.io-client'

interface Message {
    text: string;
    attachments?: Array<{
        type: 'document' | 'image'
        name: string
    }>;
    isUser: boolean
}

const messages = ref<Message[]>([])
const selectedModel = ref('gemini')
console.log(`import.meta.env.VITE_API_URL: ${import.meta.env.VITE_API_URL}`)
const socket = io(import.meta.env.VITE_API_URL)

const aiModels = [
    { value: 'gemini', label: 'Gemini 1.5 Flash', provider: 'gemini-message' },
    // open ai in progress
    // { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', provider: 'openai-message' },
    // { value: 'gpt-4', label: 'GPT-4', provider: 'openai-message' },
    { value: 'claude-2', label: 'Claude 2', provider: 'claude-message' },
];

onMounted(() => {

    const updateSocketListener = () => {
        const selectedModelObj = aiModels.find(model => model.value === selectedModel.value)
        if (selectedModelObj) {
            console.log(`updateSocketListener socket: ${selectedModelObj.provider}`)

            socket.off('gemini-message')
            socket.off('claude-message')
            socket.off('openai-message')

            socket.on(selectedModelObj.provider, (response) => {
                const lastMessage = messages.value[messages.value.length - 1]

                if (lastMessage && !lastMessage.isUser) {
                    lastMessage.text += response;
                } else {
                    messages.value.push({ isUser: false, text: response })
                }
            });
        }
    };

    updateSocketListener()

    watch(selectedModel, () => {
        messages.value = []
        updateSocketListener()
    });

    // Handle error messages from the server
    socket.on('error', (errorMessage) => {
        console.error('Error from server:', errorMessage);
        messages.value.push({ isUser: false, text: `Error: ${errorMessage}` });
    });
});

const handleSend = (text: string, files: File[]) => {
    const attachments = files.map(file => ({
        type: file.type.startsWith('image/') ? 'image' : 'document',
        name: file.name
    } as const));

    if (text.trim() !== '') {

        messages.value.push({
            text,
            attachments,
            isUser: true
        });

        const selectedModelObj = aiModels.find(model => model.value === selectedModel.value)

        if (selectedModelObj) {
            console.log(`selectedModelObj.provider: ${selectedModelObj.provider}`)
            socket.emit(selectedModelObj.provider, text)
        }
    }

}
</script>
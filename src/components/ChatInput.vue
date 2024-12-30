<script setup lang="ts">
import { ref } from 'vue';
import { useFileUpload } from '../composables/useFileUpload';

const emit = defineEmits<{
  (e: 'send', message: string, attachments: File[]): void;
}>();

const messageText = ref('');
const fileInput = ref<HTMLInputElement | null>(null);
const { selectedFiles, isDragging, hasReachedLimit, addFiles, removeFile, clearFiles, MAX_FILES } = useFileUpload();

const handleSend = () => {
  if (messageText.value.trim() || selectedFiles.value.length > 0) {
    emit('send', messageText.value, selectedFiles.value);
    messageText.value = '';
    clearFiles();
    if (fileInput.value) {
      fileInput.value.value = '';
    }
  }
};

const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files) {
    addFiles(input.files);
  }
};

const handleDragEnter = (e: DragEvent) => {
  e.preventDefault();
  isDragging.value = true;
};

const handleDragLeave = (e: DragEvent) => {
  e.preventDefault();
  isDragging.value = false;
};

const handleDrop = (e: DragEvent) => {
  e.preventDefault();
  isDragging.value = false;
  if (e.dataTransfer?.files) {
    addFiles(e.dataTransfer.files);
  }
};
</script>

<template>
  <div class="border-t p-4 bg-white">
    <div class="flex flex-col gap-2">
      <div v-if="selectedFiles.length > 0" class="flex flex-col gap-2">
        <div class="flex gap-2 flex-wrap">
          <div
            v-for="file in selectedFiles"
            :key="file.name"
            class="bg-gray-100 px-2 py-1 rounded-md text-sm flex items-center gap-1"
          >
            <span>{{ file.name }}</span>
            <button
              @click="removeFile(file)"
              class="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
        </div>
        <div class="text-sm text-gray-500">
          {{ selectedFiles.length }}/{{ MAX_FILES }} files attached
        </div>
      </div>
      <div
        class="flex gap-2"
        @dragenter.prevent="handleDragEnter"
        @dragover.prevent="handleDragEnter"
        @dragleave.prevent="handleDragLeave"
        @drop.prevent="handleDrop"
      >
        <div
          class="flex-1 relative"
          :class="{ 'ring-2 ring-blue-500 ring-opacity-50': isDragging }"
        >
          <input
            v-model="messageText"
            type="text"
            placeholder="Type a message or drop files here..."
            class="w-full border rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
            @keyup.enter="handleSend"
          />
          <div
            v-if="isDragging"
            class="absolute inset-0 bg-blue-50 bg-opacity-50 rounded-lg flex items-center justify-center pointer-events-none"
          >
            <span class="text-blue-500">
              {{ hasReachedLimit ? 'File limit reached' : 'Drop files here' }}
            </span>
          </div>
        </div>
        <input
          ref="fileInput"
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx,.txt"
          class="hidden"
          @change="handleFileSelect"
          :disabled="hasReachedLimit"
        />
        <button
          @click="fileInput?.click()"
          class="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="hasReachedLimit"
          :title="hasReachedLimit ? 'File limit reached' : 'Attach files'"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clip-rule="evenodd" />
          </svg>
        </button>
        <button
          @click="handleSend"
          class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Send
        </button>
      </div>
    </div>
  </div>
</template>
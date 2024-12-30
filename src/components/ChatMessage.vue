<template>
  <div :class="['flex', 'mb-4', message.isUser ? 'justify-end' : 'justify-start']">
    <div :class="[
      'max-w-[70%]',
      'rounded-lg',
      'p-3',
      message.isUser ? 'bg-blue-500 text-white' : 'bg-gray-200',
    ]">
      <div v-html="sanitizedHtml"></div>
      <div v-if="message.attachments && message.attachments.length > 0" class="mt-2">
        <div v-for="(attachment, index) in message.attachments" :key="index" class="flex items-center gap-2">
          <template v-if="attachment.type === 'document'">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd"
                d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                clip-rule="evenodd" />
            </svg>
          </template>
          <template v-else-if="attachment.type === 'image'">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd"
                d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                clip-rule="evenodd" />
            </svg>
          </template>
          <span class="text-sm">{{ attachment.name }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import DOMPurify from 'dompurify'

const props = defineProps<{
  message: {
    text: string;
    attachments?: Array<{
      type: 'document' | 'image';
      name: string;
    }>;
    isUser: boolean;
  }
}>()

const sanitizedHtml = computed(() => DOMPurify.sanitize(props.message.text))
</script>

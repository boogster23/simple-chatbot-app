import { ref, computed } from 'vue';

const MAX_FILES = 5;

export function useFileUpload() {
  const selectedFiles = ref<File[]>([]);
  const isDragging = ref(false);
  const hasReachedLimit = computed(() => selectedFiles.value.length >= MAX_FILES);

  const addFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    // Filter out video files and limit to remaining slots
    const remainingSlots = MAX_FILES - selectedFiles.value.length;
    const validFiles = fileArray
      .filter(file => !file.type.startsWith('video/'))
      .slice(0, remainingSlots);
      
    selectedFiles.value = [...selectedFiles.value, ...validFiles];
  };

  const removeFile = (file: File) => {
    selectedFiles.value = selectedFiles.value.filter(f => f !== file);
  };

  const clearFiles = () => {
    selectedFiles.value = [];
  };

  return {
    selectedFiles,
    isDragging,
    hasReachedLimit,
    addFiles,
    removeFile,
    clearFiles,
    MAX_FILES
  };
}
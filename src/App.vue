<template>
  <ChatApp />
</template>

<script>
import { defineComponent } from 'vue';
import ChatApp from './components/ChatApp.vue';

export default defineComponent({
  name: 'App',
  components: {
    ChatApp,
  },
  setup() {
    return {};
  },
});
</script>
<script setup lang="ts">
import recentIcon from '../../assets/img/recent-icon.png'

const emit = defineEmits<{
  (e: 'createConversation'): void
  (e: 'toggleSidebar'): void
}>()
</script>

<template>
  <div class="conversation-actions">
    <button
      type="button"
      class="landing-pill"
      @click="emit('createConversation')"
    >
      <span class="landing-pill__circle">+</span>
      <span>新对话</span>
    </button>
    <button
      type="button"
      class="landing-pill landing-pill--recent"
      @click="emit('toggleSidebar')"
    >
      <img :src="recentIcon" alt="recent" />
      <span>最近对话</span>
    </button>
  </div>
</template>

<style scoped>
.conversation-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  width: 100%;
}

.landing-pill {
  border: 0;
  background: rgba(255, 255, 255, 0.94);
  color: #445369;
  height: 38px;
  padding: 0 16px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 10px 24px rgba(133, 188, 225, 0.16);
  cursor: pointer;
}

.landing-pill__circle {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  border: 1.5px solid #7a8594;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  line-height: 1;
}

.landing-pill--recent img {
  width: 14px;
  height: 14px;
}

@media (max-width: 768px) {
  .conversation-actions {
    gap: 8px;
  }

  .landing-pill {
    height: 34px;
    padding: 0 12px;
    font-size: 13px;
  }

  .landing-pill__circle {
    width: 16px;
    height: 16px;
    font-size: 12px;
  }
}
</style>

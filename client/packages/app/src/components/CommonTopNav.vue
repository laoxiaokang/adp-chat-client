<script setup lang="ts">
type TopNavTab = 'archive' | 'consult' | 'service'
type TopNavTone = 'light' | 'dark'

const props = withDefaults(
  defineProps<{
    activeTab: TopNavTab
    tone?: TopNavTone
  }>(),
  {
    tone: 'dark'
  }
)

const emit = defineEmits<{
  (e: 'select', tab: TopNavTab): void
}>()

const items: Array<{ key: TopNavTab; label: string }> = [
  { key: 'archive', label: '档案' },
  { key: 'consult', label: '咨询' },
  { key: 'service', label: '服务' }
]
</script>

<template>
  <nav class="top-nav" :class="`top-nav--dark`" aria-label="main navigation">
    <button
      v-for="item in items"
      :key="item.key"
      type="button"
      class="top-nav__item"
      :class="{ 'top-nav__item--active': item.key === props.activeTab }"
      @click="emit('select', item.key)"
    >
      {{ item.label }}
    </button>
  </nav>
</template>

<style scoped>
.top-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
}

.top-nav__item {
  border: 0;
  background: transparent;
  padding: 0;
  font-size: 18px;
  line-height: 1;
  font-weight: 500;
  cursor: pointer;
  transition:
    color 0.2s ease,
    opacity 0.2s ease;
}

.top-nav--light .top-nav__item {
  color: rgba(255, 255, 255, 0.74);
}

.top-nav--light .top-nav__item--active {
  color: #ffffff;
  text-shadow: 0 4px 16px rgba(13, 72, 164, 0.24);
}

.top-nav--dark .top-nav__item {
  color: rgba(42, 53, 68, 0.9);
}

.top-nav--dark .top-nav__item--active {
  color: #2388ff;
  text-shadow: 0 4px 14px rgba(35, 136, 255, 0.12);
}

@media (max-width: 390px) {
  .top-nav {
    gap: 18px;
  }

  .top-nav__item {
    font-size: 17px;
  }
}
</style>

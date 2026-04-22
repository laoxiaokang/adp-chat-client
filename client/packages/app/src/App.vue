<script setup lang="ts">
import { RouterView } from 'vue-router'
import { onMounted, computed } from 'vue'
import { initUI, useUiStore } from '@/stores/ui'
// TDesign 组件由 unplugin-vue-components 自动按需导入，但类型和 locale 配置需手动引入
import type { GlobalConfigProvider } from 'tdesign-vue-next'
import enConfig from 'tdesign-vue-next/es/locale/en_US'
import zhConfig from 'tdesign-vue-next/es/locale/zh_CN'
const uiStore = useUiStore()

const tDesignLocale = computed<GlobalConfigProvider>(() => {
  return JSON.parse(JSON.stringify(uiStore.language === 'en' ? enConfig : zhConfig));
});

onMounted(() => {
  initUI();
});

</script>

<template>
  <TConfigProvider :global-config="tDesignLocale">
    <RouterView />
  </TConfigProvider>
</template>

<style scoped>
.page-container {
  width: 100vw;
  user-select: none;
}
</style>
<style>
#app{
  --app-mobile-max-width: 430px;
  width: min(100vw, var(--app-mobile-max-width));
  max-width: var(--app-mobile-max-width);
  height: 100dvh;
  margin: 0 auto;
  overflow: hidden;
}
@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
.selectable {
  user-select: text;
}
</style>

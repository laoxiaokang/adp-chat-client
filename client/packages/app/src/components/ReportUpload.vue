<script setup lang="ts">
import { useRouter } from 'vue-router'
import heroBg from '@/assets/service-home/hero-bg.png'

const router = useRouter()

const goBack = () => {
  router.back()
}

const handleUpload = () => {
  // 上传逻辑
  // 跳转对话页
  router.push({
    name: 'consult',
    query: { agentCardId: '4', agentCardType: '4', agentCardTitle: '报告解读' }
  })
  // 上传报告单
  console.log('上传报告单')
}
</script>

<template>
  <div class="report-upload">
    <section
      class="report-upload__hero"
      :style="{ backgroundImage: `url(${heroBg})` }"
    >
      <div type="button" class="report-upload__back" @click="goBack">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M15 19L8 12L15 5"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>
    </section>

    <main class="report-upload__content">
      <img
        class="report-upload__title"
        src="@/assets/archive-home/fake-8.png"
        alt="report-upload"
        @click="handleUpload"
      />
    </main>
  </div>
</template>

<style scoped>
.report-upload {
  min-height: 100%;
  background: #fff;
  overflow: visible;
}

.report-upload__hero {
  position: relative;
  min-height: 280px;
  padding: 56px 14px 24px;
  background-size: 100% 100%;
  background-repeat: no-repeat;
}

.report-upload__back {
  position: absolute;
  top: 56px;
  left: 14px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  background: transparent;
  border: none;
  border-radius: 20px;
  color: #2c3e50;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: -42px;
}

.report-upload__back:hover {
  background: transparent;
}

.report-upload__back svg {
  width: 20px;
  height: 20px;
}

.report-upload__content {
  position: relative;
  z-index: 10;
  margin-top: -40px;
  padding: 0 14px 28px;
  background: #fefefe;

  .report-upload__title {
    width: 100%;
    margin-top: -176px;
  }
}

.report-upload__card {
  background: rgba(255, 255, 255, 0.94);
  border-radius: 20px;
  box-shadow: 0 18px 36px rgba(123, 148, 189, 0.14);
}

.report-upload__section {
  margin-top: 14px;
  padding: 16px 14px 14px;
}

.report-upload__section:first-child {
  margin-top: 0;
}

.report-upload__section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.report-upload__section-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.report-upload__section-marker {
  width: 4px;
  height: 16px;
  background: linear-gradient(180deg, #58a5ff 0%, #2b8cff 100%);
  border-radius: 2px;
}

.report-upload__section-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #1a1a1a;
}

.report-upload__upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  border: 2px dashed #d0d8e0;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.report-upload__upload-area:hover {
  border-color: #58a5ff;
  background: rgba(88, 165, 255, 0.04);
}

.report-upload__upload-icon {
  color: #8a94a6;
  margin-bottom: 12px;
}

.report-upload__upload-area:hover .report-upload__upload-icon {
  color: #58a5ff;
}

.report-upload__upload-text {
  margin: 0 0 8px;
  font-size: 15px;
  font-weight: 600;
  color: #2c3e50;
}

.report-upload__upload-hint {
  margin: 0;
  font-size: 13px;
  color: #8a94a6;
}

.report-upload__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #8a94a6;
  font-size: 14px;
}
</style>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import heroBg from '@/assets/service-home/hero-bg.png'
import heroTitleImg from '@/assets/archive-home/fake-1.png'
import heroSummaryImg from '@/assets/archive-home/fake-2.png'
import navIndicatorImg from '@/assets/archive-home/icon.png'
import healthDataImg1 from '@/assets/archive-home/fake-3.png'
import healthDataImg2 from '@/assets/archive-home/fake-4.png'
import healthDataImg3 from '@/assets/archive-home/fake-5.png'
import inspectDataImg from '@/assets/archive-home/fake-6.png'
import reportDataImg from '@/assets/archive-home/fake-7.png'

const router = useRouter()

defineProps<{
  loading?: boolean
}>()

defineEmits<{
  (e: 'openConsult'): void
}>()

const goToReportUpload = () => {
  router.push({ name: 'report-upload' })
}

const navItems = [
  { key: 'health', label: '健康数据' },
  { key: 'inspect', label: '检测数据' },
  { key: 'report', label: '报告单' }
] as const

type ArchiveSectionKey = (typeof navItems)[number]['key']

const activeSectionKey = ref<ArchiveSectionKey>('health')

const sectionImages: Record<ArchiveSectionKey, string[]> = {
  health: [healthDataImg2, healthDataImg3, healthDataImg1],
  inspect: [inspectDataImg],
  report: [reportDataImg]
}
</script>

<template>
  <div class="archive-home">
    <section
      class="archive-home__hero"
      :style="{ backgroundImage: `url(${heroBg})` }"
    >
      <img
        class="archive-home__hero-title"
        :src="heroTitleImg"
        alt="archive-title"
      />
      <img
        class="archive-home__hero-summary"
        :src="heroSummaryImg"
        alt="archive-summary"
      />
    </section>

    <main class="archive-home__content">
      <section class="archive-home__card">
        <div class="nav">
          <button
            v-for="item in navItems"
            :key="item.key"
            type="button"
            :class="[
              'nav__item',
              activeSectionKey === item.key ? 'nav__item--active' : ''
            ]"
            @click="activeSectionKey = item.key"
          >
            <span class="nav__text">{{ item.label }}</span>
            <img
              v-if="activeSectionKey === item.key"
              class="nav__indicator"
              :src="navIndicatorImg"
              alt="selected"
            />
          </button>
        </div>

        <div class="archive-home__body">
          <div class="btn" @click="goToReportUpload">+ 上传新报告单</div>
          <img
            v-for="(image, index) in sectionImages[activeSectionKey]"
            :key="`${activeSectionKey}-${index}`"
            class="archive-home__section-image"
            :src="image"
            :alt="`${activeSectionKey}-${index}`"
          />
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.archive-home {
  min-height: 100%;
  background: transparent;
}

.archive-home__hero {
  height: 260px;
  padding: 58px 18px 20px;
  background-size: 100% 100%;
  background-position: center top;
  background-repeat: no-repeat;
  position: relative;
}

.archive-home__hero-title {
  display: block;
  width: 232px;
  max-width: 74%;
  height: auto;
  margin: 18px;
}

.archive-home__hero-summary {
  display: block;
  width: 100%;
  margin: 8px auto 0;
  height: auto;
}

.archive-home__content {
  margin-top: 18px;
  padding: 16px 12px 26px;
}

.archive-home__card {
  padding: 0;
  background: transparent;
}

.nav {
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 8px;
  background: transparent;
  margin-left: 18px;
}

.nav__item {
  border: 0;
  padding: 0;
  background: transparent;
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  min-height: 50px;
  color: #111111;
}

.nav__text {
  font-size: 16px;
  line-height: 1;
  font-weight: 500;
  margin-right: 24px;
  color: #111111;
  transition:
    color 0.2s ease,
    font-size 0.1 ease,
    font-weight 0.1s ease;
}

.nav__indicator {
  width: 62px;
  height: auto;
  margin-left: 0px;
  margin-top: -8px;
}

.nav__item--active {
  color: #111111;
}

.nav__item--active .nav__text {
  font-size: 18px;
  font-weight: 700;
  color: #111111;
}

.archive-home__body {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;

  .btn {
    width: 90%;
    margin: 0 auto;
    background-color: #248ff7;
    padding: 12px;
    border-radius: 24px;
    text-align: center;
    color: #fff;
    margin-bottom: 12px;
  }
}

.archive-home__section-image {
  display: block;
  width: 100%;
  height: auto;
}
</style>

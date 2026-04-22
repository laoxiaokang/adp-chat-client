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
  { key: 'report', label: '报告单' },
  { key: 'purchase', label: '购药记录' }
] as const

type ArchiveSectionKey = (typeof navItems)[number]['key']
type ImageSectionKey = Exclude<ArchiveSectionKey, 'purchase'>

const activeSectionKey = ref<ArchiveSectionKey>('health')

const sectionImages: Record<ImageSectionKey, string[]> = {
  health: [healthDataImg2, healthDataImg3, healthDataImg1],
  inspect: [inspectDataImg],
  report: [reportDataImg]
}

const imageSectionKeys: ImageSectionKey[] = ['health', 'inspect', 'report']

const isImageSection = (key: ArchiveSectionKey): key is ImageSectionKey => {
  return imageSectionKeys.includes(key as ImageSectionKey)
}

const purchaseRecords = [
  {
    id: 'P001',
    medicineName: '阿托伐他汀钙片',
    spec: '20mg*7片',
    pharmacy: '协和互联网医院药房',
    orderDate: '2026-04-20',
    amount: '¥38.50',
    status: '已完成'
  },
  {
    id: 'P002',
    medicineName: '盐酸二甲双胍片',
    spec: '0.5g*20片',
    pharmacy: '华润健康药房',
    orderDate: '2026-04-16',
    amount: '¥26.00',
    status: '配送中'
  },
  {
    id: 'P003',
    medicineName: '缬沙坦胶囊',
    spec: '80mg*14粒',
    pharmacy: '仁济云药房',
    orderDate: '2026-04-09',
    amount: '¥52.90',
    status: '已完成'
  }
]
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

        <div v-if="isImageSection(activeSectionKey)" class="archive-home__body">
          <button
            v-if="activeSectionKey === 'report'"
            type="button"
            class="archive-home__upload-btn"
            @click="goToReportUpload"
          >
            + 上传新报告单
          </button>
          <img
            v-for="(image, index) in sectionImages[activeSectionKey]"
            :key="`${activeSectionKey}-${index}`"
            class="archive-home__section-image"
            :src="image"
            :alt="`${activeSectionKey}-${index}`"
          />
        </div>

        <div v-else class="archive-home__purchase-list">
          <article
            v-for="item in purchaseRecords"
            :key="item.id"
            class="archive-home__purchase-item"
          >
            <div class="archive-home__purchase-top">
              <h3 class="archive-home__purchase-name">{{ item.medicineName }}</h3>
              <span class="archive-home__purchase-status">{{ item.status }}</span>
            </div>
            <p class="archive-home__purchase-spec">{{ item.spec }}</p>
            <div class="archive-home__purchase-meta">
              <span>{{ item.pharmacy }}</span>
              <span>{{ item.orderDate }}</span>
            </div>
            <div class="archive-home__purchase-footer">
              <span class="archive-home__purchase-id">订单号 {{ item.id }}</span>
              <strong class="archive-home__purchase-amount">{{ item.amount }}</strong>
            </div>
          </article>
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
}

.archive-home__upload-btn {
  width: 90%;
  margin: 0 auto 12px;
  background-color: #248ff7;
  border: 0;
  padding: 12px;
  border-radius: 24px;
  text-align: center;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
}

.archive-home__purchase-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.archive-home__purchase-item {
  border-radius: 16px;
  padding: 14px 14px 12px;
  background: linear-gradient(180deg, #ffffff 0%, #f7fbff 100%);
  box-shadow: 0 10px 22px rgba(83, 123, 175, 0.12);
  border: 1px solid rgba(69, 139, 228, 0.14);
}

.archive-home__purchase-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.archive-home__purchase-name {
  margin: 0;
  font-size: 16px;
  line-height: 1.2;
  color: #24364d;
  font-weight: 700;
}

.archive-home__purchase-status {
  padding: 3px 10px;
  border-radius: 999px;
  background: rgba(36, 143, 247, 0.12);
  color: #1f79d3;
  font-size: 12px;
  line-height: 1.2;
  font-weight: 600;
}

.archive-home__purchase-spec {
  margin: 7px 0 0;
  color: #617086;
  font-size: 13px;
  line-height: 1.35;
}

.archive-home__purchase-meta {
  margin-top: 6px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: #7f8ea3;
  font-size: 12px;
  line-height: 1.3;
}

.archive-home__purchase-footer {
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.archive-home__purchase-id {
  color: #9ba8b8;
  font-size: 12px;
  line-height: 1.3;
}

.archive-home__purchase-amount {
  color: #207ce0;
  font-size: 17px;
  line-height: 1.1;
  font-weight: 700;
}

.archive-home__section-image {
  display: block;
  width: 100%;
  height: auto;
}
</style>

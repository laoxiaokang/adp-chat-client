<script setup lang="ts">
import heroBg from '@/assets/service-home/hero-bg.png'
import doctorImg from '@/assets/service-home/doctor.png'
import moreImg from '@/assets/service-home/more.png'
import starImg from '@/assets/service-home/star.png'
import shieldImg from '@/assets/service-home/shield.png'
import consultBubbleImg from '@/assets/service-home/consult-bubble.png'
import serviceConsultImg from '@/assets/service-home/service-consult.png'
import serviceSelfCheckImg from '@/assets/service-home/service-self-check.png'
import serviceReportImg from '@/assets/service-home/service-report.png'
import serviceMedicineImg from '@/assets/service-home/service-medicine.png'
import metricHeartImg from '@/assets/service-home/metric-heart.png'
import metricPressureImg from '@/assets/service-home/metric-pressure.png'
import metricSleepImg from '@/assets/service-home/metric-sleep.png'
import metricStepsImg from '@/assets/service-home/metric-steps.png'
import toolUploadImg from '@/assets/service-home/tool-upload.png'
import toolDietImg from '@/assets/service-home/tool-diet.png'
import toolReminderImg from '@/assets/service-home/tool-reminder.png'
import toolCalendarImg from '@/assets/service-home/tool-calendar.png'
import chevronRightImg from '@/assets/service-home/chevron-right.png'
import fakeServiceImg from '@/assets/service-home/fake-1.png'
import fake1Img from '@/assets/service-home/f1.png'
import fake2Img from '@/assets/service-home/f2.png'
import fake3Img from '@/assets/service-home/f3.png'
import fake4Img from '@/assets/service-home/f4.png'

defineProps<{
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'openService', cardId: string): void
}>()

const badges = [
  { icon: starImg, text: '执业认证' },
  { icon: shieldImg, text: '健康助手' }
]

const serviceCards = [
  { id: '1', title: '咨询', icon: serviceConsultImg },
  { id: '3', title: '症状自查', icon: serviceSelfCheckImg },
  { id: '4', title: '报告解读', icon: serviceReportImg },
  { id: '2', title: '用药助手', icon: serviceMedicineImg },
  {
    id: '',
    title: '健康日历',
    icon: fake1Img
  },
  {
    id: '',
    title: '饮食记录',
    icon: fake4Img
  },
  {
    id: '',
    title: '在线商城',
    icon: fake3Img
  },
  {
    id: '',
    title: '基因检测',
    icon: fake2Img
  }
]

const healthMetrics = [
  {
    title: '心率',
    value: '69',
    unit: '',
    desc: '正常范围 60-100 bpm',
    icon: metricHeartImg
  },
  {
    title: '血压',
    value: '120/80',
    unit: '',
    desc: '收缩压 / 舒张压 mmHg',
    icon: metricPressureImg
  },
  {
    title: '睡眠',
    value: '7.5h',
    unit: '',
    desc: '深度睡眠时间 2.1h',
    icon: metricSleepImg
  },
  {
    title: '今日步数',
    value: '8907',
    unit: '',
    desc: '目标 10,000 步',
    icon: metricStepsImg
  }
]

const toolItems = [
  {
    id: '4',
    title: '体检报告上传',
    desc: 'AI 智能解读您的体检报告',
    icon: toolUploadImg
  },
  {
    id: '1',
    title: '饮食记录',
    desc: '智能分析每日营养摄入',
    icon: toolDietImg
  },
  {
    id: '2',
    title: '用药提醒',
    desc: '按时提醒，科学用药管理',
    icon: toolReminderImg
  },
  {
    id: '1',
    title: '健康日历',
    desc: '记录健康里程碑，追踪趋势',
    icon: toolCalendarImg
  }
]
</script>

<template>
  <div class="service-home">
    <section
      class="service-home__hero"
      :style="{ backgroundImage: `url(${heroBg})` }"
    >
      <div class="service-home__intro" v-if="false">
        <img class="service-home__doctor" :src="doctorImg" alt="SSdoctor" />
        <div class="service-home__intro-copy">
          <p class="service-home__greeting">您好，我是SSdoctor!</p>
          <p class="service-home__subtitle">您的专属AI健康管理助手</p>
          <div class="service-home__badges">
            <span
              v-for="badge in badges"
              :key="badge.text"
              class="service-home__badge"
            >
              <img :src="badge.icon" :alt="badge.text" />
              <span>{{ badge.text }}</span>
            </span>
          </div>
        </div>
      </div>
    </section>

    <main class="service-home__content">
      <section class="service-home__card service-home__services">
        <button
          v-for="item in serviceCards"
          :key="item.id"
          type="button"
          class="service-home__service-item"
          :disabled="loading"
          @click="emit('openService', item.id)"
        >
          <span class="service-home__service-icon">
            <img :src="item.icon" :alt="item.title" />
          </span>
          <span class="service-home__service-title">{{ item.title }}</span>
        </button>
      </section>

      <section class="service-home__card service-home__section">
        <div class="service-home__section-header">
          <div class="service-home__section-title-wrap">
            <span class="service-home__section-marker"></span>
            <h2 class="service-home__section-title">今日健康数据</h2>
          </div>
          <button type="button" class="service-home__more-button">
            <img :src="moreImg" alt="more" />
          </button>
        </div>

        <div class="service-home__metrics-grid">
          <article
            v-for="item in healthMetrics"
            :key="item.title"
            class="service-home__metric-card"
          >
            <div class="service-home__metric-top">
              <img :src="item.icon" :alt="item.title" />
              <span>{{ item.title }}</span>
            </div>
            <div class="service-home__metric-value">
              {{ item.value }}
              <small v-if="item.unit">{{ item.unit }}</small>
            </div>
            <p class="service-home__metric-desc">{{ item.desc }}</p>
          </article>
        </div>
      </section>

      <section class="service-home__card--fake">
        <img class="fakeImage" :src="fakeServiceImg" alt="fake-service" />
      </section>

      <section class="service-home__card service-home__section">
        <div class="service-home__section-header">
          <div class="service-home__section-title-wrap">
            <span class="service-home__section-marker"></span>
            <h2 class="service-home__section-title">健康工具</h2>
          </div>
        </div>

        <div class="service-home__tool-list">
          <button
            v-for="item in toolItems"
            :key="item.title"
            type="button"
            class="service-home__tool-item"
            :disabled="loading"
            @click="emit('openService', item.id)"
          >
            <span class="service-home__tool-main">
              <span class="service-home__tool-icon">
                <img :src="item.icon" :alt="item.title" />
              </span>
              <span class="service-home__tool-copy">
                <span class="service-home__tool-title">{{ item.title }}</span>
                <span class="service-home__tool-desc">{{ item.desc }}</span>
              </span>
            </span>
            <img
              class="service-home__tool-arrow"
              :src="chevronRightImg"
              alt="enter"
            />
          </button>
        </div>
      </section>

      <div class="service-home__consult-wrap">
        <button
          type="button"
          class="service-home__consult-button"
          :disabled="loading"
          @click="emit('openService', '1')"
        >
          <img :src="consultBubbleImg" alt="consult" />
          <span>咨询SSdoctor!</span>
        </button>
      </div>
    </main>
  </div>
</template>

<style scoped>
.fakeImage {
  width: 100%;
  height: auto;
}
.service-home {
  min-height: 100%;
  background: transparent;
  overflow: visible;
}

.service-home__hero {
  position: relative;
  min-height: 240px;
  padding: 56px 14px 88px;
  background-position: center bottom;
  background-size: 100% 100%;
  background-repeat: no-repeat;
}

.service-home__intro {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 14px;
}

.service-home__doctor {
  width: 76px;
  height: auto;
  flex: 0 0 auto;
}

.service-home__intro-copy {
  color: #ffffff;
}

.service-home__greeting {
  margin: 0;
  font-size: 28px;
  line-height: 1.15;
  font-weight: 700;
}

.service-home__subtitle {
  margin: 8px 0 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.88);
}

.service-home__badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.service-home__badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: 999px;
  background: rgba(20, 97, 212, 0.24);
  backdrop-filter: blur(6px);
  font-size: 12px;
}

.service-home__badge img {
  width: 14px;
  height: 14px;
}

.service-home__content {
  position: relative;
  z-index: 1;
  margin-top: -172px;
  padding: 0 14px 28px;
}

.service-home__card {
  background: rgba(255, 255, 255, 0.94);
  border-radius: 20px;
  box-shadow: 0 18px 36px rgba(123, 148, 189, 0.14);
}

.service-home__card--fake {
  margin-top: 14px;
}

.service-home__services {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  padding: 16px 12px 12px;
}

.service-home__service-item {
  border: 0;
  background: transparent;
  padding: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  color: #5a6372;
  font-size: 14px;
  font-weight: 600;
}

.service-home__service-icon {
  width: 58px;
  height: 58px;
  border-radius: 18px;
  background: linear-gradient(180deg, #fff8ef 0%, #f6f8fd 100%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 0 0 1px rgba(235, 239, 247, 0.76);
}

.service-home__service-icon img {
  width: 42px;
  height: 42px;
}

.service-home__section {
  margin-top: 14px;
  padding: 16px 14px 14px;
}

.service-home__section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.service-home__section-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.service-home__section-marker {
  width: 3px;
  height: 16px;
  margin-left: 8px;
  border-radius: 999px;
  background: linear-gradient(180deg, #59a8ff 0%, #2388ff 100%);
}

.service-home__section-title {
  margin: 0;
  color: #4d5665;
  font-size: 18px;
  line-height: 1;
  font-weight: 900;
  margin-left: -2px;
}

.service-home__more-button {
  border: 0;
  background: transparent;
  padding: 0;
}

.service-home__more-button img {
  width: 20px;
  height: auto;
}

.service-home__metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.service-home__metric-card {
  border-radius: 16px;
  background: #f6f9ff;
  padding: 14px 14px 12px;
  box-shadow: inset 0 0 0 1px rgba(232, 237, 248, 0.9);
}

.service-home__metric-top {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #52606f;
  font-size: 14px;
  font-weight: 600;
}

.service-home__metric-top img {
  width: 18px;
  height: 18px;
}

.service-home__metric-value {
  margin-top: 10px;
  color: #2b85ff;
  font-size: 31px;
  line-height: 1;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.service-home__metric-value small {
  margin-left: 2px;
  font-size: 15px;
}

.service-home__metric-desc {
  margin: 8px 0 0;
  color: #a0a9b8;
  font-size: 11px;
  line-height: 1.4;
}

.service-home__tool-list {
  margin-top: 8px;
}

.service-home__tool-item {
  width: 100%;
  border: 0;
  border-bottom: 1px solid rgba(225, 231, 240, 0.92);
  background: transparent;
  padding: 16px 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.service-home__tool-item:last-child {
  border-bottom: 0;
  padding-bottom: 4px;
}

.service-home__tool-main {
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: left;
}

.service-home__tool-icon {
  width: 30px;
  height: 30px;
  border-radius: 999px;
  background: #f4f8ff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
}

.service-home__tool-icon img {
  width: 24px;
  height: 24px;
}

.service-home__tool-copy {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.service-home__tool-title {
  color: #4d5665;
  font-size: 16px;
  line-height: 1;
  font-weight: 600;
}

.service-home__tool-desc {
  color: #a6afbc;
  font-size: 12px;
  line-height: 1.3;
}

.service-home__tool-arrow {
  width: 11px;
  height: auto;
  flex: 0 0 auto;
  opacity: 0.65;
}

.service-home__consult-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 18px;
  padding-bottom: 8px;
}

.service-home__consult-button {
  border: 0;
  border-radius: 999px;
  background: linear-gradient(180deg, #48a3ff 0%, #2c7aff 100%);
  color: #ffffff;
  min-height: 44px;
  padding: 0 18px 0 14px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 10px 18px rgba(44, 122, 255, 0.28);
  font-size: 15px;
  font-weight: 700;
}

.service-home__consult-button img {
  width: 18px;
  height: 18px;
}

.service-home__service-item:disabled,
.service-home__tool-item:disabled,
.service-home__consult-button:disabled {
  opacity: 0.64;
}

@media (max-width: 390px) {
  .service-home__hero {
    padding-left: 12px;
    padding-right: 12px;
  }

  .service-home__greeting {
    font-size: 24px;
  }

  .service-home__section-title {
    font-size: 19px;
  }

  .service-home__service-title {
    font-size: 13px;
  }
}
</style>

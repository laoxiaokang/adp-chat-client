<script setup lang="ts">
import doctorImg from '@/assets/service-home/doctor.png'
import heroBg from '@/assets/service-home/hero-bg.png'
import metricHeartImg from '@/assets/service-home/metric-heart.png'
import metricPressureImg from '@/assets/service-home/metric-pressure.png'
import metricSleepImg from '@/assets/service-home/metric-sleep.png'
import metricStepsImg from '@/assets/service-home/metric-steps.png'
import chevronRightImg from '@/assets/service-home/chevron-right.png'

defineProps<{
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'openConsult'): void
}>()

const summaryItems = [
  { label: '身高 / 体重', value: '168cm / 58kg', icon: metricHeartImg },
  { label: '血压趋势', value: '120/80 mmHg', icon: metricPressureImg },
  { label: '平均睡眠', value: '7.5h / 日', icon: metricSleepImg },
  { label: '活动目标', value: '8907 / 10000步', icon: metricStepsImg },
]

const recordItems = [
  { title: '年度体检报告', desc: '最近更新于 2026.04.18' },
  { title: '慢病随访记录', desc: '高血压管理已连续记录 38 天' },
  { title: '近期问诊摘要', desc: '最近 3 次咨询均已归档整理' },
]
</script>

<template>
  <div class="archive-home">
    <section class="archive-home__hero" :style="{ backgroundImage: `url(${heroBg})` }">
      <div class="archive-home__hero-main">
        <div class="archive-home__avatar-wrap">
          <img :src="doctorImg" alt="avatar" />
        </div>
        <div class="archive-home__hero-copy">
          <h1>我的健康档案</h1>
          <p>汇总您的基础信息、健康趋势与近期记录</p>
        </div>
      </div>

      <div class="archive-home__identity-card">
        <div>
          <strong>张小双</strong>
          <span>女 · 29岁 · A型血</span>
        </div>
        <div>
          <strong>慢病标签</strong>
          <span>血压管理 / 睡眠关注</span>
        </div>
        <div>
          <strong>紧急联系人</strong>
          <span>王先生 138****5566</span>
        </div>
      </div>
    </section>

    <div class="archive-home__body">
      <section class="archive-home__card">
        <div class="archive-home__section-title">
          <span></span>
          <h2>健康摘要</h2>
        </div>

        <div class="archive-home__summary-grid">
          <article v-for="item in summaryItems" :key="item.label" class="archive-home__summary-item">
            <div class="archive-home__summary-top">
              <img :src="item.icon" :alt="item.label" />
              <span>{{ item.label }}</span>
            </div>
            <strong>{{ item.value }}</strong>
          </article>
        </div>
      </section>

      <section class="archive-home__card">
        <div class="archive-home__section-title">
          <span></span>
          <h2>近期记录</h2>
        </div>

        <div class="archive-home__record-list">
          <button
            v-for="item in recordItems"
            :key="item.title"
            type="button"
            class="archive-home__record-item"
          >
            <span class="archive-home__record-copy">
              <strong>{{ item.title }}</strong>
              <small>{{ item.desc }}</small>
            </span>
            <img :src="chevronRightImg" alt="enter" />
          </button>
        </div>
      </section>

      <section class="archive-home__card archive-home__consult-card">
        <div>
          <h3>需要进一步分析当前健康情况？</h3>
          <p>进入咨询页，结合您的档案信息继续问答。</p>
        </div>
        <button type="button" :disabled="loading" @click="emit('openConsult')">
          立即咨询
        </button>
      </section>
    </div>
  </div>
</template>

<style scoped>
.archive-home {
  min-height: 100%;
  background: transparent;
}

.archive-home__hero {
  min-height: 197px;
  padding: 58px 36px 40px;
  background-size: cover;
  background-position: center top;
  background-repeat: no-repeat;
  position: relative;
}

.archive-home__hero-main {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.archive-home__avatar-wrap {
  width: 72px;
  height: 72px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.18);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(8px);
}

.archive-home__avatar-wrap img {
  width: 62px;
  height: auto;
}

.archive-home__hero-copy {
  color: #ffffff;
}

.archive-home__hero-copy h1 {
  margin: 0;
  font-size: 28px;
  line-height: 1.12;
  font-weight: 700;
}

.archive-home__hero-copy p {
  margin: 8px 0 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.86);
}

.archive-home__identity-card {
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: -52px;
  padding: 16px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 20px 36px rgba(109, 146, 193, 0.16);
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.archive-home__identity-card strong,
.archive-home__record-copy strong,
.archive-home__summary-item strong,
.archive-home__consult-card h3 {
  display: block;
}

.archive-home__identity-card strong {
  color: #4c5868;
  font-size: 14px;
  line-height: 1.2;
  font-weight: 700;
}

.archive-home__identity-card span {
  display: block;
  margin-top: 6px;
  color: #9ca7b6;
  font-size: 11px;
  line-height: 1.45;
}

.archive-home__body {
  padding: 68px 16px 28px;
}

.archive-home__card {
  background: rgba(255, 255, 255, 0.96);
  border-radius: 20px;
  box-shadow: 0 16px 30px rgba(118, 139, 173, 0.12);
  padding: 16px;
  margin-bottom: 14px;
}

.archive-home__section-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.archive-home__section-title span {
  width: 3px;
  height: 16px;
  border-radius: 999px;
  background: linear-gradient(180deg, #59a8ff 0%, #2388ff 100%);
}

.archive-home__section-title h2 {
  margin: 0;
  color: #4d5665;
  font-size: 20px;
  line-height: 1;
  font-weight: 700;
}

.archive-home__summary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.archive-home__summary-item {
  border-radius: 16px;
  background: #f6f9ff;
  padding: 14px;
}

.archive-home__summary-top {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #617081;
  font-size: 13px;
  font-weight: 600;
}

.archive-home__summary-top img {
  width: 18px;
  height: 18px;
}

.archive-home__summary-item strong {
  margin-top: 10px;
  color: #2b85ff;
  font-size: 17px;
  line-height: 1.25;
  font-weight: 700;
}

.archive-home__record-list {
  margin-top: 10px;
}

.archive-home__record-item {
  width: 100%;
  border: 0;
  background: transparent;
  padding: 16px 0;
  border-bottom: 1px solid rgba(226, 231, 239, 0.94);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.archive-home__record-item:last-child {
  border-bottom: 0;
  padding-bottom: 0;
}

.archive-home__record-copy {
  text-align: left;
}

.archive-home__record-copy strong {
  color: #4d5665;
  font-size: 16px;
  line-height: 1.2;
  font-weight: 600;
}

.archive-home__record-copy small {
  display: block;
  margin-top: 6px;
  color: #a0a9b8;
  font-size: 12px;
  line-height: 1.35;
}

.archive-home__record-item img {
  width: 11px;
  height: auto;
  opacity: 0.6;
}

.archive-home__consult-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.archive-home__consult-card h3 {
  margin: 0;
  color: #4d5665;
  font-size: 17px;
  line-height: 1.25;
  font-weight: 700;
}

.archive-home__consult-card p {
  margin: 8px 0 0;
  color: #97a3b2;
  font-size: 12px;
  line-height: 1.4;
}

.archive-home__consult-card button {
  flex: 0 0 auto;
  min-width: 96px;
  height: 38px;
  border: 0;
  border-radius: 999px;
  background: linear-gradient(180deg, #48a3ff 0%, #2c7aff 100%);
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  box-shadow: 0 10px 18px rgba(44, 122, 255, 0.22);
}

@media (max-width: 390px) {
  .archive-home__identity-card {
    grid-template-columns: 1fr;
  }

  .archive-home__consult-card {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>

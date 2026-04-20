<script setup lang="ts">
import { computed, ref, toRefs, watch } from 'vue'
import type { MobileProps, SelectedAgentCard } from '../../model/type'
import { mobilePropsDefaults } from '../../model/type'
import type { Application } from '../../model/application'
import { agentCardDefinitions } from '../../config/agentCards'
import healthIcon from '../../assets/img/qa-ai.png'
import medicineIcon from '../../assets/img/medicine-icon.png'
import inquiryIcon from '../../assets/img/inquiry-icon.png'
import reportIcon from '../../assets/img/report-icon.png'
import doctorImage from '../../assets/img/ssdoctor.png'
import questionIcon from '../../assets/img/question-icon.png'
import ConversationTopActions from './ConversationTopActions.vue'

interface AgentCardItem {
  id: string
  title: string
  desc: string
  agentType: string
  icon: string
  applicationId?: string
}

interface Props extends MobileProps {
  currentApplicationAvatar?: string
  currentApplicationName?: string
  currentApplicationGreeting?: string
  currentApplicationOpeningQuestions?: string[]
  applications?: Application[]
  selectedAgentCard?: SelectedAgentCard | null
  isOverlay?: boolean
}

const agentCardIconMap: Record<string, string> = {
  '1': healthIcon,
  '2': medicineIcon,
  '3': inquiryIcon,
  '4': reportIcon,
  '5': healthIcon
}

const staticQuestions = [
  '感冒了可以吃头孢吗？',
  '体检发现血糖偏高怎么办？',
  '经常感到胸闷气短是什么问题？'
]

const props = withDefaults(defineProps<Props>(), {
  currentApplicationAvatar: '',
  currentApplicationName: '',
  currentApplicationGreeting: '',
  currentApplicationOpeningQuestions: () => [],
  applications: () => [],
  selectedAgentCard: null,
  isOverlay: false,
  ...mobilePropsDefaults
})

const { applications, selectedAgentCard, isMobile } = toRefs(props)

const emit = defineEmits<{
  (e: 'selectQuestion', question: string): void
  (e: 'selectApplication', applicationId: string): void
  (e: 'selectAgentCard', card: SelectedAgentCard): void
  (e: 'createConversation'): void
  (e: 'toggleSidebar'): void
}>()

const checkedQuestion = ref('')
const localSelectedCardId = ref('')

const agentCards = computed<AgentCardItem[]>(() => {
  const fallbackAppId = applications.value[0]?.ApplicationId
  return agentCardDefinitions.map((card, index) => ({
    ...card,
    icon: agentCardIconMap[card.id] || healthIcon,
    applicationId: applications.value[index]?.ApplicationId || fallbackAppId
  }))
})

const activeCardId = computed(
  () => localSelectedCardId.value || selectedAgentCard.value?.id || ''
)

watch(
  () => selectedAgentCard.value?.id,
  nextId => {
    if (nextId) {
      localSelectedCardId.value = nextId
    }
  },
  { immediate: true }
)

const handleChooseQuestion = (value: string) => {
  if (checkedQuestion.value === value) {
    checkedQuestion.value = ''
    emit('selectQuestion', '')
    return
  }
  checkedQuestion.value = value
  emit('selectQuestion', value)
}

const handleCreateConversation = () => {
  checkedQuestion.value = ''
  emit('createConversation')
  emit('selectQuestion', '')
}

const handleToggleSidebar = () => {
  emit('toggleSidebar')
}

const handleChooseAgentCard = (item: AgentCardItem) => {
  if (!item.applicationId) {
    return
  }
  localSelectedCardId.value = item.id
  emit('selectApplication', item.applicationId)
  emit('selectAgentCard', {
    id: item.id,
    agentType: item.agentType,
    title: item.title,
    desc: item.desc
  })
}
</script>

<template>
  <div class="welcome-container" :class="{ isMobile: isMobile }">
    <ConversationTopActions
      class="landing-actions"
      @createConversation="handleCreateConversation"
      @toggleSidebar="handleToggleSidebar"
    />

    <div class="hero-stack">
      <section class="hero-card">
        <div class="hero-copy">
          <h1 class="hero-title">您好，我是SSdoctor!</h1>
          <p class="hero-tagline">专业诊断AI健康伴侣</p>
          <p class="hero-caption">全天在线，随时在线，像超级医生一样守护您</p>
        </div>
        <img class="hero-image" :src="doctorImage" alt="SSdoctor" />
      </section>

      <section class="service-panel">
        <div class="service-grid">
          <button
            v-for="item in agentCards"
            :key="item.id"
            type="button"
            class="service-card"
            :class="{
              disabled: !item.applicationId,
              active: activeCardId === item.id
            }"
            @click="handleChooseAgentCard(item)"
          >
            <div class="service-card__icon">
              <img :src="item.icon" :alt="item.title" />
            </div>
            <span class="service-card__title">{{ item.title }}</span>
            <span class="service-card__desc">{{ item.desc }}</span>
          </button>
        </div>
      </section>
    </div>

    <section class="faq-card">
      <div class="faq-header">
        <img :src="questionIcon" alt="question" />
        <span>常见问题</span>
      </div>
      <div class="faq-list">
        <button
          v-for="question in staticQuestions"
          :key="question"
          type="button"
          class="faq-item"
          :class="{ active: checkedQuestion === question }"
          @click="handleChooseQuestion(question)"
        >
          {{ question }}
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.welcome-container {
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 2px 0 10px;
}

.landing-actions {
  margin-top: 14px;
  padding-right: 6px;
}

.hero-stack {
  position: relative;
  overflow: visible;
}

.hero-card {
  position: relative;
  min-height: 184px;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.88);
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.5),
    rgba(228, 244, 255, 0.72)
  );
  padding: 20px 20px 52px;
  overflow: visible;
  box-shadow: 0 18px 40px rgba(105, 160, 194, 0.12);
  margin-top: 18px;
}

.hero-copy {
  max-width: 58%;
  color: #4c5766;
}

.hero-title {
  margin: 0;
  color: #3f4c5d;
  font-size: 30px;
  line-height: 1.2;
  font-weight: 700;
}

.hero-tagline {
  margin: 10px 0 8px;
  color: #687484;
  font-size: 18px;
  font-weight: 600;
}

.hero-caption {
  margin: 0;
  color: #8b97a8;
  font-size: 14px;
  line-height: 1.5;
}

.hero-image {
  position: absolute;
  right: 12px;
  bottom: 10px;
  width: 138px;
  max-width: 38%;
  z-index: 2;
  pointer-events: none;
}

.service-panel {
  position: relative;
  z-index: 1;
  margin: -24px 10px 0;
  padding: 14px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 16px 38px rgba(108, 162, 197, 0.2);
}

.service-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.service-card {
  border: 2px solid transparent;
  border-radius: 20px;
  background: linear-gradient(180deg, #f5f9ff 0%, #eef4fa 100%);
  min-height: 122px;
  padding: 14px 12px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 5px;
  text-align: center;
  color: #455365;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease,
    background 0.18s ease;
}

.service-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(129, 173, 203, 0.22);
}

.service-card.disabled {
  opacity: 0.48;
  cursor: not-allowed;
}

.service-card.active {
  border-color: #6bbaff;
  background: linear-gradient(180deg, #fafdff 0%, #eef7ff 100%);
  box-shadow: 0 12px 24px rgba(94, 167, 230, 0.24);
}

.service-card__icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.service-card__icon img {
  max-width: 100%;
  max-height: 100%;
}

.service-card__title {
  font-size: 16px;
  font-weight: 700;
  color: #3d4a59;
  line-height: 1.25;
}

.service-card__desc {
  font-size: 11px;
  line-height: 1.3;
  color: #7f8c9d;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.faq-card {
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.86);
  background: rgba(255, 255, 255, 0.24);
  min-height: 196px;
  padding: 16px 16px 18px;
}

.faq-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  font-size: 16px;
  font-weight: 700;
  color: #43505f;
}

.faq-header img {
  width: 16px;
  height: 16px;
}

.faq-list {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
}

.faq-item {
  border: 0;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.95);
  padding: 10px 14px;
  color: #546171;
  font-size: 14px;
  line-height: 1.4;
  text-align: left;
  box-shadow: 0 8px 20px rgba(129, 173, 203, 0.08);
  cursor: pointer;
}

.faq-item.active {
  color: #2b8ff7;
  box-shadow: inset 0 0 0 1.5px rgba(43, 143, 247, 0.28);
}

.isMobile.welcome-container {
  max-width: 100%;
  gap: 8px;
  padding: 0 0 6px;
}

.isMobile .landing-actions {
  margin-top: 10px;
  padding-right: 4px;
  margin-bottom: 0;
}

.isMobile .landing-pill {
  height: 34px;
  padding: 0 12px;
  font-size: 13px;
}

.isMobile .landing-pill__circle {
  width: 16px;
  height: 16px;
  font-size: 12px;
}

.isMobile .hero-card {
  min-height: 136px;
  padding: 15px 14px 40px;
  border-radius: 20px;
  margin-top: 14px;
}

.isMobile .hero-copy {
  max-width: 60%;
}

.isMobile .hero-title {
  font-size: 16px;
}

.isMobile .hero-tagline {
  margin: 6px 0 4px;
  font-size: 12px;
}

.isMobile .hero-caption {
  font-size: 10px;
  line-height: 1.4;
}

.isMobile .hero-image {
  right: 8px;
  bottom: 6px;
  width: 96px;
  max-width: 38%;
}

.isMobile .service-panel {
  margin: -12px 0 0;
  padding: 8px;
  border-radius: 18px;
}

.isMobile .service-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
}

.isMobile .service-card {
  min-height: 78px;
  padding: 8px 6px 7px;
  border-radius: 14px;
  gap: 3px;
}

.isMobile .service-card__icon {
  width: 32px;
  height: 32px;
}

.isMobile .service-card__title {
  font-size: 12px;
  line-height: 1.2;
}

.isMobile .service-card__desc {
  display: -webkit-box;
  font-size: 9px;
  line-height: 1.2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.isMobile .faq-card {
  min-height: auto;
  padding: 12px 12px 14px;
  border-radius: 18px;
}

.isMobile .faq-header {
  margin-bottom: 10px;
  font-size: 14px;
}

.isMobile .faq-item {
  width: auto;
  max-width: 100%;
  padding: 8px 12px;
  font-size: 12px;
  line-height: 1.35;
}
</style>

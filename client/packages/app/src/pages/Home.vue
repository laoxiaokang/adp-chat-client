<script setup lang="ts">
import {
  ADPChat,
  agentCardDefinitions,
  getAgentCardByAgentType,
  getAgentCardById,
  getAgentCardByTitle,
  type ApiConfig,
  type Application,
  type ChatConversation,
  type SelectedAgentCard
} from 'adp-chat-component'
import { computed, onMounted, ref, watch } from 'vue'
import { useUiStore } from '@/stores/ui'
import { logout } from '@/service/login'
import { httpService } from '@/service/httpService'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { languageMap } from '@/i18n'
import { getBaseURL } from '@/utils/url'
import Logo from '@/assets/img/app-logo.png'
import medicalHomeBg from '../../../adp-chat-component/src/assets/img/medical-home-bg.png'
import ServiceHome from '@/components/ServiceHome.vue'
import ArchiveHome from '@/components/ArchiveHome.vue'
import CommonTopNav from '@/components/CommonTopNav.vue'

type TopNavTab = 'archive' | 'consult' | 'service'

const router = useRouter()
const route = useRoute()
const uiStore = useUiStore()
const { t } = useI18n()

const currentApplicationId = ref('')
const currentConversationId = ref('')
const selectedAgentCard = ref<SelectedAgentCard | null>(null)
const availableApplications = ref<Application[]>([])
const isLoadingApplications = ref(false)

const apiConfig: ApiConfig = {
  baseURL: getBaseURL(),
  timeout: 1000 * 60,
  apiDetailConfig: {
    applicationListApi: '/application/list',
    conversationListApi: '/chat/conversations',
    conversationDetailApi: '/chat/messages',
    sendMessageApi: '/chat/message',
    rateApi: '/feedback/rate',
    shareApi: '/share/create',
    userInfoApi: '/account/info',
    uploadApi: '/file/upload',
    asrUrlApi: '/helper/asr/url',
    systemConfigApi: '/system/config'
  }
}

const languageOptions = computed(() => {
  return Object.entries(languageMap).map(([key, value]) => ({ key, value }))
})

const sideI18n = computed(() => ({
  more: t('common.more'),
  collapse: t('common.collapse'),
  today: t('common.today'),
  recent: t('common.recent'),
  switchTheme: t('sider.switchTheme'),
  selectLanguage: t('sider.selectLanguage'),
  logout: t('account.logout')
}))

const chatI18n = computed(() => ({
  uploading: t('common.uploading'),
  loading: t('common.loading'),
  thinking: t('common.thinking'),
  checkAll: t('operation.checkAll'),
  shareFor: t('operation.shareFor'),
  copyUrl: t('operation.copyUrl'),
  cancelShare: t('operation.cancelShare'),
  sendError: t('conversation.sendError'),
  networkError: t('conversation.networkError'),
  loginExpired: t('conversation.loginExpired'),
  createConversation: t('conversation.createConversation'),
  copySuccess: t('common.copySuccess'),
  copyFailed: t('common.copyFailed'),
  shareFailed: t('common.shareFailed'),
  rateFailed: t('common.rateFailed'),
  loadMoreFailed: t('common.loadMoreFailed'),
  getAppListFailed: t('common.getAppListFailed'),
  getConversationListFailed: t('common.getConversationListFailed'),
  getConversationDetailFailed: t('common.getConversationDetailFailed')
}))

const chatItemI18n = computed(() => ({
  thinking: t('conversation.thinking'),
  deepThinkingFinished: t('conversation.deepThinkingFinished'),
  deepThinkingExpand: t('conversation.deepThinkingExpand'),
  copy: t('operation.copy'),
  replay: t('operation.replay'),
  share: t('operation.share'),
  good: t('operation.good'),
  bad: t('operation.bad'),
  thxForGood: t('operation.thxForGood'),
  thxForBad: t('operation.thxForBad'),
  references: t('sender.references')
}))

const senderI18n = computed(() => ({
  placeholder: t('conversation.input.placeholder'),
  placeholderMobile: t('conversation.input.placeholderMobile'),
  uploadImg: t('sender.uploadImg'),
  startRecord: t('sender.startRecord'),
  stopRecord: t('sender.stopRecord'),
  answering: t('sender.answering'),
  notSupport: t('sender.notSupport'),
  uploadError: t('sender.uploadError'),
  recordTooLong: t('sender.recordTooLong'),
  asrServiceFailed: t('sender.asrServiceFailed'),
  recordFailed: t('sender.recordFailed'),
  chromeSecurityError: t('sender.chromeSecurityError'),
  browserNotSupport: t('sender.browserNotSupport'),
  audioContextNotSupport: t('sender.audioContextNotSupport'),
  webAudioApiNotSupport: t('sender.webAudioApiNotSupport'),
  mediaStreamSourceNotSupport: t('sender.mediaStreamSourceNotSupport')
}))

const currentTab = computed<TopNavTab>(() => {
  if (route.name === 'archive') {
    return 'archive'
  }
  if (route.name === 'service') {
    return 'service'
  }
  return 'consult'
})

const isServiceView = computed(() => currentTab.value === 'service')
const isConsultView = computed(() => currentTab.value === 'consult')
const navTone = computed<'light' | 'dark'>(() =>
  isConsultView.value ? 'dark' : 'light'
)

const shellStyle = computed(() => ({
  '--consult-medical-bg': `url("${medicalHomeBg}")`
}))

const updateFromUrl = () => {
  if (route.name === 'service' || route.name === 'archive') {
    currentApplicationId.value = ''
    currentConversationId.value = ''
  } else if (!route.params.conversationId) {
    currentApplicationId.value = (route.params.applicationId as string) || ''
    currentConversationId.value = ''
  } else {
    currentConversationId.value = route.params.conversationId as string
  }

  const queryCardId =
    typeof route.query.agentCardId === 'string' ? route.query.agentCardId : ''
  const queryCardType =
    typeof route.query.agentCardType === 'string'
      ? route.query.agentCardType
      : ''
  const queryCardTitle =
    typeof route.query.agentCardTitle === 'string'
      ? route.query.agentCardTitle
      : ''
  const queryCardDesc =
    typeof route.query.agentCardDesc === 'string'
      ? route.query.agentCardDesc
      : ''

  if (queryCardId && queryCardTitle) {
    const matchedCard = queryCardType
      ? getAgentCardById(queryCardId) || getAgentCardByAgentType(queryCardType)
      : getAgentCardByTitle(queryCardTitle) || getAgentCardById(queryCardId)

    selectedAgentCard.value = {
      id: matchedCard?.id || queryCardId,
      agentType: matchedCard?.agentType || queryCardType || queryCardId,
      title: queryCardTitle,
      desc: queryCardDesc
    }
  } else if (currentConversationId.value) {
    selectedAgentCard.value = null
  } else if (!currentApplicationId.value && !currentConversationId.value) {
    selectedAgentCard.value = null
  }
}

watch(
  [
    () => route.name,
    () => route.params.applicationId,
    () => route.params.conversationId,
    () => route.query.agentCardId,
    () => route.query.agentCardType,
    () => route.query.agentCardTitle,
    () => route.query.agentCardDesc
  ],
  () => updateFromUrl(),
  { immediate: true }
)

const getSelectedAgentCardQuery = () => {
  if (!selectedAgentCard.value) {
    return undefined
  }

  return {
    agentCardId: selectedAgentCard.value.id,
    agentCardType: selectedAgentCard.value.agentType,
    agentCardTitle: selectedAgentCard.value.title,
    agentCardDesc: selectedAgentCard.value.desc
  }
}

const ensureApplicationsLoaded = async () => {
  if (availableApplications.value.length > 0 || isLoadingApplications.value) {
    return availableApplications.value
  }

  isLoadingApplications.value = true
  try {
    const data = await httpService.get<Application[]>('/application/list')
    availableApplications.value = Array.isArray(data) ? data : []
  } catch (error) {
    console.error('load applications failed', error)
  } finally {
    isLoadingApplications.value = false
  }

  return availableApplications.value
}

watch(currentTab, async value => {
  if (value !== 'consult') {
    await ensureApplicationsLoaded()
  }
})

onMounted(async () => {
  if (!isConsultView.value) {
    await ensureApplicationsLoaded()
  }
})

const buildSelectedAgentCard = (cardId: string) => {
  const matchedCard = getAgentCardById(cardId)
  if (!matchedCard) {
    return null
  }

  return {
    id: matchedCard.id,
    agentType: matchedCard.agentType,
    title: matchedCard.title,
    desc: matchedCard.desc
  }
}

const getApplicationIdByCardId = (cardId: string) => {
  const fallbackId = availableApplications.value[0]?.ApplicationId || ''
  const cardIndex = agentCardDefinitions.findIndex(item => item.id === cardId)
  if (cardIndex < 0) {
    return fallbackId
  }
  return availableApplications.value[cardIndex]?.ApplicationId || fallbackId
}

const getApplicationIdFromSelection = (selection: Application | string) => {
  if (typeof selection === 'string') {
    return selection
  }
  return selection.ApplicationId || ''
}

let pendingApplicationSelectionToken = 0

const goToService = () => {
  currentApplicationId.value = ''
  currentConversationId.value = ''
  selectedAgentCard.value = null
  router.push({ name: 'service' })
}

const goToArchive = async () => {
  await ensureApplicationsLoaded()
  currentApplicationId.value = ''
  currentConversationId.value = ''
  selectedAgentCard.value = null
  router.push({ name: 'archive' })
}

const goToConsult = async (cardId?: string) => {
  await ensureApplicationsLoaded()

  const nextCard = cardId
    ? buildSelectedAgentCard(cardId)
    : selectedAgentCard.value || buildSelectedAgentCard('1')
  const nextApplicationId =
    currentApplicationId.value || getApplicationIdByCardId(nextCard?.id || '1')

  currentConversationId.value = ''
  currentApplicationId.value = nextApplicationId
  if (nextCard) {
    selectedAgentCard.value = nextCard
  }

  router.push({
    name: 'consult',
    params: nextApplicationId
      ? { applicationId: nextApplicationId }
      : undefined,
    query: nextCard
      ? {
          agentCardId: nextCard.id,
          agentCardType: nextCard.agentType,
          agentCardTitle: nextCard.title,
          agentCardDesc: nextCard.desc,
          sceneTs: String(Date.now())
        }
      : undefined
  })
}

const handleTopNavSelect = async (tab: TopNavTab) => {
  if (tab === currentTab.value) {
    return
  }

  if (tab === 'service') {
    goToService()
    return
  }

  if (tab === 'archive') {
    await goToArchive()
    return
  }

  await goToConsult()
}

const updateUrl = (query?: Record<string, string>) => {
  const nextQuery = query ?? getSelectedAgentCardQuery()

  if (currentConversationId.value === '') {
    if (currentApplicationId.value) {
      router.push({
        name: 'consult',
        params: { applicationId: currentApplicationId.value },
        query: nextQuery
      })
    } else {
      if (route.name === 'consult' || route.name === 'app') {
        return
      }
      router.push({ name: 'service' })
    }
  } else {
    router.push({
      name: 'home',
      params: { conversationId: currentConversationId.value },
      query: nextQuery
    })
  }
}

const handleSelectApplication = (selection: Application | string) => {
  const nextApplicationId = getApplicationIdFromSelection(selection)
  if (!nextApplicationId) {
    return
  }

  const token = ++pendingApplicationSelectionToken
  currentApplicationId.value = nextApplicationId
  currentConversationId.value = ''

  queueMicrotask(() => {
    if (token !== pendingApplicationSelectionToken) {
      return
    }

    selectedAgentCard.value = null
    updateUrl()
  })
}

const handleSelectAgentCard = (card: SelectedAgentCard) => {
  pendingApplicationSelectionToken += 1
  selectedAgentCard.value = card
  currentConversationId.value = ''

  const nextApplicationId =
    currentApplicationId.value || getApplicationIdByCardId(card.id)
  if (!nextApplicationId) {
    return
  }

  currentApplicationId.value = nextApplicationId

  updateUrl({
    agentCardId: card.id,
    agentCardType: card.agentType || card.id,
    agentCardTitle: card.title,
    agentCardDesc: card.desc,
    sceneTs: String(Date.now())
  })
}

const handleSelectConversation = (conversation: ChatConversation) => {
  currentConversationId.value = conversation.Id
  currentApplicationId.value = conversation.ApplicationId
  updateUrl()
}

const handleCreateConversation = () => {
  currentConversationId.value = ''
  selectedAgentCard.value = null
  updateUrl()
}

const handleToggleTheme = () => {
  const newTheme = uiStore.theme === 'light' ? 'dark' : 'light'
  uiStore.setTheme(newTheme)
}

const handleChangeLanguage = (key: string) => {
  uiStore.setLanguage(key as 'en' | 'zh')
}

const handleLogout = () => {
  logout(() => router.replace({ name: 'login' }))
}

const handleDataLoaded = (
  type: 'applications' | 'conversations' | 'chatList' | 'user',
  data: any
) => {
  if (type === 'applications' && data.length > 0) {
    availableApplications.value = data
    if (
      (route.name === 'consult' || route.name === 'app') &&
      !currentApplicationId.value &&
      !currentConversationId.value
    ) {
      currentApplicationId.value = data[0].ApplicationId
      updateUrl()
    }
  }
}

const handleConversationChange = (conversationId: string) => {
  if (!conversationId) {
    currentConversationId.value = ''
    return
  }

  currentConversationId.value = conversationId
  updateUrl()
}
</script>

<template>
  <div
    class="home-shell"
    :class="`home-shell--${currentTab}`"
    :style="shellStyle"
  >
    <header
      class="home-shell__header"
      :class="`home-shell__header--${navTone}`"
    >
      <div class="home-shell__header-inner">
        <CommonTopNav
          :activeTab="currentTab"
          :tone="navTone"
          @select="handleTopNavSelect"
        />
      </div>
    </header>

    <div v-if="isConsultView" class="home-shell__chat-body">
      <div class="home-shell__chat-inner">
        <ADPChat
          :apiConfig="apiConfig"
          :autoLoad="true"
          :theme="uiStore.theme || 'light'"
          :language="uiStore.language || 'zh'"
          :languageOptions="languageOptions"
          :isSidePanelOverlay="uiStore.isMobile"
          :showCloseButton="false"
          :showOverlayButton="false"
          :logoUrl="Logo"
          :logoTitle="t('project.projectName')"
          :currentApplicationId="currentApplicationId"
          :currentConversationId="currentConversationId"
          :selectedAgentCard="selectedAgentCard"
          :aiWarningText="t('common.aiWarning')"
          :sideI18n="sideI18n"
          :chatI18n="chatI18n"
          :chatItemI18n="chatItemI18n"
          :senderI18n="senderI18n"
          @selectApplication="handleSelectApplication"
          @selectAgentCard="handleSelectAgentCard"
          @selectConversation="handleSelectConversation"
          @createConversation="handleCreateConversation"
          @toggleTheme="handleToggleTheme"
          @changeLanguage="handleChangeLanguage"
          @logout="handleLogout"
          @dataLoaded="handleDataLoaded"
          @conversationChange="handleConversationChange"
        />
      </div>
    </div>

    <div v-else class="home-shell__scroll-body">
      <div class="home-shell__page">
        <ServiceHome
          v-if="isServiceView"
          :loading="isLoadingApplications"
          @openService="goToConsult"
        />
        <ArchiveHome
          v-else
          :loading="isLoadingApplications"
          @openConsult="goToConsult('1')"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-shell {
  --page-nav-offset: 52px;
  height: 100dvh;
  background:
    radial-gradient(
      circle at top left,
      rgba(154, 200, 255, 0.3),
      transparent 32%
    ),
    linear-gradient(180deg, #f5f7fb 0%, #eef2f8 100%);
  position: relative;
  overflow: hidden;
}

.home-shell--consult {
  --page-nav-offset: 52px;
  background:
    linear-gradient(
      180deg,
      rgba(239, 247, 255, 0.06) 0%,
      rgba(239, 247, 255, 0.26) 36%,
      rgba(238, 242, 248, 0.9) 100%
    ),
    var(--consult-medical-bg);
  background-position: center top;
  background-repeat: no-repeat;
  background-size: cover;
}

.home-shell :deep(button),
.home-shell :deep([role='button']),
.home-shell :deep(.t-button) {
  -webkit-tap-highlight-color: transparent;
}

.home-shell :deep(button:focus),
.home-shell :deep(button:focus-visible),
.home-shell :deep([role='button']:focus),
.home-shell :deep([role='button']:focus-visible),
.home-shell :deep(.t-button:focus),
.home-shell :deep(.t-button:focus-visible) {
  outline: none !important;
  box-shadow: none !important;
}

.home-shell__header {
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  z-index: 50;
  width: min(100%, 430px);
  pointer-events: none;
}

.home-shell__header-inner {
  padding: 24px 18px 8px;
  pointer-events: auto;
}

.home-shell__header--light .home-shell__header-inner {
  background: linear-gradient(
    180deg,
    rgba(88, 165, 255, 0.84) 0%,
    rgba(133, 198, 255, 0.34) 72%,
    rgba(133, 198, 255, 0) 100%
  );
}

.home-shell--consult .home-shell__header-inner {
  background: transparent;
}

.home-shell__header--dark .home-shell__header-inner {
  background: linear-gradient(
    180deg,
    rgba(246, 249, 253, 0.98) 0%,
    rgba(246, 249, 253, 0.88) 74%,
    rgba(246, 249, 253, 0) 100%
  );
  backdrop-filter: blur(10px);
}

.home-shell__scroll-body {
  height: 100dvh;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}

.home-shell__page {
  width: 100%;
  max-width: 430px;
  margin: 0 auto;
  min-height: 100%;
}

.home-shell__chat-body {
  height: 100dvh;
  padding-top: var(--page-nav-offset);
  box-sizing: border-box;
  background: transparent;
}

.home-shell__chat-inner {
  height: 100%;
}

.home-shell__chat-inner :deep(.t-chat),
.home-shell__chat-inner :deep(.t-chat__inner),
.home-shell__chat-inner :deep(.t-chat__list),
.home-shell__chat-inner :deep(.t-chat__footer),
.home-shell__chat-inner :deep(.t-chat__body),
.home-shell__chat-inner :deep(.t-chat__inner > div) {
  background: transparent !important;
}

.home-shell__chat-inner :deep(.chat-container),
.home-shell__chat-inner :deep(.main-layout),
.home-shell__chat-inner :deep(.main-layout-container),
.home-shell__chat-inner :deep(.layout-container),
.home-shell__chat-inner :deep(.t-layout) {
  height: 100%;
}

@media (min-width: 768px) {
  .home-shell__header {
    width: min(100%, 460px);
  }

  .home-shell__page {
    max-width: 460px;
  }
}
</style>

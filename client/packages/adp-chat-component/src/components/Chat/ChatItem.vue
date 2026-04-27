<!-- 聊天消息项组件，支持 Markdown、深度思考、操作按钮等 -->
<script setup lang="tsx">
import { ref, computed, watch } from 'vue'
import type {
  Content,
  Message,
  QuoteInfo,
  Record as RecordV2,
  Reference as ReferenceV2
} from '../../model/chat-v2'
import { ScoreValue } from '../../model/chat-v2'
import type { CommonLayoutProps, ChatItemI18n } from '../../model/type'
import {
  commonLayoutPropsDefaults,
  defaultChatItemI18n
} from '../../model/type'
import { ChatItem as TChatItem } from '@tdesign-vue-next/chat'
import {
  Tooltip,
  Loading as TLoading,
  Link as TLink,
  Dialog as TDialog
} from 'tdesign-vue-next'
import OptionCard from '../Common/OptionCard.vue'
import MdContent from '../Common/MdContent.vue'
import WidgetActionTag from '../Common/WidgetActionTag.vue'
import CustomizedIcon from '../CustomizedIcon.vue'
import { widgetContentToMarkdown } from '../../utils/mergeRecord-v2'

interface Props extends CommonLayoutProps {
  /** 当前聊天记录项 */
  item: RecordV2
  /** 当前项的索引 */
  index: number
  /** 是否为最后一条消息 */
  isLastMsg?: boolean
  /** 是否正在加载 */
  loading: boolean
  /** 是否为流式加载 */
  isStreamLoad: boolean
  /** 是否显示操作按钮 */
  showActions?: boolean
  /** 国际化文本 */
  i18n?: ChatItemI18n
  /** 当前语言标识（如 'zh-CN'、'en-US'），用于 widget 国际化 */
  language?: string
}

const props = withDefaults(defineProps<Props>(), {
  isLastMsg: false,
  showActions: true,
  language: 'zh-CN',
  ...commonLayoutPropsDefaults,
  i18n: () => ({})
})

const i18n = computed(() => ({
  ...defaultChatItemI18n,
  ...props.i18n
}))

const emit = defineEmits<{
  (e: 'resend', relatedRecordId: string | undefined): void
  (e: 'share', recordIds: string[]): void
  (
    e: 'rate',
    record: RecordV2,
    score: (typeof ScoreValue)[keyof typeof ScoreValue]
  ): void
  (
    e: 'copy',
    rowtext: string | undefined,
    content: string | undefined,
    type: string
  ): void
  (e: 'sendMessage', message: string): void
  (
    e: 'widgetEvent',
    event: CustomEvent,
    widgetRunId: string,
    widgetId: string,
    recordId: string
  ): void
}>()

type ChatRecord = RecordV2 & {
  Score?: (typeof ScoreValue)[keyof typeof ScoreValue]
}
type QuoteInfoLike = QuoteInfo
type ReferenceLike = ReferenceV2

const record = ref(props.item as ChatRecord)
const expandStatus = ref(false)
const referenceDialogVisible = ref(false)
const activeReference = ref<ReferenceLike | null>(null)

watch(
  () => props.item,
  newItem => {
    record.value = newItem as ChatRecord
  },
  { deep: true }
)

const isFromSelf = computed(() => {
  return record.value.Role === 'user'
})

const messages = computed(() => record.value.Messages ?? [])

const primaryMessage = computed(() => {
  const list = messages.value
  if (list.length === 0) return undefined
  if (isFromSelf.value) {
    return list.find(msg => msg.Type === 'question') ?? list[0]
  }
  return list.find(msg => msg.Type === 'reply')
})

const shouldSkipWidgetRenderInStream = computed(() => {
  return props.isStreamLoad && props.isLastMsg && !isFromSelf.value
})

const extractMessageText = (message?: Message) => {
  if (!message?.Contents?.length) return ''
  return message.Contents.map(content => {
    const parts: string[] = []
    if (content.Text) {
      parts.push(content.Text)
    }
    if (content.Type === 'widget' && content.Widget) {
      if (shouldSkipWidgetRenderInStream.value) {
        return ''
      }
      const widgetMarkdown = widgetContentToMarkdown(content)
      if (widgetMarkdown) {
        parts.push(widgetMarkdown)
      }
    }
    return parts.join('')
  })
    .filter(text => text.length > 0)
    .join('\n')
}

const displayText = computed(() => {
  return extractMessageText(primaryMessage.value)
})

const reasoningMessages = computed(() => {
  return messages.value.filter(msg => msg.Type === 'thought')
})

const reasoningContents = computed(() => {
  return reasoningMessages.value
    .map(msg => extractMessageText(msg))
    .filter(text => text.length > 0)
})

const collectFromMessageContents = <T,>(
  message: Message | undefined,
  picker: (content: Content) => T[] | undefined
): T[] => {
  const values: T[] = []
  for (const content of message?.Contents ?? []) {
    const picked = picker(content)
    if (picked?.length) {
      values.push(...picked)
    }
  }
  return values
}

const optionCards = computed(() => {
  return collectFromMessageContents(
    primaryMessage.value,
    content => content.OptionCards ?? []
  )
})

const quoteInfos = computed<QuoteInfoLike[]>(() => {
  return collectFromMessageContents(
    primaryMessage.value,
    content => content.QuoteInfos ?? []
  )
})

const references = computed<ReferenceLike[]>(() => {
  return collectFromMessageContents(
    primaryMessage.value,
    content => content.References ?? []
  )
})

const isFinal = computed(() => {
  return record.value.Status !== 'processing'
})

const isWidgetAction = computed(() => {
  if (!isFromSelf.value) return false
  const message = primaryMessage.value
  if (!message?.Contents?.length) return false
  return message.Contents.some(content => content.Type === 'widget_action')
})

const recordScore = computed(() => record.value.Score)

const canRate = computed(() => {
  return record.value.ExtraInfo?.CanRating !== false
})

async function copyContent(
  event: any,
  content: string | undefined,
  type: string
): Promise<void> {
  let rowtext: string | undefined
  const container = event?.target as HTMLElement
  const markdownElements = container
    ?.closest('.t-chat__content')
    ?.querySelectorAll('.markdown-body')
  rowtext =
    markdownElements && markdownElements.length > 0
      ? markdownElements[markdownElements.length - 1]?.textContent || undefined
      : undefined
  emit('copy', rowtext, content, type)
}

const isRated = () => {
  const score = recordScore.value
  return score !== undefined && score !== null && score !== ScoreValue.Unknown
}

const rate = async (
  target: RecordV2,
  score: (typeof ScoreValue)[keyof typeof ScoreValue]
) => {
  if (!canRate.value || isRated()) return
  emit('rate', target, score)
}

const share = async (target: RecordV2) => {
  const shareList = [target.RecordId]
  if (target.RelatedRecordId) {
    shareList.push(target.RelatedRecordId)
  }
  emit('share', shareList)
}

const renderHeader = () => {
  const endText = expandStatus.value
    ? i18n.value.deepThinkingFinished
    : i18n.value.deepThinkingExpand
  return (
    <div class="flex collapsed-thinking-text">
      <span>{endText}</span>
    </div>
  )
}

const renderReasoningContent = (contents: string[]) => {
  if (contents.length === 0) return <div></div>
  return (
    <div>
      {contents.map((content, index) => (
        <MdContent
          content={content}
          role="system"
          theme={props.theme}
          language={props.language}
          key={index}
        />
      ))}
    </div>
  )
}

const renderReasoning = () => {
  if (reasoningContents.value.length === 0) {
    return false
  }
  return {
    collapsed: props.isLastMsg && !props.isStreamLoad,
    expandIcon: false,
    expandIconPlacement: 'right' as const,
    onExpandChange: (e: boolean) => {
      expandStatus.value = e
    },
    collapsePanelProps: {
      expandIcon: false,
      header: renderHeader(),
      content: renderReasoningContent(reasoningContents.value)
    }
  }
}

const getReferenceUrl = (reference: ReferenceLike) => {
  return (
    reference.Url || reference.DocRefer?.Url || reference.WebSearchRefer?.Url
  )
}

const handleSendMessage = (message: string) => {
  emit('sendMessage', message)
}

const handleWidgetEvent = (
  event: CustomEvent,
  widgetRunId: string,
  widgetId: string
) => {
  emit('widgetEvent', event, widgetRunId, widgetId, record.value.RecordId || '')
}

const openReferenceDialog = (reference: ReferenceLike) => {
  activeReference.value = reference
  referenceDialogVisible.value = true
}

const isSliceReference = (reference: ReferenceLike) => {
  return (
    reference.Type === 2 && Boolean(reference.PageContent || reference.OrgData)
  )
}

const getReferenceId = (reference: ReferenceLike) => {
  return (
    reference.Id ||
    reference.DocRefer?.ReferenceId ||
    reference.ReferBizId ||
    reference.DocRefer?.ReferBizId
  )
}

const getReferenceTitle = (reference: ReferenceLike) => {
  return (
    reference.DocRefer?.DocName ||
    reference.DocName ||
    reference.Name ||
    '未命名来源'
  )
}

const getReferenceContent = (reference: ReferenceLike) => {
  return reference.PageContent || reference.OrgData || ''
}

const getReferenceMeta = (reference: ReferenceLike) => {
  const meta: string[] = []
  if (reference.PageInfos && reference.PageInfos.length > 0) {
    meta.push(`P${reference.PageInfos.join(', ')}`)
  }
  if (reference.SheetInfos && reference.SheetInfos.length > 0) {
    meta.push(reference.SheetInfos.join(', '))
  }
  return meta.join(' · ')
}

const getReferencePreview = (reference: ReferenceLike) => {
  return getReferenceContent(reference).replace(/\s+/g, ' ').trim()
}

const referenceDialogTitle = computed(() => {
  if (!activeReference.value) {
    return i18n.value.referenceSlice
  }
  return getReferenceTitle(activeReference.value)
})
</script>

<template>
  <div v-if="isFromSelf && isWidgetAction" class="widget-action-row">
    <WidgetActionTag :text="i18n.actionPerformed" />
  </div>
  <TChatItem
    v-else
    animation="skeleton"
    :role="isFromSelf ? 'user' : 'assistant'"
    :text-loading="false"
    :reasoning="renderReasoning()"
  >
    <template #content>
      <div
        v-if="
          isLastMsg &&
          isStreamLoad &&
          !displayText &&
          reasoningContents.length === 0
        "
        class="loading-container"
      >
        <TLoading size="small">
          <template #text>
            <span class="thinking-text">
              {{ `${i18n.thinking}...` }}
            </span>
          </template>
          <template #indicator>
            <CustomizedIcon
              class="thinking-icon"
              name="thinking"
              :theme="theme"
              nativeIcon
              :showHoverBg="false"
            />
          </template>
        </TLoading>
      </div>
      <div v-else>
        <div v-if="isFromSelf" class="user-message-shell">
          <div class="user-message">
            <MdContent
              :content="displayText"
              role="user"
              :theme="theme"
              :quoteInfos="quoteInfos"
              :language="language"
              :recordId="item.RecordId"
              :enableScale="isMobile"
              @widgetEvent="handleWidgetEvent"
            />
          </div>
          <div v-if="showActions && !isMobile" class="user-actions">
            <Tooltip
              :content="i18n.copy"
              destroyOnClose
              showArrow
              theme="default"
            >
              <button
                type="button"
                class="action-pill action-pill--user"
                @click="(e: any) => copyContent(e, displayText, 'user')"
              >
                <CustomizedIcon
                  size="s"
                  class="action-pill__icon"
                  name="copy"
                  :theme="theme"
                />
              </button>
            </Tooltip>
            <Tooltip
              :content="i18n.share"
              destroyOnClose
              showArrow
              theme="default"
            >
              <button
                type="button"
                class="action-pill action-pill--user"
                @click="share(item)"
              >
                <CustomizedIcon
                  size="s"
                  class="action-pill__icon"
                  name="share"
                  :theme="theme"
                />
              </button>
            </Tooltip>
          </div>
        </div>
        <div v-else class="assistant-card">
          <MdContent
            :content="displayText"
            role="assistant"
            :isStreamLoad="isStreamLoad && isLastMsg"
            :theme="theme"
            :quoteInfos="quoteInfos"
            :language="language"
            :recordId="item.RecordId"
            :disable="!isLastMsg"
            :enableScale="isMobile"
            @widgetEvent="handleWidgetEvent"
          />
          <OptionCard
            v-if="optionCards && optionCards.length"
            :cards="optionCards"
            :sendMessage="handleSendMessage"
          />
          <div
            class="references-container"
            v-if="references && references.length > 0 && isFinal"
          >
            <span class="title">{{ i18n.references }}: </span>
            <ol class="reference-list">
              <li
                v-for="(reference, idx) in references"
                :key="`${getReferenceId(reference) || getReferenceUrl(reference) || getReferenceTitle(reference) || idx}-${idx}`"
                class="reference-list__item"
              >
                <button
                  v-if="isSliceReference(reference)"
                  type="button"
                  class="reference-slice__trigger"
                  @click="openReferenceDialog(reference)"
                >
                  <div class="reference-slice__header">
                    <span class="reference-slice__name">{{
                      getReferenceTitle(reference)
                    }}</span>
                  </div>
                  <div
                    v-if="getReferenceMeta(reference)"
                    class="reference-slice__meta"
                  >
                    {{ getReferenceMeta(reference) }}
                  </div>
                  <div class="reference-slice__preview">
                    {{ getReferencePreview(reference) }}
                  </div>
                </button>
                <TLink
                  v-else-if="getReferenceUrl(reference)"
                  class="reference-link"
                  theme="primary"
                  :href="getReferenceUrl(reference)"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {{ getReferenceTitle(reference) }}
                </TLink>
                <span v-else class="reference-link">
                  {{ getReferenceTitle(reference) }}
                </span>
                <div
                  v-if="getReferenceMeta(reference)"
                  class="reference-link__meta"
                >
                  {{ getReferenceMeta(reference) }}
                </div>
              </li>
            </ol>
          </div>
          <div
            v-if="showActions && (!isStreamLoad || !isLastMsg)"
            class="assistant-actions"
            :class="{ isMobile: isMobile }"
          >
            <Tooltip
              :content="i18n.copy"
              destroyOnClose
              showArrow
              theme="default"
            >
              <button
                type="button"
                class="action-pill"
                @click="(e: any) => copyContent(e, displayText, 'assistant')"
              >
                <CustomizedIcon
                  size="s"
                  class="action-pill__icon"
                  name="copy"
                  :theme="theme"
                />
              </button>
            </Tooltip>
            <Tooltip
              :content="i18n.replay"
              destroyOnClose
              showArrow
              theme="default"
            >
              <button
                type="button"
                class="action-pill"
                @click="emit('resend', item.RelatedRecordId)"
              >
                <CustomizedIcon
                  size="s"
                  class="action-pill__icon"
                  name="refresh"
                  :theme="theme"
                />
              </button>
            </Tooltip>
            <Tooltip
              :content="i18n.share"
              destroyOnClose
              showArrow
              theme="default"
            >
              <button type="button" class="action-pill" @click="share(item)">
                <CustomizedIcon
                  size="s"
                  class="action-pill__icon"
                  name="share"
                  :theme="theme"
                />
              </button>
            </Tooltip>
            <Tooltip
              :content="i18n.good"
              destroyOnClose
              showArrow
              theme="default"
            >
              <button
                type="button"
                class="action-pill"
                :class="{
                  disabled:
                    !canRate || (isRated() && recordScore !== ScoreValue.Like),
                  'not-allowed': isRated() || !canRate
                }"
                @click="rate(item, ScoreValue.Like)"
              >
                <CustomizedIcon
                  size="s"
                  class="action-pill__icon"
                  :name="
                    recordScore === ScoreValue.Like
                      ? 'thumbs_up_active'
                      : 'thumbs_up'
                  "
                  :nativeIcon="record.Score === ScoreValue.Like"
                  :theme="theme"
                />
              </button>
            </Tooltip>
            <Tooltip
              :content="i18n.bad"
              destroyOnClose
              showArrow
              theme="default"
            >
              <button
                type="button"
                class="action-pill"
                :class="{
                  disabled:
                    !canRate ||
                    (isRated() && recordScore !== ScoreValue.Dislike),
                  'not-allowed': isRated() || !canRate
                }"
                @click="rate(item, ScoreValue.Dislike)"
              >
                <CustomizedIcon
                  size="s"
                  class="action-pill__icon"
                  :name="
                    recordScore === ScoreValue.Dislike
                      ? 'thumbs_down_active'
                      : 'thumbs_down'
                  "
                  :nativeIcon="record.Score === ScoreValue.Dislike"
                  :theme="theme"
                />
              </button>
            </Tooltip>
          </div>
        </div>
      </div>
    </template>
  </TChatItem>
  <TDialog
    v-model:visible="referenceDialogVisible"
    :header="referenceDialogTitle"
    :footer="false"
    :width="isMobile ? '92%' : '80%'"
    top="5vh"
    destroy-on-close
  >
    <div v-if="activeReference" class="reference-dialog">
      <div
        v-if="getReferenceMeta(activeReference)"
        class="reference-dialog__meta"
      >
        {{ getReferenceMeta(activeReference) }}
      </div>
      <div
        v-if="getReferenceUrl(activeReference)"
        class="reference-dialog__link"
      >
        <TLink
          theme="primary"
          :href="getReferenceUrl(activeReference)"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ i18n.openSource }}
        </TLink>
      </div>
      <div class="reference-dialog__content">
        <MdContent
          :content="getReferenceContent(activeReference)"
          role="assistant"
          :theme="theme"
          :language="language"
        />
      </div>
    </div>
  </TDialog>
</template>

<style scoped>
.widget-action-row {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--td-comp-margin-l);
}

.flex {
  display: flex;
  align-items: center;
}

.user-message-shell {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.user-message {
  position: relative;
  width: fit-content;
  max-width: min(100%, 680px);
  padding: 10px 14px;
  border-radius: 18px 18px 6px 18px;
  background: linear-gradient(135deg, #54b6ff 0%, #5a88ff 100%);
  border: 1px solid rgba(255, 255, 255, 0.45);
  box-shadow: 0 10px 24px rgba(78, 138, 231, 0.18);
}

.user-message :deep(.markdown-body),
.user-message :deep(.markdown-body p),
.user-message :deep(.markdown-body li),
.user-message :deep(.markdown-body span) {
  color: #fff !important;
}

.assistant-card {
  width: 100%;
  background: rgba(255, 255, 255, 0.96);
  border-radius: 8px 18px 18px 18px;
  padding: 16px;
  border: 1px solid rgba(180, 210, 229, 0.42);
  box-shadow: 0 14px 32px rgba(117, 167, 196, 0.14);
}

.check-circle {
  color: var(--td-success-color-5);
  font-size: var(--td-font-size-title-large);
  margin-right: var(--td-comp-margin-s);
}

.icon.disabled,
.action-pill.disabled {
  opacity: 0.25;
  cursor: not-allowed;
}

.icon.not-allowed,
.action-pill.not-allowed {
  cursor: not-allowed;
}

.icon:hover,
.action-pill:hover .action-pill__icon {
  color: var(--td-brand-color);
}

.user-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.assistant-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(176, 208, 228, 0.46);
}

.action-pill {
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 999px;
  background: #f2f8fc;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  cursor: pointer;
  transition:
    background-color 0.18s ease,
    transform 0.18s ease;
}

.action-pill:hover {
  background: #e8f3fb;
  transform: translateY(-1px);
}

.action-pill--user {
  background: rgba(255, 255, 255, 0.2);
}

.action-pill--user:hover {
  background: rgba(255, 255, 255, 0.32);
}

.action-pill__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.collapsed-thinking-text {
  color: var(--td-text-color-placeholder);
}

.loading-container {
  padding: 0;
}

.thinking-text {
  color: var(--td-text-color-primary);
  font-size: var(--td-font-size-link-medium);
  margin-left: var(--td-comp-margin-xs);
}

.thinking-icon {
  animation: rotate 2s linear infinite;
  width: var(--td-comp-size-xs);
  height: var(--td-comp-size-xs);
  padding: 0;
}

.references-container {
  margin-top: 12px;
  background: #f4f9fc;
  border-radius: 12px;
  padding: 12px;
}

.references-container .title {
  color: var(--td-text-color-secondary);
  display: inline-block;
  margin-bottom: 6px;
  font-weight: 500;
}

.reference-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.reference-list__item {
  background: #fff;
  border: 1px solid #dfebf2;
  border-radius: 8px;
  padding: 4px 10px;
}

.reference-slice__trigger {
  width: 100%;
  display: block;
  text-align: left;
  padding: var(--td-comp-paddingTB-s) var(--td-comp-paddingLR-m);
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-medium);
  background: var(--td-bg-color-container-hover);
  cursor: pointer;
}

.reference-slice__trigger:hover {
  background: var(--td-bg-color-container-select);
}

.reference-slice__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--td-comp-margin-s);
}

.reference-slice__name {
  color: var(--td-text-color-primary);
  font-weight: 600;
}

.reference-slice__meta,
.reference-link__meta {
  color: var(--td-text-color-placeholder);
  font-size: var(--td-font-size-body-small);
  margin-top: var(--td-comp-margin-xxs);
}

.reference-slice__preview {
  color: var(--td-text-color-secondary);
  margin-top: var(--td-comp-margin-xs);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}

.reference-link {
  word-break: break-word;
}

.reference-dialog {
  max-height: min(70vh, 720px);
  overflow: auto;
}

.reference-dialog__meta {
  color: var(--td-text-color-placeholder);
  font-size: var(--td-font-size-body-small);
  margin-bottom: var(--td-comp-margin-xs);
}

.reference-dialog__link {
  margin-bottom: var(--td-comp-margin-s);
}

.reference-dialog__content {
  color: var(--td-text-color-primary);
  word-break: break-word;
  line-height: 1.7;
}

:deep(.t-chat__actions-margin) {
  width: 100%;
  padding: 0;
  margin-left: 0;
}

.chat-item__container.loading {
  padding-bottom: 32px;
}

.isMobile .assistant-card {
  padding: 14px;
}

.isMobile .user-message {
  max-width: min(100%, 88vw);
  padding: 9px 12px;
}

.isMobile .assistant-actions {
  gap: 6px;
}

.isMobile .action-pill {
  width: 26px;
  height: 26px;
}
</style>

<!-- 消息发送组件，支持文本、图片上传、语音输入 -->
<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import { ChatSender as TChatSender } from '@tdesign-vue-next/chat';
import { MessagePlugin, Upload as TUpload, Tooltip as TTooltip } from 'tdesign-vue-next';
import type { UploadFile, RequestMethodResponse } from 'tdesign-vue-next';
import type { FileProps } from '../../model/file';
import { MessageCode, getMessage } from '../../model/messages';
import type { ChatRelatedProps, SenderI18n } from '../../model/type';
import { chatRelatedPropsDefaults, defaultSenderI18n, defaultSenderI18nEn } from '../../model/type';
import FileList from '../Common/FileList.vue';
import CustomizedIcon from '../CustomizedIcon.vue';
import WebRecorder from '../../utils/webRecorder';
import { getAsrUrl } from '../../service/api';
import voiceIcon from '../../assets/img/voice-icon.png';
import plusCircleIcon from '../../assets/img/plus-circle-icon.png';

export interface Props extends ChatRelatedProps {
    /** 是否正在流式加载 */
    isStreamLoad?: boolean;
    /** 是否使用内部录音处理（API 模式） */
    useInternalRecord?: boolean;
    /** ASR URL API 路径 */
    asrUrlApi?: string;
    /** 是否启用语音输入 */
    enableVoiceInput?: boolean;
    /** 是否显示欢迎态快捷问题 */
    showLandingPrompts?: boolean;
    /** 欢迎态快捷问题 */
    landingPrompts?: string[];
    /** 国际化文本 */
    i18n?: SenderI18n;
}

const props = withDefaults(defineProps<Props>(), {
    ...chatRelatedPropsDefaults,
    isStreamLoad: false,
    useInternalRecord: false,
    asrUrlApi: '',
    enableVoiceInput: true,
    showLandingPrompts: false,
    landingPrompts: () => [],
    i18n: () => ({})
});

const i18n = computed(() => {
    const defaults = props.language?.startsWith('en') ? defaultSenderI18nEn : defaultSenderI18n;
    return { ...defaults, ...props.i18n };
});

const emit = defineEmits<{
    (e: 'stop'): void;
    (e: 'send', value: string, fileList: FileProps[]): void;
    (e: 'uploadFile', files: File[]): void;
    (e: 'startRecord'): void;
    (e: 'stopRecord'): void;
    (e: 'message', code: MessageCode, message: string): void;
}>();

const inputValue = ref('');
const inputValueBefore = ref('');
const recording = ref(false);
const fileList = ref([] as FileProps[]);
const recorder = ref<WebRecorder | null>(null);
const asrWebSocket = ref<WebSocket | null>(null);
const recordMaxTime = 60;
const recordRef = ref<ReturnType<typeof setTimeout> | null>(null);
const chatSenderRef = ref<InstanceType<typeof TChatSender> | null>(null);

onMounted(() => {
    nextTick(() => {
        const textarea = chatSenderRef.value?.$el?.querySelector('textarea');
        if (textarea) {
            textarea.setAttribute('enterkeyhint', 'send');
        }
    });
});

const handleInput = (value: string) => {
    inputValue.value = value;
};

const handleFileSelect = async function (files: UploadFile | UploadFile[]): Promise<RequestMethodResponse> {
    const fileArray = Array.isArray(files) ? files : [files];
    if (fileArray.length <= 0) return { status: 'success', response: {} };
    const allowed = ['image/png', 'image/jpg', 'image/jpeg', 'image/bmp'];
    const validFiles: File[] = [];

    fileArray.forEach((item: UploadFile) => {
        const file = item.raw || item;
        if (file instanceof File && !allowed.includes(file.type)) {
            const text = i18n.value.notSupport || getMessage(MessageCode.FILE_FORMAT_NOT_SUPPORT).message;
            MessagePlugin.error(text);
            emit('message', MessageCode.FILE_FORMAT_NOT_SUPPORT, text);
            return;
        }
        if (file instanceof File) {
            validFiles.push(file);
        }
    });

    if (validFiles.length > 0) {
        emit('uploadFile', validFiles);
    }
    return { status: 'success', response: {} };
};

const handleDeleteFile = (index: number) => {
    fileList.value.splice(index, 1);
    fileList.value = [...fileList.value];
};

const handleSend = async function (value: string) {
    if (props.isStreamLoad) {
        const text = i18n.value.answering || getMessage(MessageCode.ANSWERING).message;
        MessagePlugin.warning(text);
        emit('message', MessageCode.ANSWERING, text);
        return;
    }

    handleStopRecord();

    let query = '';
    for (const file of fileList.value) {
        if (file.status === 'done' && file.url) {
            query += `![](${file.url})`;
        }
    }
    query += value;

    emit('send', query, fileList.value);
    inputValue.value = '';
    fileList.value = [];
};

const handleStartRecord = async () => {
    recording.value = true;

    if (props.useInternalRecord) {
        try {
            const res = await getAsrUrl(props.asrUrlApi || undefined);
            inputValueBefore.value = inputValue.value;
            asrWebSocket.value = new WebSocket(res.url);

            asrWebSocket.value.onopen = () => {
                startRecording();
                recordRef.value = setTimeout(() => {
                    if (recording.value) {
                        const text = i18n.value.recordTooLong || getMessage(MessageCode.RECORD_TOO_LONG).message;
                        MessagePlugin.warning(text);
                        emit('message', MessageCode.RECORD_TOO_LONG, text);
                        handleStopRecord();
                    }
                }, recordMaxTime * 1000);
            };

            asrWebSocket.value.onmessage = (event) => {
                if (!recording.value) return;
                const msg = JSON.parse(event.data);
                if ('result' in msg) {
                    inputValue.value = inputValueBefore.value + msg.result.voice_text_str;
                }
                if ('message' in msg && 'code' in msg && msg.code !== 0) {
                    MessagePlugin.error(msg.message);
                    emit('message', MessageCode.ASR_SERVICE_FAILED, msg.message);
                }
            };

            asrWebSocket.value.onclose = () => {
                recording.value = false;
                if (recordRef.value) {
                    clearTimeout(recordRef.value);
                    recordRef.value = null;
                }
            };
        } catch (error) {
            recording.value = false;
            const text = i18n.value.asrServiceFailed || getMessage(MessageCode.ASR_SERVICE_FAILED).message;
            MessagePlugin.error(text);
            emit('message', MessageCode.ASR_SERVICE_FAILED, text);
        }
    }

    emit('startRecord');
};

const startRecording = () => {
    const requestId = '0';
    recorder.value = new WebRecorder({ requestId });
    recorder.value.OnReceivedData = (data) => {
        if (asrWebSocket.value?.readyState === WebSocket.OPEN) {
            asrWebSocket.value.send(data);
        }
    };
    recorder.value.OnError = (err) => {
        let errMsg: string;
        let errCode: MessageCode = MessageCode.RECORD_FAILED;
        if (err && typeof err === 'object' && 'code' in err) {
            const errorCodeMap: Record<string, { i18nKey: keyof SenderI18n; messageCode: MessageCode }> = {
                CHROME_SECURITY_ERROR: { i18nKey: 'chromeSecurityError', messageCode: MessageCode.CHROME_SECURITY_ERROR },
                BROWSER_NOT_SUPPORT: { i18nKey: 'browserNotSupport', messageCode: MessageCode.BROWSER_NOT_SUPPORT },
                AUDIO_CONTEXT_NOT_SUPPORT: { i18nKey: 'audioContextNotSupport', messageCode: MessageCode.AUDIO_CONTEXT_NOT_SUPPORT },
                WEB_AUDIO_API_NOT_SUPPORT: { i18nKey: 'webAudioApiNotSupport', messageCode: MessageCode.WEB_AUDIO_API_NOT_SUPPORT },
                MEDIA_STREAM_SOURCE_NOT_SUPPORT: { i18nKey: 'mediaStreamSourceNotSupport', messageCode: MessageCode.MEDIA_STREAM_SOURCE_NOT_SUPPORT },
            };
            const mapping = errorCodeMap[err.code as string];
            if (mapping) {
                errMsg = i18n.value[mapping.i18nKey] || getMessage(mapping.messageCode).message;
                errCode = mapping.messageCode;
            } else {
                errMsg = i18n.value.recordFailed || getMessage(MessageCode.RECORD_FAILED).message;
            }
        } else {
            errMsg = typeof err === 'string' ? err : (i18n.value.recordFailed || getMessage(MessageCode.RECORD_FAILED).message);
        }
        MessagePlugin.error(errMsg);
        emit('message', errCode, errMsg);
        recording.value = false;
    };
    recorder.value.start();
};

const handleStopRecord = () => {
    if (!recording.value) return;
    recording.value = false;

    if (props.useInternalRecord) {
        recorder.value?.stop();
        recorder.value = null;
        asrWebSocket.value?.close();
        asrWebSocket.value = null;
        if (recordRef.value) {
            clearTimeout(recordRef.value);
            recordRef.value = null;
        }
    }

    emit('stopRecord');
};

const handlePaste = async (event: ClipboardEvent) => {
    try {
        const items = event.clipboardData?.items;
        if (!items || items.length === 0) {
            return;
        }

        const imageItems = Array.from(items)
            .filter((item: DataTransferItem) => item.type.includes('image'))
            .map((item: DataTransferItem) => item.getAsFile())
            .filter((file): file is File => file !== null);

        if (imageItems.length > 0) {
            handleFileSelect(imageItems);
        }
    } catch (error) {
        console.error('粘贴图片出错:', error);
    }
};

const handleSelectLandingPrompt = (prompt: string) => {
    inputValue.value = inputValue.value === prompt ? '' : prompt;
};

const changeSenderVal = (value: string, files: FileProps[]) => {
    inputValue.value = value;
    fileList.value = files;
};

const addFile = (file: FileProps) => {
    fileList.value.push(file);
};

const setRecording = (value: boolean) => {
    recording.value = value;
};

const updateInputValue = (value: string) => {
    inputValue.value = value;
};

defineExpose({
    changeSenderVal,
    addFile,
    setRecording,
    updateInputValue
});
</script>

<template>
    <div class="sender-wrapper" :class="{ 'is-landing': showLandingPrompts }">
        <div v-if="showLandingPrompts && landingPrompts.length > 0" class="landing-prompts">
            <button
                v-for="prompt in landingPrompts"
                :key="prompt"
                type="button"
                class="landing-prompt"
                :class="{ active: inputValue === prompt }"
                @click="handleSelectLandingPrompt(prompt)"
            >
                {{ prompt }}
            </button>
        </div>

        <TChatSender
            ref="chatSenderRef"
            class="sender-container"
            :value="inputValue"
            :textarea-props="{
                placeholder: isMobile ? i18n.placeholderMobile : i18n.placeholder,
                autosize: { minRows: 1, maxRows: 6 },
            }"
            @stop="emit('stop')"
            @send="handleSend"
            @change="handleInput"
            @paste="handlePaste"
        >
            <template #inner-header>
                <FileList :fileList="fileList" :theme="theme" @delete="handleDeleteFile" />
            </template>

            <template #prefix>
                <div class="sender-prefix">
                    <TTooltip v-if="enableVoiceInput && !recording" :content="i18n.startRecord">
                        <button type="button" class="media-button media-button--voice" @click="handleStartRecord">
                            <img :src="voiceIcon" alt="voice" />
                        </button>
                    </TTooltip>

                    <TTooltip v-if="enableVoiceInput && recording" :content="i18n.stopRecord">
                        <button type="button" class="media-button media-button--recording" @click="handleStopRecord">
                            <span class="recording-core">
                                <span class="recording-core__dot"></span>
                            </span>
                        </button>
                    </TTooltip>
                </div>
            </template>

            <template #suffix>
                <div class="sender-suffix">
                    <CustomizedIcon
                        v-if="isStreamLoad"
                        class="send-icon stop"
                        nativeIcon
                        :showHoverBg="false"
                        :name="theme === 'dark' ? 'pause_dark' : 'pause'"
                        @click="emit('stop')"
                    />

                    <CustomizedIcon
                        v-else-if="inputValue"
                        class="send-icon success"
                        nativeIcon
                        :showHoverBg="false"
                        name="send_fill"
                        @click="handleSend(inputValue)"
                    />

                    <TUpload
                        v-else
                        class="sender-upload"
                        :max="10"
                        :multiple="true"
                        :request-method="handleFileSelect"
                        accept="image/*"
                        theme="custom"
                    >
                        <TTooltip :content="i18n.uploadImg">
                            <button type="button" class="media-button media-button--upload">
                                <img :src="plusCircleIcon" alt="upload" />
                            </button>
                        </TTooltip>
                    </TUpload>
                </div>
            </template>
        </TChatSender>
    </div>
</template>

<style scoped>
.sender-wrapper {
    width: 100%;
    max-width: 720px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.landing-prompts {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    width: 100%;
}

.landing-prompt {
    border: 0;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.86);
    color: #526071;
    padding: 8px 12px;
    font-size: 13px;
    line-height: 1.2;
    box-shadow: 0 10px 20px rgba(121, 173, 204, 0.1);
    cursor: pointer;
}

.landing-prompt.active {
    color: #248ff7;
    background: rgba(255, 255, 255, 0.98);
    box-shadow: inset 0 0 0 1.5px rgba(36, 143, 247, 0.24);
}

.sender-container {
    width: 100%;
}

.sender-prefix,
.sender-suffix {
    display: flex;
    align-items: center;
}

.media-button {
    border: 0;
    background: transparent;
    padding: 0;
    width: 28px;
    height: 28px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
}

.media-button img {
    width: 28px;
    height: 28px;
    display: block;
}

.media-button--recording {
    position: relative;
    border-radius: 999px;
    background: linear-gradient(180deg, #fef4f3 0%, #ffe9e7 100%);
    box-shadow: 0 6px 14px rgba(237, 108, 98, 0.18);
}

.media-button--recording::before {
    content: '';
    position: absolute;
    inset: -4px;
    border-radius: 999px;
    border: 1px solid rgba(237, 108, 98, 0.22);
    animation: recording-pulse 1.4s ease-out infinite;
}

.recording-core {
    width: 16px;
    height: 16px;
    border-radius: 999px;
    background: rgba(237, 108, 98, 0.14);
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.recording-core__dot {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: #ed6c62;
    animation: recording-dot 1.2s ease-in-out infinite;
}

.send-icon {
    padding: 0 !important;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.sender-upload {
    display: inline-flex;
    align-items: center;
}

:deep(.sender-upload .t-upload) {
    display: inline-flex;
}

:deep(.t-chat-sender) {
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.82);
    background: rgba(255, 255, 255, 0.96);
    box-shadow: 0 16px 36px rgba(109, 165, 201, 0.16);
    padding: 4px 7px;
}

:deep(.t-chat-sender__textarea) {
    background: transparent;
    border-radius: 16px;
}

:deep(.t-chat-sender__textarea textarea) {
    color: #506174;
    font-size: 13px;
    line-height: 1.35;
    min-height: 18px;
    padding-top: 3px;
    padding-bottom: 3px;
}

:deep(.t-chat-sender__textarea textarea::placeholder) {
    color: #b8c0ca;
}

:deep(.t-chat-sender__footer) {
    padding: 0;
}

.is-landing :deep(.t-chat-sender) {
    border-radius: 16px;
}

@keyframes recording-pulse {
    0% {
        opacity: 0.85;
        transform: scale(0.94);
    }

    70% {
        opacity: 0;
        transform: scale(1.14);
    }

    100% {
        opacity: 0;
        transform: scale(1.14);
    }
}

@keyframes recording-dot {
    0%,
    100% {
        transform: scale(0.9);
    }

    50% {
        transform: scale(1.08);
    }
}

@media (max-width: 768px) {
    .sender-wrapper {
        gap: 6px;
    }

    .landing-prompt {
        padding: 6px 10px;
        font-size: 12px;
    }

    .media-button,
    .media-button img {
        width: 24px;
        height: 24px;
    }

    .recording-core {
        width: 14px;
        height: 14px;
    }

    .recording-core__dot {
        width: 7px;
        height: 7px;
    }

    :deep(.t-chat-sender) {
        padding: 4px 6px;
    }

    :deep(.t-chat-sender__textarea textarea) {
        font-size: 12px;
        min-height: 16px;
    }
}
</style>

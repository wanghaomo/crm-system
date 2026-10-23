<template>
    <AppPage :title="pageTitle" :showSearch="false" :showList="false">
        <template #content>
            <div class="market-report-add">
                <!-- 表单卡片 -->
                <div class="form-card">
                    <Form ref="formRef">
                        <field v-model="formData.title" name="title" label="标题" required placeholder="请输入标题" :rules="[{ required: true, message: '请输入标题', trigger: 'onBlur' }]">
                        </field>
                        <MxCommSelect v-model="formData.inputType" v-model:label="formData.inputTypeName" title="录入类型" name="inputType" :options="inputTypeOptions" :rules="[{ required: true, message: '请选择录入类型', trigger: 'change' }]" :clearable="true" />
                        <MxPersonSelect :clearable="true" title="发布人" :required="true" name="publishPersonId" placeholder="请选择发布人" :rules="[{ required: true, message: '请选择发布人', trigger: 'change' }]" v-model="formData.publishPersonId" v-model:label="formData.publishPersonName">
                        </MxPersonSelect>
                        <Field v-model="formData.publishTime" :is-link="true" :required="true" readonly name="publishTime" label="发布时间" placeholder="请选择" :rules="[{ required: true, message: '请选择发布时间', trigger: 'onChange' }]" @click="showDateTimePicker = true" />
                        <MxCommSelect v-model="formData.source" v-model:label="formData.source" title="信息来源" name="source" :required="true" :options="sourceOptions" :rules="[{ required: true, message: '请选择信息来源', trigger: 'onChange' }]" :clearable="true" :text="false" />
                        <Field :rules="[{ validator: validatorContent, trigger: 'onChange' }]" label-align="top" v-model="formData.content" :required="true" name="content" label="正文" :is-link="true" readonly @click="onOpenContentEditor">
                            <template #input>
                                <div class="content-preview" @click="onOpenContentEditor">
                                    <MxEditorPreview
                                        v-if="formData.content && formData.content !== '<p><br></p>'"
                                        :modelValue="formData.content"
                                        maxHeight="none" />
                                    <span v-else class="content-placeholder">请输入正文</span>
                                </div>
                            </template>
                        </Field>
                        <MxCommSelect v-model="formData.pushChatList" v-model:label="formData.pushChatListName" title="消息推送" name="pushChatList" :multiple="true" :options="larkChartList" :clearable="true" :text="false" />
                        <Field name="targetUrl" label-align="top" v-model="formData.targetUrl" label="目标网址" rows="3" autosize maxlength="500" show-word-limit clearable :rules="[
                            {
                                validator: validatorUrl,
                                trigger: 'onBlur',
                            },
                        ]" placeholder="请输入目标网址，需含http/https" />
                    </Form>
                </div>
            </div>
        </template>

        <!-- 底部按钮：保存 + 提交 -->
        <template #footer>
            <div class="bottom-btn-wrapper">
                <Button plain type="primary" block class="bottom-btn" @click="handleSubmit('save')">保存</Button>
                <Button type="primary" block class="bottom-btn" @click="handleSubmit('submit')">提交</Button>
            </div>
        </template>
    </AppPage>
    <Popup v-model:show="showDateTimePicker" position="bottom" round>
        <PickerGroup title="记录日期" next-step-text="下一步" :tabs="['选择日期', '选择时间']" @confirm="onDateTimeConfirm" @cancel="showDateTimePicker = false">
            <DatePicker v-model="currentDate" :min-date="minDate" :max-date="maxDate" />
            <TimePicker :columns-type="['hour', 'minute', 'second']" v-model="currentTime" />
        </PickerGroup>
    </Popup>
    <!-- 正文编辑弹窗 -->
    <Popup v-model:show="showContentEditor" position="bottom" :style="{ height: '100%' }">
        <div class="editor-popup">
            <div class="editor-popup-header">
                <span class="editor-popup-title">编辑正文</span>
                <span class="editor-popup-close" @click="onCancelContentEdit">
                    <Icon name="cross" size="20" />
                </span>
            </div>
            <div class="editor-popup-body">
                <MxEditor
                    :autoFocus="true"
                    v-model="tempContent"
                    minHeight="100%"
                    placeholder="请输入"
                    :upload-config="{ image: { enabled: true }, video: { enabled: true } }" />
            </div>
            <div class="editor-popup-footer">
                <Button type="primary" block class="editor-popup-btn submit" @click="onConfirmContentEdit">确定</Button>
            </div>
        </div>
    </Popup>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Form, Popup, Field, PickerGroup, DatePicker, TimePicker, Button, Icon } from 'vant';
import {
    industryNewsStatusMap,
    INDUSTRY_NEWS_STATUS_CONSTANT,
    inputTypeOptions,
    sourceOptions,
} from '@/constants/industryNews';
import { useUserStore } from '@/store/userStore';
import dayjs from 'dayjs';
import { createIndustryNewsApi, updateIndustryNewsApi, getIndustryNewsApi, getLarkChatListApi } from '@/api';
import MxEditor from '@/components/MxEditor/index.vue';
import MxEditorPreview from '@/components/MxEditor/preview.vue';

const route = useRoute();
const router = useRouter();

const currentDate = ref<any>([]);
const currentTime = ref<any>([]);
const minDate = new Date(2020, 0, 1);
const maxDate = new Date(2030, 11, 31);
const showDateTimePicker = ref<boolean>(false);
const showContentEditor = ref<boolean>(false);
const tempContent = ref<string>('');
const onDateTimeConfirm = (row: any) => {
    console.log(row);
    const dateArr = row[0]?.selectedValues;
    const timeArr = row[1]?.selectedValues;
    currentDate.value = dateArr;
    currentTime.value = timeArr;
    formData.value.publishTime = `${dateArr[0]}-${dateArr[1]}-${dateArr[2]} ${timeArr[0]}:${timeArr[1]}:${timeArr[2]}`;
    showDateTimePicker.value = false;
};
// 编辑模式判断
const pageTitle = computed(() => (editId.value ? '编辑行业动态' : '新增行业动态'));

const getInputTypeLabel = (type) => {
    let findItem = inputTypeOptions.find((item) => item.value == type);
    return findItem ? findItem.label : type;
};
const validatorUrl = (value: string, _rule: any) => {
    if (!value) return true;
    return /^https?:\/\//.test(value) ? true : '请输入正确的目标网址，需包含http/https';
};
const validatorContent = (value: string) => {
    return value && value != '<p><br></p>' ? true : '请输入正文'
}

// 打开正文编辑弹窗
const onOpenContentEditor = () => {
    tempContent.value = formData.value.content;
    showContentEditor.value = true;
}

// 取消编辑
const onCancelContentEdit = () => {
    showContentEditor.value = false;
}

// 确认编辑
const onConfirmContentEdit = () => {
    formData.value.content = tempContent.value;
    showContentEditor.value = false;
}
// 用户信息
const userInfo = computed(() => {
    return useUserStore().userInfo;
});
//获取飞书群组列表
let larkChartList = ref([]);
const getLarkChatList = async () => {
    try {
        const res = await getLarkChatListApi();

        larkChartList.value = (res.data || []).map((item) => {
            return {
                label: item.name,
                value: item.chatId,
            };
        });
    } catch (error) {
        console.log(error);
    }
};
getLarkChatList();
interface IndustryNewsFormData {
    title: string;
    inputType: string;
    inputTypeName: string;
    publishPersonId: string;
    publishPersonName: string;
    publishTime: string;
    source: string;
    content: string;
    pushChatList: any[];
    pushChatListName: string;
    targetUrl: string;
}

const createEmptyForm = (): IndustryNewsFormData => {
    let dateArr = [dayjs().format('YYYY'), dayjs().format('MM'), dayjs().format('DD')];
    let timeArr = [dayjs().format('HH'), dayjs().format('mm'), dayjs().format('ss')];
    currentDate.value = dateArr;
    currentTime.value = timeArr;
    let publishTime = `${dateArr[0]}-${dateArr[1]}-${dateArr[2]} ${timeArr[0]}:${timeArr[1]}:${timeArr[2]}`;
    return {
        title: '',
        inputType: inputTypeOptions[0].value,
        inputTypeName: inputTypeOptions[0].label,
        publishPersonId: userInfo.value?.code,
        publishPersonName: userInfo.value?.username,
        publishTime: publishTime,
        source: '',
        content: '',
        pushChatList: [],
        pushChatListName: '',
        targetUrl: '',
    };
};
const formData = ref<IndustryNewsFormData>(createEmptyForm());
const formRef = ref<any>(null);
const detailData = ref<any>(null);
const editId = computed(() => (route.query.id ? String(route.query.id) : ''));
const getDetail = async () => {
    try {
        const res = await getIndustryNewsApi(route.query.id);
        detailData.value = res.data;
        formData.value = {
            title: res.data.title,
            inputType: res.data.inputType,
            inputTypeName: getInputTypeLabel(res.data.inputType),
            publishPersonId: res.data.publishPersonId,
            publishPersonName: res.data.publishPersonName,
            publishTime: res.data.publishTime,
            source: res.data.source,
            content: res.data.content,
            pushChatList: res.data.pushChatList ? res.data.pushChatList.map((item) => item.chatId) : [],
            pushChatListName: (res.data.pushChatList ? res.data.pushChatList.map((item) => item.name) : []).join('、'),
            targetUrl: res.data.targetUrl,
        };
        currentDate.value = [
            dayjs(res.data.publishTime).format('YYYY'),
            dayjs(res.data.publishTime).format('MM'),
            dayjs(res.data.publishTime).format('DD'),
        ];
        currentTime.value = [
            dayjs(res.data.publishTime).format('HH'),
            dayjs(res.data.publishTime).format('mm'),
            dayjs(res.data.publishTime).format('ss'),
        ];
        console.log('formData.value', formData.value);
    } catch (error) {
        console.log(error);
    }
};
onMounted(() => {
    if (editId.value) {
        getDetail();
    } else {
        formData.value = createEmptyForm();
    }
});
// 提交表单
const handleSubmit = async (action: 'save' | 'submit') => {
    try {
        console.log('formData.value', formData.value);
        await formRef.value?.validate();
        console.log('formData.value', formData.value);
        const params = {
            ...formData.value,
            pushChatList: larkChartList.value
                .filter((item) => formData.value.pushChatList.includes(item.value))
                .map((item) => ({ name: item.label, chatId: item.value })),
            status: action == 'save' ? INDUSTRY_NEWS_STATUS_CONSTANT.DRAFT : INDUSTRY_NEWS_STATUS_CONSTANT.ARCHIVED,
            statusName:
                action == 'save'
                    ? industryNewsStatusMap[INDUSTRY_NEWS_STATUS_CONSTANT.DRAFT].label
                    : industryNewsStatusMap[INDUSTRY_NEWS_STATUS_CONSTANT.ARCHIVED].label,
        };
        if (editId.value) {
            try {
                const res = await updateIndustryNewsApi({
                    ...detailData.value,
                    ...params,
                });
                if (res && res.code === 200) {
                    router.back();
                }
            } catch (error) {
                console.error('Failed to update industry news:', error);
            }
        } else {
            try {
                const res = await createIndustryNewsApi(params);
                if (res && res.code === 200) {
                    router.back();
                }
            } catch (error) {
                console.error('Failed to add industry news:', error);
            }
        }
    } catch (error) {
        console.error('表单验证失败', error);
    }
};
</script>

<style scoped lang="less">
.market-report-add {
    padding: 2px 0 8px;

    // Vant 4 字号统一 —— 通过 CSS 变量覆盖（scoped 中 ::deep() 无法穿透 Vant 的 CSS 变量层级）
    --van-cell-font-size: 16px;
    --van-field-label-font-size: 16px;
    --van-field-label-color: var(--base-grey2);
    --van-field-input-text-color: var(--base-black);
    --van-field-input-font-size: 16px;

    .form-card {
        padding: 4px 0px;
        background: #ffffff;
        border-radius: 10px;

        .form-item {
            display: flex;
            align-items: center;
            padding: 14px 0;
            border-bottom: 1px solid #f0f0f0;

            &.column {
                flex-direction: column;
                align-items: stretch;
            }

            &:last-child {
                border-bottom: none;
            }

            .form-label {
                width: 80px;
                flex-shrink: 0;
                font-size: 14px;
                color: #303133;
                font-weight: 500;

                &.required::before {
                    content: '*';
                    color: #f56c6c;
                    margin-right: 4px;
                }
            }

            .form-control {
                flex: 1;
                display: flex;
                align-items: center;
                min-height: 24px;
                font-size: 14px;
                color: #303133;

                &.select {
                    justify-content: space-between;

                    &.placeholder span {
                        color: #c0c4cc;
                    }
                }

                .form-input {
                    flex: 1;
                    width: 100%;
                    border: none;
                    outline: none;
                    background: transparent;
                    font-size: 14px;
                    color: #303133;

                    &::placeholder {
                        color: #c0c4cc;
                    }
                }
            }

            &.column {
                .form-label {
                    width: auto;
                    margin-bottom: 10px;
                }

                .form-control {
                    display: block;
                }
            }

            .upload-control {
                .upload-placeholder {
                    width: 74px;
                    height: 74px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #f5f7fa;
                    border-radius: 6px;
                }

                .upload-tip {
                    margin-top: 10px;
                    font-size: 12px;
                    color: #909399;
                }

                :deep(.van-uploader__preview) {
                    margin: 0;
                }

                :deep(.van-uploader__preview-image) {
                    width: 74px;
                    height: 74px;
                    border-radius: 6px;
                    background: #f5f7fa;
                }
            }

            .textarea-control {
                position: relative;
                display: block;
                background: #fafafa;
                border-radius: 6px;
                padding: 10px 12px 22px;

                .form-textarea {
                    width: 100%;
                    border: none;
                    outline: none;
                    background: transparent;
                    resize: none;
                    font-size: 14px;
                    color: #303133;
                    line-height: 1.5;
                    font-family: inherit;

                    &::placeholder {
                        color: #c0c4cc;
                    }
                }

                .count {
                    position: absolute;
                    right: 12px;
                    bottom: 8px;
                    font-size: 12px;
                    color: #c0c4cc;
                }
            }
        }
    }
}

.bottom-btn-wrapper {
    display: flex;
    gap: 20px;
    padding: 4px 12px 8px;
    background-color: var(--base-white);
    z-index: 99;
    box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.02);

    .bottom-btn {
        border-radius: 4px;
        height: 40px;
        font-size: 16px;
        font-weight: 500;
    }
}

::deep(.van-cell) {
    &:last-child {
        padding-bottom: 0;
    }
}

::deep(.van-field__word-limit),
::deep(.van-field__word-num) {
    color: var(--base-grey) !important;
    font-size: 12px !important;
}

::deep(.van-cell__right-icon) {
    transform: rotate(90deg);
}

// /* 正文预览区域 */
.content-preview {
    min-height: 24px;
    line-height: 1.5;

    .content-text {
        color: var(--base-black);
        font-size: 14px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 240px;
        display: block;
    }

    .content-placeholder {
        color: #c0c4cc;
        font-size: 14px;
    }
}

/* 正文编辑弹窗 */
.editor-popup {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #ffffff;

    .editor-popup-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 16px;
        border-bottom: 1px solid #f0f0f0;
        flex-shrink: 0;

        .editor-popup-title {
            font-size: 16px;
            font-weight: 500;
            color: #303133;
        }

        .editor-popup-close {
            color: #909399;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        }
    }

    .editor-popup-body {
        flex: 1;
        overflow: hidden;
        padding: 12px;
        background: #ffffff;
        display: flex;
        flex-direction: column;

        :deep(.mainEditor) {
            border: none;
            border-radius: 0;
            flex: 1;
            display: flex;
            flex-direction: column;
        }

        :deep(.w-e-text-container) {
            background: #ffffff;
            flex: 1;
        }
    }

    .editor-popup-footer {
        display: flex;
        gap: 12px;
        padding: 12px 16px;
        border-top: 1px solid #f0f0f0;
        flex-shrink: 0;
        background: #ffffff;

        .editor-popup-btn {
            border-radius: 4px;
            height: 40px;
            font-size: 16px;
            font-weight: 500;
        }

        .editor-popup-btn.cancel {
            color: #666;
            border-color: #C4C4C4;
        }

        .editor-popup-btn.submit {
            // color: #2C65F2;
            // border-color: #2C65F2;
            // background-color: #fff;
        }
    }
}
</style>

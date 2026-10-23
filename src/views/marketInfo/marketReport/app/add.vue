<template>
    <AppPage :title="pageTitle" :showSearch="false" :showList="false">
        <template #content>
            <div class="market-report-add">
                <!-- 表单卡片 -->
                <div class="form-card">
                    <Form ref="formRef">
                        <field
                            v-model="formData.title"
                            name="title"
                            label="报告标题"
                            required
                            placeholder="请输入报告标题"
                            :rules="[{ required: true, message: '请输入报告标题', trigger: 'onBlur' }]">
                        </field>
                        <MxPersonSelect
                            :clearable="true"
                            title="作者"
                            :required="true"
                            name="authorId"
                            placeholder="请选择作者"
                            :rules="[{ required: true, message: '请选择作者', trigger: 'onChange' }]"
                            v-model="formData.authorId"
                            v-model:label="formData.authorName">
                        </MxPersonSelect>
                        <!-- 隐患附件 -->
                        <Field
                            :rules="[{ required: true, message: '请上传文件', trigger: 'onChange' }]"
                            :modelValue="formData.fileData"
                            label-align="top"
                            :required="true"
                            name="fileData"
                            label="上传文件">
                            <template #input>
                                <div>
                    <MxWebFileUpload
                        :limit="1"
                        :accept="['.pdf']"
                        fileSize="50MB"
                        force-app-size
                        v-model="formData.fileData"></MxWebFileUpload>
                                </div>
                            </template>
                        </Field>

                        <MxCommSelect
                            v-model="formData.pushChatList"
                            v-model:label="formData.pushChatListName"
                            title="消息推送"
                            name="pushChatList"
                            :multiple="true"
                            :options="larkChartList"
                            :clearable="true"
                            :text="false" />
                        <Field
                            name="remark"
                            label-align="top"
                            v-model="formData.remark"
                            label="备注"
                            rows="3"
                            autosize
                            maxlength="500"
                            show-word-limit
                            clearable
                            type="textarea"
                            placeholder="请输入" />
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
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Form, Popup, Picker, Field, PickerGroup, DatePicker, TimePicker, Button } from 'vant';
import {
    marketReportStatusMap,
    MARKET_REPORT_STATUS_CONSTANT,
    MARKET_REPORT_PUSH_STATUS_CONSTANT,
    marketReportPushStatusMap,
} from '@/constants/marketReport';
import { useUserStore } from '@/store/userStore';
import { createMarketReportApi, updateMarketReportApi, getMarketReportApi, getLarkChatListApi } from '@/api';

interface MarketReportFormData {
    title: string;
    fileData: any;
    authorId: string;
    authorName: string;
    // tasksUserIdList: string[];
    pushChatList: any[];
    pushChatListName: string;
    remark: string;
}

const route = useRoute();
const router = useRouter();

// 编辑模式判断
const pageTitle = computed(() => (editId.value ? '编辑市场报告' : '新增市场报告'));

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
const createEmptyForm = (): MarketReportFormData => ({
    title: '',
    fileData: [],
    authorId: userInfo.value?.code,
    authorName: userInfo.value?.username,
    // tasksUserIdList: [],
    pushChatList: [],
    pushChatListName: '',
    remark: '',
});
const formData = ref<MarketReportFormData>(createEmptyForm());
const formRef = ref<any>(null);
const detailData = ref<any>(null);
const editId = computed(() => (route.query.id ? String(route.query.id) : ''));
const getDetail = async () => {
    try {
        const res = await getMarketReportApi(route.query.id);
        detailData.value = res.data;
        formData.value = {
            title: res.data.title,
            fileData: res.data.fileInfo ? [res.data.fileInfo] : [],
            authorId: res.data.authorId,
            authorName: res.data.authorName,
            pushChatList: res.data.pushChatList ? res.data.pushChatList.map((item) => item.chatId) : [],
            pushChatListName: (res.data.pushChatList ? res.data.pushChatList.map((item) => item.name) : []).join('、'),
            remark: res.data.remark || '',
        };
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
        await formRef.value?.validate();
        console.log('formData.value', formData.value);
        let { authorId, authorName, fileData, title, pushChatList, remark } = formData.value;
        let fileItem = fileData[0];
        delete fileItem.file;
        const params = {
            title: title,
            authorId: authorId,
            remark: remark,
            authorName: authorName,
            fileInfo: fileItem,
            fileUrl: JSON.stringify(fileItem),
            pushChatList: larkChartList.value
                .filter((item) => pushChatList.includes(item.value))
                .map((item) => ({ name: item.label, chatId: item.value })),
            status: action == 'save' ? MARKET_REPORT_STATUS_CONSTANT.DRAFT : MARKET_REPORT_STATUS_CONSTANT.ARCHIVED,
            statusName:
                action == 'save'
                    ? marketReportStatusMap[MARKET_REPORT_STATUS_CONSTANT.DRAFT].label
                    : marketReportStatusMap[MARKET_REPORT_STATUS_CONSTANT.ARCHIVED].label,
        };
        if (editId.value) {
            try {
                const res = await updateMarketReportApi({
                    ...detailData.value,
                    ...params,
                });
                if (res && res.code === 200) {
                    router.back();
                }
            } catch (error) {
                console.error('Failed to update market report:', error);
            }
        } else {
            try {
                const res = await createMarketReportApi(params);
                if (res && res.code === 200) {
                    router.back();
                }
            } catch (error) {
                console.error('Failed to add market report:', error);
            }
        }
    } catch (error) {
        console.error('表单验证失败', error);
    }
};
</script>

<style scoped lang="postcss">
.market-report-add {
    padding: 2px 0 8px;

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
:deep(.van-cell) {
    &:last-child {
        padding-bottom: 0;
    }
}
:deep(.van-field__label) {
    font-size: 16px;
    color: var(--base-grey2);
}
:deep(.van-field__control),
:deep(.van-field__value),
:deep(.van-cell__value) {
    color: var(--base-black);
    font-size: 16px;
}
:deep(.van-field__word-limit),
:deep(.van-field__word-num) {
    color: var(--base-grey) !important;
    font-size: 12px !important;
}
:deep(.van-cell__right-icon) {
    transform: rotate(90deg);
}
</style>

<template>
    <!-- 新增/编辑/ -->
    <MxDrawer v-model:show="drawerShow" :title="drawerTitle" size="small" :closablePop="false">
        <div class="formMain">
            <n-form
                ref="formRef"
                :model="formData"
                :rules="formRules"
                require-mark-placement="left"
                label-placement="left"
                label-align="right"
                label-width="100px">
                <n-grid :cols="1" :x-gap="0">
                    <n-grid-item>
                        <n-form-item label="标题" path="title" required>
                            <n-input
                                v-model:value="formData.title"
                                placeholder="行业动态核心标题，长度≤30字符"
                                :maxlength="30" />
                        </n-form-item>
                    </n-grid-item>
                    <n-grid-item>
                        <n-form-item label="录入类型" path="inputType" required>
                            <n-select v-model:value="formData.inputType" :options="inputTypeOptions" />
                        </n-form-item>
                    </n-grid-item>
                    <n-grid-item>
                        <n-form-item label="发布人" path="publishPersonId" required>
                            <MxPersonSelect
                                :clearable="true"
                                placeholder="请选择发布人"
                                v-model="formData.publishPersonId"
                                v-model:label="formData.publishPersonName"></MxPersonSelect>
                        </n-form-item>
                    </n-grid-item>
                    <n-grid-item>
                        <n-form-item label="发布时间" path="publishTime" required>
                            <n-date-picker
                                v-model:value="formData.publishTime"
                                type="datetime"
                                value-format="YYYY-MM-dd HH:mm:ss"
                                placeholder="请选择发布时间"
                                style="width: 100%" />
                        </n-form-item>
                    </n-grid-item>
                    <n-grid-item>
                        <n-form-item label="信息来源" path="source" required>
                            <n-radio-group v-model:value="formData.source">
                                <n-space>
                                    <n-radio v-for="option in sourceOptions" :key="option.value" :value="option.value">
                                        {{ option.label }}
                                    </n-radio>
                                </n-space>
                            </n-radio-group>
                        </n-form-item>
                    </n-grid-item>
                    <n-grid-item>
                        <n-form-item label="正文" path="content" required>
                            <MxEditor
                                :autoFocus="false"
                                v-model="formData.content"
                                minHeight="220px"
                                :upload-config="{ image: { enabled: true }, video: { enabled: true } }" />
                        </n-form-item>
                    </n-grid-item>
                    <n-grid-item>
                        <n-form-item label="消息推送" path="pushChatList">
                            <n-select
                                v-model:value="formData.pushChatList"
                                multiple
                                :options="larkChartList"
                                placeholder="请选择" />
                        </n-form-item>
                    </n-grid-item>
                    <n-grid-item>
                        <n-form-item label="目标网址" path="targetUrl">
                            <n-input
                                v-model:value="formData.targetUrl"
                                placeholder="请输入目标网址，需含http/https"
                                :maxlength="500" />
                        </n-form-item>
                    </n-grid-item>
                </n-grid>
            </n-form>
        </div>
        <template #footer>
            <div class="drawer-footer">
                <n-button color="#2C65F2" @click="handleSubmit('save')" ghost  :styleOption="{'color': 'var(--base-color)', 'border-color': 'var(--base-color)'}">保 存</n-button>
                <n-button color="#2C65F2" @click="handleSubmit('submit')">提 交</n-button>
            </div>
        </template>
    </MxDrawer>
</template>

<script setup lang="ts">
import { ref, computed, h, watch } from 'vue';
import {
    NForm,
    NFormItem,
    NInput,
    NSelect,
    NButton,
    NGrid,
    NGridItem,
    NSpace,
    NDatePicker,
    NRadio,
    NRadioGroup,
} from 'naive-ui';
import {
    industryNewsStatusMap,
    INDUSTRY_NEWS_STATUS_CONSTANT,
    inputTypeOptions,
    sourceOptions,
} from '@/constants/industryNews';
import dayjs from 'dayjs';
import { useUserStore } from '@/store/userStore';
import { createIndustryNewsApi, updateIndustryNewsApi, getLarkChatListApi } from '@/api';
import MxEditor from '@/components/MxEditor/index.vue';

interface MarketReportFormData {
    inputType: string;
    title: string;
    publishPersonId: string;
    publishPersonName: string;
    publishTime: string;
    source: string;
    content: string;
    pushChatList: any[];
    targetUrl: string;
}
const emit = defineEmits('refresh');
// 用户信息
const userInfo = computed(() => {
    return useUserStore().userInfo;
});
//获取飞书群组列表
let larkChartList = [];
const getLarkChatList = async () => {
    try {
        const res = await getLarkChatListApi();
        larkChartList = (res.data || []).map((item) => {
            return {
                label: item.name,
                value: item.chatId,
            };
        });
    } catch (error) {}
};
getLarkChatList();
const createEmptyForm = (): MarketReportFormData => ({
    publishPersonId: userInfo.value?.code,
    publishPersonName: userInfo.value?.username,
    title: '',
    inputType: inputTypeOptions[0].value,
    publishTime: new Date()
        .toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        })
        .replace(/\//g, '-'),
    source: '百川',
    content: '',
    pushChatList: [],
    targetUrl: '',
});
const formData = ref<MarketReportFormData>(createEmptyForm());
const formRules = {
    inputType: { required: true, message: '请选择录入类型', trigger: 'change' },
    title: { required: true, message: '请输入标题', trigger: 'blur' },
    publishPersonId: { required: true, message: '请输入发布人', trigger: 'blur' },
    publishTime: { 
        validator: (_rule: any, value: string) => {
           return value ? true :  new Error('请选择发布时间');
        },
        trigger: 'change' 
    },
    source: { required: true, message: '请选择信息来源', trigger: 'change' },
    content: {
         required: true, 
         validator: (_rule: any, value: string) => {
            return value && value != '<p><br></p>' ? true : new Error('请输入正文');
        }, 
        trigger: 'blur'
     },
    targetUrl: [
        {
            validator: (_rule: any, value: string) => {
                if (!value) return true;
                return /^https?:\/\//.test(value) ? true : new Error('请输入正确的目标网址，需包含http/https');
            },
            trigger: 'blur',
        },
    ],
};
const drawerShow = ref(false);
const formRef = ref<any>(null);
const isEdit = ref(false);
const isAdd = ref(false);
const detailData = ref<any>(null);
const drawerTitle = computed(() => {
    return isEdit.value ? '编辑行业动态' : '新增行业动态';
});

type Ttype = 'add' | 'edit';
const showDrawer = (type: Ttype, data?: any) => {
    console.log('DAta', data);

    isEdit.value = false;
    isAdd.value = false;
    if (type == 'add') {
        isAdd.value = true;
        formData.value = createEmptyForm();
    }
    if (type == 'edit') {
        isEdit.value = true;
        detailData.value = data;
        formData.value = {
            title: data.title,
            inputType: data.inputType,
            publishTime: data.publishTime,
            source: data.source,
            content: data.content,
            targetUrl: data.targetUrl,
            publishPersonId: data.publishPersonId,
            publishPersonName: data.publishPersonName,
            pushChatList: data.pushChatList ? data.pushChatList.map((item) => item.chatId) : [],
        };
    }
    drawerShow.value = true;
};
// 提交表单
const handleSubmit = async (action: 'save' | 'submit') => {
    try {
        console.log('formData.value', formData.value);
        await formRef.value?.validate();
        console.log('formData.value', formData.value);
        
        formData.value.publishTime =  dayjs(formData.value.publishTime).format('YYYY-MM-DD HH:mm:ss');
        const params = {
            ...formData.value,
            pushChatList: larkChartList
                .filter((item) => formData.value.pushChatList.includes(item.value))
                .map((item) => ({ name: item.label, chatId: item.value })),
            status: action == 'save' ? INDUSTRY_NEWS_STATUS_CONSTANT.DRAFT : INDUSTRY_NEWS_STATUS_CONSTANT.ARCHIVED,
            statusName:
                action == 'save'
                    ? industryNewsStatusMap[INDUSTRY_NEWS_STATUS_CONSTANT.DRAFT].label
                    : industryNewsStatusMap[INDUSTRY_NEWS_STATUS_CONSTANT.ARCHIVED].label,
        };
        if (isEdit.value) {
            try {
                const res = await updateIndustryNewsApi({
                    ...detailData.value,
                    ...params,
                });
                if (res && res.code === 200) {
                    drawerShow.value = false;
                    emit('refresh');
                }
            } catch (error) {
                console.error('Failed to update industry news:', error);
            }
        } else {
            try {
                const res = await createIndustryNewsApi(params);
                if (res && res.code === 200) {
                    drawerShow.value = false;
                    emit('refresh');
                }
            } catch (error) {
                console.error('Failed to add industry news:', error);
            }
        }

        drawerShow.value = false;
    } catch (error) {
        console.error('表单验证失败', error);
    }
};
defineExpose({
    showDrawer,
});
</script>

<style lang="less" scoped>
.formMain {
    padding: 16px;
}

.drawer-footer {
    display: flex;
    justify-content: center !important;
    gap: 12px;
    width: 100%;
}
</style>

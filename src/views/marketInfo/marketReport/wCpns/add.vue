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
                label-width="80px">
                <n-grid :cols="0" :x-gap="0" >
                    <n-grid-item>
                        <n-form-item label="报告标题" path="title">
                            <n-input
                                v-model:value="formData.title"
                                placeholder="请输入报告标题，长度≤50字符"
                                :maxlength="50" />
                        </n-form-item>
                    </n-grid-item>
                    <n-grid-item>
                        <n-form-item label="作者" path="authorId">
                            <MxPersonSelect
                                :clearable="true"
                                placeholder="请选择作者"
                                v-model="formData.authorId"
                                v-model:label="formData.authorName"></MxPersonSelect>
                        </n-form-item>
                    </n-grid-item>
                    <n-grid-item>
                        <n-form-item label="上传文件" path="fileData">
                            <div>
                                <MxWebFileUpload
                                    downloadType="browser"
                                    v-model="formData.fileData"
                                    fileSize="50MB"
                                    :limit="1"
                                    :accept="['.pdf']" />
                            </div>
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
                        <n-form-item label="备注" path="remark">
                            <n-input
                                v-model:value="formData.remark"
                                type="textarea"
                                placeholder="请输入备注"
                                :maxlength="600"
                                show-count />
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
import { NForm, NFormItem, NInput, NSelect, NButton, NGrid, NGridItem } from 'naive-ui';
import {
    marketReportStatusMap,
    MARKET_REPORT_STATUS_CONSTANT,
    MARKET_REPORT_PUSH_STATUS_CONSTANT,
    marketReportPushStatusMap,
} from '@/constants/marketReport';
import { useUserStore } from '@/store/userStore';
import { createMarketReportApi, updateMarketReportApi, getLarkChatListApi } from '@/api';

interface MarketReportFormData {
    title: string;
    fileData: any[];
    authorId: string;
    authorName: string;
    // tasksUserIdList: string[];
    pushChatList: any[];
    remark: string;
}
const emit = defineEmits(['refresh']);
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
    title: '',
    fileData: [],
    authorId: userInfo.value?.code,
    authorName: userInfo.value?.username,
    // tasksUserIdList: [],
    pushChatList: [],
    remark: '',
});
const formData = ref<MarketReportFormData>(createEmptyForm());

const formRules = {
    title: { required: true, message: '请输入报告标题', trigger: 'blur' },
    authorId: { required: true, message: '请选择作者', trigger: 'change' },
    fileData: { type: 'array' as const, required: true, message: '请上传文件', trigger: 'change' },
};
const drawerShow = ref(false);
const formRef = ref<any>(null);
const isEdit = ref(false);
const isAdd = ref(false);
const detailData = ref<any>(null);
const drawerTitle = computed(() => {
    return isEdit.value ? '编辑市场报告' : '新增市场报告';
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
            fileData: data.fileInfo ? [data.fileInfo] : [],
            authorId: data.authorId,
            authorName: data.authorName,
            // tasksUserIdList: data.tasksUserIdList ? [...data.tasksUserIdList] : [],
            pushChatList: data.pushChatList ? data.pushChatList.map((item) => item.chatId) : [],
            remark: data.remark || '',
        };
    }
    drawerShow.value = true;
};
// 提交表单
const handleSubmit = async (action: 'save' | 'submit') => {
    try {
        await formRef.value?.validate();
        console.log('formData.value', formData.value);
        let { authorId, authorName, fileData, title, pushChatList, remark } = formData.value;
        let fileItem = fileData[0];
        if (fileItem?.status == 'success') {
            delete fileItem.file;
            const params = {
                title: title,
                authorId: authorId,
                remark: remark,
                authorName: authorName,
                fileInfo: fileItem,
                fileUrl: JSON.stringify(fileItem),
                pushChatList: larkChartList
                    .filter((item) => pushChatList.includes(item.value))
                    .map((item) => ({ name: item.label, chatId: item.value })),
                status: action == 'save' ? MARKET_REPORT_STATUS_CONSTANT.DRAFT : MARKET_REPORT_STATUS_CONSTANT.ARCHIVED,
                statusName:
                    action == 'save'
                        ? marketReportStatusMap[MARKET_REPORT_STATUS_CONSTANT.DRAFT].label
                        : marketReportStatusMap[MARKET_REPORT_STATUS_CONSTANT.ARCHIVED].label,
            };
            if (isEdit.value) {
                try {
                    const res = await updateMarketReportApi({
                        ...detailData.value,
                        ...params,
                    });
                    if (res && res.code === 200) {
                        drawerShow.value = false;
                        emit('refresh');
                    }
                } catch (error) {
                    console.error('Failed to update market report:', error);
                }
            } else {
                try {
                    const res = await createMarketReportApi(params);
                    if (res && res.code === 200) {
                        drawerShow.value = false;
                        emit('refresh');
                    }
                } catch (error) {
                    console.error('Failed to add market report:', error);
                }
            }

            drawerShow.value = false;
        } else {
            window.$message.error(
                fileItem?.status == 'uploading' ? '文件上传中，请上传完成后提交' : '请上传文件完成后提交'
            );
        }
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
    padding: 24px;
}

.drawer-footer {
    display: flex;
    justify-content: center !important;
    gap: 12px;
    width: 100%;
}
</style>
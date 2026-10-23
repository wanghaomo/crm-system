<template>
    <CustomerCareApp v-if="isAppPage" />
    <WebPage v-else showBack hideAddBtn contentPadding="0" show-back-confirm back-title="返回确认" back-content="是否确认返回？返回后编辑内容将不会被保存">
        <template #headerRight>
            <MxButton border @click="handleSave" v-if="!(isEdit && formData.status === 'COMPLETED')" :styleOption="{ 'color': 'var(--base-color)', 'border-color': 'var(--base-color)' }"> 保 存 </MxButton>
            <MxButton @click="handleSubmit"> 提 交 </MxButton>
        </template>
        <template #content>
            <div class="care-add-container">
                <h1 class="addTitle">{{ pageTitle }}</h1>
                <n-form ref="formRef" :model="formData" :rules="rules" require-mark-placement="left" label-placement="left" label-align="right" label-width="130px">
                    <!-- 基础信息 -->
                    <n-grid :cols="2" :x-gap="24">
                        <n-grid-item>
                            <n-form-item label="企业单位名称" path="customerId">
                                <MxCommSelect v-model="formData.customerId" typeName="企业客户" title="企业客户" placeholder="请选择" :clearable="true" :text="false" @changeEvt="handleCustomerChange" :disabled="isEdit === true"></MxCommSelect>
                            </n-form-item>
                        </n-grid-item>
                        <n-grid-item>
                            <n-form-item label="客户星级" path="starLevel">
                                <n-input :value="getStarLevelText(formData.starLevel)" placeholder="自动匹配企业" disabled />
                            </n-form-item>
                        </n-grid-item>
                        <n-grid-item>
                            <n-form-item label="关怀类型" path="careType">
                                <n-select v-model:value="formData.careType" :options="careTypeOptions" placeholder="请选择" clearable />
                            </n-form-item>
                        </n-grid-item>
                        <n-grid-item>
                            <n-form-item label="执行方式" path="careMethod">
                                <n-select v-model:value="formData.careMethod" :options="executionMethodOptions" placeholder="请选择" clearable />
                            </n-form-item>
                        </n-grid-item>
                        <n-grid-item>
                            <n-form-item label="执行人" path="executorCodes">
                                <MxPersonSelect multiple v-model:modelValue="formData.executorCodes" placeholder="请选择执行人" @changeEvt="handleExecutorChange" />
                            </n-form-item>
                        </n-grid-item>
                        <n-grid-item>
                            <n-form-item label="计划关怀时间" path="planTime">
                                <n-date-picker v-model:formatted-value="formData.planTime" type="datetime" placeholder="请选择" style="width: 100%" clearable value-format="yyyy-MM-dd HH:mm:ss" />
                            </n-form-item>
                        </n-grid-item>
                    </n-grid>

                    <!-- 关怀内容 -->
                    <n-form-item label="关怀内容" path="content">
                        <MxEditor
                            :autoFocus="false"
                            v-model="formData.content"
                            minHeight="200px"
                            :upload-config="{ image: { enabled: false }, video: { enabled: false }, file: { enabled: false } }" />
                        <!-- <n-input v-model:value="formData.content" type="textarea" placeholder="请输入" :maxlength="250" show-count :rows="4" /> -->
                    </n-form-item>

                    <!-- 关怀附件 -->
                    <n-form-item label="关怀附件" path="attachmentList">
                        <div>
                    <MxWebFileUpload v-model="formData.attachmentList" :limit="5" :multiple="true" :accept="attachmentAccept" fileSize="50M" />
                        </div>
                    </n-form-item>

                    <!-- 客户反馈 -->
                    <n-form-item label="客户反馈" path="feedback">
                        <n-input v-model:value="formData.feedback" type="textarea" placeholder="请输入" :maxlength="250" show-count :rows="4" />
                    </n-form-item>
                    <n-grid :cols="2" :x-gap="24">
                        <n-grid-item>
                            <!-- 关怀效果评价 -->
                            <n-form-item label="关怀效果评价" path="careEffectEvaluation">
                                <n-select v-model:value="formData.careEffectEvaluation" :options="careEvaluationOptions" placeholder="请选择" clearable />
                            </n-form-item>
                        </n-grid-item>
                        <n-grid-item>
                            <!-- 下次关怀建议时间 -->
                            <n-form-item label="下次关怀建议时间" path="nextCareSuggestTime">
                                <n-date-picker v-model:formatted-value="formData.nextCareSuggestTime" type="datetime" value-format="yyyy-MM-dd HH:mm:ss" placeholder="请选择" style="width: 100%" clearable />
                            </n-form-item>
                        </n-grid-item>
                    </n-grid>

                    <!-- 增值服务 -->
                    <n-form-item label="增值服务" path="plusServicesList">
                        <n-checkbox-group v-model:value="formData.plusServicesList">
                            <n-space>
                                <n-checkbox v-for="item in valueAddedOptions" :key="item.value" :value="item.value" :label="item.label" />
                            </n-space>
                        </n-checkbox-group>
                    </n-form-item>

                    <!-- 增值服务详情 -->
                    <n-form-item label="增值服务详情" path="plusServicesDetail">
                        <n-input v-model:value="formData.plusServicesDetail" type="textarea" placeholder="请输入" :maxlength="256" show-count :rows="4" />
                    </n-form-item>

                    <!-- 执行情况 -->
                    <n-form-item label="增值服务执行情况" path="plusServicesExecution">
                        <n-input v-model:value="formData.plusServicesExecution" type="textarea" placeholder="请输入" :maxlength="256" show-count :rows="4" />
                    </n-form-item>
                </n-form>
            </div>
        </template>
    </WebPage>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import { ref, reactive, computed, onMounted, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { isApp } from '@/utils/comm';
import CustomerCareApp from './app.vue';
import {
    NForm,
    NFormItem,
    NGrid,
    NGridItem,
    NInput,
    NSelect,
    NSpace,
    NCheckbox,
    NCheckboxGroup,
    NDatePicker,
    useDialog,
} from 'naive-ui';
import {
    createCustomerCareApi,
    updateCustomerCareApi,
    getCustomerCareRuleByCustomerApi,
    getCustomerCareApi,
    sendCustomerCareMessageApi,
} from '@/api/customerManage';
import { getDictMapApi } from '@/api/comm';
import enumCfg from '@/config/enum.cfg';
import { getStarLevelText } from '@/config/customer';

const router = useRouter();
const route = useRoute();
const isAppPage = isApp();
const formRef = ref<any>(null);
const dialog = useDialog();
const recordId = computed(() => route.query.id);
const isEdit = computed(() => !!recordId.value);
const pageTitle = computed(() => (isEdit.value ? '编辑客户关怀' : '新增客户关怀'));
// 支持的文件类型：PDF / 图片 / Word / Excel
const attachmentAccept = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.xls', '.xlsx'];

// ========== 表单数据 ==========
const formData = reactive({
    status: '',
    customerName: undefined, //客户名称
    customerId: undefined, //客户ID
    starLevel: undefined, //客户星级
    careType: undefined,  // 关怀类型
    careMethod: undefined,  // 执行方式
    executorList: [], //执行人数据
    executorCodes: [], //执行人code
    planTime: undefined, //计划关怀时间
    content: '', // 关怀内容
    attachmentList: [], // 附件列表
    feedback: '', // 客户反馈
    careEffectEvaluation: undefined,  // 关怀效果评价
    nextCareSuggestTime: null, // 下次关怀建议时间
    plusServicesList: [], // 增值服务
    plusServicesDetail: '', // 增值服务详情
    plusServicesExecution: '', // 增值服务执行情况
});

// ========== 选项配置 ==========
const careTypeOptions = ref([]); // 关怀类型下拉选项
const executionMethodOptions = ref([]); // 执行方式下拉选项
const valueAddedOptions = [
    { label: '定制化礼品', value: '定制化礼品' },
    { label: '专属价格政策', value: '专属价格政策' },
    { label: '库存预警服务', value: '库存预警服务' },
    { label: '其他', value: '其他' },
];

const careEvaluationOptions = [
    { label: '优秀', value: '优秀' },
    { label: '良好', value: '良好' },
    { label: '一般', value: '一般' },
    { label: '较差', value: '较差' },
];

// 加载拜访相关字典
const loadVisitDicts = async () => {
    try {
        const res: any = await getDictMapApi({ parentCodes: [enumCfg['关怀类型'], enumCfg['执行方式']] });
        if (res.code === 200) {
            const careList: any[] = res.data?.[enumCfg['关怀类型']] || [];
            careTypeOptions.value = careList.map((item: any) => ({
                label: item.name,
                value: item.code,
            }));
            const executionMethodList: any[] = res.data?.[enumCfg['执行方式']] || [];
            executionMethodOptions.value = executionMethodList.map((item: any) => ({
                label: item.name,
                value: item.code,
            }));
        }
    } catch (error) {
        console.error('加载拜访字典失败:', error);
    }
};

/// 客户选择变更处理
const handleCustomerChange = async (option: any) => {
    if (recordId.value) return;
    if (option) {
        formData.customerId = option.id;
        formData.customerName = option.customerName;
        formData.starLevel = option.starLevel;

        // 拜访规则接口
        try {
            const res: any = await getCustomerCareRuleByCustomerApi({ ...option });
            if (res?.data) {
                formData.careType = res.data.careType || null;
                formData.careMethod = res.data.careMethod || null;
                formData.content = res.data.content || '';
            } else {
                // 使用null而非undefined,确保n-select组件正确响应
                formData.careType = null;
                formData.careMethod = null;
                formData.content = '';
                // 强制更新视图
                await nextTick();
            }
        } catch (error) {
            console.error('获取关怀规则失败:', error);
            // 出错时也清除字段
            formData.careType = null;
            formData.careMethod = null;
            formData.content = '';
        }
    } else {
        // 清除时重置关联字段
        formData.customerId = undefined;
        formData.customerName = undefined;
        formData.starLevel = null;
        // 使用null而非undefined,确保n-select组件正确响应
        formData.careType = null;
        formData.careMethod = null;
        formData.content = '';
    }
};

// 执行人选择变更：拿到全字段对象数组
const handleExecutorChange = (options: any) => {
    // multiple 模式下 options 为数组，单选时为对象
    const arr = Array.isArray(options) ? options : options ? [options] : [];
    formData.executorList = arr.map((item: any) => ({ username: item.username, code: item.code, larkUserId: item.larkUserId }));
    console.log('[执行人]选中完整对象:', formData.executorList);
};


// ========== 表单验证规则 ==========
const rules = {
    customerId: { required: true, message: '请选择企业名称', trigger: ['change'], saveOnly: true },
    starLevel: { required: true, message: '客户星级不能为空', trigger: ['change'] },
    careType: { required: true, message: '请选择关怀类型', trigger: ['change'] },
    careMethod: { required: true, message: '请选择执行方式', trigger: ['change'] },
    executorCodes: {
        required: true,
        message: '请选择执行人',
        trigger: ['change'],
        type: 'array' as const,
        saveOnly: true,
    },
    planTime: { required: true, type: 'string', message: '请选择计划关怀时间', trigger: ['change'], saveOnly: true },
    content: {
        required: true, trigger: ['blur'], validator: (_rule: any, value: string) => {
            // 过滤富文本空标签（如 <p><br></p>、<p></p>）
            const pureText = (value || '')
                .replace(/<[^>]+>/g, '')
                .replace(/&nbsp;/g, '')
                .trim();
            if (!pureText) {
                return new Error('请填写关怀内容');
            }
            return true;
        },
    },
};

// ========== 构建提交数据 ==========
const buildSubmitData = (status: 'PENDING' | 'COMPLETED') => {
    let submitData = JSON.parse(JSON.stringify(formData));
    // 提交时，设置实际关怀时间
    if (status === 'COMPLETED') submitData.actualTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
    submitData.status = status;
    if (isEdit.value) submitData.id = recordId.value;
    delete submitData.executorCodes;

    return submitData;
};
// ========== 详情数据 ==========


const loadDetail = async () => {
    if (!recordId.value) return;
    try {
        const res: any = await getCustomerCareApi(recordId.value);
        const detail = res?.data;
        if (!detail) {
            window.$message.warning('未找到该记录');
            return;
        }
        console.log('详情数据', detail);


        Object.assign(formData, {
            status: detail.status,
            id: detail.id,
            customerId: detail.customerId,
            customerName: detail.customerName,
            starLevel: detail.starLevel,
            careType: detail.careType,
            careMethod: detail.careMethod,
            executorList: detail.executorList,
            executorCodes: detail.executorList.map((item: any) => item.code),
            planTime: detail.planTime,
            actualTime: detail.actualTime || '',
            content: detail.content || '',
            attachmentList: detail.attachmentList || [],
            feedback: detail.feedback || '',
            careEffectEvaluation: detail.careEffectEvaluation,
            nextCareSuggestTime: detail.nextCareSuggestTime,
            plusServicesList: detail.plusServicesList || [],
            plusServicesDetail: detail.plusServicesDetail || '',
            plusServicesExecution: detail.plusServicesExecution || '',
            cancelReason: detail.cancelReason || '',
        });
    } catch (error) {
        console.error('加载详情失败:', error);
        window.$message.error('加载详情失败');
    }
};

// ========== 保存与提交 ==========
/** 从保存接口响应中提取当前记录 ID，兼容新增和编辑接口的返回结构。 */
const getSavedRecordId = (res: any) => {
    const responseData = res?.data;
    if (responseData && typeof responseData === 'object') {
        return responseData.id ?? responseData.recordId ?? responseData.data?.id ?? res?.id;
    }
    return typeof responseData === 'number' || typeof responseData === 'string' ? responseData : res?.id;
};

/** 保存成功后询问是否发起客户关怀的飞书提醒。 */
const confirmCustomerCareMessage = (id: number | string) =>
    new Promise<void>((resolve) => {
        let positivePending = false;
        let pageExited = false;
        const exitPage = () => {
            if (pageExited) return;
            pageExited = true;
            resolve();
            router.back();
        };
        dialog.warning({
            title: '提示',
            content: '是否立即发起飞书提醒？',
            closable: true,
            maskClosable: false,
            positiveText: '确定',
            negativeText: '取消',
            onPositiveClick: async () => {
                positivePending = true;
                try {
                    await sendCustomerCareMessageApi(id);
                } catch (error) {
                    console.error('发起客户关怀飞书提醒失败:', error);
                } finally {
                    positivePending = false;
                    exitPage();
                }
            },
            onNegativeClick: exitPage,
            onClose: () => {
                if (!positivePending) exitPage();
            },
        });
    });

const validateAll = (onSuccess: () => void) => {
    formRef.value?.validate((errors: any) => {
        if (errors) {
            console.log('表单验证失败', errors);
            return;
        }
        onSuccess();
    });
};

const handleSubmitForm = async (status: 'PENDING' | 'COMPLETED') => {
    try {
        const submitData = buildSubmitData(status);
        console.log('提交数据', submitData);
        let res: any;
        if (isEdit.value) {
            res = await updateCustomerCareApi(submitData);
        } else {
            res = await createCustomerCareApi(submitData);
        }
        if (res?.code === 200 || res?.success) {
            const successMsg = status === 'PENDING' ? '保存成功' : '提交成功';
            window.$message.success(successMsg);
            const savedId = getSavedRecordId(res) ?? recordId.value;
            if (status === 'PENDING' && savedId) {
                await confirmCustomerCareMessage(savedId);
            } else {
                router.back();
            }
        }
    } catch (error) {
        console.error(status === 'PENDING' ? '保存失败:' : '提交失败:', error);
        window.$message.error(status === 'PENDING' ? '保存失败' : '提交失败');
    }
};



const handleSave = () => {
    validateSave(() => handleSubmitForm('PENDING'));
};

const handleSubmit = () => {
    validateAll(() => handleSubmitForm('COMPLETED'));
};

// 保存校验标记为 saveOnly 的基础字段，提交继续使用完整校验。
const validateSave = (onSuccess: () => void) => {
    formRef.value?.validate(
        (errors: any) => {
            if (errors) {
                console.log('保存表单验证失败', errors);
                return;
            }
            onSuccess();
        },
        (rule: any) => rule.saveOnly === true,
    );
};

onMounted(() => {
    loadVisitDicts(); // 加载拜访相关字典
    if (isEdit.value) {
        loadDetail();
    }
});
</script>

<style scoped lang="less">
.care-add-container {
    height: 100%;
    overflow-y: auto;
    padding: 16px;

    .addTitle {
        font-size: 16px;
        font-weight: 600;
        color: #333;
        margin-bottom: 16px;
    }

    :deep(.n-form-item-label) {
        font-weight: 400;
    }

    .upload-tip {
        font-size: 12px;
        color: #999;
        margin-top: 8px;
    }
}
</style>

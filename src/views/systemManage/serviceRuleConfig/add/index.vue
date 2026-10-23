<template>
    <WebPage showBack hideAddBtn contentPadding="0"  show-back-confirm back-title="返回确认" back-content="是否确认返回？返回后编辑内容将不会被保存">
        <template #headerRight>
            <MxButton border @click="handleSave" :styleOption="{ 'color': 'var(--base-color)', 'border-color': 'var(--base-color)' }"> 保 存 </MxButton>
            <MxButton @click="handleSubmit"> 提 交 </MxButton>
        </template>
        <template #content>
            <div class="service-rule-config-add-container">
                <h1 class="page-title">{{ pageTitle }}</h1>
                <n-form ref="formRef" :model="formData" :rules="rules" require-mark-placement="left" label-placement="left" label-align="right" label-width="110px">
                    <!-- 基础信息 -->
                    <div class="section-block">
                        <div class="section-title">基础信息</div>
                        <n-grid :cols="2" :x-gap="24" :y-gap="0">
                            <n-grid-item>
                                <n-form-item label="规则名称" path="ruleName">
                                    <n-input v-model:value="formData.ruleName" placeholder="请输入" maxlength="30" show-count clearable />
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item>
                                <n-form-item label="服务类型" path="serviceType">
                                    <n-radio-group v-model:value="formData.serviceType">
                                        <n-radio :value="item.value" v-for="item in serviceTypeOptions" :key="item.value">{{ item.label }}</n-radio>
                                    </n-radio-group>
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item>
                                <n-form-item label="客户星级" path="customerStar">
                                    <n-select v-model:value="formData.customerStar" placeholder="请选择" :options="STAR_LEVEL_OPTIONS" clearable />
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item>
                                <n-form-item label="费用标准（元）" path="feeStandard">
                                    <n-input v-model:value="formData.feeStandard" :allow-input="onlyAllowNumber" placeholder="请输入" style="width: 100%" maxlength="10" clearable />
                                </n-form-item>
                            </n-grid-item>
                        </n-grid>

                        <!-- <n-form-item label="费用分摊部门">
                            <MxCascaderTreeSelect multiple v-model:value="formData.feeDeptIds" v-model:label="formData.feeDeptLabels" :type="2" :options="deptTree"></MxCascaderTreeSelect>
                        </n-form-item> -->

                        <n-form-item label="执行提醒">
                            <n-radio-group v-model:value="formData.executeRemind">
                                <n-radio :value="item.value" v-for="item in executeRemindOptions" :key="item.value">{{ item.label }}</n-radio>
                            </n-radio-group>
                        </n-form-item>

                        <n-form-item label="备注">
                            <n-input v-model:value="formData.remark" type="textarea" placeholder="请输入" :rows="4" maxlength="500" show-count />
                        </n-form-item>
                    </div>

                    <!-- 服务内容配置 -->
                    <div class="section-block" v-if="formData.serviceType">
                        <div class="section-title">服务内容配置</div>

                        <!-- 接待规则 -->
                        <template v-if="createDictMap(serviceTypeOptions)[formData.serviceType] === '接待规则'">
                            <n-grid :cols="2" :x-gap="24" :y-gap="16">
                                <n-grid-item>
                                    <n-form-item label="接待规格" path="receptionSpec">
                                        <MxDict placeholder="请选择" dictType="接待规格" v-model="formData.receptionSpec"></MxDict>
                                    </n-form-item>
                                </n-grid-item>
                                <n-grid-item>
                                    <n-form-item label="接待地点" path="receptionLocation">
                                        <MxDict placeholder="请选择" dictType="接待地点" v-model="formData.receptionLocation"></MxDict>
                                    </n-form-item>
                                </n-grid-item>
                            </n-grid>
                            <n-form-item label="接待流程" path="receptionProcess">
                                <MxEditor
                                    :autoFocus="false"
                                    v-model="formData.receptionProcess"
                                    minHeight="200px"
                                    :upload-config="{ image: { enabled: false }, video: { enabled: false }, file: { enabled: false } }" />
                            </n-form-item>
                        </template>

                        <!-- 关怀规则 -->
                        <template v-if="createDictMap(serviceTypeOptions)[formData.serviceType] === '关怀规则'">
                            <n-grid :cols="2" :x-gap="24" :y-gap="16">
                                <n-grid-item>
                                    <n-form-item label="关怀类型" path="careType">
                                        <MxDict placeholder="请选择" dictType="关怀类型" v-model="formData.careType"></MxDict>
                                    </n-form-item>
                                </n-grid-item>
                                <n-grid-item>
                                    <n-form-item label="执行方式" path="careMethod">
                                        <MxDict placeholder="请选择" dictType="执行方式" v-model="formData.careMethod"></MxDict>
                                    </n-form-item>
                                </n-grid-item>
                            </n-grid>
                            <n-form-item label="关怀周期" path="careCycle">
                                <MxDict placeholder="请选择" dictType="关怀周期" v-model="formData.careCycle"></MxDict>
                            </n-form-item>
                            <n-form-item label="关怀内容" path="content">
                                <MxEditor
                                    :autoFocus="false"
                                    v-model="formData.content"
                                    minHeight="200px"
                                    :upload-config="{ image: { enabled: false }, video: { enabled: false }, file: { enabled: false } }" />
                            </n-form-item>
                        </template>

                        <!-- 拜访规则 -->
                        <template v-if="createDictMap(serviceTypeOptions)[formData.serviceType] === '拜访规则'">
                            <n-form-item label="拜访周期" path="visitCycle">
                                <MxDict placeholder="请选择" dictType="关怀周期" v-model="formData.visitCycle"></MxDict>
                            </n-form-item>
                        </template>
                    </div>
                </n-form>
            </div>
        </template>
    </WebPage>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { getDeptTree } from '@/api';
import { getDictMapApi } from '@/api/comm';
import { addServiceRuleApi, editServiceRuleApi, queryServiceRuleApi } from '@/api/systemManage';
import enumCfg from '@/config/enum.cfg';
import {
    NForm,
    NFormItem,
    NGrid,
    NGridItem,
    NInput,
    NSelect,
    NRadio,
    NRadioGroup,
    useMessage,
    useDialog,
} from 'naive-ui';
import { STAR_LEVEL_OPTIONS } from '@/config/customer';

const router = useRouter();
const route = useRoute();
const message = useMessage();
const dialog = useDialog();
const formRef = ref<any>(null);

const recordId = computed(() => route.query.id as string);
const isEdit = computed(() => !!recordId.value);
const pageTitle = computed(() => (isEdit.value ? '编辑服务规则' : '新增服务规则'));

const onlyAllowNumber = (value: string) => !value || /^\d*$/.test(value); // 限制输入框只允许输入数字

// 费用分摊部门
const deptTree = ref<any[]>([]);

const getDept = async () => {
    let res = await getDeptTree();
    if (res.code === 200) {
        deptTree.value = res.data;
    }
};


// ========== 表单数据 ==========
const formData = reactive({
    ruleName: '', // 规则名称
    serviceType: '', // 服务类型
    customerStar: '', // 客户星级
    feeStandard: '', // 费用标准
    feeDeptList: [], // 费用分摊部门
    feeDeptIds: [], // 费用分摊id
    feeDeptLabels: [], // 费用分摊label
    executeRemind: 'EXECUTION_REMIND_02', // 执行提醒
    remark: '', // 备注
    receptionSpec: undefined, // 接待规格
    receptionLocation: undefined, // 接待地点
    receptionProcess: undefined, // 接待流程  
    careType: undefined, // 关怀类型
    careMethod: undefined, // 执行方式
    careCycle: undefined, // 关怀周期
    content: undefined, // 关怀内容
    visitCycle: undefined, // 拜访周期
});

// ========== 选项配置 ==========

// 服务类型
const serviceTypeOptions = ref<any[]>([]);
// 执行提醒
const executeRemindOptions = ref<any[]>([]);

// 加载字典数据
const loadDictData = async () => {
    try {
        const res = await getDictMapApi({ parentCodes: [enumCfg['服务类型'], enumCfg['执行提醒']] });

        if (res.code === 200) {
            serviceTypeOptions.value = (res.data?.[enumCfg['服务类型']] || []).map((item: any) => ({
                label: item.name,
                value: item.code,
            }));
            executeRemindOptions.value = (res.data?.[enumCfg['执行提醒']] || []).map((item: any) => ({
                label: item.name,
                value: item.code,
            }));
        }
    } catch (e) {
        console.error('加载字典失败', e);
    }
};

// 字典 map 映射生成方法
const createDictMap = (options: any[]) => {
    const map: Record<string, string> = {};
    options.forEach(item => {
        map[item.value] = item.label;
    });
    return map;
};



// ========== 动态校验规则 ==========
const rules = computed(() => {
    const baseRules: any = {
        ruleName: { required: true, message: '请输入规则名称', trigger: 'blur' },
        serviceType: { required: true, message: '请选择服务类型', trigger: 'change' },
        customerStar: { required: true, message: '请选择客户星级', trigger: 'change' },
        // feeStandard: { required: true, message: '请输入费用标准', trigger: 'blur', },
    };

    const serviceTypeLabel = createDictMap(serviceTypeOptions.value)[formData.serviceType];

    if (serviceTypeLabel === '接待规则') {
        baseRules.receptionSpec = { required: true, message: '请选择接待规格', trigger: 'change' };
        baseRules.receptionLocation = { required: true, message: '请选择接待地点', trigger: 'change' };
    } else if (serviceTypeLabel === '关怀规则') {
        baseRules.careType = { required: true, message: '请选择关怀类型', trigger: 'change' };
        baseRules.careMethod = { required: true, message: '请选择执行方式', trigger: 'change' };
        baseRules.careCycle = { required: true, message: '请选择关怀周期', trigger: 'change' };
        baseRules.content = {
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
        };
    } else if (serviceTypeLabel === '拜访规则') {
        baseRules.visitCycle = { required: true, message: '请选择拜访周期', trigger: 'change' };
    }

    return baseRules;
});



// 监听服务类型变化，清除历史配置并重置校验
watch(
    () => formData.serviceType,
    (newVal, oldVal) => {
        // 只有在用户手动切换时才清除（oldVal 有值且 newVal 与 oldVal 不同）
        if (oldVal && newVal !== oldVal) {
            formData.receptionSpec = '';
            formData.receptionLocation = '';
            formData.receptionProcess = '';
            formData.careType = '';
            formData.careMethod = '';
            formData.careCycle = '';
            formData.content = '';
            formData.visitCycle = '';
            nextTick(() => {
                formRef.value?.restoreValidation();
            });
        }
    }
);

// 构建提交数据
const buildSubmitData = () => {
    // 组装 feeDeptList：将 feeDeptIds 和 feeDeptLabels 组合成对象数组
    const feeDeptList = formData.feeDeptIds.map((id: any, index: number) => ({
        id: id,
        name: formData.feeDeptLabels[index],
    }));

    const data: any = {
        ruleName: formData.ruleName,
        serviceType: formData.serviceType,
        customerStar: formData.customerStar,
        feeStandard: Number(formData.feeStandard),
        feeDeptList: feeDeptList,
        executeRemind: formData.executeRemind,
        remark: formData.remark,
        serviceContentDTO: {},
        status: '', // 将在调用时设置
    };

    // 根据服务类型添加对应字段
    if (createDictMap(serviceTypeOptions.value)[formData.serviceType] === '接待规则') {
        data.serviceContentDTO.receptionSpec = formData.receptionSpec;
        data.serviceContentDTO.receptionLocation = formData.receptionLocation;
        data.serviceContentDTO.receptionProcess = formData.receptionProcess;
    } else if (createDictMap(serviceTypeOptions.value)[formData.serviceType] === '关怀规则') {
        data.serviceContentDTO.careType = formData.careType;
        data.serviceContentDTO.careMethod = formData.careMethod;
        data.serviceContentDTO.careCycle = formData.careCycle;
        data.serviceContentDTO.content = formData.content;
    } else if (createDictMap(serviceTypeOptions.value)[formData.serviceType] === '拜访规则') {
        data.serviceContentDTO.visitCycle = formData.visitCycle;
    }

    return data;
};

// ========== 加载详情 ==========
const loadDetail = async () => {
    if (!recordId.value) return;

    try {
        const res = await queryServiceRuleApi(recordId.value);
        if (res.code === 200 && res.data) {
            const data = res.data;

            // 处理 feeDeptList 回显：从对象数组中提取 ids 和 labels
            let feeDeptIds: any[] = [];
            let feeDeptLabels: any[] = [];
            if (data.feeDeptList && Array.isArray(data.feeDeptList)) {
                feeDeptIds = data.feeDeptList.map((item: any) => item.id);
                feeDeptLabels = data.feeDeptList.map((item: any) => item.name);
            }

            // 处理 serviceContentDTO 回显：提取服务内容配置字段
            const serviceContentDTO = data.serviceContentDTO || {};

            Object.assign(formData, {
                ruleName: data.ruleName || '',
                serviceType: data.serviceType || '',
                customerStar: data.customerStar || '',
                feeStandard: String(data.feeStandard) || '',
                feeDeptList: data.feeDeptList || [],
                feeDeptIds: feeDeptIds,
                feeDeptLabels: feeDeptLabels,
                executeRemind: data.executeRemind || '',
                remark: data.remark || '',
                // 服务内容配置字段回显
                receptionSpec: serviceContentDTO.receptionSpec,
                receptionLocation: serviceContentDTO.receptionLocation,
                receptionProcess: serviceContentDTO.receptionProcess,
                careType: serviceContentDTO.careType,
                careMethod: serviceContentDTO.careMethod,
                careCycle: serviceContentDTO.careCycle,
                content: serviceContentDTO.content,
                visitCycle: serviceContentDTO.visitCycle,
            });
        }
    } catch (e) {
        console.error('加载详情失败', e);
        message.error('加载详情失败');
    }
};

// 表单验证
const validateForm = (onSuccess: () => void) => {
    formRef.value?.validate((errors: any) => {
        if (errors) {
            console.log('表单验证失败', errors);
            return;
        }
        onSuccess();
    });
};

// ========== 保存与提交 ==========
const doSubmit = async (status: 'DRAFT' | 'ENABLE') => {
    const submitData = buildSubmitData();
    submitData.status = status;
    if (isEdit.value) {
        submitData.id = recordId.value;
        const res = await editServiceRuleApi(submitData);
        if (res.code === 200) {
            message.success(status === 'DRAFT' ? '保存成功' : '提交成功');
            setTimeout(() => {
                router.back();
            }, 1000);
        } else {
            message.error(res.msg || (status === 'DRAFT' ? '保存失败' : '提交失败'));
        }
    } else {
        const res = await addServiceRuleApi(submitData);
        if (res.code === 200) {
            message.success(status === 'DRAFT' ? '保存成功' : '提交成功');
            setTimeout(() => {
                router.back();
            }, 1000);
        } else {
            message.error(res.msg || (status === 'DRAFT' ? '保存失败' : '提交失败'));
        }
    }
};

const handleSave = () => {
    validateForm(() => doSubmit('DRAFT'));
};

const handleSubmit = () => {
    validateForm(() => {
        dialog.warning({
            title: '确认提交',
            content: '同类型配置只能存在一个启用，是否确认提交并启用？',
            positiveText: '确定',
            negativeText: '取消',
            onPositiveClick: () => doSubmit('ENABLE'),
        });
    });
};

onMounted(async () => {
    await getDept();
    await loadDictData();
    if (isEdit.value) {
        loadDetail();
    }
});
</script>

<style scoped lang="less">
.service-rule-config-add-container {
    height: 100%;
    overflow-y: auto;
    padding: 16px;

    .page-title {
        font-size: 16px;
        font-weight: 600;
        color: #333;
        padding-bottom: 16px;
    }

    .section-block {


        .section-title {
            position: relative;
            font-size: 14px;
            font-weight: 600;
            color: #333;
            margin-bottom: 20px;
            padding-left: 12px;

            &::before {
                position: absolute;
                top: 50%;
                left: 0;
                transform: translateY(-50%);
                content: '';
                width: 4px;
                height: 60%;
                border-radius: 4px;
                background: var(--base-color, #2c65f2);
            }
        }
    }
}
</style>

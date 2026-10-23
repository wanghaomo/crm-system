<template>
    <WebPage :hideAddBtn="true">
        <template #headerRight>
            <div class="header-actions">
                <n-button @click="handleViewVersions" color="#DDDFE6" text-color="#666" ghost size="small">版本列表</n-button>
                <n-button v-if="formData.status !== 'IN_USE' && checkPermission(['crm:customer_star_config:create'])" @click="() => handleSave('DESIGN')" color="#2C65F2" ghost size="small">暂 存</n-button>
                <n-button v-if="checkPermission(['crm:customer_star_config:create'])" type="primary" @click="() => handleSave('IN_USE')" color="#2C65F2" size="small">保 存</n-button>
            </div>
        </template>
        <template #content>
            <div class="starConfig-container">
                <n-spin :show="pageLoading">
                    <n-form ref="formRef" :model="formData" :rules="formRules" label-placement="left" label-width="120px">
                        <!-- 基础信息 -->
                        <div class="section-block">
                            <div class="section-title">基础信息</div>
                            <n-grid :cols="2" :x-gap="24">
                                <n-grid-item>
                                    <n-form-item label="星级版本" class="head_form">
                                        <n-input v-model:value="formData.version" disabled placeholder="系统自动生成" />
                                    </n-form-item>
                                </n-grid-item>
                                <n-grid-item>
                                    <n-form-item label="星级指标" path="indicatorIds" class="head_form">
                                        <n-select v-model:value="formData.indicatorIds" multiple placeholder="请选择" :options="indicatorOptions" value-field="id" label-field="indicatorName" max-tag-count="responsive" :ellipsis-tag-popover-props="{ placement: 'top', trigger: 'hover' }">
                                            <template #empty>
                                                <div class="select-empty-tip">暂无配置，请添加星级指标配置</div>
                                            </template>
                                        </n-select>
                                    </n-form-item>
                                </n-grid-item>
                            </n-grid>

                        </div>

                        <!-- 星级指标表格（选中后才展示） -->
                        <div v-if="formData.indicatorIds.length > 0" class="section-block">
                            <MxWebDataTable v-bind="indicatorTableConfig" />
                        </div>

                        <!-- 星级阈值 -->
                        <div class="section-block">
                            <div class="section-title">星级阈值</div>
                            <n-grid :cols="2" :x-gap="24">
                                <n-grid-item>
                                    <n-form-item label="一级客户阈值" path="level1Threshold">
                                        <n-input v-model:value.number="formData.level1Threshold" :allow-input="onlyAllowNumber" placeholder="综合得分≥该值为一级客户（如 90 分）" clearable />
                                    </n-form-item>
                                </n-grid-item>
                                <n-grid-item>
                                    <n-form-item label="二级客户阈值" path="level2Threshold">
                                        <n-input v-model:value.number="formData.level2Threshold" :allow-input="onlyAllowNumber" placeholder="综合得分≥该值且＜一级阈值为二级（如 70 分）" clearable />
                                    </n-form-item>
                                </n-grid-item>
                                <n-grid-item>
                                    <n-form-item label="三级客户阈值" path="level3Threshold">
                                        <n-input v-model:value.number="formData.level3Threshold" :allow-input="onlyAllowNumber" placeholder="综合得分≥该值且＜二级阈值为三级（如 50 分）" clearable />
                                    </n-form-item>
                                </n-grid-item>
                                <n-grid-item>
                                    <n-form-item label="四级客户阈值" path="level4Threshold">
                                        <n-input v-model:value.number="formData.level4Threshold" :allow-input="onlyAllowNumber" :on-blur="() => { formData.level5Threshold = formData.level4Threshold }" placeholder="综合得分≥该值且＜三级阈值为四级（如 30 分）" clearable />
                                    </n-form-item>
                                </n-grid-item>
                                <n-grid-item :span="1">
                                    <n-form-item label="五级客户阈值" path="level5Threshold">
                                        <n-input v-model:value.number="formData.level5Threshold" :allow-input="onlyAllowNumber" placeholder="综合得分＜四级阈值为五级客户（如 30 分以下）" clearable disabled />
                                    </n-form-item>
                                </n-grid-item>
                                <n-grid-item :span="2">
                                    <n-form-item label="自动评估周期" path="autoAssessCycle">
                                        <n-radio-group v-model:value="formData.autoAssessCycle">
                                            <n-radio value="MONTH">每月</n-radio>
                                            <n-radio value="QUARTER">每季度</n-radio>
                                            <n-radio value="HALF_YEAR">每半年</n-radio>
                                        </n-radio-group>
                                    </n-form-item>
                                </n-grid-item>
                                <n-grid-item :span="2">
                                    <n-form-item label="版本备注" path="versionRemark">
                                        <n-input v-model:value="formData.versionRemark" type="textarea" placeholder="请输入" :rows="4" maxlength="200" show-count />
                                    </n-form-item>
                                </n-grid-item>
                            </n-grid>
                        </div>
                    </n-form>
                </n-spin>
            </div>

            <!-- 版本列表抽屉 -->
            <MxDrawer v-model:show="versionDrawerShow" title="版本列表" size="small" :closablePop="false">
                <n-spin :show="versionListLoading">
                    <div class="version-list">
                        <div v-for="item in versionList" :key="item.id || ''" class="version-card">
                            <div class="version-header">
                                <span class="version-title">星级配置{{ item.version }}</span>
                                <!-- <n-tag v-if="item.status === 'IN_USE'" type="success" size="small">使用中</n-tag>
                                <n-tag v-else type="default" size="small">设计中</n-tag> -->
                            </div>
                            <div class="version-remark">
                                <span class="remark-label">版本备注</span>
                                <span class="remark-text">{{ item.versionRemark || '暂无备注' }}</span>
                            </div>
                            <div class="version-actions">
                                <n-switch v-if="checkPermission(['crm:customer_star_config:switch'])" :rail-style="switchStyle" :value="item.status === 'IN_USE'" @update:value="(val: boolean) => handleVersionToggle(item, val)">
                                    <template #checked><span style="font-size: 12px;">启用</span></template>
                                    <template #unchecked><span style="font-size: 12px;">禁用</span></template>
                                </n-switch>
                                <div class="btn-group">
                                    <n-button v-if="item.status !== 'IN_USE'&&checkPermission(['crm:customer_star_config:delete'])" size="small" color="#E34242" ghost @click="handleVersionDelete(item)">删 除</n-button>
                                    <n-button v-if="checkPermission(['crm:customer_star_config:edit'])" size="small" color="#2C65F2" @click="handleVersionEdit(item)" ghost>修 改</n-button>
                                    <n-button v-if="checkPermission(['crm:customer_star_config:copy'])" size="small" color="#2C65F2" @click="handleVersionCopy(item)" ghost>复 制</n-button>
                                    <n-button v-if="item.status === 'IN_USE'&&checkPermission(['crm:customer_star_config:sync'])" size="small" type="primary" color="#2C65F2" @click="handleVersionSync(item)">同 步</n-button>  
                                </div>
                            </div>
                        </div>
                        <div v-if="versionList.length === 0 && !versionListLoading" class="empty-tip">
                            暂无版本数据
                        </div>
                    </div>
                </n-spin>
            </MxDrawer>
        </template>
    </WebPage>
</template>

<script setup lang="ts">
import { checkPermission } from '@/utils/comm';
import { ref, reactive, computed, onMounted, nextTick } from 'vue';
import {
    NButton,
    NForm,
    NFormItem,
    NInput,
    NSelect,
    NRadioGroup,
    NRadio,
    NSwitch,
    NGrid,
    NGridItem,
    NSpin,
    useDialog,
    useMessage,
} from 'naive-ui';
import WebPage from '@/components/WebPage/index.vue';
import MxDrawer from '@/components/MxDrawer/index.vue';
import MxWebDataTable from '@/components/MxWebDataTable/index.vue';
import type { CSSProperties } from 'vue';
import { storeToRefs } from 'pinia';
import { useDictStore } from '@/store/commStore';
import { queryCustomerStarUsingApi, queryCustomerStarIndicatorListApi, createCustomerStarApi, updateCustomerStarApi, queryCustomerStarListApi, deleteCustomerStarApi, updateCustomerStarStatusApi, syncCustomerStarApi } from '@/api/systemManage';

const dialog = useDialog();
const message = useMessage();
const { dictMap } = storeToRefs(useDictStore());
const COMPUTING_CYCLE_DICT_NAME = '计算周期';
// 限制输入框只允许输入数字
const onlyAllowNumber = (value: string) => !value || /^\d*$/.test(value);

/**
 * 将计算周期编码转换为字典名称。
 * @param value 接口返回的计算周期编码或名称
 * @returns 字典名称，未匹配时返回接口原值
 */
const formatComputingCycle = (value: string | null | undefined) => {
    if (value === null || value === undefined || value === '') return '--';
    const options = dictMap.value?.[COMPUTING_CYCLE_DICT_NAME] || [];
    const option = options.find((item: any) => item.value === value || item.label === value);
    return option?.label || value;
};

// 加载状态
const pageLoading = ref(false);
const versionListLoading = ref(false);
// 开关按钮切换样式
const switchStyle = ({ focused, checked }: { focused: boolean; checked: boolean }) => {
    const style: CSSProperties = {};
    if (checked) {
        style.background = '#2C65F2';
        if (focused) {
            style.boxShadow = '0 0 0 2px #2C65F240';
        }
    } else {
        style.background = '#BFBFBF';
        if (focused) {
            style.boxShadow = '0 0 0 2px #BFBFBF40';
        }
    }
    return style;
};



interface StarConfigVersion {
    id?: string;
    version: string;
    status: 'DESIGN' | 'IN_USE'; // DESIGN(设计中)、IN_USE(使用中)
    autoAssessCycle: string;  // 自动评估周期 ：MONTH(每月)、QUARTER(每季度)、HALF_YEAR(每半年)
    indicatorIds: string[];  // 指标ID列表
    indicatorId?: string;  // 后端返回的指标ID字符串（逗号分隔）
    level1Threshold: number | null;
    level2Threshold: number | null;
    level3Threshold: number | null;
    level4Threshold: number | null;
    level5Threshold: number | string | null; // 五级阈值允许输入空字符串（清空后）
    versionRemark: string;
}

// ==================== 指标选项 ====================
const indicatorOptions = ref<any[]>([]);

// 加载指标下拉数据
const loadIndicatorOptions = async () => {
    try {
        const res = await queryCustomerStarIndicatorListApi();
        if (res.code === 200 && res.data) {
            indicatorOptions.value = res.data;
        }
    } catch (e) {
        console.error('加载指标列表失败', e);
    }
};

// ==================== 表单数据 ====================
const formRef = ref<any>(null);

// 版本列表（暂时为空，后续可从接口获取）
const versionList = ref<StarConfigVersion[]>([]);

const formData = reactive<StarConfigVersion>({
    id: '',
    version: '',
    status: 'DESIGN', // DESIGN(设计中)、IN_USE(使用中)
    autoAssessCycle: 'MONTH',  // 自动评估周期 ：MONTH(每月)、QUARTER(每季度)、HALF_YEAR(每半年)
    indicatorIds: [],  // 指标ID列表
    level1Threshold: null,
    level2Threshold: null,
    level3Threshold: null,
    level4Threshold: null,
    level5Threshold: null,
    versionRemark: '',
});

const formRules = {
    indicatorIds: {
        type: 'array' as const,
        required: true,
        message: '请选择星级指标',
        trigger: 'change',
    },
    autoAssessCycle: {
        required: true,
        message: '请选择自动评估周期',
        trigger: 'change',
    },
    level1Threshold: {
        required: true,
        trigger: 'blur',
        validator: (_rule: any, value: any) => {
            if (value === null || value === undefined || value === '') {
                return new Error('请输入一级客户阈值');
            }
            const num = Number(value);
            if (isNaN(num)) {
                return new Error('请输入有效的数字');
            }
            if (num < 0 || num > 100) {
                return new Error('阈值必须在0-100之间');
            }
            return true;
        },
    },
    level2Threshold: {
        required: true,
        trigger: 'blur',
        validator: (_rule: any, value: any) => {
            if (value === null || value === undefined || value === '') {
                return new Error('请输入二级客户阈值');
            }
            const num = Number(value);
            if (isNaN(num)) {
                return new Error('请输入有效的数字');
            }
            if (num < 0 || num > 100) {
                return new Error('阈值必须在0-100之间');
            }
            // 二级阈值不能大于等于一级阈值
            if (formData.level1Threshold !== null && num >= formData.level1Threshold) {
                return new Error('二级阈值不能大于等于一级阈值');
            }
            return true;
        },
    },
    level3Threshold: {
        required: true,
        trigger: 'blur',
        validator: (_rule: any, value: any) => {
            if (value === null || value === undefined || value === '') {
                return new Error('请输入三级客户阈值');
            }
            const num = Number(value);
            if (isNaN(num)) {
                return new Error('请输入有效的数字');
            }
            if (num < 0 || num > 100) {
                return new Error('阈值必须在0-100之间');
            }
            // 三级阈值不能大于等于二级阈值
            if (formData.level2Threshold !== null && num >= formData.level2Threshold) {
                return new Error('三级阈值不能大于等于二级阈值');
            }
            return true;
        },
    },
    level4Threshold: {
        required: true,
        trigger: 'blur',
        validator: (_rule: any, value: any) => {
            if (value === null || value === undefined || value === '') {
                return new Error('请输入四级客户阈值');
            }
            const num = Number(value);
            if (isNaN(num)) {
                return new Error('请输入有效的数字');
            }
            if (num < 0 || num > 100) {
                return new Error('阈值必须在0-100之间');
            }
            // 四级阈值不能大于等于三级阈值
            if (formData.level3Threshold !== null && num >= formData.level3Threshold) {
                return new Error('四级阈值不能大于等于三级阈值');
            }
            return true;
        },
    },
    level5Threshold: {
        required: true,
        trigger: 'blur',
        validator: (_rule: any, value: any) => {
            if (value === null || value === undefined || value === '') {
                return new Error('请输入五级客户阈值');
            }
            const num = Number(value);
            if (isNaN(num)) {
                return new Error('请输入有效的数字');
            }
            if (num < 0 || num > 100) {
                return new Error('阈值必须在0-100之间');
            }
            // 五级阈值不能大于四级阈值
            if (formData.level4Threshold !== null && num > formData.level4Threshold) {
                return new Error('五级阈值不能大于四级阈值');
            }
            return true;
        },
    },
};

// 当前正在编辑的版本ID
const currentEditId = ref<string | null>(null);
const isNew = computed(() => !currentEditId.value);

// 选中的指标详情（用于表格展示）
const selectedIndicators = computed(() => {
    if (!formData.indicatorIds || formData.indicatorIds.length === 0) return [];
    return indicatorOptions.value
        .filter((item) => formData.indicatorIds.includes(item.id))
        .map((item, index) => ({
            index: index + 1,
            indicatorCode: item.indicatorCode,
            indicatorName: item.indicatorName,
            weight: item.weight,
            calcCycle: formatComputingCycle(item.calcCycle),
            dataSource: item.dataSource,
            calcRule: item.calcRule,
        }));
});

// 指标表格配置
const indicatorTableConfig = computed(() => ({
    columns: [
        { title: '指标编号', key: 'indicatorCode' },
        { title: '指标名称', key: 'indicatorName' },
        { title: '指标权重(%)', key: 'weight' },
        { title: '计算周期', key: 'calcCycle' },
        { title: '数据来源', key: 'dataSource' },
        { title: '计算规则', key: 'calcRule' },
    ],
    tableList: selectedIndicators.value,
    isShowPagination: false,
    isShowIndex: true,
    bordered: true,
    bottomBordered: true,
    flexHeight: false,
    singleLine: false,
}));

// 版本列表抽屉
const versionDrawerShow = ref(false);

// ==================== 初始化 ====================
onMounted(async () => {
    try {
        await Promise.all([
            loadIndicatorOptions(),
            initPage()
        ]);
    } finally {
        pageLoading.value = false;
    }
});

const initPage = async () => {
    pageLoading.value = true;
    try {
        const res = await queryCustomerStarUsingApi();
        if (res.code === 200 && res.data && res.data.id) {
            // 有数据，加载使用中的配置
            loadVersionData(res.data);
        } else {
            // 没有数据，展示新增配置界面
            currentEditId.value = null;
            resetForm();
            formData.version = '';
        }
    } catch (e) {
        console.error('加载配置失败', e);
        // 加载失败也展示新增界面
        currentEditId.value = null;
        resetForm();
        formData.version = '';
    } finally {
        pageLoading.value = false;
    }
};

const resetForm = () => {
    formData.version = '';
    formData.status = 'DESIGN';
    formData.level1Threshold = null;
    formData.level2Threshold = null;
    formData.level3Threshold = null;
    formData.level4Threshold = null;
    formData.level5Threshold = null;
    formData.autoAssessCycle = null;
    formData.versionRemark = '';
    formData.indicatorIds = [];
};

const loadVersionData = (data: any) => {
    currentEditId.value = data.id || null;
    nextTick(() => {
        formData.version = data.version || '';
        formData.status = data.status || '';
        formData.level1Threshold = data.level1Threshold;
        formData.level2Threshold = data.level2Threshold;
        formData.level3Threshold = data.level3Threshold;
        formData.level4Threshold = data.level4Threshold;
        formData.level5Threshold = data.level5Threshold;
        formData.autoAssessCycle = data.autoAssessCycle || null;
        formData.versionRemark = data.versionRemark || '';
        formData.indicatorIds = data.indicatorId.split(',') || [];

        // 清除表单验证状态
        formRef.value?.restoreValidation();
    });
};

// ==================== 操作按钮 ====================
// 保存配置（合并保存和暂存）
const handleSave = async (status: 'IN_USE' | 'DESIGN') => {
    const valid = await formRef.value?.validate().catch(() => false);
    if (!valid) return;

    if (status === 'IN_USE') {
        const confirmed = await confirmEnableVersion(currentEditId.value, '当前已有启用配置「星级配置{version}」，客户星级配置只能存在一个启用版本，是否确认保存并启用当前版本？');
        if (!confirmed) return;
    }

    await submitSave(status);
};

const submitSave = async (status: 'IN_USE' | 'DESIGN') => {
    try {
        const submitData = buildSubmitData(status);
        const res = currentEditId.value
            ? await updateCustomerStarApi(submitData)
            : await createCustomerStarApi(submitData);

        if (res.code === 200) {
            const successMsg = status === 'IN_USE' ? '保存成功' : '暂存成功';
            message.success(successMsg);
            // 重新加载页面数据
            await initPage();
        } else {
            const errorMsg = status === 'IN_USE' ? '保存失败' : '暂存失败';
            message.error(res.msg || errorMsg);
        }
    } catch (e) {
        console.error(status === 'IN_USE' ? '保存失败' : '暂存失败', e);
        const errorMsg = status === 'IN_USE' ? '保存失败' : '暂存失败';
        message.error(errorMsg);
    }
};

// 构建提交数据
const buildSubmitData = (status: 'DESIGN' | 'IN_USE') => {
    return {
        id: currentEditId.value || undefined,
        version: formData.version,
        status: status,
        autoAssessCycle: formData.autoAssessCycle,
        indicatorId: formData.indicatorIds.join(','),
        level1Threshold: formData.level1Threshold,
        level2Threshold: formData.level2Threshold,
        level3Threshold: formData.level3Threshold,
        level4Threshold: formData.level4Threshold,
        level5Threshold: formData.level5Threshold,
        versionRemark: formData.versionRemark,
    };
};

const handleViewVersions = async () => {
    versionDrawerShow.value = true;
    await loadVersionList();
};

// 加载版本列表
const loadVersionList = async () => {
    try {
        versionListLoading.value = true;
        const res = await queryCustomerStarListApi({
            page: 1,
            size: 999
        });
        if (res.code === 200 && res.data) {
            versionList.value = res.data.records || [];
        }
    } catch (e) {
        message.error('加载版本列表失败');
    } finally {
        versionListLoading.value = false;
    }
};

const getEnabledVersion = async (excludeId?: string | null) => {
    let list = versionList.value;
    if (list.length === 0) {
        try {
            const res = await queryCustomerStarListApi({
                page: 1,
                size: 999
            });
            if (res.code === 200 && res.data) {
                list = res.data.records || [];
                versionList.value = list;
            }
        } catch (e) {
            console.error('查询启用版本失败', e);
        }
    }
    return list.find((version) => version.status === 'IN_USE' && version.id !== excludeId);
};

const confirmEnableVersion = async (excludeId: string | null | undefined, contentTemplate: string) => {
    const enabledVersion = await getEnabledVersion(excludeId);
    if (!enabledVersion) return true;

    return new Promise<boolean>((resolve) => {
        dialog.warning({
            title: '确认启用',
            content: contentTemplate.replace('{version}', enabledVersion.version || ''),
            positiveText: '确定',
            negativeText: '取消',
            onPositiveClick: () => resolve(true),
            onNegativeClick: () => resolve(false),
            onClose: () => resolve(false),
        });
    });
};



// ==================== 版本列表抽屉操作 ====================
// 版本启用/禁用切换
const handleVersionToggle = async (item: StarConfigVersion, enabled: boolean) => {
    if (enabled) {
        const confirmed = await confirmEnableVersion(item.id, '当前已有启用配置「星级配置{version}」，客户星级配置只能存在一个启用版本，是否确认启用当前版本？');
        if (!confirmed) return;
    }

    await submitVersionStatus(item, enabled);
};

const submitVersionStatus = async (item: StarConfigVersion, enabled: boolean) => {
    try {
        const res = await updateCustomerStarStatusApi({
            id: item.id,
            status: enabled ? 'IN_USE' : 'DESIGN'
        });
        if (res.code === 200) {
            message.success(enabled ? '启用成功' : '已禁用');
            // 重新加载列表
            await loadVersionList();
        } else {
            message.error(res.msg || '操作失败');
        }
    } catch (e) {
        console.error('状态更新失败', e);
        message.error('操作失败');
    }
};

// 修改版本
const handleVersionEdit = (item: StarConfigVersion) => {
    loadVersionData(item);
    versionDrawerShow.value = false;
};

// 复制版本（快速用模板新增）
const handleVersionCopy = (item: StarConfigVersion) => {
    // 清除ID，相当于新增
    currentEditId.value = null;

    // 加载数据但不包含id
    formData.version = ''; // 版本号由系统生成
    formData.status = 'DESIGN';
    formData.level1Threshold = item.level1Threshold;
    formData.level2Threshold = item.level2Threshold;
    formData.level3Threshold = item.level3Threshold;
    formData.level4Threshold = item.level4Threshold;
    formData.level5Threshold = item.level5Threshold;
    formData.autoAssessCycle = item.autoAssessCycle;
    formData.versionRemark = item.versionRemark;
    // 后端返回的可能是 indicatorId（字符串），需要转换
    formData.indicatorIds = item.indicatorId ? item.indicatorId.split(',') : [];

    // 清除表单验证状态
    nextTick(() => {
        formRef.value?.restoreValidation();
    });

    versionDrawerShow.value = false;
    message.success('已复制配置，请修改后保存');
};

// 删除版本
const handleVersionDelete = async (item: StarConfigVersion) => {
    if (item.status === 'IN_USE') {
        message.warning('使用中的配置不可删除');
        return;
    }

    dialog.warning({
        title: '确认删除',
        content: '该配置删除后不可恢复，请确认是否删除？',
        positiveText: '确定',
        negativeText: '取消',
        onPositiveClick: async () => {
            try {
                const res = await deleteCustomerStarApi(item.id);
                if (res.code === 200) {
                    message.success('删除成功');
                    // 重新加载列表
                    await loadVersionList();
                } else {
                    message.error(res.msg || '删除失败');
                }
            } catch (e) {
                console.error('删除失败', e);
                message.error('删除失败');
            }
        },
    });
};

// 同步版本
const handleVersionSync = async (item: StarConfigVersion) => {
    if (item.status !== 'IN_USE') {
        message.warning('仅使用中的配置可以同步');
        return;
    }
    try {
        const res = await syncCustomerStarApi();
        if (res.code === 200) {
            message.success('同步成功');
        } else {
            message.error(res.msg || '同步失败');
        }
    } catch (e) {
        console.error('同步失败', e);
        message.error('同步失败');
    }
    // dialog.warning({
    //     title: '确认同步',
    //     content: '同步操作将把当前配置推送到所有相关系统，是否继续？',
    //     positiveText: '确定',
    //     negativeText: '取消',
    //     onPositiveClick: async () => {
    //         try {
    //             const res = await syncCustomerStarApi();
    //             if (res.code === 200) {
    //                 message.success('同步成功');
    //             } else {
    //                 message.error(res.msg || '同步失败');
    //             }
    //         } catch (e) {
    //             console.error('同步失败', e);
    //             message.error('同步失败');
    //         }
    //     },
    // });
};
</script>

<style scoped lang="less">
:deep(.head_form.n-form-item .n-form-item-label) {
   width: 80px !important;
}
.starConfig-container {
    min-width: 600px;
    overflow-x: auto;
    height: 100%;
    /* 隐藏滚动条 - 跨浏览器兼容 */
    -ms-overflow-style: none;
    /* IE 和 Edge */
    scrollbar-width: none;

    /* Firefox */
    &::-webkit-scrollbar {
        display: none;
        /* Chrome, Safari 和 Opera */
    }

    .section-block {
        background: #fff;
        border-radius: 8px;
        margin-bottom: 16px;

        .section-title {
            position: relative;
            font-size: 16px;
            font-weight: 600;
            color: #333;
            margin-bottom: 16px;
            padding-left: 12px;

            &::before {
                position: absolute;
                left: 0;
                top: 50%;
                transform: translateY(-50%);
                content: ' ';
                display: block;
                width: 4px;
                height: 60%;
                border-radius: 4px;
                background: var(--base-color, #2c65f2);
            }
        }
    }

    .indicator-table {
        margin-top: 8px;
    }

    .action-bar {
        display: flex;
        gap: 12px;
        padding: 16px 0;
    }

    .select-empty-tip {
        padding: 12px;
        text-align: center;
        color: #999;
        font-size: 14px;
    }
}

.header-actions {
    display: flex;
    gap: 12px;
}

/* 版本列表抽屉 */
.version-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 24px;

    .version-card {
        border-radius: 8px;
        padding: 12px;
        border: 1px solid #ECEEF4;

        .version-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;

            .version-title {
                font-size: 15px;
                font-weight: 600;
                color: #333;
            }
        }

        .version-remark {
            background: #f8f9fa;
            margin-bottom: 12px;
            font-size: 14px;
            color: #666;
            padding: 8px;

            .remark-label {
                color: #999;
                margin-right: 8px;
            }
        }

        .version-actions {
            display: flex;
            justify-content: space-between;
            align-items: center;

            .btn-group {
                display: flex;
                gap: 8px;
            }
        }
    }

    .empty-tip {
        text-align: center;
        padding: 40px 0;
        color: #999;
        font-size: 14px;
    }
}
</style>

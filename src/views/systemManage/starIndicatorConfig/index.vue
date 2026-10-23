<template>
    <!-- <WebPage @addEvt="handleAdd" contentPadding="0" :hideAddBtn="!checkPermission(['crm:star_indicator_config:create'])"> -->
    <WebPage @addEvt="handleAdd" contentPadding="0">
        <template #content>
            <div class="starIndicatorConfigContainer">
                <n-spin :show="tableLoading" class="table-loading">
                    <MxWebDataTable v-bind="tableConfig">
                        <template #tableSearch>
                            <MxWebSearchBar :queryConfiguration="queryConfiguration" @queryEvt="handleSearch">
                            </MxWebSearchBar>
                        </template>
                    </MxWebDataTable>
                </n-spin>
            </div>
        </template>
    </WebPage>
    <!-- 新增/编辑/详情抽屉 -->
    <MxDrawer v-model:show="drawerShow" :title="drawerTitle" size="small" :closablePop="false">
        <div v-if="!isView" class="formMain">
            <n-form ref="formRef" :model="formData" :rules="formRules" require-mark-placement="left" label-placement="left" label-align="right" label-width="120px">
                <n-grid :cols="1" :x-gap="0">
                    <n-grid-item>
                        <n-form-item label="指标名称" path="indicatorName">
                            <n-input v-model:value="formData.indicatorName" placeholder="请输入，长度≤30字符" :maxlength="30" show-count clearable />
                        </n-form-item>
                    </n-grid-item>
                    <n-grid-item>
                        <n-form-item label="指标类型" path="indicatorType">
                            <n-select v-model:value="formData.indicatorType" placeholder="请选择" :options="indicatorTypeOptions" disabled />
                        </n-form-item>
                    </n-grid-item>
                    <n-grid-item>
                        <n-form-item label="指标权重(%)" path="weight">
                            <n-input v-model:value.number="formData.weight" :allow-input="onlyAllowNumber" placeholder="请输入0-100的数字" clearable style="width: 100%">
                            </n-input>
                        </n-form-item>
                    </n-grid-item>
                    <n-grid-item>
                        <n-form-item label="占总权重(%)" path="weightPercentage">
                            <n-input-number
                                v-model:value="formData.weightPercentage"
                                :min="0"
                                :max="100"
                                :precision="2"
                                :show-button="false"
                                placeholder="请输入0-100的数字"
                                clearable
                                disabled
                                style="width: 100%" />
                        </n-form-item>
                    </n-grid-item>
                    <n-grid-item>
                        <n-form-item label="计算周期" path="calcCycle">
                            <n-select v-model:value="formData.calcCycle" placeholder="请选择" :options="calcCycleOptions" clearable />
                        </n-form-item>
                    </n-grid-item>
                    <n-grid-item>
                        <n-form-item label="数据来源" path="dataSource">
                            <n-select v-model:value="formData.dataSource" placeholder="请选择" :options="dataSourceOptions" clearable />
                        </n-form-item>
                    </n-grid-item>
                    <n-grid-item>
                        <n-form-item label="计算规则" path="calcRule">
                            <n-input v-model:value.trim="formData.calcRule" type="textarea" placeholder="请输入公式，如：客户累计值/行业均值×100" :rows="4" :maxlength="500" show-count />
                        </n-form-item>
                    </n-grid-item>
                    <n-grid-item>
                        <n-form-item label="分级阈值">
                            <n-input :value="gradeThresholdDisplay" type="textarea" :rows="4" disabled />
                        </n-form-item>
                    </n-grid-item>
                    <n-grid-item>
                        <n-form-item label="标准说明/备注" path="standardDescription">
                            <n-input v-model:value.trim="formData.standardDescription" type="textarea" placeholder="请输入" :rows="4" :maxlength="500" show-count clearable disabled />
                        </n-form-item>
                    </n-grid-item>
                </n-grid>
            </n-form>
        </div>
        <n-spin v-else :show="detailLoading">
            <div class="detail-container">
                <div class="detail-row full-width">
                    <div class="detail-item">
                        <span class="detail-label">指标名称</span>
                        <span class="detail-value">{{ detailData.indicatorName || '--' }}</span>
                    </div>
                </div>
                <div class="detail-row full-width">
                    <div class="detail-item">
                        <span class="detail-label">指标类型</span>
                        <span class="detail-value">{{ formatIndicatorType(detailData.indicatorType) }}</span>
                    </div>
                </div>
                <div class="detail-row full-width">
                    <div class="detail-item">
                        <span class="detail-label">指标权重(%)</span>
                        <span class="detail-value">{{ formatWeightPercentage(detailData.weight) }}</span>
                    </div>
                </div>
                <div class="detail-row full-width">
                    <div class="detail-item">
                        <span class="detail-label">占总权重(%)</span>
                        <span class="detail-value">{{ formatWeightPercentage(detailData.weightPercentage) }}</span>
                    </div>
                </div>
                <div class="detail-row full-width">
                    <div class="detail-item">
                        <span class="detail-label">计算周期</span>
                        <span class="detail-value">{{ formatComputingCycle(detailData.calcCycle) }}</span>
                    </div>
                </div>
                <div class="detail-row full-width">
                    <div class="detail-item">
                        <span class="detail-label">数据来源</span>
                        <span class="detail-value">{{ detailData.dataSource || '--' }}</span>
                    </div>
                </div>
                <div class="detail-row full-width">
                    <div class="detail-item">
                        <span class="detail-label">计算规则</span>
                        <span class="detail-value">{{ detailData.calcRule || '--' }}</span>
                    </div>
                </div>
                <div class="detail-row full-width">
                    <div class="detail-item">
                        <span class="detail-label">分级阈值</span>
                        <span class="detail-value preserve-line-breaks">{{ detailGradeThresholdDisplay }}</span>
                    </div>
                </div>
                <div class="detail-row full-width">
                    <div class="detail-item">
                        <span class="detail-label">标准说明/备注</span>
                        <span class="detail-value">{{ detailData.standardDescription || '--' }}</span>
                    </div>
                </div>
            </div>
        </n-spin>
        <template v-if="!isView" #footer>
            <div class="drawer-footer">
                <n-button color="#2C65F2" @click="handleSave">保 存</n-button>
            </div>
        </template>
    </MxDrawer>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { NForm, NFormItem, NInput, NInputNumber, NSelect, NButton, NSpin, useMessage, } from 'naive-ui';
import { storeToRefs } from 'pinia';
import { queryStarIndicatorListApi, createStarIndicatorApi, updateStarIndicatorApi, deleteStarIndicatorApi, queryStarIndicatorApi } from '@/api/systemManage';
import { useDictStore } from '@/store/commStore';
import { checkPermission } from '@/utils/comm';

const message = useMessage();
const { dictMap } = storeToRefs(useDictStore());
const COMPUTING_CYCLE_DICT_NAME = '计算周期';
const INDICATOR_TYPE_LABEL_MAP: Record<string, string> = {
    CALC: '系统计算',
    DISPLAY: '仅展示',
};
const indicatorTypeOptions = [
    { label: '系统计算', value: 'CALC' },
    { label: '仅展示', value: 'DISPLAY' },
];

/**
 * 格式化指标类型。
 * @param value 指标类型编码
 * @returns 指标类型名称，未匹配时返回接口原值
 */
const formatIndicatorType = (value: string | null | undefined) => {
    if (value === null || value === undefined || value === '') return '--';
    return INDICATOR_TYPE_LABEL_MAP[value] || value;
};

/**
 * 格式化占总权重。
 * @param value 占总权重数值
 * @returns 带百分号的展示值
 */
const formatWeightPercentage = (value: number | string | null | undefined) => {
    if (value === null || value === undefined || value === '') return '--';
    return `${value}%`;
};

/**
 * 判断分级阈值字段是否有值。
 * @param value 待判断的字段值
 * @returns 字段是否有有效值
 */
const hasThresholdValue = (value: unknown) => value !== null && value !== undefined && value !== '';

/**
 * 将系统计算类指标的阈值转换为范围文案。
 * @param threshold 单个等级的阈值配置
 * @returns 阈值范围文案
 */
const formatCalcThreshold = (threshold: any) => {
    if (!threshold || typeof threshold !== 'object') return '--';
    const hasMin = hasThresholdValue(threshold.min);
    const hasMax = hasThresholdValue(threshold.max);
    const unit = threshold.unit || '';
    if (hasMin && hasMax) return `${threshold.min}${unit}≤X＜${threshold.max}${unit}`;
    if (hasMin) return `≥${threshold.min}${unit}`;
    if (hasMax) return `＜${threshold.max}${unit}`;
    return '--';
};

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

// 限制输入框只允许输入数字
const onlyAllowNumber = (value: string) => !value || /^\d*$/.test(value);

// ==================== 计算周期选项 ====================
const calcCycleOptions = computed(() => dictMap.value?.[COMPUTING_CYCLE_DICT_NAME] || []);

// ==================== 数据来源选项 ====================
const dataSourceOptions = [
    { label: '客户档案-历史合作总量', value: '客户档案-历史合作总量' },
    { label: '客户档案-核心产品、矿石需求', value: '客户档案-核心产品、矿石需求' },
    { label: '销售合同-含税总金额、成本数据', value: '销售合同-含税总金额、成本数据' },
    { label: '结算回款-回款金额', value: '结算回款-回款金额' },
    { label: '结算回款-回款周期', value: '结算回款-回款周期' },
];

// ==================== 搜索栏配置 ====================
const queryConfiguration = [{ type: 'input', label: '', value: 'indicatorName', placeholder: '指标名称' }];
// ==================== 表格列配置 ====================
const tableColumns = [
    { title: '指标编号', key: 'indicatorCode', width: 150, ellipsis: { tooltip: true } },
    { title: '指标名称', key: 'indicatorName', width: 150, ellipsis: { tooltip: true } },
    {
        title: '指标类型',
        key: 'indicatorType',
        width: 120,
        render: (row: any) => formatIndicatorType(row.indicatorType),
    },
    {
        title: '标准说明/备注',
        key: 'standardDescription',
        width: 220,
        ellipsis: { tooltip: true },
    },
    { title: '指标权重', key: 'weight', width: 120, render: (row: any) => `${row.weight}%` },
    {
        title: '占总权重（%）',
        key: 'weightPercentage',
        width: 150,
        render: (row: any) => formatWeightPercentage(row.weightPercentage),
    },
    {
        title: '计算周期（单位：月）',
        key: 'calcCycle',
        width: 180,
        render: (row: any) => formatComputingCycle(row.calcCycle),
    },
    { title: '数据来源', key: 'dataSource', width: 200, ellipsis: { tooltip: true } },
    { title: '计算规则', key: 'calcRule', width: 250, ellipsis: { tooltip: true } },
    { title: '创建人', key: 'createdByName', width: 100 },
    { title: '创建时间', key: 'createdAt', width: 180 },
];

// ==================== 表格配置 ====================
const tableLoading = ref(false);
const tableConfig = ref<any>({
    columns: tableColumns,
    tableList: [],
    tableBtns: [
        // {
        //     btnName: '编辑',
        //     btnColor: '#2C65F2',
        //     isBtnHide: (row: any) => checkPermission(['crm:star_indicator_config:edit']),
        //     clickTableBtns: (row: any) => {
        //         handleEdit(row);
        //     },
        // },
        {
            btnName: '详情',
            btnColor: '#2C65F2',
            clickTableBtns: (row: any) => {
                handleDetail(row);
            },
        },
        // {
        //     btnName: '删除',
        //     btnColor: '#E34242',
        //     isBtnHide: (row: any) => checkPermission(['crm:star_indicator_config:delete']),
        //     clickTableBtns: (row: any) => {
        //         handleDelete(row);
        //     },
        // },
    ],
    isShowPagination: true,
    flexHeight: true,
    paginationConfig: {
        pagConfig: {
            page: 1,
            pageSize: 20,
            total: 0,
            showSizePicker: false,
            pageSizes: [10, 20, 50, 100],
        },
        showHeadBorder: true,
        showTotal: true,
        onPageChange: (page: number) => {
            if (tableConfig.value?.paginationConfig?.pagConfig) {
                tableConfig.value.paginationConfig.pagConfig.page = page;
                loadTableData();
            }
        },
        onPageSizeChange: (pageSize: number) => {
            if (tableConfig.value?.paginationConfig?.pagConfig) {
                tableConfig.value.paginationConfig.pagConfig.pageSize = pageSize;
                tableConfig.value.paginationConfig.pagConfig.page = 1;
                loadTableData();
            }
        },
    },
    styleOption: {
        padding: '16px',
        paddingBottom: '0px',
    },
});

// ==================== 搜索参数 ====================
const searchParams = ref({
    indicatorName: '',
});

// ==================== 加载表格数据 ====================
const loadTableData = async () => {
    try {
        tableLoading.value = true;
        const pagination = tableConfig.value?.paginationConfig?.pagConfig;
        const params = {
            current: pagination?.page || 1,
            size: pagination?.pageSize || 20,
            ...searchParams.value,
        };

        const res = await queryStarIndicatorListApi(params);
        if (res.code === 200) {
            const newList = res.data?.records || [];
            const newTotal = res.data?.total || 0;

            if (tableConfig.value) {
                tableConfig.value.tableList = newList;
                if (tableConfig.value.paginationConfig?.pagConfig) {
                    tableConfig.value.paginationConfig.pagConfig.total = newTotal;
                }
            }
        }
    } catch (e) {
        console.error('加载列表失败', e);
        message.error('加载列表失败');
    } finally {
        tableLoading.value = false;
    }
};

// ==================== 事件处理 ====================

const handleDelete = async (row: any) => {
    try {
        const res = await deleteStarIndicatorApi(row.id);
        if (res.code === 200) {
            message.success('删除成功');
            loadTableData();
        } else {
            message.warning(res.msg || '删除失败');
        }
    } catch (e) {
        message.error('删除失败');
    }
};

const handleSearch = (queryObj: any) => {
    searchParams.value.indicatorName = queryObj.indicatorName || '';
    // 重置到第一页
    if (tableConfig.value?.paginationConfig?.pagConfig) {
        tableConfig.value.paginationConfig.pagConfig.page = 1;
    }
    loadTableData();
};

// ==================== 抽屉表单 ====================
const drawerShow = ref(false);
const isEdit = ref(false);
const isView = ref(false);
const editId = ref<string | null>(null);
const formRef = ref<any>(null);
const detailLoading = ref(false);
const detailData = ref<Record<string, any>>({});

const drawerTitle = computed(() => {
    if (isView.value) return '星级指标配置详情';
    return isEdit.value ? '编辑星级指标配置' : '新增星级指标配置';
});

const formData = ref({
    indicatorName: '', // 指标名称
    indicatorType: 'CALC', // 指标类型
    weight: null as number | null, // 指标权重
    weightPercentage: 0 as number | null, // 占总权重
    calcCycle: null as string | null, // 计算周期
    dataSource: '', // 数据来源
    calcRule: '', // 计算规则
    standardDescription: '', // 标准说明/备注
    gradeThresholdJson: [] as Array<Record<string, any>>, // 分级阈值
    scoreJson: [] as Array<Record<string, any>>, // 分级分值
});

/**
 * 生成分级阈值展示文案。
 * @param data 指标详情数据
 * @returns 分级阈值及对应分值文案
 */
const formatGradeThreshold = (data: Record<string, any>) => {
    const thresholdMap = data.gradeThresholdJson?.[0] || {};
    const scoreMap = data.scoreJson?.[0] || {};
    const gradeList = ['A', 'B', 'C', 'D'];
    const rows = gradeList
        .filter((grade) => hasThresholdValue(thresholdMap[grade]) || hasThresholdValue(scoreMap[grade]))
        .map((grade) => {
            const threshold = thresholdMap[grade];
            const thresholdText = data.indicatorType === 'CALC'
                ? formatCalcThreshold(threshold)
                : hasThresholdValue(threshold)
                    ? String(threshold)
                    : '--';
            const scoreText = hasThresholdValue(scoreMap[grade]) ? `${scoreMap[grade]}分` : '--';
            return `${grade}：${thresholdText}，${scoreText}`;
        });
    return rows.join('\n') || '--';
};

const gradeThresholdDisplay = computed(() => formatGradeThreshold(formData.value));
const detailGradeThresholdDisplay = computed(() => formatGradeThreshold(detailData.value));

const formRules = {
    indicatorName: {
        required: true,
        message: '请输入指标名称',
        trigger: 'blur',
    },
    weight: {
        required: true,
        trigger: 'blur',
        validator: (_rule: any, value: any) => {
            if (value === null || value === undefined || value === '') {
                return new Error('请输入指标权重');
            }
            const num = Number(value);
            if (isNaN(num)) {
                return new Error('请输入有效的数字');
            }
            if (num < 0 || num > 100) {
                return new Error('权重必须在0-100之间');
            }
            return true;
        },
    },
    calcCycle: {
        required: true,
        message: '请选择计算周期',
        trigger: 'change',
    },
    dataSource: {
        required: true,
        message: '请选择数据来源',
        trigger: 'change',
    },
    calcRule: {
        required: true,
        message: '请输入计算规则',
        trigger: 'blur',
    },
};

// 打开新增抽屉
const handleAdd = () => {
    isEdit.value = false;
    isView.value = false;
    editId.value = null;
    resetForm();
    drawerShow.value = true;
};

// 打开编辑抽屉
const handleEdit = async (row: any) => {
    isEdit.value = true;
    isView.value = false;
    editId.value = row.id;

    // 加载详情
    try {
        const res = await queryStarIndicatorApi(row.id);
        if (res.code === 200 && res.data) {
            const data = res.data;
            formData.value = {
                indicatorName: data.indicatorName || '',
                indicatorType: data.indicatorType || 'CALC',
                weight: data.weight,
                weightPercentage:
                    data.weightPercentage === null || data.weightPercentage === undefined
                        ? 0
                        : Number(data.weightPercentage),
                calcCycle: data.calcCycle,
                dataSource: data.dataSource || '',
                calcRule: data.calcRule || '',
                standardDescription: data.standardDescription || '',
                gradeThresholdJson: data.gradeThresholdJson || [],
                scoreJson: data.scoreJson || [],
            };
            drawerShow.value = true;
        }
    } catch (e) {
        console.error('加载详情失败', e);
        message.error('加载详情失败');
    }
};

/**
 * 打开星级指标配置详情抽屉。
 * @param row 当前列表行数据
 */
const handleDetail = async (row: any) => {
    isView.value = true;
    isEdit.value = false;
    detailData.value = {};
    detailLoading.value = true;
    drawerShow.value = true;

    try {
        const res = await queryStarIndicatorApi(row.id);
        if (res.code === 200 && res.data) {
            detailData.value = res.data;
            return;
        }
        message.error(res.msg || '加载详情失败');
        drawerShow.value = false;
    } catch (e) {
        console.error('加载详情失败', e);
        message.error('加载详情失败');
        drawerShow.value = false;
    } finally {
        detailLoading.value = false;
    }
};

// 重置表单
const resetForm = () => {
    formData.value = {
        indicatorName: '',
        indicatorType: 'CALC',
        weight: null,
        weightPercentage: 0,
        calcCycle: null,
        dataSource: '',
        calcRule: '',
        standardDescription: '',
        gradeThresholdJson: [],
        scoreJson: [],
    };
    formRef.value?.restoreValidation();
};

// 构建提交数据
const buildSubmitData = () => {
    const data: any = {
        indicatorName: formData.value.indicatorName,
        weight: formData.value.weight,
        calcCycle: formData.value.calcCycle,
        dataSource: formData.value.dataSource,
        calcRule: formData.value.calcRule,
    };
    return data;
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

// 保存（草稿）
const handleSave = () => {
    validateForm(async () => {
        try {
            const submitData = buildSubmitData();

            if (isEdit.value) {
                submitData.id = editId.value;
                const res = await updateStarIndicatorApi(submitData);
                if (res.code === 200) {
                    message.success('保存成功');
                    drawerShow.value = false;
                    loadTableData();
                } else {
                    message.error(res.msg || '保存失败');
                }
            } else {
                const res = await createStarIndicatorApi(submitData);
                if (res.code === 200) {
                    message.success('新增成功');
                    drawerShow.value = false;
                    loadTableData();
                } else {
                    message.error(res.msg || '新增失败');
                }
            }
        } catch (e) {
            console.error('提交失败', e);
            message.error('提交失败');
        }
    });
};



// 页面加载时获取数据
onMounted(() => {
    loadTableData();
});
</script>

<style scoped lang="less">
.starIndicatorConfigContainer {
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

:deep(.table-loading),
:deep(.table-loading .n-spin-content) {
    height: 100%;
    min-width: 0;
    min-height: 0;
}

:deep(.table-loading) {
    flex: 1;
}

:deep(.table-loading .n-spin-content) {
    display: flex;
    flex: 1;
    flex-direction: column;
}

.formMain {
    padding: 16px;
}

.rule-tips {
    display: flex;
    gap: 8px;
    margin-top: 8px;
    flex-wrap: wrap;

    .n-tag {
        cursor: pointer;
        transition: all 0.3s;

        &:hover {
            opacity: 0.8;
            transform: translateY(-1px);
        }
    }
}

.drawer-footer {
    display: flex;
    justify-content: center;
    gap: 12px;
    width: 100%;
}

.detail-container {
    padding: 24px 32px;

    .detail-row {
        display: flex;
        gap: 24px;
        margin-bottom: 20px;

        &.full-width {
            .detail-item {
                flex: 1;
            }
        }
    }

    .detail-item {
        display: flex;
        flex: 1;
        align-items: flex-start;
        min-width: 0;
        min-height: 22px;
    }

    .detail-label {
        width: 112px;
        flex-shrink: 0;
        padding-right: 12px;
        color: #999;
        font-size: 14px;
        line-height: 22px;
        text-align: right;
    }

    .detail-value {
        flex: 1;
        min-width: 0;
        color: #333;
        font-size: 14px;
        line-height: 22px;
        overflow-wrap: anywhere;

        &.preserve-line-breaks {
            white-space: pre-line;
        }
    }
}
</style>

<template>
    <WebPage showBack hideAddBtn contentPadding="0">
        <template #content>
            <n-spin :show="detailLoading" description="加载中...">
                <div class="competitor-detail">
                    <h1 class="detailTitle">竞争对手详情</h1>

                    <!-- 基础信息 -->
                    <div class="detail-section">
                        <n-descriptions bordered :column="2" size="small" label-placement="left" :label-style="descLabelStyle" :content-style="descContentStyle">
                            <n-descriptions-item label="企业名称">{{ detail.enterpriseName || '--' }}</n-descriptions-item>
                            <n-descriptions-item label="矿山名称">{{ detail.mineName || '--' }}</n-descriptions-item>
                            <n-descriptions-item label="资源储存量（万吨）">{{ detail.resourceReserves ?? '--' }}</n-descriptions-item>
                            <n-descriptions-item label="设计开采能力（万吨/年）">{{ detail.designCapacity ?? '--' }}</n-descriptions-item>
                            <n-descriptions-item label="矿山类型">{{ detail.mineType || '--' }}</n-descriptions-item>
                            <n-descriptions-item label="年产量（万吨）">{{ detail.yearOutput ?? '--' }}</n-descriptions-item>
                            <n-descriptions-item label="联系人">{{ detail.contactPerson || '--' }}</n-descriptions-item>
                            <n-descriptions-item label="联系电话">{{ detail.contactPhone || '--' }}</n-descriptions-item>
                            <n-descriptions-item label="矿石库存（万吨）">{{ detail.oreStock ?? '--' }}</n-descriptions-item>
                            <n-descriptions-item label="开工率（%）">{{ detail.operatingRate ?? '--' }}</n-descriptions-item>
                            <n-descriptions-item label="区域">{{ detail.region || '--' }}</n-descriptions-item>
                            <n-descriptions-item label="地址">{{ detail.addressRegion || '--' }}</n-descriptions-item>
                            <n-descriptions-item label="详细地址">{{ detail.detailAddress || '--' }}</n-descriptions-item>
                            <n-descriptions-item label="单据状态">{{ statusText }}</n-descriptions-item>
                            <n-descriptions-item label="备注" :span="2">{{ detail.remark || '--' }}</n-descriptions-item>
                        </n-descriptions>
                    </div>

                    <!-- 调研数据记录：展示调研模块中该企业的调研记录列表 -->
                    <div class="detail-section">
                        <div class="section-title">
                            <span class="title-text">调研数据记录</span>
                        </div>
                        <n-spin :show="surveyLoading">
                            <n-data-table
                                :columns="recordColumns"
                                :data="surveyList"
                                :bordered="true"
                                :single-line="false"
                                size="small"
                                :max-height="320" />
                        </n-spin>
                    </div>
                </div>
            </n-spin>
        </template>
    </WebPage>

    <!-- 单次调研数据详情弹窗 -->
    <n-modal v-model:show="recordModalShow" preset="card" title="调研数据详情" style="width: 760px">
        <n-spin :show="surveyDetailLoading">
            <div class="record-detail" v-if="surveyDetail">
                <n-descriptions bordered :column="2" size="small" label-placement="left" :label-style="descLabelStyle" :content-style="descContentStyle">
                    <n-descriptions-item label="调研月份">{{ surveyDetail.surveyMonth || '--' }}</n-descriptions-item>
                    <n-descriptions-item label="单据状态">{{ surveyStatusText }}</n-descriptions-item>
                    <n-descriptions-item label="矿石库存（万吨）">{{ surveyDetail.inventory ?? '--' }}</n-descriptions-item>
                    <n-descriptions-item label="开工率（%）">{{ surveyDetail.operatingRate ?? '--' }}</n-descriptions-item>
                    <n-descriptions-item label="月产量（万吨）">{{ surveyDetail.monthlyOutput ?? '--' }}</n-descriptions-item>
                    <n-descriptions-item label="最大产能（万吨/月）">{{ surveyDetail.maxOutput ?? '--' }}</n-descriptions-item>
                    <n-descriptions-item label="产品品位（%）">{{ surveyDetail.productGrade ?? '--' }}</n-descriptions-item>
                    <n-descriptions-item label="销售价格（元/吨）">{{ surveyDetail.salesPrice ?? '--' }}</n-descriptions-item>
                    <n-descriptions-item label="主要码头名称">{{ surveyDetail.wharfName || '--' }}</n-descriptions-item>
                    <n-descriptions-item label="主要码头库存（万吨）">{{ surveyDetail.wharfInventory ?? '--' }}</n-descriptions-item>
                    <n-descriptions-item label="销售渠道" :span="2">{{ surveyDetail.salesChannel || '--' }}</n-descriptions-item>
                    <n-descriptions-item label="开工率变化原因" :span="2">{{ surveyDetail.rateChangeReason || '--' }}</n-descriptions-item>
                    <n-descriptions-item label="价格变动原因" :span="2">{{ surveyDetail.priceChangeReason || '--' }}</n-descriptions-item>
                    <n-descriptions-item label="录入人">{{ surveyDetail.inputPerson || '--' }}</n-descriptions-item>
                    <n-descriptions-item label="录入时间">{{ surveyDetail.inputTime || '--' }}</n-descriptions-item>
                </n-descriptions>
                <div class="supply-title">矿石供给</div>
                <n-data-table
                    :columns="supplyColumns"
                    :data="surveyDetail.oreSupplyList || []"
                    :bordered="true"
                    :single-line="false"
                    size="small"
                    :max-height="200" />
            </div>
        </n-spin>
    </n-modal>
</template>

<script setup lang="ts" name="competitorDetail">
import { ref, reactive, computed, h, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { NSpin, NDataTable, NModal, NButton, NDescriptions, NDescriptionsItem } from 'naive-ui';
import { queryCompetitorBaseDetailApi } from '@/api/competitorBase';
// 调研数据记录使用调研模块接口（按企业名称查询该对手的调研列表与详情）
import { queryCompetitorListApi, queryCompetitorDetailApi } from '@/api/competitor';

const route = useRoute();
const detailLoading = ref(false);
const recordModalShow = ref(false);

// 描述列表 label/value 统一样式（label 定宽左置，与新增页表单排版一致）
const descLabelStyle = { width: '180px', color: '#666' };
const descContentStyle = { color: '#333' };

const detail = reactive<any>({
    enterpriseName: '',
    mineName: '',
    resourceReserves: null,
    designCapacity: null,
    mineType: '',
    yearOutput: null,
    contactPerson: '',
    contactPhone: '',
    oreStock: null,
    operatingRate: null,
    region: '',
    addressRegion: '',
    detailAddress: '',
    remark: '',
    status: '',
});

const statusText = computed(() => (detail.status === 'STORAGE' ? '已入库' : detail.status === 'DRAFT' ? '草稿' : '--'));

// ==================== 调研数据记录 ====================
const surveyList = ref<any[]>([]);
const surveyLoading = ref(false);

// 调研记录状态映射
const SURVEY_STATUS_MAP: Record<string, { text: string; color: string }> = {
    DRAFT: { text: '草稿', color: '#FCBD12' },
    ARCHIVED: { text: '已归档', color: '#18D851' },
};

// 数值格式化（无效值显示 --，最多保留1位小数）
const formatNumber = (val: any) => {
    const num = Number(val);
    return val !== null && val !== undefined && Number.isFinite(num) ? String(Math.round(num * 10) / 10) : '--';
};

// 调研记录表格列（末列详情按钮，查看单次调研完整数据）
const recordColumns = [
    { title: '调研月份', key: 'surveyMonth', width: 100 },
    { title: '矿石库存(万吨)', key: 'inventory', width: 130, render: (row: any) => formatNumber(row.inventory) },
    { title: '开工率(%)', key: 'operatingRate', width: 100, render: (row: any) => formatNumber(row.operatingRate) },
    { title: '月产量(万吨)', key: 'monthlyOutput', width: 120, render: (row: any) => formatNumber(row.monthlyOutput) },
    { title: '产品品位(%)', key: 'productGrade', width: 110, render: (row: any) => formatNumber(row.productGrade) },
    { title: '销售价格(元/吨)', key: 'salesPrice', width: 130, render: (row: any) => formatNumber(row.salesPrice) },
    {
        title: '单据状态',
        key: 'status',
        width: 90,
        render(row: any) {
            const st = SURVEY_STATUS_MAP[row.status];
            return h(
                'span',
                { style: { color: st?.color || '#999' } },
                st?.text || row.status || '--',
            );
        },
    },
    {
        title: '操作',
        key: 'actions',
        width: 80,
        render(row: any) {
            return h(
                NButton,
                {
                    text: true,
                    type: 'primary',
                    onClick: () => handleViewRecord(row),
                },
                { default: () => '详情' },
            );
        },
    },
];

// 弹窗内矿石供给表格列
const supplyColumns = [
    { title: '客户名称', key: 'customerName', minWidth: 200 },
    { title: '数量(万吨)', key: 'quantity', width: 140, render: (row: any) => formatNumber(row.quantity) },
];

// 单次调研详情（弹窗）
const surveyDetail = ref<any>(null);
const surveyDetailLoading = ref(false);

const surveyStatusText = computed(() => SURVEY_STATUS_MAP[surveyDetail.value?.status]?.text || '--');

/**
 * 打开单次调研详情弹窗并拉取完整数据。
 * @param row 调研记录行
 * @returns 无返回值
 */
const handleViewRecord = async (row: any) => {
    recordModalShow.value = true;
    surveyDetailLoading.value = true;
    surveyDetail.value = row;
    try {
        const res: any = await queryCompetitorDetailApi(row.id);
        if (res?.data) {
            surveyDetail.value = res.data;
        }
    } catch (error) {
        console.error('加载调研详情失败:', error);
    } finally {
        surveyDetailLoading.value = false;
    }
};

/**
 * 加载调研模块中该企业的调研记录列表（按企业名称匹配）。
 * @returns 无返回值
 */
const loadSurveyList = async () => {
    if (!detail.enterpriseName) return;
    surveyLoading.value = true;
    try {
        const res: any = await queryCompetitorListApi({
            competitorName: detail.enterpriseName,
            current: 1,
            size: 50,
        });
        surveyList.value = res?.data?.records || [];
    } catch (error) {
        console.error('加载调研数据记录失败:', error);
    } finally {
        surveyLoading.value = false;
    }
};

onMounted(async () => {
    if (!route.query.id) return;
    detailLoading.value = true;
    try {
        const res: any = await queryCompetitorBaseDetailApi(Number(route.query.id));
        const data = res?.data;
        if (data) {
            Object.keys(detail).forEach((key) => {
                if (data[key] !== null && data[key] !== undefined) {
                    detail[key] = data[key];
                }
            });
        }
        // 基础信息加载完成后按企业名称查询调研记录
        await loadSurveyList();
    } catch (error) {
        console.error('加载竞争对手详情失败:', error);
    } finally {
        detailLoading.value = false;
    }
});
</script>

<style lang="less" scoped>
.competitor-detail {
    height: 100%;
    overflow-y: auto;
    padding: 16px;

    .detailTitle {
        font-size: 16px;
        font-weight: 600;
        color: #333;
        margin-bottom: 16px;
    }

    .detail-section {
        background: #fff;
        border-radius: 8px;
        padding: 16px 20px;

        & + .detail-section {
            margin-top: 16px;
        }
    }
}

.section-title {
    display: flex;
    align-items: center;
    margin-bottom: 12px;

    .title-text {
        font-size: 15px;
        font-weight: 600;
        color: #333;
        position: relative;
        padding-left: 10px;

        &::before {
            content: '';
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 4px;
            height: 14px;
            border-radius: 2px;
            background: var(--base-color, #2c65f2);
        }
    }
}

.record-detail {
    .supply-title {
        font-size: 14px;
        font-weight: 600;
        color: #333;
        margin: 16px 0 10px;
    }
}
</style>

<template>
    <div class="record-detail">
        <n-spin :show="loading">
            <section class="detail-section">
                <div class="section-title"><span class="section-bar"></span>基础信息</div>
                <div class="basic-info-grid">
                    <div class="basic-info-item">
                        <span class="basic-label">上次评估时间</span>
                        <span class="basic-value">{{ formatTime(detailData.previousEvaluationTime) }}</span>
                    </div>
                    <div class="basic-info-item">
                        <span class="basic-label">服务次数</span>
                        <span class="basic-value">{{ formatValue(detailData.serviceRuleTimes) }}</span>
                    </div>
                    <div class="basic-info-item">
                        <span class="basic-label">增值服务记录数</span>
                        <span class="basic-value">{{ formatCount(detailData.plusServiceTimes) }}</span>
                    </div>
                </div>
            </section>

            <section class="detail-section score-section">
                <div class="section-title"><span class="section-bar"></span>指标得分明细</div>
                <n-data-table
                    :columns="evaluationDetailColumns"
                    :data="detailData.evaluationDetailList || []"
                    :pagination="false"
                    size="small"
                    bordered
                    :single-line="false"
                />
            </section>
        </n-spin>
    </div>
</template>

<script setup lang="ts">
import { NDataTable, NSpin } from 'naive-ui';
import dayjs from 'dayjs';
import { storeToRefs } from 'pinia';
import { useDictStore } from '@/store/commStore';

const COMPUTING_CYCLE_DICT_NAME = '计算周期';
const { dictMap } = storeToRefs(useDictStore());

defineProps<{
    detailData: Record<string, any>;
    loading?: boolean;
}>();

/**
 * 格式化评估时间。
 * @param time 接口返回的时间
 * @returns 格式化后的时间文本
 */
const formatTime = (time: string | null | undefined) => {
    if (!time) return '--';
    return dayjs(time).format('YYYY-MM-DD HH:mm:ss');
};

/**
 * 格式化次数，保留数值 0 并统一增加次数单位。
 * @param value 次数值
 * @returns 带单位的次数文本
 */
const formatCount = (value: number | string | null | undefined) => {
    if (value === null || value === undefined || value === '') return '--';
    return `${value}次`;
};

/**
 * 格式化普通基础信息，保留数值 0。
 * @param value 基础信息值
 * @returns 基础信息文本
 */
const formatValue = (value: number | string | null | undefined) => {
    if (value === null || value === undefined || value === '') return '--';
    return value;
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

const evaluationDetailColumns = [
    { title: '序号', key: 'index', width: 60, render: (_row: any, rowIndex: number) => rowIndex + 1 },
    { title: '指标名称', key: 'indicatorName', width: 140, render: (row: any) => row.indicatorName || '--' },
    { title: '指标权重(%)', key: 'weight', width: 120, render: (row: any) => row.weight ?? '--' },
    { title: '计算周期', key: 'calcCycle', width: 120, render: (row: any) => formatComputingCycle(row.calcCycle) },
    { title: '数据来源', key: 'dataSource', minWidth: 140, render: (row: any) => row.dataSource || '--' },
    { title: '计算规则', key: 'calcRule', minWidth: 180, render: (row: any) => row.calcRule || '--' },
    { title: '计算详情', key: 'calcDetail', width: 90, render: (row: any) => row.calcDetail || '--' },
    { title: '得分', key: 'calcScore', width: 80, render: (row: any) => row.calcScore ?? '--' },
];
</script>

<style scoped lang="less">
.record-detail {
    min-height: 100%;
    // padding: 4px 0 20px;
    padding: 16px 24px; 
    color: #333;

    .detail-section {
        margin-bottom: 22px;
    }

    .section-title {
        display: flex;
        align-items: center;
        margin-bottom: 16px;
        font-size: 16px;
        font-weight: 600;
        line-height: 22px;
    }

    .section-bar {
        width: 4px;
        height: 18px;
        margin-right: 10px;
        border-radius: 2px;
        background: #2c65f2;
    }

    .basic-info-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px 40px;
        margin-bottom: 16px;
    }

    .basic-info-item {
        display: flex;
        align-items: center;
        gap: 8px;
        min-height: 28px;
    }

    .basic-label {
        min-width: 100px;
        color: #999;
        text-align: right;
    }

    .basic-value {
        color: #333;
        text-align: right;
        word-break: break-all;
    }

    .score-section {
        :deep(.n-data-table-td),
        :deep(.n-data-table-th) {
            white-space: normal;
            word-break: break-word;
        }
    }
}
</style>

<template>
  <n-spin :show="detailLoading">
    <div class="detail-content">
      <div class="detail-header">
        <div class="detail-header-top">
          <span class="detail-title">{{ detailData.competitorName || '--' }}</span>
          <span class="status-text" :class="{ draft: detailData.status === 'DRAFT' }">
            {{ detailData.statusName || getStatusText(detailData.status) }}
          </span>
        </div>
        <div class="detail-header-info">
          <div class="info-item">
            <span class="info-label">录入人</span>
            <span class="info-value">{{ detailData.inputPerson || '--' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">区域</span>
            <MxDict v-if="detailData.region" :modelValue="detailData.region" dictType="区域类型" text />
          </div>
          <div class="info-item">
            <span class="info-label">录入时间</span>
            <span class="info-value">{{ detailData.inputTime || '--' }}</span>
          </div>
        </div>
      </div>
      <!-- <div class="gray-separator"></div> -->

      <div class="detail-section">
        <div class="section-title"><span class="section-bar"></span>基础信息</div>
        <n-descriptions label-placement="left" :column="2" :separator="false" class="detail-descriptions">
          <n-descriptions-item label="调研月份">{{ formatSurveyMonth(detailData.surveyMonth) }}</n-descriptions-item>
          <n-descriptions-item label="矿山类型">
            <MxDict v-if="detailData.mineType" :modelValue="detailData.mineType" dictType="矿山类型" text />
            <span v-else>--</span>
          </n-descriptions-item>
          <n-descriptions-item label="详细地址">{{ detailData.detailAddress || '--' }}</n-descriptions-item>
          <n-descriptions-item label="联系人">{{ detailData.contactPerson || '--' }}</n-descriptions-item>
          <n-descriptions-item label="联系电话">{{ detailData.contactPhone || '--' }}</n-descriptions-item>
          <n-descriptions-item label="开工率(%)">
            <span :class="{ 'text-error': isOperatingRateInvalid(detailData.operatingRate) }">
              {{ detailData.operatingRate ?? '--' }}
            </span>
          </n-descriptions-item>
          <n-descriptions-item :span="2" label="矿石库存(万吨)">{{ formatNumber(detailData.inventory, 1) }}</n-descriptions-item>
          <n-descriptions-item :span="2" label="开工率变化原因">{{ detailData.rateChangeReason || '--' }}</n-descriptions-item>
          <n-descriptions-item label="月产量(万吨)">{{ formatNumber(detailData.monthlyOutput, 1) }}</n-descriptions-item>
          <n-descriptions-item label="最大产能(万吨/月)">{{ formatNumber(detailData.maxOutput, 1) }}</n-descriptions-item>
          <n-descriptions-item label="产品品位(%)">{{ formatNumber(detailData.productGrade, 1) }}</n-descriptions-item>
          <n-descriptions-item label="主要码头名称">{{ detailData.wharfName || '--' }}</n-descriptions-item>
          <n-descriptions-item label="主要码头库存(万吨)">{{ formatNumber(detailData.wharfInventory, 1) }}</n-descriptions-item>
          <n-descriptions-item :span="2" label="销售价格(元/吨)">{{ detailData.salesPrice ?? '--' }}</n-descriptions-item>
          <n-descriptions-item :span="2" label="销售渠道">{{ detailData.salesChannel || '--' }}</n-descriptions-item>
          <n-descriptions-item :span="2" label="价格变动原因">{{ detailData.priceChangeReason || '--' }}</n-descriptions-item>
        </n-descriptions>
      </div>

      <div class="detail-section chart-pair">
        <div class="chart-block">
          <div class="section-title"><span class="section-bar"></span>库存变化趋势</div>
          <div class="chart-filter">
            <n-select v-model:value="inventoryChartRange" :options="inventoryRangeOptions" size="small" style="width: 232px" @update:value="getInventoryTrend" />
          </div>
          <div class="chart-unit">单位: 万吨</div>
          <n-spin :show="inventoryChartLoading">
            <n-empty v-if="!inventoryTrendData.length" class="chart-empty" description="暂无数据" />
            <div v-show="inventoryTrendData.length" ref="inventoryChartRef" class="chart-container"></div>
          </n-spin>
        </div>
        <div class="chart-block">
          <div class="section-title"><span class="section-bar"></span>开工率vs价格对比图</div>
          <div class="chart-filter">
            <n-select v-model:value="rateChartRange" :options="rateRangeOptions" size="small" style="width: 232px" @update:value="getRatePriceContrast" />
          </div>
          <n-spin :show="rateChartLoading">
            <n-empty v-if="!ratePriceData.length" class="chart-empty" description="暂无数据" />
            <div v-show="ratePriceData.length" ref="rateChartRef" class="chart-container"></div>
          </n-spin>
        </div>
      </div>
    </div>
  </n-spin>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import * as echarts from 'echarts';
import { NDescriptions, NDescriptionsItem, NEmpty, NSelect, NSpin } from 'naive-ui';
import { queryCompetitorDetailApi, queryCompetitorInventoryTrendApi, queryCompetitorRatePriceContrastApi } from '@/api/competitor';

type TrendItem = { date: string; inventory: number | null; operatingRate: number | null; price: number | null; pendingSettlement: number | null; pendingCollection: number | null };

const props = withDefaults(defineProps<{
  recordId: number | string | null;
  initialData?: Record<string, any>;
}>(), { initialData: () => ({}) });

const detailData = ref<any>({});
const detailLoading = ref(false);

const getStatusText = (s: string) => s === 'ARCHIVED' ? '已归档' : s === 'DRAFT' ? '草稿' : '--';
const isOperatingRateInvalid = (r: number | null | undefined) => r !== null && r !== undefined && (r < 0 || r > 100);
const formatNumber = (val: any, digits: number) => { const n = Number(val); return val !== null && val !== undefined && Number.isFinite(n) ? n.toFixed(digits) : '--'; };
const formatSurveyMonth = (v: string) => v ? v.slice(0, 7) : '--';
const normalizeDateText = (v: string) => v ? v.slice(0, 10).replace(/-/g, '.') : '--';

// 库存趋势图
const inventoryChartRef = ref<HTMLElement | null>(null);
let inventoryChartInstance: echarts.ECharts | null = null;
const inventoryChartRange = ref(6);
const inventoryChartLoading = ref(false);
const inventoryTrendData = ref<TrendItem[]>([]);
const inventoryRangeOptions = [
  { label: '近3月', value: 3 }, { label: '近6月', value: 6 }, { label: '近12月', value: 12 },
];

// 开工率vs价格图
const rateChartRef = ref<HTMLElement | null>(null);
let rateChartInstance: echarts.ECharts | null = null;
const rateChartRange = ref(3);
const rateChartLoading = ref(false);
const ratePriceData = ref<TrendItem[]>([]);
const rateRangeOptions = [
  { label: '近3月', value: 3 }, { label: '近6月', value: 6 },
];

const getTrendList = (data: any): any[] => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.records)) return data.records;
  if (Array.isArray(data?.list)) return data.list;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.trendList)) return data.trendList;
  return [];
};

const normalizeTrendData = (data: any): TrendItem[] => getTrendList(data).map((item: any) => {
  const inv = Number(item.inventory), rate = Number(item.operatingRate), price = Number(item.price);
  return {
    date: normalizeDateText(item.inputTime || item.surveyMonth || item.date || item.createdAt),
    inventory: Number.isFinite(inv) ? inv : null,
    operatingRate: Number.isFinite(rate) ? rate : null,
    price: Number.isFinite(price) ? price : null,
    pendingSettlement: Number(item.pendingSettlement) || null,
    pendingCollection: Number(item.pendingCollection) || null,
  };
}).filter((item: TrendItem) => item.date !== '--');

const initInventoryChart = (data: TrendItem[]) => {
  if (!inventoryChartRef.value || !data.length) return;
  inventoryChartInstance?.dispose();
  inventoryChartInstance = echarts.init(inventoryChartRef.value);
  inventoryChartInstance.setOption({
    color: ['#2C65F2'],
    grid: { left: 18, right: 24, top: 18, bottom: 30, containLabel: true },
    tooltip: { trigger: 'axis', formatter: (params: any) => { const item = params?.[0]; return item ? `${item.axisValue}<br/>库存: ${item.value} 万吨` : ''; } },
    xAxis: { type: 'category', boundaryGap: false, data: data.map(i => i.date), axisTick: { show: false }, axisLine: { lineStyle: { color: '#e5e7eb' } }, axisLabel: { color: '#A8ABB2', fontSize: 12 } },
    yAxis: { type: 'value', axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: '#A8ABB2', fontSize: 12 }, splitLine: { lineStyle: { color: '#F1F3F5' } } },
    series: [{ data: data.map(i => i.inventory), type: 'line', smooth: true, symbol: 'circle', symbolSize: 5, connectNulls: true, lineStyle: { color: '#8DB9FF', width: 2 }, itemStyle: { color: '#2C65F2', borderColor: '#fff', borderWidth: 2 } }],
  });
};

const initRateChart = (data: TrendItem[]) => {
  if (!rateChartRef.value || !data.length) return;
  rateChartInstance?.dispose();
  rateChartInstance = echarts.init(rateChartRef.value);
  rateChartInstance.setOption({
    color: ['#2C65F2', '#18D851'],
    grid: { left: 10, right: 10, top: 40, bottom: 30, containLabel: false },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        if (!Array.isArray(params) || !params.length) return '';
        const idx = params[0]?.dataIndex ?? 0;
        const trend = data[idx];
        const lines = params.map((item: any) => `${item.marker} ${item.seriesName}: ${item.seriesName === '开工率' ? item.value + '%' : item.value}`);
        if (trend?.pendingSettlement != null) lines.push(`待结算: ${trend.pendingSettlement}`);
        if (trend?.pendingCollection != null) lines.push(`待回款: ${trend.pendingCollection}`);
        return lines.reduce((p: string, c: string) => `${p}<br/>${c}`, params[0]?.axisValue || '');
      },
    },
    xAxis: { type: 'category', data: data.map(i => i.date), axisTick: { show: false }, axisLine: { lineStyle: { color: '#e5e7eb' } }, axisLabel: { color: '#A8ABB2', fontSize: 12 }, boundaryGap: false },
    yAxis: [
      { type: 'value', name: '价格(元/吨)', nameTextStyle: { color: '#999' }, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: '#999', fontSize: 12 }, splitLine: { lineStyle: { color: '#F1F3F5' } } },
      { type: 'value', name: '开工率(%)', min: 0, max: 100, nameTextStyle: { color: '#999' }, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: '#999', fontSize: 12, formatter: '{value}%' }, splitLine: { show: false } },
    ],
    series: [
      { name: '价格', type: 'line', smooth: true, symbol: 'circle', symbolSize: 5, connectNulls: true, lineStyle: { width: 2 }, itemStyle: { color: '#2C65F2' }, data: data.map(i => i.price) },
      { name: '开工率', type: 'line', yAxisIndex: 1, smooth: true, symbol: 'circle', symbolSize: 5, connectNulls: true, lineStyle: { width: 2 }, itemStyle: { color: '#18D851' }, data: data.map(i => i.operatingRate) },
    ],
  });
};

const getAccurateName = () => detailData.value.competitorName || detailData.value.enterpriseName || '';

const getInventoryTrend = async () => {
  if (!getAccurateName()) return;
  inventoryChartLoading.value = true;
  try {
    const res = await queryCompetitorInventoryTrendApi({ accurateName: getAccurateName(), months: inventoryChartRange.value });
    inventoryTrendData.value = res?.code === 200 ? normalizeTrendData(res.data).filter((item: TrendItem) => item.inventory !== null) : [];
    await nextTick();
    initInventoryChart(inventoryTrendData.value);
  } finally { inventoryChartLoading.value = false; }
};

const getRatePriceContrast = async () => {
  if (!getAccurateName()) return;
  rateChartLoading.value = true;
  try {
    const res = await queryCompetitorRatePriceContrastApi({ accurateName: getAccurateName(), months: rateChartRange.value });
    ratePriceData.value = res?.code === 200 ? normalizeTrendData(res.data).filter((item: TrendItem) => item.price !== null || item.operatingRate !== null) : [];
    await nextTick();
    initRateChart(ratePriceData.value);
  } finally { rateChartLoading.value = false; }
};

const resetCharts = () => {
  inventoryTrendData.value = []; ratePriceData.value = [];
  inventoryChartInstance?.dispose(); rateChartInstance?.dispose();
  inventoryChartInstance = null; rateChartInstance = null;
};

const handleChartResize = () => { inventoryChartInstance?.resize(); rateChartInstance?.resize(); };

const loadDetail = async (id: number | string) => {
  detailLoading.value = true;
  resetCharts();
  inventoryChartRange.value = 6;
  rateChartRange.value = 3;
  try {
    const res = await queryCompetitorDetailApi(id);
    detailData.value = res?.code === 200 ? { ...props.initialData, ...res.data } : { ...props.initialData };
    await nextTick();
    await Promise.all([getInventoryTrend(), getRatePriceContrast()]);
  } finally { detailLoading.value = false; }
};

watch(() => [props.recordId, props.initialData], ([id]) => {
  detailData.value = { ...props.initialData };
  if (id) loadDetail(id as number | string); else resetCharts();
}, { immediate: true, deep: true });

onMounted(() => window.addEventListener('resize', handleChartResize));
onBeforeUnmount(() => { window.removeEventListener('resize', handleChartResize); resetCharts(); });
</script>

<style scoped lang="less">
.detail-content {
  display: flex; flex-direction: column; min-height: calc(100vh - 64px); background: #fff; color: #333;
  .detail-header {
    padding: 12px 24px; flex-shrink: 0; border-bottom: 1px solid #eef0f3;
    .detail-header-top { display: flex; align-items: center; gap: 12px; margin-bottom: 8px;
      .detail-title { font-size: 16px; font-weight: 600; }
      .status-text { font-size: 14px; padding: 1px 4px; border-radius: 4px; color: #5AA771; background-color: #F0F9EB; border: 1px solid #E2F4D8;
        &.draft { color: #909399; background-color: #F4F4F5; border-color: #E9E9EB; }
      }
    }
    .detail-header-info { display: flex; align-items: center;
      .info-item { display: flex; align-items: center; gap: 8px; font-size: 14px; margin-right: 88px;
        .info-label { color: #999; } .info-value { color: #333; }
      }
    }
  }
  .gray-separator { height: 1px; background: #e2e2e2; flex-shrink: 0; }
  .detail-section {
    padding: 24px 24px 20px 24px;
    .section-title { display: flex; align-items: center; gap: 8px; font-size: 16px; font-weight: 600; color: #333; margin-bottom: 14px;
      .section-bar { display: inline-block; width: 4px; height: 14px; background-color: #2c65f2; border-radius: 2px; }
    }
    .detail-descriptions { font-size: 14px; color: #333;
      :deep(.n-descriptions-table) { table-layout: fixed; }
      :deep(.n-descriptions-table-content) { padding-bottom: 14px; vertical-align: top; width: 520px; }
      :deep(.n-descriptions-table-content__label) { display: inline-block; width: 128px !important; margin-right: 12px; color: #999; text-align: right; vertical-align: top; line-height: 20px; white-space: normal; }
      :deep(.n-descriptions-table-content__content) { color: #333; max-width: 420px; white-space: break-spaces; }
    }
  }
  .chart-pair { display: flex; gap: 40px; padding-top: 14px; padding-bottom: 24px;
    .chart-block { flex: 1; min-width: 0; display: flex; flex-direction: column; .section-title { margin-bottom: 12px; } }
  }
  .chart-filter { margin-bottom: 10px; :deep(.n-base-selection) { --n-height: 30px !important; } }
  .chart-unit { color: #A8ABB2; font-size: 12px; margin: 10px 0 0 0; }
  .chart-container { width: 100%; height: 246px; }
  .chart-empty { height: 246px; display: flex; align-items: center; justify-content: center; }
}
.text-error { color: #E34242; }
</style>

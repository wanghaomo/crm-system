<template>
    <div class="cockpit-container">
        <!-- 顶部标题区 -->
        <div class="header">
            <div class="header-left">
                <div class="header-title">磷矿石供需数据地图</div>
            </div>
            <div class="header-right">
                <div class="datetime-display">{{ datetime }}</div>
                <div class="fullscreen-btn" title="全屏" @click="toggleFullscreen">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#69b1ff" stroke-width="2">
                        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                    </svg>
                </div>
            </div>
        </div>

        <!-- 主内容区 -->
        <div class="main-content">
            <!-- 左侧列 - 供给侧 -->
            <div class="column">
                <div class="panel panel-overview">
                    <div class="panel-corner-bl"></div>
                    <div class="panel-corner-br"></div>
                    <div class="panel-header">
                        <div class="panel-title supply">四川磷矿石产量</div>
                    </div>
                    <div class="panel-body" style="height:calc(100% - 42px);">
                        <div class="supply-overview-wrap">
                            <div class="supply-big-number">
                                <div class="big-label">预计总产量</div>
                                <div class="big-value">{{ animatedExpected }}</div>
                                <div class="big-unit">万吨 / 年</div>
                            </div>
                            <div class="supply-divider"></div>
                            <div class="supply-big-number actual">
                                <div class="big-label">实际产量</div>
                                <div class="big-value">{{ animatedActual }}</div>
                                <div class="big-unit">万吨 / 年</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="panel panel-mine-list">
                    <div class="panel-corner-bl"></div>
                    <div class="panel-corner-br"></div>
                    <div class="panel-header">
                        <div class="panel-title supply">主要矿山产量分布</div>
                        <div style="font-size:11px;color:#8c9ab4;">TOP 10 矿区</div>
                    </div>
                    <div class="panel-body mine-list-body" style="height:calc(100% - 42px);">
                        <div class="mine-list-scroll">
                            <div class="mine-list" v-for="copy in 2" :key="copy">
                                <div v-for="m in mineListData" :key="m.name" class="mine-item">
                                    <div class="mine-name">{{ m.name }}</div>
                                    <div class="mine-bar-wrap">
                                        <div class="mine-bars">
                                            <div class="mine-bar-row">
                                                <span class="mine-bar-tag">预</span>
                                                <div class="mine-bar"><div class="mine-bar-fill" :style="{ width: m.pctExpected + '%' }"></div></div>
                                                <div class="mine-output">{{ m.expected }}万吨</div>
                                            </div>
                                            <div class="mine-bar-row">
                                                <span class="mine-bar-tag actual">实</span>
                                                <div class="mine-bar"><div class="mine-bar-fill actual" :style="{ width: m.pctActual + '%' }"></div></div>
                                                <div class="mine-output actual">{{ m.actual }}万吨</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="panel panel-trend">
                    <div class="panel-corner-bl"></div>
                    <div class="panel-corner-br"></div>
                    <div class="panel-header">
                        <div class="panel-title supply">主要矿山供给趋势</div>
                        <div style="font-size:11px;color:#8c9ab4;">TOP5 · 近8月 + 未来4月</div>
                    </div>
                    <div class="panel-body" style="height:calc(100% - 42px);padding:8px;">
                        <div ref="supplyTrendRef" class="chart-container"></div>
                    </div>
                </div>
            </div>

            <!-- 中间列 - 主地图 -->
            <div class="column">
                <div class="panel map-panel">
                    <div class="panel-corner-bl"></div>
                    <div class="panel-corner-br"></div>
                    <div class="panel-header">
                        <div class="panel-title">全国供需流向地图</div>
                        <div style="font-size:11px;display:flex;gap:16px;">
                            <span style="color:#52c41a;">● 供给端</span>
                            <span style="color:#ff7a45;">● 需求端</span>
                            <span style="color:#69b1ff;">━━ 流向</span>
                        </div>
                    </div>
                    <div class="panel-body" style="flex:1;min-height:0;padding:8px;position:relative;display:flex;flex-direction:column;">
                        <div ref="mainMapRef" class="map-container">
                            <div class="map-legend">
                                <div class="legend-item"><span class="legend-dot supply"></span><span>供给矿区 (四川)</span></div>
                                <div class="legend-item"><span class="legend-dot demand"></span><span>需求城市 (湖北)</span></div>
                                <div class="legend-item"><span class="legend-line"></span><span>供需流向线</span></div>
                            </div>
                            <div class="map-controls">
                                <div class="map-type-tabs">
                                    <div
                                        v-for="t in mapTypes"
                                        :key="t"
                                        :class="['map-type-tab', { active: activeMapType === t }]"
                                        @click="activeMapType = t"
                                    >{{ t }}</div>
                                </div>
                                <div class="map-zoom-btns">
                                    <div class="zoom-btn" @click="zoomMap(1)">+</div>
                                    <div class="zoom-btn" @click="zoomMap(-1)">−</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 右侧列 - 需求侧 -->
            <div class="column">
                <div class="panel panel-overview">
                    <div class="panel-corner-bl"></div>
                    <div class="panel-corner-br"></div>
                    <div class="panel-header">
                        <div class="panel-title demand">湖北磷矿石需求</div>
                    </div>
                    <div class="panel-body" style="height:calc(100% - 42px);">
                        <div class="supply-overview-wrap">
                            <div class="supply-big-number demand-big-number">
                                <div class="big-label">预计总需求</div>
                                <div class="big-value">{{ animatedDemandExpected }}</div>
                                <div class="big-unit">万吨 / 年</div>
                            </div>
                            <div class="supply-divider demand-divider"></div>
                            <div class="supply-big-number demand-big-number actual">
                                <div class="big-label">实际需求</div>
                                <div class="big-value">{{ animatedDemandActual }}</div>
                                <div class="big-unit">万吨 / 年</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="panel panel-mine-list">
                    <div class="panel-corner-bl"></div>
                    <div class="panel-corner-br"></div>
                    <div class="panel-header">
                        <div class="panel-title demand">主要客户需求分布</div>
                        <div style="font-size:11px;color:#8c9ab4;">TOP 10 客户</div>
                    </div>
                    <div class="panel-body mine-list-body" style="height:calc(100% - 42px);">
                        <div class="mine-list-scroll">
                            <div class="mine-list" v-for="copy in 2" :key="copy">
                                <div v-for="m in demandListData" :key="m.name" class="mine-item demand">
                                    <div class="mine-name">{{ m.name }}</div>
                                    <div class="mine-bar-wrap">
                                        <div class="mine-bars">
                                            <div class="mine-bar-row">
                                                <span class="mine-bar-tag">预</span>
                                                <div class="mine-bar"><div class="mine-bar-fill" :style="{ width: m.pctExpected + '%' }"></div></div>
                                                <div class="mine-output">{{ m.expected }}万吨</div>
                                            </div>
                                            <div class="mine-bar-row">
                                                <span class="mine-bar-tag actual">实</span>
                                                <div class="mine-bar"><div class="mine-bar-fill actual-demand" :style="{ width: m.pctActual + '%' }"></div></div>
                                                <div class="mine-output actual-demand-text">{{ m.actual }}万吨</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="panel panel-trend">
                    <div class="panel-corner-bl"></div>
                    <div class="panel-corner-br"></div>
                    <div class="panel-header">
                        <div class="panel-title demand">主要客户需求趋势</div>
                        <div style="font-size:11px;color:#8c9ab4;">TOP5 · 近8月 + 未来4月</div>
                    </div>
                    <div class="panel-body" style="height:calc(100% - 42px);padding:8px;">
                        <div ref="demandTrendRef" class="chart-container"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import * as echarts from 'echarts';

/* ==================== Mock 数据 ==================== */
const sichuanMines = [
    { name: '马边磷矿', type: '磷矿', expected: 6800, actual: 6100, coord: [103.55, 28.83] },
    { name: '雷波磷矿', type: '磷矿', expected: 6200, actual: 5800, coord: [103.57, 28.26] },
    { name: '绵竹磷矿', type: '磷矿', expected: 5400, actual: 4900, coord: [104.22, 31.34] },
    { name: '清平磷矿', type: '磷矿', expected: 4800, actual: 4500, coord: [104.13, 31.50] },
    { name: '金河磷矿', type: '磷矿', expected: 4200, actual: 3900, coord: [104.05, 31.42] },
    { name: '汉源磷矿', type: '磷矿', expected: 3600, actual: 3200, coord: [102.67, 29.35] },
    { name: '会东磷矿', type: '磷矿', expected: 3100, actual: 2800, coord: [102.58, 26.63] },
    { name: '叙永磷矿', type: '磷矿', expected: 2600, actual: 2400, coord: [105.43, 28.17] },
    { name: '什邡磷矿', type: '磷矿', expected: 2200, actual: 1900, coord: [104.16, 31.13] },
    { name: '绵竹天池磷矿', type: '磷矿', expected: 1800, actual: 1500, coord: [104.10, 31.45] },
];
const hubeiCustomers = [
    { name: '宜化集团', expected: 2100, actual: 1980, coord: [111.30, 30.70] },
    { name: '兴发集团', expected: 1950, actual: 1820, coord: [111.35, 31.22] },
    { name: '三宁化工', expected: 1800, actual: 1650, coord: [111.76, 30.42] },
    { name: '华鲁恒升', expected: 1650, actual: 1520, coord: [114.31, 30.60] },
    { name: '新洋丰', expected: 1500, actual: 1380, coord: [112.20, 31.03] },
    { name: '鄂中生态', expected: 1350, actual: 1240, coord: [112.58, 30.87] },
    { name: '祥云股份', expected: 1200, actual: 1080, coord: [115.55, 29.85] },
    { name: '湖北宜化', expected: 1100, actual: 980, coord: [111.28, 30.69] },
    { name: '黄麦岭化工', expected: 950, actual: 850, coord: [114.42, 30.92] },
    { name: '中化涪陵', expected: 820, actual: 720, coord: [107.42, 29.70] },
];
/**
 * 生成最近 8 个月（截止上月）+ 未来 4 个月的月份标签。
 * @returns 月份标签数组，未来月份带「(预)」后缀
 */
function buildTrendMonths(): { months: string[]; actualCount: number } {
    const now = new Date();
    const labels: string[] = [];
    // 最近 8 个月（截止上月）
    for (let i = 8; i >= 1; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        labels.push(`${d.getMonth() + 1}月`);
    }
    // 未来 4 个月
    for (let i = 0; i < 4; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
        labels.push(`${d.getMonth() + 1}月(预)`);
    }
    return { months: labels, actualCount: 8 };
}

/**
 * 基于矿山名与月份下标生成稳定伪随机数（0~1），保证每次刷新数据一致。
 * @param seed 种子字符串（矿山名）
 * @param idx 月份下标
 * @returns 0~1 之间的数
 */
function pseudoRandom(seed: string, idx: number): number {
    let h = 0;
    const s = seed + ':' + idx;
    for (let i = 0; i < s.length; i++) {
        h = (h * 31 + s.charCodeAt(i)) >>> 0;
    }
    return (h % 1000) / 1000;
}

/** TOP5 矿山供给趋势：最近 8 个月实际 + 未来 4 个月预测（万吨/月） */
const top5SupplyTrend = (() => {
    const { months, actualCount } = buildTrendMonths();
    const now = new Date();
    // 按预计年产量倒序取前 5
    const top5 = [...sichuanMines].sort((a, b) => b.expected - a.expected).slice(0, 5);
    const series = top5.map((mine) => {
        const monthlyAvg = mine.expected / 12;
        // 实际：8 个月，围绕 monthlyAvg ±15% 波动
        const actual = months.slice(0, actualCount).map((_, i) => {
            const r = pseudoRandom(mine.name, i);
            return Math.round(monthlyAvg * (0.85 + r * 0.3));
        });
        // 预测：未来 4 个月，在前 8 月均值基础上略上扬（5%），用虚线展示
        const lastActual = actual[actualCount - 1];
        const forecast: (number | null)[] = new Array(actualCount - 1).fill(null);
        // 预测起点与实际末月重叠（保证虚线连得上）
        forecast.push(lastActual);
        for (let i = 1; i <= 4; i++) {
            const r = pseudoRandom(mine.name + ':forecast', i);
            forecast.push(Math.round(lastActual * (1.02 + r * 0.08)));
        }
        return { name: mine.name, actual, forecast };
    });
    return { year: now.getFullYear(), months, actualCount, series };
})();
/** TOP5 客户需求趋势：最近 8 个月实际 + 未来 4 个月预测（万吨/月） */
const top5DemandTrend = (() => {
    const { months, actualCount } = buildTrendMonths();
    const now = new Date();
    const top5 = [...hubeiCustomers].sort((a, b) => b.expected - a.expected).slice(0, 5);
    const series = top5.map((cust) => {
        const monthlyAvg = cust.expected / 12;
        const actual = months.slice(0, actualCount).map((_, i) => {
            const r = pseudoRandom(cust.name, i);
            return Math.round(monthlyAvg * (0.85 + r * 0.3));
        });
        const lastActual = actual[actualCount - 1];
        const forecast: (number | null)[] = new Array(actualCount - 1).fill(null);
        forecast.push(lastActual);
        for (let i = 1; i <= 4; i++) {
            const r = pseudoRandom(cust.name + ':forecast', i);
            forecast.push(Math.round(lastActual * (1.02 + r * 0.08)));
        }
        return { name: cust.name, actual, forecast };
    });
    return { year: now.getFullYear(), months, actualCount, series };
})();
const flowLines = [
    { from: '马边磷矿', to: '华鲁恒升', value: 850 }, { from: '马边磷矿', to: '祥云股份', value: 620 },
    { from: '马边磷矿', to: '中化涪陵', value: 580 }, { from: '雷波磷矿', to: '宜化集团', value: 520 },
    { from: '雷波磷矿', to: '新洋丰', value: 380 }, { from: '绵竹磷矿', to: '宜化集团', value: 680 },
    { from: '绵竹磷矿', to: '华鲁恒升', value: 450 }, { from: '绵竹磷矿', to: '三宁化工', value: 520 },
    { from: '清平磷矿', to: '宜化集团', value: 720 }, { from: '清平磷矿', to: '新洋丰', value: 480 },
    { from: '金河磷矿', to: '华鲁恒升', value: 380 }, { from: '金河磷矿', to: '祥云股份', value: 420 },
    { from: '汉源磷矿', to: '三宁化工', value: 560 }, { from: '汉源磷矿', to: '中化涪陵', value: 340 },
];

/* ==================== 响应式状态 ==================== */
const mapTypes = ['标准', '热力', '卫星'];
const activeMapType = ref('标准');
const datetime = ref('');
const animatedExpected = ref('0');
const animatedActual = ref('0');
const animatedDemandExpected = ref('0');
const animatedDemandActual = ref('0');

/* ==================== 计算 ==================== */
const mineListData = computed(() => {
    const max = Math.max(...sichuanMines.map((m) => m.expected));
    return sichuanMines.map((m) => ({
        ...m,
        pctExpected: (m.expected / max) * 100,
        pctActual: (m.actual / max) * 100,
    }));
});
const demandListData = computed(() => {
    const max = Math.max(...hubeiCustomers.map((c) => c.expected));
    return hubeiCustomers.map((c) => ({
        ...c,
        pctExpected: (c.expected / max) * 100,
        pctActual: (c.actual / max) * 100,
    }));
});

/* ==================== Refs ==================== */
const supplyTrendRef = ref<HTMLElement | null>(null);
const demandTrendRef = ref<HTMLElement | null>(null);
const mainMapRef = ref<HTMLElement | null>(null);
const charts: Record<string, echarts.ECharts> = {};
const chartList: echarts.ECharts[] = [];

/* ==================== 工具 ==================== */
let timeTimer: number | undefined;
function tick() {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    datetime.value = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}
function toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
}
function animateCountUp(el: any, target: number) {
    const duration = 1500;
    const startTime = performance.now();
    function update(currentTime: number) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        el.value = Math.floor(target * easeOut).toLocaleString();
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}
function zoomMap(delta: number) {
    const chart = charts.mainMap;
    if (!chart) return;
    const opt: any = chart.getOption();
    const geo = opt.geo;
    const currentZoom = (Array.isArray(geo) ? geo[0] : geo).zoom || 1;
    chart.setOption({ geo: { zoom: Math.max(0.5, Math.min(5, currentZoom + delta * 0.2)) } });
}

/* ==================== ECharts 初始化 ==================== */
function initSupplyTrend() {
    const chart = echarts.init(supplyTrendRef.value!);
    const d = top5SupplyTrend;
    // TOP5 矿山配色
    const colors = ['#52c41a', '#1677ff', '#69b1ff', '#faad14', '#ff7a45'];
    const rgbs = ['82,196,26', '22,119,255', '105,177,255', '250,173,20', '255,122,69'];
    const g = (rgb: string) => new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: `rgba(${rgb},0.3)` }, { offset: 1, color: `rgba(${rgb},0.02)` }]);
    const series: any[] = [];
    d.series.forEach((s, i) => {
        // 实际供给（实线 + 面积）
        series.push({
            name: s.name,
            type: 'line',
            smooth: true,
            symbol: 'circle',
            symbolSize: 5,
            areaStyle: { color: g(rgbs[i]) },
            lineStyle: { color: colors[i], width: 2 },
            itemStyle: { color: colors[i] },
            emphasis: { focus: 'series' },
            data: s.actual,
        });
        // 未来预测（同色虚线，无面积）
        series.push({
            name: `${s.name}(预测)`,
            type: 'line',
            smooth: true,
            symbol: 'none',
            lineStyle: { color: colors[i], width: 2, type: 'dashed' },
            itemStyle: { color: colors[i] },
            // 与图例联动但不出现在 legend 中（避免翻倍）
            legendHoverLink: false,
            data: s.forecast,
            tooltip: { show: true },
        });
    });
    chart.setOption({
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(10, 22, 40, 0.9)',
            borderColor: 'rgba(22, 119, 255, 0.3)',
            textStyle: { color: '#c9d5e8', fontSize: 11 },
            formatter: (params: any) => {
                const lines = params
                    .filter((p: any) => p.value !== null && p.value !== undefined && !Number.isNaN(Number(p.value)))
                    .map((p: any) => `${p.marker}${p.seriesName}：${Number(p.value).toLocaleString()} 万吨`);
                return `${d.year}年${params[0].axisValue}<br/>` + lines.join('<br/>');
            },
        },
        legend: {
            // 仅显示实际线（5 条），预测虚线隐藏避免拥挤
            data: d.series.map((s) => s.name),
            textStyle: { color: '#8c9ab4', fontSize: 10 },
            top: 0,
            right: 0,
            itemWidth: 14,
        },
        grid: { left: 44, right: 10, top: 30, bottom: 24 },
        xAxis: { type: 'category', boundaryGap: false, data: d.months, axisLine: { lineStyle: { color: 'rgba(22, 119, 255, 0.2)' } }, axisLabel: { color: '#8c9ab4', fontSize: 10 } },
        yAxis: { type: 'value', axisLine: { show: false }, axisLabel: { color: '#8c9ab4', fontSize: 10 }, splitLine: { lineStyle: { color: 'rgba(22, 119, 255, 0.08)' } } },
        series,
    });
    charts.supplyTrend = chart; chartList.push(chart);
    // 默认随机展示一个月份的 tooltip（仅历史实际月份，避免落在预测虚线区）
    setTimeout(() => {
        const randomIdx = Math.floor(Math.random() * d.actualCount);
        chart.dispatchAction({ type: 'showTip', seriesIndex: 0, dataIndex: randomIdx });
        // 高亮当前轴
        chart.dispatchAction({ type: 'highlight', seriesIndex: 0, dataIndex: randomIdx });
    }, 600);
}
function initDemandTrend() {
    const chart = echarts.init(demandTrendRef.value!);
    const d = top5DemandTrend;
    const colors = ['#ff7a45', '#ffa940', '#faad14', '#ffd666', '#ff9c6e'];
    const rgbs = ['255,122,69', '255,169,64', '250,173,20', '255,214,102', '255,156,110'];
    const g = (rgb: string) => new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: `rgba(${rgb},0.3)` }, { offset: 1, color: `rgba(${rgb},0.02)` }]);
    const series: any[] = [];
    d.series.forEach((s, i) => {
        series.push({
            name: s.name,
            type: 'line',
            smooth: true,
            symbol: 'circle',
            symbolSize: 5,
            areaStyle: { color: g(rgbs[i]) },
            lineStyle: { color: colors[i], width: 2 },
            itemStyle: { color: colors[i] },
            emphasis: { focus: 'series' },
            data: s.actual,
        });
        series.push({
            name: `${s.name}(预测)`,
            type: 'line',
            smooth: true,
            symbol: 'none',
            lineStyle: { color: colors[i], width: 2, type: 'dashed' },
            itemStyle: { color: colors[i] },
            legendHoverLink: false,
            data: s.forecast,
            tooltip: { show: true },
        });
    });
    chart.setOption({
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(10, 22, 40, 0.9)',
            borderColor: 'rgba(22, 119, 255, 0.3)',
            textStyle: { color: '#c9d5e8', fontSize: 11 },
            formatter: (params: any) => {
                const lines = params
                    .filter((p: any) => p.value !== null && p.value !== undefined && !Number.isNaN(Number(p.value)))
                    .map((p: any) => `${p.marker}${p.seriesName}：${Number(p.value).toLocaleString()} 万吨`);
                return `${d.year}年${params[0].axisValue}<br/>` + lines.join('<br/>');
            },
        },
        legend: {
            data: d.series.map((s) => s.name),
            textStyle: { color: '#8c9ab4', fontSize: 10 },
            top: 0,
            right: 0,
            itemWidth: 14,
        },
        grid: { left: 44, right: 10, top: 30, bottom: 24 },
        xAxis: { type: 'category', boundaryGap: false, data: d.months, axisLine: { lineStyle: { color: 'rgba(22, 119, 255, 0.2)' } }, axisLabel: { color: '#8c9ab4', fontSize: 10 } },
        yAxis: { type: 'value', axisLine: { show: false }, axisLabel: { color: '#8c9ab4', fontSize: 10 }, splitLine: { lineStyle: { color: 'rgba(22, 119, 255, 0.08)' } } },
        series,
    });
    charts.demandTrend = chart; chartList.push(chart);
    // 默认随机展示一个月份的 tooltip
    setTimeout(() => {
        const randomIdx = Math.floor(Math.random() * d.actualCount);
        chart.dispatchAction({ type: 'showTip', seriesIndex: 0, dataIndex: randomIdx });
        chart.dispatchAction({ type: 'highlight', seriesIndex: 0, dataIndex: randomIdx });
    }, 800);
}

/* ==================== 简化中国 GeoJSON ==================== */
const fallbackChinaGeoJSON = {
    type: 'FeatureCollection',
    features: [
        { type: 'Feature', properties: { name: '新疆维吾尔自治区' }, geometry: { type: 'Polygon', coordinates: [[[74,37],[80,35],[85,36],[90,37],[95,40],[97,45],[96,50],[92,53],[88,54],[83,52],[78,50],[75,47],[74,42],[74,37]]] } },
        { type: 'Feature', properties: { name: '西藏自治区' }, geometry: { type: 'Polygon', coordinates: [[[78,27],[83,27],[88,28],[92,29],[95,32],[98,36],[97,40],[93,39],[88,37],[82,35],[79,33],[77,30],[78,27]]] } },
        { type: 'Feature', properties: { name: '青海省' }, geometry: { type: 'Polygon', coordinates: [[[89,32],[93,31],[98,32],[102,35],[103,38],[101,40],[97,39],[94,38],[90,37],[89,35],[89,32]]] } },
        { type: 'Feature', properties: { name: '甘肃省' }, geometry: { type: 'Polygon', coordinates: [[[93,40],[97,39],[101,38],[104,37],[106,36],[108,37],[109,40],[107,42],[104,42],[101,41],[97,41],[94,41],[93,40]]] } },
        { type: 'Feature', properties: { name: '内蒙古自治区' }, geometry: { type: 'Polygon', coordinates: [[[97,42],[102,41],[108,40],[113,42],[118,44],[122,46],[126,50],[124,53],[120,53],[115,52],[110,52],[106,51],[102,50],[98,47],[97,45],[97,42]]] } },
        { type: 'Feature', properties: { name: '宁夏回族自治区' }, geometry: { type: 'Polygon', coordinates: [[[104,36],[107,36],[108,38],[107,40],[105,40],[104,38],[104,36]]] } },
        { type: 'Feature', properties: { name: '陕西省' }, geometry: { type: 'Polygon', coordinates: [[[105,32],[108,32],[111,33],[112,35],[111,38],[110,40],[108,40],[106,39],[105,36],[105,32]]] } },
        { type: 'Feature', properties: { name: '山西省' }, geometry: { type: 'Polygon', coordinates: [[[110,35],[113,35],[115,37],[114,40],[112,41],[110,40],[109,38],[110,35]]] } },
        { type: 'Feature', properties: { name: '河北省' }, geometry: { type: 'Polygon', coordinates: [[[113,36],[116,36],[119,38],[119,42],[117,42],[115,41],[114,39],[113,37],[113,36]]] } },
        { type: 'Feature', properties: { name: '北京市' }, geometry: { type: 'Polygon', coordinates: [[[115.5,39.5],[117.5,39.5],[117.5,41],[115.5,41],[115.5,39.5]]] } },
        { type: 'Feature', properties: { name: '天津市' }, geometry: { type: 'Polygon', coordinates: [[[117,38.5],[118,38.5],[118,40],[117,40],[117,38.5]]] } },
        { type: 'Feature', properties: { name: '山东省' }, geometry: { type: 'Polygon', coordinates: [[[114,34],[118,34],[122,37],[122,38],[120,38],[118,37],[116,37],[114,36],[114,34]]] } },
        { type: 'Feature', properties: { name: '河南省' }, geometry: { type: 'Polygon', coordinates: [[[110,32],[114,32],[116,34],[116,36],[113,36],[111,35],[110,33],[110,32]]] } },
        { type: 'Feature', properties: { name: '江苏省' }, geometry: { type: 'Polygon', coordinates: [[[116,31],[120,31],[123,33],[122,35],[119,35],[117,34],[116,32],[116,31]]] } },
        { type: 'Feature', properties: { name: '安徽省' }, geometry: { type: 'Polygon', coordinates: [[[114,29],[117,29],[119,31],[118,33],[116,34],[114,33],[113,31],[114,29]]] } },
        { type: 'Feature', properties: { name: '上海市' }, geometry: { type: 'Polygon', coordinates: [[[120.5,30.5],[122,30.5],[122,32],[120.5,32],[120.5,30.5]]] } },
        { type: 'Feature', properties: { name: '浙江省' }, geometry: { type: 'Polygon', coordinates: [[[118,27],[121,27],[123,30],[122,31],[120,31],[118,30],[118,27]]] } },
        { type: 'Feature', properties: { name: '福建省' }, geometry: { type: 'Polygon', coordinates: [[[116,23],[118,23],[120,25],[120,28],[118,28],[116,27],[116,25],[116,23]]] } },
        { type: 'Feature', properties: { name: '台湾省' }, geometry: { type: 'Polygon', coordinates: [[[120,21],[122,22],[122,25],[121,25.5],[120,24],[120,21]]] } },
        { type: 'Feature', properties: { name: '广东省' }, geometry: { type: 'Polygon', coordinates: [[[109,20],[113,20],[117,22],[117,25],[114,25],[111,24],[109,22],[109,20]]] } },
        { type: 'Feature', properties: { name: '广西壮族自治区' }, geometry: { type: 'Polygon', coordinates: [[[104,21],[107,21],[111,22],[111,25],[108,26],[105,25],[104,23],[104,21]]] } },
        { type: 'Feature', properties: { name: '海南省' }, geometry: { type: 'Polygon', coordinates: [[[108,18],[111,18],[111,20],[109,20],[108,19],[108,18]]] } },
        { type: 'Feature', properties: { name: '云南省' }, geometry: { type: 'Polygon', coordinates: [[[97,21],[100,21],[104,22],[106,25],[105,28],[102,29],[99,28],[97,26],[97,23],[97,21]]] } },
        { type: 'Feature', properties: { name: '贵州省' }, geometry: { type: 'Polygon', coordinates: [[[103,25],[106,25],[109,26],[109,29],[107,29],[104,28],[103,27],[103,25]]] } },
        { type: 'Feature', properties: { name: '四川省' }, geometry: { type: 'Polygon', coordinates: [[[97,26],[100,26],[105,26],[108,28],[110,30],[109,34],[106,34],[103,34],[100,33],[98,32],[97,30],[97,26]]] } },
        { type: 'Feature', properties: { name: '重庆市' }, geometry: { type: 'Polygon', coordinates: [[[105,28],[108,28],[110,30],[109,32],[107,32],[105,30],[105,28]]] } },
        { type: 'Feature', properties: { name: '湖北省' }, geometry: { type: 'Polygon', coordinates: [[[108,29],[112,29],[116,30],[116,33],[114,34],[111,34],[109,32],[108,30],[108,29]]] } },
        { type: 'Feature', properties: { name: '湖南省' }, geometry: { type: 'Polygon', coordinates: [[[108,25],[111,25],[114,27],[114,30],[112,30],[109,29],[108,27],[108,25]]] } },
        { type: 'Feature', properties: { name: '江西省' }, geometry: { type: 'Polygon', coordinates: [[[113,24],[116,24],[118,27],[118,30],[116,30],[114,29],[113,27],[113,24]]] } },
        { type: 'Feature', properties: { name: '辽宁省' }, geometry: { type: 'Polygon', coordinates: [[[119,39],[123,39],[125,42],[124,43],[122,42],[120,41],[119,40],[119,39]]] } },
        { type: 'Feature', properties: { name: '吉林省' }, geometry: { type: 'Polygon', coordinates: [[[122,41],[126,41],[131,43],[130,46],[127,46],[124,44],[122,43],[122,41]]] } },
        { type: 'Feature', properties: { name: '黑龙江省' }, geometry: { type: 'Polygon', coordinates: [[[121,43],[126,43],[132,46],[135,48],[134,54],[130,54],[127,53],[124,51],[121,48],[121,45],[121,43]]] } },
        { type: 'Feature', properties: { name: '香港特别行政区' }, geometry: { type: 'Polygon', coordinates: [[[113.8,22.1],[114.4,22.1],[114.4,22.6],[113.8,22.6],[113.8,22.1]]] } },
        { type: 'Feature', properties: { name: '澳门特别行政区' }, geometry: { type: 'Polygon', coordinates: [[[113.5,22.1],[113.6,22.1],[113.6,22.3],[113.5,22.3],[113.5,22.1]]] } },
    ],
};

function initMainMap(geoJson: any) {
    const chart = echarts.init(mainMapRef.value!);
    if (geoJson) echarts.registerMap('china', geoJson);
    const coordMap: Record<string, number[]> = {};
    sichuanMines.forEach((m) => (coordMap[m.name] = m.coord));
    hubeiCustomers.forEach((c) => (coordMap[c.name] = c.coord));
    const supplyPoints = sichuanMines.map((m) => ({ name: m.name, value: [...m.coord, m.expected], itemStyle: { color: '#52c41a' } }));
    const demandPoints = hubeiCustomers.map((c) => ({ name: c.name, value: [...c.coord, c.expected], itemStyle: { color: '#ff7a45' } }));
    // 矿山年产量索引，tooltip 用
    const mineActualMap: Record<string, number> = {};
    sichuanMines.forEach((m) => { mineActualMap[m.name] = m.actual; });
    const lineData = flowLines.map((f) => ({
        fromName: f.from,
        toName: f.to,
        coords: [coordMap[f.from], coordMap[f.to]],
        value: f.value,
        // 该矿山的实际年产量（万吨/年）
        mineActual: mineActualMap[f.from] ?? 0,
    }));
    chart.setOption({
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'item',
            backgroundColor: 'rgba(10, 22, 40, 0.95)',
            borderColor: 'rgba(22, 119, 255, 0.3)',
            textStyle: { color: '#c9d5e8', fontSize: 12 },
            formatter: (p: any) => {
                if (p.seriesType === 'lines') {
                    const { fromName, toName, value, mineActual } = p.data;
                    // 实际供给量 / 实际年产量 的占比（年产量为 0 时显示 --）
                    const ratio = mineActual > 0 ? ((value / mineActual) * 100).toFixed(1) + '%' : '--';
                    return `${fromName} → ${toName}<br/>实际年产量：${mineActual.toLocaleString()} 万吨<br/>实际供给量：${value.toLocaleString()} 万吨<br/>供给量占比：${ratio}`;
                }
                if (p.seriesType === 'effectScatter') return `${p.name}<br/>${p.seriesName === '供给矿区' ? '产量' : '需求量'}: ${p.value[2]}万吨`;
                return p.name;
            },
        },
        geo: {
            map: 'china', roam: true, zoom: 2.2, center: [107.5, 32.5],
            label: { show: false },
            itemStyle: { areaColor: 'rgba(22,119,255,0.08)', borderColor: 'rgba(22,119,255,0.3)', borderWidth: 1 },
            emphasis: { itemStyle: { areaColor: 'rgba(22,119,255,0.2)' }, label: { show: true, color: '#fff', fontSize: 10 } },
            regions: [
                { name: '四川省', itemStyle: { areaColor: 'rgba(82,196,26,0.25)', borderColor: '#52c41a', borderWidth: 1.5 }, emphasis: { itemStyle: { areaColor: 'rgba(82,196,26,0.4)' } } },
                { name: '湖北省', itemStyle: { areaColor: 'rgba(255,122,69,0.25)', borderColor: '#ff7a45', borderWidth: 1.5 }, emphasis: { itemStyle: { areaColor: 'rgba(255,122,69,0.4)' } } },
            ],
        },
        series: [
            {
                name: '供需流向', type: 'lines', zlevel: 1,
                effect: { show: true, period: 6, trailLength: 0.3, color: '#69b1ff', symbolSize: 4 },
                lineStyle: { color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: '#52c41a' }, { offset: 1, color: '#ff7a45' }]), width: 1.5, opacity: 0.6, curveness: 0.25 },
                data: lineData,
            },
            {
                name: '供给矿区', type: 'effectScatter', coordinateSystem: 'geo', zlevel: 2,
                rippleEffect: { brushType: 'stroke', scale: 4, period: 3 },
                symbolSize: (v: number[]) => Math.max(8, v[2] / 500),
                itemStyle: { color: '#52c41a', shadowBlur: 10, shadowColor: '#52c41a' },
                label: { show: true, position: 'right', formatter: '{b}', color: '#95de64', fontSize: 10 },
                data: supplyPoints,
            },
            {
                name: '需求城市', type: 'effectScatter', coordinateSystem: 'geo', zlevel: 2,
                rippleEffect: { brushType: 'stroke', scale: 4, period: 3 },
                symbolSize: (v: number[]) => Math.max(8, v[2] / 300),
                itemStyle: { color: '#ff7a45', shadowBlur: 10, shadowColor: '#ff7a45' },
                label: { show: true, position: 'right', formatter: '{b}', color: '#ffa940', fontSize: 10 },
                data: demandPoints,
            },
        ],
    });
    charts.mainMap = chart; chartList.push(chart);
}
function loadMapData() {
    const sources = [
        'https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json',
        'https://cdn.jsdelivr.net/gh/Plortinus/china-geojson@master/china.geojson',
        'https://fastly.jsdelivr.net/gh/Plortinus/china-geojson@master/china.geojson',
        'https://unpkg.com/china-location@2.0.1/geojson/china.json',
    ];
    let i = 0;
    function tryNext() {
        if (i >= sources.length) { initMainMap(fallbackChinaGeoJSON); return; }
        fetch(sources[i])
            .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
            .then((geo: any) => { if (geo && geo.features && geo.features.length) initMainMap(geo); else throw new Error('bad'); })
            .catch(() => { i++; tryNext(); });
    }
    tryNext();
}

/* ==================== 生命周期 ==================== */
let resizeHandler: (() => void) | null = null;
onMounted(() => {
    tick();
    timeTimer = window.setInterval(tick, 1000);
    requestAnimationFrame(() => animateCountUp(animatedExpected, 28650));
    requestAnimationFrame(() => animateCountUp(animatedActual, 25800));
    requestAnimationFrame(() => animateCountUp(animatedDemandExpected, 9280));
    requestAnimationFrame(() => animateCountUp(animatedDemandActual, 8350));
    initSupplyTrend(); initDemandTrend();
    loadMapData();
    resizeHandler = () => chartList.forEach((c) => c.resize());
    window.addEventListener('resize', resizeHandler);
});
onBeforeUnmount(() => {
    if (timeTimer) window.clearInterval(timeTimer);
    if (resizeHandler) window.removeEventListener('resize', resizeHandler);
    chartList.forEach((c) => c.dispose());
});
</script>

<style scoped>
/* ==================== 全局容器 ==================== */
.cockpit-container { position: fixed; top: 53px; left: 240px; right: 0; bottom: 0; height: auto !important; background: #081628; z-index: 50; padding: 12px 16px; display: flex; flex-direction: column; box-sizing: border-box; overflow-y: auto; }

/* ==================== 顶部 ==================== */
.header { height: 64px; display: flex; align-items: center; justify-content: center; background: linear-gradient(180deg, rgba(22,119,255,0.15) 0%, transparent 100%); border-bottom: 1px solid rgba(22,119,255,0.3); padding: 0 20px; position: relative; margin-bottom: 12px; border-radius: 4px; }
.header::before, .header::after { content: ''; position: absolute; bottom: -1px; width: 200px; height: 2px; background: linear-gradient(90deg, transparent, #1677ff, transparent); }
.header::before { left: 0; }
.header::after { right: 0; }
.header-title { font-size: 28px; font-weight: bold; background: linear-gradient(180deg, #fff 0%, #69b1ff 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-shadow: 0 0 20px rgba(22,119,255,0.5); letter-spacing: 4px; }
.header-left { display: flex; flex-direction: column; gap: 2px; }
.header-right { position: absolute; right: 20px; top: 50%; transform: translateY(-50%); display: flex; align-items: center; gap: 16px; }
.datetime-display { font-size: 14px; color: #c9d5e8; font-family: "Courier New", monospace; }
.fullscreen-btn { width: 32px; height: 32px; border: 1px solid rgba(22,119,255,0.4); border-radius: 4px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.3s; background: rgba(22,119,255,0.1); }
.fullscreen-btn:hover { background: rgba(22,119,255,0.3); box-shadow: 0 0 10px rgba(22,119,255,0.5); }

/* ==================== 主内容区 ==================== */
.main-content { flex: 1; display: grid; grid-template-columns: 1fr 1.6fr 1fr; gap: 12px; margin-bottom: 12px; min-height: 0; }
.column { display: flex; flex-direction: column; gap: 12px; min-height: 0; }

/* ==================== 卡片 ==================== */
.panel { background: linear-gradient(135deg, rgba(16,36,66,0.8) 0%, rgba(10,22,40,0.9) 100%); border: 1px solid rgba(22,119,255,0.25); border-radius: 6px; position: relative; backdrop-filter: blur(10px); overflow: hidden; }
.panel::before { content: ''; position: absolute; top: 0; left: 0; width: 12px; height: 12px; border-top: 2px solid #1677ff; border-left: 2px solid #1677ff; border-radius: 2px 0 0 0; }
.panel::after { content: ''; position: absolute; top: 0; right: 0; width: 12px; height: 12px; border-top: 2px solid #1677ff; border-right: 2px solid #1677ff; border-radius: 0 2px 0 0; }
.panel-corner-bl { position: absolute; bottom: 0; left: 0; width: 12px; height: 12px; border-bottom: 2px solid #1677ff; border-left: 2px solid #1677ff; border-radius: 0 0 0 2px; }
.panel-corner-br { position: absolute; bottom: 0; right: 0; width: 12px; height: 12px; border-bottom: 2px solid #1677ff; border-right: 2px solid #1677ff; border-radius: 0 0 2px 0; }
.panel-header { padding: 10px 16px; border-bottom: 1px solid rgba(22,119,255,0.15); display: flex; align-items: center; justify-content: space-between; background: linear-gradient(90deg, rgba(22,119,255,0.1) 0%, transparent 100%); }
.panel-title { font-size: 15px; font-weight: 600; color: #e6f0ff; display: flex; align-items: center; gap: 8px; }
.panel-title::before { content: ''; width: 4px; height: 16px; background: linear-gradient(180deg, #1677ff 0%, #69b1ff 100%); border-radius: 2px; box-shadow: 0 0 8px rgba(22,119,255,0.6); }
.panel-title.supply::before { background: linear-gradient(180deg, #52c41a 0%, #95de64 100%); box-shadow: 0 0 8px rgba(82,196,26,0.6); }
.panel-title.demand::before { background: linear-gradient(180deg, #ff7a45 0%, #ffa940 100%); box-shadow: 0 0 8px rgba(255,122,69,0.6); }
.panel-body { padding: 12px 16px; position: relative; }
.chart-container { width: 100%; height: 100%; }

/* ==================== KPI ==================== */
.supply-overview-wrap { display: flex; gap: 12px; height: 100%; align-items: center; }
.supply-big-number { flex: 1; text-align: center; }
.supply-big-number .big-label { font-size: 11px; color: #8c9ab4; margin-bottom: 4px; }
.supply-big-number .big-value { font-size: 32px; font-weight: bold; font-family: "DIN Alternate", "Courier New", monospace; background: linear-gradient(180deg, #52c41a 0%, #95de64 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; line-height: 1.1; }
.supply-big-number .big-unit { font-size: 12px; color: #69b1ff; margin-top: 4px; }
.supply-big-number.actual .big-value { background: linear-gradient(180deg, #69b1ff 0%, #1677ff 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.supply-divider { width: 1px; height: 60%; background: linear-gradient(180deg, transparent, rgba(22,119,255,0.4), transparent); align-self: center; }
.demand-big-number .big-value { background: linear-gradient(180deg, #ff7a45 0%, #ffa940 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.demand-big-number.actual .big-value { background: linear-gradient(180deg, #faad14 0%, #ffd666 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.demand-divider { background: linear-gradient(180deg, transparent, rgba(255,122,69,0.4), transparent); }

/* ==================== 矿区列表 ==================== */
.mine-list-body { overflow: hidden; padding: 12px 16px; }
.mine-list-scroll { display: flex; flex-direction: column; animation: mine-scroll 30s linear infinite; }
.mine-list-scroll:hover { animation-play-state: paused; }
.mine-list { display: flex; flex-direction: column; gap: 8px; padding-bottom: 8px; }
@keyframes mine-scroll {
    0% { transform: translateY(0); }
    100% { transform: translateY(-50%); }
}
.mine-item { display: flex; align-items: center; gap: 10px; padding: 6px 8px; background: rgba(22,119,255,0.05); border-radius: 4px; border-left: 3px solid #52c41a; transition: all 0.3s; }
.mine-item:hover { background: rgba(82,196,26,0.1); transform: translateX(3px); }
.mine-item.demand { border-left-color: #ff7a45; }
.mine-item.demand:hover { background: rgba(255,122,69,0.1); }
.mine-name { font-size: 12px; color: #e6f0ff; font-weight: 500; flex: 0 0 70px; }
.mine-bar-wrap { flex: 1; display: flex; align-items: center; gap: 8px; }
.mine-bars { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.mine-bar-row { display: flex; align-items: center; gap: 6px; }
.mine-bar-tag { font-size: 10px; color: #95de64; flex: 0 0 14px; text-align: center; }
.mine-bar-tag.actual { color: #69b1ff; }
.mine-bar { flex: 1; height: 5px; background: rgba(22,119,255,0.1); border-radius: 3px; overflow: hidden; }
.mine-bar-fill { height: 100%; background: linear-gradient(90deg, #52c41a, #95de64); border-radius: 3px; box-shadow: 0 0 6px rgba(82,196,26,0.5); transition: width 1s ease; }
.mine-bar-fill.actual { background: linear-gradient(90deg, #1677ff, #69b1ff); box-shadow: 0 0 6px rgba(22,119,255,0.5); }
.mine-item.demand .mine-bar-tag { color: #ffa940; }
.mine-item.demand .mine-bar-tag.actual { color: #ffd666; }
.mine-item.demand .mine-bar-fill { background: linear-gradient(90deg, #ff7a45, #ffa940); box-shadow: 0 0 6px rgba(255,122,69,0.5); }
.mine-item.demand .mine-bar-fill.actual-demand { background: linear-gradient(90deg, #faad14, #ffd666); box-shadow: 0 0 6px rgba(250,173,20,0.5); }
.mine-output.actual-demand-text { color: #ffd666; }
.mine-output { font-size: 11px; color: #c9d5e8; font-family: "DIN Alternate", monospace; flex: 0 0 60px; text-align: right; }
.mine-output.actual { color: #69b1ff; }

/* ==================== 地图 ==================== */
.map-panel { flex: 1; display: flex; flex-direction: column; min-height: 0; }
.map-container { flex: 1; min-height: 0; position: relative; }
.map-legend { position: absolute; bottom: 16px; left: 16px; background: rgba(10,22,40,0.8); border: 1px solid rgba(22,119,255,0.2); border-radius: 6px; padding: 10px 14px; font-size: 11px; z-index: 10; backdrop-filter: blur(10px); }
.legend-item { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; color: #c9d5e8; }
.legend-item:last-child { margin-bottom: 0; }
.legend-dot { width: 10px; height: 10px; border-radius: 50%; }
.legend-dot.supply { background: #52c41a; box-shadow: 0 0 8px #52c41a; }
.legend-dot.demand { background: #ff7a45; box-shadow: 0 0 8px #ff7a45; }
.legend-line { width: 20px; height: 2px; background: linear-gradient(90deg, #1677ff, #69b1ff); }
.map-controls { position: absolute; bottom: 16px; right: 16px; display: flex; flex-direction: column; gap: 6px; z-index: 10; }
.map-type-tabs { display: flex; background: rgba(10,22,40,0.8); border: 1px solid rgba(22,119,255,0.2); border-radius: 4px; overflow: hidden; backdrop-filter: blur(10px); }
.map-type-tab { padding: 6px 12px; font-size: 11px; cursor: pointer; color: #8c9ab4; transition: all 0.3s; border-right: 1px solid rgba(22,119,255,0.1); }
.map-type-tab:last-child { border-right: none; }
.map-type-tab.active { background: rgba(22,119,255,0.3); color: #69b1ff; }
.map-zoom-btns { display: flex; flex-direction: column; background: rgba(10,22,40,0.8); border: 1px solid rgba(22,119,255,0.2); border-radius: 4px; overflow: hidden; backdrop-filter: blur(10px); }
.zoom-btn { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #69b1ff; font-size: 16px; transition: all 0.3s; border-bottom: 1px solid rgba(22,119,255,0.1); }
.zoom-btn:last-child { border-bottom: none; }
.zoom-btn:hover { background: rgba(22,119,255,0.2); }


/* ==================== 面板高度 ==================== */
.panel-overview { height: 160px; }
.panel-mine-list { flex: 1; min-height: 200px; }
.panel-trend { flex: 1; min-height: 220px; }

/* ==================== 响应式 ==================== */
@media (max-width: 1400px) { .main-content { grid-template-columns: 1fr 1.4fr 1fr; } }
</style>

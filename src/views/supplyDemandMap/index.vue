<template>
    <div class="cockpit-container">
        <!-- 顶部标题区 -->
        <div class="header">
            <div class="header-left">
                <div class="header-title">矿产品供需数据地图</div>
            </div>
            <div class="header-right" style="margin-left:auto;">
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
                        <div class="panel-title supply">四川矿产供给</div>
                    </div>
                    <div class="panel-body" style="height:calc(100% - 42px);">
                        <div class="supply-overview-wrap">
                            <div class="supply-big-number">
                                <div class="big-label">总产矿量</div>
                                <div class="big-value">{{ animatedSupply }}</div>
                                <div class="big-unit">万吨 / 年</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="panel panel-mine-list">
                    <div class="panel-corner-bl"></div>
                    <div class="panel-corner-br"></div>
                    <div class="panel-header">
                        <div class="panel-title supply">主要矿区分布</div>
                        <div style="font-size:11px;color:#8c9ab4;">TOP 6 矿区</div>
                    </div>
                    <div class="panel-body" style="height:calc(100% - 42px);">
                        <div class="mine-list">
                            <div v-for="m in mineListData" :key="m.name" class="mine-item">
                                <div class="mine-name">{{ m.name }}</div>
                                <div class="mine-type">{{ m.type }}</div>
                                <div class="mine-bar-wrap">
                                    <div class="mine-bar"><div class="mine-bar-fill" :style="{ width: m.pct + '%' }"></div></div>
                                    <div class="mine-output">{{ m.output }}万吨</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="panel panel-trend">
                    <div class="panel-corner-bl"></div>
                    <div class="panel-corner-br"></div>
                    <div class="panel-header">
                        <div class="panel-title supply">供给趋势</div>
                        <div style="font-size:11px;color:#8c9ab4;">近12个月</div>
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
                        <div class="panel-title demand">湖北客户需求</div>
                    </div>
                    <div class="panel-body" style="height:calc(100% - 42px);">
                        <div class="supply-overview-wrap">
                            <div class="supply-big-number demand-big-number">
                                <div class="big-label">总需求量</div>
                                <div class="big-value">{{ animatedDemand }}</div>
                                <div class="big-unit">万吨 / 年</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="panel panel-mine-list">
                    <div class="panel-corner-bl"></div>
                    <div class="panel-corner-br"></div>
                    <div class="panel-header">
                        <div class="panel-title demand">需求城市分布</div>
                        <div style="font-size:11px;color:#8c9ab4;">TOP 6 城市</div>
                    </div>
                    <div class="panel-body" style="height:calc(100% - 42px);">
                        <div class="mine-list">
                            <div v-for="m in demandListData" :key="m.name" class="mine-item demand">
                                <div class="mine-name">{{ m.name }}</div>
                                <div class="mine-type">{{ m.type }}</div>
                                <div class="mine-bar-wrap">
                                    <div class="mine-bar"><div class="mine-bar-fill" :style="{ width: m.pct + '%' }"></div></div>
                                    <div class="mine-output">{{ m.demand }}万吨</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="panel panel-trend">
                    <div class="panel-corner-bl"></div>
                    <div class="panel-corner-br"></div>
                    <div class="panel-header">
                        <div class="panel-title demand">需求趋势 & 预测</div>
                        <div style="font-size:11px;color:#8c9ab4;">近12月 + Q4预测</div>
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
    { name: '攀枝花', type: '钒钛磁铁矿', output: 6800, coord: [101.71, 26.58] },
    { name: '凉山州', type: '铜铅锌稀土', output: 4500, coord: [102.25, 27.89] },
    { name: '泸州', type: '煤炭/硫铁矿', output: 3800, coord: [105.44, 28.87] },
    { name: '乐山', type: '磷矿', output: 3200, coord: [103.76, 29.59] },
    { name: '宜宾', type: '煤炭/硫铁矿', output: 3100, coord: [104.64, 28.76] },
    { name: '达州', type: '煤炭', output: 2800, coord: [107.50, 31.21] },
];
const hubeiCities = [
    { name: '宜昌', type: '宜化集团等', demand: 2100, coord: [111.30, 30.70] },
    { name: '武汉', type: '化工区/乙烯', demand: 1950, coord: [114.31, 30.60] },
    { name: '襄阳', type: '化工/建材', demand: 1600, coord: [112.12, 32.02] },
    { name: '黄石', type: '冶金/化工', demand: 1250, coord: [115.03, 30.20] },
    { name: '荆门', type: '化工产业园', demand: 1200, coord: [112.20, 31.03] },
    { name: '鄂州', type: '钢铁/化工', demand: 1180, coord: [114.89, 30.40] },
];
/**
 * 生成截止「当前月份的上一月」的近 12 个月标签（如当前 2026-10 → 2025-10 ~ 2026-09）。
 * @returns 月份标签数组，格式「X月」
 */
function buildRecentMonths(): string[] {
    const now = new Date();
    const labels: string[] = [];
    // 从上个月往回推 12 个月
    for (let i = 12; i >= 1; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        labels.push(`${d.getMonth() + 1}月`);
    }
    return labels;
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

/** Top6 矿山实时供货趋势：X 轴按月截止上月，6 条矿山序列（万吨/月，围绕年产量/12 波动） */
const top6SupplyTrend = (() => {
    const months = buildRecentMonths();
    const now = new Date();
    const series = sichuanMines.map((mine) => {
        const monthlyAvg = mine.output / 12;
        const data = months.map((_, i) => {
            const r = pseudoRandom(mine.name, i);
            // 波动区间 -15% ~ +15%，最近一个月为「实时值」略向上偏移
            const factor = 0.85 + r * 0.3 + (i === months.length - 1 ? 0.03 : 0);
            return Math.round(monthlyAvg * factor);
        });
        return { name: mine.name, type: mine.type, data };
    });
    return { year: now.getFullYear(), months, series };
})();
const demandTrend = {
    months: ['11月','12月','1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月(预)','12月(预)','1月(预)'],
    actual: [720, 760, 690, 620, 750, 800, 830, 810, 780, 800, 820, 850],
    forecast: [null, null, null, null, null, null, null, null, null, null, null, 850, 870, 890, 860],
};
const flowLines = [
    { from: '攀枝花', to: '武汉', value: 850 }, { from: '攀枝花', to: '黄石', value: 620 },
    { from: '攀枝花', to: '鄂州', value: 580 }, { from: '凉山州', to: '宜昌', value: 520 },
    { from: '凉山州', to: '荆门', value: 380 }, { from: '泸州', to: '宜昌', value: 680 },
    { from: '泸州', to: '武汉', value: 450 }, { from: '泸州', to: '襄阳', value: 520 },
    { from: '乐山', to: '宜昌', value: 720 }, { from: '乐山', to: '荆门', value: 480 },
    { from: '宜宾', to: '武汉', value: 380 }, { from: '宜宾', to: '黄石', value: 420 },
    { from: '达州', to: '襄阳', value: 560 }, { from: '达州', to: '鄂州', value: 340 },
];

/* ==================== 响应式状态 ==================== */
const mapTypes = ['标准', '热力', '卫星'];
const activeMapType = ref('标准');
const datetime = ref('');
const animatedSupply = ref('0');
const animatedDemand = ref('0');

/* ==================== 计算 ==================== */
const mineListData = computed(() => {
    const max = Math.max(...sichuanMines.map((m) => m.output));
    return sichuanMines.map((m) => ({ ...m, pct: (m.output / max) * 100 }));
});
const demandListData = computed(() => {
    const max = Math.max(...hubeiCities.map((c) => c.demand));
    return hubeiCities.map((c) => ({ ...c, pct: (c.demand / max) * 100 }));
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
    const d = top6SupplyTrend;
    // Top6 矿山配色
    const colors = ['#52c41a', '#1677ff', '#69b1ff', '#faad14', '#ff7a45', '#b37feb'];
    // RGB 分量（与 colors 一一对应），用于面积渐变
    const rgbs = ['82,196,26', '22,119,255', '105,177,255', '250,173,20', '255,122,69', '179,127,235'];
    const g = (rgb: string) => new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: `rgba(${rgb},0.35)` }, { offset: 1, color: `rgba(${rgb},0.02)` }]);
    chart.setOption({
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(10, 22, 40, 0.9)',
            borderColor: 'rgba(22, 119, 255, 0.3)',
            textStyle: { color: '#c9d5e8', fontSize: 11 },
            // 显示完整年月（如 2026年9月）
            formatter: (params: any) => {
                const lines = params.map((p: any) => `${p.marker}${p.seriesName}：${Number(p.value).toLocaleString()} 万吨`);
                return `${d.year}年${params[0].axisValue}<br/>` + lines.join('<br/>');
            },
        },
        legend: { data: d.series.map((s) => s.name), textStyle: { color: '#8c9ab4', fontSize: 10 }, top: 0, right: 0, itemWidth: 14 },
        grid: { left: 44, right: 10, top: 30, bottom: 24 },
        xAxis: { type: 'category', boundaryGap: false, data: d.months, axisLine: { lineStyle: { color: 'rgba(22, 119, 255, 0.2)' } }, axisLabel: { color: '#8c9ab4', fontSize: 10 } },
        yAxis: { type: 'value', axisLine: { show: false }, axisLabel: { color: '#8c9ab4', fontSize: 10 }, splitLine: { lineStyle: { color: 'rgba(22, 119, 255, 0.08)' } } },
        series: d.series.map((s, i) => ({
            name: s.name,
            type: 'line',
            smooth: true,
            symbol: 'circle',
            symbolSize: 6,
            areaStyle: { color: g(rgbs[i]) },
            lineStyle: { color: colors[i], width: 2 },
            itemStyle: { color: colors[i] },
            emphasis: { focus: 'series' },
            data: s.data,
        })),
    });
    charts.supplyTrend = chart; chartList.push(chart);
}
function initDemandTrend() {
    const chart = echarts.init(demandTrendRef.value!);
    const d = demandTrend;
    chart.setOption({
        tooltip: { trigger: 'axis', backgroundColor: 'rgba(10, 22, 40, 0.9)', borderColor: 'rgba(22, 119, 255, 0.3)', textStyle: { color: '#c9d5e8', fontSize: 11 } },
        legend: { data: ['实际需求', '预测需求'], textStyle: { color: '#8c9ab4', fontSize: 10 }, top: 0, right: 0 },
        grid: { left: 40, right: 10, top: 30, bottom: 24 },
        xAxis: { type: 'category', data: d.months, axisLine: { lineStyle: { color: 'rgba(22, 119, 255, 0.2)' } }, axisLabel: { color: '#8c9ab4', fontSize: 9 } },
        yAxis: { type: 'value', axisLine: { show: false }, axisLabel: { color: '#8c9ab4', fontSize: 10 }, splitLine: { lineStyle: { color: 'rgba(22, 119, 255, 0.08)' } } },
        series: [
            { name: '实际需求', type: 'line', smooth: true, lineStyle: { color: '#ff7a45', width: 2 }, itemStyle: { color: '#ff7a45' }, areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(255,122,69,0.3)' }, { offset: 1, color: 'rgba(255,122,69,0.02)' }]) }, data: d.actual.concat([null, null, null]) },
            { name: '预测需求', type: 'line', smooth: true, lineStyle: { color: '#ffa940', width: 2, type: 'dashed' }, itemStyle: { color: '#ffa940' }, data: d.forecast },
        ],
    });
    charts.demandTrend = chart; chartList.push(chart);
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
    hubeiCities.forEach((c) => (coordMap[c.name] = c.coord));
    const supplyPoints = sichuanMines.map((m) => ({ name: m.name, value: [...m.coord, m.output], itemStyle: { color: '#52c41a' } }));
    const demandPoints = hubeiCities.map((c) => ({ name: c.name, value: [...c.coord, c.demand], itemStyle: { color: '#ff7a45' } }));
    const lineData = flowLines.map((f) => ({ fromName: f.from, toName: f.to, coords: [coordMap[f.from], coordMap[f.to]], value: f.value }));
    chart.setOption({
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'item',
            backgroundColor: 'rgba(10, 22, 40, 0.95)',
            borderColor: 'rgba(22, 119, 255, 0.3)',
            textStyle: { color: '#c9d5e8', fontSize: 12 },
            formatter: (p: any) => {
                if (p.seriesType === 'lines') return `${p.data.fromName} → ${p.data.toName}<br/>运输量: ${p.data.value}万吨`;
                if (p.seriesType === 'effectScatter') return `${p.name}<br/>${p.seriesName === '供给矿区' ? '产量' : '需求量'}: ${p.value[2]}万吨`;
                return p.name;
            },
        },
        geo: {
            map: 'china', roam: true, zoom: 1.3, center: [108, 32],
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
    requestAnimationFrame(() => animateCountUp(animatedSupply, 28650));
    requestAnimationFrame(() => animateCountUp(animatedDemand, 9280));
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
.header { height: 64px; display: flex; align-items: center; justify-content: space-between; background: linear-gradient(180deg, rgba(22,119,255,0.15) 0%, transparent 100%); border-bottom: 1px solid rgba(22,119,255,0.3); padding: 0 20px; position: relative; margin-bottom: 12px; border-radius: 4px; }
.header::before, .header::after { content: ''; position: absolute; bottom: -1px; width: 200px; height: 2px; background: linear-gradient(90deg, transparent, #1677ff, transparent); }
.header::before { left: 0; }
.header::after { right: 0; }
.header-title { font-size: 28px; font-weight: bold; background: linear-gradient(180deg, #fff 0%, #69b1ff 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-shadow: 0 0 20px rgba(22,119,255,0.5); letter-spacing: 4px; }
.header-left { display: flex; flex-direction: column; gap: 2px; }
.header-right { display: flex; align-items: center; gap: 16px; }
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
.demand-big-number .big-value { background: linear-gradient(180deg, #ff7a45 0%, #ffa940 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }

/* ==================== 矿区列表 ==================== */
.mine-list { display: flex; flex-direction: column; gap: 8px; }
.mine-item { display: flex; align-items: center; gap: 10px; padding: 6px 8px; background: rgba(22,119,255,0.05); border-radius: 4px; border-left: 3px solid #52c41a; transition: all 0.3s; }
.mine-item:hover { background: rgba(82,196,26,0.1); transform: translateX(3px); }
.mine-item.demand { border-left-color: #ff7a45; }
.mine-item.demand:hover { background: rgba(255,122,69,0.1); }
.mine-name { font-size: 12px; color: #e6f0ff; font-weight: 500; flex: 0 0 70px; }
.mine-type { font-size: 10px; color: #69b1ff; flex: 0 0 80px; }
.mine-bar-wrap { flex: 1; display: flex; align-items: center; gap: 8px; }
.mine-bar { flex: 1; height: 6px; background: rgba(22,119,255,0.1); border-radius: 3px; overflow: hidden; }
.mine-bar-fill { height: 100%; background: linear-gradient(90deg, #52c41a, #95de64); border-radius: 3px; box-shadow: 0 0 6px rgba(82,196,26,0.5); transition: width 1s ease; }
.mine-item.demand .mine-bar-fill { background: linear-gradient(90deg, #ff7a45, #ffa940); box-shadow: 0 0 6px rgba(255,122,69,0.5); }
.mine-output { font-size: 11px; color: #c9d5e8; font-family: "DIN Alternate", monospace; flex: 0 0 55px; text-align: right; }

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

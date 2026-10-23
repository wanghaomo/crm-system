<template>
    <main class="cache-test-page">
        <section class="hero">
            <div>
                <p class="eyebrow">CRM SUB-APP · CACHE GOVERNANCE</p>
                <h1>部署缓存验证页</h1>
                <p class="description">
                    对比当前 JS 内嵌版本与服务器最新 version.json，快速确认 qiankun 入口和静态资源缓存是否已更新。
                </p>
            </div>
            <div class="rev-badge">DEPLOY · REV {{ DEPLOY_REV }}</div>
        </section>

        <section class="deploy-hint">
            <strong>发版验证：</strong>
            每次发布前提升 package.json version；如需肉眼验证 JS 是否更新，可修改本页顶部的
            <code>DEPLOY_REV / DEPLOY_DATE / DEPLOY_NOTES</code> 三个常量。
            <div class="hint-values">
                <span>DEPLOY_REV：<b>{{ DEPLOY_REV }}</b></span>
                <span>DEPLOY_DATE：<b>{{ DEPLOY_DATE }}</b></span>
                <span>DEPLOY_NOTES：<b>{{ DEPLOY_NOTES.length }} 条</b></span>
            </div>
        </section>

        <section class="grid">
            <article class="card">
                <h2>① 本地打包注入信息</h2>
                <dl>
                    <div><dt>应用</dt><dd>CRM</dd></div>
                    <div><dt>版本</dt><dd class="primary">{{ localVersion }}</dd></div>
                    <div><dt>构建时间</dt><dd>{{ localBuildTime || '—' }}</dd></div>
                    <div><dt>运行环境</dt><dd>{{ envMode }}</dd></div>
                    <div><dt>qiankun</dt><dd>{{ isInQiankun ? '已接入' : '独立运行' }}</dd></div>
                </dl>
            </article>

            <article class="card" :class="{ loading: checkingVersion }">
                <h2>② 服务器 version.json</h2>
                <dl>
                    <div><dt>请求地址</dt><dd class="url">{{ remoteUrl }}</dd></div>
                    <div><dt>状态</dt><dd :class="statusClass">{{ statusText }}</dd></div>
                    <div><dt>远端版本</dt><dd class="primary">{{ remoteVersion }}</dd></div>
                    <div><dt>远端构建时间</dt><dd>{{ remoteBuildTime || '—' }}</dd></div>
                </dl>
                <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
                <button class="button secondary" :disabled="checkingVersion" @click="handleManualCheck">
                    {{ checkingVersion ? '检测中…' : '重新检测' }}
                </button>
            </article>

            <article class="card compare-card">
                <h2>③ 核心对比</h2>
                <div class="compare-value" :class="updateNeeded ? 'danger' : 'success'">
                    {{ updateNeeded ? '检测到新版，需要刷新' : '本地与远端版本一致' }}
                </div>
                <p>当前：{{ localVersion }} · 远端：{{ remoteVersion }}</p>
                <button class="button" :disabled="!updateNeeded" @click="handleForceRefresh">
                    发现新版，立即强制刷新
                </button>
            </article>

            <article class="card">
                <h2>④ 环境信息</h2>
                <dl>
                    <div><dt>Router Base</dt><dd class="mono">{{ routerBase || '(空)' }}</dd></div>
                    <div><dt>当前渲染时间</dt><dd class="mono">{{ renderAt }}</dd></div>
                    <div><dt>version.json 请求</dt><dd>2.5s 超时 + URL 时间戳</dd></div>
                </dl>
            </article>

            <article class="card visual-card">
                <h2>⑤ 部署可视化标识 · REV {{ DEPLOY_REV }}</h2>
                <div class="visual-banner">🎉 CRM 部署标识 REV {{ DEPLOY_REV }} · v{{ localVersion }}</div>
                <div class="visual-stripes"><i v-for="n in 8" :key="n"></i></div>
                <p>Banner、REV 数字和部署时间线一致，即可确认当前 JS 已加载。</p>
            </article>

            <article class="card">
                <h2>⑥ 部署历史时间线</h2>
                <ol class="history-list">
                    <li v-for="item in DEPLOY_HISTORY" :key="item.rev">
                        <b>REV {{ item.rev }}</b> · {{ item.date }} · {{ item.author }}<br />
                        <span>{{ item.summary }}</span>
                    </li>
                </ol>
            </article>

            <article class="card">
                <h2>⑦ JS 热更新验证</h2>
                <dl>
                    <div><dt>当前内嵌标识</dt><dd class="mono">{{ embeddedBuildMark }}</dd></div>
                    <div><dt>上次历史标识</dt><dd class="mono">{{ previousBuildMark || '首次访问' }}</dd></div>
                    <div><dt>判断结果</dt><dd :class="jsMarkChanged ? 'success' : 'warning'">{{ jsMarkStatus }}</dd></div>
                </dl>
                <div class="actions">
                    <button class="button secondary" @click="rememberBuildMark">记录当前标识</button>
                    <button class="button ghost" @click="clearBuildMark">清空历史标识</button>
                </div>
            </article>
        </section>

        <footer>部署编号：{{ DEPLOY_REV }} · 部署时间：{{ DEPLOY_DATE }} · {{ DEPLOY_NOTES[0] }}</footer>
    </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import {
    compareSubAppVersion,
    fetchRemoteSubAppVersion,
    forceRefreshAfterSubAppUpdate,
    getCurrentSubAppBuildTime,
    getCurrentSubAppVersion,
    isRunningInQiankun,
    resolveSubAppBase,
} from '@/utils/version-check';

/** 发版时修改这三个常量，用于肉眼确认新 JS 是否已加载。 */
const DEPLOY_REV = '01';
const DEPLOY_DATE = '20261020-1030';
const DEPLOY_NOTES: string[] = ['接入子应用版本治理与 version.json 缓存校验'];
const DEPLOY_HISTORY = [
    {
        rev: DEPLOY_REV,
        date: DEPLOY_DATE,
        author: 'CRM 开发团队',
        summary: DEPLOY_NOTES[0],
    },
];
const BUILD_MARK_STORAGE_KEY = '__CRM_CACHE_TEST_BUILD_MARK__';

const localVersion = getCurrentSubAppVersion();
const localBuildTime = getCurrentSubAppBuildTime();
const envMode = String((import.meta as any).env?.MODE || 'unknown');
const isInQiankun = isRunningInQiankun();
const routerBase = String((import.meta as any).env?.BASE_URL || '');
const renderAt = new Date().toISOString();
const embeddedBuildMark = `${DEPLOY_REV}|${DEPLOY_DATE}|${DEPLOY_NOTES[0]}`;
const remoteUrl = ref(`${resolveSubAppBase()}/version.json`);
const remoteVersion = ref('未检测');
const remoteBuildTime = ref('');
const checkingVersion = ref(false);
const versionRequestStatus = ref<'idle' | 'loading' | 'success' | 'error'>('idle');
const errorMessage = ref('');
const updateNeeded = ref(false);
const previousBuildMark = ref('');

const statusText = computed(() => ({
    idle: '尚未检测',
    loading: '检测中',
    success: '请求成功',
    error: '请求失败',
}[versionRequestStatus.value]));
const statusClass = computed(() => `status-${versionRequestStatus.value}`);
const jsMarkChanged = computed(() => !previousBuildMark.value || previousBuildMark.value !== embeddedBuildMark);
const jsMarkStatus = computed(() =>
    jsMarkChanged.value ? '✅ 当前 JS 已变化或首次访问' : '⚠️ 标识未变化，请确认是否重新构建'
);

/** 手动请求远端版本并更新页面上的对比结果。 */
async function handleManualCheck(): Promise<void> {
    checkingVersion.value = true;
    versionRequestStatus.value = 'loading';
    errorMessage.value = '';
    remoteUrl.value = `${resolveSubAppBase()}/version.json?t=${Date.now()}`;
    try {
        const remote = await fetchRemoteSubAppVersion();
        const result = compareSubAppVersion(remote);
        remoteVersion.value = remote.version;
        remoteBuildTime.value = remote.buildTime || '';
        updateNeeded.value = result.needUpdate;
        versionRequestStatus.value = 'success';
    } catch (error: any) {
        versionRequestStatus.value = 'error';
        errorMessage.value = error?.message || String(error);
    } finally {
        checkingVersion.value = false;
    }
}

/** 根据当前检测结果强制刷新页面。 */
function handleForceRefresh(): void {
    forceRefreshAfterSubAppUpdate(remoteVersion.value);
}

/** 将当前内嵌标识写入 localStorage，供下次进入页面对比。 */
function rememberBuildMark(): void {
    try {
        localStorage.setItem(BUILD_MARK_STORAGE_KEY, embeddedBuildMark);
        previousBuildMark.value = embeddedBuildMark;
    } catch (error) {
        console.warn('[cache-test] 写入构建标识失败：', error);
    }
}

/** 清除历史构建标识，模拟首次访问。 */
function clearBuildMark(): void {
    try {
        localStorage.removeItem(BUILD_MARK_STORAGE_KEY);
        previousBuildMark.value = '';
    } catch (error) {
        console.warn('[cache-test] 清除构建标识失败：', error);
    }
}

onMounted(() => {
    try {
        previousBuildMark.value = localStorage.getItem(BUILD_MARK_STORAGE_KEY) || '';
    } catch (error) {
        console.warn('[cache-test] 读取构建标识失败：', error);
    }
    void handleManualCheck();
});
</script>

<style scoped>
.cache-test-page { min-height: 100vh; padding: 32px; color: #1f2937; background: #f5f7fb; box-sizing: border-box; }
.hero { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; max-width: 1180px; margin: 0 auto 18px; padding: 28px; border-radius: 18px; color: #fff; background: linear-gradient(135deg, #172554, #2563eb 58%, #7c3aed); box-shadow: 0 14px 30px rgba(37, 99, 235, .2); }
.eyebrow { margin: 0 0 8px; font-size: 12px; letter-spacing: .14em; opacity: .8; }
h1 { margin: 0; font-size: 30px; }
.description { max-width: 680px; margin: 12px 0 0; line-height: 1.7; opacity: .9; }
.rev-badge { padding: 10px 14px; border-radius: 10px; color: #7f1d1d; background: #fecaca; font-weight: 800; white-space: nowrap; }
.deploy-hint, .card { max-width: 1180px; margin: 0 auto 16px; padding: 20px; border: 1px solid #e5e7eb; border-radius: 14px; background: #fff; box-shadow: 0 6px 20px rgba(15, 23, 42, .05); }
.deploy-hint { color: #92400e; border-color: #fcd34d; background: #fffbeb; line-height: 1.7; }
.hint-values { display: flex; gap: 16px; margin-top: 10px; flex-wrap: wrap; font-size: 13px; }
.grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; max-width: 1180px; margin: 0 auto; }
.grid .card { width: auto; margin: 0; }
h2 { margin: 0 0 16px; font-size: 17px; }
dl { margin: 0; }
dl > div { display: flex; justify-content: space-between; gap: 14px; padding: 9px 0; border-bottom: 1px solid #f1f5f9; }
dt { color: #64748b; } dd { margin: 0; text-align: right; word-break: break-word; } .primary { color: #2563eb; font-weight: 700; } .mono, .url { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; } .url { max-width: 260px; }
.status-success, .success { color: #15803d; font-weight: 700; } .status-error, .danger, .error { color: #b91c1c; } .status-loading, .warning { color: #b45309; } .error { padding: 10px; border-radius: 8px; background: #fef2f2; font-size: 13px; white-space: pre-wrap; }
.compare-value { margin: 8px 0 14px; padding: 14px; border-radius: 10px; text-align: center; font-weight: 800; background: #f0fdf4; } .compare-value.danger { background: #fef2f2; } .compare-card p { color: #64748b; font-size: 13px; }
.visual-banner { padding: 14px; border-radius: 10px; color: #fff; background: linear-gradient(90deg, #f97316, #ec4899, #7c3aed); font-weight: 800; text-align: center; }
.visual-stripes { display: flex; height: 8px; margin-top: 12px; overflow: hidden; border-radius: 4px; } .visual-stripes i { flex: 1; } .visual-stripes i:nth-child(1), .visual-stripes i:nth-child(6) { background: #f97316; } .visual-stripes i:nth-child(2), .visual-stripes i:nth-child(7) { background: #eab308; } .visual-stripes i:nth-child(3), .visual-stripes i:nth-child(8) { background: #22c55e; } .visual-stripes i:nth-child(4) { background: #06b6d4; } .visual-stripes i:nth-child(5) { background: #8b5cf6; }
.visual-card p { margin-bottom: 0; color: #64748b; font-size: 13px; } .history-list { margin: 0; padding-left: 20px; color: #475569; line-height: 1.8; } .history-list span { color: #64748b; font-size: 13px; }
.button { padding: 9px 14px; border: 0; border-radius: 8px; color: #fff; background: #2563eb; cursor: pointer; font-weight: 600; } .button:disabled { cursor: not-allowed; opacity: .45; } .button.secondary { color: #1d4ed8; background: #dbeafe; } .button.ghost { color: #475569; background: #f1f5f9; } .actions { display: flex; gap: 8px; margin-top: 16px; flex-wrap: wrap; }
footer { max-width: 1180px; margin: 20px auto 0; color: #64748b; font-size: 12px; text-align: center; }
@media (max-width: 760px) { .cache-test-page { padding: 16px; } .hero { display: block; padding: 22px; } .rev-badge { display: inline-block; margin-top: 18px; } .grid { grid-template-columns: 1fr; } }
</style>

/**
 * CRM 子应用版本自检工具。
 *
 * 子应用可以独立于主应用发布。mount 后通过 version.json 对比当前 JS
 * 内嵌版本与服务器版本，发现主应用未刷新时主动刷新父窗口，避免 qiankun
 * 继续复用旧入口模板。开发模式会完全短路，不发请求、不弹窗、不绑定监听。
 */

import { showDialog } from 'vant';
import { isApp } from '@/utils/comm';

/** 远端 version.json 的返回结构。 */
export interface RemoteSubAppVersionFile {
    version: string;
    buildTime: string;
    app?: string;
}

/** 子应用本地版本与远端版本的比对结果。 */
export interface SubAppVersionCompareResult {
    current: string;
    remote: string;
    currentBuildTime?: string;
    remoteBuildTime?: string;
    needUpdate: boolean;
}

/** Vite 构建时注入的全局常量声明。 */
declare global {
    const __APP_VERSION__: string;
    const __BUILD_TIME__: string;
}

/** 防止多个生命周期事件同时触发重复刷新。 */
let isRefreshingLock = false;
let visibilityHandler: (() => void) | null = null;
let pageShowHandler: ((event: PageTransitionEvent) => void) | null = null;

/** 路由/hash 变化时的防抖检查句柄。 */
let routeChangeDebounceTimer: number | null = null;
let hashChangeHandler: (() => void) | null = null;
let routerAfterEachUnregister: (() => void) | null = null;

/** JS/CSS chunk 资源加载失败监听句柄。 */
let chunkErrorHandler: ((event: ErrorEvent) => void) | null = null;
let chunkRejectionHandler: ((event: PromiseRejectionEvent) => void) | null = null;
let routerOnErrorUnregister: (() => void) | null = null;
let lastChunkFailureHandleAt = 0;
const CHUNK_FAILURE_THROTTLE_MS = 8000;

/**
 * 显示只能确认的强制刷新提示。
 * 移动端优先使用 Vant Dialog，普通 Web 或组件不可用时回退到 alert，
 * 避免用户取消后继续使用已经失效的旧资源。
 * @param {string} message 要展示给用户的提示文案。
 * @returns {Promise<void>} 提示关闭后的异步结果。
 */
export async function showMustConfirmTip(message: string): Promise<void> {
    try {
        if (isApp()) {
            await showDialog({
                title: '提示',
                message,
                confirmButtonText: '确定',
                showCancelButton: false,
                closeOnClickOverlay: false,
            });
            return;
        }
    } catch (_error) {
        // Vant 不可用或 Dialog 异常时使用原生提示兜底。
    }

    try {
        if (typeof window !== 'undefined') {
            window.alert(message);
        }
    } catch (_error) {
        // WebView 禁用 alert 时忽略异常，调用方仍继续执行刷新。
    }
}

/** mountSubAppVersionGuard 的可选配置。 */
export interface MountSubAppVersionGuardOptions {
    /** 传入 router 后启用 afterEach 版本检查和 onError chunk 兜底。 */
    router?: {
        afterEach: (guard: (...args: any[]) => any) => () => void;
        onError?: (handler: (error: any) => any) => () => void;
    };
}

/**
 * 判断当前是否为 Vite development 模式。
 * @returns {boolean} 是否跳过所有版本检查。
 */
export function isSubAppDevMode(): boolean {
    try {
        return (import.meta as any).env?.MODE === 'development';
    } catch (_error) {
        return false;
    }
}

/**
 * 判断异常是否属于懒加载 JS/CSS chunk 失败。
 * 发版后旧 hash 文件 404 时，路由通常不会成功切换，必须单独兜底处理。
 * @param {unknown} error 路由、动态 import 或 Promise 异常。
 * @returns {boolean} 是否为 chunk 加载失败。
 */
export function isChunkLoadError(error: unknown): boolean {
    if (!error) return false;
    const message = typeof error === 'string'
        ? error
        : String((error as any)?.message || (error as any)?.msg || error || '');
    if (!message) return false;
    return [
        /Loading chunk [\w-]+ failed/i,
        /Failed to fetch dynamically imported module/i,
        /error loading dynamically imported module/i,
        /Importing a module script failed/i,
        /Unable to preload CSS/i,
        /ChunkLoadError/i,
        /Loading CSS chunk [\w-]+ failed/i,
    ].some((pattern) => pattern.test(message));
}

/**
 * 判断当前页面是否运行在 qiankun 沙箱中。
 * @returns {boolean} 是否由主应用加载。
 */
export function isRunningInQiankun(): boolean {
    try {
        if (typeof window === 'undefined') return false;
        const currentWindow = window as any;
        return Boolean(
            currentWindow.__POWERED_BY_QIANKUN__ ||
                (currentWindow.__QIANKUN_PROPS__ &&
                    Object.keys(currentWindow.__QIANKUN_PROPS__).length > 0) ||
                currentWindow.qiankunWindow?.__POWERED_BY_QIANKUN__
        );
    } catch (_error) {
        return false;
    }
}

/**
 * 获取当前 JS 中注入的版本号。
 * @returns {string} package.json version 或开发环境兜底值。
 */
export function getCurrentSubAppVersion(): string {
    const fromEnv = (import.meta as any).env?.VITE_APP_VERSION;
    if (typeof fromEnv === 'string' && fromEnv) return fromEnv;
    try {
        if (typeof __APP_VERSION__ !== 'undefined') return String(__APP_VERSION__);
    } catch (_error) {
        // 未构建时全局常量可能不存在，继续使用兜底值。
    }
    return 'dev-subapp-local';
}

/**
 * 获取当前 JS 中注入的构建时间。
 * @returns {string | undefined} UTC ISO 时间字符串。
 */
export function getCurrentSubAppBuildTime(): string | undefined {
    const fromEnv = (import.meta as any).env?.VITE_APP_BUILD_TIME;
    if (typeof fromEnv === 'string' && fromEnv) return fromEnv;
    try {
        if (typeof __BUILD_TIME__ !== 'undefined') return String(__BUILD_TIME__);
    } catch (_error) {
        // 未构建时全局常量可能不存在。
    }
    return undefined;
}

/**
 * 解析当前子应用自身的部署基地址。
 * @returns {string} 不带末尾斜杠的 origin/base URL。
 */
export function resolveSubAppBase(): string {
    try {
        const currentWindow = window as any;
        const qiankunProps = currentWindow.__QIANKUN_PROPS__;
        if (qiankunProps && typeof qiankunProps.getPublicPath === 'function') {
            const publicPath = qiankunProps.getPublicPath();
            if (typeof publicPath === 'string' && publicPath) {
                return publicPath.replace(/\/$/, '');
            }
        }
        if (qiankunProps?.appUrl) {
            return String(qiankunProps.appUrl).replace(/\/$/, '');
        }
    } catch (_error) {
        // qiankun props 不可用时回退到当前页面地址。
    }

    const base = String((import.meta as any).env?.BASE_URL || '/');
    if (/^https?:\/\//i.test(base)) return base.replace(/\/$/, '');
    const origin = typeof location !== 'undefined' ? location.origin : '';
    return `${origin}${base.startsWith('/') ? base : `/${base}`}`.replace(/\/$/, '');
}

/**
 * 请求服务器端 version.json。
 * URL 查询参数用于绕过缓存，不添加 Cache-Control/Pragma 自定义请求头，
 * 避免跨域请求触发飞书 WKWebView 不稳定的 OPTIONS 预检。
 * @returns {Promise<RemoteSubAppVersionFile>} 服务器端版本信息。
 * @throws {Error} 请求失败、超时或响应格式错误时抛出异常。
 */
export async function fetchRemoteSubAppVersion(): Promise<RemoteSubAppVersionFile> {
    if (isSubAppDevMode()) {
        const localVersion = getCurrentSubAppVersion();
        console.info(
            `%c[version::CRM] 🛠 开发环境已跳过 version.json 请求，本地版本=${localVersion}`,
            'color:#16a34a;font-weight:bold'
        );
        return {
            version: localVersion,
            buildTime: getCurrentSubAppBuildTime() || '',
            app: 'CRM(DEV)',
        };
    }

    const base = resolveSubAppBase();
    const url = `${base}/version.json?t=${Date.now()}`;
    const controller = new AbortController();
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    try {
        // 飞书 H5 排障信息：区分跨域、协议不一致和服务端无响应。
        try {
            const pageOrigin = typeof location !== 'undefined' ? location.origin : '';
            const targetUrl = new URL(url, typeof location !== 'undefined' ? location.href : undefined);
            const pageProtocol = typeof location !== 'undefined' ? location.protocol : '';
            const isCrossOrigin = Boolean(pageOrigin && pageOrigin !== targetUrl.origin);
            const isProtocolMismatch = Boolean(pageProtocol && pageProtocol !== targetUrl.protocol);
            console.info(
                `[version::CRM] version.json 诊断：url=${url} crossOrigin=${isCrossOrigin} protocolMismatch=${isProtocolMismatch}`
            );
        } catch (_diagnosticError) {
            // 诊断日志失败不影响实际请求。
        }
        timeoutId = setTimeout(() => controller.abort(), 2500);
        const response = await fetch(url, {
            method: 'GET',
            signal: controller.signal,
        });
        if (!response.ok) {
            throw new Error(`version.json 请求失败: status=${response.status}`);
        }
        const data = (await response.json()) as Partial<RemoteSubAppVersionFile>;
        if (!data || typeof data.version !== 'string' || !data.version) {
            throw new Error(`version.json 格式异常: ${JSON.stringify(data)}`);
        }
        return {
            version: data.version,
            buildTime: typeof data.buildTime === 'string' ? data.buildTime : '',
            app: data.app,
        };
    } catch (error: any) {
        const message = error?.name === 'AbortError'
            ? `version.json 请求超时（2.5s）: ${url}`
            : error?.message || String(error);
        console.warn('[version::CRM] version.json 请求失败：', message);
        throw new Error(message);
    } finally {
        if (timeoutId) clearTimeout(timeoutId);
    }
}

/**
 * 对比本地构建标识和服务器端构建标识。
 * @param {RemoteSubAppVersionFile} remote 远端版本文件内容。
 * @returns {SubAppVersionCompareResult} 是否需要刷新。
 */
export function compareSubAppVersion(remote: RemoteSubAppVersionFile): SubAppVersionCompareResult {
    const current = getCurrentSubAppVersion();
    const currentBuildTime = getCurrentSubAppBuildTime();
    const remoteBuildTime = remote.buildTime;
    const versionDiff = remote.version !== current;
    const buildTimeDiff = Boolean(
        remoteBuildTime && currentBuildTime && remoteBuildTime !== currentBuildTime
    );

    return {
        current,
        remote: remote.version,
        currentBuildTime,
        remoteBuildTime,
        needUpdate: versionDiff || buildTimeDiff,
    };
}

/**
 * 发现新版本后刷新父应用或当前页面。
 * @param {string} remoteVersion 服务器端最新版本号。
 * @returns {void}
 */
export function forceRefreshAfterSubAppUpdate(remoteVersion: string): void {
    if (isRefreshingLock || typeof window === 'undefined') return;
    isRefreshingLock = true;

    try {
        const parentWindow = window.parent;
        if (isRunningInQiankun() && parentWindow && parentWindow !== window) {
            try {
                const parentUrl = new URL(parentWindow.location.href);
                parentUrl.searchParams.set('_sub_v', remoteVersion);
                parentUrl.searchParams.set('_t', String(Date.now()));
                parentWindow.location.replace(parentUrl.toString());
            } catch (_crossOriginError) {
                // 跨域父窗口无法读取 href 时，仍可调用 location.reload() 刷新主应用。
                parentWindow.location.reload();
            }
            return;
        }

        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('_v', remoteVersion);
        currentUrl.searchParams.set('_t', String(Date.now()));
        window.location.replace(currentUrl.toString());
    } catch (error) {
        console.warn('[version::CRM] 带版本参数刷新失败，回退普通刷新：', error);
        try {
            window.location.reload();
        } catch (_reloadError) {
            // 某些 WebView 禁止 reload 时不再向业务抛出异常。
        }
    }
}

/**
 * 处理发版后旧 chunk 404。即使 version.json 请求失败，也继续刷新当前页面恢复资源。
 * @param {string} reason 触发失败的来源和错误信息。
 * @returns {Promise<void>} 处理完成的异步任务。
 */
export async function handleChunkLoadFailure(reason: string): Promise<void> {
    if (isSubAppDevMode() || isRefreshingLock) return;

    const now = Date.now();
    try {
        const currentWindow = window as any;
        const topWindow = (window.top as any) || currentWindow;
        if (topWindow.__CHUNK_FAILURE_HANDLING__ || currentWindow.__CHUNK_FAILURE_HANDLING__) {
            return;
        }
        if (now - (topWindow.__CHUNK_FAILURE_AT__ || 0) < CHUNK_FAILURE_THROTTLE_MS) {
            return;
        }
        topWindow.__CHUNK_FAILURE_HANDLING__ = true;
        topWindow.__CHUNK_FAILURE_AT__ = now;
        currentWindow.__CHUNK_FAILURE_HANDLING__ = true;
    } catch (_error) {
        if (now - lastChunkFailureHandleAt < CHUNK_FAILURE_THROTTLE_MS) return;
    }
    lastChunkFailureHandleAt = now;

    console.warn('[version::CRM] 检测到 JS/CSS chunk 加载失败，可能是发版后旧 hash 404：', reason);
    try {
        await showMustConfirmTip(
            '检测到 CRM 页面资源加载失败（可能已发布新版本），点击确定后将刷新以恢复正常。'
        );

        let remoteVersion = getCurrentSubAppVersion();
        try {
            const remote = await fetchRemoteSubAppVersion();
            if (remote.version) remoteVersion = remote.version;
        } catch (_error) {
            // version.json 不可达时也要刷新，页面已经无法加载旧 chunk。
        }
        forceRefreshAfterSubAppUpdate(remoteVersion);
    } catch (error) {
        console.warn('[version::CRM] chunk 失败刷新异常，回退 reload：', error);
        try {
            window.location.reload();
        } catch (_reloadError) {
            // 某些 WebView 禁止 reload 时忽略异常。
        }
    }
}

/**
 * 执行一次版本检查并按需提示刷新。
 * @param {{ silent?: boolean; showTip?: boolean }} options 检查选项。
 * @returns {Promise<SubAppVersionCompareResult | null>} 比对结果或失败时的 null。
 */
export async function performSubAppVersionCheck(options: {
    silent?: boolean;
    showTip?: boolean;
} = {}): Promise<SubAppVersionCompareResult | null> {
    if (isSubAppDevMode()) {
        const current = getCurrentSubAppVersion();
        return {
            current,
            remote: current,
            currentBuildTime: getCurrentSubAppBuildTime(),
            remoteBuildTime: getCurrentSubAppBuildTime(),
            needUpdate: false,
        };
    }
    if (isRefreshingLock) return null;

    const { silent = false, showTip = true } = options;
    try {
        const result = compareSubAppVersion(await fetchRemoteSubAppVersion());
        if (!result.needUpdate) {
            if (!silent) {
                console.info(
                    `[version::CRM] ✅ 当前已是最新版本，本地=${result.current}，远端=${result.remote}`
                );
            }
            return result;
        }

        if (showTip && typeof window !== 'undefined') {
            await showMustConfirmTip(
                `检测到CRM新版本，点击确定后将刷新以获取最新功能。`
            );
        }
        forceRefreshAfterSubAppUpdate(result.remote);
        return result;
    } catch (error) {
        if (!silent) console.warn('[version::CRM] 版本自检失败：', error);
        return null;
    }
}

/** 绑定飞书/WebView 回到前台时的版本检查监听。 */
export function bindSubAppLifeCycleListeners(): void {
    unbindSubAppLifeCycleListeners();
    if (typeof document !== 'undefined') {
        visibilityHandler = () => {
            if (document.visibilityState === 'visible') {
                window.setTimeout(() => {
                    void performSubAppVersionCheck({ silent: true, showTip: true });
                }, 800);
            }
        };
        document.addEventListener('visibilitychange', visibilityHandler);
    }
    if (typeof window !== 'undefined') {
        pageShowHandler = (event: PageTransitionEvent) => {
            if (event.persisted) {
                window.setTimeout(() => {
                    void performSubAppVersionCheck({ silent: true, showTip: true });
                }, 600);
            }
        };
        window.addEventListener('pageshow', pageShowHandler);
    }
}

/** 解绑版本检查监听，避免 qiankun 重复 mount 造成内存泄漏。 */
export function unbindSubAppLifeCycleListeners(): void {
    if (visibilityHandler && typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', visibilityHandler);
        visibilityHandler = null;
    }
    if (pageShowHandler && typeof window !== 'undefined') {
        window.removeEventListener('pageshow', pageShowHandler);
        pageShowHandler = null;
    }
}

/** 在路由变化后延迟检查，避免连续跳转导致重复请求。 */
function scheduleRouteChangeVersionCheck(): void {
    if (isSubAppDevMode() || typeof window === 'undefined') return;
    if (routeChangeDebounceTimer) {
        window.clearTimeout(routeChangeDebounceTimer);
    }
    routeChangeDebounceTimer = window.setTimeout(() => {
        routeChangeDebounceTimer = null;
        void performSubAppVersionCheck({ silent: true, showTip: true });
    }, 1500);
}

/**
 * 绑定 hashchange 和 vue-router afterEach，覆盖同一子应用内切模块场景。
 * @param {MountSubAppVersionGuardOptions} options 可选 router 实例。
 * @returns {void}
 */
export function bindSubAppRouteChangeListeners(
    options?: MountSubAppVersionGuardOptions
): void {
    if (isSubAppDevMode()) return;
    unbindSubAppRouteChangeListeners();

    if (typeof window !== 'undefined') {
        hashChangeHandler = () => {
            console.info('[version::CRM] 检测到 hashchange，将在 1.5s 后防抖检查 version.json');
            scheduleRouteChangeVersionCheck();
        };
        window.addEventListener('hashchange', hashChangeHandler);
    }

    const router = options?.router;
    if (router && typeof router.afterEach === 'function') {
        routerAfterEachUnregister = router.afterEach(() => {
            console.info('[version::CRM] 检测到路由 afterEach，将在 1.5s 后防抖检查 version.json');
            scheduleRouteChangeVersionCheck();
        });
    }
}

/** 解绑路由/hash 版本检查监听。 */
export function unbindSubAppRouteChangeListeners(): void {
    if (routeChangeDebounceTimer && typeof window !== 'undefined') {
        window.clearTimeout(routeChangeDebounceTimer);
        routeChangeDebounceTimer = null;
    }
    if (hashChangeHandler && typeof window !== 'undefined') {
        window.removeEventListener('hashchange', hashChangeHandler);
        hashChangeHandler = null;
    }
    if (typeof routerAfterEachUnregister === 'function') {
        try {
            routerAfterEachUnregister();
        } catch (_error) {
            // 路由卸载句柄异常不影响主流程。
        }
        routerAfterEachUnregister = null;
    }
}

/**
 * 绑定 JS/CSS 资源加载失败、动态 import rejection 和 router.onError 三层兜底。
 * @param {MountSubAppVersionGuardOptions} options 可选 router 实例。
 * @returns {void}
 */
export function bindSubAppChunkLoadFailureListeners(
    options?: MountSubAppVersionGuardOptions
): void {
    if (isSubAppDevMode()) return;
    unbindSubAppChunkLoadFailureListeners();

    if (typeof window !== 'undefined') {
        chunkErrorHandler = (event: ErrorEvent) => {
            try {
                const target = event?.target as HTMLElement | null;
                if (!target) return;
                const tagName = (target.tagName || '').toUpperCase();
                if (tagName !== 'SCRIPT' && tagName !== 'LINK') return;
                const source = (target as HTMLScriptElement).src || (target as HTMLLinkElement).href || '';
                if (!/\.(js|css)(\?|$)/i.test(source) && !/\/assets\//i.test(source)) return;
                void handleChunkLoadFailure(`resource error: ${source || tagName}`);
            } catch (_error) {
                // 资源异常处理不能影响页面其他错误。
            }
        };
        window.addEventListener('error', chunkErrorHandler, true);

        chunkRejectionHandler = (event: PromiseRejectionEvent) => {
            try {
                const reason = event?.reason;
                if (!isChunkLoadError(reason)) return;
                const message = typeof reason === 'string'
                    ? reason
                    : String((reason as any)?.message || reason || '');
                void handleChunkLoadFailure(`unhandledrejection: ${message}`);
            } catch (_error) {
                // Promise rejection 处理不能再次抛出异常。
            }
        };
        window.addEventListener('unhandledrejection', chunkRejectionHandler);
    }

    const router = options?.router;
    if (router && typeof router.onError === 'function') {
        routerOnErrorUnregister = router.onError((error: any) => {
            if (!isChunkLoadError(error)) return;
            void handleChunkLoadFailure(`router.onError: ${String(error?.message || error || '')}`);
        });
    }
}

/** 解绑 chunk 加载失败监听。 */
export function unbindSubAppChunkLoadFailureListeners(): void {
    if (chunkErrorHandler && typeof window !== 'undefined') {
        window.removeEventListener('error', chunkErrorHandler, true);
        chunkErrorHandler = null;
    }
    if (chunkRejectionHandler && typeof window !== 'undefined') {
        window.removeEventListener('unhandledrejection', chunkRejectionHandler);
        chunkRejectionHandler = null;
    }
    if (typeof routerOnErrorUnregister === 'function') {
        try {
            routerOnErrorUnregister();
        } catch (_error) {
            // 路由卸载句柄异常不影响主流程。
        }
        routerOnErrorUnregister = null;
    }
}

/**
 * 在子应用 mount 后启动版本守护。
 * @param {MountSubAppVersionGuardOptions} options 路由实例及其错误钩子。
 * @returns {() => void} unmount 时调用的 teardown 函数。
 */
export function mountSubAppVersionGuard(
    options?: MountSubAppVersionGuardOptions
): () => void {
    if (isSubAppDevMode()) {
        console.info(
            '%c[version::CRM] 🛠 开发环境已跳过 mount 版本守护（visibility/pageshow/路由/chunk 均不绑定）',
            'color:#16a34a;font-weight:bold'
        );
        return () => {};
    }

    const firstCheckTimer = window.setTimeout(() => {
        void performSubAppVersionCheck({ silent: true, showTip: true });
    }, 1200);
    bindSubAppLifeCycleListeners();
    bindSubAppRouteChangeListeners(options);
    bindSubAppChunkLoadFailureListeners(options);

    return () => {
        window.clearTimeout(firstCheckTimer);
        unbindSubAppLifeCycleListeners();
        unbindSubAppRouteChangeListeners();
        unbindSubAppChunkLoadFailureListeners();
    };
}

export {};

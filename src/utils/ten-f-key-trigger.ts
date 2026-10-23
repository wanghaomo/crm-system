/**
 * 连续按 F 键触发缓存测试页入口。
 * 该工具不依赖 Vue，页面只需在 onMounted/onUnmounted 中绑定和解绑即可。
 */

/** 触发器配置。 */
export interface TenFKeyTriggerOptions {
    targetRoute?: string;
    buttonText?: string;
    onClick?: () => void;
    thresholdMs?: number;
    triggerCount?: number;
}

/** 触发器生命周期句柄。 */
export interface TenFKeyTriggerHandler {
    unbind: () => void;
}

let buttonElement: HTMLButtonElement | null = null;
let keydownHandler: ((event: KeyboardEvent) => void) | null = null;
let lastPressAt = 0;
let pressCount = 0;
let activeOptions: Required<Pick<TenFKeyTriggerOptions, 'targetRoute' | 'buttonText' | 'thresholdMs' | 'triggerCount'>> &
    Pick<TenFKeyTriggerOptions, 'onClick'> | null = null;

/** 创建或复用右下角入口按钮。 */
function ensureButton(): HTMLButtonElement {
    if (buttonElement) return buttonElement;
    const element = document.createElement('button');
    element.type = 'button';
    element.textContent = '前往缓存测试页面';
    element.style.cssText = [
        'position:fixed',
        'right:24px',
        'bottom:24px',
        'z-index:99999',
        'display:none',
        'padding:10px 18px',
        'border:0',
        'border-radius:999px',
        'background:linear-gradient(135deg,#ec4899,#8b5cf6)',
        'color:#fff',
        'font-weight:700',
        'cursor:pointer',
        'box-shadow:0 6px 18px rgba(139,92,246,.3)',
    ].join(';');
    element.addEventListener('click', () => {
        try {
            if (activeOptions?.onClick) {
                activeOptions.onClick();
                return;
            }
            window.location.href = activeOptions?.targetRoute || '/test';
        } catch (error) {
            console.error('[ten-f-key-trigger] 跳转缓存测试页失败：', error);
        }
    });
    document.body.appendChild(element);
    buttonElement = element;
    return element;
}

/** 清理事件监听和按钮节点。 */
function removeTrigger(): void {
    if (keydownHandler) {
        window.removeEventListener('keydown', keydownHandler, true);
        keydownHandler = null;
    }
    if (buttonElement?.parentNode) buttonElement.parentNode.removeChild(buttonElement);
    buttonElement = null;
    lastPressAt = 0;
    pressCount = 0;
    activeOptions = null;
}

/**
 * 在首页绑定连续 F 键触发器。
 * @param {TenFKeyTriggerOptions} options 触发次数、间隔和跳转配置。
 * @returns {TenFKeyTriggerHandler} 组件卸载时调用的解绑句柄。
 */
export function bindTenFKeyTrigger(options: TenFKeyTriggerOptions = {}): TenFKeyTriggerHandler {
    activeOptions = {
        targetRoute: '/test',
        buttonText: '前往缓存测试页面',
        thresholdMs: 600,
        triggerCount: 10,
        ...options,
    };
    const button = ensureButton();
    button.textContent = activeOptions.buttonText;
    if (!keydownHandler) {
        keydownHandler = (event: KeyboardEvent) => {
            const options = activeOptions;
            if (!options) return;
            const target = event.target as HTMLElement | null;
            const tagName = target?.tagName?.toLowerCase() || '';
            if (tagName === 'input' || tagName === 'textarea' || target?.isContentEditable) return;
            if (event.key !== 'f' && event.key !== 'F') return;

            const now = Date.now();
            pressCount = now - lastPressAt <= options.thresholdMs ? pressCount + 1 : 1;
            lastPressAt = now;
            if (pressCount >= options.triggerCount) {
                pressCount = 0;
                button.style.display = 'inline-block';
                button.animate(
                    [{ transform: 'scale(.3)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }],
                    { duration: 450, easing: 'ease-out' }
                );
            }
        };
        window.addEventListener('keydown', keydownHandler, true);
    }
    return { unbind: removeTrigger };
}

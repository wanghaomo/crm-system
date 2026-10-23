import { h, computed, type Ref } from 'vue';
import { MenuItem } from '@/types/index';
import { useUserRightsStore } from '@/store/userStore';
import { useDictStore } from '@/store/commStore';
import { showSuccessToast, showFailToast, showToast } from 'vant';
import enumConfig from '@/config/enum.cfg';
import { getDictMapApi } from '@/api';
import { storeToRefs } from 'pinia';
import { setConfigItem } from '@mx/mx-ui';
import dayjs from 'dayjs';

/** 静态导入所有菜单图标 SVG，构建文件名 -> URL 映射 */
import iconBoard from '@/assets/images/menuIcon/icon⎽func⎽board.svg';
import iconBoardActive from '@/assets/images/menuIcon/icon⎽func⎽boardActive.svg';
import iconFygl from '@/assets/images/menuIcon/icon⎽func⎽fygl.svg';
import iconHtgl from '@/assets/images/menuIcon/icon⎽func⎽htgl.svg';
import iconJshk from '@/assets/images/menuIcon/icon⎽func⎽jshk.svg';
import iconKhgl from '@/assets/images/menuIcon/icon⎽func⎽khgl.svg';
import iconScxx from '@/assets/images/menuIcon/icon⎽func⎽scxx.svg';
import iconXsjh from '@/assets/images/menuIcon/icon⎽func⎽xsjh.svg';
import iconXtgl from '@/assets/images/menuIcon/icon⎽func⎽xtgl.svg';

const menuIconMap: Record<string, string> = {
    'home': iconBoard,
    'crm:shipping_manage': iconFygl,
    'crm:contract_manage': iconHtgl,
    'crm:settlement_manage': iconJshk,
    'crm:customer_manage': iconKhgl,
    'crm:market_info': iconScxx,
    'crm:sales_plan': iconXsjh,
    'crm:system_manage': iconXtgl,
};

/** 激活态图标映射 — 有 Active 版图标的填入，暂无的用普通态回退 */
const menuIconActiveMap: Record<string, string> = {
    'home': iconBoardActive,
    'crm:shipping_manage': iconFygl,
    'crm:contract_manage': iconHtgl,
    'crm:settlement_manage': iconJshk,
    'crm:customer_manage': iconKhgl,
    'crm:market_info': iconScxx,
    'crm:sales_plan': iconXsjh,
    'crm:system_manage': iconXtgl,
};

/** 预加载所有 views 下的 page.ts 路由配置文件（替代 Webpack 的 require.context） */
const pagesModules = import.meta.glob('../views/**/page.ts', { eager: true });

// 判断是否为移动端
export function isApp() {
    const ua = navigator.userAgent;

    // 常见移动设备标识
    const mobilePatterns = [
        'iPhone',
        'iPod',
        'Android',
        'ios',
        'iPad',
        'HarmonyOS',
        '鸿蒙',
        'HMOS',
        'OpenHarmony',
        'HUAWEI',
        'Honor',
        'Xiaomi',
        'OPPO',
        'vivo',
        'Mobile',
        'Tablet',
        'Touch',
        'WebView',
    ];

    // 正则表达式构建
    const pattern = new RegExp('(' + mobilePatterns.join('|') + ')', 'i');

    // 基础检测
    const hasMobilePattern = pattern.test(ua);

    // 额外检测：屏幕尺寸（部分平板）
    const isSmallScreen = window.innerWidth <= 1024;

    // 额外检测：触摸设备
    const hasTouch = 'ontouchstart' in window;

    // 排除明显的桌面设备
    const isDesktop =
        (ua.includes('Windows') && !ua.includes('Phone')) ||
        (ua.includes('Macintosh') && !ua.includes('iPhone') && !ua.includes('iPad'));

    // 鸿蒙PC版特殊处理
    const isHarmonyPC = ua.includes('HarmonyOS') && ua.includes('Desktop');

    return (hasMobilePattern || (hasTouch && isSmallScreen)) && !isDesktop && !isHarmonyPC;
}
/**
 * 递归处理路由
 */
export function handleRoutes(routes: Array<any>) {
    routes.forEach(async (item) => {
        if (item.filePath) {
            // 判断item.filePath是否以.vue结尾
            item.filePath = item.filePath;
        } else {
            // 判断item.path是否是动态路由，如果是，则将item.path中:之前的字符串作为fileUrl
            if (item.path?.includes(':')) {
                item.filePath = item.path.split(':')[0] + 'index';
            } else {
                // 判断item.path是否以/结尾，如果是，则添加index,否则直接使用item.path
                if (item.path?.endsWith('/')) {
                    item.filePath = item.path + 'index';
                } else {
                    item.filePath = item.path;
                }
            }
        }
        item.path = item.path;
        // 为所有路由项添加meta字段，无论是否有children
        if (!item.meta) {
            item.meta = {
                title: item.name,
                nologin: false,
                layout: 'main-layout',
                code: item.code,
                parentCode: item.parentCode || '',
            };
        } else {
            item.meta = {
                ...item.meta,
                title: item.name,
                nologin: false,
                layout: 'main-layout',
                code: item.code,
                parentCode: item.parentCode || '',
            };
        }
        // 递归处理子路由
        if (item.children && item.children.length > 0) {
            // 读取 page.ts 文件中的路由配置（如 detail/create/edit 的组件映射）
            try {
                const pagePath = `../views${item.path}/page.ts`;
                const pageModule = (
                    pagesModules as Record<string, { default?: Record<string, { url: string }> } | undefined>
                )[pagePath];

                if (pageModule?.default) {
                    const pageConfig = pageModule.default;

                    item.children = item.children.map((child: any) => {
                        // 通过":"分割code,通过判断最后一位（'detail','create','edit）,与pageConfig的key是否一致
                        const codeType = child.code.split(':').pop();
                        if (codeType && pageConfig[codeType]) {
                            return {
                                ...child,
                                path: child.path,
                                filePath: pageConfig[codeType].url,
                            };
                        }
                        return child;
                    });
                }
            } catch (error) { }
            //  动态读取ts文件中的路由配置

            //  fetch(`@/views${item.path}/page.json`).then((res) => {
            //      res.json().then((data) => {
            //          console.log("=======data",data);
            //      })
            //  })

            item.children = handleRoutes(item.children);
        }
    });
    return routes;
}
// 前端固定菜单配置
/**
 * 渲染菜单图标，支持普通态/激活态切换
 * @param code 菜单项 code，用于在 menuIconMap / menuIconActiveMap 中查找图标
 * @param selectedKey 当前选中菜单的 key 的响应式引用，传入后图标会自动根据选中状态切换
 */
function renderIcon(code: string, selectedKey?: Ref<string>) {
    if (!code || typeof code !== 'string' || !code.trim()) return undefined;

    const normalUrl = menuIconMap[code];
    if (!normalUrl) return undefined;

    // 激活态图标：有则用，没有则回退到普通态
    const activeUrl = menuIconActiveMap[code] || normalUrl;

    // 无 selectedKey 时只返回普通态图标（兼容主数据动态配置模式）
    if (!selectedKey) {
        return () => h('img', { src: normalUrl, class: 'nav_icon', style: { width: '24px', height: '24px' } });
    }

    // 有 selectedKey 时，render 函数内部读取 selectedKey.value，
    // Vue 会自动追踪该响应式依赖，选中状态变化时自动重新渲染
    return () => {
        const isActive = selectedKey.value === code;
        return h('img', {
            src: isActive ? activeUrl : normalUrl,
            class: 'nav_icon',
            style: { width: '24px', height: '24px' },
        });
    };
}

/**
 * 扁平化处理路由数据，方便查询
 */
export function flattenRoutes(routes: Array<any>) {
    let flatRoutes: Array<any> = [];
    (routes || []).forEach((item) => {
        flatRoutes.push(item);
        if (item.children && item.children.length > 0) {
            flatRoutes = [...flatRoutes, ...flattenRoutes(item.children)];
        }
    });
    return flatRoutes;
}
/**
 * 递归处理路由,
 * 将路由数据处理成n-menu组件可用的数据格式
 */
export function handleMenuRoutes(routes: Array<any>, selectedKey?: Ref<string>) {
    const menuRoutes: Array<MenuItem> = [];
    (routes || []).forEach((item) => {
        if (item.children && item.children.length > 0) {
            if (item.visible === true) {
                const newChildren = handleMenuRoutes(item.children, selectedKey);
                menuRoutes.push({
                    label: item.name,
                    key: item.code,
                    icon: renderIcon(item.code, selectedKey), // 前端固定菜单用code
                    path: item.path,
                    ...(newChildren.length > 0 ? { children: newChildren } : {}),
                });
            }
        } else {
            if (item.visible === true) {
                const menuItem: MenuItem = {
                    label: item.name,
                    key: item.code,
                    path: item.path,
                };
                // 仅在有有效 icon 时才设置，避免预留图标占位空间
                if (item.icon) {
                    menuItem.icon = renderIcon(item.code, selectedKey);
                }
                menuRoutes.push(menuItem);
            }
        }
    });
    return menuRoutes;
}
/**
 * 将路由数据提取出来，满足导航需求
 */
export function handleNavRoutes(routes: Array<any>): { [name: string]: string[] } {
    let mp: { [name: string]: string[] } = {};
    (routes || []).forEach((it) => {
        if (it.children && it.children.length && it.children.some((arr: any) => arr.visible)) {
            loop(it.children, [it.name]);
        } else {
            mp[it.code] = [it.name];
        }
    });

    function loop(list: Array<any>, pn: Array<any>) {
        list.forEach((t) => {
            let _nm = [...pn, t.name];
            if (t.path) {
                mp[t.code] = _nm;
            }
            if (t.children && t.children.length) {
                loop(t.children, _nm);
            } else {
                mp[t.code] = _nm;
            }
        });
    }

    return mp;
}
/**
 * 解析地址上的数据
 */
export const getLocationSearchObj = function () {
    // 通过？号获取查询参数
    let _search = '';
    // location.search? location.search.slice(1) : location.href.split('?')[1] || ""
    if (location.search) {
        // 如果能通过location.search获取到查询参数，就使用location.search
        _search = location.search.slice(1);
    } else {
        // 如果不能通过location.search获取到查询参数，就使用location.href.split('?')[1] || ""
        _search = location.href.split('?')[1] || '';
        // 为了防止_search存在#号，导致解析错误
        _search = (_search && _search.split('#')[0]) || '';
    }

    let _obj: Record<string, unknown> = {};
    _search.split('&').forEach((_str) => {
        // 为了防止_str为空字符串，导致解析错误
        if (!_str) return;
        let _info = _str.split('=') || [];
        if (!_info || _info.length !== 2) return;
        // 判断_info[1]是否使用encodeURIComponent编码过
        if (_info[1]?.startsWith('%')) {
            _info[1] = decodeURIComponent(_info[1] as string);
        }
        if (_info[1]) {
            _obj[_info[0] as string] = _info[1];
        }
    });
    return _obj;
};

/** 按钮权限添加 */
export function addBtnRight(app: any, pinia: any) {
    app.directive('btnRight', function (el: any, bd: any) {
        const userRightsStore = useUserRightsStore(pinia);
        let nowRights = userRightsStore.userRights;

        if (Array.isArray(bd.value)) {
            bd.value.forEach((item: any) => {
                if (!nowRights.includes('*:*:*') && !nowRights.includes(item)) {
                    el.setAttribute('style', 'display: none;');
                }
            });
        } else {
            if (!nowRights.includes('*:*:*') && !nowRights.includes(bd.value)) {
                el.setAttribute('style', 'display: none;');
            }
        }
    });
}
/**
 * 信息提示方法，融合naive-ui的message和vant的toast，根据环境判断使用哪种提示方式
 * 并且将vant的toast的showSuccessToast和showFailToast与naive-ui的message合并
 */
export function showMessage(message: any) {
    const baseDuration = 2000;
    if (!isApp()) {
        // 开发环境使用naive-ui的message

        return {
            success: (msg: string, duration?: number) => {
                message.success(msg, { duration: duration ? duration : baseDuration });
            },
            error: (msg: string, duration?: number) => {
                message.error(msg, { duration: duration ? duration : baseDuration });
            },
            info: (msg: string, duration?: number) => {
                message.info(msg, { duration: duration ? duration : baseDuration });
            },
            warning: (msg: string, duration?: number) => {
                message.warning(msg, { duration: duration ? duration : baseDuration });
            },
        };
    } else {
        return {
            success: (msg: string, duration?: number) => {
                showSuccessToast({
                    message: msg,
                    duration: duration ? duration : baseDuration,
                });
            },
            error: (msg: string, duration?: number) => {
                showFailToast({
                    message: msg,
                    duration: duration ? duration : baseDuration,
                });
            },
            info: (msg: string, duration?: number) => {
                showToast({
                    message: msg,
                    duration: duration ? duration : baseDuration,
                });
            },
            warning: (msg: string, duration?: number) => {
                showFailToast({
                    message: msg,
                    duration: duration ? duration : baseDuration,
                });
            },
        };
    }
}
/**
 * 接口获取指定字典项
 * @param dictCode 字典项编码
 * @param key 字典项键值
 * @returns 字典项值
 */
export async function getDictMapApiFun() {
    const { setDictMap } = useDictStore();
    const dictArr = [
        '附件类型',
        '工区字典',
        '隐患级别',
        '工作面状态',
        '班组类型',
        '风险等级',
        '工程类别',
        '排班管理状态',
        '作业面字典类型',
        '审核流程编码',
        '巡检任务状态',
        '班次字典',
        '巡检类型',
        '工区年度计划状态',
        // crm 字典项
        '区域类型',
        '核心产品类型',
        '关怀周期',
        '关怀类型',
        '接待规格',
        '接待地点',
        '拜访周期',
        '拜访目的',
        '执行方式',
        '矿石种类',
        '价格机制',
        '结算方式',
        '计价方式',
        '供方单位',
        '运输方式',
        '采购产品类型',
        '矿山类型',
        'AI模型',
        '矿种',
        '所属公司',
        '合同定价所属公司',
        '销售合同结算方式',
        '反馈问题类型', '反馈状态','反馈处理类型',
        '交割方式',
        '优先级',
        '催收方式',
        '回款方式',
        '增值税开票类型',
        '业务类型',
        '计算周期'
    ];
    const dictCodes: string[] = [];
    const dictMap: { [name: string]: any } = {};
    const newDictMap: { [name: string]: any } = {};
    // 根据dictArr获取字典映射
    const getDictValue = (data: any) => {
        for (const key in data) {
            if (!Object.prototype.hasOwnProperty.call(data, key) || !newDictMap[key]) continue;
            dictMap[newDictMap[key]] = (data[key] || []).map((item: any) => {
                return {
                    ...item,
                    value: item.code,
                    label: item.name,
                    text: item.name,
                };
            });
        }

        return dictMap;
    };
    // 扭转字典映射
    const getNewDictMap = (dictArr: string[]) => {
        dictArr.forEach((name: string) => {
            newDictMap[enumConfig[name]] = name;
            dictCodes.push(enumConfig[name]);
        });
    };

    getNewDictMap(dictArr);

    const { data, code } = await getDictMapApi({
        parentCodes: dictCodes,
    });
    if (code === 200) {
        setDictMap(getDictValue(data));
        setConfigItem('dictMap', getDictValue(data));
    } else {
    }
}

/**
 * ts订阅模式，用于浏览器可视区域宽度变化时执行
 */
// export const useResize = (callback: () => void) => {
//     const resize = () => {
//         callback();
//     };
//     useEffect(() => {
//         window.addEventListener('resize', resize);
//         return () => {
//             window.removeEventListener('resize', resize);
//         };
//     }, []);
// }

/**
 * 判定数据是否有值
 */
export const isValue = computed(() => {
    return (data: any) => {
        if (data || data === 0) {
            return data;
        } else {
            return '--';
        }
    };
});

// 日期范围快捷键
export const quickDate = {
    今日: () => {
        const start = dayjs().startOf('day').valueOf();
        const end = dayjs().endOf('day').valueOf();
        return [start, end] as const;
    },

    昨日: () => {
        const start = dayjs().subtract(1, 'day').startOf('day').valueOf();
        const end = dayjs().subtract(1, 'day').endOf('day').valueOf();
        return [start, end] as const;
    },

    近7天: () => {
        const end = dayjs().valueOf();
        const start = dayjs().subtract(7, 'day').valueOf();
        return [start, end] as const;
    },
};

// 是否是乾坤环境
export const isQiankun = () => {
    return window.__POWERED_BY_QIANKUN__;
};
// 深拷贝方法
export const deepClone = <T>(obj: T): T => {
    // 使用纯js实现
    const map = new Map();

    const clone = (source: any): any => {
        // 处理基本类型
        if (source === null || typeof source !== 'object') {
            return source;
        }

        // 处理循环引用
        if (map.has(source)) {
            return map.get(source);
        }

        // 处理数组
        if (Array.isArray(source)) {
            const newArray = [];
            map.set(source, newArray);
            for (let i = 0; i < source.length; i++) {
                newArray.push(clone(source[i]));
            }
            return newArray;
        }

        // 处理对象
        if (typeof source === 'object') {
            const newObj: any = {};
            map.set(source, newObj);
            for (const key in source) {
                if (Object.prototype.hasOwnProperty.call(source, key)) {
                    newObj[key] = clone(source[key]);
                }
            }
            return newObj;
        }
    };

    return clone(obj) as T;
};
// 图片引入
export const getImgUrl = (path: any, url: any) => {
    let imgUrl = '';
    if (path) {
        imgUrl = new URL(`../assets/images/${path}/${url}.png`, import.meta.url).href;
    } else {
        imgUrl = new URL(`../assets/images/${url}.png`, import.meta.url).href;
    }
    return imgUrl;
};
/**
 * 获取文件类型
 * @param fileType 
 * @returns 
 */
export const getFileType = (fileType: string) => {
    if (fileType == 'application/pdf') {
        return 'PDF'
    } else {
        return fileType
    }
}
/**
 * 判断传入的权限是否在userRights中存在
 */
export function checkPermission(permission: string | string[]) {
    const { userRights } = storeToRefs(useUserRightsStore());
    if (userRights.value.includes('*:*:*')) {
        return true;
    }
    if (!permission || permission.length === 0 || !userRights.value) return false;
    if (Array.isArray(permission)) {
        return permission.some((item) => userRights.value.includes(item));
    } else {
        return userRights.value.includes(permission);
    }
}

import dayjs from 'dayjs';
import Decimal from 'decimal.js';
// 判断数据是否存在，包括0，如果数据存在返回数据本身，否则返回null
export const checkDataExist = (data: any) => {
    return data !== undefined && data !== null && data !== '' ? data : null;
};
// 判断数据是否存在，包括0，存在返回true,否则返回false
export const checkDataExistBoolean = (data: any) => {
    return data !== undefined && data !== null && data !== '' ? true : false;
};

// 数字转中文大写
export const numberToChinese = (num: number) => {
    const chineseNumbers = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
    const chineseUnits = ['', '十', '百', '千', '万'];

    if (num === 0) return chineseNumbers[0];

    let str = '';
    let n = num;
    let unitIndex = 0;

    while (n > 0) {
        const digit = n % 10;
        if (digit !== 0) {
            str = chineseNumbers[digit] + chineseUnits[unitIndex] + str;
        } else if (str.charAt(0) !== chineseNumbers[0]) {
            // 避免连续的零
            str = chineseNumbers[0] + str;
        }
        n = Math.floor(n / 10);
        unitIndex++;
    }

    // 处理"一十"为"十"的特殊情况
    if (str.startsWith('一十')) {
        str = str.substring(1);
    }

    // 去除末尾的零
    if (str.endsWith(chineseNumbers[0])) {
        str = str.substring(0, str.length - 1);
    }

    return str;
};

// 通用文件导出
export const exportFile = (data: any, fileName: string) => {
    if (data instanceof ArrayBuffer) {
        const blob = new Blob([data], { type: 'application/vnd.ms-excel' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
        // 下载完成后，移除a标签
        a.remove();
        // window.$message.success('模板下载成功！');15
    }
};

/**
 * 防抖节流方法
 */
export const debounce = (func: Function, delay: number) => {
    let timer: any = null;
    return function (...args: any[]) {
        if (timer) {
            clearTimeout(timer);
        }
        timer = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
};
/**
 * 年度计划计算品味总计
 * 算法：总计品位 = (Σ(矿岩总量 × 品位)) / Σ(矿岩总量)
 * 案例：总计品位 = (月份1矿岩总量×品位 + 月份2矿岩总量×品位 + ...) / (月份1矿岩总量 + 月份2矿岩总量 + ...)
 */
export const comprehensiveGradeTotalFun = (details: any[]) => {
    // 计算 Σ(矿岩总量 × 品位) 和 Σ(矿岩总量)
    let totalGradeProduct = 0; // 矿岩总量×品位 的总和
    let totalOreAmount = 0; // 矿岩总量 的总和

    details.forEach((item: any) => {
        const outputOre = Number(item.outputOre) || 0; // 矿岩总量
        const comprehensiveGrade = Number(item.comprehensiveGrade) || 0; // 品位

        totalGradeProduct = Decimal.add(
            String(totalGradeProduct),
            Decimal.mul(String(outputOre), String(comprehensiveGrade)).toFixed(2)
        ).toNumber();
        totalOreAmount = Decimal.add(String(totalOreAmount), String(outputOre)).toNumber();
    });

    // 如果矿岩总量为0，返回0避免除以0
    if (totalOreAmount === 0) {
        return '0';
    }
    console.log('年度计划-Σ(矿岩总量 × 品位)', totalGradeProduct);
    console.log('年度计划-Σ(矿岩总量)', totalOreAmount);
    // 计算综合品位并保留2位小数
    const result = Decimal.div(totalGradeProduct, totalOreAmount).toFixed(2);
    return Number(result);
};

/**
 * 获取年份（支持年份数字或时间戳）
 * @param {any} value - 输入值（年份数字、时间戳、或其他）
 * @returns {number|null} - 返回年份数字，无效时返回 null
 */
export function timestampToYear(value: any) {
    console.log('年份判断1', value);
    // 1. 处理 null、undefined、空字符串
    if (value === null || value === undefined || value === '') {
        return null;
    }

    // 2. 尝试转换为数字
    let num;
    if (typeof value === 'number') {
        num = value;
    } else if (typeof value === 'string' && /^-?\d+$/.test(value.trim())) {
        num = Number(value.trim());
    } else {
        return null; // 包含汉字、特殊字符等
    }
    console.log('年份判断2', num);

    // 3. 检查是否为有效数字
    if (isNaN(num) || !isFinite(num)) {
        return null;
    }

    // 4. 负数无效
    if (num < 0) {
        return null;
    }

    const date = new Date(String(num).length === 4 ? String(num) : num);

    if (!isNaN(date.getTime())) {
        return date.getFullYear();
    }

    // 8. 其他情况返回 null
    return null;
}
/**
 * 清理storage缓存和network缓存，并刷新页面
 */
export function forceReload() {
    // 6. 注销 Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker
            .getRegistrations()
            .then((registrations) => {
                registrations.forEach((reg) => reg.unregister());
                console.log('✅ Service Worker 已注销');
            })
            .catch((e) => console.warn('Service Worker 注销失败', e));
    }

    // 7. 强制刷新页面
    console.log('🔄 2秒后强制刷新页面...');
    setTimeout(() => {
        location.reload();
    }, 2000);
}

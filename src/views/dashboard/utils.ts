/**
 * 为数字值增加千分位分隔符，小数部分按接口原值完整保留。
 * 已格式化或非纯数字内容直接原样展示。
 */
export const formatDashboardValue = (value: unknown): string => {
    if (value === null || value === undefined || value === '') return '--';

    const rawValue = String(value);
    const numberParts = rawValue.match(/^([+-]?)(\d+)(\.\d+)?$/);
    if (!numberParts) return rawValue;

    const [, sign, integerPart, decimalPart = ''] = numberParts;
    const groupedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return `${sign}${groupedInteger}${decimalPart}`;
};


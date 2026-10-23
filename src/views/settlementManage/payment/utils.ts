import dayjs from 'dayjs';
import Decimal from 'decimal.js';

// 回款模块空值统一展示文案。
export const EMPTY_TEXT = '--';
export const PAYMENT_AMOUNT_PRECISION = 2;
export const ROUND_OFF_MIN = 0;
export const ROUND_OFF_MAX = 999;
export const ROUND_OFF_PRECISION = 2;
export const OVERFLOWING_TYPE_NONE = '1';
export const OVERFLOWING_TYPE_SURPLUS_REVENUE = '2';
export const OVERFLOWING_TYPE_PREPAYMENT_OFFSET = '3';
export const OVERFLOWING_TYPE_OPTIONS = [
    { label: '无溢收款/预收冲应收', value: OVERFLOWING_TYPE_NONE },
    { label: '溢收款', value: OVERFLOWING_TYPE_SURPLUS_REVENUE },
    { label: '预收冲应收', value: OVERFLOWING_TYPE_PREPAYMENT_OFFSET },
];

/**
 * 获取溢冲处理类型文案。
 * @param value 溢冲处理类型
 * @returns 类型文案，未匹配时返回空值占位
 */
export const getOverflowingTypeLabel = (value: any) => {
    return OVERFLOWING_TYPE_OPTIONS.find((item) => item.value === String(value))?.label || EMPTY_TEXT;
};

/**
 * 根据批量回款明细计算溢收款和预收冲应收合计。
 * @param records 批量回款明细
 * @returns 溢收款合计和预收冲应收合计
 */
export const calculateOverflowingTotals = (records: any[] = []) => {
    let surplusRevenueTotal = new Decimal(0);
    let advanceReceiptTotal = new Decimal(0);

    records.forEach((item) => {
        const amount = Number(item?.surplusRevenue);
        const safeAmount = Number.isFinite(amount) ? new Decimal(String(amount)) : new Decimal(0);
        if (String(item?.overflowingType) === OVERFLOWING_TYPE_SURPLUS_REVENUE) {
            surplusRevenueTotal = surplusRevenueTotal.plus(safeAmount);
        }
        if (String(item?.overflowingType) === OVERFLOWING_TYPE_PREPAYMENT_OFFSET) {
            advanceReceiptTotal = advanceReceiptTotal.plus(safeAmount);
        }
    });

    return {
        surplusRevenueTotal: Number(surplusRevenueTotal.toFixed(PAYMENT_AMOUNT_PRECISION)),
        advanceReceiptTotal: Number(advanceReceiptTotal.toFixed(PAYMENT_AMOUNT_PRECISION)),
    };
};

/**
 * 校验批量回款明细行并返回字段级错误。
 * @param row 当前批量回款明细
 * @returns 字段名到错误文案的映射
 */
export const getBatchPaymentRowErrors = (row: any = {}) => {
    const errors: Record<string, string> = {};
    const amount = Number(row.amount);
    const overflowingType = String(row.overflowingType || '');

    if (!OVERFLOWING_TYPE_OPTIONS.some((item) => item.value === overflowingType)) {
        errors.overflowingType = '请选择溢冲处理';
    }

    if (row.amount === null || row.amount === undefined || row.amount === '') {
        errors.amount = '请输入回款金额';
    } else if (!Number.isFinite(amount) || amount < 0) {
        errors.amount = '回款金额不能小于0';
    } else if (amount > Number(row.amountUnpaid || 0)) {
        errors.amount = '回款金额不能超过未收金额';
    } else if (!isValidPaymentAmountPrecision(row.amount)) {
        errors.amount = '回款金额最多保留2位小数';
    }

    if (overflowingType !== OVERFLOWING_TYPE_NONE) {
        const surplusAmount = Number(row.surplusRevenue);
        if (row.surplusRevenue === null || row.surplusRevenue === undefined || row.surplusRevenue === '') {
            errors.surplusRevenue = '请输入溢收款/预收冲应收金额';
        } else if (!Number.isFinite(surplusAmount) || surplusAmount < 0) {
            errors.surplusRevenue = '金额不能小于0';
        } else if (!isValidPaymentAmountPrecision(row.surplusRevenue)) {
            errors.surplusRevenue = '金额最多保留2位小数';
        }

        if (!errors.surplusRevenue && overflowingType === OVERFLOWING_TYPE_PREPAYMENT_OFFSET) {
            const result = validatePrepaymentOffset(
                row.surplusRevenue,
                row.amount,
                row.prepaymentAmount,
                row.amountDue
            );
            if (!result.withinDue) {
                errors.surplusRevenue = '预收冲应收加回款金额不能超过应收金额';
            }
        }
    }

    if (!isValidRoundOff(row.zeroing)) {
        errors.zeroing = '抹零数据需在0到999之间，最多保留2位小数';
    }

    return errors;
};

/**
 * 格式化普通字段空值。
 * @param value 待展示字段值
 * @returns 有值时返回原值，空值返回占位文案
 */
export const formatEmpty = (value: any) => {
    if (value === undefined || value === null || value === '') return EMPTY_TEXT;
    return value;
};

/**
 * 格式化金额展示，默认单位为元。
 * @param value 金额值
 * @param unit 金额单位
 * @returns 带单位的金额文案，空值返回占位文案
 */
export const formatAmount = (value: any, unit = '元') => {
    if (value === undefined || value === null || value === '') return EMPTY_TEXT;
    return `${value}${unit}`;
};

/**
 * 将回款金额按元精度格式化为两位小数数字。
 * @param value 回款金额
 * @returns 两位精度金额数字
 */
export const toPaymentAmountNumber = (value: any) => {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return 0;
    return Number(amount.toFixed(PAYMENT_AMOUNT_PRECISION));
};

/**
 * 校验预收冲应收金额是否同时满足资金余额和应收金额限制。
 * @param surplusRevenue 预收冲应收金额
 * @param payAmount 本次回款金额
 * @param prepaymentAmount 客户资金余额
 * @param amountDue 当前回款单应收金额
 * @returns 资金余额和应收金额是否均满足限制
 */
export const validatePrepaymentOffset = (surplusRevenue: any, payAmount: any, prepaymentAmount: any, amountDue: any) => {
    const toDecimal = (value: any) => {
        const number = Number(value);
        return Number.isFinite(number) ? new Decimal(String(number)) : new Decimal(0);
    };
    const surplusAmount = toDecimal(surplusRevenue);
    const paymentAmount = toDecimal(payAmount);
    const balanceAmount = toDecimal(prepaymentAmount);
    const dueAmount = toDecimal(amountDue);

    return {
        withinBalance: surplusAmount.lte(balanceAmount),
        withinDue: surplusAmount.plus(paymentAmount).lte(dueAmount),
    };
};

/**
 * 判断回款金额是否最多保留两位小数。
 * @param value 回款金额
 * @returns 是否合法
 */
export const isValidPaymentAmountPrecision = (value: any) => {
    if (value === undefined || value === null || value === '') return false;
    const amount = Number(value);
    if (!Number.isFinite(amount)) return false;
    const decimalPart = String(value).split('.')[1] || '';
    return decimalPart.length <= PAYMENT_AMOUNT_PRECISION;
};

/**
 * 格式化 App 回款金额输入，最多保留两位小数。
 * @param value 输入值
 * @returns 格式化后的输入值
 */
export const formatPaymentAmountInput = (value: any) => {
    const valueText = String(value ?? '').replace(/[^\d.]/g, '');
    if (!valueText) return '';
    const hasDecimalPoint = valueText.includes('.');
    const parts = valueText.split('.');
    const integerText = parts[0] || '0';
    const decimalText = parts.slice(1).join('').slice(0, PAYMENT_AMOUNT_PRECISION);
    return hasDecimalPoint ? `${integerText}.${decimalText}` : integerText;
};

/**
 * 格式化 App 抹零数据输入，最多保留两位小数。
 * @param value 输入值
 * @returns 格式化后的输入值
 */
export const formatRoundOffInput = (value: any) => {
    const valueText = String(value ?? '').replace(/[^\d.]/g, '');
    if (!valueText) return '';
    const hasDecimalPoint = valueText.includes('.');
    const parts = valueText.split('.');
    const integerText = parts[0] || '0';
    const decimalText = parts.slice(1).join('').slice(0, ROUND_OFF_PRECISION);
    return hasDecimalPoint ? `${integerText}.${decimalText}` : integerText;
};

/**
 * 判断抹零数据是否为空，或在 0 到 999 之间且最多两位小数。
 * @param value 抹零数据
 * @returns 是否合法
 */
export const isValidRoundOff = (value: any) => {
    if (value === undefined || value === null || value === '') return true;
    const roundOff = Number(value);
    if (!Number.isFinite(roundOff) || roundOff < ROUND_OFF_MIN || roundOff > ROUND_OFF_MAX) return false;
    const decimalPart = String(value).split('.')[1] || '';
    return decimalPart.length <= ROUND_OFF_PRECISION;
};

/**
 * 将抹零数据转换为最多两位小数的可提交数字。
 * @param value 抹零数据
 * @returns 两位精度抹零数据
 */
export const toRoundOffNumber = (value: any) => {
    const roundOff = Number(value);
    if (!Number.isFinite(roundOff)) return ROUND_OFF_MIN;
    return Number(roundOff.toFixed(ROUND_OFF_PRECISION));
};

/**
 * 格式化接口日期参数。
 * @param value 日期值
 * @returns YYYY-MM-DD 日期字符串，非法日期返回 undefined
 */
export const formatDateParam = (value: any) => {
    if (!value) return undefined;
    const date = dayjs(value);
    return date.isValid() ? date.format('YYYY-MM-DD') : undefined;
};

/**
 * 将日期转换为 App 日期选择器需要的数组格式。
 * @param value 日期值
 * @returns 年月日数组，非法日期返回空数组
 */
export const toDatePickerValue = (value: any) => {
    if (!value) return [];
    const date = dayjs(value);
    return date.isValid() ? [date.format('YYYY'), date.format('MM'), date.format('DD')] : [];
};

/**
 * 格式化经办人字段。
 * @param handler 经办人字段，兼容数组、对象和字符串
 * @returns 经办人名称文案
 */
export const formatHandlerName = (handler: any) => {
    if (Array.isArray(handler)) {
        const names = handler
            .map((item) => {
                if (!item) return '';
                if (typeof item === 'string') return item;
                return item.username || item.userName || item.name || item.label;
            })
            .filter(Boolean);
        return names.length ? names.join('、') : EMPTY_TEXT;
    }
    if (handler && typeof handler === 'object') {
        return handler.username || handler.userName || handler.name || handler.label || EMPTY_TEXT;
    }
    return handler || EMPTY_TEXT;
};

/**
 * 标准化回款单数据。
 * @param row 回款单或回款记录原始数据
 * @returns 补齐经办人展示字段后的数据
 */
export const normalizePaymentRecord = (row: any = {}) => ({
    ...row,
    handlerName: formatHandlerName(row.handler),
});

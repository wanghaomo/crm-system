import dayjs from 'dayjs';
import { getCommonApprovalLogsNewMap } from '@/api/approval';
import { getYardPageApi } from '@/api/comm';
import { getApprovalUserNameMap, normalizeApprovalDetailsNewMap } from '@/utils/approval';

export const EMPTY_TEXT = '--';

export const SETTLEMENT_NUMBER_PRECISION = 2;
export const SETTLEMENT_AMOUNT_PRECISION = 4;
export const SETTLEMENT_DECIMAL_MAX = 999999999.99;
export const SETTLEMENT_PERCENTAGE_MAX = 100;
export const SETTLEMENT_SIGNED_MIN = -SETTLEMENT_DECIMAL_MAX;

export type SettlementNumberRule = {
    min: number;
    max: number;
    precision: number;
};

export type SettlementNumberField = {
    key: string;
    label: string;
};

/**
 * 结算明细表中贸易商的可编辑数字字段。
 */
export const SETTLEMENT_TRADER_NUMBER_FIELDS: SettlementNumberField[] = [
    { key: 'settleOreGrade', label: '结算品位' },
    { key: 'moisture', label: '水分（%）' },
    { key: 'exceedMoisture', label: '超出水分吨数' },
    { key: 'actualReceiptWeight', label: '实收量（吨）' },
    { key: 'settleWeight', label: '结算量（吨）' },
    { key: 'gradeFloat', label: '品位增减价（元）' },
    { key: 'taxIncludedPrice', label: '结算单价（元/吨）' },
];

/**
 * 结算明细表中化工企业的可编辑数字字段。
 */
export const SETTLEMENT_CHEMICAL_NUMBER_FIELDS: SettlementNumberField[] = [
    { key: 'settleOreGrade', label: '结算品位' },
    { key: 'priceIncrease', label: '增减价' },
    { key: 'contentMgoContent', label: '氧化镁含量≥4.5%含量' },
    { key: 'contentMgoWeightedAverage', label: '氧化镁含量≥4.5%加权平均' },
    { key: 'contentMgoPriceIncrease', label: '氧化镁含量≥4.5%增减价' },
    { key: 'contentFeoContent', label: '氧化铁含量（≤0.8%）含量' },
    { key: 'contentFeoWeightedAverage', label: '氧化铁含量（≤0.8%）加权平均' },
    { key: 'contentFeoPriceIncrease', label: '氧化铁含量（≤0.8%）增减价' },
    { key: 'contentAloContent', label: '氧化铝含量（≤1%）含量' },
    { key: 'contentAloWeightedAverage', label: '氧化铝含量（≤1%）加权平均' },
    { key: 'contentAloPriceIncrease', label: '氧化铝含量（≤1%）增减价' },
    { key: 'moisture', label: '水分（%）' },
    { key: 'exceedMoisture', label: '超出水分吨位（吨）' },
    { key: 'granularity', label: '粒度≤30mm过筛率%' },
    { key: 'actualReceiptWeight', label: '实收量（吨）' },
    { key: 'settleWeight', label: '结算量（吨）' },
    { key: 'taxIncludedPrice', label: '结算单价（元/吨）' },
];

const SETTLEMENT_PERCENTAGE_FIELDS = new Set([
    'settleOreGrade',
    'moisture',
    'granularity',
    'content',
    'weightedAverage',
    'contentMgoContent',
    'contentMgoWeightedAverage',
    'contentFeoContent',
    'contentFeoWeightedAverage',
    'contentAloContent',
    'contentAloWeightedAverage',
]);

/**
 * 获取结算明细数字字段的输入范围和精度。
 * @param field 字段名，成分字段可传含量、加权平均或对应完整字段名
 * @returns 数字输入规则
 */
export const getSettlementNumberRule = (field: string): SettlementNumberRule => {
    if (['gradeFloat', 'priceIncrease', 'contentMgoPriceIncrease', 'contentFeoPriceIncrease', 'contentAloPriceIncrease'].includes(field)) {
        return {
            min: SETTLEMENT_SIGNED_MIN,
            max: SETTLEMENT_DECIMAL_MAX,
            precision: SETTLEMENT_NUMBER_PRECISION,
        };
    }
    if (field === 'taxIncludedPrice') {
        return {
            min: SETTLEMENT_SIGNED_MIN,
            max: SETTLEMENT_DECIMAL_MAX,
            precision: SETTLEMENT_AMOUNT_PRECISION,
        };
    }
    if (SETTLEMENT_PERCENTAGE_FIELDS.has(field)) {
        return {
            min: 0,
            max: SETTLEMENT_PERCENTAGE_MAX,
            precision: SETTLEMENT_NUMBER_PRECISION,
        };
    }
    return {
        min: 0,
        max: SETTLEMENT_DECIMAL_MAX,
        precision: SETTLEMENT_NUMBER_PRECISION,
    };
};

/**
 * 将金额格式化为四位小数，非法值按默认值处理。
 * @param value 原始金额
 * @param defaultValue 非法值或空值的默认值
 * @returns 四位小数金额
 */
export const getSettlementAmountNumber = (value: any, defaultValue = 0) => {
    if (value === null || value === undefined || value === '') return defaultValue;
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? Number(numberValue.toFixed(SETTLEMENT_AMOUNT_PRECISION)) : defaultValue;
};

/**
 * 格式化结算金额展示文本，固定保留四位小数。
 * @param value 原始金额
 * @param placeholder 空值占位文案
 * @returns 金额展示文本
 */
export const formatSettlementAmount = (value: any, placeholder = '--') => {
    if (value === null || value === undefined || value === '') return placeholder;
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue.toFixed(SETTLEMENT_AMOUNT_PRECISION) : placeholder;
};

/**
 * 计算申请开票明细的含税金额、税额和不含税金额。
 * 含税金额按数量乘以含税单价计算，税额按含税金额乘以税率计算。
 * @param row 申请开票明细行
 * @returns 计算后的金额字段，数量或单价为空时金额字段均为空
 */
export const calculateInvoiceAmounts = (row: any) => {
    const isEmptyValue = (value: any) => value === null || value === undefined || value === '';
    if (isEmptyValue(row?.quantity) || isEmptyValue(row?.unitPrice)) {
        return {
            amount: null,
            taxAmount: null,
            amountExcludingTax: null,
        };
    }

    const quantity = Number(row.quantity);
    const unitPrice = Number(row.unitPrice);
    if (!Number.isFinite(quantity) || !Number.isFinite(unitPrice)) {
        return {
            amount: null,
            taxAmount: null,
            amountExcludingTax: null,
        };
    }

    const amount = getSettlementAmountNumber(quantity * unitPrice, null);
    const taxRate = Number(row.taxRate);
    const normalizedTaxRate = Number.isFinite(taxRate) ? taxRate : 0;
    const normalizedAmount = amount ?? 0;
    const taxAmount = getSettlementAmountNumber((normalizedAmount * normalizedTaxRate) / 100, 0);
    const amountExcludingTax = getSettlementAmountNumber(normalizedAmount - taxAmount, 0);
    return {
        amount,
        taxAmount,
        amountExcludingTax,
    };
};

/**
 * 解析结算明细中的成分对象。
 * @param value 成分对象或 JSON 字符串
 * @returns 成分对象
 */
const parseSettlementObject = (value: any) => {
    if (!value) return {};
    if (typeof value === 'object' && !Array.isArray(value)) return value;
    try {
        const parsed = JSON.parse(value);
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch (error) {
        console.error('解析结算成分对象失败:', error);
        return {};
    }
};

/**
 * 根据合同单价和客户类型计算结算单价。
 * 化工企业为合同单价加基础及三项成分增减价，贸易商为合同单价加品位增减价。
 * @param row 结算明细行
 * @param customerType 客户类型
 * @param defaultValue 合同价为空时的返回值
 * @returns 计算后的结算单价
 */
export const getSettlementUnitPrice = (row: any, customerType: string, defaultValue: number | null = null) => {
    if (row?.contractUnitPrice === null || row?.contractUnitPrice === undefined || row?.contractUnitPrice === '') {
        return defaultValue;
    }
    const contractUnitPrice = Number(row.contractUnitPrice);
    if (!Number.isFinite(contractUnitPrice)) return defaultValue;
    const getNumber = (value: any) => {
        const numberValue = Number(value);
        return Number.isFinite(numberValue) ? numberValue : 0;
    };
    if (String(customerType || '').toUpperCase() === 'TRADER') {
        return getSettlementAmountNumber(contractUnitPrice + getNumber(row.gradeFloat), defaultValue ?? 0);
    }
    const mgo = parseSettlementObject(row.contentMgoObject || row.contentMgo);
    const feo = parseSettlementObject(row.contentFeoObject || row.contentFeo);
    const alo = parseSettlementObject(row.contentAloObject || row.contentAlo);
    const adjustment = [
        row.priceIncrease,
        mgo.priceIncrease ?? mgo.increasePrice ?? mgo.priceFloat ?? mgo['增价'] ?? mgo['增减价'],
        feo.priceIncrease ?? feo.increasePrice ?? feo.priceFloat ?? feo['增价'] ?? feo['增减价'],
        alo.priceIncrease ?? alo.increasePrice ?? alo.priceFloat ?? alo['增价'] ?? alo['增减价'],
    ].reduce((total, value) => total + getNumber(value), 0);
    return getSettlementAmountNumber(contractUnitPrice + adjustment, defaultValue ?? 0);
};

/**
 * 将结算明细数字输入限制在字段规则范围内，并按字段规则保留小数。
 * @param value 原始数字值
 * @param field 字段名
 * @param defaultValue 无法转换为数字时的返回值
 * @returns 处理后的数字或默认值
 */
export const normalizeSettlementNumber = (value: any, field: string, defaultValue: number | null = null) => {
    if (value === null || value === undefined || value === '') return defaultValue;
    const numberValue = Number(value);
    if (!Number.isFinite(numberValue)) return defaultValue;
    const rule = getSettlementNumberRule(field);
    const boundedValue = Math.min(rule.max, Math.max(rule.min, numberValue));
    return Number(boundedValue.toFixed(rule.precision));
};

/**
 * 校验结算明细数字字段是否超出范围。
 * @param value 原始数字值
 * @param field 字段名
 * @param label 字段展示名称
 * @returns 错误文案，无错误时返回空字符串
 */
export const getSettlementNumberValidationMessage = (value: any, field: string, label: string) => {
    if (value === null || value === undefined || value === '') return '';
    const numberValue = Number(value);
    if (!Number.isFinite(numberValue)) return `${label}必须为数字`;
    const rule = getSettlementNumberRule(field);
    if (numberValue < rule.min) return `${label}不能小于${rule.min}`;
    if (numberValue > rule.max) return `${label}不能大于${rule.max}`;
    return '';
};

export type SettlementYardOption = {
    label: string;
    value: string;
};

/**
 * 加载启用的堆场，并转换为名称展示、编码提交的下拉选项。
 * @returns 堆场下拉选项
 */
export const loadSettlementYardOptions = async (): Promise<SettlementYardOption[]> => {
    try {
        const res = await getYardPageApi({
            current: 1,
            size: 1000,
            status: 1,
        });
        if (res?.code !== 200) return [];
        const records = Array.isArray(res.data?.records) ? res.data.records : [];
        const yardCodes = new Set<string>();
        return records.reduce((options: SettlementYardOption[], item: any) => {
            const yardName = String(item?.yardName || '').trim();
            const yardCode = String(item?.yardCode || '').trim();
            if (!yardName || !yardCode || yardCodes.has(yardCode)) return options;
            yardCodes.add(yardCode);
            options.push({
                label: yardName,
                value: yardCode,
            });
            return options;
        }, []);
    } catch (error) {
        console.error('加载结算单堆场信息失败:', error);
        return [];
    }
};

/**
 * 获取接口值对应的堆场编码，兼容关联数据暂时返回堆场名称的情况。
 * @param value 堆场编码或堆场名称
 * @param options 堆场下拉选项
 * @returns 匹配到的堆场编码，未匹配时保留原值
 */
export const getSettlementYardCode = (value: any, options: SettlementYardOption[] = []) => {
    if (value === null || value === undefined || value === '') return '';
    const text = String(value);
    const option = options.find((item) => item.value === text || item.label === text);
    return option?.value || text;
};

/**
 * 获取堆场编码对应的展示名称，映射不到时保留接口原值。
 * @param value 堆场编码或堆场名称
 * @param options 堆场下拉选项
 * @returns 堆场名称
 */
export const getSettlementYardName = (value: any, options: SettlementYardOption[] = []) => {
    if (value === null || value === undefined || value === '') return '';
    const text = String(value);
    const option = options.find((item) => item.value === text || item.label === text);
    return option?.label || text;
};

/**
 * 规范结算详情的交货地点名称展示字段。
 * @param detail 结算单详情
 * @returns 使用后端交货地点名称的结算单详情
 */
export const normalizeSettlementYardDetail = (detail: any = {}) => {
    const detailList = Array.isArray(detail.financeSettlementDetailDTOList)
        ? detail.financeSettlementDetailDTOList
        : [];
    return {
        ...detail,
        financeSettlementDetailDTOList: detailList.map((item: any) => ({
            ...item,
            deliveryLocationName: item.deliveryLocationName || EMPTY_TEXT,
        })),
    };
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
 * 兼容数组、对象、JSON 字符串和逗号分隔字符串，转换为列表。
 * @param value 原始列表值
 * @returns 标准列表
 */
export const parseSettlementList = (value: any): any[] => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'object') return [value];
    if (typeof value !== 'string') return [];
    try {
        const parsed = JSON.parse(value);
        return parseSettlementList(parsed);
    } catch (error) {
        return value.split(',').map((item) => item.trim()).filter(Boolean);
    }
};

/**
 * 从 URL 中提取文件名，提取失败时返回默认文案。
 * @param url 文件地址
 * @returns 文件名
 */
const getFileNameFromUrl = (url: any) => {
    if (!url) return '附件';
    const cleanUrl = String(url).split('?')[0].split('#')[0];
    const name = cleanUrl.substring(cleanUrl.lastIndexOf('/') + 1);
    try {
        return decodeURIComponent(name) || '附件';
    } catch (error) {
        return name || '附件';
    }
};

/**
 * 规范化详情页关联审批数据，供 MxApprovalSelect 只读展示。
 * @param value 关联审批接口字段
 * @returns 关联审批对象数组
 */
export const normalizeSettlementAssociatedApprovals = (value: any) => {
    return parseSettlementList(value)
        .filter((item) => item && typeof item === 'object')
        .map((item) => ({
            ...item,
            approvalName:
                item.approvalName ||
                item.approval?.name ||
                item.approvalInstanceName ||
                item.name ||
                item.title ||
                '',
            instanceCode:
                item.instanceCode ||
                item.approvalInstanceId ||
                item.instanceId ||
                item.instance?.code ||
                item.code ||
                '',
        }))
        .filter((item) => item.approvalName && item.instanceCode);
};

/**
 * 规范化详情页附件数据，供上传组件只读展示。
 * @param value 附件接口字段
 * @returns 上传组件可回显的附件列表
 */
export const normalizeSettlementAttachments = (value: any) => {
    return parseSettlementList(value)
        .map((item: any) => {
            if (typeof item === 'string') {
                return {
                    fileName: getFileNameFromUrl(item),
                    name: getFileNameFromUrl(item),
                    url: item,
                    status: 'success',
                };
            }
            const url = item?.url || item?.fileUrl || item?.path || '';
            const fileName = item?.fileName || item?.name || item?.originalName || item?.filename || getFileNameFromUrl(url);
            return {
                ...item,
                fileName,
                name: item?.name || fileName,
                url,
                status: item?.status || 'success',
            };
        })
        .filter((item: any) => item.fileName || item.url);
};

/**
 * 获取审批流程日志，并转换为 ApprovalDetails 组件需要的数据结构。
 * @param approvalId 审批 ID
 * @returns 审批流程节点列表
 */
export const getSettlementApprovalLogs = async (approvalId: any) => {
    if (!approvalId) return [];
    try {
        const res = await getCommonApprovalLogsNewMap(approvalId);
        if (res?.code !== 200) return [];
        const userNameMap = await getApprovalUserNameMap();
        return normalizeApprovalDetailsNewMap(res.data || [], userNameMap);
    } catch (error) {
        console.error('获取结算单审批流程失败:', error);
        return [];
    }
};

/**
 * 规范化结算详情审批相关字段，统一 web/app 详情展示的数据结构。
 * @param detail 结算详情接口数据
 * @returns 补齐审批展示字段后的详情数据
 */
export const normalizeSettlementApprovalDetail = (detail: any = {}) => {
    const approvalDTO = detail.approvalDTO || {};
    const associatedApprovalSource =
        detail.associatedApprovalObjects || approvalDTO.associatedApproval || detail.associatedApproval;
    const attachmentsInfo = detail.attachmentsInfo || approvalDTO.approveUrl;
    return {
        ...detail,
        approvalId: detail.approvalId || approvalDTO.id,
        approvalInstanceId: detail.approvalInstanceId || approvalDTO.approvalInstanceId || '',
        initiatorName: detail.initiatorName || approvalDTO.applicantName || approvalDTO.initiatorName || '',
        deptName: detail.deptName || approvalDTO.applyDeptName || approvalDTO.deptName || '',
        reason: detail.reason || approvalDTO.instruction || approvalDTO.formData || '',
        remark: detail.remark || approvalDTO.remark || '',
        attachmentsInfo,
        associatedApprovalObjects: normalizeSettlementAssociatedApprovals(associatedApprovalSource),
        attachmentsInfoObject: normalizeSettlementAttachments(attachmentsInfo),
        approvalLogs: Array.isArray(detail.approvalLogs) ? detail.approvalLogs : [],
    };
};

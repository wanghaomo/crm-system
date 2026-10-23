
export type InventoryGoodsItem = {
    goodsName?: string;
    num?: number | string;
};

export type InventoryYardItem = {
    yardName?: string;
    num?: number | string;
    goodsList?: InventoryGoodsItem[];
};

export type InventoryTransitItem = {
    licensePlate?: string;
    salesSubject?: string;
    originYard?: string;
    destinationYard?: string;
    goods?: string;
    netWeight?: number | string;
};

export type InventoryOptionItem = {
    label?: string;
    appLabel?: string;
    value?: string;
    __key?: string;
    num?: number | string;
    inventoryType?: 'internal' | 'customer';
    yardList?: InventoryYardItem[];
    detail?: InventoryTransitItem[];
    show?: boolean;
};

// 数字千分位格式化
export const numberToThousandSeparator = (num: number | string) => {
    if (num === null || num === undefined || num === '') {
        return '';
    }

    const raw = typeof num === 'string' ? num.trim() : String(num);
    if (!raw) {
        return '';
    }

    const normalized = raw.replace(/,/g, '');
    const isNegative = normalized.startsWith('-');
    const abs = isNegative ? normalized.slice(1) : normalized;

    const isPlainNumber = /^\d*(\.\d*)?$/.test(abs);
    if (!isPlainNumber) {
        try {
            const d = new Decimal(normalized);
            const text = d.toString();
            return numberToThousandSeparator(text);
        } catch {
            return raw;
        }
    }

    const dotIndex = abs.indexOf('.');
    const hasDot = dotIndex !== -1;
    const integerPartRaw = hasDot ? abs.slice(0, dotIndex) : abs;
    const fractionalPart = hasDot ? abs.slice(dotIndex + 1) : '';

    const integerPart = integerPartRaw === '' ? '0' : integerPartRaw;
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    const sign = isNegative ? '-' : '';
    return hasDot ? `${sign}${formattedInteger}.${fractionalPart}` : `${sign}${formattedInteger}`;
};

/**
 * 格式化库存吨位，固定保留两位小数并添加单位。
 * @param value 库存数量
 * @returns 带千分位、两位小数和吨单位的文本
 */
export const formatInventoryTons = (value: unknown): string => {
    const numberValue = Number(String(value ?? '').replace(/,/g, '').replace(/吨$/, ''));
    if (!Number.isFinite(numberValue)) return '0.00吨';
    return `${numberToThousandSeparator(numberValue.toFixed(2))}吨`;
};

/**
 * 将接口库存数量转换为纯数字，展示单位和千分位由组件负责。
 * @param value 接口返回的库存数量
 * @returns 可用于 Web 和 App 展示的库存数量
 */
const toInventoryNumber = (value: unknown): number => {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : 0;
    }

    const normalizedValue = String(value ?? '')
        .trim()
        .replace(/,/g, '')
        .replace(/吨$/, '');
    const numberValue = Number(normalizedValue);
    return Number.isFinite(numberValue) ? numberValue : 0;
};

/**
 * 生成移动端库区标签，库区名称较长时将“库区”换行展示。
 * @param label 库区名称
 * @returns 移动端库区标签
 */
const getInventoryAppLabel = (label: string): string => {
    return label.endsWith('库区') ? label.replace(/库区$/, '\n\r库区') : label;
};

/**
 * 将库存报表接口数据统一转换为 Web 和 App 使用的展示结构。
 * @param data 库存报表接口数据
 * @returns 排序后的库区、内部转运和客户交割库存选项
 */
export const normalizeInventoryReport = (data: any): InventoryOptionItem[] => {
    if (!data || typeof data !== 'object') return [];

    const warehouseInventorys = Array.isArray(data.warehouseInventorys)
        ? [...data.warehouseInventorys].sort((first: any, second: any) => (first?.sort ?? 0) - (second?.sort ?? 0))
        : [];
    const transferInventorys = Array.isArray(data.transferInventorys) ? data.transferInventorys : [];
    const internalTransferInventorys = Array.isArray(data.internalTransferInventorys)
        ? data.internalTransferInventorys
        : [];
    const warehouseOptions = warehouseInventorys.map((inventory: any, index: number) => {
        const label = inventory?.inventoryName || `库区${index + 1}`;
        return {
            label,
            appLabel: getInventoryAppLabel(label),
            value: inventory?.inventoryCode || `WAREHOUSE_INVENTORY_${inventory?.sort ?? index}_${index}`,
            num: toInventoryNumber(inventory?.num),
            yardList: Array.isArray(inventory?.yardList) ? inventory.yardList : [],
        };
    });

    return [
        ...warehouseOptions,
        {
            label: '内部转运在途库存',
            appLabel: '内部转运在途库存',
            value: 'IN_TRANSIT_INVENTORY',
            inventoryType: 'internal',
            num: toInventoryNumber(data.internalTransferNum),
            detail: internalTransferInventorys,
        },
        {
            label: '客户交割在途库存',
            appLabel: '客户交割在途库存',
            value: 'IN_TRANSIT_INVENTORY',
            inventoryType: 'customer',
            num: toInventoryNumber(data.transferNums),
            detail: transferInventorys,
        },
    ];
};
import Decimal from 'decimal.js';

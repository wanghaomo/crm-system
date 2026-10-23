import { FIELD_KEYS } from './fields';
import dashboardMock from '@/views/dashboard/index';
import enumConfig from '@/config/enum.cfg';

/**
 * 前端演示 Mock 适配器。
 *
 * 说明：登录校验已在前端移除，开发环境拿不到真实 token，接口会返回 401。
 * 这里通过替换 axios 的 adapter，在没有 token 的开发环境下返回模拟数据。
 * 数据格式完全仿照真实 CRM 系统（smart-platform.mxnaturalres.com:9400）采集，
 * 包括单号格式、真实客户名称、状态枚举与业务数值口径。
 */

/**
 * 是否启用 Mock。
 * 开发环境默认启用；生产构建可通过 VITE_USE_MOCK=true 强制启用（用于 GitHub Pages 等纯静态演示）。
 * 已存在真实 token 时不启用。
 */
export function shouldUseMock(): boolean {
    const mockEnabled = import.meta.env.DEV || import.meta.env.VITE_USE_MOCK === 'true';
    return mockEnabled && !sessionStorage.getItem('mx_token');
}

/** 真实系统中的客户/企业名称池（来自真实 CRM 客户档案与业务单据） */
const REAL_COMPANIES = [
    '云图嘉施利',
    '施可丰',
    '中农集团控股四川农资有限公司',
    '史丹利',
    '湖北宜化集团有限责任公司',
    '中化涪陵化工',
    '明熙矿业',
    '马边灏阳',
    '云图新能源',
    '四川火石子贸易有限公司',
    '好地方农业',
    '宙翔贸易',
    '云南云天化股份有限公司',
    '贵州磷化（集团）有限责任公司',
    '新洋丰农业科技股份有限公司',
    '四川发展龙蟒股份有限公司',
];

/** 人员名称池（景锐为真实系统业务人员） */
const PERSON_NAMES = ['景锐', '张伟', '李娜', '王强', '刘洋', '陈静', '赵磊', '周敏'];

/** 矿种/产品池（品位为 P2O5 含量） */
const ORE_TYPES = ['低品位磷矿', '中品位磷矿', '高品位磷矿', '磷矿石', '硫精矿'];
const ORE_GRADES = ['22', '24', '25', '26', '27', '28', '30'];

/** 客户类型池 */
const CUSTOMER_TYPES = ['化工企业', '贸易商', '复合肥企业', '矿山企业'];

/** 区域池 */
const REGIONS = ['西南区域', '华中区域', '华东区域', '华南区域', '华北区域'];

/** 客户星级池 */
const STAR_LEVELS = ['一星', '二星', '三星', '四星', '五星'];

/** 需要返回人员对象数组的字段 */
const PERSON_LIST_FIELDS = new Set([
    'manager',
    'executorList',
    'contactPersonList',
    'businessPerson',
    'principalList',
    'pushChatList',
]);

/** 需要返回字符串数组的字段 */
const STRING_LIST_FIELDS = new Set(['businessPersonNames', 'businessPersonCodes', 'principalCodes']);

/** 需要返回对象数组的字段 */
const OBJECT_LIST_FIELDS = new Set([
    'chemicalList',
    'traderList',
    'contactList',
    'attachmentList',
    'fileList',
    'invoiceList',
    'detailList',
    'goodsList',
    'records',
]);

/** 数值型字段匹配规则 */
const NUMBER_FIELD_REG = /(amount|price|total|num|count|quantity|weight|capacity|scale|inventory|demand|rate|ratio|days|months|year|value|score)$/i;

/** 日期型字段匹配规则 */
const DATE_FIELD_REG = /(time|date|at)$/i;

/** 月份型字段匹配规则（页面会用 dayjs 格式化，必须返回合法日期） */
const MONTH_FIELD_REG = /month$/i;

/**
 * 字典编码到中文名称的映射，用于生成可读的模拟字典选项。
 * @returns 编码与中文名称的映射表
 */
const CODE_NAME_MAP: Record<string, string> = Object.entries(enumConfig as Record<string, string>).reduce(
    (result: Record<string, string>, [name, code]) => {
        result[code] = name;
        return result;
    },
    {}
);

/**
 * 各业务模块的真实单号格式（前缀 + 日期 + 序号，与真实 CRM 一致）。
 * @param module 模块标识
 * @param index 行序号
 * @returns 模拟单号
 */
function buildCode(module: string, index: number): string {
    const seq = String(index + 1).padStart(4, '0');
    const seq3 = String(index + 1).padStart(3, '0');
    switch (module) {
        case 'customer':
            return `KH20261019${seq}`;          // 真实格式：KH202610190001
        case 'salesContract':
            return `JY-HSZ-2026${seq3}`;        // 真实格式：JY-HSZ-2026048
        case 'frameworkContract':
            return `KJ-HSZ-2026${seq3}`;
        case 'dailyShipping':
            return `FHDD20261019${seq3}`;       // 真实格式：FHDD202610190004
        case 'monthlyPlan':
            return `FHPL20260927${seq3}`;       // 真实格式：FHPL202609270003
        case 'pricing':
            return `HJZDQ20261022${seq}`;       // 真实格式：HJZDQ202610220001
        case 'settlement':
            return `JS20261019${seq}`;
        case 'payment':
            return `HK20261019${seq}`;
        case 'aiPrediction':
            return `AIAY20261020${seq}`;        // 真实格式：AIAY202610200001
        case 'starIndicator':
            return `ZB00${(index % 9) + 1}`;    // 真实格式：ZB008
        default:
            return `NO${seq}`;
    }
}

/** 各业务模块的状态枚举（中文与真实系统一致） */
const MODULE_STATUS: Record<string, { status: string; statusName: string }> = {
    customer: { status: 'STORAGE', statusName: '已入库' },
    salesContract: { status: 'EXECUTING', statusName: '执行中' },
    frameworkContract: { status: 'EXECUTING', statusName: '执行中' },
    settlement: { status: 'SETTLED', statusName: '已结算' },
    payment: { status: 'PART_RECEIVED', statusName: '部分回款' },
    funds: { status: 'PRE_PAYMENT', statusName: '预付款' },
    visitRecord: { status: 'ARCHIVED', statusName: '已归档' },
    visitPlan: { status: 'ARCHIVED', statusName: '已归档' },
    customerCare: { status: 'ARCHIVED', statusName: '已归档' },
    monthlyPlan: { status: 'ARCHIVED', statusName: '已归档' },
    dailyShipping: { status: 'EXECUTING', statusName: '执行中' },
    pricing: { status: 'DRAFT', statusName: '草稿' },
    aiPrediction: { status: 'SUCCESS', statusName: '成功' },
    default: { status: 'ARCHIVED', statusName: '已归档' },
};

/** 各业务模块列表的真实数据总量（与真实系统分页一致） */
const PAGE_TOTALS: Record<string, number> = {
    customer: 31,
    visitRecord: 7,
    visitPlan: 12,
    customerCare: 14,
    evaluation: 16,
};

/** 会话级存储键名（仅存用户操作增量：新增/修改/删除，种子数据每次确定性重建） */
const STORE_KEY = 'mx_mock_overlay_v1';

/** 增量数据结构：按模块记录新增行、修改补丁、删除的 id */
type OverlayEntry = { added: any[]; updated: Record<number, any>; deleted: number[] };

/** 增量数据缓存（懒加载 sessionStorage） */
let overlayCache: Record<string, OverlayEntry> | null = null;

/** 种子数据缓存（buildRow 确定性生成，无需持久化，避免超出 sessionStorage 配额） */
const seedCache: Record<string, any[]> = {};

/** 新增记录的自增 id 起点，避免与种子数据冲突 */
let nextId = 100000;

/**
 * 加载增量数据。
 * @returns 模块到增量记录的映射
 */
function loadOverlay(): Record<string, OverlayEntry> {
    if (overlayCache) return overlayCache;
    try {
        overlayCache = JSON.parse(sessionStorage.getItem(STORE_KEY) || '{}');
    } catch {
        overlayCache = {};
    }
    return overlayCache!;
}

/**
 * 获取模块的增量记录（不存在则初始化）。
 * @param module 模块标识
 * @returns 增量记录
 */
function getOverlayEntry(module: string): OverlayEntry {
    const overlay = loadOverlay();
    if (!overlay[module]) overlay[module] = { added: [], updated: {}, deleted: [] };
    return overlay[module];
}

/** 持久化增量数据（体积小，不会超出配额） */
function persistOverlay(): void {
    try {
        sessionStorage.setItem(STORE_KEY, JSON.stringify(overlayCache));
    } catch {
        /* 静默失败 */
    }
}

/**
 * 获取某模块的数据：确定性种子 + 用户操作增量（新增在前，修改合并，删除剔除）。
 * @param module 模块标识
 * @returns 数据行数组
 */
function getModuleStore(module: string): any[] {
    if (!seedCache[module]) {
        const total = PAGE_TOTALS[module] ?? 15;
        seedCache[module] = Array.from({ length: total }, (_, i) => buildRow(i, module));
    }
    const overlay = getOverlayEntry(module);
    const rows = seedCache[module]
        .filter((row) => !overlay.deleted.includes(row.id))
        .map((row) => (overlay.updated[row.id] ? { ...row, ...overlay.updated[row.id] } : row));
    return [...overlay.added, ...rows];
}

/**
 * 通用查询过滤：请求体中的非分页参数按"包含匹配"过滤。
 * 时间范围类参数（start/end/min/max）跳过，避免误过滤。
 * @param rows 数据行
 * @param body 请求体
 * @returns 过滤后的数据行
 */
function applyFilters(rows: any[], body: any): any[] {
    const SKIP_KEYS = new Set(['current', 'size', 'page', 'pageSize', 'sortField', 'sortOrder']);
    const filters = Object.entries(body || {}).filter(
        ([key, value]) =>
            !SKIP_KEYS.has(key) &&
            value !== '' &&
            value !== null &&
            value !== undefined &&
            !/(start|end|min|max|begin)/i.test(key)
    );
    if (!filters.length) return rows;
    return rows.filter((row) =>
        filters.every(([key, value]) => {
            const cell = row[key];
            if (cell === null || cell === undefined) return false;
            return String(cell).includes(String(value));
        })
    );
}

/**
 * 根据 URL 识别业务模块，用于状态、单号等字段的差异化模拟。
 * 映射关系基于真实系统的接口命名（如 customerBase、contractSales、monthlyDispatch）。
 * @param url 接口地址
 * @returns 模块标识
 */
function detectModule(url: string): string {
    if (/customerBase/i.test(url)) return 'customer';
    if (/customerVisit/i.test(url)) return 'visitRecord';
    if (/customerCall/i.test(url)) return 'visitPlan';
    if (/customerCare/i.test(url)) return 'customerCare';
    if (/customerEvaluation/i.test(url)) return 'evaluation';
    if (/contractSales/i.test(url)) return 'salesContract';
    if (/contractFramework/i.test(url)) return 'frameworkContract';
    if (/financeSettlementMain/i.test(url)) return 'settlement';
    if (/financeReceipt|financeCollectionRecord|financePaymentRecord/i.test(url)) return 'payment';
    if (/listCustomerCapital|ReceiptFundRecord|fundsManagement/i.test(url)) return 'funds';
    if (/monthlyDispatch/i.test(url)) return 'monthlyPlan';
    if (/shipmentDaily/i.test(url)) return 'dailyShipping';
    if (/pricing|salesPlanBasePricing/i.test(url)) return 'pricing';
    if (/aiReport/i.test(url)) return 'aiPrediction';
    if (/starIndicator|customerStar|indicatorConfig/i.test(url)) return 'starIndicator';
    if (/serviceRule|reminderConfig|notificationConfig/i.test(url)) return 'systemConfig';
    return 'default';
}

/**
 * 生成模拟日期字符串。
 * @param index 行序号，用于区分日期
 * @returns yyyy-MM-dd HH:mm:ss 格式日期
 */
function buildDate(index: number): string {
    const day = String((index % 28) + 1).padStart(2, '0');
    const hour = String(9 + (index % 9)).padStart(2, '0');
    return `2026-10-${day} ${hour}:30:00`;
}

/**
 * 生成 0-1 的伪随机数（按行序号稳定可复现）。
 * @param seed 随机种子
 * @returns 0-1 之间的小数
 */
function seededRandom(seed: number): number {
    const value = Math.sin(seed * 12.9898) * 43758.5453;
    return value - Math.floor(value);
}

/**
 * 各业务模块的领域字段覆盖（值与真实系统口径一致）。
 * @param module 模块标识
 * @param index 行序号
 * @returns 领域字段键值对
 */
function buildDomainFields(module: string, index: number): Record<string, any> {
    const company = REAL_COMPANIES[index % REAL_COMPANIES.length];
    const person = PERSON_NAMES[index % PERSON_NAMES.length];
    const rand = seededRandom(index + 1);
    switch (module) {
        case 'customer':
            return {
                customerCode: buildCode(module, index),
                enterpriseName: company,
                customerName: company,
                customerType: CUSTOMER_TYPES[index % CUSTOMER_TYPES.length],
                region: REGIONS[index % REGIONS.length],
                customerManager: person,
                docStatus: '已入库',
                coreProduct: `磷矿石（品位${ORE_GRADES[index % ORE_GRADES.length]}）`,
                cooperationStatus: '合作中',
                starLevel: STAR_LEVELS[index % STAR_LEVELS.length],
                cooperationYears: (index % 8) + 1,
                totalCooperation: Number((rand * 40 + 2).toFixed(2)),
            };
        case 'visitRecord':
            return {
                enterpriseName: company,
                customerName: company,
                visitType: index % 2 === 0 ? '客户来访' : '商务接待',
                starLevel: STAR_LEVELS[index % STAR_LEVELS.length],
                actualTime: buildDate(index),
                receptionLocation: `RECEPTION_SITE_0${(index % 3) + 1}`,   // 接待地点字典编码（enumCfg.接待地点 = RECEPTION_SITE），MxDict 渲染
                feedback: index % 3 === 0 ? '非常满意' : '满意',
                cancelReason: '--',
            };
        case 'visitPlan':
            return {
                enterpriseName: company,
                starLevel: STAR_LEVELS[index % STAR_LEVELS.length],
                visitPurpose: index % 2 === 0 ? '商务洽谈' : '发货对接',
                planVisitTime: buildDate(index),
                visitor: person,
                customerContact: person,
                visitRequire: '提前一天确认行程',
                actualVisitTime: buildDate(index + 1),
                visitFeedback: '已按计划完成拜访',
                cancelReason: '--',
            };
        case 'customerCare':
            return {
                enterpriseName: company,
                customerName: company,
                starLevel: STAR_LEVELS[index % STAR_LEVELS.length],
                careType: `CARE_TYPE_0${(index % 3) + 1}`,              // 关怀类型字典编码
                careMethod: `EXECUTION_METHOD_0${(index % 3) + 1}`,     // 执行方式字典编码（列表列 key 为 careMethod）
                executionMethod: `EXECUTION_METHOD_0${(index % 3) + 1}`,
                planCareTime: buildDate(index),
                executor: person,
                actualCareTime: buildDate(index + 1),
                customerFeedback: '客户表示满意',
                cancelReason: '--',
            };
        case 'salesContract':
            return {
                contractCode: buildCode(module, index),
                constractNumber: buildCode(module, index),
                demandUnit: company,
                supplierUnit: index % 2 === 0 ? '四川火石子贸易有限公司' : '马边灏阳',
                status: '执行中',
                signStartDate: buildDate(index).slice(0, 10),
                signEndDate: `2026-12-${String((index % 28) + 1).padStart(2, '0')}`,
                businessPerson: person,
                contractQuantity: 30000 - index * 1200,
                contractAmount: Number((2259.75 - index * 120).toFixed(2)),
            };
        case 'frameworkContract':
            return {
                contractCode: buildCode(module, index),
                enterpriseName: company,
                oreType: ORE_TYPES[index % ORE_TYPES.length],
                oreGrade: ORE_GRADES[index % ORE_GRADES.length],
                annualAgreedQuantity: 30 + index * 5,
                executedQuantity: Number((rand * 20).toFixed(2)),
                remainingQuantity: Number((rand * 10 + 5).toFixed(2)),
                priceMechanism: '月度基准价+品位调整',
                contractDeadline: '2026-01-01 至 2026-12-31',
            };
        case 'settlement':
            return {
                settlementCode: buildCode(module, index),
                contractCode: buildCode('salesContract', index),
                enterpriseName: company,
                applyUnit: company,
                settleTotal: Number((rand * 8000000 + 500000).toFixed(2)),
                settleTime: buildDate(index),
                ourHandler: person,
                customerHandler: person,
            };
        case 'payment':
            return {
                receiptCode: buildCode(module, index),
                enterpriseName: company,
                follower: person,
                contractCode: buildCode('salesContract', index),
                receivableAmount: Number((rand * 5000000 + 800000).toFixed(2)),
                receivedAmount: Number((rand * 3000000 + 200000).toFixed(2)),
                unreceivedAmount: Number((rand * 1500000 + 100000).toFixed(2)),
                planReceiptDate: buildDate(index).slice(0, 10),
                actualReceiptDate: buildDate(index + 2).slice(0, 10),
                urgeCount: index % 5,
                lastUrgeTime: buildDate(index),
            };
        case 'funds':
            return {
                customerName: company,
                fundType: 'FUND_TYPE_01',   // 资金类型编码，页面通过 FUND_TYPE_LABEL_MAP 渲染为"预付款"
                subItemAmount: 782 - index * 16,
                contractQuantity: Number((1.065726 - index * 0.05).toFixed(6)),
                shippedQuantity: Number((0.9 - index * 0.04).toFixed(6)),
                deliveryQuantity: Number((0.85 - index * 0.04).toFixed(6)),
                settleWeight: Number((0.8 - index * 0.03).toFixed(6)),
                receivedAmount: Number((833.3977 - index * 40).toFixed(4)),
                amountReceived: Number((700 - index * 30).toFixed(2)),
                unSettleWeight: Number((rand * 0.2 + 0.05).toFixed(6)),
                unReceivedAmount: Number((rand * 100 + 20).toFixed(2)),
                amountUnpaid: Number((rand * 80 + 10).toFixed(2)),
                prepaymentAmount: Number((rand * 50 + 5).toFixed(2)),
            };
        case 'monthlyPlan':
            return {
                monthlyCode: buildCode(module, index),
                monthlyMonth: `2026-${String(((index % 9) + 2)).padStart(2, '0')}`,
                applicantName: person,
                companyName: ['云图嘉施利', '施可丰', '明熙矿业', '马边灏阳'].slice(0, (index % 4) + 1).join('、'),
                summaryByGrade: `品味22:${125000 - index * 5000}吨; 品味24:${60000 - index * 3000}吨`,
                aiReportCode: `AIAY20261020${String(index + 1).padStart(4, '0')}`,
            };
        case 'dailyShipping':
            return {
                deliveryOrderCode: buildCode(module, index),
                salesContractCode: buildCode('salesContract', index),
                planType: index % 2 === 0 ? '火运' : '汽运',
                priority: index % 2 === 0 ? '高' : '普通',
                mineralType: ORE_TYPES[index % ORE_TYPES.length],
                grade: ORE_GRADES[index % ORE_GRADES.length],
                contractNum: 50000 - index * 2500,
                actualQuantity: 32000 - index * 1600,
                shipmentThreshold: 0.8,
                unshippedNum: 18000 - index * 900,
                preDeliveryQuantity: 8000 - index * 400,
                deliveryQuantity: 10000 - index * 500,
                unSettledQuantity: 4000 - index * 200,
                settledQuantity: 6000 - index * 300,
            };
        case 'pricing':
            return {
                pricingCode: buildCode(module, index),
                pricingMonth: `2026-${String((index % 12) + 1).padStart(2, '0')}`,
                enterpriseName: company,
                applicant: person,
                matterNote: '--',
                benchmarkPrice: Number((rand * 200 + 600).toFixed(2)),
            };
        case 'aiPrediction':
            return {
                reportCode: buildCode(module, index),
                reportName: `价格预测202610${String((index % 9) + 10)}报告0${(index % 9) + 1}`,
                predictionType: index % 2 === 0 ? '月度预测' : '季度预测',
                source: '扣子',
                genStatus: index % 3 === 0 ? '成功' : index % 3 === 1 ? '失败' : '生成中',
            };
        case 'starIndicator':
            return {
                indicatorCode: buildCode(module, index),
                indicatorName: ['合作年限', '发货总量', '回款率', '合同履约率', '客户满意度'][index % 5],
                validPeriod: '永久',
                dataSource: 'CRM、合同台账',
                standardNote: '首次合作日期至当前时间的连续年数（中断后再合作按最近一段计）',
            };
        case 'evaluation':
            return {
                enterpriseName: company,
                customerName: company,
                evaluationScore: Number((rand * 40 + 55).toFixed(1)),   // 综合评估得分（真实系统示例：72.7）
                evaluationLevelName: ['核心', '重点', '普通'][index % 3],
                serviceRuleTimes: (index % 12) + 1,
                evaluationTime: buildDate(index).slice(0, 10),
                evaluationDetailList: [
                    { indicatorName: '合作年限', calcScore: Number((rand * 15 + 5).toFixed(1)) },
                    { indicatorName: '发货总量', calcScore: Number((rand * 20 + 10).toFixed(1)) },
                    { indicatorName: '回款率', calcScore: Number((rand * 15 + 10).toFixed(1)) },
                ],
            };
        default:
            return { enterpriseName: company, customerName: company };
    }
}

/**
 * 根据字段名生成一个合理的展示值。
 * @param key 字段名
 * @param index 行序号
 * @returns 模拟值
 */
function buildValue(key: string, index: number): any {
    // 常见编号类字段
    if (key === 'customerCode') return `KH20261019${String(index + 1).padStart(4, '0')}`;
    if (key === 'contractCode' || key === 'constractNumber') return `JY-HSZ-2026${String(index + 1).padStart(3, '0')}`;
    if (key === 'receiptCode') return `HK20261019${String(index + 1).padStart(4, '0')}`;
    if (key === 'settlementCode') return `JS20261019${String(index + 1).padStart(4, '0')}`;
    if (key === 'code') return `CODE${String(index + 1).padStart(3, '0')}`;

    // 数组类字段，避免页面渲染时 .map 报错
    if (PERSON_LIST_FIELDS.has(key) || /List$/.test(key)) {
        return [
            { code: `U00${(index % 5) + 1}`, username: PERSON_NAMES[index % PERSON_NAMES.length], name: PERSON_NAMES[index % PERSON_NAMES.length], label: PERSON_NAMES[index % PERSON_NAMES.length] },
            { code: `U00${((index + 1) % 5) + 1}`, username: PERSON_NAMES[(index + 1) % PERSON_NAMES.length], name: PERSON_NAMES[(index + 1) % PERSON_NAMES.length], label: PERSON_NAMES[(index + 1) % PERSON_NAMES.length] },
        ];
    }
    if (STRING_LIST_FIELDS.has(key)) {
        return [PERSON_NAMES[index % PERSON_NAMES.length], PERSON_NAMES[(index + 1) % PERSON_NAMES.length]];
    }
    if (OBJECT_LIST_FIELDS.has(key)) {
        return [{ name: '演示数据', value: 1, username: PERSON_NAMES[index % PERSON_NAMES.length] }];
    }

    // 名称类字段
    if (/Name$/.test(key) || key === 'name') {
        if (/customer|enterprise|company|supplier|buyer|seller|unit|dept|org/i.test(key)) {
            return REAL_COMPANIES[index % REAL_COMPANIES.length];
        }
        return PERSON_NAMES[index % PERSON_NAMES.length];
    }
    if (/Code$/.test(key) || /No$/.test(key)) return `NO${String(index + 1).padStart(4, '0')}`;

    // 字典类字段，返回值与 Mock 字典保持一致
    if (key === 'region') return REGIONS[index % REGIONS.length];
    if (key === 'coreProduct') return `磷矿石（品位${ORE_GRADES[index % ORE_GRADES.length]}）`;
    if (key === 'supplierUnit') return '四川火石子贸易有限公司';
    if (key === 'careType') return index % 2 === 0 ? '节日关怀' : '发货关怀';
    if (key === 'careMethod' || key === 'executionMethod') return index % 2 === 0 ? '电话回访' : '上门走访';
    if (key === 'receptionLocation') return index % 2 === 0 ? '我方会议室' : '客户办公区';
    if (key === 'visitPurpose') return index % 2 === 0 ? '商务洽谈' : '发货对接';
    if (key === 'starLevel') return STAR_LEVELS[index % STAR_LEVELS.length];
    if (/oreType|goodsType/.test(key)) return ORE_TYPES[index % ORE_TYPES.length];
    if (/oreG?rade|grade/.test(key)) return ORE_GRADES[index % ORE_GRADES.length];

    // 状态类字段
    if (/status/i.test(key)) return 'ARCHIVED';
    if (/type$/i.test(key) && /customer/i.test(key)) return CUSTOMER_TYPES[index % CUSTOMER_TYPES.length];

    // 布尔类字段
    if (/^(is|has)[A-Z]/.test(key)) return true;

    // 月份类字段（如 pricingMonth、monthlyMonth），返回合法月份供 dayjs 解析
    if (MONTH_FIELD_REG.test(key)) return `2026-${String((index % 12) + 1).padStart(2, '0')}`;

    // 日期类字段
    if (DATE_FIELD_REG.test(key)) return buildDate(index);

    // 数值类字段
    if (NUMBER_FIELD_REG.test(key)) return 1200 + index * 137;

    // 常见文本类字段
    if (/address|location|place/i.test(key)) return '四川省乐山市马边彝族自治县';
    if (/phone|mobile|tel/i.test(key)) return '13881254926';
    if (/email|mail/i.test(key)) return 'demo@example.com';
    if (/position|job/i.test(key)) return '采购经理';
    if (/remark|reason|feedback|content|description|requirement|summary|opinion/i.test(key)) {
        return '客户对当前合作表示满意，希望保持稳定供应';
    }

    return '演示数据';
}

/**
 * 构造一行模拟数据：领域字段覆盖 + 全字段兜底。
 * @param index 行序号
 * @param module 业务模块标识
 * @returns 模拟数据行
 */
function buildRow(index: number, module = 'default'): Record<string, any> {
    const row: Record<string, any> = {
        id: index + 1,
        createdAt: buildDate(index),
        createTime: buildDate(index),
        updatedAt: buildDate(index),
        updateTime: buildDate(index),
    };
    // 先填充领域字段（真实业务口径），再用通用兜底补齐其余字段
    Object.assign(row, buildDomainFields(module, index));
    const statusConfig = MODULE_STATUS[module] || MODULE_STATUS.default;
    FIELD_KEYS.forEach((key) => {
        if (!(key in row)) {
            row[key] = buildValue(key, index);
        }
    });
    row.status = statusConfig.status;
    row.statusName = statusConfig.statusName;
    return row;
}

/**
 * 从模块存储中生成分页数据（支持查询过滤）。
 * @param module 业务模块标识
 * @param size 每页条数
 * @param current 当前页
 * @param body 请求体（含查询条件）
 * @returns 分页响应体
 */
function buildPage(module: string, size: number, current: number, body: any = {}) {
    const rows = applyFilters(getModuleStore(module), body);
    const pageSize = Number(size) > 0 ? Math.min(Number(size), 50) : 10;
    const total = rows.length;
    const startIndex = (Math.max(Number(current), 1) - 1) * pageSize;
    return {
        records: rows.slice(startIndex, startIndex + pageSize),
        total,
        current: Math.max(Number(current), 1),
        size: pageSize,
    };
}

/** 状态流转动作到状态值的映射（与真实系统状态词一致） */
const STATUS_BY_ACTION: Array<{ pattern: RegExp; status: string; statusName: string }> = [
    { pattern: /archive/i, status: 'ARCHIVED', statusName: '已归档' },
    { pattern: /cancel/i, status: 'CANCELLED', statusName: '已取消' },
    { pattern: /submit|approval/i, status: 'SUBMITTED', statusName: '已提交' },
    { pattern: /approve|audit/i, status: 'APPROVED', statusName: '已通过' },
    { pattern: /terminate/i, status: 'TERMINATED', statusName: '已终止' },
    { pattern: /finish|complete/i, status: 'FINISHED', statusName: '已完成' },
];

/**
 * 从 URL 路径尾段提取记录 id（如 /customerBase/delete/123）。
 * @param url 接口地址
 * @returns 记录 id，无则返回 null
 */
function extractPathId(url: string): number | null {
    const match = url.split('?')[0].match(/\/(\d+)\s*$/);
    return match ? Number(match[1]) : null;
}

/**
 * 处理写操作（新增/编辑/删除/状态流转），以增量方式记录并持久化，刷新页面不丢。
 * @param url 接口地址
 * @param body 请求体
 * @param module 模块标识
 * @returns 操作结果
 */
function applyMutation(url: string, body: any, module: string): any {
    const overlay = getOverlayEntry(module);
    const action = (url.split('?')[0].split('/').pop() || '').toLowerCase();
    const pathId = extractPathId(url);

    // 新增：表单数据合并到带默认值的行，进入增量 added 列表，编号按真实格式递增
    if (/^(create|save|add)$/.test(action)) {
        const currentRows = getModuleStore(module);
        const seed = buildRow((currentRows.length + 1) % 20, module);
        const row: any = { ...seed, ...body, id: nextId++ };
        const codeFields = ['customerCode', 'contractCode', 'constractNumber', 'monthlyCode', 'deliveryOrderCode', 'pricingCode', 'reportCode', 'receiptCode', 'settlementCode'];
        const newCode = buildCode(module, currentRows.length);
        codeFields.forEach((key) => {
            if (key in row && !body[key]) row[key] = newCode;
        });
        row.createdAt = row.createTime = row.updatedAt = row.updateTime = buildDate(0);
        overlay.added.unshift(row);
        persistOverlay();
        return { code: 200, msg: '操作成功', success: true, data: row.id };
    }

    // 编辑：增量记录修改补丁（对新增的行直接合并）
    if (/^(update|edit|modify)$/.test(action)) {
        const id = Number(body.id ?? pathId);
        const addedRow = overlay.added.find((row) => row.id === id);
        if (addedRow) {
            Object.assign(addedRow, body, { updatedAt: buildDate(0), updateTime: buildDate(0) });
        } else if (id) {
            overlay.updated[id] = { ...(overlay.updated[id] || {}), ...body, updatedAt: buildDate(0), updateTime: buildDate(0) };
        }
        persistOverlay();
        return { code: 200, msg: '操作成功', success: true, data: true };
    }

    // 删除：支持路径 id、body.id、body.ids 数组
    if (/delete|remove/.test(action)) {
        const ids: number[] = (Array.isArray(body) ? body : body.ids || [body.id ?? pathId])
            .filter((id) => id !== null && id !== undefined)
            .map(Number);
        overlay.added = overlay.added.filter((row) => !ids.includes(row.id));
        overlay.deleted.push(...ids);
        persistOverlay();
        return { code: 200, msg: '操作成功', success: true, data: true };
    }

    // 调整星级
    if (/adjuststarlevel/.test(action)) {
        const id = Number(body.id ?? pathId);
        if (body.starLevel) {
            const addedRow = overlay.added.find((row) => row.id === id);
            if (addedRow) addedRow.starLevel = body.starLevel;
            else if (id) overlay.updated[id] = { ...(overlay.updated[id] || {}), starLevel: body.starLevel };
        }
        persistOverlay();
        return { code: 200, msg: '操作成功', success: true, data: true };
    }

    // 状态流转：归档/取消/提交/审核/终止/完成
    const statusRule = STATUS_BY_ACTION.find(({ pattern }) => pattern.test(url));
    if (statusRule) {
        const ids: number[] = (body.ids || [body.id ?? pathId]).filter((id) => id !== null && id !== undefined).map(Number);
        ids.forEach((id) => {
            const patch: any = { status: statusRule.status, statusName: statusRule.statusName };
            if (body.cancelReason) patch.cancelReason = body.cancelReason;
            const addedRow = overlay.added.find((row) => row.id === id);
            if (addedRow) Object.assign(addedRow, patch);
            else overlay.updated[id] = { ...(overlay.updated[id] || {}), ...patch };
        });
        persistOverlay();
    }
    return { code: 200, msg: '操作成功', success: true, data: true };
}

/**
 * 解析请求体。
 * @param data 请求数据
 * @returns 解析后的对象
 */
function parseBody(data: any): any {
    if (!data) return {};
    if (typeof data === 'string') {
        try {
            return JSON.parse(data);
        } catch {
            return {};
        }
    }
    return data;
}

/**
 * 构造字典数据，字段值与 buildValue 中的字典值保持一致。
 * @param parentCodes 字典编码列表
 * @returns 字典映射
 */
function buildDictMap(parentCodes: string[]) {
    const dict: Record<string, any[]> = {};
    (parentCodes || []).forEach((code) => {
        const label = CODE_NAME_MAP[code] || '示例';
        dict[code] = [1, 2, 3].map((index) => ({
            code: `${code}_0${index}`,
            name: `${label}示例${index}`,
        }));
    });
    return dict;
}

/** 数据看板模拟数据（数值与真实系统一致） */
const dashboardData = dashboardMock();

/**
 * 客户发货量、订单等看板数据结构转换。
 * @returns 看板各接口返回体
 */
function getDashboardPayload(url: string): any {
    if (/dataBoard\/coreData/i.test(url)) return dashboardData.coreData;
    if (/dataBoard\/paymentData/i.test(url)) return dashboardData.paymenyData;
    if (/dataBoard\/bannerList/i.test(url)) return dashboardData.bannerList;
    if (/getShipmentOrderStatList/i.test(url)) return dashboardData.monthsOrders;
    if (/getCustomerShipmentTop10/i.test(url)) return dashboardData.shipmentData;
    if (/countBarChartOfAllInventoryV101/i.test(url)) {
        return {
            num: 7.66,
            highNum: 4.2,
            lowNum: 3.46,
            mixedOreNum: 1.2,
            transferNums: 18,
            warehouseInventorys: [
                {
                    inventoryName: '马边矿区堆场',
                    inventoryCode: 'WAREHOUSE_01',
                    sort: 1,
                    num: 4.6,
                    yardList: [
                        { yardName: 'A 堆场', num: 2.6, goodsList: [{ goodsName: '低品位磷矿', num: 2.6 }] },
                        { yardName: 'B 堆场', num: 2.0, goodsList: [{ goodsName: '中品位磷矿', num: 2.0 }] },
                    ],
                },
                {
                    inventoryName: '宜宾转运码头',
                    inventoryCode: 'WAREHOUSE_02',
                    sort: 2,
                    num: 3.06,
                    yardList: [{ yardName: 'C 堆场', num: 3.06, goodsList: [{ goodsName: '高品位磷矿', num: 3.06 }] }],
                },
            ],
            internalTransferInventorys: [
                { licensePlate: '川L12345', originYard: '马边矿区堆场', destinationYard: '宜宾转运码头', goods: '中品位磷矿', netWeight: 300 },
            ],
            transferInventorys: [
                { licensePlate: '川L67890', salesSubject: '云图嘉施利', originYard: '宜宾转运码头', destinationYard: '客户码头', goods: '高品位磷矿', netWeight: 500 },
            ],
        };
    }
    return null;
}

/**
 * 人员/部门类接口的模拟返回。
 * @param url 接口地址
 * @returns 模拟数据；未命中返回 null
 */
function getUserPayload(url: string): any {
    const users = PERSON_NAMES.map((name, index) => ({
        code: `U00${index + 1}`,
        username: name,
        name,
        label: name,
        deptName: '销售部',
        status: 'WORKING',
        phone: '13881254926',
    }));
    if (/dept-user-tree|dept\/tree/i.test(url)) {
        return [
            {
                code: 'D001',
                name: '销售部',
                label: '销售部',
                children: users.slice(0, 4).map((user) => ({ ...user, children: [] })),
            },
            {
                code: 'D002',
                name: '市场部',
                label: '市场部',
                children: users.slice(4).map((user) => ({ ...user, children: [] })),
            },
        ];
    }
    if (/user\/list|simple-user-page/i.test(url)) return users;
    return null;
}

/**
 * 根据请求信息生成模拟响应体。
 * @param config axios 请求配置
 * @returns 业务响应数据
 */
function resolvePayload(config: any): any {
    const url = (config.url || '').split('?')[0];
    const method = (config.method || 'get').toLowerCase();
    const body = parseBody(config.data);

    // 1. 数据看板
    const dashboardPayload = getDashboardPayload(url);
    if (dashboardPayload !== null) return { code: 200, msg: 'success', success: true, data: dashboardPayload };

    // 2. 字典
    if (/dict\/map/i.test(url)) {
        return { code: 200, msg: 'success', success: true, data: buildDictMap(body.parentCodes || []) };
    }

    // 3. 登录/用户信息（保留兼容，不参与登录校验）
    if (/auth\/get-auth-info|auth\/get-token/i.test(url)) {
        return {
            code: 200,
            msg: 'success',
            success: true,
            data: {
                user: { code: 'U001', username: '景锐', larkUserId: 'demo-lark-user', avatar: '', userDeptList: [{ code: 'D001', name: '销售部' }] },
                operPerms: ['*:*:*'],
                menuTree: [],
                fullMenuTree: [],
            },
        };
    }

    // 4. 人员、部门
    const userPayload = getUserPayload(url);
    if (userPayload !== null) return { code: 200, msg: 'success', success: true, data: userPayload };

    // 5. 消息通知模块/节点下拉
    if (/\/modules$|\/nodes\//i.test(url)) {
        return {
            code: 200,
            msg: 'success',
            success: true,
            data: [
                { code: 'MODULE_01', moduleCode: 'MODULE_01', name: '回款提醒' },
                { code: 'MODULE_02', moduleCode: 'MODULE_02', name: '合同到期' },
                { code: 'MODULE_03', moduleCode: 'MODULE_03', name: '客户关怀' },
            ],
        };
    }

    // 6. 埋点、上传等无需业务的接口
    if (/goSystem/i.test(url)) return { code: 200, msg: 'success', success: true, data: true };
    if (/oss\/upload|upload/i.test(url)) {
        return { code: 200, msg: 'success', success: true, data: { url: 'https://dummyimage.com/600x400/2c65f2/ffffff&text=DEMO', name: 'demo.png' } };
    }

    // 7. 写操作：新增/编辑/删除/状态流转，真实修改存储
    if (/create|update|save|submit|adjust|push|archive|cancel|approve|audit|terminate|finish|delete|remove|batchFinish|sendMessage|serviceRule|export/i.test(url)) {
        return applyMutation(url, body, detectModule(url));
    }

    const module = detectModule(url);
    const current = Number(body.current || config.params?.current || 1);
    const size = Number(body.size || config.params?.size || 10);

    // 8. 分页列表
    if (/\/page$|\/pageList$|page$/i.test(url)) {
        return { code: 200, msg: 'success', success: true, data: buildPage(module, size, current, body) };
    }

    // 9. 列表数据（含 listCustomerCapital 这类以 list 开头、但返回分页结构的接口）
    if (/listCustomerCapital/i.test(url)) {
        return { code: 200, msg: 'success', success: true, data: buildPage(module, size, current, body) };
    }
    if (/\/list|list$|List$/.test(url)) {
        return { code: 200, msg: 'success', success: true, data: getModuleStore(module).slice(0, 20) };
    }

    // 10. 树形数据
    if (/\/tree$|tree$/i.test(url)) {
        return { code: 200, msg: 'success', success: true, data: getModuleStore(module).slice(0, 2) };
    }

    // 11. 详情数据：优先按路径 id 从存储中读取（编辑表单回显）
    if (/\/get\/|\/detail\/|detail$|\/info$|\/get$/i.test(url)) {
        const pathId = extractPathId(url);
        const stored = pathId !== null ? getModuleStore(module).find((row) => row.id === pathId) : null;
        return { code: 200, msg: 'success', success: true, data: stored || buildRow(0, module) };
    }

    // 12. 统计类数据
    if (/count|statistic|summary|chart|report/i.test(url)) {
        return {
            code: 200,
            msg: 'success',
            success: true,
            data: {
                total: 128,
                amount: 12600,
                xAxisData: ['1月', '2月', '3月', '4月', '5月', '6月'],
                seriesData: [{ name: '数量', data: [12, 18, 15, 22, 28, 30] }],
                records: Array.from({ length: 6 }, (_, i) => buildRow(i, module)),
            },
        };
    }

    // 13. 其余 GET 请求返回空对象，写请求返回成功
    return { code: 200, msg: 'success', success: true, data: method === 'get' ? {} : true };
}

/**
 * 安装 Mock 适配器。
 * @param service axios 实例
 */
export function installMockAdapter(service: any): void {
    service.defaults.adapter = (config: any) => {
        const payload = resolvePayload(config);
        const response = {
            data: payload,
            status: 200,
            statusText: 'OK',
            headers: { 'content-type': 'application/json' },
            config,
            request: {},
        };
        if (config.responseType === 'blob') {
            response.data = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        }
        return Promise.resolve(response);
    };
    console.info('[mock] 已启用前端模拟数据（开发环境、无 token），数据口径仿照真实 CRM');
}

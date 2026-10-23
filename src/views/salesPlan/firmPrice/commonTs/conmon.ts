import dayjs from 'dayjs';

// 单据状态: DRAFT-草稿, REVIEWING-审核中, APPROVED-已审核, REJECTED-已驳回, CANCELLED-已取消
export const statusConfig = [
    { label: '草稿', value: 'DRAFT',listColor: '#FCBD12', color: '#E59222', backgroudColor: '#FFF1D9',bdColor:'#FFE49A' },
    { label: '审核中', value: 'REVIEWING', listColor: '#0192FF', color: '#3370EB', backgroudColor: '#EFF4FF' ,bdColor:'#D9E3F5' },
    { label: '撤销中', value: 'CANCELING', listColor: '#FCBD12', color: '#E59222', backgroudColor: '#FFF1D9', bdColor: '#FFE49A' },
    { label: '审批生成中', value: 'APPROVAL_GENERATING', listColor: '#0192FF', color: '#3370EB', backgroudColor: '#EFF4FF',bdColor:'#D9E3F5'  },
    { label: '审批生成失败', value: 'APPROVAL_GEN_FAILED', listColor: '#C94837', color: '#C94837', backgroudColor: '#F8E5E2',bdColor:'#FFD2CC'  },
    { label: '已审核', value: 'APPROVED', listColor: '#18D851', color: '#5AA771', backgroudColor: '#F0F9EB',bdColor:'#E2F4D8'  },
    { label: '已驳回', value: 'REJECTED', listColor: '#C94837', color: '#C94837', backgroudColor: '#F8E5E2',bdColor:'#FFD2CC'  },
    { label: '已作废', value: 'CANCELLED', listColor: '#C4C4C4', color: '#999999', backgroudColor: '#F0F0F0',bdColor:'#DDDFE6'  },
];

// 表格按钮颜色
export const TABLE_ACTION_COLOR = 'var(--base-color)';

export const TABLE_DANGER_COLOR = 'var(--base-color-red)';

// 客户类型: CHEMICAL-化工企业, TRADER-贸易商
export const CUSTOMER_TYPE_CHEMICAL = 'CHEMICAL';

// 审批状态: 保存为草稿
export const PRICING_STATUS_DRAFT = 'DRAFT';

// 审批状态: 提交后审核中
export const PRICING_STATUS_REVIEWING = 'REVIEWING';

// 审批状态: 撤销中
export const PRICING_STATUS_CANCELING = 'CANCELING';

// 审批状态: 已作废
export const PRICING_STATUS_CANCELLED = 'CANCELLED';

// 审批状态: 审批生成中
export const PRICING_STATUS_APPROVAL_GENERATING = 'APPROVAL_GENERATING';

// 审批状态: 审批生成失败
export const PRICING_STATUS_APPROVAL_GEN_FAILED = 'APPROVAL_GEN_FAILED';

// 锚点 tab 配置
export const FIRM_PRICE_ANCHOR_LIST = [
    { id: 'basicInfo', name: '基础信息' },
    { id: 'logisticsFee', name: '物流运输费用' },
    { id: 'marketRefPrice', name: '市场价(参考价)' },
    { id: 'planPrice', name: '计划量以及价格' },
    { id: 'approvalInfo', name: '审批信息' },
];

// 附件支持类型
export const ATTACHMENT_ACCEPT = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.xls', '.xlsx'];

// 物流运输费用只允许上传图片
export const LOGISTICS_ATTACHMENT_ACCEPT = ['.jpg', '.jpeg', '.png', '.webp'];

export const FIRM_PRICE_ATTACHMENT_LIMIT = 9;

export const FIRM_PRICE_ATTACHMENT_SIZE = '50M';

export const SECOND_QUOTE_APPROVAL_OPTIONS = [
    { label: '是', value: '是' },
    { label: '否', value: '否' },
];

// 化工企业专属扩展信息
export interface ExtChemicalDTO {
    id?: number | string; // 主键ID
    pricingId?: number | string; // 关联主表ID
    productScale: string; // 企业主要产品规模
    inventoryStatus: string; // 库存情况
    operatingRate: number | null; // 开工率(%)
    annualPurchaseVolume: string; // 年矿石采购量
    planPurchaseVolume: string; // 计划采购量
    paymentTerms: string; // 支付情况
    importantContractTerms: string; // 重要合同条件
    otherInfo: string; // 其它补充信息
    financialCost: string; // 财务费用
    pricingCode?: string; // 基准定价单号
}

// 物流运输费用
export interface LogisticsDTO {
    id?: number | string; // 主键ID
    pricingId?: number | string; // 关联主表ID
    customerType: string; // 客户类型
    routeInfo: string; // 路线描述
    freightFee: number | null; // 运费
    loadingUnloadingFee: number | null; // 装卸费
    transferFee: number | null; // 翻坝费
    terminalFee: number | null; // 码头费
    totalFee: number | null; // 合计费用
    remark: string; // 备注
    pricingCode?: string; // 基准定价单号
}

// 市场参考价
export interface RefDTO {
    id?: number | string; // 主键ID
    pricingId?: number | string; // 关联主表ID
    customerType: string; // 客户类型
    refCompanyName: string; // 参考企业名称
    grade: number | null; // 品位/规格
    deliveryLocation: string; // 交货地点
    deliveryLocationName?: string; // 交货地点名称
    currentPrice: number | null; // 当前采购价
    remark: string; // 备注
    attachmentUrls: any[]; // 附件
    pricingCode?: string; // 基准定价单号
}

// 计划量以及价格
export interface ItemDTO {
    id?: number | string; // 主键ID
    pricingId?: number | string; // 关联主表ID
    customerType: string; // 客户类型
    grade: number | null; // 矿石品位(%)
    planWeight: number | null; // 计划重量(吨)
    deliveryAddress: string; // 交货地址
    deliveryLocationName?: string; // 交货地址名称
    taxIncludedPrice: number | null; // 含税单价
    pitPrice: number | null; // 坑口价
    lineTotal?: number | null; // 行总金额
    pricingCode?: string; // 基准定价单号
}

// 化工企业基准定价表单
export interface FirmPriceFormData {
    id?: number | string; // 主键ID
    pricingCode?: string; // 基准定价单号
    pricingMonth: number | null; // 定价月份
    status: string; // 单据状态
    customerType: string; // 客户类型
    customerId: number | string | null; // 企业ID
    customerCode: string; // 企业编码
    customerName: string; // 企业名称
    subsidiaryId: number | string | null; // 子公司贸易商ID
    subsidiaryName: string; // 子公司贸易商名称
    projectName: string; // 项目名称
    attendees: any[]; // 与会人员
    totalAmount: number | null; // 预估总金额
    extChemicalDTO: ExtChemicalDTO; // 化工企业扩展信息
    logistics: any[]; // 物流运输费用附件
    logisticsDTOList: LogisticsDTO[]; // 物流运输费用列表
    refDTOList: RefDTO[]; // 市场参考价列表
    itemDTOList: ItemDTO[]; // 计划量以及价格列表
    applicantId: number | string; // 申请人ID
    applicantName: string; // 申请人名称
    larkUserId: string; // 申请人飞书ID
    applyDeptId: number | string; // 申请部门ID
    applyDeptName: string; // 申请部门名称
    companyId: number | string; // 所属公司ID
    companyName: string; // 所属公司名称
    isTwoApprove: string; // 是否二次审批
    instruction: string; // 事项说明
    attachmentUrls: any[]; // 附件
    associatedApproval: any[]; // 关联审批
    approvalDTO?: Record<string, any>; // 编辑时保留审批主表字段
}

/**
 * 创建化工企业扩展信息默认值
 */
export const createExtChemicalDTO = (): ExtChemicalDTO => ({
    productScale: '',
    inventoryStatus: '',
    operatingRate: 0,
    annualPurchaseVolume: '',
    planPurchaseVolume: '',
    paymentTerms: '',
    importantContractTerms: '',
    otherInfo: '',
    financialCost: '',
});

/**
 * 创建物流运输费用默认行
 */
export const createLogisticsDTOItem = (): LogisticsDTO => ({
    customerType: CUSTOMER_TYPE_CHEMICAL,
    routeInfo: '',
    freightFee: 0,
    loadingUnloadingFee: 0,
    transferFee: 0,
    terminalFee: 0,
    totalFee: 0,
    remark: '',
});

/**
 * 创建市场参考价默认行
 */
export const createRefDTOItem = (): RefDTO => ({
    customerType: CUSTOMER_TYPE_CHEMICAL,
    refCompanyName: '',
    grade: null,
    deliveryLocation: '',
    currentPrice: null,
    remark: '',
    attachmentUrls: [],
});

/**
 * 创建计划量以及价格默认行
 */
export const createItemDTOItem = (): ItemDTO => ({
    customerType: CUSTOMER_TYPE_CHEMICAL,
    grade: null,
    planWeight: null,
    deliveryAddress: '',
    taxIncludedPrice: null,
    pitPrice: null,
});

/**
 * 创建化工企业基准定价默认表单
 */
export const createFirmPriceFormData = (): FirmPriceFormData => ({
    pricingMonth: dayjs().add(1, 'month').valueOf(),
    status: PRICING_STATUS_DRAFT,
    customerType: CUSTOMER_TYPE_CHEMICAL,
    customerId: null,
    customerCode: '',
    customerName: '',
    subsidiaryId: null,
    subsidiaryName: '',
    projectName: '',
    attendees: [],
    totalAmount: 0,
    extChemicalDTO: createExtChemicalDTO(),
    logistics: [],
    logisticsDTOList: [createLogisticsDTOItem()],
    refDTOList: [createRefDTOItem()],
    itemDTOList: [createItemDTOItem()],
    applicantId: '',
    applicantName: '',
    larkUserId: '',
    applyDeptId: '',
    applyDeptName: '',
    companyId: '',
    companyName: '',
    isTwoApprove: '否',
    instruction: '',
    attachmentUrls: [],
    associatedApproval: [],
});

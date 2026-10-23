import dayjs from 'dayjs';

// 贸易商客户类型，提交基准定价接口时用于区分化工企业/贸易商。
export const CUSTOMER_TYPE_TRADER = 'TRADER';

// 单据状态：保存为草稿。
export const PRICING_STATUS_DRAFT = 'DRAFT';

// 单据状态：提交后进入审核中。
export const PRICING_STATUS_REVIEWING = 'REVIEWING';

// 单据状态：撤销中。
export const PRICING_STATUS_CANCELING = 'CANCELING';

// 单据状态：已作废。
export const PRICING_STATUS_CANCELLED = 'CANCELLED';

// 单据状态：审批生成中。
export const PRICING_STATUS_APPROVAL_GENERATING = 'APPROVAL_GENERATING';

// 单据状态：审批生成失败。
export const PRICING_STATUS_APPROVAL_GEN_FAILED = 'APPROVAL_GEN_FAILED';

// 表格普通操作按钮颜色。
export const TABLE_ACTION_COLOR = 'var(--base-color)';

// 表格危险操作按钮颜色。
export const TABLE_DANGER_COLOR = 'var(--base-color-red)';

// 新增/编辑页顶部锚点 tab 配置，id 需要与页面区块 DOM id 保持一致。
export const TRADER_PRICE_ANCHOR_LIST = [
    { id: 'a', name: '基础信息' },
    { id: 'b', name: '物流运输费用' },
    { id: 'c', name: '市场价(参考价)' },
    { id: 'd', name: '贸易商磷矿石销售价' },
    { id: 'e', name: '审批信息' },
];

// 市场参考价附件支持类型，与 PRD 中 PDF/图片/Word/Excel 保持一致。
export const ATTACHMENT_ACCEPT = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.xls', '.xlsx'];

// 物流运输费用只允许上传图片。
export const LOGISTICS_ATTACHMENT_ACCEPT = ['.jpg', '.jpeg', '.png', '.webp'];

// 市场参考价附件上传限制。
export const ATTACHMENT_LIMIT = 9;
export const ATTACHMENT_FILE_SIZE = '50M';

// 物流运输费用单项最大值与合计最大值。合计需要容纳 4 个单项费用相加后的最大值。
export const LOGISTICS_FEE_MAX = 9999999;
export const LOGISTICS_TOTAL_FEE_MAX = LOGISTICS_FEE_MAX * 4;

// 列表和详情页使用的单据状态展示配置。
export const statusConfig = [
    { label: '草稿', value: 'DRAFT', listColor: '#FCBD12', color: '#E59222', backgroudColor: '#FFF1D9',bdColor:'#FFE49A' },
    { label: '审核中', value: 'REVIEWING', listColor: '#0192FF', color: '#3370EB', backgroudColor: '#EFF4FF' ,bdColor:'#D9E3F5'},
    { label: '撤销中', value: PRICING_STATUS_CANCELING, listColor: '#FCBD12', color: '#E59222', backgroudColor: '#FFF1D9', bdColor: '#FFE49A' },
    { label: '审批生成中', value: 'APPROVAL_GENERATING',listColor: '#0192FF', color: '#3370EB', backgroudColor: '#EFF4FF',bdColor:'#D9E3F5'  },
    { label: '审批生成失败', value: 'APPROVAL_GEN_FAILED', listColor: '#C94837', color: '#C94837', backgroudColor: '#F8E5E2',bdColor:'#FFD2CC' },
    { label: '已审核', value: 'APPROVED',  listColor: '#18D851', color: '#5AA771', backgroudColor: '#F0F9EB',bdColor:'#E2F4D8'  },
    { label: '已驳回', value: 'REJECTED', listColor: '#C94837', color: '#C94837', backgroudColor: '#F8E5E2',bdColor:'#FFD2CC' },
    { label: '已作废', value: 'CANCELLED', listColor: '#C4C4C4', color: '#999999', backgroudColor: '#F0F0F0',bdColor:'#DDDFE6'  },
];

// 贸易商定价扩展信息。
export interface ExtTraderDTO {
    // 明细主键 ID，编辑回传时需要保留。
    id?: number | string;
    // 关联基准定价主表 ID，编辑回传时需要保留。
    pricingId?: number | string;
    // 基准定价单号，编辑回传时需要保留。
    pricingCode?: string;
    // 主流化工企业存库情况。
    mainstreamChemInventory: string;
    // 矿山存库情况。
    mineInventory: string;
    // 下游产品市场情况。
    downstreamMarketSituation: string;
    // 竞品矿山让利金额。
    competitorConcessionAmount: string;
    // 财务费用。
    financialCost: string;
    // 备注。
    remark?: string;
}

// 物流运输费用明细。
export interface LogisticsDTO {
    // 明细主键 ID，编辑回传时需要保留。
    id?: number | string;
    // 关联基准定价主表 ID，编辑回传时需要保留。
    pricingId?: number | string;
    // 基准定价单号，编辑回传时需要保留。
    pricingCode?: string;
    // 客户类型，贸易商固定为 TRADER。
    customerType: string;
    // 路线描述。
    routeInfo: string;
    // 运费。
    freightFee: number;
    // 装卸费。
    loadingUnloadingFee: number;
    // 翻坝费。
    transferFee: number;
    // 码头费。
    terminalFee: number;
    // 合计费用，前端按 运费+装卸费+翻坝费+码头费 自动计算。
    totalFee: number;
    // 备注。
    remark?: string;
}

// 市场价（参考价）明细。
export interface RefDTO {
    // 明细主键 ID，编辑回传时需要保留。
    id?: number | string;
    // 关联基准定价主表 ID，编辑回传时需要保留。
    pricingId?: number | string;
    // 基准定价单号，编辑回传时需要保留。
    pricingCode?: string;
    // 化工企业名称。
    refCompanyName: string;
    // 客户类型，贸易商固定为 TRADER。
    customerType: string;
    // 品位。
    grade: number;
    // 交货地址。
    deliveryLocation: string;
    // 交货地址名称。
    deliveryLocationName?: string;
    // 当前采购价。
    currentPrice: number;
    // 备注。
    remark?: string;
    // 附件列表。
    attachmentUrls?: any[];
}

// 贸易商磷矿石销售价明细。
export interface TraderItemDTO {
    // 明细主键 ID，编辑回传时需要保留。
    id?: number | string;
    // 关联基准定价主表 ID，编辑回传时需要保留。
    pricingId?: number | string;
    // 基准定价单号，编辑回传时需要保留。
    pricingCode?: string;
    // 矿石品位。
    grade: number;
    // 交货地址。
    deliveryAddress: string;
    // 交货地址名称。
    deliveryLocationName?: string;
    // 下游厂家指导价。
    guidePrice: number;
    // 运输费用。
    transportFee: number;
    // 市场调节金额。
    marketAdjustment: number;
    // 财务承兑优惠金额。
    financialAcceptanceDiscount: number;
    // 财务现金优惠金额。
    financialCashDiscount: number;
    // 贸易商汇票最低报价。
    traderDraftMinPrice: number;
    // 贸易商现金最低报价。
    traderCashMinPrice: number;
}

// 贸易商基准定价新增/编辑页表单结构。
export interface FormData {
    // 主表 ID，编辑时存在。
    id?: number | string;
    // 基准定价单号，系统生成，编辑回传时保留。
    pricingCode?: string;
    // 单据状态。
    status?: string;
    // 客户类型，贸易商固定为 TRADER。
    customerType: string;
    // 定价月份，页面中使用时间戳，提交时转换为 YYYY-MM。
    pricingMonth: number | null;
    // 项目名称。
    projectName: string;
    // 与会人员，页面组件结构与接口结构不同，提交/回显时会转换。
    attendees: any[];
    // 贸易商扩展信息。
    extTraderDTO: ExtTraderDTO;
    // 物流运输费用附件。
    logistics: any[];
    // 物流运输费用列表。
    logisticsDTOList: LogisticsDTO[];
    // 市场价（参考价）列表。
    refDTOList: RefDTO[];
    // 贸易商磷矿石销售价明细列表。
    traderItemDTOList: TraderItemDTO[];
    // 申请人 ID，审批模块后续联调。
    applicantId: string | number;
    // 申请人名称，审批模块后续联调。
    applicantName: string;
    // 申请人飞书 ID。
    larkUserId: string;
    // 申请部门 ID。
    applyDeptId: string | number;
    // 申请部门名称。
    applyDeptName: string;
    // 事项说明。
    instruction: string;
    // 所属公司 ID，审批模块后续联调。
    companyId: string | number;
    // 所属公司名称。
    companyName: string;
    // 审批备注，审批模块后续联调。
    approvalRemark?: string;
    // 审批附件。
    attachmentUrls: any[];
    // 关联审批。
    associatedApproval: any[];
    // 编辑时保留接口返回的审批主表字段，用于更新时原样带回审批标识。
    approvalDTO?: Record<string, any>;
}

/**
 * 创建物流运输费用默认行。
 */
export const createLogisticsDTOItem = (): LogisticsDTO => {
    return {
        customerType: CUSTOMER_TYPE_TRADER,
        routeInfo: '', // 路线描述
        freightFee: 0, // 运费
        loadingUnloadingFee: 0, // 装卸费
        transferFee: 0, // 翻坝费
        terminalFee: 0, // 码头费
        totalFee: 0, // 合计费用
        remark: '', // 备注
    };
};

/**
 * 创建市场价（参考价）默认行。
 */
export const createRefDTOItem = (): RefDTO => {
    return {
        refCompanyName: '', // 化工企业名称
        customerType: CUSTOMER_TYPE_TRADER, // 客户类型
        grade: 0, // 品位
        deliveryLocation: '', // 交货地址
        currentPrice: 0, // 当前采购价
        remark: '', // 备注
        attachmentUrls: [], // 附件列表
    };
};

/**
 * 创建贸易商磷矿石销售价默认行。
 */
export const createTraderItemDTOItem = (): TraderItemDTO => {
    return {
        grade: 0, // 矿石品位
        deliveryAddress: '', // 交货地址
        guidePrice: 0, // 下游厂家指导价
        transportFee: 0, // 运输费用
        marketAdjustment: 0, // 市场调节金额
        financialAcceptanceDiscount: 0, // 财务承兑优惠金额
        financialCashDiscount: 0, // 财务现金优惠金额
        traderDraftMinPrice: 0, // 贸易商汇票最低报价
        traderCashMinPrice: 0, // 贸易商现金最低报价
    };
};

/**
 * 创建贸易商基准定价默认表单。
 */
export const creatFormData = (): FormData => {
    return {
        customerType: CUSTOMER_TYPE_TRADER, // 客户类型
        status: PRICING_STATUS_DRAFT, // 单据状态
        companyId: '', // 所属公司 ID
        companyName: '', // 所属公司名称
        pricingMonth: dayjs().add(1, 'month').valueOf(), // 定价月份
        projectName: '', // 项目名称
        attendees: [], // 参与人
        extTraderDTO: {
            mainstreamChemInventory: '', // 主流化工企业存库情况
            mineInventory: '', // 矿山存库情况
            downstreamMarketSituation: '', // 下游产品市场情况
            competitorConcessionAmount: '', // 竞品矿山让利金额
            financialCost: '', // 财务费用
            remark: '', // 备注
        },
        logistics: [], // 物流运输费用附件
        logisticsDTOList: [createLogisticsDTOItem()], // 	物流运输费用列表
        refDTOList: [createRefDTOItem()], // 市场参考价列表
        traderItemDTOList: [createTraderItemDTOItem()], //贸易商磷矿石销售价明细列表
        applicantId: '', // 申请人ID
        applicantName: '', // 申请人名称
        larkUserId: '', // 申请人飞书ID
        applyDeptId: '', // 申请部门ID
        applyDeptName: '', // 申请部门名称
        instruction: '', // 事项说明
        approvalRemark: '', // 审批备注
        attachmentUrls: [], // 审批附件
        associatedApproval: [], // 关联审批
    };
};

/** 公共审计字段 */
export type AuditFields = {
    id?: number;
    createdAt?: string;
    createdBy?: string;
    createdByName?: string;
    updatedAt?: string;
    updatedBy?: string;
    updatedByName?: string;
};

/** 客户类型枚举 */
export type CustomerType = 'CHEMICAL' | 'TRADER';

/** 客户星级枚举 */
export type StarLevel = 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE';

/** 合作状态枚举 */
export type CooperationStatus = 'NORMAL' | 'SUSPENDED' | 'TERMINATED';

/** 客户状态枚举 */
export type CustomerStatus = 'DRAFT' | 'STORAGE';

/** 客户经理人员DTO */
export type ManagePersonDTO = {
    /** 用户名 */
    username: string;
    /** 用户编码 */
    code: string;
    /** 飞书用户ID */
    larkUserId?: string;
};

/** 化工企业信息DTO */
export type CustomerChemicalDTO = AuditFields & {
    customerId?: number;
    /** 核心产品 */
    coreProduct: string;
    /** 厂区或仓储地址 */
    factoryAddress: string;
    /** 产能（万吨/年） */
    capacity: number | string;
    /** 矿石需求（万吨/年） */
    oreDemand: number | string;
    /** 洗选能力（吨/日） */
    washingCapacity?: number | string;
    /** 开工率（%） */
    operatingRate?: number | string;
};

/** 贸易商信息DTO */
export type CustomerTraderDTO = AuditFields & {
    customerId?: number;
    /** 核心产品 */
    coreProduct: string;
    /** 厂区或仓储地址 */
    factoryAddress: string;
    /** 贸易规模（万吨/年） */
    tradeScale: number | string;
    /** 可用资金规模（万元） */
    availableFunds?: number | string;
    /** 下游供应企业 */
    downstreamEnterprises?: string;
    /** 物流合作渠道 */
    logisticsChannels?: string;
    /** 采购偏好（矿种/品位） */
    purchasePreference?: string;
};

/** 联系人DTO */
export type CustomerContactDTO = AuditFields & {
    customerId?: number;
    /** 对接人姓名 */
    contactName: string;
    /** 对接人职务 */
    position?: string;
    /** 联系方式 */
    phone: string;
    /** 负责内容 */
    responsibility?: string;
    /** 生日 */
    birthday?: string;
    /** 备注 */
    remark?: string;
    /** 调整原因 */
    adjustReason?: string;
    /** 合作年限 */
    cooperationDuration?: string;
    /** 核心产品 */
    coreProduct?: string;
};

/** 客户档案手工评估明细DTO */
export type CustomerEvaluationDetailDTO = AuditFields & {
    /** 评估项编码 */
    indicatorCode: string;
    /** 评估项名称 */
    indicatorName: string;
    /** 选项编码 */
    selectedOption: string;
    /** 选项文案 */
    optionLabel: string;
};

/** 客户基础信息创建参数 */
export type CustomerBaseCreateDTO = AuditFields & {
    /** 客户编码 */
    customerCode?: string;
    /** 企业单位名称 */
    customerName: string;
    /** 客户类型：CHEMICAL(化工企业)/TRADER(贸易商) */
    customerType: CustomerType;
    /** 客户类型名称 */
    customerTypeName?: string;
    /** 是否子公司贸易商：1(是)/2(否) */
    isSubsidiary?: 1 | 2;
    /** 区域 */
    region: string;
    /** 客户经理列表 */
    manage?: ManagePersonDTO[];
    /** 客户星级 */
    starLevel: StarLevel;
    /** 客户星级名称 */
    starLevelName?: string;
    /** 合作状态 */
    cooperationStatus: CooperationStatus;
    /** 首次合作日期 */
    cooperationStartDate?: string;
    /** 最近合作日期 */
    latestCooperationDate?: string;
    /** 历史合作总量（万吨） */
    cooperationTotal?: number;
    /** 客户风险信息 */
    riskInfo?: string;
    /** 备注 */
    remark?: string;
    /** 合作流程说明 */
    cooperationProcessExplanation?: string;
    /** 仓储能力（万吨）- 仅化工企业 */
    storageCapacity?: number | string;
    /** 状态：DRAFT(草稿)/STORAGE(已入库) */
    status: CustomerStatus;
    /** 状态名称 */
    statusName?: string;
    /** 化工厂企业信息列表 */
    chemicalList?: CustomerChemicalDTO[];
    /** 贸易商信息列表 */
    traderList?: CustomerTraderDTO[];
    /** 联系人列表 */
    contactList?: CustomerContactDTO[];
    /** 客户评估总分 */
    baseScore?: number;
    /** 战略方向匹配度 */
    strategicDirectionMatch?: string;
    /** 创新合作可能性 */
    innovationCooperationPossibility?: string;
    /** 行业影响力辐射 */
    industryInfluenceRadiation?: string;
    /** 售后服务满意度 */
    afterSalesSatisfaction?: string;
    /** 服务反馈及时性 */
    serviceFeedbackTimeliness?: string;
    /** 行业地位 */
    industryPosition?: string;
    /** 中长期战略契合度 */
    midLongTermStrategyFit?: string;
};

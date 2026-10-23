/**
 * 关联审批模块配置。
 * 审批编码随环境变化，业务页面只依赖模块 key 和展示名称，避免在组件中散落环境判断。
 */
export type ApprovalModuleKey =
    | 'chemicalPricing'
    | 'contractPricing'
    | 'framework'
    | 'monthlyDispatch'
    | 'salesContract'
    | 'traderPricing'
    | 'financeSettlement';

export interface ApprovalModuleOption {
    /** 业务模块 key */
    key: ApprovalModuleKey;
    /** 下拉及列表展示名称 */
    label: string;
    /** 飞书审批模板编码 */
    approvalCode: string;
}

const PRODUCTION_APPROVAL_MODULES: readonly ApprovalModuleOption[] = [
    { key: 'chemicalPricing', label: '化工基准定价', approvalCode: '0A88D813-11F3-4F52-AD48-0163690E3E5C' },
    { key: 'contractPricing', label: '合同定价', approvalCode: '7034004A-82F8-4085-9999-C86D5D31C39D' },
    { key: 'framework', label: '框架合同', approvalCode: '28640B69-B320-4820-AAB7-785D40F79B6D' },
    { key: 'monthlyDispatch', label: '月发货计划', approvalCode: '99E732C3-04B6-4AE8-9C7F-020C7C35894F' },
    { key: 'salesContract', label: '销售合同', approvalCode: '4341E186-F558-429E-80B7-79D4136428F4' },
    { key: 'traderPricing', label: '贸易商基准定价', approvalCode: 'E4A7FD34-FA8F-4239-B2CD-D39980112983' },
    { key: 'financeSettlement', label: '结算', approvalCode: 'BDB6BF60-9B4F-418E-BC05-3F0258943385' },
];

const TEST_APPROVAL_MODULES: readonly ApprovalModuleOption[] = [
    { key: 'chemicalPricing', label: '化工基准定价', approvalCode: 'A885B904-7A46-45FC-B952-4AF5A08F2DC1' },
    { key: 'contractPricing', label: '合同定价', approvalCode: '75639D5B-F160-4BD5-A766-9EE2CE55BFCE' },
    { key: 'framework', label: '框架合同', approvalCode: '01CFF8EF-BDFA-4699-9994-BB3A50CC1D4C' },
    { key: 'monthlyDispatch', label: '月发货计划', approvalCode: '752D45D7-2189-4254-96D0-E510EA0E3C08' },
    { key: 'salesContract', label: '销售合同', approvalCode: '3BD63951-276F-49FB-ADCA-F37AC4355AC2' },
    { key: 'traderPricing', label: '贸易商基准定价', approvalCode: 'B46F5F84-6136-4C91-8B21-82DE4F13FC91' },
    { key: 'financeSettlement', label: '结算', approvalCode: '2DA041F8-377B-4BE0-82F5-3FC438C15B96' },
];

/** 当前构建环境使用测试编码（development/test）或生产编码。 */
export const APPROVAL_ENVIRONMENT = import.meta.env.VITE_NODE === 'production' ? 'production' : 'test';

/** 当前环境的审批模块下拉选项。 */
export const APPROVAL_MODULE_OPTIONS: readonly ApprovalModuleOption[] =
    APPROVAL_ENVIRONMENT === 'production' ? PRODUCTION_APPROVAL_MODULES : TEST_APPROVAL_MODULES;

/** 按模块 key 快速读取配置。 */
export const APPROVAL_MODULE_MAP = APPROVAL_MODULE_OPTIONS.reduce(
    (map, option) => {
        map[option.key] = option;
        return map;
    },
    {} as Record<ApprovalModuleKey, ApprovalModuleOption>
);

/** 按审批编码快速读取配置，兼容跨环境返回的历史审批实例。 */
export const APPROVAL_CODE_MAP = [...PRODUCTION_APPROVAL_MODULES, ...TEST_APPROVAL_MODULES].reduce(
    (map, option) => {
        map[option.approvalCode.toUpperCase()] = option;
        return map;
    },
    {} as Record<string, ApprovalModuleOption>
);

/**
 * 将环境和配置以只读结构导出，便于测试和需要同时查看两套编码的工具使用。
 */
export const APPROVAL_MODULE_CONFIG = {
    production: PRODUCTION_APPROVAL_MODULES,
    test: TEST_APPROVAL_MODULES,
} as const;


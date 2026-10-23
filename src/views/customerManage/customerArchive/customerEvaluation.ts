import type { CustomerEvaluationDetailDTO } from "@/types/customerManage";

export interface CustomerEvaluationOption {
    label: string;
    value: string;
}

export interface CustomerEvaluationConfig {
    indicatorCode: string;
    indicatorName: string;
    description: string;
    options: CustomerEvaluationOption[];
}

/**
 * 页面评估项对应的客户档案接口字段。
 */
export const CUSTOMER_EVALUATION_FIELD_MAP: Record<string, string> = {
    STRATEGIC_DIRECTION_MATCH: "strategicDirectionMatch",
    INNOVATION_COOPERATION_POTENTIAL: "innovationCooperationPossibility",
    INDUSTRY_INFLUENCE: "industryInfluenceRadiation",
    AFTER_SALES_SATISFACTION: "afterSalesSatisfaction",
    SERVICE_FEEDBACK_TIMELINESS: "serviceFeedbackTimeliness",
    INDUSTRY_POSITION: "industryPosition",
    LONG_TERM_STRATEGIC_FIT: "midLongTermStrategyFit",
};

export const CUSTOMER_EVALUATION_CONFIG: CustomerEvaluationConfig[] = [
    {
        indicatorCode: "STRATEGIC_DIRECTION_MATCH",
        indicatorName: "战略方向匹配度",
        description: "评估客户业务与公司未来 1-3 年发展方向的契合度",
        options: [
            { label: "A ≥80%", value: "A" },
            { label: "B 50–80%", value: "B" },
            { label: "C 20–50%", value: "C" },
            { label: "D <20%", value: "D" },
        ],
    },
    {
        indicatorCode: "INNOVATION_COOPERATION_POTENTIAL",
        indicatorName: "创新合作可能性",
        description: "衡量从「买卖关系」升级为「战略合作」的潜力",
        options: [
            { label: "A 已签约联合研发/生态共建", value: "A" },
            { label: "B 明确意向", value: "B" },
            { label: "C 初步洽谈", value: "C" },
            { label: "D 无", value: "D" },
        ],
    },
    {
        indicatorCode: "INDUSTRY_INFLUENCE",
        indicatorName: "行业影响力与辐射力",
        description: "评估客户在产业链中的话语权与带动效应",
        options: [
            { label: "A Top10", value: "A" },
            { label: "B Top11–30", value: "B" },
            { label: "C Top31–100", value: "C" },
            { label: "D 其他", value: "D" },
        ],
    },
    {
        indicatorCode: "AFTER_SALES_SATISFACTION",
        indicatorName: "售后满意度",
        description: "衡量客户对售后服务的认可度",
        options: [
            { label: "A ≥90%", value: "A" },
            { label: "B 80–90%", value: "B" },
            { label: "C 70–80%", value: "C" },
            { label: "D <70%", value: "D" },
        ],
    },
    {
        indicatorCode: "SERVICE_FEEDBACK_TIMELINESS",
        indicatorName: "服务问题反馈及时率",
        description: "反映客户主动沟通意愿，比例高说明客户在意合作关系",
        options: [
            { label: "A ≥60%", value: "A" },
            { label: "B 40–60%", value: "B" },
            { label: "C 20–40%", value: "C" },
            { label: "D <20%", value: "D" },
        ],
    },
    {
        indicatorCode: "INDUSTRY_POSITION",
        indicatorName: "行业地位",
        description: "判断客户在产业链中的话语权与未来增长空间",
        options: [
            { label: "A 领军", value: "A" },
            { label: "B 新兴", value: "B" },
            { label: "C 边缘", value: "C" },
        ],
    },
    {
        indicatorCode: "LONG_TERM_STRATEGIC_FIT",
        indicatorName: "中长期战略契合度",
        description: "评估客户是否符合公司中长期投入方向",
        options: [
            { label: "A 完全符合", value: "A" },
            { label: "B 部分符合", value: "B" },
            { label: "C 不符合", value: "C" },
        ],
    },
];

/**
 * 根据接口数据生成完整的客户评估明细。
 * @param source 客户档案详情接口返回的数据
 * @returns 按页面固定评估项排序的评估明细
 */
export const createEvaluationDetailList = (
    source: Record<string, any> = {}
): CustomerEvaluationDetailDTO[] =>
    CUSTOMER_EVALUATION_CONFIG.map((config) => {
        const field = CUSTOMER_EVALUATION_FIELD_MAP[config.indicatorCode];
        const selectedOption = source?.[field] || "A";
        const selectedOptionConfig = config.options.find(
            (option) => option.value === selectedOption
        );
        return {
            indicatorCode: config.indicatorCode,
            indicatorName: config.indicatorName,
            selectedOption,
            optionLabel: selectedOptionConfig?.label || "",
        };
    });

/**
 * 移除选项文案开头的等级字母，供详情页展示。
 * @param label 完整选项文案
 * @returns 不包含等级字母的选项文案
 */
export const formatEvaluationOptionLabel = (label?: string): string => {
    if (!label) return "--";
    return label.replace(/^[A-D]\s+/, "");
};

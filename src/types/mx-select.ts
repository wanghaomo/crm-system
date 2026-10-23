

export type mxCascaderTreeSelectTypes = {
    option: Record<string, any>[];
    // 1为级联选择 2为树形选择
    type?:number,
    // 是否多选（可选）
    multiple?: boolean;
    // 是否返回完整对象（可选）
    isAllItem?: boolean;
    // 是否允许选择非叶子节点（可选）
    allowParentSelect?: boolean;
    // value 对应的字段名（可选）
    valueKey?: string;
    // label 对应的字段名（可选）
    labelKey?: string;
    // children 对应的字段名（可选）
    childrenKey?: string;
};

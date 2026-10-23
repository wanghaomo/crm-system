// 组件 Emits 类型
export interface MxDictEmits {
    (e: 'update:modelValue', value: string | string[]): void;
    (e: 'update:label', value: string | string[]): void;
    (e: 'update:selectedData', value: string | string[]): void;
    (e: 'change', value: string | string[]): void;
}
// 组件数据类型
export interface MxOptionItemType {
    value: string;
    label: string;
}
export interface MxDictPropsType {
    // 要展示的字典类型名称（中文-具体可查看config/enum.cfg.ts）
    dictType: string;
    // modelValue 绑定的值
    modelValue?: string | string[] | null;
    // 字典标签
    label?: string | string[] | null;
    // 是否展示多选
    multiple?: boolean;
    // 是否可清空
    clearable?: boolean;
    // 占位符
    placeholder?: string;
    // 选中的项数据
    selectedData?: MxOptionItemType[] | MxOptionItemType | null;
    // 是否仅展示选中项的标签
    text?: boolean;
}

// 人员选择组件类型定义

// 选项类型
export interface SelectOption {
    value: string;
    label: string;
    [key: string]: any;
}

// 组件 Props 类型
export interface SelectProps {
    // 是否禁用
    disabled?: boolean;
    // 绑定值 必传
    modelValue: string | string[];
    // 是否可清空
    clearable?: boolean;
    // 是否可多选
    multiple?: boolean;
    // 额外的查询参数
    extraParams?: Record<string, any>;
    // 是否折叠标签
    collapseTags?: boolean;
    // 是否只读
    readonly?: boolean;
    // 标签值
    label?: string | string[];
    // app端-是否显示
    show?: boolean;
    // 选择组件类型名称
    typeName: string;
    // 选中的数据合集-仅用于web端展示
    selectedData?: SelectOption | SelectOption[] | null;
    // 是否纯文本展示
    text?: boolean;
    // app端表单校验使用
    name?: string;
    // 表单验证相关: 是否必填，配合自定义组件在Form中的展示
    required?: boolean;
    // app端表单校验规则
    rules?: any[];
    // 下拉选择组件选项
    options?: SelectOption[];
    // 禁止选择的value集合-用于禁止部分选项的选择
    disabledValues?: string[];
    // 是否禁止缓存
    disableCache?: boolean;
    // 是否仅显示label项（没有额外的字段展示）
    onlyShowLabel?: boolean;
    //app是否显示van-field
    appShowVanField?: boolean;
}
// web端展示的字段对象集合
export interface WebShowFields {
    // 字段参数
    key: string;
    // 要展示的字段名称
    label: string;
    // 宽度（最小值）
    width: string;
    // 是否固定宽度
    fixedWidth?: boolean;
    // 自定义渲染
    render?: (row: any) => string;
}
// 子组件接收的Props类型
export interface ChildrenSelectProps extends SelectProps {
    // 下拉选择组件选项
    options: SelectOption[];
    // loading状态
    loading?: boolean;
    // 要展示的字段对象集合
    showFields?: Array<WebShowFields>;
       // 标题
    title: string;
    // 搜索框占位符
    placeholder: string;
    // app端额外展示的字段
    appShowFields?: string[];
    // app端表单校验使用
    name?: string;
    // 表单验证相关: 是否必填，配合自定义组件在Form中的展示
    required?: boolean;
    //label对齐方式
    labelAlign?: 'left' | 'top'
}

// 组件 Emits 类型
export interface SelectEmits {
    // 值变更事件
    (e: 'update:modelValue', value: string | string[] | null): void;
    // 标签更新事件
    (e: 'update:label', label: string | string[] | null): void;
    // 选择变更事件
    (e: 'changeEvt', value: SelectOption | SelectOption[] | null): void;
    // app端-关闭事件
    (e: 'update:show', show: boolean): void;
    // 选中的数据合集更新事件
    (e: 'update:selectedData', selectedData: SelectOption | SelectOption[] | null): void;
}

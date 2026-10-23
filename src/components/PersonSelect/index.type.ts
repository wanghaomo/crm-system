// 人员选择组件类型定义

// 选项类型
export interface PersonOption {
    value: string;
    label: string;
    username?: string;
    code?: string;
    userDeptList?: Array<{
        deptName: string;
        deptCode: string;
        [name:string]:any
    }>;
    [key: string]: any;
}

// 组件 Props 类型
export interface PersonSelectProps {
    // 是否禁用
    disabled?: boolean;
    // 绑定值 必传
    modelValue?: string | string[] ;
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
    label?: string | string[] ;
    // app端-是否显示
    show?: boolean;
    // 标题
    title?: string;
    // 表单验证相关: 是否必填，配合自定义组件在Form中的展示
    required?: boolean;
    // 搜索框占位符
    placeholder?: string;
    // 选择人的对象-只用于展示，传入的值不会回显到组件中
    selectedPerson?: PersonOption | PersonOption[] | null;
    // 是否纯文本展示
    text?: boolean;
    // app端额外展示的字段
    appShowFields?: string[];
    // app端表单校验使用
    name?: string;
    // app端表单校验规则
    rules?: any[];
    // label对齐方式，支持top/left/right
    labelAlign?: 'top' | 'left' | 'right';
    // 是否仅使用弹窗效果
    popupOnly?: boolean;
    // 当前数据是否禁用缓存
    disableCache?: boolean;
}
// 组件 Emits 类型
export interface PersonSelectEmits {
    // 值变更事件
    (e: 'update:modelValue', value: string | string[] | null): void;
    // 标签更新事件
    (e: 'update:label', label: string | string[] | null): void;
    // 选择变更事件
    (e: 'changeEvt', value: PersonOption | PersonOption[] | null): void;
    // app端-关闭事件
    (e: 'update:show', show: boolean): void;
    // 选择人变更事件
    (e: 'update:selectedPerson', value: PersonOption | PersonOption[] | null): void;
}

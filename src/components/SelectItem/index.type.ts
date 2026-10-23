import { PersonOption } from "../PersonSelect/index.type";

export type SelectItemProps={
    // 单选项 or 多选项（决定选中图标样式）
    multiple?: boolean;
    // 是否选中
    selected?: boolean;
    // 数据项
    item: PersonOption;
    // 要展示的附带数据项
    showDataItem?:Array<string>
}
// 组件 Emits 类型
export interface SelectItemEmits {
  // 选择变更事件
  (e: 'onClick', value: string): void;
}
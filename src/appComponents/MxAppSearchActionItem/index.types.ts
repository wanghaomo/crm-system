import { Ref } from "vue"

// action列表配置
export interface IMxAppSearchActionItem {
  // 选项label
  label: string
  // 字段名，唯一标识
  code: string
  // 选项
  options?: any[],
  // 自定义双向绑定值
  modelValue?: any
  //处理配置绑定
  value?: any
  //选中后的展示效果 当前label或者值label
  checkType?: 'label' | 'valueLabel' | 'value'
  //label的最大文字长度
  labelMaxLength?: number
  //自定义下拉label展示方式
  labelCustom?: (value: any) => void
  // 自定义点击逻辑
  customClick?: (visable: Ref) => void
}
export interface ISearchActionItemEmits {
  (e: 'update:modelValue', value: any): void
  (e: 'change', value: any): void
}
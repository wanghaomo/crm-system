/**
 * 单个查询项的配置类型（用于构建搜索栏的每一项）
 */
export interface QueryItem {
    /**
   * 控件类型：
   * - 'input'：普通输入框
   * - 'date'：日期选择（单日）
   * - 'dateTime'：日期时间选择
   * - 'dateRange'：日期范围选择（数组，长度 2）
   * - 'dateTimeRange'：日期时间范围选择（数组，长度 2）
   * - 'select'：下拉单选/多选（视 isMultiple）
   * - 'multipleSelect'：多选（同 select + isMultiple）
   * - 'treeSelect'：树形选择
   * - 'dict'：字典选择
   * - 'personSelect'：人员选择
   * - 'month'：月份选择
   * - 'year'：年份选择
   * - 'dateTimeRange1'：日期时间范围选择（精确到分钟）
   * - 'monthrange'：月份范围选择
   */
    type: string
    placeholder?: string
    label?: string
    value: string
    defaultValue?: any
    options?: Array<{
        label: string
        value: any
    }>
    maxTageCount?: number
    isMultiple?: boolean
    leftPlaceholder?: string
    rightPlaceholder?: string
    isSelectOnce?: boolean
    valueKey?: string
    labelKey?: string
    childrenKey?: string
    dictType?: string
}
// props 类型
// 搜索栏组件类型枚举
export enum ESearchType {
  INPUT = 'input',
  ACTION = 'action'
}
import { IMxAppSearchActionItem } from "../MxAppSearchActionItem/index.types"
export interface ISearchParams {
  searchValue: string | number,
  actionList?: IMxAppSearchActionItem[],
  filterFrom?: any
}
export interface ISearchEmits {
  (e: 'showFilter', value: boolean): void
  (e: 'search', value: ISearchParams): void
  (e: 'actionChange', value: IMxAppSearchActionItem): void
}
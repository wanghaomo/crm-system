import { reactive, Reactive } from "vue";
import { IMxAppSearchActionItem } from "../appComponents/MxAppSearchActionItem/index.types"
import { ESearchType } from "../appComponents/MxAppSearchBar/index.type"
export interface IAppSearchConfig {
  type?: 'input' | 'action'
  showFilter?: boolean
  actionList?: IMxAppSearchActionItem[]
  placeholder?: string
  defaultValue?: string | number
  searchBtnText?: string
  clearable?: boolean
  showLeft?: boolean
  leftActionConfig?: IMxAppSearchActionItem
  justify?: string
}
export function useAppSearch<T extends Record<string, any>>(config: IAppSearchConfig) {
  const searchForm = reactive<T>({} as T);
  const searchConfig = reactive(config)
  type cb = (searchForm: Reactive<T>) => void
  let callBack: cb = null
  const changeForm = (e?: any) => {
    if (searchConfig.type == 'input') {
      if (e) {
        searchForm.searchValue = e.searchValue
      }
      if (searchConfig.showLeft && searchConfig.leftActionConfig) {
        searchForm[searchConfig.leftActionConfig.code] = searchConfig.leftActionConfig.value
      }
    }
    if (searchConfig.type == 'action') {
      searchConfig.actionList.forEach((item) => {
        searchForm[item.code] = item!.value;
      });
    }
    callBack && callBack(searchForm)
  };
  const onSearch = (e) => {
    changeForm(e)
  }
  const onSearchActionChange = (e) => {
    changeForm(e)
  }
  const onSearchFilterReset = (e) => {
    searchForm.searchValue = searchConfig.defaultValue
    changeForm(e)
  }
  const onSearchFilterComfirm = (e) => {
    changeForm(e)
  }
  const onSearchChange = (cb: cb, immediate: boolean = true) => {
    callBack = cb
    immediate && changeForm()
  }
  return {
    searchForm,
    searchConfig,
    onSearch,
    onSearchActionChange,
    onSearchFilterReset,
    onSearchFilterComfirm,
    onSearchChange,
    changeForm
  }
}
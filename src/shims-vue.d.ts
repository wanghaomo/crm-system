/* eslint-disable */
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
declare module 'vue-router'
interface Window {
    $loading: any;
    appCookieManager: any;
    $wujie: any;
    plus:any;
    // 乾坤props变量
    __QIANKUN_PROPS__: any;
    [name:string]:any;

}

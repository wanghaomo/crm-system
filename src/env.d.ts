/// <reference types="vite/client" />

// 扩展ImportMetaEnv接口，声明项目中使用的环境变量
interface ImportMetaEnv {
  readonly VITE_APP_HELP_URL: string;
  readonly VITE_APP_SYSTEM_CODE: string;
  readonly VITE_HOME_URL: string;
  readonly VITE_NODE: string;
  readonly VITE_LOGIN_URL: string;
  readonly VITE_PROXY_PATH: string;
  // 可以在这里添加其他环境变量
}

// 扩展ImportMeta接口，确保TypeScript识别import.meta.env
declare interface ImportMeta {
  readonly env: ImportMetaEnv;
  readonly glob: any;
}

declare module "*.vue" {
  import { DefineComponent } from "vue"
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module 'vue-router';
declare module 'pinia';
declare module 'hls.js';
declare module 'mui-player';
declare module 'vue-pdf';
declare module '@mx/mx-ui';
declare module '@mx/mx-ui/utils';
declare module 'naive-ui';
interface Window {
    $loading: any;
    $wujie?: any;
    plus?: any;
    back:()=>void;
}

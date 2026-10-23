/** 默认菜单地址 */
export const DEFAULT_MENU_PATH = '/home/index';
/** 每个系统固定的首页菜单数据 */
export const HOME_MENU_DATA = {
    code: 'home',
    path: DEFAULT_MENU_PATH,
    name: '数据看板',
    icon: 'icon⎽func⎽board',
    visible: true,
    meta: {
        title: '数据看板',
        nologin: true,
        layout: 'main-layout',
        code: 'home',
    }
};
// app不展示的菜单
export const NOT_APP_SHOW_MENU: string[] = [
    '/equipmentManagement/list/index',
    '/equipmentModeling/list/index'
];
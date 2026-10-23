import type { VNode } from 'vue';
import { PaginationProps } from './pagination';
// 表头字段
type DataTableColumns<T = any> = {
    key: string;
    title: string;
    width: number | string;
    fixed?: 'left' | 'right' | boolean;
    sorter?: boolean | ((a: T, b: T) => number);
    render?: (record: T, index: number) => VNode | string;
    slotName?: string;
    visible?: boolean;
    align?: 'left' | 'center' | 'right';
};
// 按钮字段
export type tableBtnsTypes = {
    // 按钮名称
    btnName: string;
    // 权限标识
    permission?: string;
    // 多个按钮状态控制，当前状态显示按钮标识
    isBtnHide?: (row: Record<string, any>) => boolean;
    // 自定义render
    render?: (row: Record<string, any>, item?: tableBtnsTypes) => VNode | string;
    // 按钮方法
    clickTableBtns?: (row: Record<string, any>) => void;
};
// 数组非空限定
type NonEmptyArray<T> = [T, ...T[]];
export type WebDataTableType = {
    // 表头
    columns: NonEmptyArray<DataTableColumns>;
    // 表格数据
    tableList: Record<string, any>[];
    // 表格按钮
    tableBtns?: NonEmptyArray<tableBtnsTypes>;
    // 表格内部样式
    styleOption?: Record<string, string>;
    // 分页
    paginationConfig?: PaginationProps;
    // 所有权限列表（用于计算按钮所占用的宽度）
    permissionList?: string[];
};

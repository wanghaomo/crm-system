import type { VNode } from 'vue';
import { PaginationProps } from '@/types/pagination';
// 表头字段
type DataTableColumns<T = any> = {
    key: string;
    title: string;
    width: number | string;
    fixed?: 'left' | 'right' | boolean;
    sorter?: boolean | ((a: T, b: T) => number);
    render?: (record: T, index: number) => VNode | string | number;
    slotName?: string;
    visible?: boolean;
    align?: 'left' | 'center' | 'right';
    isRule?: boolean;// 是否必填（必填展示星号）
    // 表头提示信息，传入提示文字列表，不为空时在表头标题旁显示信息图标tooltip
    headerTip?: string[];
};

// 按钮字段
export type tableBtnsTypes = {
    // 按钮名称
    btnName: string;
    // 是否展示弹框
    isDialog?:boolean;
    // 权限标识
    permission?: string;
    // 按钮颜色
    btnColor?: string;
    // 自定义删除提示语
    delMsg?: string;
    // 多个按钮状态控制，当前状态显示按钮标识
    isBtnHide?: (row: Record<string, any>) => boolean;
    // 是否展示操作按钮
    ifShow?: (row: Record<string, any>) => boolean;
    // 自定义render
    render?: (row: Record<string, any>, item?: tableBtnsTypes) => VNode | string;
    // 按钮方法
    clickTableBtns?: (row: Record<string, any>,index?:any) => void;
    // 删除弹框配置
    delConfig?: {
        title?: string;
        content?: string;
        positiveText?: string;
        negativeText?: string;
    };
};

// 数组非空限定
type NonEmptyArray<T> = [T, ...T[]];

type WebDataTableBase = {
    // 表头
    columns: NonEmptyArray<DataTableColumns>;
    // 表格数据
    tableList: Record<string, any>[];
    // 表格按钮
    tableBtns?: NonEmptyArray<tableBtnsTypes>;
    // 表格内部样式
    styleOption?: Record<string, string>;
    // 所有权限列表（用于计算按钮所占用的宽度）
    permissionList?: string[];
    // 是否自适应高度
    flexHeight?: boolean;
    // 表格最大高度
    maxHeight?: number | string;
    // 是否展示序号
    isShowIndex?: boolean;
    // 多选数据
    handleCheck?: Function;
    // 是否展示多选
    isMultiple?:boolean;
};



export type WebDataTableType =
     (WebDataTableBase & {
        bordered?: boolean;
        bottomBordered?: boolean;
        isShowPagination?: false;
        paginationConfig?: PaginationProps;
        singleLine? :boolean
    })
    | (WebDataTableBase & {
        bordered: boolean;
        bottomBordered: boolean;
        isShowPagination: true;
        paginationConfig: PaginationProps;
        singleLine? :boolean

    });

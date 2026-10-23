export interface PageConfigType {
    // 当前页
    page: number;
    // 每页条数
    pageSize?: number;
    // 总条数
    total: number;
    // 是否展示每页条数切换器
    showSizePicker?: boolean;
    // 可选每页条数
    pageSizes?: number[];
}
export interface PaginationProps {
    // 分页配置
    pagConfig: PageConfigType;
    // 是否展示头部border
    showHeadBorder?: boolean;
    // 是否展示总条数
    showTotal?: boolean;
    // 样式
    styleOption?: Record<string, string>;
    /**
     * 页面显示个数
     */
    pageSlot?: number;
    /**
     * 当前页变化
     * @param page  当前页
     * @returns 
     */
    onPageChange?: (page: number) => void;
    /**
     * 每页条数变化
     * @param pageSize 每页条数
     */
    onPageSizeChange?: (pageSize: number) => void;
}

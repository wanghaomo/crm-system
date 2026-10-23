/**
 * 客户星级配置
 * 统一管理客户星级的选项、映射和显示文本
 */

// 客户星级选项（用于下拉选择）
export const STAR_LEVEL_OPTIONS = [
    { label: '一级客户', value: 'ONE' },
    { label: '二级客户', value: 'TWO' },
    { label: '三级客户', value: 'THREE' },
    { label: '四级客户', value: 'FOUR' },
    { label: '五级客户', value: 'FIVE' },
];

// 客户星级映射（用于详情回显）
export const STAR_LEVEL_MAP: Record<string, string> = {
    ONE: '一级客户',
    TWO: '二级客户',
    THREE: '三级客户',
    FOUR: '四级客户',
    FIVE: '五级客户',
};

// 客户星级简称映射（用于简化显示）
export const STAR_LEVEL_SHORT_MAP: Record<string, string> = {
    ONE: '一级',
    TWO: '二级',
    THREE: '三级',
    FOUR: '四级',
    FIVE: '五级',
};

// 客户星级颜色配置（用于标签显示）
export const STAR_LEVEL_COLORS: Record<string, string> = {
    ONE: '#FF4D4F',   // 一级 - 红色
    TWO: '#FA8C16',   // 二级 - 橙色
    THREE: '#FADB14', // 三级 - 金色
    FOUR: '#52C41A',  // 四级 - 绿色
    FIVE: '#1890FF',  // 五级 - 蓝色
};


// 单据状态映射
export const STATUS_MAP: Record<string, { text: string; color: string; bgColor: string; bdColor: string }> = {
    PENDING: { text: '待执行', color: '#E59222', bgColor: '#FFF1D9', bdColor: '#FFE49A' },
    COMPLETED: { text: '已完成', color: '#3370EB', bgColor: '#EFF4FF', bdColor: '#D9E3F5' },
    ARCHIVED: { text: '已归档', color: '#5AA771', bgColor: '#F0F9EB', bdColor: '#E2F4D8' },
    CANCELLED: { text: '已取消', color: '#999999', bgColor: '#F0F0F0', bdColor: '#DDDFE6' },
};


/**
 * 获取客户星级显示文本
 * @param level 星级值（ONE/TWO/THREE/FOUR/FIVE）
 * @param useShort 是否使用简称，默认false（显示"一级客户"），true（显示"一级"）
 */
export const getStarLevelText = (level: string, useShort: boolean = false): string => {
    if (!level) return '--';
    return useShort ? (STAR_LEVEL_SHORT_MAP[level] || level) : (STAR_LEVEL_MAP[level] || level);
};

/**
 * 获取客户星级颜色
 * @param level 星级值（ONE/TWO/THREE/FOUR/FIVE）
 */
export const getStarLevelColor = (level: string): string => {
    return STAR_LEVEL_COLORS[level] || '#999999';
};



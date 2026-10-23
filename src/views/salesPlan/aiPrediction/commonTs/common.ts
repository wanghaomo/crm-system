export type ReportStatus = 'RUNNING' | 'COMPLETED' | 'FAILED';
 interface IConfig {
    label: string; 
    color: string
    borderColor: string
    backgroundColor: string
    /** AppTag 预设类型：primary | warning | error | success | info */
    type?: string
 }
export const AI_REPORT_STATUS_CONFIG: Record<ReportStatus, IConfig> = {
    RUNNING: {
        label: '生成中',
        type: 'warning',
        color: '#FCBD12',
        borderColor: '#F4EADC', 
        backgroundColor: '#FFF7E0' 
    },
    COMPLETED: {
        label: '已生成',
        type: 'success',
        color: '#18D851',
         borderColor: '#E2F4D8',
         backgroundColor: '#F0F9EB'
    },
    FAILED: {
        label: '失败',
        type: 'error',
        color: '#E34242',
        borderColor: '#f4d8d8',
        backgroundColor: '#ffd7d7'
    },
};

export const AI_REPORT_STATUS_OPTIONS = Object.entries(AI_REPORT_STATUS_CONFIG).map(([value, config]) => ({
    value,
    label: config.label,
}));

export const AI_REPORT_TYPE_OPTIONS = [
    { label: '月度预测', value: 'MONTHLY' },
    { label: '季度预测', value: 'QUARTERLY' },
];

export const AI_REPORT_TYPE_LABEL_MAP = AI_REPORT_TYPE_OPTIONS.reduce<Record<string, string>>((map, item) => {
    map[item.value] = item.label;
    return map;
}, {});

export const TABLE_ACTION_COLOR = 'var(--base-color)';
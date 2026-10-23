import { computed, nextTick, ref, watch } from 'vue';
import type { InjectionKey } from 'vue';
import { useMessage } from 'naive-ui';
import { storeToRefs } from 'pinia';
import approvalBackIcon from '@/assets/images/icon⎽com⎽back@3x.png';
import approvalDetailArrowIcon from '@/assets/images/icon⎽com⎽arrow⎽dowm@3x.png';
import approvalCheckboxIndeterminateIcon from '@/assets/images/icon⎽com⎽mchoice⎽inc@3x.png';
import approvalCheckboxNormalIcon from '@/assets/images/icon⎽com⎽mchoice⎽nor@3x.png';
import approvalCheckboxSelectedIcon from '@/assets/images/icon⎽com⎽mchoice⎽sel@3x.png';
import {
    getApprovalInstanceDetail,
    listApprovalInstances,
    listCcMeApprovalInstances,
    listDoneApprovalInstances,
} from '@/api/approval';
import { useUserStore } from '@/store/userStore';
import { getApprovalUserNameMap } from '@/utils/approval';
import { isApp } from '@/utils/comm';
import { APPROVAL_CODE_MAP, APPROVAL_MODULE_OPTIONS, type ApprovalModuleKey } from '@/config/approval';

export type RowKey = string | number;
export type ApprovalTab = 'initiated' | 'done' | 'ccMe';
export type ApprovalDateRange = [string, string] | null;

export interface ApprovalRow {
    [key: string]: any;
}

export interface ColumnOption {
    title: string;
    key: string;
    width?: number;
    fallbackKeys?: string[];
}

export interface ApprovalSelectProps {
    modelValue?: RowKey | RowKey[] | ApprovalRow | ApprovalRow[] | null;
    selectedRows?: ApprovalRow[];
    multiple?: boolean;
    title?: string;
    rowKey?: string;
    modalWidth?: string;
    tableMaxHeight?: number;
    approvalCode?: string;
    status?: string;
    valueFormat?: 'array' | 'string' | 'object';
    separator?: string;
    columns?: ColumnOption[];
    onlyShow?: boolean;
    hideTrigger?: boolean;
}

type ApprovalSelectEmit = (...args: any[]) => void;

const MAX_AUTO_LOAD_COUNT = 5;
const APPROVAL_FILTER_MIN_DATE = new Date(2000, 0, 1);
const APPROVAL_FILTER_MAX_DATE = new Date();

/**
 * Build shared approval-selection state for the PC drawer and App popup.
 * @param props Normalized component props used by list, detail, and selection handlers
 * @param emit Component event emitter for selected value changes
 * @returns Reactive state and handlers consumed by the trigger and platform views
 */
export function useApprovalSelect(props: Required<ApprovalSelectProps>, emit: ApprovalSelectEmit) {
    const { userInfo } = storeToRefs(useUserStore());
    const message = useMessage();
    const isAppMode = isApp();
    const showModal = ref(false);
    const showAppDateCalendar = ref(false);
    const appFilterMenuRef = ref<{ close: () => void } | null>(null);
    const loading = ref(false);
    const loadMoreLoading = ref(false);
    const tableData = ref<ApprovalRow[]>([]);
    const tableWrapRef = ref<HTMLElement | null>(null);
    const pcListScrollTop = ref(0);
    const appListRef = ref<HTMLElement | null>(null);
    const checkedRowKeys = ref<RowKey[]>([]);
    const checkedRows = ref<ApprovalRow[]>([]);
    const checkedRowMap = ref<Record<string, ApprovalRow>>({});
    const selectedRowMap = ref<Record<string, ApprovalRow>>({});
    const activeTab = ref<ApprovalTab>('initiated');
    const stableTab = ref<ApprovalTab>('initiated');
    const pageToken = ref('');
    const hasMore = ref(false);
    const hasLoaded = ref(false);
    const listRequestId = ref(0);
    const autoLoadCount = ref(0);
    const showDetailModal = ref(false);
    const detailLoading = ref(false);
    const detailData = ref<any>(null);
    const approvalUserNameMap = ref<Map<string, string>>(new Map());
    const selectedApprovalModule = ref<ApprovalModuleKey | null>(null);
    const approvalDateRange = ref<ApprovalDateRange>(null);

    const APPROVAL_STATUS_TEXT_MAP: Record<string, string> = {
        PENDING: '审批中',
        APPROVED: '已通过',
        REJECTED: '已拒绝',
        CANCELED: '已撤回',
        DELETED: '已删除',
        HIDDEN: '状态隐藏',
        TERMINATED: '审批终止',
        OVERTIME_CLOSE: '超时未处理被关闭',
        OVERTIME_RECOVER: '超时已关闭的任务被恢复',
    };

    /**
     * Select the supplied checkbox image for its current state.
     * @param checked Whether the checkbox is selected
     * @param indeterminate Whether the checkbox represents a partial selection
     * @returns The image URL for the checkbox state
     */
    const getApprovalCheckboxIcon = (checked: boolean, indeterminate = false): string => {
        if (indeterminate) return approvalCheckboxIndeterminateIcon;
        return checked ? approvalCheckboxSelectedIcon : approvalCheckboxNormalIcon;
    };

    const approvalTabs: Array<{ label: string; value: ApprovalTab }> = [
        { label: '我发起的', value: 'initiated' },
        { label: '我已办', value: 'done' },
        { label: '抄送我', value: 'ccMe' },
    ];

    const approvalModuleOptions = APPROVAL_MODULE_OPTIONS.map((item) => ({
        label: item.label,
        value: item.key,
    }));
    const approvalAppTabOptions = approvalTabs.map((item) => ({ text: item.label, value: item.value }));
    const approvalAppModuleOptions = [
        { text: '全部模块', value: null },
        ...approvalModuleOptions.map((item) => ({ text: item.label, value: item.value })),
    ];
    const activeTabLabel = computed(
        () => approvalTabs.find((item) => item.value === activeTab.value)?.label || '我发起的'
    );
    const approvalModuleLabel = computed(
        () => approvalModuleOptions.find((item) => item.value === selectedApprovalModule.value)?.label || '审批模块'
    );
    const appDateRangeLabel = computed(() => {
        if (!approvalDateRange.value) return '时间筛选';
        const startDate = approvalDateRange.value[0].slice(5, 10);
        const endDate = approvalDateRange.value[1].slice(5, 10);
        return `${startDate}-${endDate}`;
    });
    const appDateCalendarDefaultDate = computed(() =>
        approvalDateRange.value?.map((dateTime) => new Date(dateTime.replace(' ', 'T')))
    );

    const isTableFetching = computed(() => loading.value || loadMoreLoading.value);

    /** 按审批模块和发起时间过滤后的数据，PC 与 App 共用。 */
    const filteredTableData = computed(() =>
        tableData.value.filter((row) => {
            if (selectedApprovalModule.value && getApprovalModule(row)?.key !== selectedApprovalModule.value)
                return false;
            if (!approvalDateRange.value) return true;
            const startTime = getTimestamp(getStartTimeValue(row));
            if (!startTime) return false;
            const [rangeStart, rangeEnd] = approvalDateRange.value;
            return startTime >= getTimestamp(rangeStart) && startTime <= getTimestamp(rangeEnd);
        })
    );

    const isAppAllChecked = computed(() => {
        const selectableRows = filteredTableData.value.filter((row) => getRowKey(row) || getRowKey(row) === 0);
        return selectableRows.length > 0 && selectableRows.every((row) => isRowChecked(row));
    });
    const isAppIndeterminate = computed(() => {
        const selectableRows = filteredTableData.value.filter((row) => getRowKey(row) || getRowKey(row) === 0);
        const checkedCount = selectableRows.filter((row) => isRowChecked(row)).length;
        return checkedCount > 0 && checkedCount < selectableRows.length;
    });

    const isPcAllChecked = computed(() => {
        const rows = filteredTableData.value.filter((row) => getRowKey(row) || getRowKey(row) === 0);
        return rows.length > 0 && rows.every((row) => isRowChecked(row));
    });

    const isPcIndeterminate = computed(() => {
        const rows = filteredTableData.value.filter((row) => getRowKey(row) || getRowKey(row) === 0);
        const checkedCount = rows.filter((row) => isRowChecked(row)).length;
        return checkedCount > 0 && checkedCount < rows.length;
    });

    const selectedOptions = computed(() => {
        return normalizeModelValue(props.modelValue).map((key) => {
            const row = selectedRowMap.value[String(key)];
            return {
                key: String(key),
                label: getApprovalLabel(row, key),
            };
        });
    });

    const onlyShowOptions = computed(() => {
        if (!props.onlyShow) return [];
        const value = props.modelValue;
        const list = Array.isArray(value) ? value : value ? [value] : [];
        return list
            .filter((item): item is ApprovalRow => Boolean(item) && typeof item === 'object')
            .map((item) => ({
                ...item,
                approvalName: item.approvalName,
                instanceCode: item.instanceCode,
            }))
            .filter((item) => item.approvalName && item.instanceCode);
    });

    const getValueByPath = (row: ApprovalRow, path: string) => {
        return path.split('.').reduce((value, key) => {
            if (value === null || value === undefined) return undefined;
            return value[key];
        }, row as any);
    };

    /** 从审批列表/详情对象中读取第一个有值的字段。 */
    const getFirstValue = (row: ApprovalRow | null | undefined, keys: string[]) => {
        if (!row) return undefined;
        for (const key of keys) {
            const value = getValueByPath(row, key);
            if (value !== undefined && value !== null && value !== '') return value;
        }
        return undefined;
    };

    /** 将审批表单字段转换为统一的 key/value 数组，兼容后端 JSON 字符串和数组格式。 */
    const getFormEntries = (row: ApprovalRow | null | undefined) => {
        if (!row) return [] as ApprovalRow[];
        const formValue = getFirstValue(row, ['form', 'formData', 'formContent', 'formItems']);
        const entries = parseJsonSafely(formValue);
        return entries.filter((item: any) => item && typeof item === 'object');
    };

    /** 从表单字段名、字段 key 中查找表单项。 */
    const getFormItem = (row: ApprovalRow, names: string[]) => {
        const normalizedNames = names.map((name) => name.toLowerCase());
        return getFormEntries(row).find((entry: any) => {
            const text = String(entry.name || entry.label || entry.title || entry.key || entry.id || '').toLowerCase();
            return normalizedNames.some((name) => text === name || text.includes(name));
        });
    };

    /** 从表单字段名、字段 key 中查找审批值。 */
    const getFormValue = (row: ApprovalRow, names: string[]) => {
        const item = getFormItem(row, names);
        return item ? item.value ?? item.text ?? item.name : undefined;
    };

    /**
     * 读取列表记录中的审批模板编码，并映射到当前环境的模块配置。
     * @param row 审批列表或详情记录
     * @returns 匹配到的审批模块配置
     */
    const getApprovalModule = (row: ApprovalRow | null | undefined) => {
        if (!row) return undefined;
        const code = getFirstValue(row, [
            'approvalCode',
            'approval_code',
            'approval.code',
            'approval.approvalCode',
            'templateCode',
            'moduleCode',
        ]);
        if (code) {
            const option = APPROVAL_CODE_MAP[String(code).toUpperCase()];
            if (option) return option;
        }
        // 审批类型只允许由 approvalCode 决定，避免同名审批流程被错误归类。
        return undefined;
    };

    const getStartTimeValue = (row: ApprovalRow) =>
        getFirstValue(row, [
            'startTime',
            'start_time',
            'instance.startTime',
            'createTime',
            'createdAt',
            'initiatedAt',
        ]) ?? getFormValue(row, ['发起时间', '申请时间', '开始时间', 'starttime']);

    const getInitiatorValue = (row: ApprovalRow) => {
        const value = getFirstValue(row, [
            'initiatorName',
            'applicantName',
            'creatorName',
            'userName',
            'user_name',
            'initiator',
            'applicant',
            'userId',
            'creator',
        ]);
        return value === undefined
            ? formatApprovalUserByUserId(getFormValue(row, ['发起人', '申请人', 'initiator', 'applicant']))
            : formatApprovalUserByUserId(value);
    };

    const getSerialNumberValue = (row: ApprovalRow) =>
        formatDetailValue(
            getFirstValue(row, ['serialNumber', 'serialNo', 'serialId', 'number', 'instance.serialId']) ??
                getFormValue(row, ['流水号', '编号', 'serial'])
        );

    const getFieldValue = (row: ApprovalRow, keys: string[], formNames: string[]) => {
        const value = getFirstValue(row, keys) ?? getFormValue(row, formNames);
        return formatDetailValue(value);
    };

    const getPersonFieldValue = (row: ApprovalRow, keys: string[], formNames: string[]) => {
        const value = getFirstValue(row, keys) ?? getFormValue(row, formNames);
        return formatApprovalUserByUserId(value);
    };

    const getAttachmentValue = (row: ApprovalRow) => {
        const attachmentItem = getFormItem(row, ['附件', '附件文件', '结算资料', 'attachment', 'file']);
        const value =
            getFirstValue(row, ['attachments', 'attachmentUrls', 'attachment', 'fileUrl', 'files']) ??
            attachmentItem?.value;
        const ext = attachmentItem?.ext;
        if (typeof ext === 'string' && ext.trim()) {
            return ext
                .split(',')
                .map((name) => name.trim())
                .filter(Boolean)
                .join('，');
        }
        if (value === undefined) return '--';
        const list = Array.isArray(value) ? value : [value];
        const names = list
            .map((item: any) => {
                if (item && typeof item === 'object')
                    return item.originalName || item.fileName || item.name || item.title || item.url;
                return String(item);
            })
            .filter(Boolean);
        return names.join('，') || '--';
    };

    /**
     * 根据审批模块返回截图要求的卡片字段。
     * @param row 审批列表或详情记录
     * @returns 卡片字段列表
     */
    const getApprovalFieldEntries = (row: ApprovalRow) => {
        const module = getApprovalModule(row)?.key;
        const common = [
            { key: 'initiator', label: '发起人', value: getInitiatorValue(row) },
            { key: 'startTime', label: '发起时间', value: formatTime(getStartTimeValue(row)) || '--' },
        ];
        const fieldMap: Record<string, Array<{ key: string; label: string; value: string }>> = {
            contractPricing: [
                {
                    key: 'department',
                    label: '部门',
                    value: getFieldValue(row, ['departmentName', 'deptName', 'department'], ['部门', 'department']),
                },
                {
                    key: 'applicant',
                    label: '申请人',
                    value: getPersonFieldValue(row, ['applicantName', 'applicant'], ['申请人', 'applicant']),
                },
                {
                    key: 'company',
                    label: '定价所属公司',
                    value: getFieldValue(
                        row,
                        ['pricingCompanyName', 'pricingCompany', 'companyName', 'company'],
                        ['定价所属公司', '所属公司', 'company']
                    ),
                },
            ],
            monthlyDispatch: [
                {
                    key: 'reason',
                    label: '事由',
                    value: getFieldValue(
                        row,
                        ['reason', 'applicationReason', 'instruction', 'remark'],
                        ['事由', '申请事由', '事项说明', 'reason']
                    ),
                },
                { key: 'attachmentName', label: '附件文件名称', value: getAttachmentValue(row) },
                { key: 'attachment', label: '附件', value: getAttachmentValue(row) },
            ],
            framework: [
                { key: 'serialNumber', label: '流水号', value: getSerialNumberValue(row) },
                {
                    key: 'contractName',
                    label: '合同名称',
                    value: getFieldValue(row, ['contractName', 'name'], ['合同名称', 'contractName']),
                },
                {
                    key: 'supplier',
                    label: '供方单位',
                    value: getFieldValue(row, ['supplierName', 'supplierUnit', 'supplier'], ['供方单位', 'supplier']),
                },
            ],
            chemicalPricing: [
                {
                    key: 'department',
                    label: '部门',
                    value: getFieldValue(row, ['departmentName', 'deptName', 'department'], ['部门', 'department']),
                },
                {
                    key: 'applicant',
                    label: '申请人',
                    value: getPersonFieldValue(row, ['applicantName', 'applicant'], ['申请人', 'applicant']),
                },
                {
                    key: 'company',
                    label: '所属公司',
                    value: getFieldValue(row, ['companyName', 'company'], ['所属公司', 'company']),
                },
            ],
            traderPricing: [
                {
                    key: 'department',
                    label: '部门',
                    value: getFieldValue(row, ['departmentName', 'deptName', 'department'], ['部门', 'department']),
                },
                {
                    key: 'applicant',
                    label: '申请人',
                    value: getPersonFieldValue(row, ['applicantName', 'applicant'], ['申请人', 'applicant']),
                },
                {
                    key: 'company',
                    label: '所属公司',
                    value: getFieldValue(row, ['companyName', 'company'], ['所属公司', 'company']),
                },
            ],
            salesContract: [
                { key: 'serialNumber', label: '流水号', value: getSerialNumberValue(row) },
                {
                    key: 'contractName',
                    label: '合同名称',
                    value: getFieldValue(row, ['contractName', 'name'], ['合同名称', 'contractName']),
                },
                {
                    key: 'supplier',
                    label: '供方单位',
                    value: getFieldValue(row, ['supplierName', 'supplierUnit', 'supplier'], ['供方单位', 'supplier']),
                },
            ],
            financeSettlement: [
                {
                    key: 'department',
                    label: '部门',
                    value: getFieldValue(row, ['departmentName', 'deptName', 'department'], ['部门', 'department']),
                },
                {
                    key: 'reason',
                    label: '申请事由',
                    value: getFieldValue(
                        row,
                        ['reason', 'applicationReason', 'instruction', 'remark'],
                        ['申请事由', '事由', '事项说明', 'reason']
                    ),
                },
            ],
        };
        return [...common, ...(fieldMap[module || ''] || [])];
    };

    const getTimestamp = (value: any) => {
        if (value === undefined || value === null || value === '') return 0;
        const valueText = String(value);
        const timestamp = Number(value);
        const date =
            Number.isFinite(timestamp) && /^\d+$/.test(valueText)
                ? new Date(valueText.length === 10 ? timestamp * 1000 : timestamp)
                : new Date(valueText);
        const time = date.getTime();
        return Number.isNaN(time) ? 0 : time;
    };

    const formatTime = (value: any) => {
        if (!value && value !== 0) return '';
        const valueText = String(value);
        const timestamp = Number(value);
        const date =
            Number.isFinite(timestamp) && /^\d+$/.test(valueText)
                ? new Date(valueText.length === 10 ? timestamp * 1000 : timestamp)
                : new Date(valueText);
        if (Number.isNaN(date.getTime())) return String(value);

        const pad = (num: number) => String(num).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(
            date.getMinutes()
        )}:${pad(date.getSeconds())}`;
    };

    const getRowKey = (row?: ApprovalRow) =>
        row
            ? getValueByPath(row, props.rowKey) || row.id || row.instanceId || row.code || row.instance?.code
            : undefined;

    const getApprovalLabel = (row: ApprovalRow | undefined, key: RowKey) => {
        if (!row) return String(key);

        const labelKeys = [
            'approvalName',
            'approval.name',
            'approvalInstanceName',
            'name',
            'title',
            'serialId',
            'instanceCode',
            'instance.code',
            'id',
        ];
        const labelKey = labelKeys.find((item) => {
            const value = getValueByPath(row, item);
            return value || value === 0;
        });
        const label = labelKey ? getValueByPath(row, labelKey) : '';
        return label || label === 0 ? String(label) : String(key);
    };

    const getApprovalCardName = (row: ApprovalRow) => {
        return row.approvalName || getValueByPath(row, 'approval.name') || row.approvalInstanceName || row.name || '--';
    };

    const getApprovalCardStatus = (row: ApprovalRow) =>
        getFirstValue(row, ['status', 'approvalStatus', 'state', 'instance.status', 'instance.state']);

    const getFeishuUserId = () => {
        if (import.meta.env.VITE_NODE === 'development') {
            return '5f3d9da8';
        } else {
            const info = userInfo.value || {};
            return info.larkUserId;
        }
    };

    const getModelRows = (value: typeof props.modelValue) => {
        if (props.valueFormat !== 'object') return [];
        if (Array.isArray(value)) return value.filter((item) => item && typeof item === 'object') as ApprovalRow[];
        if (value && typeof value === 'object') return [value as ApprovalRow];
        return [];
    };

    const normalizeModelValue = (value: typeof props.modelValue) => {
        if (props.valueFormat === 'object') {
            if (Array.isArray(value)) {
                return value
                    .map((item) => (item && typeof item === 'object' ? getRowKey(item as ApprovalRow) : item))
                    .filter((item) => item || item === 0) as RowKey[];
            }
            if (value && typeof value === 'object') {
                const key = getRowKey(value as ApprovalRow);
                return key || key === 0 ? [key] : [];
            }
        }
        if (Array.isArray(value)) return value;
        if (props.multiple && props.valueFormat === 'string' && typeof value === 'string') {
            return value.split(props.separator).filter(Boolean);
        }
        if (value || value === 0) return [value];
        return [];
    };

    const syncCheckedFromValue = () => {
        checkedRowKeys.value = normalizeModelValue(props.modelValue);
        selectedRowMap.value = [...getModelRows(props.modelValue), ...(props.selectedRows || [])].reduce(
            (map, row) => {
                const key = getRowKey(row);
                if (key || key === 0) {
                    map[String(key)] = row;
                }
                return map;
            },
            { ...selectedRowMap.value } as Record<string, ApprovalRow>
        );
        checkedRowMap.value = { ...selectedRowMap.value };
        checkedRows.value = checkedRowKeys.value.map((key) => checkedRowMap.value[String(key)]).filter(Boolean);
    };

    const normalizeListData = (data: any) => {
        const records = Array.isArray(data) ? data : data?.records || data?.list || data?.rows || data?.data || [];
        return Array.isArray(records) ? records : [];
    };

    const getInstanceId = (row: ApprovalRow) =>
        props.onlyShow
            ? row.instanceCode
            : row.instanceCode || getValueByPath(row, 'instance.code') || row.instanceId || row.code || getRowKey(row);

    const dedupeRecords = (records: ApprovalRow[]) => {
        const map = new Map<string, ApprovalRow>();
        records.forEach((row) => {
            const key = getInstanceId(row);
            if (key || key === 0) {
                map.set(String(key), row);
                return;
            }
            map.set(JSON.stringify(row), row);
        });
        return Array.from(map.values());
    };

    const getTableScrollElement = () => {
        const wrapper = tableWrapRef.value;
        if (!wrapper) return null;
        return (wrapper.querySelector('.n-data-table-base-table-body') ||
            wrapper.querySelector('.n-scrollbar-container') ||
            wrapper) as HTMLElement | null;
    };

    const savePcListScrollPosition = () => {
        const scrollElement = getTableScrollElement();
        if (scrollElement) pcListScrollTop.value = scrollElement.scrollTop;
    };

    const restorePcListScrollPosition = () => {
        if (isAppMode) return;
        nextTick(() => {
            const scrollElement = getTableScrollElement();
            if (scrollElement) scrollElement.scrollTop = pcListScrollTop.value;
        });
    };

    /**
     * Load another page when the active list has no scrollbar after applying client-side filters.
     * @param requestId Current list request identifier
     * @param requestTab Tab associated with the current list request
     * @returns Nothing
     */
    const checkAndAutoLoadMore = async (requestId: number, requestTab: ApprovalTab) => {
        await nextTick();
        if (requestId !== listRequestId.value || requestTab !== activeTab.value) return;
        if (isAppMode && !showModal.value) return;
        if (!hasMore.value || !pageToken.value || loading.value || loadMoreLoading.value) return;
        if (autoLoadCount.value >= MAX_AUTO_LOAD_COUNT) return;

        const scrollElement = isAppMode ? appListRef.value : getTableScrollElement();
        if (!scrollElement || !scrollElement.clientHeight) return;
        if (scrollElement.scrollHeight > scrollElement.clientHeight + 1) return;

        autoLoadCount.value += 1;
        await loadApprovalList(true, requestId, requestTab);
    };

    const handleAppPopupOpened = () => {
        checkAndAutoLoadMore(listRequestId.value, activeTab.value);
    };

    const getListApi = (tab = activeTab.value) => {
        if (tab === 'done') return listDoneApprovalInstances;
        if (tab === 'ccMe') return listCcMeApprovalInstances;
        return listApprovalInstances;
    };

    const buildListParams = (isLoadMore: boolean, tab = activeTab.value) => {
        const params: Record<string, any> = {
            userId: getFeishuUserId(),
        };
        if (isLoadMore && pageToken.value) {
            params.pageToken = pageToken.value;
        }
        if (tab === 'initiated') {
            params.status = props.status || 'APPROVED';
        }
        // 使用原审批列表接口已有的 approvalCode 查询参数，不新增接口协议。
        const approvalModule = selectedApprovalModule.value
            ? APPROVAL_MODULE_OPTIONS.find((item) => item.key === selectedApprovalModule.value)
            : undefined;
        if (approvalModule?.approvalCode || props.approvalCode) {
            params.approvalCode = approvalModule?.approvalCode || props.approvalCode;
        }
        if (approvalDateRange.value) {
            const [startTime, endTime] = approvalDateRange.value;
            params.startTime = startTime;
            params.endTime = endTime;
        }
        return params;
    };

    const loadApprovalList = async (
        isLoadMore = false,
        requestId = ++listRequestId.value,
        requestTab = activeTab.value
    ) => {
        if (isLoadMore) {
            loadMoreLoading.value = true;
        } else {
            loading.value = true;
            pageToken.value = '';
            hasMore.value = false;
            autoLoadCount.value = 0;
        }
        let shouldCheckAutoLoad = false;
        try {
            const res = await getListApi(requestTab)(buildListParams(isLoadMore, requestTab));
            if (requestId !== listRequestId.value || requestTab !== activeTab.value) return;
            const pageData = res?.data || res;
            const records = normalizeListData(pageData);
            tableData.value = isLoadMore ? dedupeRecords(tableData.value.concat(records)) : dedupeRecords(records);
            pageToken.value = pageData?.pageToken || '';
            hasMore.value = Boolean(pageData?.hasMore);
            if (!records.length && hasMore.value && pageToken.value) {
                await loadApprovalList(true, requestId, requestTab);
                return;
            }
            tableData.value.forEach((row) => {
                const key = getRowKey(row);
                if (key || key === 0) {
                    selectedRowMap.value[String(key)] = row;
                    checkedRowMap.value[String(key)] = row;
                }
            });
            checkedRows.value = checkedRowKeys.value.map((key) => checkedRowMap.value[String(key)]).filter(Boolean);
            hasLoaded.value = true;
            stableTab.value = requestTab;
            shouldCheckAutoLoad = true;
        } catch (error) {
            if (requestId === listRequestId.value) {
                tableData.value = isLoadMore ? tableData.value : [];
                message.error('获取审批列表失败');
            }
            console.error('获取审批列表失败', error);
        } finally {
            if (requestId === listRequestId.value) {
                loading.value = false;
                loadMoreLoading.value = false;
                if (requestTab === activeTab.value && shouldCheckAutoLoad) {
                    await checkAndAutoLoadMore(requestId, requestTab);
                }
            }
        }
    };

    const openModal = () => {
        if (props.onlyShow) return;
        showDetailModal.value = false;
        showModal.value = true;
        restorePcListScrollPosition();
        if (hasLoaded.value) autoLoadCount.value = 0;
        if (!selectedApprovalModule.value && props.approvalCode) {
            selectedApprovalModule.value = APPROVAL_CODE_MAP[String(props.approvalCode).toUpperCase()]?.key || null;
        }
        syncCheckedFromValue();
        if (!hasLoaded.value) {
            loadApprovalList();
        }
    };

    const closeModal = () => {
        savePcListScrollPosition();
        showModal.value = false;
        showDetailModal.value = false;
    };

    const handleTabChange = (tab: ApprovalTab) => {
        if (isTableFetching.value) {
            activeTab.value = stableTab.value;
            return;
        }
        activeTab.value = tab;
        tableData.value = [];
        autoLoadCount.value = 0;
        loadApprovalList(false, undefined, tab);
    };

    /** 使用原审批列表接口的审批编码参数重新查询所选模块。 */
    const handleModuleChange = () => {
        autoLoadCount.value = 0;
        tableData.value = [];
        loadApprovalList(false, undefined, activeTab.value);
    };

    /** 选择发起时间范围后，按精确到秒的开始、结束时间重新查询审批列表。 */
    const handleDateRangeChange = (value: ApprovalDateRange) => {
        approvalDateRange.value = value;
        autoLoadCount.value = 0;
        tableData.value = [];
        loadApprovalList(false, undefined, activeTab.value);
    };

    const openAppDateCalendar = () => {
        if (isTableFetching.value) return;
        appFilterMenuRef.value?.close();
        showAppDateCalendar.value = true;
    };

    /**
     * Format a calendar date as the inclusive start or end of a day for the shared list query.
     * @param date Selected calendar date
     * @param endOfDay Whether to use the end-of-day boundary
     * @returns A local date-time string matching the PC range query format
     */
    const formatAppDateRangeBoundary = (date: Date, endOfDay: boolean): string => {
        const dateText = formatTime(date.getTime()).slice(0, 10);
        return `${dateText} ${endOfDay ? '23:59:59' : '00:00:00'}`;
    };

    /**
     * Apply the App calendar range through the same query handler used by the PC date picker.
     * @param dates Calendar range start and end dates
     * @returns Nothing
     */
    const handleAppDateRangeConfirm = (dates: Date[]) => {
        if (isTableFetching.value) return;
        const [startDate, selectedEndDate] = dates;
        if (!startDate) return;
        const endDate = selectedEndDate || startDate;
        handleDateRangeChange([
            formatAppDateRangeBoundary(startDate, false),
            formatAppDateRangeBoundary(endDate, true),
        ]);
        showAppDateCalendar.value = false;
        appFilterMenuRef.value?.close();
    };

    const clearAppDateRange = () => {
        if (isTableFetching.value) return;
        handleDateRangeChange(null);
        appFilterMenuRef.value?.close();
    };

    const isDateDisabled = () => false;

    const loadMore = () => {
        if (!hasMore.value || loadMoreLoading.value) return;
        loadApprovalList(true);
    };

    const handleTableScroll = (event: Event) => {
        const target = event.target as HTMLElement;
        if (!target) return;
        pcListScrollTop.value = target.scrollTop;
        if (loading.value || loadMoreLoading.value || !hasMore.value) return;
        if (target.scrollHeight <= target.clientHeight + 1) return;
        if (target.scrollTop + target.clientHeight >= target.scrollHeight - 16) {
            loadMore();
        }
    };

    const handlePcRowChecked = (row: ApprovalRow, checked: boolean) => {
        setAppRowChecked(row, checked);
    };

    const togglePcAllRows = (checked: boolean) => {
        filteredTableData.value.forEach((row) => setAppRowChecked(row, checked));
    };

    const isRowChecked = (row: ApprovalRow) => {
        const key = getRowKey(row);
        if (!key && key !== 0) return false;
        return checkedRowKeys.value.some((item) => String(item) === String(key));
    };

    const setAppRowChecked = (row: ApprovalRow, checked: boolean) => {
        const key = getRowKey(row);
        if (!key && key !== 0) return;
        const stringKey = String(key);
        if (props.multiple) {
            const nextKeyMap = new Map<string, RowKey>();
            checkedRowKeys.value.forEach((item) => nextKeyMap.set(String(item), item));
            if (checked) {
                nextKeyMap.set(stringKey, key);
                checkedRowMap.value[stringKey] = row;
            } else {
                nextKeyMap.delete(stringKey);
                delete checkedRowMap.value[stringKey];
            }
            checkedRowKeys.value = Array.from(nextKeyMap.values());
            checkedRows.value = checkedRowKeys.value.map((item) => checkedRowMap.value[String(item)]).filter(Boolean);
            return;
        }
        checkedRowKeys.value = checked ? [key] : [];
        checkedRows.value = checked ? [row] : [];
        checkedRowMap.value = checked ? { [stringKey]: row } : {};
    };

    const toggleAppRow = (row: ApprovalRow) => {
        setAppRowChecked(row, !isRowChecked(row));
    };

    const handleAppRowChecked = (row: ApprovalRow, checked: boolean) => {
        setAppRowChecked(row, checked);
    };

    const toggleAppAllRows = (checked: boolean) => {
        if (!props.multiple) return;
        filteredTableData.value.forEach((row) => {
            setAppRowChecked(row, checked);
        });
    };

    const handleAppListScroll = (event: Event) => {
        const target = event.target as HTMLElement;
        if (!target || loading.value || loadMoreLoading.value || !hasMore.value) return;
        if (target.scrollHeight <= target.clientHeight + 1) return;
        if (target.scrollTop + target.clientHeight >= target.scrollHeight - 24) {
            loadMore();
        }
    };

    const emitSelectionChange = (uniqueRows: ApprovalRow[], uniqueKeys: RowKey[], closeAfterChange = false) => {
        const value = !uniqueKeys.length
            ? props.multiple
                ? props.valueFormat === 'string'
                    ? ''
                    : props.valueFormat === 'object'
                    ? []
                    : []
                : null
            : props.valueFormat === 'object'
            ? props.multiple
                ? uniqueRows
                : uniqueRows[0] || null
            : props.multiple && props.valueFormat === 'string'
            ? uniqueKeys.join(props.separator)
            : props.multiple
            ? uniqueKeys
            : uniqueKeys[0];
        emit('update:modelValue', value);
        emit('update:selectedRows', uniqueRows);
        emit('change', {
            value,
            rows: uniqueRows,
        });
        selectedRowMap.value = uniqueRows.reduce(
            (map, row) => {
                const key = getRowKey(row);
                if (key || key === 0) {
                    map[String(key)] = row;
                }
                return map;
            },
            { ...selectedRowMap.value } as Record<string, ApprovalRow>
        );
        if (closeAfterChange) {
            closeModal();
        }
    };

    const handleConfirm = () => {
        const uniqueRows = dedupeRecords(checkedRows.value);
        const uniqueKeys = uniqueRows.map((row) => getRowKey(row)).filter((key) => key || key === 0) as RowKey[];
        emitSelectionChange(uniqueRows, uniqueKeys, true);
    };

    const removeSelectedOption = (key: RowKey) => {
        syncCheckedFromValue();
        const stringKey = String(key);
        const nextKeys = normalizeModelValue(props.modelValue).filter((item) => String(item) !== stringKey);
        const rowMap = { ...selectedRowMap.value, ...checkedRowMap.value };
        const nextRows = nextKeys.map((item) => rowMap[String(item)]).filter(Boolean);
        delete checkedRowMap.value[stringKey];
        delete selectedRowMap.value[stringKey];
        checkedRowKeys.value = nextKeys;
        checkedRows.value = nextRows;
        emitSelectionChange(nextRows, nextKeys);
    };

    const normalizeDetailResponse = (res: any) => {
        const data = res?.data || res;
        if (data?.data && (data.data.instanceCode || data.data.approvalName || data.data.form || data.data.taskList)) {
            return data.data;
        }
        return data || null;
    };

    const parseJsonSafely = (value: any) => {
        if (Array.isArray(value)) return value;
        if (typeof value !== 'string') return [];
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    };

    /**
     * 按审批金额字段携带的币种格式化金额。
     * @param value 金额数值
     * @param item 审批表单金额字段
     * @returns 格式化后的金额文本
     */
    const formatAmountValue = (value: any, item: any = {}) => {
        const amount = Number(value);
        if (!Number.isFinite(amount)) return String(value);

        const currency = String(item.ext?.currency || 'CNY').toUpperCase();
        let amountText = '';
        try {
            amountText = new Intl.NumberFormat('zh-CN', {
                style: 'currency',
                currency,
            }).format(amount);
        } catch {
            amountText = `${currency} ${new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 2 }).format(amount)}`;
        }

        return amountText;
    };

    const isDescriptionFormItem = (item: any = {}) => String(item.type || '').toLowerCase() === 'text';

    const formatDetailValue = (value: any, item?: any): string => {
        if (value === null || value === undefined || value === '') return '--';
        if (isAttachmentFormItem(item)) {
            return getAttachmentValue({ form: [{ ...item, value }] });
        }
        if (String(item?.type || '').toLowerCase() === 'amount') {
            return formatAmountValue(value, item);
        }
        if (['number', 'formula'].includes(String(item?.type || '').toLowerCase())) {
            const numberValue = Number(value);
            if (Number.isFinite(numberValue)) {
                return new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 2 }).format(numberValue);
            }
        }
        if (isDescriptionFormItem(item)) {
            return String(value).trim() || '--';
        }
        if (isDateIntervalFormItem(item)) {
            return formatDateIntervalValue(value);
        }
        if (isDepartmentFormItem(item)) {
            return formatNamedObjectValue(value);
        }
        if (isUserFormItem(item)) {
            return formatApprovalContactValue(value, item);
        }
        if (item?.option?.text) return item.option.text;
        if (Array.isArray(value)) {
            return value
                .map((child) => {
                    if (child && typeof child === 'object') {
                        return child.name || child.text || child.value || child.open_id || JSON.stringify(child);
                    }
                    return child;
                })
                .join('，');
        }
        if (typeof value === 'object') {
            if (value.start || value.end) {
                return [formatTime(value.start), formatTime(value.end)].filter(Boolean).join(' 至 ');
            }
            return value.name || value.text || value.value || JSON.stringify(value);
        }
        return String(value);
    };

    const formatNamedObjectValue = (value: any) => {
        const list = Array.isArray(value) ? value : [value];
        const text = list
            .map((child) => {
                if (child && typeof child === 'object') {
                    return child.name || child.text || child.value || child.open_id || '';
                }
                return child;
            })
            .filter((child) => child || child === 0)
            .join('，');
        return text || '--';
    };

    const formatDetailLabel = (item: any, index: number) => {
        if (isDateIntervalFormItem(item)) return '开始结束时间';
        return item.name || `字段${index + 1}`;
    };

    const formatDateIntervalValue = (value: any) => {
        if (Array.isArray(value)) {
            return [formatTime(value[0]), formatTime(value[1])].filter(Boolean).join(' 至 ') || '--';
        }
        if (value && typeof value === 'object') {
            const start = value.start || value.startTime || value.begin || value.beginTime;
            const end = value.end || value.endTime || value.finish || value.finishTime;
            return [formatTime(start), formatTime(end)].filter(Boolean).join(' 至 ') || '--';
        }
        return formatTime(value) || String(value || '--');
    };

    const formatApprovalStatus = (status: any) => {
        if (!status && status !== 0) return '--';
        const statusKey = String(status).toUpperCase();
        return APPROVAL_STATUS_TEXT_MAP[statusKey] || statusKey;
    };

    const formatApprovalUserByUserId = (userId: any) => {
        if (!userId && userId !== 0) return '--';
        if (Array.isArray(userId)) {
            return userId.map((item) => formatApprovalUserByUserId(item)).join('，');
        }
        const normalizedUserId =
            typeof userId === 'object'
                ? userId.userId || userId.open_id || userId.openId || userId.larkUserId || userId.id || userId.value
                : userId;
        if (!normalizedUserId && normalizedUserId !== 0) return '--';
        const userIdText = String(normalizedUserId);
        return approvalUserNameMap.value.get(userIdText) || userIdText;
    };

    /**
     * 使用联系人的 open_id 查询姓名，找不到时回退到表单返回的用户 ID。
     * @param value 表单返回的用户 ID 或用户 ID 列表
     * @param item 联系人表单项，可能包含 open_ids
     * @returns 联系人姓名文本
     */
    const formatApprovalContactValue = (value: any, item: any = {}) => {
        const userIds = Array.isArray(value) ? value : [value];
        const openIds = Array.isArray(item.open_ids)
            ? item.open_ids
            : Array.isArray(item.openIds)
              ? item.openIds
              : [];
        if (!openIds.length) return formatApprovalUserByUserId(value);

        const names = userIds.map((userId, index) => {
            const openId = openIds[index];
            const mappedName = openId ? approvalUserNameMap.value.get(String(openId)) : undefined;
            return mappedName || formatApprovalUserByUserId(userId);
        });
        return names.filter((name) => name && name !== '--').join('，') || '--';
    };

    const isAttachmentFormItem = (item: any = {}) => {
        const type = String(item.type || '').toLowerCase();
        const name = String(item.name || '').toLowerCase();
        const keyText = String(item.key || item.id || '').toLowerCase();
        return (
            type.includes('attachment') ||
            name.includes('附件') ||
            keyText.includes('attachment') ||
            keyText.includes('file') ||
            keyText.includes('approveurl')
        );
    };

    const isDateIntervalFormItem = (item: any = {}) => String(item.name || '') === 'DateInterval';

    const isDepartmentFormItem = (item: any = {}) => {
        const type = String(item.type || '').toLowerCase();
        const name = String(item.name || '');
        return type === 'department' || name.includes('部门');
    };

    const isUserFormItem = (item: any = {}) => {
        const name = String(item.name || item.label || item.title || '');
        const keyText = String(item.key || item.id || '').toLowerCase();
        return (
            name.includes('申请人') ||
            name.includes('发起人') ||
            keyText.includes('applicant') ||
            keyText.includes('initiator')
        );
    };

    /**
     * 将审批表单中的附件值转换成系统附件组件使用的文件对象。
     * @param item 审批表单附件字段
     * @returns 包含 fileId、url 和 fileName 的附件列表
     */
    const getDetailAttachmentFiles = (item: any = {}) => {
        const value = item.value;
        if (value === null || value === undefined || value === '') return [];

        const values = Array.isArray(value) ? value : [value];
        const extFileNames = Array.isArray(item.ext)
            ? item.ext.map((name: any) => String(name || '').trim()).filter(Boolean)
            : String(item.ext || '')
                  .split(',')
                  .map((name) => name.trim())
                  .filter(Boolean);

        return values
            .map((file: any, index: number) => {
                const fileData = file && typeof file === 'object' ? file : {};
                const url = typeof file === 'string' ? file : fileData.url || fileData.fileUrl || fileData.file_url;
                if (!url) return null;

                const extFileName = extFileNames[index] || (extFileNames.length === 1 ? extFileNames[0] : '');
                let urlFileName = '';
                try {
                    const parsedUrl = new URL(String(url));
                    const hashPath = parsedUrl.hash.replace(/^#/, '');
                    urlFileName = (hashPath || parsedUrl.pathname).split('/').pop() || '';
                } catch {
                    urlFileName = String(url).split(/[?#]/)[0].split('/').pop() || '';
                }

                return {
                    ...fileData,
                    fileId: fileData.fileId || fileData.id || `${item.id || 'approval-attachment'}-${index}`,
                    url,
                    fileName:
                        fileData.fileName ||
                        fileData.originalName ||
                        fileData.name ||
                        fileData.title ||
                        extFileName ||
                        urlFileName ||
                        '附件',
                    fileSize: fileData.fileSize || fileData.size,
                };
            })
            .filter(Boolean);
    };

    /**
     * 将 fieldList 字段中的每条明细转换为可读的字段名和值。
     * @param item 审批表单明细列表字段
     * @returns 按明细行分组的字段列表
     */
    const getDetailFieldListRows = (item: any = {}) => {
        const values = Array.isArray(item.value) ? item.value : [];
        if (!values.length) return [];

        const rows = Array.isArray(values[0]) ? values : [values];
        return rows.map((row: any, rowIndex: number) => {
            const fields = Array.isArray(row) ? row : [];
            return {
                key: `${item.id || 'field-list'}-${rowIndex}`,
                fields: fields
                    .filter((field: any) => field && typeof field === 'object')
                    .map((field: any, fieldIndex: number) => ({
                        key: `${rowIndex}-${field.id || fieldIndex}`,
                        name: field.name || `字段${fieldIndex + 1}`,
                        value: formatDetailValue(field.value, field),
                    })),
            };
        });
    };

    const detailFormItems = computed(() => {
        if (!detailData.value) return [];
        const formItems = parseJsonSafely(detailData.value?.form);
        if (formItems.length) {
            return formItems.map((item: any, index: number) => {
                const isAttachment = isAttachmentFormItem(item);
                const isFieldList = String(item.type || '').toLowerCase() === 'fieldlist';
                return {
                    key: item.id || `${item.name}-${index}`,
                    name: formatDetailLabel(item, index),
                    type: isAttachment ? 'attachment' : isFieldList ? 'fieldList' : 'field',
                    fieldType: String(item.type || '').toLowerCase(),
                    value: isFieldList ? '--' : formatDetailValue(item.value, item),
                    files: isAttachment ? getDetailAttachmentFiles(item) : [],
                    rows: isFieldList ? getDetailFieldListRows(item) : [],
                };
            });
        }
        return getApprovalFieldEntries(detailData.value).map((item) => ({
            key: item.key,
            name: item.label,
            type: 'field',
            fieldType: '',
            value: item.value,
            files: [],
            rows: [],
        }));
    });

    /**
     * 判断审批表单项是否需要独占一行，便于长文本说明保持设计图中的可读宽度。
     * @param item 审批表单项
     * @returns 是否使用整行布局
     */
    const isWideFormItem = (item: { name?: string; type?: string; value?: string }) => {
        if (item.type === 'attachment' || item.type === 'fieldList') return true;
        const label = String(item.name || '');
        return ['说明', '事项说明', '审批备注', '备注', '申请事由'].some((keyword) => label.includes(keyword));
    };

    const detailTaskList = computed(() => {
        const tasks: any[] = Array.isArray(detailData.value?.taskList) ? detailData.value.taskList : [];
        return tasks.map((task, index) => ({
            ...task,
            renderKey: task.id || `${task.nodeName || task.name || 'task'}-${index}`,
            displayNodeName: task.nodeName || task.name || `审批节点${index + 1}`,
            showConnector: index < tasks.length - 1,
        }));
    });

    const handlePcDetailBack = () => {
        showDetailModal.value = false;
        restorePcListScrollPosition();
    };

    const openDetail = async (row: ApprovalRow) => {
        const instanceId = getInstanceId(row);
        if (!instanceId) {
            message.warning('缺少审批实例编号，无法查看详情');
            return;
        }
        if (!isAppMode) {
            savePcListScrollPosition();
            showModal.value = true;
        }
        showDetailModal.value = true;
        detailLoading.value = true;
        detailData.value = null;
        try {
            const [res, userNameMap] = await Promise.all([
                getApprovalInstanceDetail({ instanceId }),
                getApprovalUserNameMap(),
            ]);
            approvalUserNameMap.value = userNameMap;
            detailData.value = normalizeDetailResponse(res);
        } catch (error) {
            message.error('获取审批详情失败');
            console.error('获取审批详情失败', error);
        } finally {
            detailLoading.value = false;
        }
    };

    watch(
        () => [props.modelValue, props.selectedRows],
        () => {
            if (!showModal.value) {
                syncCheckedFromValue();
            }
        },
        { immediate: true, deep: true }
    );

    return {
        props,
        APPROVAL_FILTER_MIN_DATE,
        APPROVAL_FILTER_MAX_DATE,
        userInfo,
        message,
        isAppMode,
        showModal,
        showAppDateCalendar,
        appFilterMenuRef,
        loading,
        loadMoreLoading,
        tableData,
        tableWrapRef,
        pcListScrollTop,
        appListRef,
        checkedRowKeys,
        checkedRows,
        checkedRowMap,
        selectedRowMap,
        activeTab,
        stableTab,
        pageToken,
        hasMore,
        hasLoaded,
        listRequestId,
        autoLoadCount,
        showDetailModal,
        detailLoading,
        detailData,
        approvalUserNameMap,
        selectedApprovalModule,
        approvalDateRange,
        APPROVAL_STATUS_TEXT_MAP,
        getApprovalCheckboxIcon,
        approvalTabs,
        approvalModuleOptions,
        approvalAppTabOptions,
        approvalAppModuleOptions,
        activeTabLabel,
        approvalModuleLabel,
        appDateRangeLabel,
        appDateCalendarDefaultDate,
        isTableFetching,
        filteredTableData,
        isAppAllChecked,
        isAppIndeterminate,
        isPcAllChecked,
        isPcIndeterminate,
        selectedOptions,
        onlyShowOptions,
        getValueByPath,
        getFirstValue,
        getFormEntries,
        getFormItem,
        getFormValue,
        getApprovalModule,
        getStartTimeValue,
        getInitiatorValue,
        getSerialNumberValue,
        getFieldValue,
        getPersonFieldValue,
        getAttachmentValue,
        getApprovalFieldEntries,
        getTimestamp,
        formatTime,
        getRowKey,
        getApprovalLabel,
        getApprovalCardName,
        getApprovalCardStatus,
        getFeishuUserId,
        getModelRows,
        normalizeModelValue,
        syncCheckedFromValue,
        normalizeListData,
        getInstanceId,
        dedupeRecords,
        getTableScrollElement,
        savePcListScrollPosition,
        restorePcListScrollPosition,
        checkAndAutoLoadMore,
        handleAppPopupOpened,
        getListApi,
        buildListParams,
        loadApprovalList,
        openModal,
        closeModal,
        handleTabChange,
        handleModuleChange,
        handleDateRangeChange,
        openAppDateCalendar,
        formatAppDateRangeBoundary,
        handleAppDateRangeConfirm,
        clearAppDateRange,
        isDateDisabled,
        loadMore,
        handleTableScroll,
        handlePcRowChecked,
        togglePcAllRows,
        isRowChecked,
        setAppRowChecked,
        toggleAppRow,
        handleAppRowChecked,
        toggleAppAllRows,
        handleAppListScroll,
        emitSelectionChange,
        handleConfirm,
        removeSelectedOption,
        normalizeDetailResponse,
        parseJsonSafely,
        formatDetailValue,
        formatNamedObjectValue,
        formatDetailLabel,
        formatDateIntervalValue,
        formatApprovalStatus,
        formatApprovalUserByUserId,
        isAttachmentFormItem,
        isDateIntervalFormItem,
        isDepartmentFormItem,
        isUserFormItem,
        detailFormItems,
        isWideFormItem,
        detailTaskList,
        handlePcDetailBack,
        openDetail,
        approvalBackIcon,
        approvalDetailArrowIcon,
        approvalCheckboxIndeterminateIcon,
        approvalCheckboxNormalIcon,
        approvalCheckboxSelectedIcon,
    };
}

export type ApprovalSelectContext = ReturnType<typeof useApprovalSelect>;
export const approvalSelectContextKey: InjectionKey<ApprovalSelectContext> = Symbol('MxApprovalSelectContext');

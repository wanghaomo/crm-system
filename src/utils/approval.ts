import dayjs from 'dayjs';
import { getUserListApi } from '@/api';
import { useDictStore } from '@/store/commStore';

const REJECT_ACTIONS = ['REJECTED', 'REFUSED', 'REJECT', 'NO_PASS', 'FAILED'];
const PERSON_DICT_KEY = '人员列表';

let userNameMapPromise: Promise<Map<string, string>> | null = null;
let userMapPromise: Promise<Map<string, any>> | null = null;

const formatDateTime = (value: any) => {
    if (!value && value !== 0) return '--';
    const date = dayjs(value);
    return date.isValid() ? date.format('YYYY-MM-DD HH:mm:ss') : String(value);
};

const isPass = (record: any) => {
    const action = String(record?.action || '').toUpperCase();
    const actionName = String(record?.actionName || '');
    if (REJECT_ACTIONS.includes(action)) return false;
    return !['拒绝', '不通过', '驳回'].some((keyword) => actionName.includes(keyword));
};

const getApproverName = (record: any = {}, userNameMap: Map<string, string>) => {
    const approverId = record.approverName || record.approverId || '';
    if (!approverId) return '--';
    return userNameMap.get(String(approverId)) || String(approverId);
};

const getOperatorDisplayName = (record: any = {}, userNameMap: Map<string, string>) => {
    const approverName = getApproverName(record, userNameMap);
    const actionName = record.actionName || '';
    if (!actionName) return approverName;
    if (approverName === '--') return actionName;
    return `${approverName}${actionName}`;
};

const getFileNameFromUrl = (url: any) => {
    if (!url) return '附件';
    const cleanUrl = String(url).split('?')[0].split('#')[0];
    const name = cleanUrl.substring(cleanUrl.lastIndexOf('/') + 1);
    try {
        return decodeURIComponent(name) || '附件';
    } catch {
        return name || '附件';
    }
};

const normalizeApprovalAttachments = (value: any) => {
    const list = Array.isArray(value) ? value : [];
    return list
        .filter((item: any) => item && typeof item === 'object' && item.url)
        .map((item: any) => ({
            ...item,
            fileName: item.title || getFileNameFromUrl(item.url),
            originalName: item.title || getFileNameFromUrl(item.url),
            url: item.url,
            size: item.file_size,
            type: item.type,
            fileId: item.fileId || item.id,
        }));
};

const getOperationTime = (record: any = {}, node: any = {}) => {
    const nodeId = String(record.nodeId || node.nodeId || '').toUpperCase();
    return formatDateTime(nodeId === 'END' ? record.createAt ?? node.createAt : record.actionTime);
};

const normalizeNodeRecord = (record: any = {}, node: any = {}, userNameMap: Map<string, string>) => ({
    ...record,
    nodeName: node.nodeName,
    nodeOrder: node.nodeOrder,
    operationName: node.nodeName || '--',
    operatorName: getOperatorDisplayName(record, userNameMap),
    operationTime: getOperationTime(record, node),
    remarks: record.comment || '',
    attachments: normalizeApprovalAttachments(record.fileUrl),
    action: record.action || node.action || '',
    isPass: isPass(record),
    operationType: record.actionName || node.actionName || '',
});

const pickOrRecord = (node: any) => {
    const children = Array.isArray(node?.children) ? node.children : [];
    return children.find((item: any) => item?.action !== 'DONE') || children[0] || node;
};

const isNotDoneRecord = (record: any = {}) => record.action !== 'DONE';

const normalizeGroupNode = (node: any = {}, children: any[] = [], userNameMap: Map<string, string>) => {
    const nodeList = children.map((child: any) => normalizeNodeRecord(child, node, userNameMap));
    const lastChild = nodeList[nodeList.length - 1];
    return {
        ...node,
        operationName: node.nodeName || '--',
        operatorName: '',
        operationTime: lastChild?.operationTime || '--',
        remarks: '',
        isPass: nodeList.every((item: any) => item.isPass),
        operationType: node.actionName || '',
        nodeList,
    };
};

const getPersonKeys = (person: any) =>
    [person?.larkUserId]
        .filter((item) => item !== undefined && item !== null && item !== '')
        .map((item) => String(item));

const createUserNameMap = (personList: any[] = []) => {
    const userNameMap = new Map<string, string>();
    personList.forEach((person: any) => {
        const username = person?.username || person?.label || person?.name || '';
        if (!username) return;
        getPersonKeys(person).forEach((key) => {
            userNameMap.set(key, username);
        });
    });
    return userNameMap;
};

const createUserMap = (personList: any[] = []) => {
    const userMap = new Map<string, any>();
    personList.forEach((person: any) => {
        getPersonKeys(person).forEach((key) => {
            userMap.set(key, person);
        });
    });
    return userMap;
};

const getCachedPersonList = () => {
    try {
        const dictStore = useDictStore();
        return {
            dictStore,
            personList: Array.isArray(dictStore.dictMap?.[PERSON_DICT_KEY]) ? dictStore.dictMap[PERSON_DICT_KEY] : [],
        };
    } catch {
        return {
            dictStore: null,
            personList: [],
        };
    }
};

const getApprovalPersonList = async () => {
    const { dictStore, personList } = getCachedPersonList();
    if (personList.length) return personList;

    const result = await getUserListApi({
        status: 'WORKING',
        needDept: true,
    });
    const nextPersonList =
        result.code === 200
            ? (result.data || []).map((item: any) => ({
                  ...item,
                  label: item.username,
                  value: item.code,
              }))
            : [];

    if (dictStore) {
        if (!dictStore.dictMap) {
            dictStore.setDictMap({});
        }
        dictStore.setDictMapByName(PERSON_DICT_KEY, nextPersonList);
    }

    return nextPersonList;
};

export const getApprovalUserNameMap = async () => {
    if (!userNameMapPromise) {
        userNameMapPromise = getApprovalPersonList()
            .then((personList) => createUserNameMap(personList))
            .catch(() => new Map<string, string>());
    }
    return userNameMapPromise;
};

export const getApprovalUserMap = async () => {
    if (!userMapPromise) {
        userMapPromise = getApprovalPersonList()
            .then((personList) => createUserMap(personList))
            .catch(() => new Map<string, any>());
    }
    return userMapPromise;
};

export const normalizeApprovalDetailsNewMap = (value: any = [], userNameMap: Map<string, string> = new Map()) => {
    const list = Array.isArray(value) ? value : [];
    return list
        .filter((item: any) => item && typeof item === 'object')
        .map((node: any) => {
            const children = Array.isArray(node.children) ? node.children : [];
            if (node.type === 'OR') {
                const notDoneChildren = children.filter(isNotDoneRecord);
                if (notDoneChildren.length > 1) {
                    return normalizeGroupNode(node, notDoneChildren, userNameMap);
                }
                return normalizeNodeRecord(pickOrRecord(node), node, userNameMap);
            }

            return normalizeGroupNode(node, children, userNameMap);
        });
};

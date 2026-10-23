import service from './request';
import {
    TICKET_URL,
    USER_BASE_INFO_URL,
    DICT_MAP_URL,
    USER_PAGE_URL,
    DEVICE_PAGE_URL,
    DEVICE_TYPE_TREE_URL,
    FILE_UPLOAD_URL,
    SOURCE_UPLOAD_URL,
    BASE_MASTER_DATA_URL_PREFIX,
    USER_DEPT_USER_TREE,
    TMS_BASE_URL_PREFIX,
} from './urlConfig';
/** ticket认证接口 */
export function ticketValidateApi(ticket: string) {
    return service({
        url: TICKET_URL,
        method: 'GET',
        params: { ticket },
        customParams: {
            showSuccessToast: false, // 显示成功提示
            successMessage: '登录成功，欢迎回来！', // 自定义成功消息,
        },
    });
}
/** 获取当前用户基础信息api */
export function getUserBaseinfoApi(systemCode: string) {
    return service({
        url: USER_BASE_INFO_URL,
        method: 'GET',
        params: { systemCode },
        customParams: {
            showSuccessToast: false, // 显示成功提示
            successMessage: '登录成功!', // 自定义成功消息,
        },
    });
}
// getDictMapApi 获取字典映射
export function getDictMapApi(data: { parentCodes: string[] }) {
    return service({
        url: DICT_MAP_URL,
        method: 'POST',
        data,
        customParams: {
            showSuccessToast: false, // 显示成功提示
            successMessage: '获取字典映射成功!', // 自定义成功消息,
        },
    });
}
/**
 * @param data
 * @param data.current 当前页
 * @param data.size 每页条数
 * @param data.searchCount 是否查询总条数
 * @param data.username 人员名称
 * @param data.workAreaCode 所属工区code
 * @param data.status 人员状态
 * @returns
 */
export function getPersonnelPageApi(data: {
    current: number;
    size: number;
    searchCount: boolean;
    username: string;
    workAreaCode: string | null;
    status: string;
}) {
    return service({
        url: USER_PAGE_URL,
        method: 'POST',
        data,
        customParams: {
            showSuccessToast: false, // 显示成功提示
            isLoading: true, // 显示loading
        },
    });
}
/**
 * 设备分页获取
 * @param data
 * @param data.current 当前页
 * @param data.size 每页条数
 * @param data.workAreaCode 所属工区
 * @param data.eqName 设备名称
 * @param data.location 设备位置
 * @param data.currentStatus 设备状态
 * @returns
 */
export function getDevicePageApi(data: {
    current: number;
    size: number;
    workAreaCode: string | null;
    eqName: string;
    typeCode?: string;
    location: string;
    currentStatus: string;
}) {
    return service({
        url: DEVICE_PAGE_URL,
        method: 'POST',
        data,
        customParams: {
            showSuccessToast: false, // 显示成功提示
            isLoading: true, // 显示loading
        },
    });
}

// 上传文件
export function uploadFileApi(data: any) {
    return service({
        url: FILE_UPLOAD_URL,
        method: 'POST',
        data,
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
}

// 文件上传
export function fileUploadApi(data: any) {
    return service({
        url: SOURCE_UPLOAD_URL,
        method: 'POST',
        data,
    });
}

// 人员列表数据获取
export function getUserListApi(data: any) {
    return service({
        url: `${BASE_MASTER_DATA_URL_PREFIX}/user/list`,
        method: 'POST',
        data,
        customParams: {
            showSuccessToast: false, // 显示成功提示
            isLoading: false, // 显示loading
        },
    });
}

/** 获取部门-人员树形结构 */
export function getDeptAndUserTree(data?:any) {
    return service({
        url: `${USER_DEPT_USER_TREE}`,
        method: 'GET',
        data
    });
}

// 部门获取
export function getDeptTree(params: any = {}) {
    return service({
        url: BASE_MASTER_DATA_URL_PREFIX + '/dept/tree',
        method: 'GET',
        params: {
            ...params,
            type:'INTERNAL',
        }
    })
}

/**
 * 分页查询启用的堆场信息。
 * @param data 堆场分页查询条件
 * @returns 堆场分页数据
 */
export function getYardPageApi(data: {
    current: number;
    size: number;
    status?: number;
    yardNameMatch?: string;
}) {
    return service({
        url: TMS_BASE_URL_PREFIX + '/yard/page',
        method: 'POST',
        data,
        customParams: {
            showSuccessToast: false,
            isLoading: false,
        },
    });
}

/**
 * 系统进入埋点
 */
export function getTrackingPointApi(systemCode: string) {
    return service({
        method: 'POST',
        url: '/master-data/system/goSystem',
        params:{
            systemCode
        }
    });
}

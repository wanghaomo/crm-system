// ============ 基础前缀 ============
// 默认
export const MMS_BASE_URL_PREFIX = '/mms';
// 统一门户基础前缀
export const BASE_MASTER_DATA_URL_PREFIX = '/master-data';
// crm基础前缀
export const CRM_BASE_URL_PREFIX = '/mx-crm';
// tms物流前缀
export const TMS_BASE_URL_PREFIX = '/mx-tms';
// 资源前缀
const SOURCE_PREFIX = '/resource';

// ============ 具体接口URL ============
/** ticket认证url */
export const TICKET_URL = BASE_MASTER_DATA_URL_PREFIX + '/auth/get-token';
/** 获取用户基础信息、权限、菜单等信息url */
export const USER_BASE_INFO_URL = BASE_MASTER_DATA_URL_PREFIX + '/auth/get-auth-info';
/** 字典批量获取 */
export const DICT_MAP_URL = BASE_MASTER_DATA_URL_PREFIX + '/dict/map';
/** 人员分页获取 */
export const USER_PAGE_URL = BASE_MASTER_DATA_URL_PREFIX + '/user/simple-user-page';
/** 设备分页获取 */
export const DEVICE_PAGE_URL = MMS_BASE_URL_PREFIX + '/equipment/page';
/**获取设备类型*/
export const DEVICE_TYPE_TREE_URL = MMS_BASE_URL_PREFIX + '/equipmentType/listTree';
// 上传文件
export const FILE_UPLOAD_URL = '/resource/oss/upload';

/**文件上传 */
export const SOURCE_UPLOAD_URL = SOURCE_PREFIX + '/oss/upload';

// 获取部门人员树
export const USER_DEPT_USER_TREE = BASE_MASTER_DATA_URL_PREFIX + '/user/dept-user-tree';

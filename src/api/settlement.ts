

import service from './request';
import { CRM_BASE_URL_PREFIX } from './urlConfig';
import { deepClone } from '@/utils/comm';

const DEFAULT_PAGE_PARAMS = {
    current: 1,
    size: 20,
};

  const dataList = [
      {
        id: 1,
        remittanceNumber: "RJH26030001",//回款单编号
        enterpriseName: "兴发集团有限责任公司",//企业名称
        followUpPerson: "张三",//跟单人
        status: "PAYMENT_STATUS_01",//状态
        constractNumber: "XS26030001",//合同编号
        amountReceivable: "800",//应收金额(万元)
        amountReceived: "0",//已收金额(万元)
        unpaidAmount : "800",//未收金额(万元)
        shoulDate: "2026-05-15",//计划回款日
        actualDate: "",//实际回款日
        overdue: false,//是否逾期
        RecollectionCount: "0",//催收次数
        latCollectionTime: "",//最新催收时间
        paymentRecord: [],
        jreminderRecord: [],
      },
      {
        id: 2,
        remittanceNumber: "RJH26030002",//汇款单编号
        enterpriseName: "兴发集团有限责任公司",//企业名称
        followUpPerson: "张三",//跟单人
        status: "PAYMENT_STATUS_02",//状态
        constractNumber: "XS26030001",//合同编号
        amountReceivable: "800",//应收金额(万元)
        amountReceived: "0",//已收金额(万元)
        unpaidAmount : "800",//未收金额(万元)
        shoulDate: "2026-05-15",//计划回款日
        actualDate: "",//实际回款日
        overdue: false,//是否逾期
        RecollectionCount: "0",//催收次数
        latCollectionTime: "",//最新催收时间
        paymentRecord: [],
        jreminderRecord: [],
      },
      {
        id: 3,
        remittanceNumber: "RJH26030003",//汇款单编号
        enterpriseName: "兴发集团有限责任公司",//企业名称
        followUpPerson: "张三",//跟单人
        status: "PAYMENT_STATUS_03",//状态
        constractNumber: "XS26030001",//合同编号
        amountReceivable: "800",//应收金额(万元)
        amountReceived: "800",//已收金额(万元)
        unpaidAmount : "0",//未收金额(万元)
        shoulDate: "2026-05-15",//计划回款日
        actualDate: "2026-05-15",//实际回款日
        overdue: false,//是否逾期
        RecollectionCount: "0",//催收次数
        latCollectionTime: "",//最新催收时间
        paymentRecord: [{
          key1: 'HK60300212',//回款记录编号
          key2: 'RJH26030003',//关联回款单
          key3: '2026-05-15',//回款日期
          key4: '800',//回款金额（万元）
          key5: '2026-05-15',//计划回款日期
          key6: '兴发集团有限责任公司',//企业名称
          key7: '张三',//经办人
          key8: '0',//抹零数据（元）
          key9: '银行转账',//回款方式
          key10: '',//备注
        }],
        jreminderRecord: [],
      },
      {
        id: 4,
        remittanceNumber: "RJH26030004",//汇款单编号
        enterpriseName: "兴发集团有限责任公司",//企业名称
        followUpPerson: "张三",//跟单人
        status: "PAYMENT_STATUS_03",//状态
        constractNumber: "XS26030001",//合同编号
        amountReceivable: "800",//应收金额(万元)
        amountReceived: "0",//已收金额(万元)
        unpaidAmount : "800",//未收金额(万元)
        shoulDate: "2026-05-15",//计划回款日
        actualDate: "",//实际回款日
        overdue: true,//是否逾期
        RecollectionCount: "1",//催收次数
        latCollectionTime: "2026-05-20",//最新催收时间
        paymentRecord: [],
        jreminderRecord: [{
          key1: 'CS60300412',//催收记录编号
          key2: 'RJH26030004',//关联回款单
          key3: '2026-05-15',//催收日期
          key4: '尽快回款',//催收内容
          key5: '2026-05-16',//客户回复时间
          key6: '资金流转，三日内',//客户回复内容
          key7: '兴发集团有限责任公司',//企业名称
          key8: '张三',//催收人
          key9: '2026-05-18',//预计回款时间
          key10: '电话',//催收方式
          key11: '',//后续跟进措施
        }],
      }
    ]
/**
 * 获取结算单主表分页列表。
 * @param data 结算单查询条件和分页参数
 * @returns 结算单分页数据请求结果
 */
export function getSettlementPageApi(data?: any) {
    return service.request({
        url: CRM_BASE_URL_PREFIX + '/financeSettlementMain/page',
        method: 'post',
        data: {
            ...DEFAULT_PAGE_PARAMS,
            ...data,
        },
        customParams: {
            showSuccessToast: false,
        },
    }).catch((error: any) => Promise.reject(error));
}

/**
 * 根据销售合同编号查询可结算明细。
 * @param contractCode 销售合同编号
 * @returns 可结算明细列表请求结果
 */
export function getSettlementDetailListByContractCodeApi(contractCode: string) {
    return service.request({
        url: CRM_BASE_URL_PREFIX + `/financeSettlementDetail/getSettlementDetailByContractCode/${encodeURIComponent(contractCode)}`,
        method: 'get',
        customParams: {
            showSuccessToast: false,
        },
    }).catch((error: any) => Promise.reject(error));
}

/**
 * 获取结算单主表详情。
 * @param id 结算单主表 ID
 * @param type 编辑态详情类型标识
 * @returns 结算单详情请求结果
 */
export function getSettlementMainDetailApi(id: string | number, type?: boolean) {
    return service.request({
        url: CRM_BASE_URL_PREFIX + '/financeSettlementMain/get',
        method: 'get',
        params: {
            id,
            ...(type !== undefined ? { type } : {}),
        },
        customParams: {
            showSuccessToast: false,
        },
    }).catch((error: any) => Promise.reject(error));
}

/**
 * 获取销售合同结算进度。
 * @param contractCode 销售合同编号
 * @returns 结算进度请求结果
 */
export function getSettlementProgressApi(contractCode: string) {
    return service.request({
        url: CRM_BASE_URL_PREFIX + '/financeSettlementMain/getSettlementProgress',
        method: 'get',
        params: {
            contractCode,
        },
        customParams: {
            showSuccessToast: false,
        },
    }).catch((error: any) => Promise.reject(error));
}

/**
 * 新增结算单主表。
 * @param data 结算单主表新增参数
 * @returns 新增请求结果
 */
export function createSettlementMainApi(data: any) {
    return service.request({
        url: CRM_BASE_URL_PREFIX + '/financeSettlementMain/create',
        method: 'post',
        data,
        customParams: {
            isLoading: true,
            showSuccessToast: true,
            successMessage: '保存成功',
        },
    }).catch((error: any) => Promise.reject(error));
}

/**
 * 修改结算单主表。
 * @param data 结算单主表修改参数
 * @returns 修改请求结果
 */
export function updateSettlementMainApi(data: any) {
    return service.request({
        url: CRM_BASE_URL_PREFIX + '/financeSettlementMain/update',
        method: 'post',
        data,
        customParams: {
            isLoading: true,
            showSuccessToast: true,
            successMessage: '保存成功',
        },
    }).catch((error: any) => Promise.reject(error));
}

/**
 * 删除结算单主表。
 * @param id 结算单主表 ID
 * @returns 删除请求结果
 */
export function deleteSettlementMainApi(id: string | number) {
    return service.request({
        url: CRM_BASE_URL_PREFIX + `/financeSettlementMain/delete/${id}`,
        method: 'delete',
        customParams: {
            isLoading: true,
            showSuccessToast: true,
            successMessage: '删除成功',
        },
    }).catch((error: any) => Promise.reject(error));
}

export function getSettlementDetailApi(id: string | number) {
    const findItem = dataList.find((item) => item.id == id);
    return findItem ? Promise.resolve({
        code: 200,
        data: deepClone(findItem),
    }) : Promise.reject({});
}

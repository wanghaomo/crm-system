import service from './request';
import { CRM_BASE_URL_PREFIX, TMS_BASE_URL_PREFIX } from './urlConfig';
// 发运计划本地联调示例数据，保留用于接口未联通时对照字段结构。
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const dataList = [
      {
        id: 1,
        code: "RJH26030001",//发货批次号
        planStartDate: "2026-05-10",//计划日期
        planEndDate: "2026-05-17",//计划日期
        monthlyShippingPlan: "FHPL26030001",//关联月发货计划编号
        status: "PLAN_STATUS_01",//单据状态
        customerName: "湖北兴发化工集团股份有限公司",//客户名称
        remark: "",
        details: [
          {
            salesContractNumber: "XS26030001",//关联销售合同编号
            priority: "低",//优先级
            supplierUnit: "火石子",//供方单位
            companyname: "湖北兴发化工集团股份有限公司",//企业名称
            phone: "张三-13829098909",//联系方式
            oreGgrade: "26",//矿石品位（%）
            oreType: "高品位磷矿",//矿石种类
            contractQuantity: "10000",//合同数量（吨）
            unshippedQuantity: "5000",//未发货量（吨）
            plannedSshipmentQuantity: "5000",//计划发货量（吨）
            placeFelivery: "宜昌码头",//交货地点
            modeTransportation: "船运",//运输方式
            deliveryMethods: "抵港交割",//交割方式
            deliveryDeadline: "2026-03-01至2026-03-31",//交货期限
            remark: "",//计划备注
          },
          {
            salesContractNumber: "XS26030001",//关联销售合同编号
            priority: "低",//优先级
            supplierUnit: "火石子",//供方单位
            companyname: "宜昌兴发集团有限责任公司",//企业名称
            phone: "张三-13829098909",//联系方式
            oreGgrade: "26",//矿石品位（%）
            oreType: "高品位磷矿",//矿石种类
            contractQuantity: "10000",//合同数量（吨）
            unshippedQuantity: "5000",//未发货量（吨）
            plannedSshipmentQuantity: "5000",//计划发货量（吨）
            placeFelivery: "宜昌码头",//交货地点
            modeTransportation: "汽运",//运输方式
            deliveryMethods: "抵港交割",//交割方式
            deliveryDeadline: "2026-03-01至2026-03-31",//交货期限
            remark: "",//计划备注
          }
        ]
      },
      {
        id: 2,
        code: "RJH26030001",//发货批次号
        planStartDate: "2026-05-10",//计划日期
        planEndDate: "2026-05-17",//计划日期
        monthlyShippingPlan: "FHPL26030001",//关联月发货计划编号
        status: "PLAN_STATUS_02",//单据状态
        customerName: "贵州瓮福化工有限责任公司",//客户名称
        remark: "",
        details: [
          {
            salesContractNumber: "XS26030001",//关联销售合同编号
            priority: "低",//优先级
            supplierUnit: "火石子",//供方单位
            companyname: "贵州瓮福化工有限责任公司",//企业名称
            phone: "张三-13829098909",//联系方式
            oreGgrade: "26",//矿石品位（%）
            oreType: "高品位磷矿",//矿石种类
            contractQuantity: "10000",//合同数量（吨）
            unshippedQuantity: "5000",//未发货量（吨）
            plannedSshipmentQuantity: "5000",//计划发货量（吨）
            placeFelivery: "宜昌码头",//交货地点
            modeTransportation: "船运",//运输方式
            deliveryMethods: "抵港交割",//交割方式
            deliveryDeadline: "2026-03-01至2026-03-31",//交货期限
            remark: "",//计划备注
          },
          {
            salesContractNumber: "XS26030001",//关联销售合同编号
            priority: "低",//优先级
            supplierUnit: "火石子",//供方单位
            companyname: "瓮福达州化工有限责任公司",//企业名称
            phone: "张三-13829098909",//联系方式
            oreGgrade: "26",//矿石品位（%）
            oreType: "高品位磷矿",//矿石种类
            contractQuantity: "10000",//合同数量（吨）
            unshippedQuantity: "5000",//未发货量（吨）
            plannedSshipmentQuantity: "5000",//计划发货量（吨）
            placeFelivery: "宜昌码头",//交货地点
            modeTransportation: "汽运",//运输方式
            deliveryMethods: "抵港交割",//交割方式
            deliveryDeadline: "2026-03-01至2026-03-31",//交货期限
            remark: "",//计划备注
          }
        ]
      },
      {
        id: 3,
        code: "RJH26030001",//发货批次号
        planStartDate: "2026-05-10",//计划日期
        planEndDate: "2026-05-17",//计划日期
        monthlyShippingPlan: "FHPL26030001",//关联月发货计划编号
        status: "PLAN_STATUS_03",//单据状态
        customerName: "云南云天化股份有限公司",//客户名称
        remark: "",
        details: [
          {
            salesContractNumber: "XS26030001",//关联销售合同编号
            priority: "低",//优先级
            supplierUnit: "火石子",//供方单位
            companyname: "云南云天化股份有限公司",//企业名称
            phone: "张三-13829098909",//联系方式
            oreGgrade: "26",//矿石品位（%）
            oreType: "高品位磷矿",//矿石种类
            contractQuantity: "10000",//合同数量（吨）
            unshippedQuantity: "5000",//未发货量（吨）
            plannedSshipmentQuantity: "5000",//计划发货量（吨）
            placeFelivery: "宜昌码头",//交货地点
            modeTransportation: "船运",//运输方式
            deliveryMethods: "抵港交割",//交割方式
            deliveryDeadline: "2026-03-01至2026-03-31",//交货期限
            remark: "",//计划备注
          },
          {
            salesContractNumber: "XS26030001",//关联销售合同编号
            priority: "低",//优先级
            supplierUnit: "火石子",//供方单位
            companyname: "云南三环中化化肥有限公司",//企业名称
            phone: "张三-13829098909",//联系方式
            oreGgrade: "26",//矿石品位（%）
            oreType: "高品位磷矿",//矿石种类
            contractQuantity: "10000",//合同数量（吨）
            unshippedQuantity: "5000",//未发货量（吨）
            plannedSshipmentQuantity: "5000",//计划发货量（吨）
            placeFelivery: "宜昌码头",//交货地点
            modeTransportation: "汽运",//运输方式
            deliveryMethods: "抵港交割",//交割方式
            deliveryDeadline: "2026-03-01至2026-03-31",//交货期限
            remark: "",//计划备注
          }
        ]
      },
      {
        id: 4,
        code: "RJH26030001",//发货批次号
        planStartDate: "2026-05-10",//计划日期
        planEndDate: "2026-05-17",//计划日期
        monthlyShippingPlan: "FHPL26030001",//关联月发货计划编号
        status: "PLAN_STATUS_04",//单据状态
        customerName: "四川龙蟒磷化工有限公司",//客户名称
        remark: "",
      },
    ]
/**
 * 获取发运计划分页列表。
 * @param data 查询条件和分页参数
 * @returns 发运计划分页数据请求结果
 */
export function getDailyShippingPlanPageApi(data?: any) {
    return service.request({
        url: CRM_BASE_URL_PREFIX + '/shipmentDailyPlan/page',
        method: 'post',
        data,
        customParams: {
            showSuccessToast: false,
        },
    });
}

/**
 * 获取发货计划明细分页数据。
 * @param data 查询条件和分页参数
 * @returns 发货计划明细分页请求结果
 */
export function getDailyShippingPlanDetailPageApi(data?: any) {
    return service.request({
        url: CRM_BASE_URL_PREFIX + '/shipmentDailyDetail/getPage',
        method: 'post',
        data,
        customParams: {
            showSuccessToast: false,
        },
    });
}

/**
 * 校验是否存在可新增的待执行发运计划数据。
 * @param id 发运计划 ID，不传时校验当前是否有待生成数据
 * @returns 待生成数据校验结果
 */
export function getDailyShippingPlanCheckHasPendingDataApi(id?: string | number) {
    return service.request({
        url: CRM_BASE_URL_PREFIX + '/shipmentDailyPlan/checkHasPendingData',
        method: 'get',
        params: id === undefined || id === null || id === '' ? undefined : { id },
        customParams: {
            showSuccessToast: false,
        },
    });
}

/**
 * 根据月发货计划编号获取可生成的发运计划明细。
 * @param planCode 月发货计划编号
 * @returns 发运计划明细列表请求结果
 */
export function getDailyShippingPlanDetailListByPlanCodeApi(planCode: string) {
    return service.request({
        url: CRM_BASE_URL_PREFIX + '/shipmentDailyDetail/listByPlanCode',
        method: 'get',
        params: {
            planCode,
        },
        customParams: {
            isLoading: true,
            showSuccessToast: false,
        },
    });
}

/**
 * 根据销售合同编号获取可生成的发货订单明细。
 * @param contractCodes 销售合同编号数组或逗号分隔的合同编号字符串
 * @returns 对应销售合同的发货订单明细列表请求结果
 */
export function getDailyShippingPlanDetailListByContractCodeApi(contractCodes: string[] | string) {
    const normalizedContractCodes = (Array.isArray(contractCodes) ? contractCodes : contractCodes.split(','))
        .map((item) => String(item || '').trim())
        .filter(Boolean);

    return service.request({
        url: CRM_BASE_URL_PREFIX + '/shipmentDailyDetail/listByContractCode',
        method: 'post',
        data: normalizedContractCodes,
        customParams: {
            showSuccessToast: false,
        },
    });
}

/**
 * 获取所有可关联销售合同的预发货明细。
 * @param customerId 客户 ID
 * @returns 预发货明细列表请求结果
 */
export function getPreShipmentDetailListApi(customerId?: string | number) {
    return service.request({
        url: CRM_BASE_URL_PREFIX + '/shipmentDailyDetail/listPreShipment',
        method: 'get',
        params:
            customerId === undefined || customerId === null || customerId === ''
                ? undefined
                : { customerId },
        customParams: {
            showSuccessToast: false,
        },
    });
}

/**
 * 新增发运计划。
 * @param data 发运计划主表和明细提交数据
 * @returns 新增请求结果
 */
export function createDailyShippingPlanApi(data: any) {
    return service.request({
        url: CRM_BASE_URL_PREFIX + '/shipmentDailyPlan/create',
        method: 'post',
        data,
        customParams: {
            isLoading: true,
            showSuccessToast: true,
            successMessage: '提交成功',
        },
    });
}

/**
 * 更新发运计划。
 * @param data 发运计划主表和明细提交数据
 * @returns 更新请求结果
 */
export function updateDailyShippingPlanApi(data: any) {
    return service.request({
        url: CRM_BASE_URL_PREFIX + '/shipmentDailyPlan/update',
        method: 'post',
        data,
        customParams: {
            isLoading: true,
            showSuccessToast: true,
            successMessage: '提交成功',
        },
    });
}

/**
 * 删除发运计划。
 * @param id 发运计划 ID
 * @returns 删除请求结果
 */
export function deleteDailyShippingPlanApi(id: string | number) {
    return service.request({
        url: CRM_BASE_URL_PREFIX + '/shipmentDailyPlan/delete/' + id,
        method: 'delete',
        customParams: {
            isLoading: true,
            showSuccessToast: true,
            successMessage: '删除成功',
        },
    });
}

/**
 * 更新发运计划明细状态。
 * @param data 明细 ID 和目标状态
 * @param successMessage 操作成功提示文案
 * @returns 状态更新请求结果
 */
export function updateDailyShippingPlanDetailStatusApi(data: { id: string | number; status: number }, successMessage?: string) {
    return service.request({
        url: CRM_BASE_URL_PREFIX + '/shipmentDailyDetail/updateStatus',
        method: 'get',
        params: data,
        customParams: {
            isLoading: true,
            showSuccessToast: true,
            successMessage: successMessage || '操作成功',
        },
    });
}

/**
 * 获取销售合同发运进度。
 * @param contractCode 销售合同编号
 * @returns 发运进度请求结果
 */
export function getShipmentProgressApi(contractCode: string) {
    return service.request({
        url: CRM_BASE_URL_PREFIX + '/shipmentDailyDetail/getShipmentProgress',
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
 * 获取 TMS 船运物流节点列表。
 * @param data 查询参数，intermodalWaybillNo 为运输订单编码
 * @returns TMS 船运物流节点列表请求结果
 */
export function getShipTransportationNodeListApi(data: any) {
    return service.request({
        url: TMS_BASE_URL_PREFIX + '/shipTransportationNode/list',
        method: 'post',
        data,
        customParams: {
            isLoading: true,
            showSuccessToast: false,
        },
    });
}

/**
 * 获取 TMS 汽运物流状态列表。
 * @param data 查询参数，waybillNo 为物流订单编码
 * @returns TMS 汽运物流状态列表请求结果
 */
export function getTransportPlanStatusListApi(data: any) {
    return service.request({
        url: TMS_BASE_URL_PREFIX + '/transportPlanStatus/list',
        method: 'post',
        data,
        customParams: {
            isLoading: true,
            showSuccessToast: false,
        },
    });
}

/**
 * 获取发运计划明细详情，并兼容后端新旧字段。
 * @param id 发运计划明细 ID
 * @returns 标准化后的明细详情请求结果
 */
export function getDailyShippingPlanDetailItemApi(id: string | number) {
    return service
        .request({
            url: CRM_BASE_URL_PREFIX + '/shipmentDailyDetail/getInfoById',
            method: 'get',
            params: {
                id,
            },
            customParams: {
                isLoading: true,
                showSuccessToast: false,
            },
        })
        .then((res: any) => {
            if (res?.code === 200) {
                return {
                    ...res,
                    data: normalizeDailyShippingDetail(res.data || {}),
                };
            }
            return res;
        });
}

/**
 * 统一发运计划明细字段，兼容新增、编辑、详情页面展示和提交。
 * @param item 后端返回的明细原始数据
 * @returns 补齐旧字段别名后的明细数据
 */
const normalizeDailyShippingDetail = (item: any = {}) => ({
    ...item,
    salesContractNumber: item.salesContractNumber || item.salesContractCode || '',
    companyname: item.companyname || item.customerName || '',
    phone: item.phone || item.contactInformation || '',
    oreGgrade: item.oreGgrade ?? item.grade ?? '',
    oreType: item.oreType || item.mineralType || '',
    contractQuantity: item.contractQuantity ?? item.contractNum ?? '',
    unshippedQuantity: item.unshippedQuantity ?? item.unshippedNum ?? '',
    plannedSshipmentQuantity: item.plannedSshipmentQuantity ?? item.actualQuantity ?? '',
    placeFelivery: item.placeFelivery || item.deliveryLocation || '',
    modeTransportation: item.modeTransportation || item.transportation || '',
    deliveryMethods: item.deliveryMethods || item.deliveryMethod || '',
    deliveryDeadline: item.deliveryDeadline || [item.startDate, item.endDate].filter(Boolean).join('至'),
});

/**
 * 将数组或逗号分隔字符串标准化为非空字符串数组。
 * @param value 待处理的数组或字符串
 * @returns 去除首尾空格后的字符串数组
 */
const normalizeCommaSeparatedValues = (value: any): string[] => {
    if (value === undefined || value === null || value === '') return [];
    const values = Array.isArray(value) ? value : String(value).split(',');
    return values.map((item) => String(item || '').trim()).filter(Boolean);
};

/**
 * 格式化详情中的关联合同展示文案。
 * @param data 发货订单主表详情
 * @param details 已标准化的发货订单明细
 * @returns 使用顿号分隔的“客户名称-合同编号”文案
 */
const formatContractCodeDisplay = (data: any, details: any[]) => {
    const customerNameByContractCode = new Map<string, string>();
    details.forEach((item: any) => {
        const contractCode = String(item.salesContractCode || item.salesContractNumber || '').trim();
        const customerName = String(item.customerName || item.companyname || '').trim();
        if (contractCode && customerName && !customerNameByContractCode.has(contractCode)) {
            customerNameByContractCode.set(contractCode, customerName);
        }
    });

    const contractCodes = Array.from(
        new Set([
            ...normalizeCommaSeparatedValues(data.contractCodes),
            ...customerNameByContractCode.keys(),
        ])
    );
    const customerNames = normalizeCommaSeparatedValues(data.customerNames || data.customerName);

    return contractCodes
        .map((contractCode, index) => {
            const fallbackCustomerName =
                customerNames.length === 1
                    ? customerNames[0]
                    : customerNames.length === contractCodes.length
                      ? customerNames[index]
                      : '';
            const customerName = customerNameByContractCode.get(contractCode) || fallbackCustomerName;
            return [customerName, contractCode].filter(Boolean).join('-');
        })
        .filter(Boolean)
        .join('、');
};

/**
 * 统一发运计划主表字段，并批量标准化明细字段。
 * @param data 后端返回的发运计划原始数据
 * @returns 页面可直接使用的发运计划详情数据
 */
const normalizeDailyShippingPlan = (data: any = {}) => {
    const details = (data.details || []).map((item: any) => normalizeDailyShippingDetail(item));
    return {
        ...data,
        code: data.code || data.planCode || '',
        monthlyShippingPlan: data.monthlyShippingPlan || data.monthlyPlanCode || '',
        customerName: data.customerName || data.customerNames || '',
        contractCodeDisplay: formatContractCodeDisplay(data, details),
        details,
    };
};

/**
 * 获取发运计划详情。
 * @param id 发运计划 ID
 * @param type 是否按编辑场景获取详情
 * @returns 标准化后的发运计划详情请求结果
 */
export function getDailyShippingPlanDetailApi(id: string | number, type?: boolean) {
    return service
        .request({
            url: CRM_BASE_URL_PREFIX + '/shipmentDailyPlan/getInfoById',
            method: 'get',
            params: {
                id,
                ...(type === undefined ? {} : { type }),
            },
            customParams: {
                isLoading: true,
                showSuccessToast: false,
            },
        })
        .then((res: any) => {
            if (res?.code === 200) {
                return {
                    ...res,
                    data: normalizeDailyShippingPlan(res.data || {}),
                };
            }
            return res;
        });
}

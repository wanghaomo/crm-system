import service from './request';
import { CRM_BASE_URL_PREFIX } from './urlConfig';
import { TMS_BASE_URL_PREFIX } from './urlConfig';

// 数据看板
export function getDashBoardDataApi(data: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/dataBoard/getData',
        method: 'GET',
        customParams: {
            isLoading: false,
        },
    });
}

// 轮播图
export function getBannerListApi(data: any) {
    return service({
        url: CRM_BASE_URL_PREFIX + '/dataBoard/bannerList',
        method: 'GET',
        customParams: {
            isLoading: false,
        },
    });
}

// // 总库存量树状图
// export function getInventoryReportApi() {
//     return service({
//         url: `${TMS_BASE_URL_PREFIX}/dashboard/countBarChartOfAllInventory`,
//         method: 'POST',
//         customParams: {
//             isLoading: false,
//             showSuccessToast: false, // 显示成功提示
//         }
//     });
// }

/**
 * 获取各库区发货货物流向统计。
 * @returns 各库区发货量统计请求结果
 */
export function getGoodsTransferApi() {
    return service({
        url: `${TMS_BASE_URL_PREFIX}/dashboard/countGoodsTransfer`,
        method: 'POST',
        customParams: {
            isLoading: false,
            showSuccessToast: false,
        },
    });
}

// 核心数据
export function getCoreDataApi() {
    return service({
        url: `${CRM_BASE_URL_PREFIX}/dataBoard/coreData`,
        method: 'GET',
        customParams: {
            isLoading: false,
            showSuccessToast: false, // 显示成功提示
        }
    })
}

// 待结算-待回款
export function getSettlementDataApi() {
    return service({
        url: `${CRM_BASE_URL_PREFIX}/dataBoard/paymentData`,
        method: 'GET',
        customParams: {
            isLoading: false,
            showSuccessToast: false, // 显示成功提示
        }
    })
}


//订单统计
export function getOrderStatisticsApi() {
    return service({
        url: `${CRM_BASE_URL_PREFIX}/shipmentDailyDetail/getShipmentOrderStatList`,
        method: 'GET',
        customParams: {
            isLoading: false,
            showSuccessToast: false, // 显示成功提示
        }
    })
}


// 客户发货量
export function getCustomerShipmentApi() {
    return service({
        url: `${CRM_BASE_URL_PREFIX}/shipmentDailyDetail/getCustomerShipmentTop10`,
        method: 'GET',
        customParams: {
            isLoading: false,
            showSuccessToast: false, // 显示成功提示
        }
    })
}


// 库存报表-总库存量树状图 v1.0.1
export function getInventoryReportApi() {
    return service({
        url: `${TMS_BASE_URL_PREFIX}/dashboard/countBarChartOfAllInventoryV101`,
        method: 'POST',
        customParams: {
            isLoading: true,
            showSuccessToast: false, // 显示成功提示
        }
    });
}
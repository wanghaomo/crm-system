import service from './request';
import { CRM_BASE_URL_PREFIX } from './urlConfig';
export function getIndustryNewsPageApi(data?: any) {
    return service.request({
        url: CRM_BASE_URL_PREFIX + '/marketIndustryDynamic/page',
        method: 'post',
        data,
        customParams: {
            showSuccessToast: false,
            isLoading: true,
        },
    });
}
export function createIndustryNewsApi(data:any){
    return service.request({
        url: CRM_BASE_URL_PREFIX + '/marketIndustryDynamic/create',
        method: 'post',
        data,
        customParams: {
          isLoading: true,
          showSuccessToast: true, // 显示成功提示
          successMessage: '新增成功', // 自定义成功消息,
        },
    });
}
export function updateIndustryNewsApi(data:any){
    return service.request({
        url: CRM_BASE_URL_PREFIX + '/marketIndustryDynamic/update',
        method: 'post',
        data,
        customParams: {
          isLoading: true,
          showSuccessToast: true, // 显示成功提示
          successMessage: '编辑成功', // 自定义成功消息,
        },
    });
}
export function pushIndustryNewsApi(data:any){
    return service.request({
        url: CRM_BASE_URL_PREFIX + '/marketIndustryDynamic/push',
        method: 'post',
        data,
        customParams: {
          isLoading: true,
          showSuccessToast: true, // 显示成功提示
          successMessage: '推送成功', // 自定义成功消息,
        },
    });
}
export function getIndustryNewsApi(id:any,showLoading:boolean = true){
    return service.request({
        url: CRM_BASE_URL_PREFIX + '/marketIndustryDynamic/get/'+id,
        method: 'get',
        customParams: {
          isLoading: showLoading,
          showSuccessToast: false, // 显示成功提示
        },
    });
}
export function deleteIndustryNewsApi(id:any){
    return service.request({
        url: CRM_BASE_URL_PREFIX + '/marketIndustryDynamic/delete/'+id,
        method: 'delete',
        customParams: {
          isLoading: true,
          showSuccessToast: true, // 显示成功提示
          successMessage: '删除成功', // 自定义成功消息,
        },
    });
}
export function getIndustryNewsDetailApi(encryptedId:any){
    return service.request({
        url: CRM_BASE_URL_PREFIX + '/marketIndustryDynamic/getDetail?encryptedId='+encodeURIComponent(encryptedId),
        method: 'get',
        paramsSerializer: {
            encode: encodeURIComponent // 强制用浏览器标准编码
        },
        customParams: {
          isLoading: true,
          showSuccessToast: false, // 显示成功提示
        },
    });
}
export function industryNewsPushStateRefresh(item:any,changeItem:(item:any,status:any) => void){
    item.maxRefresh = 5
    if(!item.pushRefreshFun){
        item.pushRefreshFun = () => {
            clearTimeout(item.pushTimer)
            item.maxRefresh -= 1
            item.pushTimer = setTimeout( async () => {
                try {
                    const res = await getIndustryNewsApi(item.id,false)
                    if(res?.data?.latestPushStatus){
                        changeItem(item,res.data.latestPushStatus)
                    }
                } catch(error){}
                if(item.latestPushStatus != 'SUCCESS' && item.latestPushStatus != 'FAILED' && item.maxRefresh > 0){
                    item.pushRefreshFun()
                }
            }, 1000);
        }
    }
    item.pushRefreshFun()
}

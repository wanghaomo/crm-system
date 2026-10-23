import { getCustomerBaseDropdownApi } from '@/api/customerManage';
import { getPaymentCustomerListApi } from '@/api/payment';
import { SelectOption, WebShowFields } from './index.type';

/**
 * 将批量回款客户接口返回值转换为通用选择组件选项。
 * @param item 客户接口原始数据
 * @returns 通用选择组件需要的选项数据
 */
const formatPaymentCustomerOption = (item: any): SelectOption => {
    return {
        ...item,
        label: item.customerName || item.label || item.enterpriseName || item.name || item.customerCode || '',
        value: item.customerId ?? item.value ?? item.id ?? item.customerCode ?? item.customerName ?? '',
    };
};

export const initData = async (
    typeName: string,
    extraParams: Record<string, any>,
    options?: Array<SelectOption>,
    disabledValues?: string[],
    disableCache?: boolean,
    onlyShowLabel?: boolean
) => {
    void disableCache;
    void onlyShowLabel;
    try {
        // 接口结果
        let _res: any = { code: 500 };
        // 基础参数
        let baseParams = {};
        // 组件标题
        let title = '请输入';
        // 搜索框占位符
        let placeholder = '请输入';
        // 要展示的字段对象集合
        let webShowFields: Array<WebShowFields> = [];
        // 下拉选择组件选项
        let commOptionList: Array<SelectOption> = [];
        // app额外展示的字段
        let appShowFields: Array<string> = [];

        switch (typeName) {
            case '企业客户':
                title = '企业客户';
                placeholder = '请选择';
                baseParams = {
                    cooperationStatus: 'NORMAL',
                    status: 'STORAGE', // 企业客户状态-已入库
                };
                webShowFields = [
                    {
                        key: 'label',
                        label: '企业名称',
                        width: '150px',
                    },
                    {
                        key: 'customerCode',
                        label: '企业编码',
                        width: '120px',
                    },
                ];
                appShowFields = ['label'];
                _res = await getCustomerBaseDropdownApi({
                    ...baseParams,
                    ...extraParams,
                });
                if (_res.code == 200) {
                    commOptionList = (_res.data || []).map((item: any) => ({
                        // 其他数据
                        ...item,
                        // 名称-放后面防止覆盖
                        label: item.customerName,
                        // 编码-放后面防止覆盖
                        value: item.id,
                    }));
                }
                break;
            case '批量回款客户':
                title = '客户名称';
                placeholder = '请选择';
                webShowFields = [
                    {
                        key: 'label',
                        label: '客户名称',
                        width: '150px',
                    },
                    {
                        key: 'customerCode',
                        label: '客户编码',
                        width: '120px',
                    },
                ];
                appShowFields = ['label'];
                _res = await getPaymentCustomerListApi();
                if (_res.code == 200) {
                    const customerList = Array.isArray(_res.data) ? _res.data : _res.data?.records || _res.data?.list || [];
                    commOptionList = customerList.map((item: any) => formatPaymentCustomerOption(item));
                }
                break;
        }
        if (options) {
            commOptionList = options.map((item: SelectOption) => {
                // 使用者自己设置的disabled属性优先级高
                if (item.disabled === true || item.disabled === false) {
                    return {
                        ...item,
                        // 是否禁用-根据disabledValues判断
                        disabled: item.disabled,
                    };
                }
                return {
                    ...item,
                    // 是否禁用-根据disabledValues判断
                    disabled: disabledValues ? disabledValues?.includes(item.value) : false,
                };
            });
        }
        return {
            title,
            placeholder,
            webShowFields,
            commOptionList,
            appShowFields,
        };
    } catch (error) {
        return null;
    }
};

import { onMounted, reactive, ref } from "vue";
import {
    getOrderStatisticsApi,
    getCustomerShipmentApi,
    getBannerListApi,
    getInventoryReportApi,
    getCoreDataApi,
    getSettlementDataApi,
} from "@/api/dashBoard";
import { normalizeInventoryReport, type InventoryOptionItem } from './inventoryReport';

/**
 * Web / App 共用的看板数据源。
 *
 */

export const useDashboardData = () => {
    // 按数据接口拆分为独立 loading，各模块的骨架屏由自己的接口控制：
    // coreDataLoading           → getCoreDataApi（核心数据）
    // settlementLoading         → getSettlementDataApi（待结算-待回款）
    // orderStatisticsLoading    → getOrderStatisticsApi（本月订单执行状态）
    // customerShipmentLoading   → getCustomerShipmentApi（客户发货量 TOP10）
    // bannerLoading             → getBannerListApi（bannerList）
    // inventoryLoading          → getInventoryReportApi（inventoryReportData）
    const coreDataLoading = ref(true);
    const settlementLoading = ref(true);
    const orderStatisticsLoading = ref(true);
    const customerShipmentLoading = ref(true);
    const bannerLoading = ref(true);
    const inventoryLoading = ref(true);

    // 核心数据：由 getCoreDataApi 写入
    const coreData = reactive({
        shipmentNum: 0,
        shipmentCarNum: 0,
        amountDue: 0,
        payment: 0,
        unReceived: 0,
        collectionRate: 0,
        customerNum: 0,
        core: 0,
        addNum: 0,
        outboundMineralQuantity: 0,
        inventory: 0,
        contract: 0,
        settledNum: 0,
        unSettledNum: 0,
        deliveredNum: 0,
        settledAmount: 0,
        unSettledAmount: 0,
        expire: 0,
    });
    const bannerList = reactive([]);
    const monthsOrders = reactive([]);
    // 待结算-待回款：由 getSettlementDataApi 写入
    const paymenyData = reactive<{
        xAxisData: string[];
        seriesData: { name: string; data: number[] }[];
    }>({
        xAxisData: [],
        seriesData: [],
    });
    const shipmentData = reactive([]);
    // 库存报表数据 
    const inventoryReportData = reactive<{
        rawData: Record<string, any>;
        totalInventory: number;
        highInventory: number;
        lowInventory: number;
        mixedOreNum: number;
        transferNums: number;
        inventoryOptions: InventoryOptionItem[];
    }>({
        rawData: {},
        totalInventory: 0,
        highInventory: 0,
        lowInventory: 0,
        mixedOreNum: 0,
        transferNums: 0,
        inventoryOptions: [],
    });

    // 复用响应式数组实例，避免替换引用后影响现有组件依赖。
    const replaceReactiveArray = (target: any[], source: any[]) => {
        target.length = 0;
        source.forEach((item) => target.push(item));
    };

    // 获取本月订单执行状态 —  getOrderStatisticsApi
    const loadOrderStatistics = async () => {
        orderStatisticsLoading.value = true;
        try {
            const res: any = await getOrderStatisticsApi();
            if (res.code === 200 && Array.isArray(res.data) && res.data.length) {
                replaceReactiveArray(monthsOrders, res.data);
            }
        } catch (error) {
            console.warn("本月订单执行状态数据获取失败", error);
        } finally {
            orderStatisticsLoading.value = false;
        }
    };

    // 获取客户发货量 TOP10 —  getCustomerShipmentApi
    const loadCustomerShipment = async () => {
        customerShipmentLoading.value = true;
        try {
            const res: any = await getCustomerShipmentApi();
            if (res.code === 200 && Array.isArray(res.data) && res.data.length) {
                replaceReactiveArray(shipmentData, res.data);
            }
        } catch (error) {
            console.warn("客户发货量数据获取失败", error);
        } finally {
            customerShipmentLoading.value = false;
        }
    };

    const loadBannerData = async () => {
        bannerLoading.value = true;
        try {
            const res: any = await getBannerListApi({});
            if (res.code === 200 && Array.isArray(res.data) && res.data.length) {
                replaceReactiveArray(bannerList, res.data);
            }
        } catch (error) {
            console.warn("轮播图数据获取失败", error);
        } finally {
            bannerLoading.value = false;
        }
    };
    // 获取核心数据。外运矿量接口暂时停用，保留默认值 0。
    const loadCoreData = async () => {
        coreDataLoading.value = true;
        try {
            const res: any = await getCoreDataApi();
            if (res.code === 200 && res.data) {
                Object.assign(coreData, res.data);
            } else {
                console.warn("核心数据获取失败", res);
            }
        } catch (error) {
            console.warn("首页核心数据获取失败", error);
        } finally {
            coreDataLoading.value = false;
        }
    };

    // 获取待结算-待回款数据 — getSettlementDataApi
    const loadSettlementData = async () => {
        settlementLoading.value = true;
        try {
            const res: any = await getSettlementDataApi();
            if (res.code === 200 && res.data) {
                if (res.data.xAxisData?.length) {
                    replaceReactiveArray(paymenyData.xAxisData, res.data.xAxisData);
                }
                if (res.data.seriesData?.length) {
                    paymenyData.seriesData.length = 0;
                    res.data.seriesData.forEach((item: any) => {
                        paymenyData.seriesData.push({
                            name: item.name,
                            data: [...(item.data || [])],
                        });
                    });
                }
            }
        } catch (error) {
            console.warn("待结算-待回款数据获取失败", error);
        } finally {
            settlementLoading.value = false;
        }
    };



    // 库存报表数据 — 从 getInventoryReportApi 获取，转换为组件所需格式
    const loadInventoryReportData = async () => {
        inventoryLoading.value = true;
        try {
            const res: any = await getInventoryReportApi();
            if (res?.code !== 200) return;
            inventoryReportData.rawData = res?.data || {};
            inventoryReportData.totalInventory = res?.data?.num ?? 0;
            inventoryReportData.highInventory = res?.data?.highNum ?? 0;
            inventoryReportData.lowInventory = res?.data?.lowNum ?? 0;
            inventoryReportData.mixedOreNum = res?.data?.mixedOreNum ?? 0;
            inventoryReportData.transferNums = res?.data?.transferNums ?? 0;
            const options = normalizeInventoryReport(res?.data);
            replaceReactiveArray(inventoryReportData.inventoryOptions, options as any);
        } catch (error) {
            console.warn("InventoryReport 数据获取失败", error);
        } finally {
            inventoryLoading.value = false;
        }
    };

    onMounted(() => {
        loadCoreData();
        loadSettlementData();
        loadOrderStatistics();
        loadCustomerShipment();
        loadBannerData();
        loadInventoryReportData();
    });

    return {
        coreDataLoading,
        settlementLoading,
        orderStatisticsLoading,
        customerShipmentLoading,
        bannerLoading,
        inventoryLoading,
        coreData,
        bannerList,
        monthsOrders,
        paymenyData,
        shipmentData,
        inventoryReportData,
    };
};

export default useDashboardData;

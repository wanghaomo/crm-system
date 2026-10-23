import { createRouter, createWebHashHistory } from 'vue-router';
import { normalizePath, addRouterPrefix, buildRoutes, transformRoutes } from './routeUtils';
import { DEFAULT_MENU_PATH } from '@/config/global.cfg';
import { useRouteStore } from '@/store/index.js';
import { storeToRefs } from 'pinia';
function formatPath(path: string) {
    if (!path) return path;
    if (path.startsWith(import.meta.env.VITE_APP_SYSTEM_CODE + '/')) return path;
    if (path.startsWith('http') || path.startsWith('//')) return path;
    if (path.startsWith('/')) return `${import.meta.env.VITE_APP_SYSTEM_CODE}${path}`;
    return `${import.meta.env.VITE_APP_SYSTEM_CODE}/${path}`;
}

// 定义常量路由
const constantRoutes = [
    {
        path: formatPath('/'),
        redirect: formatPath('/login'),
    },
    {
        path: formatPath('/login'),
        name: 'login',
        component: () => import('@/views/login/index.vue'),
        meta: {
            layout: 'blank-layout',
            nologin: true,
        },
    },
    {
        path: formatPath('/404'),
        name: '404',
        component: () => import('@/views/404.vue'),
        meta: {
            layout: 'blank-layout',
            nologin: true,
        },
    },
    {
        path: formatPath('/home/index'),
        name: 'home',
        component: () => import('@/views/home/index.vue'),
        meta: {
            layout: 'main-layout',
            nologin: true,
            code: 'home',
        },
    },
    {
        path: formatPath('/test'),
        name: 'cache-test',
        component: () => import('@/views/test/index.vue'),
        meta: {
            title: '缓存部署验证页',
            layout: 'blank-layout',
            nologin: true,
        },
    },
    // 客户档案
    {
        path: formatPath('/customerManage/customerArchive/add'),
        name: 'crm:customer_archive:create',
        component: () => import('@/views/customerManage/customerArchive/add/index.vue'),
        meta: {
            title: '新增',
            nologin: false,
            layout: 'main-layout',
            code: 'crm:customer_archive:create',
            parentCode: 'crm:customer_archive',
        },
    },
    {
        path: formatPath('/customerManage/customerArchive/edit'),
        name: 'crm:customer_archive:edit',
        component: () => import('@/views/customerManage/customerArchive/add/index.vue'),
        meta: {
            title: '编辑',
            nologin: false,
            layout: 'main-layout',
            code: 'crm:customer_archive:edit',
            parentCode: 'crm:customer_archive',
        },
    },
    {
        path: formatPath('/customerManage/customerArchive/detail'),
        name: 'crm:customer_archive:detail',
        component: () => import('@/views/customerManage/customerArchive/detail/web.vue'),
        meta: {
            title: '详情',
            nologin: false,
            layout: 'main-layout',
            code: 'crm:customer_archive:detail',
            parentCode: 'crm:customer_archive',
        },
    },
    // 来访记录
    {
        path: formatPath('/customerManage/visitRecord/add'),
        component: () => import('@/views/customerManage/visitRecord/add/index.vue'),
        name: 'crm:visit_record:create',
        meta: {
            title: '新增',
            nologin: false,
            layout: 'main-layout',
            code: 'crm:visit_record:create',
            parentCode: 'crm:visit_record',
        },
    },
    {
        path: formatPath('/customerManage/visitRecord/edit'),
        component: () => import('@/views/customerManage/visitRecord/add/index.vue'),
        name: 'crm:visit_record:edit',
        meta: {
            title: '编辑',
            nologin: false,
            layout: 'main-layout',
            code: 'crm:visit_record:edit',
            parentCode: 'crm:visit_record',
        },
    },
    {
        path: formatPath('/customerManage/visitRecord/detail'),
        component: () => import('@/views/customerManage/visitRecord/detail/index.vue'),
        name: 'crm:visit_record:detail',
        meta: {
            title: '来访记录详情',
            nologin: false,
            layout: 'main-layout',
            code: 'crm:visit_record:detail',
            parentCode: 'crm:visit_record',
        },
    },

    // 拜访记录
    {
        path: formatPath('/customerManage/visitPlan/add'),
        name: 'crm:visit_plan:create',
        component: () => import('@/views/customerManage/visitPlan/add/index.vue'),
        meta: {
            title: '新增',
            nologin: false,
            layout: 'main-layout',
            code: 'crm:visit_plan:create',
            parentCode: 'crm:visit_plan',
        },
    },
    {
        path: formatPath('/customerManage/visitPlan/edit'),
        name: 'crm:visit_plan:edit',
        component: () => import('@/views/customerManage/visitPlan/add/index.vue'),
        meta: {
            title: '编辑',
            nologin: false,
            layout: 'main-layout',
            code: 'crm:visit_plan:edit',
            parentCode: 'crm:visit_plan',
        },
    },
    {
        path: formatPath('/customerManage/visitPlan/detail'),
        name: 'crm:visit_plan:detail',
        component: () => import('@/views/customerManage/visitPlan/detail/index.vue'),
        meta: {
            title: '拜访记录详情',
            nologin: false,
            layout: 'main-layout',
            code: 'crm:visit_plan:detail',
            parentCode: 'crm:visit_plan',
        },
    },

    // 客户关怀
    {
        path: formatPath('/customerManage/customerCare/add'),
        component: () => import('@/views/customerManage/customerCare/add/index.vue'),
        name: 'crm:customer_car:create',
        meta: {
            title: '新增',
            nologin: false,
            layout: 'main-layout',
            code: 'crm:customer_car:create',
            parentCode: 'crm:customer_car',
        },
    },
    {
        path: formatPath('/customerManage/customerCare/edit'),
        component: () => import('@/views/customerManage/customerCare/add/index.vue'),
        name: 'crm:customer_car:edit',
        meta: {
            title: '编辑',
            nologin: false,
            layout: 'main-layout',
            code: 'crm:customer_car:edit',
            parentCode: 'crm:customer_car',
        },
    },

    // 服务规则配置
    {
        path: formatPath('/systemManage/serviceRuleConfig/add'),
        name: 'crm:service_rule_config:create',
        component: () => import('@/views/systemManage/serviceRuleConfig/add/index.vue'),
        meta: {
            title: '新增服务规则',
            nologin: false,
            layout: 'main-layout',
            code: 'crm:service_rule_config:create',
            parentCode: 'crm:service_rule_config',
        },
    },
    {
        path: formatPath('/systemManage/serviceRuleConfig/edit'),
        name: 'crm:service_rule_config:edit',
        component: () => import('@/views/systemManage/serviceRuleConfig/add/index.vue'),
        meta: {
            title: '编辑服务规则',
            nologin: false,
            layout: 'main-layout',
            code: 'crm:service_rule_config:edit',
            parentCode: 'crm:service_rule_config',
        },
    },
    // 市场信息 - 化工企业调研
    {
        path: formatPath('/marketInfo/chemicalCompany/add'),
        component: () => import('@/views/marketInfo/chemicalCompany/add/index.vue'),
        name: 'crm:chemical_company:create',
        meta: {
            title: '新增化工企业调研',
            nologin: false,
            layout: 'main-layout',
            code: 'crm:chemical_company:create',
            parentCode: 'crm:chemical_company',
        },
    },
    {
        path: formatPath('/marketInfo/chemicalCompany/edit'),
        component: () => import('@/views/marketInfo/chemicalCompany/add/index.vue'),
        name: 'crm:chemical_company:edit',
        meta: {
            title: '编辑化工企业调研',
            nologin: false,
            layout: 'main-layout',
            code: 'crm:chemical_company:edit',
            parentCode: 'crm:chemical_company',
        },
    },
    {
        path: formatPath('/marketInfo/chemicalCompany/detail'),
        component: () => import('@/views/marketInfo/chemicalCompany/detail/index.vue'),
        name: 'crm:chemical_company:detail',
        meta: {
            title: '化工企业调研详情',
            nologin: false,
            layout: 'main-layout',
            code: 'crm:chemical_company:detail',
            parentCode: 'crm:chemical_company',
        },
    },
    // 市场信息 - 竞争对手调研
    {
        path: formatPath('/marketInfo/competitor/add'),
        component: () => import('@/views/marketInfo/competitor/add/index.vue'),
        name: 'crm:competitor:create',
        meta: {
            title: '新增竞争对手调研',
            nologin: false,
            layout: 'main-layout',
            code: 'crm:competitor:create',
            parentCode: 'crm:competitor',
        },
    },
    {
        path: formatPath('/marketInfo/competitor/edit'),
        component: () => import('@/views/marketInfo/competitor/add/index.vue'),
        name: 'crm:competitor:edit',
        meta: {
            title: '编辑竞争对手调研',
            nologin: false,
            layout: 'main-layout',
            code: 'crm:competitor:edit',
            parentCode: 'crm:competitor',
        },
    },
     {
        path: formatPath('/marketInfo/competitor/detail'),
        component: () => import('@/views/marketInfo/competitor/detail/index.vue'),
        name: 'crm:competitor:detail',
        meta: {
            title: '竞争对手调研详情',
            nologin: false,
            layout: 'main-layout',
            code: 'crm:competitor:detail',
            parentCode: 'crm:competitor',
        },
    },
    // 市场信息 - 行业动态
    {
        path: formatPath('/marketInfo/industryNews/add'),
        component: () => import('@/views/marketInfo/industryNews/app/add.vue'),
        name: 'crm:industry_news:create',
        meta: {
            title: '新增行业动态',
            nologin: false,
            layout: 'main-layout',
            code: 'crm:industry_news:create',
            parentCode: 'crm:industry_news',
        },
    },
    {
        path: formatPath('/marketInfo/industryNews/detail'),
        component: () => import('@/views/marketInfo/industryNews/app/detail.vue'),
        name: 'crm:industry_news:detail',
        meta: {
            title: '行业动态详情',
            nologin: false,
            layout: 'main-layout',
            code: 'crm:industry_news:detail',
            parentCode: 'crm:industry_news',
        },
    },
    {
        path: formatPath('/marketInfo/industryNews/view'),
        component: () => import('@/views/marketInfo/industryNews/view/index.vue'),
        name: 'crm:industry_news:view',
        meta: {
            title: '行业动态详情',
            nologin: true,
            layout: 'blank-layout',
            code: 'crm:industry_news:view',
            parentCode: 'crm:industry_news',
        },
    },
    // 市场信息 - 市场报告
    {
        path: formatPath('/marketInfo/marketReport/add'),
        component: () => import('@/views/marketInfo/marketReport/app/add.vue'),
        name: 'crm:market_report:create',
        meta: {
            title: '新增市场报告',
            nologin: false,
            layout: 'main-layout',
            code: 'crm:market_report:create',
            parentCode: 'crm:market_report',
        },
    },
    {
        path: formatPath('/marketInfo/marketReport/detail'),
        component: () => import('@/views/marketInfo/marketReport/app/detail.vue'),
        name: 'crm:market_report:detail',
        meta: {
            title: '市场报告详情',
            nologin: false,
            layout: 'main-layout',
            code: 'crm:market_report:detail',
            parentCode: 'crm:market_report',
        },
    },
    {
        path: formatPath('/marketInfo/marketReport/view'),
        component: () => import('@/views/marketInfo/marketReport/view/index.vue'),
        name: 'crm:market_report:view',
        meta: {
            title: '市场报告详情',
            nologin: true,
            layout: 'blank-layout',
            code: 'crm:market_report:view',
            parentCode: 'crm:market_report',
        },
    },
    // 框架合同
    {
        path: formatPath('/frameworkContract/add'),
        name: 'crm:framework_contract:create',
        component: () => import('@/views/contractManage/frameworkContract/add/index.vue'),
        meta: {
            title: '新增框架合同',
            nologin: false,
            layout: 'main-layout',
            code: 'crm:framework_contract:create',
            parentCode: 'crm:framework_contract',
        },
    },
    {
        path: formatPath('/frameworkContract/edit'),
        name: 'crm:framework_contract:edit',
        component: () => import('@/views/contractManage/frameworkContract/add/index.vue'),
        meta: {
            title: '编辑框架合同',
            nologin: false,
            layout: 'main-layout',
            code: 'crm:framework_contract:edit',
            parentCode: 'crm:framework_contract',
        },
    },
    {
        path: formatPath('/frameworkContract/detail'),
        name: 'crm:framework_contract:detail',
        component: () => import('@/views/contractManage/frameworkContract/detail/index.vue'),
        meta: {
            title: '框架合同详情',
            nologin: false,
            layout: 'main-layout',
            code: 'crm:framework_contract:detail',
            parentCode: 'crm:framework_contract',
        },
    },
     // 销售合同
    {
        path: formatPath('/salesContract/add'),
        name: 'crm:sales_contract:create',
        component: () => import('@/views/contractManage/salesContract/add/index.vue'),
        meta: {
            title: '新增销售合同',
            nologin: false,
            layout: 'main-layout',
            code: 'crm:sales_contract:create',
            parentCode: 'crm:sales_contract',
        },
    },
   
    {
        path: formatPath('/salesContract/edit'),
        name: 'crm:sales_contract:edit',
        component: () => import('@/views/contractManage/salesContract/add/index.vue'),
        meta: {
            title: '编辑销售合同',
            nologin: false,
            layout: 'main-layout',
            code: 'crm:sales_contract:edit',
            parentCode: 'crm:sales_contract',
        },
    },
    {
        path: formatPath('/salesContract/detail'),
        name: 'crm:sales_contract:detail',
        component: () => import('@/views/contractManage/salesContract/detail/index.vue'),
        meta: {
            title: '销售合同详情',
            nologin: false,
            layout: 'main-layout',
            code: 'crm:sales_contract:detail',
            parentCode: 'crm:sales_contract',
        },
    },
    {
        path: formatPath('/aiPrediction/detail'),
        name: 'crm:ai_prediction:detail',
        component: () => import('@/views/salesPlan/aiPrediction/components/appDetails.vue'),
        meta: {
            title: '销售合同详情',
            nologin: false,
            layout: 'main-layout',
            code: 'crm:ai_prediction:detail',
            parentCode: 'crm:ai_prediction',
        },      
    },
    // 化工企业基准定价
    {
        path: formatPath('/salesPlan/firmPrice/add'),
        name: 'crm:firm_rice:create',
        component: () => import('@/views/salesPlan/firmPrice/add/index.vue'),
        meta: {
            title: '新增化工企业基准定价',
            nologin: false,
            layout: 'main-layout',
            code: 'crm:firm_rice:create',
            parentCode: 'crm:firm_rice',
        },
    },
    {
        path: formatPath('/salesPlan/firmPrice/edit'),
        name: 'crm:firm_rice:edit',
        component: () => import('@/views/salesPlan/firmPrice/add/index.vue'),
        meta: {
            title: '编辑化工企业基准定价',
            nologin: false,
            layout: 'main-layout',
            code: 'crm:firm_rice:edit',
            parentCode: 'crm:firm_rice',
        },
    },
    // 贸易商基准定价
    {
        path: formatPath('/traffickerPrice/add'),
        name: 'crm:trafficker_rice:create',
        component: () => import('@/views/salesPlan/traffickerPrice/add/index.vue'),
        meta: {
            title: '贸易商基准定价新增',
            nologin: false,
            layout: 'main-layout',
            code: 'crm:trafficker_rice:create',
            parentCode: 'crm:trafficker_rice',
        },
    },
    {
        path: formatPath('/traffickerPrice/edit'),
        name: 'crm:trafficker_rice:edit',
        component: () => import('@/views/salesPlan/traffickerPrice/add/index.vue'),
        meta: {
            title: '贸易商基准定价编辑',
            nologin: false,
            layout: 'main-layout',
            code: 'crm:trafficker_rice:edit',
            parentCode: 'crm:trafficker_rice',
        },
    },
    // 合同定价
    {
        path: formatPath('/salesPlan/contractPrice/add'),
        name: 'crm:contract_price:create',
        component: () => import('@/views/salesPlan/contractPrice/add/index.vue'),
        meta: {
            title: '新增合同定价',
            nologin: false,
            layout: 'main-layout',
            code: 'crm:contract_price:create',
            parentCode: 'crm:contract_price',
        },
    },
    {
        path: formatPath('/salesPlan/contractPrice/edit'),
        name: 'crm:contract_price:edit',
        component: () => import('@/views/salesPlan/contractPrice/add/index.vue'),
        meta: {
            title: '编辑合同定价',
            nologin: false,
            layout: 'main-layout',
            code: 'crm:contract_price:edit',
            parentCode: 'crm:contract_price',
        },
    },
    // 回款
    {
        path: formatPath('/settlementManage/payment/detail'),
        name: 'crm:payment:detail',
        component: () => import('@/views/settlementManage/payment/detail.vue'),
        meta: {
            title: '详情',
            nologin: false,
            layout: 'main-layout',
            code: 'crm:payment:detail',
            parentCode: 'crm:payment',
        },
    },
    {
        path: formatPath('/settlementManage/payment/batchPayment'),
        name: 'crm:payment:batchPayment',
        component: () => import('@/views/settlementManage/payment/batchPayment.vue'),
        meta: {
            title: '批量回款',
            nologin: false,
            layout: 'main-layout',
            code: 'crm:payment:batchPayment',
            parentCode: 'crm:payment',
        },
    },
    {
        path: formatPath('/settlementManage/payment/batchPaymentSupplement'),
        name: 'crm:payment:batchPaymentSupplement',
        component: () => import('@/views/settlementManage/payment/appCpns/batchPaymentSupplement.vue'),
        meta: {
            title: '补充回款明细',
            nologin: false,
            layout: 'main-layout',
            code: 'crm:payment:batchPaymentSupplement',
            parentCode: 'crm:payment',
        },
    },
    {
        path: formatPath('/settlementManage/payment/edit'),
        name: 'crm:payment:edit',
        component: () => import('@/views/settlementManage/payment/edit.vue'),
        meta: {
            title: '编辑',
            nologin: false,
            layout: 'main-layout',
            code: 'crm:payment:edit',
            parentCode: 'crm:payment',
        },
    },
    {
        path: formatPath('/settlementManage/payment/paymentRecord'),
        name: 'crm:payment:paymentRecord',
        component: () => import('@/views/settlementManage/payment/appCpns/paymentRecord.vue'),
        meta: {
            title: '回款',
            nologin: false,
            layout: 'main-layout',
            code: 'crm:payment:paymentRecord',
            parentCode: 'crm:payment',
        },
    },
    {
        path: formatPath('/settlementManage/payment/jreminderRecord'),
        name: 'crm:payment:jreminderRecord',
        component: () => import('@/views/settlementManage/payment/appCpns/jreminderRecord.vue'),
        meta: {
            title: '催款',
            nologin: false,
            layout: 'main-layout',
            code: 'crm:payment:jreminderRecord',
            parentCode: 'crm:payment',
        },
    },
    // 结算
    {
        path: formatPath('/settlementManage/settlement/detail'),
        name: 'crm:settlement:detail',
        component: () => import('@/views/settlementManage/settlement/detail.vue'),
        meta: {
            title: '详情',
            nologin: false,
            layout: 'main-layout',
            code: 'crm:settlement:detail',
            parentCode: 'crm:settlement',
        },
    },
    {
        path: formatPath('/settlementManage/settlement/create'),
        name: 'crm:settlement:create',
        component: () => import('@/views/settlementManage/settlement/create.vue'),
        meta: {
            title: '新增',
            nologin: true,
            layout: 'main-layout',
            code: 'crm:settlement:create',
            parentCode: 'crm:settlement', 
        },
    },
    {
        path: formatPath('/settlementManage/settlement/edit'),
        name: 'crm:settlement:edit',
        component: () => import('@/views/settlementManage/settlement/create.vue'),
        meta: {
            title: '编辑',
            nologin: true,
            layout: 'main-layout',
            code: 'crm:settlement:edit',
            parentCode: 'crm:settlement', 
        },
    },
    {
        path: formatPath('/settlementManage/settlement/settlementDetail'),
        name: 'crm:settlement:settlementDetail',
        component: () => import('@/views/settlementManage/settlement/appCpns/settlementDetail.vue'),
        meta: {
            title: '新增结算单',
            nologin: true,
            layout: 'main-layout',
            code: 'crm:settlement:settlementDetail',
            parentCode: 'crm:settlement', 
        },
    },
    {
        path: formatPath('/settlementManage/settlement/addInvoiceInfoDetail'),
        name: 'crm:settlement:addInvoiceInfoDetail',
        component: () => import('@/views/settlementManage/settlement/appCpns/addInvoiceInfoDetail.vue'),
        meta: {
            title: '新增开票明细',
            nologin: true,
            layout: 'main-layout',
            code: 'crm:settlement:addInvoiceInfoDetail',
            parentCode: 'crm:settlement', 
        },
    },
    // 月发货计划
    {
        path: formatPath('/monthlyShippingPlan/add'),
        name: 'crm:monthly_shipping_plan:create',
        component: () => import('@/views/salesPlan/monthlyShippingPlan/add/index.vue'),
        meta: {
            title: '新增月发货计划',
            nologin: false,
            layout: 'main-layout',
            code: 'crm:monthly_shipping_plan:create',
            parentCode: 'crm:monthly_shipping_plan',
        },
    },
    {
        path: formatPath('/monthlyShippingPlan/edit'),
        name: 'crm:monthly_shipping_plan:edit',
        component: () => import('@/views/salesPlan/monthlyShippingPlan/add/index.vue'),
        meta: {
            title: '编辑月发货计划',
            nologin: false,
            layout: 'main-layout',
            code: 'crm:monthly_shipping_plan:edit',
            parentCode: 'crm:monthly_shipping_plan',
        },
    },
    {
        path: formatPath('/monthlyShippingPlan/detail'),
        name: 'crm:monthly_shipping_plan:detail',
        component: () => import('@/views/salesPlan/monthlyShippingPlan/detail/index.vue'),
        meta: {
            title: '月发货计划详情',
            nologin: false,
            layout: 'main-layout',
            code: 'crm:monthly_shipping_plan:detail',
            parentCode: 'crm:monthly_shipping_plan',
        },
    },
    //发运计划
    
    {
        path: formatPath('/shippingManage/dailyShippingPlan/create'),
        name: 'crm:daily_shipping_plan:create',
        component: () => import('@/views/shippingManage/dailyShippingPlan/create.vue'),
        meta: {
            title: '新增发运计划',
            nologin: false,
            layout: 'main-layout',
            code: 'crm:daily_shipping_plan:create',
            parentCode: 'crm:daily_shipping_plan',
        },
    },
    
    {
        path: formatPath('/shippingManage/dailyShippingPlan/edit'),
        name: 'crm:daily_shipping_plan:edit',
        component: () => import('@/views/shippingManage/dailyShippingPlan/create.vue'),
        meta: {
            title: '编辑发运计划',
            nologin: false,
            layout: 'main-layout',
            code: 'crm:daily_shipping_plan:edit',
            parentCode: 'crm:daily_shipping_plan',
        },
    },
    {
        path: formatPath('/shippingManage/dailyShippingPlan/detail'),
        name: 'crm:daily_shipping_plan:detail',
        component: () => import('@/views/shippingManage/dailyShippingPlan/detail.vue'),
        meta: {
            title: '发货订单详情',
            nologin: false,
            layout: 'main-layout',
            code: 'crm:daily_shipping_plan:detail',
            parentCode: 'crm:daily_shipping_plan',
        },
    },  {
        path: formatPath('/shippingManage/dailyShippingPlan/transportSituation'),
        name: 'crm:daily_shipping_plan:transportSituation',
        component: () => import('@/views/shippingManage/dailyShippingPlan/appCpns/transportSituation.vue'),
        meta: {
            title: '运输情况',
            nologin: false,
            layout: 'main-layout',
            code: 'crm:daily_shipping_plan:transportSituation',
            parentCode: 'crm:daily_shipping_plan',
        },
    },
    {
        path: formatPath('/shippingManage/dailyShippingPlan/waybillDetails'),
        name: 'crm:daily_shipping_plan:waybillDetails',
        component: () => import('@/views/shippingManage/dailyShippingPlan/appCpns/waybillDetails.vue'),
        meta: {
            title: '运单详情',
            nologin: false,
            layout: 'main-layout',
            code: 'crm:daily_shipping_plan:waybillDetails',
            parentCode: 'crm:daily_shipping_plan',
        },
    },
    //数据看板
    
    {
        path: formatPath('/dashboard/index'),
        name: 'crm:dashboard:index',
        component: () => import('@/views/dashboard/index.vue'),
        meta: {
            title: '数据看板',
            nologin: false,
            layout: 'main-layout',
            code: 'crm:dashboard:index',
        },
    },
];

// 创建路由实例
const _router = createRouter({
    history: createWebHashHistory(),
    routes: constantRoutes,
});

// 路由初始化方法
async function initQiankunRoutes(routers?: any[]) {
    const { routerArray } = storeToRefs(useRouteStore());
    const newRouters = routers || routerArray.value;

    // if (!window.__POWERED_BY_QIANKUN__ || !window.__QIANKUN_ROUTER_BASE__) {
    //     // Vue 3 使用 addRoute 方法添加路由
    //     newRouters.forEach((route) => {
    //         _router.addRoute(route);
    //     });
    //     return;
    // }
    const routes = buildRoutes(newRouters);
    console.log('============处理后的路由注册数据', routes);

    // Vue 3 使用 addRoute 方法添加路由
    // routes.forEach((route) => {
    //     _router.addRoute(route);
    // });
    await addRoutes(routes);
}
// 动态添加路由
export async function addRoutes(routes) {
    // 如果没有路由，直接返回
    if (!routes || routes.length === 0) return;

    const newRoutes = transformRoutes(routes);

    const formatRoutes = async (routes) => {
        (routes || []).forEach((route) => {
            let targetPath = route.path;
            targetPath = formatPath(targetPath);
            if (targetPath) {
                if (!_router.hasRoute(route.code)) {
                    const newRoute = { ...route, name: route.code, label: route.name, path: targetPath };
                    // 保留 children 属性，让 Vue Router 处理嵌套路由
                    delete newRoute.children;
                    _router.addRoute(newRoute);
                }
            }
            if (route.children) {
                formatRoutes(route.children);
            }
        });
    };
    await formatRoutes(newRoutes);
}

let isBeforeEachHandled = false;
_router.beforeEach((to, from, next) => {
    if(!to.path.includes('/login')){
        window.systemLoadingDom?.hide();
    }
    if (isBeforeEachHandled) {
        return;
    }
    isBeforeEachHandled = true;

    const originalNext = next;
    next = (to) => {
        isBeforeEachHandled = false;
        originalNext(to);
        return;
    };
    console.log('========to', to, from);
    console.log('========所有注册的路由', _router.getRoutes());

    let targetPath = to.path;

    if (targetPath === import.meta.env.VITE_APP_SYSTEM_CODE || targetPath === '' || targetPath === '/') {
        next(formatPath('/login'));
        return;
    }

    if (!targetPath.startsWith(import.meta.env.VITE_APP_SYSTEM_CODE + '/')) {
        to.path = formatPath(targetPath);
        next(to);
        return;
    }

    next();
});
export { initQiankunRoutes };

export default _router;

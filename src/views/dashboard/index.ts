// ============================================================
// 【纯前端配置】以下配置由前端维护，后端无需返回
// ============================================================

/** 在途库存表格列定义。 */
export const inventoryColumns = [
  { key: 'licensePlate', title: '船号', width: 100, ellipsis: true },
  { key: 'originYard', title: '始发码头', width: 100, ellipsis: true },
  { key: 'destinationYard', title: '目的码头', width: 100, ellipsis: true },
  { key: 'goods', title: '货物', width: 100, ellipsis: true },
  { key: 'netWeight', title: '吨位', width: 100, ellipsis: true },
]

// ============================================================
// 【后端接口数据】以下为 Mock 数据，后端需按此结构返回
// ============================================================


export default () => {

  // ============================================================
  // 一、核心业务数据  coreData
  // ============================================================
  const coreData = {
    shipmentNum: 178.79,   // number - 全年发货总量（万吨）【真实系统：178.79】
    shipmentCarNum: 5.6,   // number - 总车次（万次）
    payment: 75732.83, // number - 全年累计回款金额（万元）【真实系统：75,732.83】
    collectionRate: 85.49,    // number - 回款率（%）【真实系统：85.49】
    customerNum: 31,    // number - 客户总数【真实系统：共31条客户档案】
    core: 6,     // number - 核心客户数量
    addNum: 1,     // number - 新增核心客户数量
    inventory: 7.66,   // number - 库存总览（万吨）【真实系统：7.66】
    contract: 111766.6,    // number - 合同总览（万元）【真实系统：111,766.6】
    expire: 6,     // number - 到期提醒（份）
  }

  // ============================================================
  // 二、轮播图 / 资讯快讯  bannerList
  // ============================================================
  const bannerList = [
    {
      title: '磷矿石市场',           // string - 标题
      type: 'report',              // string - 类型标识(report|industry|chemical|competing)
      typeName: '市场报告',             // string - 类型中文名
      time: '2026-04-15 12:00:00', // string - 发布时间 (yyyy-MM-dd HH:mm:ss)
    }, {
      title: '第一周行业动态报告',
      type: 'industry',
      typeName: '行业动态',
      time: '2026-04-15 12:00:00',
    }, {
      title: '兴发集团有限公司',
      type: 'chemical',
      typeName: '化工企业调研',
      time: '2026-04-15 12:00:00',
    }, {
      title: '兴发集团有限公司',
      type: 'competing',
      typeName: '竞争企业调研',
      time: '2026-04-15 12:00:00',
    },
  ]


  // ============================================================
  // 三、本月订单执行状态  monthsOrders
  // ============================================================
  const monthsOrders = [
    {
      id: 1,                                // number - 唯一标识
      constractNumber: 'JY-HSZ-2026048',    // string - 合同编号【真实格式】
      enterpriseName: '云图嘉施利',          // string - 客户名称【真实客户】
      oreGgrade: '24',                    // string - 矿山品位（%）
      contractQuantity: '50,000',            // string - 合同数量（吨）
      shippedQuantity: '32,000',             // string - 已发货数量（吨）
      intransitQuantity: '8,000',             // string - 在途数量（吨）
      deliveryQuantity: '10,000',             // string - 已交割数量（吨）
    }, {
      id: 2,
      constractNumber: 'JY-HSZ-2026047',
      enterpriseName: '施可丰',
      oreGgrade: '22',
      contractQuantity: '40,000',
      shippedQuantity: '25,000',
      intransitQuantity: '6,000',
      deliveryQuantity: '9,000',
    }, {
      id: 3,
      constractNumber: 'JY-HSZ-2026046',
      enterpriseName: '中农集团控股四川农资有限公司',
      oreGgrade: '28',
      contractQuantity: '30,000',
      shippedQuantity: '18,000',
      intransitQuantity: '5,000',
      deliveryQuantity: '7,000',
    }, {
      id: 4,
      constractNumber: 'JY-HSZ-2026045',
      enterpriseName: '史丹利',
      oreGgrade: '26',
      contractQuantity: '25,000',
      shippedQuantity: '15,000',
      intransitQuantity: '4,000',
      deliveryQuantity: '6,000',
    }, {
      id: 5,
      constractNumber: 'JY-HSZ-2026044',
      enterpriseName: '湖北宜化集团有限责任公司',
      oreGgrade: '30',
      contractQuantity: '20,000',
      shippedQuantity: '12,000',
      intransitQuantity: '3,000',
      deliveryQuantity: '5,000',
    }, {
      id: 6,
      constractNumber: 'JY-HSZ-2026043',
      enterpriseName: '中化涪陵化工',
      oreGgrade: '22',
      contractQuantity: '18,000',
      shippedQuantity: '9,000',
      intransitQuantity: '4,000',
      deliveryQuantity: '5,000',
    }, {
      id: 7,
      constractNumber: 'JY-HSZ-2026042',
      enterpriseName: '明熙矿业',
      oreGgrade: '27',
      contractQuantity: '15,000',
      shippedQuantity: '8,000',
      intransitQuantity: '3,000',
      deliveryQuantity: '4,000',
    }, {
      id: 8,
      constractNumber: 'JY-HSZ-2026041',
      enterpriseName: '马边灏阳',
      oreGgrade: '25',
      contractQuantity: '12,000',
      shippedQuantity: '6,000',
      intransitQuantity: '2,000',
      deliveryQuantity: '4,000',
    },
  ]


  // ============================================================
  // 四、待结算-待回款对比  paymenyData
  //   注：seriesData[].color 已移除，前端根据 name 自行匹配颜色
  // ============================================================
  const paymenyData = {
    /** X 轴月份标签 */
    xAxisData: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
    /** 系列数据 */
    seriesData: [
      { name: '待结算', data: [4, 10, 21, 16, 13, 27, 23, 16, 31, 28, 22, 30] },
      { name: '待回款', data: [13, 27, 23, 16, 31, 28, 22, 30, 36, 24, 33, 45] },
    ],
  }

  // ============================================================
  // 五、客户发货量 Top10  shipmentData
  //   注：已移除 unit（前端固定"千吨"）、progress（前端根据 value 计算）
  // ============================================================
  const shipmentData = [
    { title: '云图嘉施利', value: 18200 },
    { title: '湖北宜化集团有限责任公司', value: 15600 },
    { title: '中农集团控股四川农资有限公司', value: 14300 },
    { title: '史丹利', value: 12800 },
    { title: '施可丰', value: 10500 },
    { title: '中化涪陵化工', value: 9200 },
    { title: '云图新能源', value: 7800 },
    { title: '明熙矿业', value: 6500 },
    { title: '马边灏阳', value: 4200 },
    { title: '四川火石子贸易有限公司', value: 2800 },
  ]

  return {
    coreData,
    bannerList,
    monthsOrders,
    paymenyData,
    shipmentData,
  }
}

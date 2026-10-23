<template>
    <div class="logistics-info">
        <template v-for="item in list" :key="item.id">
            <div class="item">
                <div class="head">
                    <div class="icon"></div>
                    <div class="title">{{ item.status || '--' }}</div>
                    <div class="time">{{ item.time || '--' }}</div>
                </div>
                <div class="content">
                    <div class="main">
                        <div class="row" :class="{ 'attachment-row': row.type === 'attachments' }" v-for="row in item.rows" :key="row.label">
                            <div class="label">{{ row.label }}</div>
                            <div v-if="row.type === 'attachments' && row.value.length" class="attachment-list">
                                <MxWebFileUpload
                                    class="attachment-uploader"
                                    only-show
                                    :show-tips="false"
                                    :limit="row.value.length"
                                    :model-value="row.value"
                                />
                            </div>
                            <div v-else class="value">{{ row.type === 'attachments' ? '--' : displayValue(row.value) }}</div>
                        </div>
                    </div>
                </div>
            </div>
        </template>
        <div class="state-text" v-if="loading">物流信息加载中...</div>
        <div class="state-text" v-else-if="list.length === 0">暂无物流信息</div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import dayjs from 'dayjs';
import { getShipTransportationNodeListApi, getTransportPlanStatusListApi } from '@/api';

const props = defineProps({
    order: {
        type: Object,
        default: () => ({}),
    },
});
const list = ref<any[]>([]);
const loading = ref(false);
// 请求序号用于避免快速切换运输订单时旧请求覆盖新结果。
let latestRequestId = 0;
// TMS 船运运单状态枚举展示文案。
const shipStatusMap: Record<string, string> = {
    100: '待装货到港',
    101: '已装货到港',
    102: '已装货离港',
    103: '已卸货报港',
    104: '已卸货到港',
    105: '已卸货完成',
    106: '已拒绝',
    107: '已审核',
    108: '已作废',
};
// TMS 汽运状态枚举展示文案。
const landStatusMap: Record<string, string> = {
    1: '草稿',
    2: '待执行',
    3: '执行中',
    4: '已完成',
    5: '已取消',
    6: '归档',
    7: '作废',
};
/**
 * 格式化 TMS 返回的节点时间。
 * @param value 接口返回的时间值
 * @returns 标准时间文案，空值返回占位文案
 */
const formatDateTime = (value: any) => {
    if (!value) return '--';
    const date = dayjs(value);
    return date.isValid() ? date.format('YYYY-MM-DD HH:mm:ss') : String(value);
};
/**
 * 判断字段是否为有效展示值。
 * @param value 待判断字段值
 * @returns 是否存在有效值
 */
const hasValue = (value: any) => value !== undefined && value !== null && value !== '';
/**
 * 格式化普通字段展示值。
 * @param value 待展示字段值
 * @returns 有值时返回原值，空值返回占位文案
 */
const displayValue = (value: any) => (hasValue(value) ? value : '--');
/**
 * 从附件 URL 中解析展示文件名。
 * @param url 附件地址
 * @param index 附件序号
 * @returns 解码后的文件名，解析失败时返回原始文件名
 */
const getFileName = (url: string, index: number) => {
    const rawName = url.split(/[?#]/)[0].split('/').pop() || `附件${index + 1}`;
    try {
        return decodeURIComponent(rawName);
    } catch (error) {
        return rawName;
    }
};
/**
 * 将 TMS 附件字段统一转换为上传组件只读展示需要的数据结构。
 * @param value 附件字段，兼容 JSON 字符串、对象、数组和单个 URL
 * @returns 上传组件可识别的附件列表
 */
const parseAttachments = (value: any) => {
    let source: any[] = [];
    if (Array.isArray(value)) {
        source = value;
    } else if (value && typeof value === 'object') {
        source = [value];
    } else if (typeof value === 'string' && value.trim()) {
        try {
            const parsed = JSON.parse(value);
            source = Array.isArray(parsed) ? parsed : [parsed];
        } catch (error) {
            source = [{ url: value.trim() }];
        }
    }
    return source
        .map((file: any, index: number) => {
            const url = typeof file === 'string' ? file : file?.url || file?.fileUrl || '';
            if (!url) return null;
            return {
                fileId: `logistics-attachment-${index}`,
                url,
                fileName: file?.name || file?.fileName || file?.originalName || getFileName(url, index),
            };
        })
        .filter(Boolean);
};
/**
 * 格式化船运物流节点为页面时间线展示结构。
 * @param item TMS 船运节点
 * @returns 页面使用的船运节点展示数据
 */
const formatShipNode = (item: any) => ({
    id: item.id,
    status: shipStatusMap[String(item.status)] || item.status || '--',
    time: formatDateTime(item.nodeTime),
    rows: [
        { label: '起运量(吨)', value: displayValue(item.startingVolume) },
        { label: '到达量(吨)', value: displayValue(item.arrivalVolume) },
        { label: '附件', value: parseAttachments(item.attachment), type: 'attachments' },
        { label: '备注', value: item.remarks || '--' },
    ],
});
/**
 * 格式化汽运物流节点为页面时间线展示结构。
 * @param item TMS 汽运计划状态节点
 * @returns 页面使用的汽运节点展示数据
 */
const formatLandNode = (item: any) => ({
    id: item.id,
    status: landStatusMap[String(item.status)] || item.status || '--',
    time: formatDateTime(item.updatedAt || item.createdAt),
    rows: [
        { label: '计划编码', value: item.planCode || '--' },
        { label: '运单号', value: item.waybillNo || '--' },
    ],
});
/**
 * 根据当前运输订单获取物流信息。
 * 船运调用船运节点接口，汽运调用运输计划状态接口；没有运输订单时不请求 TMS。
 * @returns 无返回值，查询结果写入页面列表
 */
const getLogisticsList = async () => {
    const requestId = ++latestRequestId;
    const order = props.order || {};
    const transportType = String(order.shippingOrLand || '').toUpperCase();
    const transportationOrderCode = order.transportationOrderCode;
    const logisticsOrderCode = order.logisticsOrderCode;
    const isAutomobile = ['AOTOMOBILE', 'AUTOMOBILE', 'LAND', '汽运'].includes(transportType);
    list.value = [];
    if (isAutomobile ? !hasValue(logisticsOrderCode) : !hasValue(transportationOrderCode)) {
        loading.value = false;
        return;
    }
    loading.value = true;
    try {
        if (isAutomobile) {
            const res = await getTransportPlanStatusListApi({
                waybillNo: logisticsOrderCode,
            });
            if (requestId !== latestRequestId) return;
            const data = Array.isArray(res?.data) ? res.data : [];
            list.value = data.map((item: any) => formatLandNode(item)).reverse();
        } else {
            const res = await getShipTransportationNodeListApi({
                intermodalWaybillNo: transportationOrderCode,
            });
            if (requestId !== latestRequestId) return;
            const data = Array.isArray(res?.data) ? res.data : [];
            list.value = data.map((item: any) => formatShipNode(item)).reverse();
        }
    } catch (error) {
        if (requestId === latestRequestId) list.value = [];
        console.error('Failed to obtain logistics info:', error);
    } finally {
        if (requestId === latestRequestId) loading.value = false;
    }
};
watch(
    () => props.order,
    () => {
        getLogisticsList();
    },
    { immediate: true, deep: true }
);
</script>

<style scoped lang="less">
.logistics-info {
    margin-top: 12px;
    .item {
        margin-top: 4px;
        .head {
            display: flex;
            align-items: center;
            min-width: 0;
            .icon {
                width: 16px;
                height: 16px;
                flex: 0 0 16px;
                background: url('@/assets/images/icon⎽com⎽complete⎽blue.png');
                background-size: 100% 100%;
            }
            .title {
                font-weight: 600;
                font-size: 14px;
                color: #333333;
                margin-left: 8px;
                white-space: nowrap;
            }
            .time {
                margin-left: 8px;
                color: #666666;
                font-size: 12px;
                white-space: nowrap;
            }
        }
        .content {
            width: calc(100% - 7px);
            margin-left: 7px;
            border-left: 2px dashed #cce4ff;
            padding: 10px 16px 18px;
            .main {
                background: #f7f8fa;
                border: 1px solid #f0f1f3;
                border-radius: 8px;
                padding: 12px 16px;

                .row {
                    display: grid;
                    grid-template-columns: 64px minmax(0, 1fr);
                    gap: 12px;
                    margin-top: 10px;
                    line-height: 22px;
                    &:first-child {
                        margin-top: 0;
                    }
                    .label {
                        font-size: 14px;
                        color: #999999;
                        text-align: left;
                    }
                    .value {
                        min-width: 0;
                        font-size: 14px;
                        color: #333333;
                        word-break: break-word;
                    }
                }
                .attachment-row {
                    align-items: start;
                }
                .attachment-list {
                    width: 100%;
                    min-width: 0;
                    line-height: normal;
                    .attachment-uploader {
                        :deep(.thumbnail-list) {
                            gap: 8px;
                        }
                    }
                }
            }
        }

        &:nth-child(1) {
            .head {
                .icon {
                    background: url('@/assets/images/icon⎽com⎽time⎽blue.png');
                    background-size: 100% 100%;
                }
                .title {
                    color: #2c65f2;
                }
                .time {
                    color: #2c65f2;
                }
            }
        }
        &:last-child {
            .content {
                border-left: 2px solid transparent;
            }
        }
    }
    .state-text {
        padding: 20px 0;
        color: #999999;
        font-size: 14px;
        text-align: center;
    }
}
</style>

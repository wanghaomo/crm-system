<template>
    <div style="position: relative;">
        <div :class="[hasMore ? 'expand' : 'close']" ref="searchBarRef" class="search-bar">
            <div class="search-content">
                <div class="search-item" :class="[item.type == 'dateTimeRange' || item.type == 'dateTimeRange1' || item.type == 'monthrange' ? 'date-item' : '']" v-for="item in props.queryConfiguration">
                    <n-input :placeholder="item.placeholder || item.label" class="item searchInput" v-if="item.type === 'input'" v-model:value="searchObj[item.value]" type="text" clearable size="small" style="height: 34px" />
                    <n-date-picker class="item" v-if="item.type === 'date'" v-model:value="searchObj[item.value]" type="date" :placeholder="item.placeholder || item.label" clearable />
                    <n-date-picker class="item" v-if="item.type === 'month'" v-model:value="searchObj[item.value]" type="month" clearable />
                    <n-date-picker class="item" v-if="item.type === 'year'" v-model:value="searchObj[item.value]" type="year" clearable />
                    <n-date-picker class="item" v-if="item.type === 'dateTime'" v-model:value="searchObj[item.value]" type="datetime" clearable />
                    <n-date-picker :start-placeholder="item.leftPlaceholder || item.label + '开始时间'" :end-placeholder="item.rightPlaceholder || item.label + '结束时间'" class="item" v-if="item.type === 'dateRange'" v-model:value="searchObj[item.value]" type="daterange" clearable />
                    <n-date-picker :start-placeholder="item.leftPlaceholder || item.label + '开始时间'" :end-placeholder="item.rightPlaceholder || item.label + '结束时间'" clearable :shortcuts="quickDate" class="item" v-if="item.type === 'dateTimeRange'" v-model:value="searchObj[item.value]"
                        type="datetimerange" />
                    <n-date-picker :time-picker-props="timePickerProps" format="YYYY-MM-dd HH:mm" value-format="YYYY-MM-dd HH:mm" :start-placeholder="item.leftPlaceholder || item.label + '开始时间'" :end-placeholder="item.rightPlaceholder || item.label + '结束时间'" clearable :shortcuts="quickDate"
                        class="item" v-if="item.type === 'dateTimeRange1'" v-model:value="searchObj[item.value]" type="datetimerange" />
                    <n-date-picker :start-placeholder="item.leftPlaceholder || item.label + '开始月份'" :end-placeholder="item.rightPlaceholder || item.label + '结束月份'" class="item" v-if="item.type === 'monthrange'" v-model:value="searchObj[item.value]" type="monthrange" clearable />
                    <n-select :placeholder="item.placeholder || item.label" :max-tag-count="item.maxTageCount || undefined" v-if="item.type === 'select'" :multiple="item.isMultiple" v-model:value="searchObj[item.value]" :options="item.options" clearable />
                    <n-select :placeholder="item.placeholder || item.label" v-if="item.type === 'multipleSelect'" v-model:value="searchObj[item.value]" :options="item.options" clearable />
                    <MxCascaderTreeSelect :isSelectOnce="item.isSelectOnce" :placeholder="item.placeholder || item.label" clearable v-model:value="searchObj[item.value]" type="2" :isAllItem="false" :option="item.options" :valueKey="item.valueKey" :labelKey="item.labelKey"
                        :childrenKey="item.childrenKey" :multiple="item.isMultiple" v-if="item.type === 'treeSelect'"></MxCascaderTreeSelect>
                    <MxDict v-if="item.type === 'dict'" v-model="searchObj[item.value]" :multiple="item.isMultiple" clearable :placeholder="item.placeholder || item.label" :dictType="item.dictType" />
                    <MxPersonSelect v-if="item.type === 'personSelect'" v-model="searchObj[item.value]" :placeholder="item.placeholder || item.label" />
                </div>
                <!-- 自定义插槽，用于外部传入额外筛选项 -->
                <slot name="extra"></slot>
            </div>
            <div class="btn-box">
                <MxButton class="w56" type="default" :hasLeftIcon="true" @click="resetEvt">
                    <template #leftIcon> <i class="icon icon⎽com⎽reset"></i></template>
                    重置
                </MxButton>
                <MxButton :border="true" class="w56" type="success" @click="searchEvt">
                    <template #leftIcon><i class="icon search_icon"></i></template>
                    查询
                </MxButton>
                <div class="my-btn" v-if="showMore" @click="hasMore = !hasMore">
                    <div class="text">{{ hasMore ? '收起' : '展开' }}</div>
                    <n-icon class="icon" :class="[hasMore ? 'expand-icon' : 'close-icon']">
                        <ChevronDown />
                    </n-icon>
                </div>
            </div>
            <div class="bottom_border" v-if="!hiddenBorder"></div>
        </div>

    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { NInput, NDatePicker, NIcon, NSelect } from 'naive-ui';
import { ChevronDown } from '@vicons/ionicons5';
import { quickDate } from '@/utils';
import dayjs from 'dayjs';
import _ from 'lodash';

import { QueryItem } from '@/types/web-search-bar';

// 传入配置项
const props = defineProps<{
    queryConfiguration?: QueryItem[];
    hiddenBorder?: boolean;
}>();

// 时间传出
const emit = defineEmits<{
    (e: 'queryEvt', queryObj: any): void;
    (e: 'reset'): void;
}>();

// 查询对象
const searchObj = ref<any>({});

const timePickerProps = {
    format: 'HH:mm',
    inputReadonly: true,
    // defaultTime:null
};
// 初始化查询对象
const initSearchObj = () => {
    props.queryConfiguration?.forEach((it: any) => {
        if (it.type === 'input') {
            searchObj.value[it.value] = it.defaultValue || '';
        } else {
            searchObj.value[it.value] = it.defaultValue || null;
        }
    });
};

// 监听search-bar元素宽度改变
const searchBarRef = ref<HTMLDivElement | null>(null);
let resizeObserver: ResizeObserver | null = null;
let hasMore = ref<Boolean>(false);
let showMore = ref<Boolean>(false);

// 倒计时变量 - 使用 NodeJS.Timeout 类型
const timer = ref<any>(null);

// 监听元素宽度改变
onMounted(() => {
    if (searchBarRef.value) {
        resizeObserver = new ResizeObserver(() => {
            if (timer.value) {
                clearTimeout(timer.value);
            }
            timer.value = setTimeout(() => {
                setHasMoreStatus();
            }, 200);
        });
        resizeObserver.observe(searchBarRef.value);
    }
});

// 销毁监听
onBeforeUnmount(() => {
    if (resizeObserver) {
        resizeObserver.disconnect();
    }
});

// 是否有更多查询对象（基于真实 DOM 测量，自动涵盖插槽内容）
// 仅在收起状态下检测，展开后不再重新计算，保证「收起」按钮始终可见
const setHasMoreStatus = () => {
    if (!searchBarRef.value || hasMore.value) return;
    const searchContent = searchBarRef.value.querySelector<HTMLElement>('.search-content');
    if (!searchContent) return;
    showMore.value = searchContent.scrollHeight > searchContent.clientHeight + 2;
};

// 查询事件
const searchEvt = () => {
    let emitObj: any = _.cloneDeep(searchObj.value);
    props.queryConfiguration?.forEach((it) => {
        switch (it.type) {
            case 'date':
                if (!!emitObj[it.value]) {
                    emitObj[it.value] = dayjs(emitObj[it.value]).format('YYYY-MM-DD');
                }
                break;
            case 'dateTime':
                if (!!emitObj[it.value]) {
                    emitObj[it.value] = dayjs(emitObj[it.value]).format('YYYY-MM-DD HH:mm:ss');
                }
                break;
            case 'dateRange':
                if (Array.isArray(emitObj[it.value]) && emitObj[it.value].length === 2) {
                    emitObj[it.value][0] = dayjs(emitObj[it.value][0]).format('YYYY-MM-DD HH:mm:ss');
                    emitObj[it.value][1] = dayjs(emitObj[it.value][1]).endOf('day').format('YYYY-MM-DD HH:mm:ss');
                }
                break;
            case 'dateTimeRange':
                if (Array.isArray(emitObj[it.value]) && emitObj[it.value].length === 2) {
                    emitObj[it.value][0] = dayjs(emitObj[it.value][0]).format('YYYY-MM-DD HH:mm:ss');
                    emitObj[it.value][1] = dayjs(emitObj[it.value][1]).format('YYYY-MM-DD HH:mm:ss');
                }
                break;
            case 'dateTimeRange1':
                if (Array.isArray(emitObj[it.value]) && emitObj[it.value].length === 2) {
                    emitObj[it.value][0] = dayjs(emitObj[it.value][0]).format('YYYY-MM-DD HH:mm');
                    emitObj[it.value][1] = dayjs(emitObj[it.value][1]).format('YYYY-MM-DD HH:mm');
                }
                break;
            case 'monthrange':
                if (Array.isArray(emitObj[it.value]) && emitObj[it.value].length === 2) {
                    emitObj[it.value][0] = dayjs(emitObj[it.value][0]).format('YYYY-MM');
                    emitObj[it.value][1] = dayjs(emitObj[it.value][1]).format('YYYY-MM');
                }
                break;
            default:
                break;
        }
    });

    emit('queryEvt', emitObj);
};

// 重置
const resetEvt = () => {
    initSearchObj();
    emit('reset');
    searchEvt();
};

onMounted(() => {
    initSearchObj();
});
</script>

<style lang="less" scoped>
.icon⎽com⎽reset {
    width: 12px;
    height: 12px;
    background: center url('@/assets/images/icon⎽com⎽reset.png') no-repeat;
    background-size: 100% 100%;
}

.search_icon {
    width: 16px;
    height: 16px;
    background: center url('@/assets/images/search-icon.png') no-repeat;
    background-size: 100% 100%;
}

.search-bar {
    --search-row-height: 34px;
    --search-bar-collapsed-height: calc(var(--search-row-height) + var(--base-padding-16) + var(--base-padding-16));

    position: relative;
    min-height: var(--search-bar-collapsed-height);
    overflow: hidden;
    width: 100%;
    background-color: var(--g01);
    padding: var(--base-padding-16) var(--base-padding-16);
    display: flex;
    gap: var(--base-width);
    transition: all 0.3s;
    border-radius: 4px 4px 0px 0px;

    .search-content {
        flex-shrink: 1;
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
    }

    .search-item {
        min-width: 240px;
        height: var(--search-row-height);
        margin-top: 0;

        .item {
            width: 100%;
        }
    }

    .date-item {
        width: 502px;
    }

    .btn-box {
        flex-shrink: 0;
        display: flex;
        margin-left: auto;
        gap: var(--base-width-16);
        align-items: flex-end;

        .my-btn {
            height: 32px;
            display: flex;
            width: 46px;
            align-items: center;
            cursor: pointer;
            justify-content: space-between;

            .text {
                font-weight: 400;
                font-size: 14px;
                color: var(--web-success-tag-c);
            }

            .icon {
                font-size: 14px;
                color: var(--web-success-tag-c);
            }

            .expand-icon {
                transform: rotate(180deg);
            }

            .close-icon {
                transform: rotate(0deg);
            }

            :deep(.n-icon) {
                transition: all 0.3s;
            }
        }
    }

    :deep(.searchInput.n-input .n-input__input-el) {
        height: 34px
    }
}


.bottom_border {
    position: absolute;
    bottom: 0;
    left: 16px;
    right: 16px;
    width: calc(100% - 32px);
    height: 1px;
    background-color: var(--base-grey8);

}


.expand {
    height: auto;
    min-height: var(--search-bar-collapsed-height);
    overflow: visible;

    .search-content {
        max-height: none;
        overflow: visible;
    }
}

.close {
    height: var(--search-bar-collapsed-height);
    min-height: var(--search-bar-collapsed-height);
    overflow: hidden;

    .search-content {
        max-height: var(--search-row-height);
        overflow: hidden;
    }
}

.w56 {
    width: 56px;
}
</style>

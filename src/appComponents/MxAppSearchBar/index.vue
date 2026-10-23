<template>
    <div class="mx-app-search-container" :style="{
        'justify-content': type == 'action' ? justify : '',
    }">
        <template v-if="type == 'input'">
            <van-search class="mx-vant-search" shape="round" show-action v-model="searchValue" :placeholder="placeholder" :clearable="clearable" @search="onSearch" @focus="onFocus">
                <template v-if="showLeft" #label>
                    <div class="search-label">
                        <slot name="left">
                            <MxAppSearchActionItem v-if="leftActionConfig" v-model="leftActionConfig.value" :options="leftActionConfig.options" :label="leftActionConfig.label" :code="leftActionConfig.code" :checkType="leftActionConfig.checkType" :labelMaxLength="leftActionConfig.labelMaxLength"
                                :labelCustom="leftActionConfig.labelCustom" :customClick="leftActionConfig.customClick" @change="searchActionChange(leftActionConfig)" />
                        </slot>
                        <div class="dividing-line"></div>
                    </div>
                </template>
                <template #action>
                    <van-button class="mx-vant-btn" plain size="small" color="#2c65f2" round @click="onSearch">
                        {{ searchBtnText }}
                    </van-button>
                </template>
            </van-search>
        </template>
        <template v-if="type == 'action'">
            <MxAppSearchActionItem v-for="actionItem in actionList" v-model="actionItem.value" :options="actionItem.options" :label="actionItem.label" :code="actionItem.code" :checkType="actionItem.checkType" :labelMaxLength="actionItem.labelMaxLength" :labelCustom="actionItem.labelCustom"
                :customClick="actionItem.customClick" :key="actionItem.code" @change="searchActionChange(actionItem)" />
        </template>
        <div class="filter-btn" v-if="showFilter" @click="filterBtnClick">
            筛选
            <img class="icon" src="./icons/icon⎽com⎽filter.png" alt="">
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, PropType, watch } from 'vue';
import { ESearchType, ISearchEmits, ISearchParams } from './index.type';
import { Search as vanSearch, Icon as vanIcon, Button as vanButton } from 'vant';
import { IMxAppSearchActionItem } from '../MxAppSearchActionItem/index.types';
import MxAppSearchActionItem from '../MxAppSearchActionItem/index.vue';
import { useAppSearchSingleton } from '@/store/appSearchSingletonStore';
const appSearchSingleton = useAppSearchSingleton();
const emit = defineEmits<ISearchEmits>();
const props = defineProps({
    // 搜索栏类型
    type: {
        type: String as PropType<ESearchType>,
        default: 'input',
    },
    // 是否显示右侧筛选按钮
    showFilter: {
        type: Boolean,
        default: false,
    },
    // 当类型为action时，配置数据
    actionList: {
        type: Array as PropType<IMxAppSearchActionItem[]>,
        default: function () {
            return [];
        },
    },
    // 搜索框提示输入文字
    placeholder: {
        type: String,
        default: '请输入',
    },
    //搜索框默认值
    defaultValue: {
        type: [String, Number],
    },
    // 搜索按钮文字
    searchBtnText: {
        type: String,
        default: '查询',
    },
    // 是否可以清除
    clearable: {
        type: Boolean,
        default: true,
    },
    // 是否显示输入框内部label模块
    showLeft: {
        type: Boolean,
        default: false,
    },
    // 输入框内部action配置
    leftActionConfig: {
        type: Object as PropType<IMxAppSearchActionItem>,
    },
    // 当类型为action时，主轴对齐方式，可选值为 end center space-around space-between
    justify: {
        type: String,
        defautl: 'space-around',
    },
});

const searchValue = ref(props.defaultValue || '');

const resetValue = () => {
    searchValue.value = props.defaultValue
}
const onSearch = (e) => {
    appSearchSingleton.clearSaearchLowerContainer();
    let params: ISearchParams = {
        searchValue: searchValue.value,
    };
    if (props.showLeft && props.leftActionConfig) {
        params.actionList = [props.leftActionConfig];
    }
    if (props.type == 'action' && props.actionList) {
        params.actionList = props.actionList;
    }
    emit('search', params);
};
const onFocus = () => {
    appSearchSingleton.clearSaearchLowerContainer();
};
const filterBtnClick = () => {
    appSearchSingleton.clearSaearchLowerContainer();
    emit('showFilter', true);
};
//action时change事件
const searchActionChange = (actionItem: IMxAppSearchActionItem) => {
    emit('actionChange', actionItem);
};
defineExpose({
    searchValue,
    resetValue
});
</script>

<style scoped lang="less">
.mx-app-search-container {
    width: 100%;
    display: flex;
    justify-content: space-around;
    height: 52px;
    background: var(--base-white);
    align-items: center;

    .mx-vant-search {
        padding: 0px;
        flex: 1;

        :deep(.van-search__content) {
            background: #fff;
            border: 1px solid var(--base-border-grey);

            .van-search__label {
                padding: 0px;
            }
        }

        :deep(.van-search__action) {
            display: flex;
        }

        :deep(.van-field__control::placeholder) {
            color: #999;
            font-size: 14px;
        }
    }

    .mx-vant-btn {
        min-width: 72px;
        height: 34px;
        font-size: 14px;
    }

    .search-label {
        display: flex;
        align-items: center;
        margin-right: 12px;
        height: 100%;

        .dividing-line {
            width: 2px;
            height: 12px;
            background: #c9c9c9;
            margin-left: 12px;
        }
    }

    .filter-btn {
        display: flex;
        align-items: center;
        color: var(--base-grey2);
        font-size: var(--base-font-size);

        .icon {
            width: 16px;
            height: 16px;
            margin-left: 4px;
        }
    }
}
</style>
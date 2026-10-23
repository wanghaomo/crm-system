<template>
    <div
        :class="{
            'app-page-container': true,
            'no-header': !showHeader,
        }"
        :style="{ height: boxHeight }">
        <div class="app-page-container-header flex-between" v-if="showHeader">
            <!-- 返回 -->
            <i class="icon back-icon iconfont icon-fanhui1" v-if="showBack" @click="back"></i>
            <!-- 标题 -->
            <div class="title">
                {{ title }}
            </div>
            <div class="header-right">
                <!-- 如果有插槽，就渲染插槽内容，否则渲染默认内容 -->
                <slot name="right"></slot>
            </div>
        </div>
        <!-- 子标题 -->
        <div v-if="$slots['sub-title']" name="sub-title">
            <slot name="sub-title"></slot>
        </div>
        <!-- 搜索区域 -->
        <div class="app-search-container flex-between" v-if="showSearch">
            <slot name="search">
                <AppSearchBar
                    ref="appSearchBar"
                    v-bind="searchConfig"
                    @showFilter="onShowFilter"
                    @search="onSearch"
                    @actionChange="onActionChange"></AppSearchBar>
            </slot>
        </div>
        <div
            :class="{
                'app-page-content': true,
                'close-scroll': closeScroll,
                'no-padding': noPadding,
            }" ref="appPageContentRef">
            <!-- 展示列表信息 -->
            <PullRefresh v-model="refreshing" :disabled="disableRefresh" @refresh="onRefresh" v-if="showList">
                <List
                    :loading="loading"
                    :finished="finished"
                    v-model:error="loadError"
                    :disable="disableLoadMore"
                    :immediate-check="false"
                    finished-text="没有更多了"
                    error-text="加载失败，点击重试"
                    @load="onLoad">
                    <slot name="content"></slot>
                </List>
            </PullRefresh>
            <template v-else>
                <slot name="content"></slot>
            </template>
        </div>
        <!-- 底部操作按钮 -->
        <div class="app-page-bottom-btn" :style="bottomBtnStyle" v-if="showSlot('footer')">
            <slot name="footer"></slot>
        </div>

        <div
            @click="appSearchLowerClick()"
            class="app-search-lower-container"
            :id="appSearchSingleton.appSaearchLowerContainerId"
            v-if="appSearchSingleton.appSearchLowerContainerVisable"></div>
        <van-action-sheet class="app-search-popup" v-model:show="appSearchFilterVisable" :title="filterTitle">
            <div class="app-saarch-filter-container">
                <div class="content">
                    <slot name="filter"></slot>
                </div>
                <div class="btns">
                    <van-button class="reset-btn" @click="filterReset">重置</van-button>
                    <van-button class="comfirm-btn" color="#2C65F2" @click="filterComfirm">确定</van-button>
                </div>
            </div>
        </van-action-sheet>
    </div>
</template>

<script lang="ts" setup>
import { ref, getCurrentInstance, watch, onMounted, onBeforeMount, useSlots, computed, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { List, PullRefresh, ActionSheet as vanActionSheet, Button as vanButton } from 'vant';
import AppSearchBar from '../MxAppSearchBar/index.vue';
import { useAppSearchSingleton } from '@/store/appSearchSingletonStore';
const appSearchSingleton = useAppSearchSingleton();
const props = defineProps({
    // 标题
    title: {
        type: String,
        default: 'AppPage标题',
    },
    // 禁用下拉刷新
    disableRefresh: {
        type: Boolean,
        default: false,
    },
    // 是否展示头部
    showHeader: {
        type: Boolean,
        default: true,
    },
    // loading状态
    loading: {
        type: Boolean,
        default: false,
    },
    // 触底加载更多是否失败
    loadError: {
        type: Boolean,
        default: false,
    },
    // finished状态(是否已经没有更多数据了)
    finished: {
        type: Boolean,
        default: false,
    },
    // 是否展示列表数据
    showList: {
        type: Boolean,
        default: false,
    },
    /**
     * 关闭内容区域滚动条（需要自己处理），默认开启
     * 注意：关闭滚动条后，头部以及搜索区域会随着内容区域一起滚动，需要自己处理（可以通过样式穿透处理样式）
     * 如果有页面标题或者搜索区域，建议不关闭滚动条，如果必须关闭需要重新处理样式问题
     */
    closeScroll: {
        type: Boolean,
        default: false,
    },
    // 外层盒子高度，如果是页面高度，则传 100vh
    boxHeight: {
        type: String,
        default: '100vh',
    },
    // 主体内容内边距关闭
    noPadding: {
        type: Boolean,
        default: false,
    },
    // 禁止列表触底加载更多
    disableLoadMore: {
        type: Boolean,
        default: false,
    },
    // 底部固定区域样式
    bottomBtnStyle: {
        type: Object,
        default: () => ({}),
    },
    // H5导航栏颜色
    navbarColor: {
        type: String,
        default: '#ffffff',
    },
    //是否展示搜索模块
    showSearch: {
        type: Boolean,
        default: true,
    },
    // 搜索模块配置，参考MxAppSearchBar-props
    searchConfig: {
        type: Object,
        default: () => ({}),
    },
    filterTitle: {
        type: String,
        default: '筛选',
    },
    showBack: {
        type: Boolean,
        default: true,
    },
});
/**
 * 获取组件插槽内容
 */
const slots = useSlots();
// 计算属性判断是否有对应的插槽
const showSlot = computed(() => {
    return (soltName: string) => {
        return slots[soltName];
    };
});
// 监听 loadError 变化，更新 loadError 状态
const loadError = ref(props.loadError);
watch(
    () => props.loadError,
    (newVal, oldVal) => {
        loadError.value = newVal;
    }
);

// 回调函数集合（使用 emit 命名，方便区分）
const emit = defineEmits([
    'back',
    'searchEvt',
    'loadEvt',
    'refreshEvt',
    'searchActionChange',
    'searchFilterReset',
    'searchFilterComfirm',
]);
const instance = getCurrentInstance();
const router = useRouter();
const refreshing = ref(false);

// 返回事件
const back = () => {
    if (window.history.state.back && window.history.state.back != '/login') {
        if (instance?.vnode?.props?.onBack) {
            emit('back');
        } else {
            router.go(-1);
        }
    } else {
        // 无法找到上一个路由，直接退回主系统
        window.$wujie?.bus.$emit('backToIndex');
    }
};
//下拉点击遮罩区域关闭下拉组件
const appSearchLowerClick = () => {
    appSearchSingleton.clearSaearchLowerContainer();
};
const appSearchBar = ref(null);
// 自定义筛选区域事件
const appSearchFilterVisable = ref(false);
const onShowFilter = (flag) => {
    appSearchFilterVisable.value = flag;
};

const onSearch = (e) => {
    emit('searchEvt', e);
};
const onActionChange = (e) => {
    emit('searchActionChange', e);
};
const filterReset = () => {
    appSearchFilterVisable.value = false;
    // 清除搜索框的值
    if (appSearchBar.value?.searchValue) {
        appSearchBar.value.searchValue = '';
    }
    emitSearchFilter('searchFilterReset');
};
const filterComfirm = () => {
    appSearchFilterVisable.value = false;
    emitSearchFilter('searchFilterComfirm');
};

const emitSearchFilter = (type) => {
    let params: any = {
        searchValue: appSearchBar.value.searchValue,
    };
    if (props.searchConfig.showLeft && props.searchConfig.leftActionConfig) {
        params.actionList = [props.searchConfig.leftActionConfig];
    }
    if (props.searchConfig.type == 'action' && props.searchConfig.actionList) {
        params.actionList = props.searchConfig.actionList;
    }
    emit(type, params);
};

const onLoad = () => {
    if (!props.loading) {
        emit('loadEvt');
    }
};

const onRefresh = () => {
    // 如果正在加载中，则不触发刷新事件
    if (props.loading) return;
    refreshing.value = true;
    emit('refreshEvt', () => {
        refreshing.value = false;
    });
};
// 无效回退事件
function onback(type: any) {
    console.log(type);
    debugger;
    if (type == 'back') {
        back();
    }
}

// H5 plus事件处理
function plusReady() {
    if (props.showHeader) {
        window.plus?.navigator.setStatusBarBackground(props.navbarColor);
    }
    // 设置系统状态栏背景为绿色
    // 添加事件前先移除事件，防止重复绑定
    // window.plus?.key.removeEventListener('backbutton', onback);
    // window.plus?.key.addEventListener('backbutton', onback);
}
// 组件挂载时初始化
const appPageContentRef = ref(null);
// 内容区域滚动恢复
const restoreScroll = () => {
    if (appPageContentRef.value) {
        appPageContentRef.value.scrollTop = 0;
    }
};

onMounted(() => {
    if (window.plus) {
        plusReady();
    } else {
        // 添加事件前先移除事件，防止重复绑定
        document.removeEventListener('plusready', plusReady, false);
        document.addEventListener('plusready', plusReady, false);
    }
});
onBeforeMount(() => {
    // 移除事件与监听，防止内存泄漏
    try {
        //处理搜索search单例元素事件
        appSearchSingleton.clearSaearchLowerContainer();
        if (window.plus) {
            // window.plus.key.removeEventListener('backbutton', onback);
        } else {
            document.removeEventListener('plusready', plusReady);
        }
    } catch (e) {}
});
defineExpose({
    restoreScroll,
});
</script>

<style lang="less" scoped>
.app-page-container {
    width: 100vw;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background-color: var(--base-grey3);

    ::-webkit-scrollbar {
        display: none;
    }

    .app-page-container-header {
        position: relative;
        height: calc(var(--app-header-height));
        background: var(--base-white);
        // padding: calc(7px + env(safe-area-inset-top)) 12px 7px;
        padding: 7px 12px;

        .title {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translateY(-50%) translateX(-50%);
            font-size: 16px;
            font-weight: 500;
            color: #000000;
            max-width: 50vw;
            font-family: 'PingFang SC-Medium';
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .back-icon {
            color: #000000;
        }
    }

    .app-search-container {
        display: flex;
        gap: 8px;
        border-bottom: 1px solid var(--border);
        padding: 0px 12px;
        background-color: var(--base-white);

        .search_button {
            width: 72px;
            height: 34px;
            border-radius: 18px 18px 18px 18px;
            border: 1px solid var(--base-color);
            line-height: 34px;
            text-align: center;
            font-weight: 400;
            font-size: 14px;
            color: var(--base-color);
        }

        .search-main {
            flex: 1;
        }
    }

    .app-page-content {
        width: 100vw;
        padding: 12px 12px 8px;
        flex: 1;
        box-sizing: border-box;
        overflow-y: auto;
    }

    .app-page-bottom-btn:empty {
        display: none;
    }

    .close-scroll {
        overflow-y: initial;
    }

    .no-padding {
        padding: 0;
    }
    .app-search-lower-container {
        position: fixed;
        bottom: 0px;
        left: 0px;
        width: 100vw;
        z-index: 2;
        height: calc(100% - var(--app-header-height) - 53px);
        background-color: rgba(0, 0, 0, 0.7);
        overflow: hidden;
    }
    .app-saarch-filter-container {
        min-height: calc(40vh - 48px);
        max-height: calc(80vh - 48px);
        padding: 0 var(--base-padding) var(--base-padding);
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        .content {
            width: 100%;
            flex: 1;
            overflow: scroll;
            &::-webkit-scrollbar {
                display: none;
            }
        }
        .btns {
            display: flex;
            justify-content: space-around;
            margin-top: var(--base-padding);
            gap: 16px;
            .reset-btn {
                width: 96px;
                height: 40px;
                font-size: 16px;
                color: var(--base-grey2) !important;
            }
            .comfirm-btn {
                width: calc(100% - 116px);
                height: 40px;
                font-size: 16px;
            }
        }
    }
}
:deep(.van-action-sheet__header) {
    font-size: 16px;
    color: var(--base-black);
}
:deep(.van-action-sheet__close) {
    color: var(--base-grey);
}
:deep(.van-action-sheet){
    max-height: 80vh;
}
.item-list {
    height: 50px;
    background-color: red;
    margin-bottom: 10px;
}

.no-padding {
    padding: 0;
}
</style>

<style lang="postcss">
.app-page-container {
    ::-webkit-scrollbar {
        width: 0px;
        height: 0px;
    }

    ::-webkit-scrollbar-thumb {
        border-radius: 0px;
    }

    ::-webkit-scrollbar-track {
        border-radius: 0px;
    }
}
</style>

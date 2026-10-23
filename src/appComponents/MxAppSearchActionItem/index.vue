<template>
    <div
        :class="{
            'mx-app-search-action-item': true,
            highlight: openRef,
        }"
        @click.prevent="lowerClick()">
        {{ lowerLabel }}
        <div class="icon"></div>
    </div>
    <transition name="selectPopupFade">
        <!-- 采用此模式因为ios组件内部元素会被后续元素遮挡 -->
        <Teleport :to="'#' + appSearchSingleton.appSaearchLowerContainerId" v-if="openRef">
            <slot>
                <div class="mx-app-search-lower-content" @click.stop="" ref="lowerContenRef">
                    <div class="lower-item" v-for="item in options" :key="item.value" @click="itemClick(item.value)">
                        <div class="label">{{ item.label }}</div>
                        <div class="check" v-if="modelValue == item.value"></div>
                    </div>
                </div>
            </slot>
        </Teleport>
    </transition>
</template>

<script setup lang="ts">
import { ref,computed, nextTick } from 'vue';
import { IMxAppSearchActionItem, ISearchActionItemEmits } from './index.types';
import { useAppSearchSingleton } from '@/store/appSearchSingletonStore';
const appSearchSingleton = useAppSearchSingleton();
const emit = defineEmits<ISearchActionItemEmits>();
const props = defineProps<IMxAppSearchActionItem>();
const openRef = ref(false);
const closeLower = () => {
    openRef.value = false;
};
const lowerContenRef = ref(null); // 滚动容器
const itemClick = (value) => {
    emit('update:modelValue', value);
    emit('change', value);
    appSearchSingleton.clearSaearchLowerContainer();
};

const lowerLabel = computed(() => {
    if (props.labelCustom) {
        return props.labelCustom(props.modelValue);
    }
    //label 默认展示类型label
    let label = props.label || '';
    if (props.checkType == 'value') {
        label = props.modelValue;
    } else if (props.checkType == 'valueLabel') {
        let findItem = props.options ? props.options.find((item) => item.value == props.modelValue) : props.label;
        label = findItem ? findItem.label : props.label;
    }
    return label.toString().substring(0, props.labelMaxLength || 6);
});
const scrollToSelected = () => {
    nextTick(() => {
        const container = lowerContenRef.value;
        if (!container) return;

        // 找到当前选中的 DOM
        let selectedEl = container.querySelector(`.lower-item >.check`);
        if (!selectedEl) return;

        // 计算位置 → 精准滚动（让选中项居中显示）
        const containerHeight = container.offsetHeight;
        const elementOffsetTop = selectedEl.offsetTop;
        const elementHeight = selectedEl.offsetHeight;

        // 核心：让选中项在容器里居中
        container.scrollTop = elementOffsetTop - containerHeight / 2 + elementHeight / 2;
        selectedEl = null;
    });
};
const lowerClick = () => {
    if (props.customClick) {
        props.customClick(openRef);
        return;
    }
    if (!openRef.value) {
        appSearchSingleton.openComponents({ close: closeLower }, () => {
            openRef.value = true;
            scrollToSelected();
        });
    } else {
        closeLower();
        appSearchSingleton.clearSaearchLowerContainer();
    }
};
</script>

<style scoped lang="less">
.mx-app-search-action-item {
    display: flex;
    color: var(--base-grey2);
    align-items: center;
    font-size: var(--base-font-size);
    .icon {
        width: 16px;
        height: 16px;
        background: url('./icons/down.png') center no-repeat;
        margin-left: 4px;
        transition: all 0.3s;
    }
    &.highlight {
        color: var(--base-color);
        .icon {
            background: url('./icons/more.png') center no-repeat;
        }
    }
}
@itemheight: 48px;
.mx-app-search-lower-content {
    position: absolute;
    background: var(--base-white);
    width: calc(100% - var(--base-padding) - var(--base-padding));
    margin-left: var(--base-padding);
    padding: 0px var(--base-padding) var(--base-padding) var(--base-padding);
    box-sizing: border-box;
    max-height: calc(@itemheight * 4 + var(--base-padding) + var(--base-padding));
    // 此处未进行最大高度计算，后续优化
    overflow: scroll;
    border-radius: 0px 0px 16px 16px;
    &::-webkit-scrollbar {
        display: none;
    }
    .lower-item {
        height: @itemheight;
        font-size: var(--base-font-size);
        border-bottom: 1px solid #ededed;
        color: var(--base-grey2);
        box-sizing: border-box;
        display: flex;
        align-items: center;
        &:last-child {
            border-bottom: none;
        }
        .label {
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .check {
            width: 16px;
            height: 16px;
            background: url('./icons/check.png') no-repeat center;
            margin-left: var(--base-padding);
        }
    }
}
.selectPopupFade-enter-from {
    opacity: 0;
}

.selectPopupFade-enter-active {
    transition: opacity 0.5s ease;
}

.selectPopupFade-enter-to {
    opacity: 1;
}

.selectPopupFade-leave-from {
    opacity: 1;
}

.selectPopupFade-leave-active {
    transition: opacity 0.18s ease;
}

.selectPopupFade-leave-to {
    opacity: 0;
}
</style>
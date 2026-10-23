/**
* @description: 自定义按钮
* @author: @ZWW
* @date: 2025-12-13
*/

<template>
    <div :style="{ color: props.color && props.color, ...props.styleOption }" class="mx-btn" :class="btnClass" @click="btnClick">
        <span class="btn-left-icon" v-if="hasLeftIcon">
            <slot name="leftIcon"></slot>
        </span>
        <slot></slot>
        <span class="btn-right-icon" v-if="hasRightIcon">
            <slot name="rightIcon"></slot>
        </span>
    </div>
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue';

const emit = defineEmits(['click']);

// 判断是否又插槽传入
/**
 * 获取组件插槽内容
 */
const slots = useSlots()

/**
 * 检查是否存在左侧图标插槽内容
 * @returns {boolean} 当存在leftIcon插槽且插槽内容长度大于0时返回true，否则返回false
 */
const hasLeftIcon = computed(() => {
    const slot = slots.leftIcon
    return !!(slot && slot().length)
})

/**
 * 检查是否存在右侧图标插槽内容
 * @returns {boolean} 当存在rightIcon插槽且插槽内容长度大于0时返回true，否则返回false
 */
const hasRightIcon = computed(() => {
    const slot = slots.rightIcon
    return !!(slot && slot().length)
})

/**
 * 计算按钮的CSS类名数组
 * 
 * 根据传入的props属性动态计算按钮需要应用的CSS类名，
 * 包括按钮状态、样式类型、形状等相关的类名
 * 
 * @returns {Array<string>} 返回包含所有需要应用的CSS类名的数组
 */
const btnClass = computed(() => {
    let arr = []
    
    // 处理禁用状态
    if (props.disabled) {
        arr.push('disabled-btn')
    }
    
    // 根据按钮样式类型处理不同的类名组合
    if (props.text) {
        // 文字按钮样式
        arr.push(`text-${props.type || 'success'}-btn`)
        arr.push('text-box')
    } else if (props.border) {
        // 边框按钮样式
        arr.push(props.type && `border-${props.type}-btn`)
        arr.push('border-box')
        if (!props.type) {
            arr.push('default-btn')
        }

    } else {
        // 默认填充按钮样式
        arr.push(`${props.type || 'success'}-btn`)
        arr.push('default-box')
    }

    // 处理圆角样式
    if (props.round) {
        arr.push('round-btn')
    }

    return arr
})

/**
 * 按钮组件属性接口定义
 * @property {Record<string, string>} styleOption - 自定义样式对象，用于覆盖默认样式
 * @property {string} type - 按钮类型，可选值包括primary、secondary等
 * @property {boolean} text - 是否为文本按钮样式
 * @property {boolean} disabled - 是否禁用按钮
 * @property {boolean} border - 是否显示边框
 * @property {string} color - 按钮颜色值，支持十六进制、rgb等格式
 * @property {boolean} round - 是否为圆角按钮
 */
interface Props {
    styleOption?: Record<string, string>
    type?: string
    text?: boolean
    disabled?: boolean
    border?: boolean
    color?: string
    round?: boolean
}

/**
 * 定义组件的props属性，并设置默认值
 * 
 * @param Props - 组件props的类型定义接口
 * @returns 包含默认值的props对象
 * 
 * 默认值说明:
 * - styleOption: 样式选项，默认为空对象
 * - type: 组件类型，默认为空字符串
 * - text: 是否为文本模式，默认为false
 * - border: 是否显示边框，默认为false
 * - disabled: 是否禁用，默认为false
 * - color: 颜色配置，默认为空字符串
 * - round: 是否圆角，默认为false
 */
const props = withDefaults(defineProps<Props>(), {
    styleOption: () => ({}),
    type: '',
    text: false,
    border: false,
    disabled: false,
    color: '',
    round: false
})

const btnClick = () => {
    if(props.disabled) return
    emit('click')
}
</script>

<style lang="less" scoped>
.mx-btn {
    width: max-content;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
}

.disabled-btn {
    cursor: not-allowed;
    opacity: 0.5;
    /* 可选：使元素看起来更透明 */
}

.text-box {
    font-weight: 400;
    font-size: 14px;
    color: var(--web-success-tag-c);
    height: 28px;
    display: flex;
    align-items: center;
    border: none;
}

.border-box {
    border-width: 1px;
    border-style: solid;
    height: 33px;
    border-radius: 4px;
    padding: 6px 12px;
}

.default-box {
    border: none;
    height: 32px;
    border-radius: 4px;
    padding: 6px 12px;
}



@names: success, info, warning, error;

each(@names, {
    .@{value}-btn {
        @bg: ~"--web-@{value}-tag-c";
        background-color: var(@bg);
        border: none;
        color: var(--base-white);
    }

    .text-@{value}-btn {
        @color: ~"--web-@{value}-tag-c";
        color: var(@color);
    }

    .border-@{value}-btn {
        @color: ~"--web-@{value}-tag-c";
        @border: ~"--web-@{value}-tag-b";
        color: var(@color);
        border-color: var(@border)
    }
});

.default-btn {

    border: 1px solid var(--web-default-button-border);
    height: 34px;
    border-radius: 4px;
    padding: 6px 12px;
    background-color: var(--base-white);
    color: var(--web-default-button-c);
}

.round-btn {
    border-radius: 9999px;
}

.btn-left-icon {
    margin-right: 4px;
    display: flex;
    align-items: center;
}

.btn-right-icon {
    margin-left: 4px;
    display: flex;
    align-items: center;
}
</style>
/**
* @description: 自定义标签
* @author: @ZWW
* @lastModified: 2025-12-13
*/
<template>
    <span :style="props.styleOption" class="mx-tag" :class="tagClass">
        <slot></slot>
    </span>
</template>

<script setup lang="ts">
import { isApp } from '@/utils'
import { computed } from 'vue'
const _isApp = isApp()
/**
 * 标签组件Props接口定义
 * 
 * @property {Record<string, any>} styleOption - 自定义样式选项，用于覆盖默认样式
 * @property {'default' | 'primary' | 'success' | 'info' | 'warning' | 'danger' | ''} type - 标签类型，决定标签的主题颜色样式
 * @property {boolean} showClose - 是否显示关闭按钮
 * @property {'small' | 'mini'} size - 标签尺寸大小
 */
interface Props {
    styleOption?: Record<string, any>
    type?: 'default' | 'primary' | 'success' | 'info' | 'warning' | 'danger' | ''
    showClose?: boolean,
    size?: 'small' | 'mini'
}

/**
 * 计算标签的CSS类名
 * @returns {Array} 包含尺寸类名和类型类名的数组
 */
const tagClass = computed(() => {
    let sizeClass = ''
    let typeClass = ''
    // 根据是否为App环境、尺寸属性和类型属性生成对应的CSS类名
    sizeClass = (_isApp ? 'app-' : 'web-') + (props.size || 'small') + '-tag'
    typeClass = (props.type || 'default') + '-tag'
    return [sizeClass, typeClass]
})



/**
 * 定义组件的属性并设置默认值
 * 
 * @param Props - 组件属性类型定义
 * @returns 包含默认值的属性对象
 * 
 * 默认值说明:
 * - styleOption: 空对象函数，用于样式配置
 * - type: 字符串'default'，组件类型
 * - showClose: 布尔值false，是否显示关闭按钮
 * - size: 字符串'small'，组件尺寸大小
 */
const props = withDefaults(defineProps<Props>(), {
    styleOption: () => ({}),
    type: 'default',
    showClose: false,
    size: 'small'
})
</script>

<style lang="less" scoped>
.mx-tag {
    width: max-content;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 400;
    font-style: normal;
    text-transform: none;
    cursor: default;
}

.web-small-tag {
    height: 32px;
    font-size: 14px;
    padding: 6px 12px;
    border-radius: 4px;
}

.web-mini-tag {
    height: 28px;
    font-size: 12px;
    padding: 4px 8px;
    border-radius: 2px;
}

.app-small-tag {
    padding: 2px 4px;
    height: 18px;
    font-size: 12px;
    border-radius: 2px;
}

.app-mini-tag {
    padding: 2px 4px;
    height: 18px;
    font-size: 12px;
    border-radius: 2px;
}

@names: success, default, warning, error, info;

each(@names, {
    @bg: ~"--web-@{value}-tag-bg";
    @border: ~"--web-@{value}-tag-border";
    @color: ~"--web-@{value}-tag-c";

    .@{value}-tag {
        background-color: var(@bg);
        border: 1px solid var(@border);
        color: var(@color);
    }
});
</style>
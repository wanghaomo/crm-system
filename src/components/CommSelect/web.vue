<template>
    <n-select
        v-show="!props.text"
        ref="selectRef"
        v-model:value="currentValue"
        :placeholder="props.placeholder"
        :options="optionComputed"
        :disabled="props.disabled"
        :clearable="props.clearable"
        :multiple="props.multiple"
        :collapse-tags="props.collapseTags"
        :readonly="props.readonly"
        :loading="props.loading"
        :consistent-menu-width="false"
        :max-tag-count="collapseTags ? 'responsive' : 'none'"
        filterable>
        <!-- 头部 -->
        <template #header>
            <div class="custom_select_header">
                <span class="index header_item"></span>
                <span
                    class="header_item flex-1"
                    v-for="item in showFields"
                    :key="item.key"
                    :style="{
                        ...(item.fixedWidth
                            ? { width: item.width, flex: 'none' }
                            : {
                                  width: item.width,
                              }),
                    }"
                    >{{ item.label }}</span>
            </div>
        </template>
        <template #action v-if="props.multiple">
            <div class="custom_select_footer">已选 {{ currentValue?.length || 0 }}/{{ options.length }} 项</div>
        </template>
    </n-select>
    <span v-show="props.text">{{ labelText() || '--' }}</span>
</template>
<script setup lang="ts">
import { ref, h, watch, computed } from 'vue';
import type { SelectEmits, ChildrenSelectProps, SelectOption } from './index.type';
import { NSelect } from 'naive-ui';
// 从父组件接收属性
const props = defineProps<ChildrenSelectProps>();
// 定义组件值
const currentValue = ref<string | string[] | null>();
// 定义 select 组件引用
const selectRef = ref<InstanceType<typeof NSelect>>();
// 从父组件接收事件
const emit = defineEmits<SelectEmits>();
// 纯展示label
const labelText = computed(() => {
    return () => {
        if (props.label) {
            if (Array.isArray(props.label)) {
                return props.label.join('、');
            }
            return props.label || '--';
        } else {
            // 通过currentValue获取label
            if (Array.isArray(currentValue.value)) {
                return currentValue.value
                    .map((item) => props.options.find((option) => option.value === item)?.label || '--')
                    .join('、');
            } else {
                return props.options.find((item) => item.value === currentValue.value)?.label || '--';
            }
        }
    };
});
// 监听 modelValue 变化
watch(
    () => props.modelValue,
    async (newValue, oldValue) => {
        // 判断newValue与当前currentValue.value是否相同，如果不同才进行赋值
        if (Array.isArray(newValue)) {
            if (JSON.stringify(newValue) !== JSON.stringify(currentValue.value)) {
                console.log('选中项发生变化-赋值2');
                currentValue.value = newValue || null;
            }
        } else {
            if (newValue !== currentValue.value) {
                console.log('选中项发生变化-赋值1');

                currentValue.value = newValue || null;
            }
        }
    },
    {
        deep: true,
        immediate: true,
    }
);
// 渲染数据
const optionComputed = computed(() => {
    return props.options.map((item, index) => {
        return {
            ...item,
            disabled: props.disabledValues ? props.disabledValues?.includes(item.value) : false,
            render: renderOption,
        };
    });
});
watch(
    () => currentValue.value,
    (newValue, oldValue) => {
        // 这里之所以没有判断新旧数据是否相同，是因为v-model:value会自动处理数据变化
        syncData();
        // if (Array.isArray(newValue)) {
        //     // 如果是数组则判断数组中的项是否全部相同
        //     if (JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
        //         syncData();
        //     }
        // } else {
        //     if (newValue !== oldValue) {
        //         syncData();
        //     }
        // }
    },
    { deep: true }
);
// 自定义选项渲染
const renderOption = ({ node, option }) => {
    // 判断当前选项是否被禁用
    const isDisabled = props.disabledValues ? props.disabledValues?.includes(option.value) : false;
    return h(
        'div',
        {
            class: `comm_select_option ${isDisabled ? 'disabled' : ''}`,
            onClick: () => {
                // 如果选项被禁用，直接返回，不执行任何选择逻辑
                if (isDisabled) {
                    return;
                }
                if (props.multiple) {
                    if (!Array.isArray(currentValue.value)) {
                        currentValue.value = [];
                    }
                    // 多选
                    if (currentValue.value.find((item) => item === option.value)) {
                        // 如果commOptionList中存在value，删除value
                        currentValue.value = currentValue.value.filter((item) => item !== option.value);
                    } else {
                        // 如果commOptionList中不存在value，添加value
                        currentValue.value.push(option.value);
                    }
                } else {
                    currentValue.value = option.value;
                    setTimeout(() => {
                        selectRef.value?.blur();
                    }, 0);
                }
            },
        },
        [
            h('div', { class: 'comm_select_option_index' }, [
                h('i', { class: getCheckOrRadioIconClass(option.value) }, option.index),
            ]),
            ...(props.showFields || []).map((item, index) => {
                return h(
                    'div',
                    {
                        class: 'comm_select_option_text',
                        style: {
                            ...(item.fixedWidth
                                ? { width: item.width, flex: 'none' }
                                : {
                                      width: item.width,
                                  }),
                        },
                    },
                    option[item.key] || '--'
                );
            }),
        ]
    );
};
// 下拉框选中图标类名
const getCheckOrRadioIconClass = (value: string) => {
    if (props.multiple) {
        // 如果commOptionList中存在value，返回n-icon-check
        if (Array.isArray(currentValue.value) && currentValue.value.find((item) => item === value)) {
            return 'n_icon_check';
        } else {
            return 'n_icon_check_empty';
        }
    } else {
        // 如果commOptionList中存在value，返回n-icon-radio
        if (currentValue.value === value) {
            return 'n_icon_radio';
        } else {
            return 'n_icon_radio_empty';
        }
    }
};

const syncData = () => {
    if (optionComputed.value.length === 0) {
        return;
    }
    if (currentValue.value) {
        emit('update:modelValue', JSON.parse(JSON.stringify(currentValue.value)));
    }
    console.log('选中项发生变化-合同变化-下拉选择有optionComputed', optionComputed.value);

    // 多选模式
    if (Array.isArray(currentValue.value)) {
        // 选中的选项全量数据
        let selectedOptions: SelectOption[] = [];
        // 选中选项的label集合
        let selectedLabels: string[] = [];
        if (currentValue.value.length === 0) {
            selectedOptions = [];
            selectedLabels = [];
        } else {
            // 根据newValue的顺序获取选中的选项
            const currSelectOptions = currentValue.value
                .map((value) => props.options.find((item) => item.value === value))
                .filter(Boolean) as any[];
            // 合并selectedOptions和currSelectOptions，并且去除value重复的项
            selectedOptions = [...currSelectOptions];
            selectedLabels = (selectedOptions.map((item) => item?.label || '') || []) as string[];
        }
        emit('update:label', selectedLabels);
        emit('changeEvt', selectedOptions);
        // 选中的数据合集更新事件
        emit('update:selectedData', selectedOptions);
    } else {
        // 单选模式
        const selectedLabels = props.options.find((item) => item.value === currentValue.value)?.label || '';
        const selectedOptions = props.options.find((item) => item.value === currentValue.value) || null;
        emit('update:label', selectedLabels);
        emit('changeEvt', selectedOptions);

        // 选中的数据合集更新事件
        emit('update:selectedData', selectedOptions);
    }
};
</script>
<style lang="postcss">
/* 自定义特殊下拉选择组件样式 */
.v-binder-follower-content {
    .n-base-select-menu__header {
        .custom_select_header {
            display: flex;
            align-items: center;
            gap: 10px;
            height: 20px;
            .header_item {
                flex-shrink: 0;
                font-size: 14px;
                display: inline-block;
                text-align: left;
            }
            .index {
                width: 30px;
            }
            .flex_1 {
                flex: 1;
            }
        }
    }
    .comm_select_option {
        display: flex;
        align-items: center;
        position: relative;
        height: 42px;
        /* border-bottom: 1px solid var(--base-grey2); */
        padding: 0 var(--n-option-padding-left);
        gap: 10px;
        cursor: pointer;
        &:hover {
            background-color: var(--base-grey3);
        }
        &::after {
            content: '';
            position: absolute;
            left: 0;
            /* left: var(--n-option-padding-left); */
            bottom: 0;
            width: 100%;
            /* width: calc(100% - var(--n-option-padding-left) * 2); */
            height: 100%;
            border-bottom: 1px solid var(--base-border-grey);
        }
        .comm_select_option_index {
            display: flex;
            align-items: center;
            width: 30px;
            height: 100%;
            flex-shrink: 0;
            i {
                display: inline-block;
                width: 16px;
                height: 16px;
                background-position: center;
                background-repeat: no-repeat;
                background-size: 100%;
            }
            .n_icon_check {
                background-image: url('@/components/CommSelect/img/multiple_select_icon_active.png');
            }
            .n_icon_check_empty {
                background-image: url('@/components/CommSelect/img/multiple_select_icon.png');
            }
            .n_icon_radio {
                background-image: url('@/components/CommSelect/img/single_icon_active.png');
            }
            .n_icon_radio_empty {
                background-image: url('@/components/CommSelect/img/single_icon.png');
            }
        }
        .comm_select_option_text {
            /* 超出部分省略号 */
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-size: 12px;
            color: var(--base-grey2);
            flex-shrink: 0;
            flex: 1;
        }
    }
    .disabled {
        cursor: not-allowed;
        background-color: var(--base-grey3);
        .comm_select_option_text {
            color: var(--base-grey5);
        }
    }
}
</style>

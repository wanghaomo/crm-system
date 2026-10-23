<!-- 用户选择-新样式 -->
<template>
    <n-select
        v-if="!props.text"
        v-model:value="currentValue"
        :placeholder="props.placeholder"
        :disabled="props.disabled"
        :clearable="props.clearable"
        :multiple="props.multiple"
        :collapse-tags="props.collapseTags"
        :readonly="props.readonly"
        :options="props.options"
        :render-label="renderLabel"
        :render-tag="props.multiple ? renderMultipleSelectTag : renderSingleSelectTag"
        :loading="loading"
        :max-tag-count="collapseTags ? 'responsive' : 'none'"
        :on-update:value="onUpdateValue"
        filterable></n-select>
    <span v-else>{{ textLabel }}</span>
</template>
<script lang="ts" setup>
import { ref, onMounted, watch, h, computed } from 'vue';
import { NSelect, NAvatar, NText, NTag } from 'naive-ui';
import { getUserListApi } from '@/api';
import type { PersonSelectProps, PersonSelectEmits, PersonOption } from './index.type';
import userAvatar from './image/user_avatar.png';

// 从父组件接收属性
const props = defineProps<PersonSelectProps & {
    options: PersonOption[];
}>();

// 从父组件接收事件
const emit = defineEmits<PersonSelectEmits>();

// 响应式数据
const loading = ref(false);
const currentValue = ref<string | string[] | null>(props.modelValue || null);

// 处理label
const textLabel = computed(() => {
    if (props.label) {
        if (Array.isArray(props.label)) {
            return props.label.join('、');
        }
        return props.label;
    }
    return '--';
});
// 监听 modelValue 变化
watch(
    () => props.modelValue,
    (newValue, oldValue) => {
        console.log('===========modelValue变化', newValue, oldValue);

        currentValue.value = newValue || null;
    },
    {
        deep: true,
        immediate: true,
    }
);
const onUpdateValue = (newValue: string | string[]) => {
    console.log('=========onUpdateValue', newValue);
    currentValue.value = newValue;
    syncData();
};
// 数据同步
const syncData = () => {
    emit('update:modelValue', JSON.parse(JSON.stringify(currentValue.value)));
    // 多选模式
    if (Array.isArray(currentValue.value)) {
        // 选中的选项全量数据
        let selectedOptions: PersonOption[] = [];
        // 选中选项的label集合
        let selectedLabels: string[] = [];
        if (currentValue.value.length === 0) {
            selectedOptions = [];
            selectedLabels = [];
        } else {
            // 根据newValue的顺序获取选中的选项
            const currSelectOptions = props.options.filter((item) => currentValue.value.includes(item.value));
            // 合并selectedOptions和currSelectOptions，并且去除value重复的项
            selectedOptions = currSelectOptions.map((item) => ({
                ...item,
                id: '',
            }));

            selectedLabels = (selectedOptions.map((item) => item?.label || '') || []) as string[];
            // 循环selectedOptions，将每条数据value进行对比，
            // 如果selectedOptions数据的value与props.selectedPerson的value相同，
            // 那么保留props.selectedPerson的id，否则就使用item的id
            if (props.selectedPerson && selectedOptions) {
                selectedOptions = selectedOptions.map((item) => ({
                    ...item,
                    id: props.selectedPerson.find((person) => person.value === item.value)?.id || '',
                }));
            }
            
            console.log("onUpdateValue变化值001：",props.options,currentValue.value);
        }
        
        emit('update:label', selectedLabels);
        emit('update:selectedPerson', selectedOptions);
        emit('changeEvt', selectedOptions);
    } else {
        // 单选模式
        const selectedLabels = props.options.find((item) => item.value === currentValue.value)?.label || '';
        const selectedOptions = props.options.find((item) => item.value === currentValue.value) || null;
        if (selectedOptions) {
            selectedOptions.id = '';
        }
        // 判断selectedOptions是否存在id
        if (
            selectedOptions&&
            props.selectedPerson &&
            !Array.isArray(props.selectedPerson) &&
            props.selectedPerson.value === selectedOptions.value
        ) {
            selectedOptions.id = props.selectedPerson.id || '';
        }
        emit('update:label', selectedLabels);
        emit('update:selectedPerson', selectedOptions);
        emit('changeEvt', selectedOptions);
    }
};




const renderMultipleSelectTag: any = ({ option, handleClose }) => {
    return h(
        NTag,
        {
            style: {
                padding: '0 6px 0 4px',
            },
            round: true,
            closable: true,
            onClose: (e) => {
                e.stopPropagation();
                handleClose();
            },
        },
        {
            default: () =>
                h(
                    'div',
                    {
                        style: {
                            display: 'flex',
                            alignItems: 'center',
                        },
                    },
                    [
                        h(NAvatar, {
                            src: userAvatar,
                            round: true,
                            size: 22,
                            style: {
                                marginRight: '4px',
                            },
                        }),
                        option.label as string,
                    ]
                ),
        }
    );
};

const renderSingleSelectTag: any = ({ option }) => {
    return h(
        'div',
        {
            style: {
                display: 'flex',
                alignItems: 'center',
            },
        },
        [
            h(NAvatar, {
                src: userAvatar,
                round: true,
                size: 24,
                style: {
                    marginRight: '12px',
                },
            }),
            option.label as string,
        ]
    );
};

const renderLabel: any = (option: any) => {
    return h(
        'div',
        {
            style: {
                display: 'flex',
                alignItems: 'center',
            },
        },
        [
            h(NAvatar, {
                src: userAvatar,
                round: true,
                size: 'small',
            }),
            h(
                'div',
                {
                    style: {
                        marginLeft: '12px',
                        padding: '4px 0',
                    },
                },
                [
                    h('div', null, [option.label as string]),
                    h(
                        NText,
                        { depth: 3, tag: 'div', style: { fontSize: '12px' } },
                        {
                            default: () => option.value,
                        }
                    ),
                ]
            ),
        ]
    );
};
</script>
<style lang="less" scoped>
.person-single-select {
    :deep(.n-base-select-option) {
        height: auto !important;
        margin-bottom: 5px;
        padding: 8px 12px;
        &:last-of-type {
            margin-bottom: 0;
        }
    }

    :deep(.n-base-select-option.n-base-select-option--selected) {
        .car-item {
            .car-item-name {
                font-weight: 600;
                color: var(--base-color);
            }

            .car-item-value {
                color: var(--base-color);
                font-weight: 400;
            }
        }
    }

    .car-item {
        display: flex;
        padding: 5px 0;
        line-height: 1;

        .avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            margin-right: 10px;
            background: center url('./image/user_avatar.png') no-repeat;
            background-size: 100%;
        }

        .car-item-right {
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }

        .car-item-name {
            font-size: 16px;
            font-weight: 600;
        }

        .car-item-value {
            font-size: 14px;
            color: var(--base-grey5);
        }
    }
}
</style>

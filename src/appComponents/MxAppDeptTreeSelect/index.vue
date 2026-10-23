<template>
    <div class="mx-app-dept-tree-select">
        <van-field
            :model-value="displayText"
            :name="name"
            :label="fieldLabel"
            :label-align="labelAlign"
            :placeholder="placeholder"
            :required="required"
            :rules="fieldRules"
            :disabled="disabled"
            :readonly="true"
            :is-link="!disabled && !readonly"
            :clearable="clearable && hasSelected && !disabled && !readonly"
            @click="handleOpen"
            @clear="handleClear" />

        <MxAppTreeSelect
            v-model:show="showPopup"
            :model-value="treeValue"
            :title="title"
            :data="deptTree"
            :multiple="multiple"
            :loading="loading"
            :height="height"
            :show-select-all="multiple && showSelectAll"
            :show-footer="showFooter"
            :default-expand-all="defaultExpandAll"
            :allow-parent-select="allowParentSelect"
            @confirm="handleConfirm" />
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { Field as VanField } from 'vant';
import { getDeptTree } from '@/api';
import MxAppTreeSelect, { TreeNodeData } from '../MxAppTreeSelect/index.vue';

type DeptValue = string | number;

const props = withDefaults(
    defineProps<{
        title?: string;
        fieldLabel?: string;
        name?: string;
        placeholder?: string;
        required?: boolean;
        disabled?: boolean;
        readonly?: boolean;
        rules?: any[];
        multiple?: boolean;
        clearable?: boolean;
        labelAlign?: 'left' | 'center' | 'right' | 'top';
        height?: string;
        showSelectAll?: boolean;
        showFooter?: boolean;
        defaultExpandAll?: boolean;
        allowParentSelect?: boolean;
        valueKey?: string;
        labelKey?: string;
        childrenKey?: string;
        requestParams?: Record<string, any>;
        options?: any[];
    }>(),
    {
        title: '所属部门',
        fieldLabel: '所属部门',
        name: 'deptCode',
        placeholder: '请选择所属部门',
        required: false,
        disabled: false,
        readonly: false,
        rules: () => [],
        multiple: true,
        clearable: true,
        labelAlign: 'left',
        height: '70vh',
        showSelectAll: true,
        showFooter: true,
        defaultExpandAll: false,
        allowParentSelect: true,
        valueKey: 'value',
        labelKey: 'label',
        childrenKey: 'children',
        requestParams: () => ({}),
        options: () => [],
    }
);

const emit = defineEmits<{
    (e: 'change', value: TreeNodeData | TreeNodeData[] | null): void;
}>();

const valueModel = defineModel<DeptValue | DeptValue[] | null>('value');
const labelModel = defineModel<string | string[] | null>('label');

const showPopup = ref(false);
const loading = ref(false);
const deptTree = ref<TreeNodeData[]>([]);

const isEmptyValue = (value: unknown) => value === undefined || value === null || value === '';

const normalizeArray = <T,>(value: T | T[] | null | undefined): T[] => {
    if (Array.isArray(value)) {
        return value.filter((item) => !isEmptyValue(item));
    }
    return isEmptyValue(value) ? [] : [value as T];
};

/**
 * 将后端部门树统一成 app 树组件需要的 value/label/children 字段。
 * @param nodes 原始部门树
 * @returns 兼容后的部门树
 */
const normalizeDeptTree = (nodes: any[]): TreeNodeData[] => {
    return nodes.map((node) => {
        const children = node[props.childrenKey] ?? node.children;
        const value = node[props.valueKey] ?? node.value ?? node.deptCode ?? node.code ?? node.id ?? '';
        const label = node[props.labelKey] ?? node.label ?? node.deptName ?? node.name ?? '';
        return {
            ...node,
            value,
            label,
            children: Array.isArray(children) ? normalizeDeptTree(children) : [],
        };
    });
};

const findLabelsByValues = (values: DeptValue[]): string[] => {
    const valueSet = new Set(values.map((item) => String(item)));
    const labels: string[] = [];
    const walk = (nodes: TreeNodeData[]) => {
        nodes.forEach((node) => {
            if (valueSet.has(String(node.value))) {
                labels.push(String(node.label || ''));
            }
            if (node.children?.length) {
                walk(node.children);
            }
        });
    };
    walk(deptTree.value);
    return labels.filter(Boolean);
};

const selectedLabels = computed(() => {
    const labels = normalizeArray(labelModel.value);
    if (labels.length) {
        return labels;
    }
    return findLabelsByValues(normalizeArray(valueModel.value));
});

const displayText = computed(() => selectedLabels.value.join('、'));
const hasSelected = computed(() => normalizeArray(valueModel.value).length > 0);
const fieldRules = computed(() => {
    if (props.rules.length) {
        return props.rules;
    }
    if (!props.required) {
        return [];
    }
    return [{ required: true, message: props.placeholder, trigger: 'onChange' }];
});
const treeValue = computed(() => {
    if (props.multiple) {
        return normalizeArray(valueModel.value);
    }
    return normalizeArray(valueModel.value)[0] || '';
});

const loadDeptTree = async () => {
    if (props.options.length) {
        deptTree.value = normalizeDeptTree(props.options);
        return;
    }
    try {
        loading.value = true;
        const res = await getDeptTree(props.requestParams);
        if (res.code === 200) {
            deptTree.value = normalizeDeptTree(res.data || []);
        }
    } catch (error) {
        console.error('部门树获取失败', error);
    } finally {
        loading.value = false;
    }
};

const handleOpen = () => {
    if (props.disabled || props.readonly) {
        return;
    }
    showPopup.value = true;
    if (!deptTree.value.length) {
        loadDeptTree();
    }
};

const handleClear = () => {
    valueModel.value = props.multiple ? [] : '';
    labelModel.value = props.multiple ? [] : '';
    emit('change', props.multiple ? [] : null);
};

const handleConfirm = ({ values, options }: { values: DeptValue[]; options: TreeNodeData[] }) => {
    const labels = options.map((item) => String(item.label || ''));
    valueModel.value = props.multiple ? values : values[0] || '';
    labelModel.value = props.multiple ? labels : labels[0] || '';
    emit('change', props.multiple ? options : options[0] || null);
};

onMounted(() => {
    loadDeptTree();
});

watch(
    () => props.options,
    (options) => {
        if (options.length) {
            deptTree.value = normalizeDeptTree(options);
        }
    },
    { deep: true }
);
</script>

<style scoped lang="less">
.mx-app-dept-tree-select {
    width: 100%;

    :deep(.van-field__control) {
        color: var(--base-black);
        font-size: 16px;
    }
}
</style>

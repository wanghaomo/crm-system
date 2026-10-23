<template>
    <van-popup
        :show="show"
        position="bottom"
        round
        :style="{ height }"
        @update:show="(value) => emit('update:show', value)">
        <div class="mx-app-tree-select">
            <div class="ts-header">
                <span class="btn cancel" @click="handleCancel">取消</span>
                <span class="title">{{ title }}</span>
                <span class="btn confirm" @click="handleConfirm">确认</span>
            </div>

            <div v-if="multiple && showSelectAll" class="ts-all" @click="toggleAll">
                <span class="label">全选</span>
                <span
                    :class="[
                        'ts-checkbox',
                        { checked: isAllChecked, indeterminate: hasAny && !isAllChecked },
                    ]">
                </span>
            </div>

            <div class="ts-body">
                <div v-if="loading" class="ts-loading">
                    <van-loading size="24px" />
                </div>
                <div
                    v-else
                    v-for="node in flatNodes"
                    :key="node.path"
                    class="ts-row"
                    :style="{ paddingLeft: 24 + node.level * 48 + 'px' }">
                    <span
                        v-if="node.hasChildren"
                        :class="['ts-arrow', { open: expandedSet.has(node.path) }]"
                        @click.stop="toggleExpand(node.path)"></span>
                    <span v-else class="ts-arrow-placeholder"></span>

                    <span class="ts-name" @click.stop="onRowClick(node)">{{ node.label }}</span>

                    <span
                        v-if="isNodeSelectable(node)"
                        :class="[
                            'ts-checkbox',
                            {
                                checked: isNodeChecked(node),
                            },
                        ]"
                        @click.stop="toggleNode(node)">
                    </span>
                    <span v-else class="ts-checkbox-placeholder"></span>
                </div>

                <div v-if="!loading && !flatNodes.length" class="ts-empty">{{ emptyText }}</div>
            </div>

            <div v-if="showFooter" class="ts-footer">已选({{ selectedCount }})</div>
        </div>
    </van-popup>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Loading as VanLoading, Popup as VanPopup } from 'vant';

type TreeValue = string | number;

export interface TreeNodeData {
    label?: string;
    value?: TreeValue;
    children?: TreeNodeData[];
    [key: string]: any;
}

interface FlatNode {
    level: number;
    path: string;
    hasChildren: boolean;
    label: string;
    value: TreeValue;
    key: string;
    raw: TreeNodeData;
}

const props = withDefaults(
    defineProps<{
        show?: boolean;
        modelValue?: TreeValue | TreeValue[] | null;
        title?: string;
        data?: TreeNodeData[];
        valueKey?: string;
        labelKey?: string;
        childrenKey?: string;
        multiple?: boolean;
        height?: string;
        loading?: boolean;
        emptyText?: string;
        showSelectAll?: boolean;
        showFooter?: boolean;
        defaultExpandAll?: boolean;
        allowParentSelect?: boolean;
    }>(),
    {
        show: false,
        modelValue: () => [],
        title: '请选择',
        data: () => [],
        valueKey: 'value',
        labelKey: 'label',
        childrenKey: 'children',
        multiple: true,
        height: '70vh',
        loading: false,
        emptyText: '暂无数据',
        showSelectAll: true,
        showFooter: true,
        defaultExpandAll: false,
        allowParentSelect: true,
    }
);

const emit = defineEmits<{
    (e: 'update:show', value: boolean): void;
    (e: 'update:modelValue', value: TreeValue | TreeValue[]): void;
    (e: 'confirm', value: { values: TreeValue[]; options: TreeNodeData[] }): void;
    (e: 'cancel'): void;
}>();

const innerSelected = ref<Set<string>>(new Set());
const expandedSet = ref<Set<string>>(new Set());

const treeData = computed<TreeNodeData[]>(() => props.data || []);

const isEmptyValue = (value: unknown) => value === undefined || value === null || value === '';

const getNodeValue = (node: TreeNodeData): TreeValue => {
    return node[props.valueKey] ?? node.value ?? node.deptCode ?? node.code ?? node.id ?? '';
};

const getNodeLabel = (node: TreeNodeData): string => {
    return node[props.labelKey] ?? node.label ?? node.deptName ?? node.name ?? '';
};

const getNodeChildren = (node: TreeNodeData): TreeNodeData[] => {
    const children = node[props.childrenKey] ?? node.children;
    return Array.isArray(children) ? children : [];
};

const getNodeKey = (value: TreeValue) => String(value);

const normalizeModelValue = (value: TreeValue | TreeValue[] | null | undefined): TreeValue[] => {
    if (Array.isArray(value)) {
        return value.filter((item) => !isEmptyValue(item));
    }
    return isEmptyValue(value) ? [] : [value as TreeValue];
};

/**
 * 将树数据拍平。
 * @param expandOnly 是否只输出当前展开后的可视节点
 * @returns 拍平后的树节点列表
 */
const flattenTree = (expandOnly: boolean): FlatNode[] => {
    const result: FlatNode[] = [];
    const walk = (nodes: TreeNodeData[], level: number, parentPath: string) => {
        nodes.forEach((node, index) => {
            const value = getNodeValue(node);
            const key = getNodeKey(value);
            const children = getNodeChildren(node);
            const path = parentPath ? `${parentPath}/${key}-${index}` : `${key}-${index}`;
            const hasChildren = children.length > 0;
            result.push({
                level,
                path,
                hasChildren,
                label: getNodeLabel(node),
                value,
                key,
                raw: node,
            });
            if (hasChildren && (!expandOnly || expandedSet.value.has(path))) {
                walk(children, level + 1, path);
            }
        });
    };
    walk(treeData.value, 0, '');
    return result;
};

const flatNodes = computed<FlatNode[]>(() => flattenTree(true));
const allNodes = computed<FlatNode[]>(() => flattenTree(false));

/**
 * 收集选中节点的祖先路径，用于弹窗打开时自动展开已选项所在层级。
 * @returns 需要展开的节点路径集合
 */
const getSelectedAncestorPaths = () => {
    const paths = new Set<string>();
    const walk = (nodes: TreeNodeData[], parentPath: string, ancestors: string[]): boolean => {
        let hasSelected = false;
        nodes.forEach((node, index) => {
            const value = getNodeValue(node);
            const key = getNodeKey(value);
            const children = getNodeChildren(node);
            const path = parentPath ? `${parentPath}/${key}-${index}` : `${key}-${index}`;
            const isCurrentSelected = innerSelected.value.has(key);
            const hasSelectedChild = walk(children, path, [...ancestors, path]);
            if (isCurrentSelected || hasSelectedChild) {
                ancestors.forEach((item) => paths.add(item));
                hasSelected = true;
            }
        });
        return hasSelected;
    };
    walk(treeData.value, '', []);
    return paths;
};

const initExpanded = () => {
    if (props.defaultExpandAll) {
        expandedSet.value = new Set(allNodes.value.filter((node) => node.hasChildren).map((node) => node.path));
        return;
    }
    expandedSet.value = getSelectedAncestorPaths();
};

const selectableNodes = computed(() => allNodes.value.filter((node) => isNodeSelectable(node)));

const isNodeSelectable = (node: FlatNode) => props.allowParentSelect || !node.hasChildren;

const syncSelectedFromModel = () => {
    const selectableKeys = new Set(selectableNodes.value.map((node) => node.key));
    innerSelected.value = new Set(
        normalizeModelValue(props.modelValue)
            .map((item) => getNodeKey(item))
            .filter((key) => selectableKeys.size === 0 || selectableKeys.has(key))
    );
};

const toggleExpand = (path: string) => {
    const next = new Set(expandedSet.value);
    if (next.has(path)) {
        next.delete(path);
    } else {
        next.add(path);
    }
    expandedSet.value = next;
};

const isNodeChecked = (node: FlatNode) => innerSelected.value.has(node.key);

const toggleNode = (node: FlatNode) => {
    if (!isNodeSelectable(node)) {
        return;
    }
    const next = new Set(innerSelected.value);
    if (props.multiple) {
        if (next.has(node.key)) {
            next.delete(node.key);
        } else {
            next.add(node.key);
        }
    } else {
        next.clear();
        next.add(node.key);
    }
    innerSelected.value = next;
};

const onRowClick = (node: FlatNode) => {
    if (node.hasChildren) {
        toggleExpand(node.path);
        return;
    }
    toggleNode(node);
};

const hasAny = computed(() => innerSelected.value.size > 0);
const selectedCount = computed(() => innerSelected.value.size);
const isAllChecked = computed(
    () =>
        selectableNodes.value.length > 0 &&
        selectableNodes.value.every((node) => innerSelected.value.has(node.key))
);

const toggleAll = () => {
    if (isAllChecked.value) {
        innerSelected.value = new Set();
        return;
    }
    innerSelected.value = new Set(selectableNodes.value.map((node) => node.key));
};

const collectSelectedOptions = (): TreeNodeData[] => {
    return selectableNodes.value.filter((node) => innerSelected.value.has(node.key)).map((node) => node.raw);
};

const handleConfirm = () => {
    const options = collectSelectedOptions();
    const values = options.map((item) => getNodeValue(item));
    emit('update:modelValue', props.multiple ? values : values[0] || '');
    emit('confirm', { values, options });
    emit('update:show', false);
};

const handleCancel = () => {
    syncSelectedFromModel();
    emit('cancel');
    emit('update:show', false);
};

watch(
    () => props.modelValue,
    () => {
        if (!props.show) {
            syncSelectedFromModel();
        }
    },
    { immediate: true }
);

watch(
    () => props.show,
    (visible) => {
        if (visible) {
            syncSelectedFromModel();
            initExpanded();
        }
    }
);

watch(
    treeData,
    () => {
        if (props.show) {
            initExpanded();
        }
    },
    { deep: true }
);
</script>

<style scoped lang="postcss">
.mx-app-tree-select {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #ffffff;

    .ts-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-height: 64px;
        padding: 0 24px;

        .title {
            font-size: 20px;
            font-weight: 600;
            color: #303133;
        }

        .btn {
            font-size: 16px;

            &.cancel {
                color: #999999;
            }

            &.confirm {
                color: #3266f6;
            }
        }
    }

    .ts-all {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 14px;
        min-height: 54px;
        padding: 0 24px;

        .label {
            font-size: 16px;
            color: #303133;
        }
    }

    .ts-body {
        flex: 1;
        overflow-y: auto;

        .ts-loading {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 160px;
        }

        .ts-row {
            display: flex;
            align-items: center;
            min-height: 56px;
            padding-right: 24px;

            .ts-arrow {
                width: 16px;
                height: 16px;
                flex-shrink: 0;
                margin-right: 16px;
                position: relative;
                transition: transform 0.2s;

                &::after {
                    content: '';
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    width: 0;
                    height: 0;
                    border-top: 6px solid transparent;
                    border-bottom: 6px solid transparent;
                    border-left: 7px solid #c7c9cc;
                    transform: translate(-50%, -50%);
                }

                &.open {
                    transform: rotate(90deg);
                }
            }

            .ts-arrow-placeholder {
                width: 16px;
                height: 16px;
                flex-shrink: 0;
                margin-right: 16px;
            }

            .ts-name {
                flex: 1;
                font-size: 16px;
                color: #303133;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
        }

        .ts-empty {
            padding: 40px 0;
            text-align: center;
            color: #909399;
            font-size: 14px;
        }
    }

    .ts-footer {
        min-height: 56px;
        padding: 14px 24px calc(14px + env(safe-area-inset-bottom));
        border-top: 1px solid #ebedf0;
        font-size: 16px;
        color: #303133;
    }

        .ts-checkbox {
        width: 18px;
        height: 18px;
        flex-shrink: 0;
        border: 1px solid #d7d7d7;
        border-radius: 2px;
        background: #ffffff;
        box-sizing: border-box;
        position: relative;
        transition: all 0.15s;

        &.checked {
            background: #3266f6;
            border-color: #3266f6;

            &::after {
                content: '';
                position: absolute;
                left: 5px;
                top: 1px;
                width: 5px;
                height: 10px;
                border: solid #ffffff;
                border-width: 0 2px 2px 0;
                transform: rotate(45deg);
            }
        }

        &.indeterminate {
            background: #3266f6;
            border-color: #3266f6;

            &::after {
                content: '';
                position: absolute;
                left: 3px;
                top: 7px;
                width: 10px;
                height: 2px;
                background: #ffffff;
                border-radius: 1px;
            }
        }

        .ts-checkbox-placeholder {
            width: 18px;
            height: 18px;
            flex-shrink: 0;
        }
    }
}
</style>

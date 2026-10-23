<template>
    <div class="tree">
        <div class="tree-left">
            <div class="tree-left-tit">
                <div class="tag" @click="selectAll()">全选</div>
                <div class="title-text">共 {{ leafCount }} 人</div>
            </div>
            <div class="search-box">
                <n-input v-model:value="searchValue" placeholder="请输入">
                    <template #suffix>
                        <n-icon size="16">
                            <SearchOutline />
                        </n-icon>
                    </template>
                </n-input>
            </div>
            <div class="tree-con">
                <n-tree
                    v-bind="$attrs"
                    :check-strategy="props.strategy"
                    @update:checked-keys="handleChecked"
                    v-model:checked-keys="props.value"
                    :show-irrelevant-nodes="false"
                    :cascade="props.cascade"
                    :key-field="props.keyField"
                    :label-field="props.labelField"
                    :children-field="props.childrenField"
                    v-model:expanded-keys="expandedKeys"
                    block-line
                    :data="treeData"
                    :filterable="false"
                    expand-on-click
                    checkable />
            </div>
        </div>
        <div class="tree-right">
            <div class="tree-left-tit">
                <div class="tag" @click="delAll()">清除</div>
                <div class="title-text">已选 {{ props.value.length }} 人</div>
            </div>
            <div class="tree-right-con">
                <div class="tree-right-item" v-for="value in rightData" :key="value[props.keyField]">
                    <div class="tree-right-item-text">
                        <n-ellipsis style="max-width: 100%">
                            {{ value[props.labelField] }}
                        </n-ellipsis>
                    </div>
                    <n-icon @click="delEvt(value)" size="16" class="tree-right-item-del-icon">
                        <CloseOutline />
                    </n-icon>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { getDeptAndUserTree } from '@/api/comm';
import { SearchOutline, CloseOutline } from '@vicons/ionicons5';
import _ from 'lodash';
import { NTree, NInput, NIcon, NEllipsis } from 'naive-ui';
import { computed, onMounted, ref, watch, watchEffect } from 'vue';
interface Props {
    value?: any;
    allValue?: any;
    dataType?: 'deptAndUser'; // 想要其他数据自己添加
    keyField?: string;
    labelField?: string;
    childrenField?: string;
    cascade?: boolean,
    strategy?: 'all' | 'child';
}

const rightData = ref<any>([]);

const props = withDefaults(defineProps<Props>(), {
    value: () => [],
    allValue: () => [],
    dataType: 'deptAndUser',
    keyField: 'value',
    labelField: 'label',
    childrenField: 'children',
    cascade: true,
    strategy: 'child'
});


const searchValue = ref<string>('');
const expandedKeys = ref<string[]>([]);

const rawTreeData = ref<any>([]);
const rawData = ref<any>([]);

const emits = defineEmits(['update:value', 'update:allValue']);
const getData = async (type: any) => {
    switch (type) {
        case 'deptAndUser': {
            let res = await getDeptAndUserTree();
            console.log('部门数据',res);
            
            if (res.code === 200) {
                rawTreeData.value = res.data;
                rawData.value = flattenTree(res.data);
                console.log(rawData.value, res.data);
            }
            break;
        }
    }
};

watch(
    () => props.dataType,
    (newVal) => {
        getData(newVal);
    },
    {
        immediate: true,
    }
);

const flattenTree = (nodes: any[]): any[] => {
    return _.flatMap(nodes, (node: any) => [
        node,
        ...(node[props.childrenField] ? flattenTree(node[props.childrenField]) : []),
    ]);
};


const selectAll = () => {
    let data = flattenTree(rawTreeData.value).filter((item:any) => item.disabled !== true)
    data = _.uniqBy(data, props.keyField)
    if(props.strategy === 'child'){
        data = data.filter((item:any) => {
            return !item[props.childrenField] || item[props.childrenField].length === 0
        })
    }
    data = data.map((item:any) => item[props.keyField])

    rightData.value = data.map((item: any) => {
        let obj = rawData.value.find((d: any) => d[props.keyField] === item);
        return obj;
    });
    
    console.log(data, '--')
    console.log(rightData.value, '--')
    emits('update:value', data);
    emits('update:allValue', rightData.value);
}

const delAll = () => {
    // ① 修改 value
    emits('update:value', []);
    emits('update:allValue', []);
    // ② 原地删除 rightData（关键）
    rightData.value.splice(0, rightData.value.length); // ⭐ 不替换数组

    // ③ 同步 expandedKeys（非常重要）
    // expandedKeys.value = [];

    console.log('已清空选中');
}

const delEvt = (row: any) => {
    const key = row[props.keyField];

    // ① 修改 value
    const newValue = props.value.filter((item: any) => item !== key);

    // ② 原地删除 rightData（关键）
    const index = rightData.value.findIndex((item: any) => item[props.keyField] === key);

    if (index !== -1) {
        rightData.value.splice(index, 1); // ⭐ 不替换数组
    }

    // ③ 同步 expandedKeys（非常重要）
    // expandedKeys.value = expandedKeys.value.filter((k) => k !== key);

    console.log('删除后选中：', newValue);
    // ④ emit
    emits('update:value', newValue);
    emits('update:allValue', rightData.value);
};

const countLeafNodes = (nodes: any, set = new Set()) => {
  nodes.forEach((node: any) => {
    const children = node[props.childrenField]
    const value = node[props.keyField]

    if (!children || children.length === 0) {
      if (node.disabled !== true) {
        set.add(value)
      }
    } else {
      countLeafNodes(children, set)
    }
  })

  return set.size
}

const leafCount = computed(() => {
    return countLeafNodes(treeData.value);
});

const filterTree = (nodes: any[], keyword: string): any[] => {
    if (!keyword) return nodes;
    expandedKeys.value = []

    const result: any[] = [];

    for (const node of nodes) {
        const isMatch = node[props.labelField].includes(keyword);

        // 父命中 → 整棵加入
        if (isMatch) {
            result.push(node);
            continue;
        }

        // 递归子节点
        const children = node[props.childrenField] ? filterTree(node[props.childrenField], keyword) : [];

        if (children.length) {
            result.push({ ...node, children });
        }
    }

    // console.log('过滤后：', result);

    return result;
};

const treeData = computed(() => filterTree(rawTreeData.value, searchValue.value));


const handleChecked = function (keys: any, options: any) {
    console.log('选中的 keys：', keys);
    // rightData.value = keys.map((item: any) => {
    //     let obj = rawData.value.find((d: any) => d[props.keyField] === item);
    //     return obj;
    // });

    emits('update:value', keys);
   

    console.log('详细信息：', rightData.value);
};

watchEffect(() => {
    rightData.value = props.value.map((item: any) => {
        let obj = rawData.value.find((d: any) => d[props.keyField] === item);
        return obj;
    }).filter((it: any) => it !== undefined);
    emits('update:allValue', rightData.value);
});
</script>

<style lang="less" scoped>
.tree {
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px 4px 4px 4px;
    border: 1px solid #dddfe6;
    overflow: hidden;
    height: 300px;
    overflow: hidden;
    // min-width: 476px;
    width: 100%;
}
.tree-left,
.tree-right {
    width: 50%;
    padding: 8px;
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
}

.tree-right {
    border-left: 1px solid #eceef4;
}

.tree-left-tit {
    display: flex;
    align-items: center;
    margin-bottom: 9px;
    flex-shrink: 0;
}
.tag {
    width: 34px;
    height: 20px;
    background: #f4f5f5;
    border-radius: 2px 2px 2px 2px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 400;
    font-size: 12px;
    color: #333333;
    margin-right: 8px;
    cursor: pointer;
}
.title-text {
    font-weight: 400;
    font-size: 12px;
    color: #666666;
}
.search-box {
    width: 100%;
    height: 32px;
    border-radius: 4px;
    flex-shrink: 0;
    margin-bottom: 14px;
}
.tree-con {
    // height: calc(100% - 75px);
    flex: 1;
    overflow-y: auto;
}
:deep(.n-tree .n-tree-node.n-tree-node--highlight .n-tree-node-content .n-tree-node-content__text) {
    border-bottom: none;
}
.tree-right-con {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
}
.tree-right-item {
    width: 100%;
    height: 32px;
    border-radius: 4px;
    display: flex;
    overflow: hidden;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 0 8px;
    flex-shrink: 0;
}
.tree-right-item-del-icon {
    display: none;
    flex-shrink: 0;
    cursor: pointer;
}
.tree-right-item-text {
    flex: 1;
    overflow: hidden;
    font-weight: 400;
    font-size: 14px;
    color: #333333;
}
.tree-right-item:hover {
    background: #f3f3f5;
    .tree-right-item-del-icon {
        display: block;
        flex-shrink: 0;
    }
}
</style>

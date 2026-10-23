<template>
    <van-field
        v-if="!props.popupOnly"
        :class="attrs.class"
        :name="props.name"
        :rules="props.rules"
        :required="props.required"
        v-model="labels"
        :label="props.title"
        :label-align="props.labelAlign"
        :is-link="!props.readonly"
        readonly
        :placeholder="props.placeholder || '请选择'"
        @click="appClick" />
    <div class="app_person_select_container" ref="containerRef">
        <van-action-sheet
            v-model:show="Appshow"
            :close-on-click-overlay="true"
            :title="props.title"

            @cancel="handleAppClose(false)"
            @click-overlay="handleAppClose(false)">
            <div class="app-action-sheet-content">
                <!-- 搜索区域 -->
                <search
                    class="search-box"
                    v-model="appSearchValue"
                    show-action
                    shape="round"
                    :placeholder="props.placeholder"
                    maxlength="24"
                    @search="onSearch">
                    <template #action>
                        <van-button @click.stop.prevent="onSearch" class="search-btn" type="primary" size="small" round
                            >搜索</van-button
                        >
                    </template>
                </search>
                <!-- 列表内容区域  -->
                <div class="content-main">
                    <div class="list-content" v-if="filteredOptions.length > 0">
                        <van-list>
                            <SelectItem
                                v-for="item in filteredOptions"
                                :key="item.value"
                                :item="item"
                                :selected="isSelected(item.value)"
                                :multiple="props.multiple"
                                :showDataItem="['code']"
                                @onClick="handleSelect"></SelectItem>
                        </van-list>
                    </div>
                    <div class="list-content" v-else>
                        <van-empty description="数据暂无" />
                    </div>
                </div>
                <!-- 底部 -->
                <div class="content-footer-placeholder" v-if="multiple"></div>
                <div class="content-footer" v-if="multiple">
                    <!-- 多选 -->
                    <div class="check-box" v-if="multiple" @click.stop.prevent="handleSelectAll">
                        <i
                            :class="{
                                icon: true,
                                check_icon: multiple,
                                part_icon: multiple && selectValue.length < options.length && selectValue.length > 0,
                                'check_active_icon ':
                                    multiple && selectValue.length >= options.length && selectValue.length > 0,
                            }"></i>
                        <span class="check-text">全选（{{ selectValue.length }}/{{ options.length }}）</span>
                    </div>
                    <i></i>
                    <van-button class="confirm-btn" type="primary" @click.stop.prevent="submitEvt">确认</van-button>
                </div>
            </div>
        </van-action-sheet>
    </div>
</template>

<script setup lang="ts">
import SelectItem from '@/components/SelectItem/index.vue';
import { computed, onMounted, ref, useAttrs, watch } from 'vue';
import {
    ActionSheet as VanActionSheet,
    Search,
    Button as VanButton,
    List as VanList,
    Empty as VanEmpty,
    Field as VanField,
} from 'vant';
import type { PersonSelectProps, PersonSelectEmits, PersonOption } from './index.type';
import { getUserListApi } from '@/api';
import { storeToRefs } from 'pinia';
import { useDictStore } from '@/store/commStore';
const { setDictMapByName } = useDictStore();
const { dictMap } = storeToRefs(useDictStore());
// 从父组件接收属性
const props = defineProps<
    PersonSelectProps & {
        options: PersonOption[];
    }
>();
const containerRef = ref<HTMLElement | null>(null);
const attrs = useAttrs();
const Appshow = ref(false);
const appClick = () => {
    if (!props.readonly) {
        Appshow.value = true;
    }
};
watch(
    () => props.show,
    (newVal) => {
        if (newVal) {
            Appshow.value = newVal;
        }
    }
);
// 从父组件接收事件
const emit = defineEmits<PersonSelectEmits>();
/**
 * 关闭弹窗
 * @param isSubmit 是否提交选择
 */
const handleAppClose = (isSubmit: boolean = false) => {
    console.log('关闭========弹窗', isSubmit, props);

    if (!isSubmit) {
        selectValue.value = JSON.parse(JSON.stringify(props.modelValue)) || [];
    }
    // submitEvt()
    Appshow.value = false;
    emit('update:show', Appshow.value);
};
//
// 搜索
const appSearchValue = ref('');
const onSearch = async () => {
    if (options.value.length === 0) {
        await getPersonList();
    }
    filteredOptions.value = options.value.filter((item) => item.label.includes(appSearchValue.value));
};
// 响应式数据
const options = ref<PersonOption[]>([]);
// 筛选数据
const filteredOptions = ref<PersonOption[]>([]);
// 选择的数据Value
const selectValue = ref<string[] | string>([]);
// 处理选中数据的label
const labels = ref<string>('');

/**
 * 组装人员选择组件的查询参数。
 * 选人组件只展示在职内部员工，避免外部传参或其他模块的查询条件覆盖员工类型。
 * @returns 人员列表接口查询参数
 */
const getPersonListParams = () => ({
    status: 'WORKING',
    needDept: true,
    ...props.extraParams,
    type: 'INTERNAL',
});

/**
 * 根据查询参数生成独立缓存键，避免与审批等“全部人员”查询共用缓存。
 * @param params 人员列表接口查询参数
 * @returns 人员列表缓存键
 */
const getPersonListCacheKey = (params: Record<string, any>) =>
    `人员列表-${Object.keys(params)
        .sort()
        .map((key) => `${key}=${String(params[key])}`)
        .join('&')}`;

/**
 * 按人员编码去重，避免同一员工关联多个部门时在 App 列表和已选标签中重复出现。
 * @param list 接口或缓存返回的人员列表
 * @returns 按 value 去重后的人员列表
 */
const normalizePersonOptions = (list: PersonOption[]): PersonOption[] => {
    const personMap = new Map<string, PersonOption>();
    list.forEach((item) => {
        if (!item?.value || personMap.has(item.value)) return;
        personMap.set(item.value, item);
    });
    return Array.from(personMap.values());
};
// 处理选择
const handleSelect = (value: string) => {
    if (props.multiple) {
        if (!Array.isArray(selectValue.value)) {
            selectValue.value = [];
        }
        if (selectValue.value.indexOf(value) === -1) {
            selectValue.value.push(value);
        } else {
            selectValue.value.splice(selectValue.value.indexOf(value), 1);
        }
    } else {
        // 单选
        selectValue.value = value;
        submitEvt();
    }
};
// 确认选择
const submitEvt = () => {
    if (props.multiple) {
        emit('update:modelValue', JSON.parse(JSON.stringify(selectValue.value)));
        // 选中标签集合
        let selectedLabels: string[] = [];
        // 选中的项数据
        let selectedItems: PersonOption[] = [];
        if (Array.isArray(selectValue.value)) {
            // 结果是数组-正常
            selectedLabels = (selectValue.value || [])
                .map((item) => filteredOptions.value.find((opt) => opt.value === item)?.label || '')
                .filter((label) => label !== '');
            selectedItems = (selectValue.value || [])
                .map((item) => options.value.find((opt) => opt.value === item) || null)
                .filter((item): item is PersonOption => item !== null);
            selectedItems.forEach((item) => {
                item.id = '';
            });
        } else {
            // 多选-但值非数组，异常，视同空数组
            selectedLabels = [];
            selectedItems = [];
        }
        // 循环selectedOptions，将每条数据value进行对比，
        // 如果selectedOptions数据的value与props.selectedPerson的value相同，
        // 那么保留props.selectedPerson的id，否则就使用item的id
        if (props.selectedPerson) {
            selectedItems.forEach((item) => {
                item.id = props.selectedPerson.find((person) => person.value === item.value)?.id || '';
            });
        }
        // 选中标签集合
        emit('update:label', selectedLabels);
        // 触发选择人变更事件
        emit('update:selectedPerson', selectedItems);
        // 选中项数据
        emit('changeEvt', selectedItems);
        // 关闭弹窗
        handleAppClose(true);
        labels.value = selectedLabels.join('、');
    } else {
        emit('update:modelValue', JSON.parse(JSON.stringify(selectValue.value)));
        // 获取选中项
        let selectedItem = filteredOptions.value.find((item) => item.value === selectValue.value) || null;
        selectedItem.id = '';
        // 判断selectedOptions是否存在id
        if (
            props.selectedPerson &&
            !Array.isArray(props.selectedPerson) &&
            props.selectedPerson.value === selectedItem.value
        ) {
            selectedItem.id = props.selectedPerson.id || '';
        }
        // 触发选择变更事件
        emit('changeEvt', selectedItem);
        // 触发选择人变更事件
        emit('update:selectedPerson', selectedItem);
        // 更新标签
        emit('update:label', selectedItem?.label || null);
        labels.value = selectedItem?.label || '';
        // 关闭弹窗
        handleAppClose(true);
    }
};
// 判断是否选中
const isSelected = computed(() => {
    return (value: string) => {
        if (Array.isArray(selectValue.value)) {
            return selectValue.value.includes(value);
        }
        return selectValue.value === value;
    };
});
// 全选
const handleSelectAll = () => {
    if (!Array.isArray(selectValue.value)) {
        selectValue.value = [];
    }
    if (options.value.length === selectValue.value.length) {
        // 已全选，取消全选
        selectValue.value = [];
    } else {
        // 未全选，全选
        const allValues = filteredOptions.value.map((item) => item.value);
        // 如果当前筛选出的数据已经全选，则将其移出，否则添加全选
        if (allValues.every((item) => selectValue.value.includes(item))) {
            // 已全选，将allValues从selectValue.value中移除
            selectValue.value = selectValue.value.filter((item) => !allValues.includes(item));
        } else {
            // 未全选，全选
            selectValue.value = [...new Set([...selectValue.value, ...allValues])];
        }
    }
};
// 人员数据获取
async function getPersonList() {
    // 通过props.modelValue判断是否需要获取人员数据
    function isNeedGetPersonList() {
        if (props.modelValue) {
            if (Array.isArray(props.modelValue)) {
                const selectedValues = Array.from(new Set(props.modelValue));
                selectValue.value = selectedValues;
                labels.value = selectedValues
                    .map((value) => options.value.find((item) => item.value === value)?.label || '')
                    .filter(Boolean)
                    .join('、');
            } else {
                selectValue.value = props.modelValue;
                labels.value = options.value.find((item) => item.value === props.modelValue)?.label || '';
            }
        } else {
            selectValue.value = Array.isArray(props.modelValue) ? [] : '';
            labels.value = '';
        }
    }
    try {
        const personParams = getPersonListParams();
        const dictKey = getPersonListCacheKey(personParams);
        if (dictMap.value?.[dictKey] && !props.disableCache) {
            options.value = normalizePersonOptions(dictMap.value[dictKey]);
            filteredOptions.value = options.value.filter((item) => item.label.includes(appSearchValue.value));
            isNeedGetPersonList();
            return;
        }
        const _result = await getUserListApi(personParams);
        if (_result.code == 200) {
            window.parent?.console.log('人员数据获取', _result.data);
            options.value = normalizePersonOptions(
                (_result.data || []).map((item: any) => ({
                    ...item,
                    label: item.username,
                    value: item.code,
                }))
            );
            setDictMapByName(dictKey, options.value);
            isNeedGetPersonList();
            filteredOptions.value = options.value.filter((item) => item.label.includes(appSearchValue.value));
        } else {
        }
    } catch (error) {}
    console.log('这是labels', labels);
}
watch(
    () => props.modelValue,
    (newVal, oldVal) => {
        if (newVal !== oldVal) {
            getPersonList();
        }
    }
);
onMounted(() => {
    console.log('初始化====这是labels');

    getPersonList();
});
</script>

<style>
.app_person_select_container .app-action-sheet-content {
    display: flex !important;
    flex-direction: column !important;
    position: relative !important;
    height: calc(80vh - 48px) !important;
    background-color: var(--base-grey3) !important;
    overflow-y: hidden;
}
.app_person_select_container .van-search {
    margin-bottom: 12px !important;

}
.app_person_select_container .search-box .search-btn {
    width: 72px;
    height: 34px;
    line-height: 34px;
    font-size: 14px;
}
.app_person_select_container .content-main {
    flex: 1 !important;
    padding: 12px 0px 0px !important;
    background-color: var(--base-white);
    overflow-y: hidden;
}
.app_person_select_container .content-main .list-content {
    overflow-y: auto !important;
    padding: 0 12px !important;
    height: 100%;
}
.app_person_select_container .content-main .list-row {
    display: flex !important;
    align-items: center !important;
    border-bottom: 1px solid var(--border);
    padding: 12px 0;
}
.app_person_select_container .content-main .list-row .icon {
    margin-right: 12px !important;
}
.app_person_select_container .content-main .row-title {
    font-size: 16px;
    color: var(--base-grey4) !important;
    font-weight: 500;
    line-height: 22px !important;
    margin-bottom: 4px;
}
.app_person_select_container .content-main .row-other {
    font-size: 14px;
    font-weight: 400;
    color: var(--base-grey) !important;
    line-height: 20px;
}
.app_person_select_container .content-main .row-other .line-icon {
    margin: 0 8px !important;
}
.app_person_select_container .content-footer-placeholder {
    height: 48px !important;
}
.app_person_select_container .content-footer {
    position: absolute !important;
    left: 0 !important;
    bottom: 0;
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    width: 100% !important;
    height: 48px !important;
    background-color: var(--base-white) !important;
    z-index: 1 !important;
    border-top: 1px solid var(--border) !important;
    padding: 0 12px !important;
}
.app_person_select_container .content-footer .icon {
    display: inline-block !important;
    width: 16px !important;
    height: 16px !important;
    background-position: center;
    background-repeat: no-repeat;
    background-size: 100%;
}
.app_person_select_container .content-footer .check-box {
    display: flex !important;
    align-items: center !important;
}
.app_person_select_container .content-footer .check-box .icon {
    margin-right: 8px !important;
}
.app_person_select_container .content-footer .confirm-btn {
    width: 140px !important;
    height: 40px !important;
    line-height: 40px;
    font-size: 16px;
    font-weight: 500;
    border-radius: 4px;
}
.app_person_select_container .content-footer .check_icon {
    background-image: url('@/components/SelectItem/img/multiple_select_icon.png') !important;
}
.app_person_select_container .content-footer .check_active_icon {
    background-image: url('@/components/SelectItem/img/multiple_select_icon_active.png') !important;
}
.app_person_select_container .content-footer .part_icon {
    background-image: url('@/components/SelectItem/img/multiple_select_part_active.png') !important;
}
:deep(.app_person_select_container .app-action-sheet-content .van-field__control) {
    font-size: 14px;
}
:deep(.app_person_select_container .app-action-sheet-content .van-search__action) {
    display: flex;
    align-items: center;
}
:deep(.app_person_select_container .app-action-sheet-content .van-cell) {
    padding: 4px 0 !important;
}
</style>

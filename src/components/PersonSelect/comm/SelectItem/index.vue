<template>
    <div class="item_content" @click.stop.prevent="handleSelect(item.value)">
        <!-- 选中 -->
        <i
            style="flex-shrink: 0"
            :class="{
                icon: true,
                'check_icon': props.multiple,
                'single_icon': !props.multiple,
                'check_active_icon': props.multiple && props.selected,
                'single_active_icon': !props.multiple && props.selected,
            }"></i>
        <div class="row-main">
            <div class="row-title">
                {{ props.item.label }}
            </div>
            <div class="row-other" v-if="props.showDataItem">
                <span class="other-item" v-for="other in props.showDataItem">{{ props.item[other] || '--' }}</span>
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
import { SelectItemEmits, SelectItemProps } from '@/components/SelectItem/index.type';

const props = defineProps<SelectItemProps>();
// 点击事件
const emit = defineEmits<SelectItemEmits>();
const handleSelect = (value: string) => {
    emit('onClick', value);
};
</script>
<style lang="postcss" scoped>
.item_content {
    display: flex;
    align-items: center;
    border-bottom: 1px solid var(--border);
    padding: 12px 0;

    .icon {
        width: 16px;
        height: 16px;
        background-position: center;
        background-repeat: no-repeat;
        background-size: 100%;
        margin-right: 12px;
    }

    .row-title {
        font-size: 16px;
        color: #333333;
        font-weight: 600;
        line-height: 22px;
        margin-bottom: 4px;
    }

    .row-other {
        font-size: 14px;
        font-weight: 400;
        color: #999999;
        line-height: 20px;

        .line-icon {
            margin: 0 8px;
        }
    }
    /* 多选-未选中 */
    .check_icon{
        background-image: url("@/comm/img/multiple_select_icon.png");
    }
    /* 多选-选中 */
    .check_active_icon{
        background-image: url("./img/multiple_select_icon_active.png");
    }
    /* 单选-未选中 */
    .single_icon{
        background-image: url("./img/single_icon.png");
    }
    /* 单选-选中 */
    .single_active_icon{
        background-image: url("./img/single_icon_active.png");
    }
}
</style>

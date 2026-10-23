<template>
    <div class="no_data" :style="{ minHeight: `${200 * props.scale}px` }">
        <i
            class="icon no_data_icon"
            :style="{
                width: 180 * props.scale + 'px',
                height: 146 * props.scale + 'px',
            }"></i>
        <span :style="{ fontSize: 14 * props.scale + 'px' }">暂无数据</span>
        <div class="add_btn" v-if="props.isAdd" @click="addClick">立即添加<i class="icon add_icon"></i></div>
    </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';
const props = defineProps({
    isAdd: {
        type: Boolean,
        default: false,
    },
    scale: {
        type: Number,
        default: 1,
    },
});
const emits = defineEmits(['add']);
const addClick = () => {
    emits('add');
};
</script>
<style lang="postcss" scoped>
.no_data {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    color: var(--base-grey);
    .no_data_icon {
        width: 180px;
        height: 146px;
        background: center url('@/assets/images/comm/no_data_icon.png') no-repeat;
        background-size: 100% 100%;
        margin-bottom: 5px;
    }
    .add_btn {
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--base-color);
        font-size: var(--base-font-size);
        cursor: pointer;
        .add_icon {
            width: 16px;
            height: 16px;
            background: center url('@/assets/images/comm/icon⎽com⎽add_blue.png') no-repeat;
            background-size: 100% 100%;
        }
    }
}
</style>

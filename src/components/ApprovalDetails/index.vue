<template>
    <component :is="pageComponent" v-model="nodeList"></component>
</template>
  
<script setup lang="ts">
import vertical from './vertical.vue'
import horizontal from './horizontal.vue'
import { computed } from 'vue';
const props = withDefaults(
    defineProps<{
        type: string;
    }>(),
    {
        type: 'vertical',//horizontal
    }
);
const pageComponent = computed(() => {
    const { type } = props
    if (type == 'vertical') {
        return vertical
    } else {
        return horizontal
    }
})
const nodeList: any = defineModel();
</script>
  
<style lang="postcss" scoped></style>
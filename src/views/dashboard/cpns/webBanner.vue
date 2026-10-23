<template>
  <!-- 轮播图空状态 -->
  <div v-if="bannerList.length === 0" class="web-swipe empty-state">
    <Empty :scale="0.85" />
  </div>

  <!-- 正常轮播 -->
  <NCarousel v-else class="web-swipe" :interval="10000" autoplay indicator-color="white" draggable>
    <template v-for="(item, index) in bannerList" :key="index">
      <NCarouselItem>
        <div :class="['item', item.type]" @click="handleBannerClick(item)">
          <div class="content">
            <div class="title">{{ item.title }}</div>
            <div class="typeName">{{ item.typeName }}</div>
            <div class="time">{{ item.time }}</div>
          </div>
        </div>
      </NCarouselItem>
    </template>
  </NCarousel>

  <!-- 市场报告详情 -->
  <MarketReportDetail ref="marketReportDetailRef" />

  <!-- 行业动态详情 -->
  <IndustryNewsDetail ref="industryNewsDetailRef" />

  <!-- 化工企业详情 -->
  <MxDrawer v-model:show="chemicalVisible" title="化工企业调研详情" size="large" :closablePop="false">
    <ChemicalCompanyDetail v-if="chemicalVisible" :record-id="chemicalRecordId" :initial-data="chemicalInitialData" />
  </MxDrawer>

  <!-- 竞争对手详情 -->
  <MxDrawer v-model:show="competitorVisible" title="竞争对手调研详情" size="large" :closablePop="false">
    <CompetitorDetailContent v-if="competitorVisible" :record-id="competitorRecordId" :initial-data="competitorInitialData" />
  </MxDrawer>
</template>

<script setup lang="ts">
import { ref, PropType } from 'vue'
import { NCarousel, NCarouselItem } from 'naive-ui';
import MarketReportDetail from '@/views/marketInfo/marketReport/wCpns/detail.vue';
import IndustryNewsDetail from '@/views/marketInfo/industryNews/wCpns/detail.vue';
import ChemicalCompanyDetail from '@/views/marketInfo/chemicalCompany/components/ChemicalCompanyDetail.vue';
import CompetitorDetailContent from './CompetitorDetailContent.vue';

const props = defineProps({
  bannerList: {
    type: Array as PropType<any[]>,
    default: () => []
  }
})

// 详情抽屉引用
const marketReportDetailRef = ref<InstanceType<typeof MarketReportDetail>>();
const industryNewsDetailRef = ref<InstanceType<typeof IndustryNewsDetail>>();

// 化工企业抽屉
const chemicalVisible = ref(false);
const chemicalRecordId = ref<number | string | null>(null);
const chemicalInitialData = ref({});

// 竞争对手抽屉
const competitorVisible = ref(false);
const competitorRecordId = ref<number | string | null>(null);
const competitorInitialData = ref({});

const handleBannerClick = (item: any) => {
  switch (item.type) {
    case 'report':
      marketReportDetailRef.value?.showDrawer('preview', { ...item, fromBanner: true });
      break;
    case 'industry':
      industryNewsDetailRef.value?.showDrawer('preview', { ...item, fromBanner: true });
      break;
    case 'chemical':
      chemicalRecordId.value = item.id;
      chemicalInitialData.value = item;
      chemicalVisible.value = true;
      break;
    case 'competing':
      competitorRecordId.value = item.id;
      competitorInitialData.value = item;
      competitorVisible.value = true;
      break;
  }
}
</script>

<style scoped lang="less">
.web-swipe {
  width: 396px;
  height: 100%;
  border-radius: 12px 12px 12px 12px;
  box-shadow: 0px 3px 20px 1px rgba(132, 132, 132, 0.16);


  // 空状态样式
  &.empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fff;
  }

  .item {
    height: 100%;
    border-radius: 12px 12px 12px 12px;
    display: flex;
    align-items: center;
    box-sizing: border-box;
    padding: 0 0 0 20px;
    cursor: pointer;

    .content {
      display: flex;
      flex-direction: column;
      align-items: flex-start !important;
      width: 100%;
      min-width: 0;
      padding-right: 20px;
      box-sizing: border-box;

      .title {
        align-self: stretch;
        width: 100%;
        min-width: 0;
        font-size: 18px;
        color: #272626;
        font-weight: 600;
        text-align: left !important;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .typeName {
        align-self: flex-start;
        height: 24px;
        background: #095CF6;
        border-radius: 2px 2px 2px 2px;
        margin: 12px 0 22px;
        font-size: 14px;
        color: #FFFFFF;
        padding: 0 6px;
        flex: 0;
      }

      .time {
        align-self: stretch;
        width: 100%;
        text-align: left !important;
        font-size: 14px;
        color: #095CF6;
      }
    }
  }

  .report {
    background: url("@/assets/images/dashboard/banner/img⎽com⎽banner⎽web⎽scbg.png") no-repeat center;
    background-size: 100% 105%;

    .content {
      .typeName {
        background: #095CF6;
      }

      .time {
        color: #095CF6;
      }
    }
  }

  .industry {
    background: url("@/assets/images/dashboard/banner/img⎽com⎽banner⎽web⎽hydt.png") no-repeat center;
    background-size: 100% 105%;

    .content {
      .typeName {
        background: #0192FF;
      }

      .time {
        color: #0192FF;
      }
    }
  }

  .chemical {
    background: url("@/assets/images/dashboard/banner/img⎽com⎽banner⎽web⎽hgdy.png") no-repeat center;
    background-size: 100% 105%;

    .content {
      .typeName {
        background: #1E01FF;
      }

      .time {
        color: #1E01FF;
      }
    }
  }

  .competing {
    background: url("@/assets/images/dashboard/banner/img⎽com⎽banner⎽web⎽jzqy.png") no-repeat center;
    background-size: 100% 105%;

    .content {
      .typeName {
        background: #FF9401;
      }

      .time {
        color: #FF9401;
      }
    }
  }
}
</style>

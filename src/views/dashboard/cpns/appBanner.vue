<template>
  <Swipe v-if="bannerList.length > 0" class="app-swipe" :autoplay="5000" indicator-color="white" :loop="true">
    <SwipeItem
      v-for="(item, index) in bannerList"
      :key="index"
      @click="handleBannerClick(item)"
    >
      <div :class="['item', item. type]">
        <div class="content">
          <div class="title">{{ item.title }}</div>
          <div class="typeName">{{ item.typeName }}</div>
          <div class="time">{{ item.time }}</div>
        </div>
      </div>
    </SwipeItem>
  </Swipe>
  <div v-else class="app-swipe app-swipe--empty">
    <Empty :scale="0.5" />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router"
import { Swipe, SwipeItem } from 'vant';

const props = defineProps({
  bannerList: {
    type: Array as () => any[],
    default: () => []
  }
})

const router = useRouter()

/** 轮播图类型对应的移动端详情页路由 */
const detailRouteMap: Record<string, string> = {
  report: '/marketInfo/marketReport/detail',
  industry: '/marketInfo/industryNews/detail',
  chemical: '/marketInfo/chemicalCompany/detail',
  competing: '/marketInfo/competitor/detail',
}

/** 点击轮播图跳转到移动端独立详情页（预览模式） */
const handleBannerClick = (item: any) => {
  const path = detailRouteMap[item.type]
  if (!path || !item.id) return
  router.push({
    path: `${import.meta.env.VITE_APP_SYSTEM_CODE}${path}`,
    query: { type: 'preview', id: item.id, fromBanner: '1' },
  })
}
</script>

<style scoped lang="less">
.app-swipe {
  width: 100%;
  height: 117px;
  border-radius: 12px 12px 12px 12px;
  box-shadow: 0px 3px 20px 1px rgba(132, 132, 132, 0.16);

.app-swipe--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
}

  .item {
    height: 117px;
    border-radius: 12px 12px 12px 12px;
    display: flex;
    align-items: center;
    box-sizing: border-box;
    padding: 0 0 0 20px;

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
        font-size: 16px;
        color: #272626;
        font-weight: 500;
        text-align: left !important;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        font-family: PingFang SC, PingFang SC;
      }

      .typeName {
        align-self: flex-start;
        height: 24px;
        background: #1D4AE0;
        border-radius: 2px 2px 2px 2px;
        margin: 8px 0 8px;
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
    background: url("@/assets/images/dashboard/banner/img⎽com⎽banner⎽h5⎽scbg.png") no-repeat center;
    background-size: 100% 100%;

    .content {
      .typeName {
        background: #1D4AE0;
      }

      .time {
        color: #095CF6;
      }
    }
  }

  .industry {
    background: url("@/assets/images/dashboard/banner/img⎽com⎽banner⎽h5⎽hydt.png") no-repeat center;
    background-size: 100% 100%;

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
    background: url("@/assets/images/dashboard/banner/img⎽com⎽banner⎽h5⎽hydt1.png") no-repeat center;
    background-size: 100% 100%;

    .content {
      .typeName {
        background: #5852EA;
      }

      .time {
        color: #5852EA;
      }
    }
  }

  .competing {
    background: url("@/assets/images/dashboard/banner/img⎽com⎽banner⎽h5⎽hydt2.png") no-repeat center;
    background-size: 100% 100%;

    .content {
      .typeName {
        background: #F4A337;
      }

      .time {
        color: #F4A337;
      }
    }
  }
}
</style>

<template>
  <card :isApp="isApp" plain class="core-business-card">
    <div :class="{ core: true, 'app-core': isApp }">
      <div class="item">
        <div class="head">
          <div class="icon"></div>
          <div class="title">发货总览</div>
        </div>
        <div class="value">
          {{ shipmentNumDisplay }}<span class="label">万吨</span>
        </div>
        <!-- <div class="sub-value" v-if="coreData?.shipmentCarNum != null">
          累计发车 {{ shipmentCarNumDisplay }}车
        </div> -->
      </div>
      <div class="item">
        <div class="head">
          <div class="icon"></div>
          <div class="title">
            回款总览
            <span style="color: #999;">
              (已回<span style="color: #FBB907;font-weight: 400;">{{ coreData?.collectionRate ?? '--' }}%</span>)
            </span>
          </div>
        </div>
        <div class="value">
          {{ paymentDisplay }}<span class="label">万元</span>
        </div>
        <div class="sub-value">
          应回款 <span class="value">{{ amountDueDisplay }}</span> 万元
        </div>
      </div>
      <div class="item">
        <div class="head">
          <div class="icon"></div>
          <div class="title">外运矿量</div>
        </div>
        <div class="value">
          {{ outboundMineralQuantityDisplay }}<span class="label">吨</span>
        </div>
      </div>
      <div class="item">
        <div class="head">
          <div class="icon"></div>
          <div class="title">库存总览</div>
        </div>
        <div class="value">
          {{ inventoryDisplay }}<span class="label">万吨</span>
        </div>
      </div>
      <div class="item">
        <div class="head">
          <div class="icon"></div>
          <div class="title">合同总览</div>
        </div>
        <div class="value">
          {{ contractDisplay }}<span class="label">万元</span>
        </div>
      </div>
      <div class="item">
        <div class="head">
          <div class="icon"></div>
          <div class="title">到期提醒</div>
        </div>
        <div class="value">
          {{ expireDisplay }}<span class="label">笔到期回款</span>
        </div>
      </div>
    </div>
  </card>
</template>

<script setup lang="ts">
import card from "./card.vue"
import { computed } from 'vue'

const props = defineProps<{
  isApp: boolean
  coreData: any
}>()

/** 数字千分位格式化，最多保留指定小数位，无小数时不补零 */
const formatNumber = (val: number | string | null | undefined, maxDecimals = 2): string => {
  if (val == null || val === '') return '--'
  const num = Number(val)
  if (isNaN(num)) return '--'
  return num.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: maxDecimals })
}

const shipmentNumDisplay = computed(() => formatNumber(props.coreData?.shipmentNum))
const shipmentCarNumDisplay = computed(() => formatNumber(props.coreData?.shipmentCarNum, 1))
const paymentDisplay = computed(() => formatNumber(props.coreData?.payment))
const amountDueDisplay = computed(() => formatNumber(props.coreData?.amountDue))
const outboundMineralQuantityDisplay = computed(() => formatNumber(props.coreData?.outboundMineralQuantity))
const inventoryDisplay = computed(() => formatNumber(props.coreData?.inventory))
const contractDisplay = computed(() => formatNumber(props.coreData?.contract))
const expireDisplay = computed(() => formatNumber(props.coreData?.expire, 0))
</script>

<style scoped lang="less">
.core {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;

  .item {
    display: flex;
    flex-direction: column;
    padding: 12px;
    border-radius: 12px;
    border: 1px solid #FFFFFF;
    box-shadow: 0px 3px 10px 1px rgba(190, 200, 219, 0.24);
    box-sizing: border-box;
    background: linear-gradient(180deg, #E9EEFB 0%, #FFFFFF 100%);
    min-height: 92px;

    .head {
      display: flex;
      align-items: center;

      .icon {
        width: 24px;
        height: 24px;
        margin-right: 8px;
      }

      .title {
        font-size: 14px;
        color: #666666;
      }
    }

    .value {
      margin-top: 8px;
      font-weight: 600;
      font-size: 18px;
      color: #333333;

      .label {
        font-weight: 400;
        font-size: 12px;
        color: #999999;
        margin: 0 4px;
      }
    }

    .sub-value {
      margin-top: 4px;
      font-size: 12px;
      color: #999999;
      line-height: 18px;

      .icon_com {
        width: 12px;
        height: 12px;
        vertical-align: middle;
        margin-right: 2px;
      }

      .rise {
        color: #18D851;
      }

      .decline {
        color: #e34242;
      }
    }
  }

  .item:nth-child(1) {
    .head {
      .icon {
        background: url("@/assets/images/dashboard/icon⎽com⎽fhzl.png") no-repeat center;
        background-size: 100% 100%;
      }
    }
  }

  .item:nth-child(2) {
    background: linear-gradient(180deg, #FBF6E9 0%, #FFFFFF 100%);

    .head {
      .icon {
        background: url("@/assets/images/dashboard/icon⎽com⎽hkzl.png") no-repeat center;
        background-size: 100% 100%;
      }
    }
  }

  .item:nth-child(3) {
    background: linear-gradient(180deg, #E9E9FB 0%, #FFFFFF 100%);

    .head {
      .icon {
        background: url("@/assets/images/dashboard/icon⎽com⎽khzl.png") no-repeat center;
        background-size: 100% 100%;
      }
    }
  }

  .item:nth-child(4) {
    background: linear-gradient(180deg, #E9F5FB 0%, #FFFFFF 100%);

    .head {
      .icon {
        background: url("@/assets/images/dashboard/icon⎽com⎽kczl.png") no-repeat center;
        background-size: 100% 100%;
      }
    }
  }

  .item:nth-child(5) {
    background: linear-gradient(180deg, #E9FBF4 0%, #FFFFFF 100%);

    .head {
      .icon {
        background: url("@/assets/images/dashboard/icon⎽com⎽htzl.png") no-repeat center;
        background-size: 100% 100%;
      }
    }
  }

  .item:nth-child(6) {
    background: linear-gradient(180deg, #FBF1E9 0%, #FFFFFF 100%);

    .head {
      .icon {
        background: url("@/assets/images/dashboard/icon⎽com⎽dqtx.png") no-repeat center;
        background-size: 100% 100%;
      }
    }
  }
}

.app-core {
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;

  .item {
    min-height: 128px;

    .head {
      flex-direction: column;
      align-items: flex-start;

      .icon {
        margin-right: 0;
      }

      .title {
        width: 100%;
        margin-top: 8px;
        line-height: 20px;
      }
    }
  }
}
</style>

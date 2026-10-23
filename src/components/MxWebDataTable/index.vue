<template>
  <div class="web-data-table">
    <!-- 外部内容插槽 -->
    <slot name="tableContent"></slot>
    <!-- 表格数据 -->
    <div class="web-n-data-table-con">
      <!-- 内部标题和按钮插槽 -->
      <div class="web-data-table-top justify-between">
        <slot name="tableTitle"></slot>
        <slot name="tableBtn"></slot>
      </div>
      <!-- 内部搜索插槽 -->
      <slot name="tableSearch"></slot>
      <n-data-table
        :row-key="rowKey"
        default-expand-all
        class="web-n-data-table"
        :columns="columnsTable"
        :data="tableList"
        :single-column="true"
        :single-line="singleLine"
        :bottom-bordered="bottomBordered"
        :bordered="bordered"
        striped
        :style="{ ...styleOption }"
        :flex-height="flexHeight"
        :max-height="maxHeight"
        :scroll-x="columnsWidth"
      />
      <!-- 分页 -->
      <Pagination v-if="showPagination" v-bind="paginationConfig" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, withDirectives, h, resolveDirective } from "vue";
import { useUserRightsStore } from "@/store/userStore";
import {
  NDataTable,
  NButton,
  NPopover,
  NSpace,
  NTooltip,
  NIcon,
  useDialog,
} from "naive-ui";
import { WebDataTableType, tableBtnsTypes } from "./type";
import _ from "lodash";
import { color } from "echarts";
const { userRights } = useUserRightsStore();
const props = withDefaults(defineProps<WebDataTableType>(), {
  isShowPagination: true,
  styleOption: () => {
    return { padding: "16px 16px 0 16px" };
  },
  bordered: false,
  bottomBordered: false,
  flexHeight: true,
  // 是否展示序号
  isShowIndex: true,
  // 操作栏宽度（可选，不传则自动计算）
  actionColumnWidth: undefined,
  // 是否不设定列的分割线，
  singleLine: true,
});

const dialog = useDialog();
const emits = defineEmits(["SelectItem"]);
// 获取删除按钮Render
const delBtnRender = (row: any, item: tableBtnsTypes, index: any) => {
  const handleDelClick = () => {
    const config = item.delConfig || {};
    dialog.warning({
      title: config.title || "确认要删除这条信息吗？",
      content: config.content || "删除后信息将无法恢复，请谨慎删除。",
      positiveText: config.positiveText || "确定",
      negativeText: config.negativeText || "取消",
      positiveButtonProps: { class: "dialog_btn_warning" },
      closable: false,
      onPositiveClick: () => {
        item.clickTableBtns?.(row, index);
      },
    });
  };
  return othetBtnRender(row, item, false, handleDelClick);
};
// 多选
const handleCheck = (select: any, selectList: any) => {
  emits("SelectItem", selectList, select);
};
// 获取其他按钮Render
const othetBtnRender = (
  row: any,
  item: tableBtnsTypes,
  isDel?: any,
  customClick?: () => void,
  index?: any
) => {
  const onClick = customClick || (isDel ? null : () => item.clickTableBtns?.(row, index));
  if (item.permission) {
    return withDirectives(
      h(
        NButton,
        {
          size: "tiny",
          type: "primary",
          quaternary: true,
          focusable: false,
          style: {
            color: item.btnColor,
            fontSize: "14px",
          },
          onClick: onClick,
        },
        { default: () => item.btnName }
      ),
      item.permission ? [[resolveDirective("btnRight"), item.permission]] : []
    );
  } else {
    return h(
      NButton,
      {
        size: "tiny",
        type: "primary",
        quaternary: true,
        focusable: false,
        style: {
          color: item.btnColor,
          fontSize: "14px",
        },
        onClick: onClick,
      },
      { default: () => item.btnName }
    );
  }
};
// 表头提示使用方式，在 columns 列配置中添加 headerTip 数组即可：
// headerTip: [
//     '支持上传图片、文档',
//     '单文件最大不超过10MB',
//     '最多可上传5个文件',
// ],
const buildHeaderTip = (tipList: string[]) => {
  return h(
    NTooltip,
    { trigger: "hover", placement: "top" },
    {
      trigger: () =>
        h(
          "div",
          { class: "header-tip-icon" },
          h(
            NIcon,
            { size: 16, color: "#999999" },
            {
              default: () =>
                h(
                  "svg",
                  {
                    xmlns: "http://www.w3.org/2000/svg",
                    viewBox: "0 0 24 24",
                    fill: "currentColor",
                  },
                  h("path", {
                    d:
                      "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z",
                  })
                ),
            }
          )
        ),
      default: () =>
        h(
          "div",
          { class: "tip-content" },
          tipList.map((tip: string) => h("div", {}, tip))
        ),
    }
  );
};

// 拼装表头以及按钮
const columnsTable = computed(() => {
  let columnsList = _.cloneDeep(props.columns || []).map((item: any) => {
    const ellipsis = item.ellipsis === undefined ? { tooltip: true } : item.ellipsis;

    // 构建标题子元素列表
    const titleChildren: any[] = [];

    // 必填星号
    if (item.isRule) {
      titleChildren.push(
        h(
          "span",
          {
            style: {
              color: "var(--base-color-red)",
              display: "inline",
              lineHeight: "1",
              fontSize: "14px",
            },
          },
          "*"
        )
      );
    }

    // 标题文字
    titleChildren.push(h("span", {}, item.title));

    // 表头提示 tooltip
    if (item.headerTip && item.headerTip.length > 0) {
      titleChildren.push(buildHeaderTip(item.headerTip));
    }

    // 是否有自定义标题（isRule 或 headerTip）
    const hasCustomTitle = item.isRule || (item.headerTip && item.headerTip.length > 0);

    return {
      ...item,
      title: hasCustomTitle
        ? h("div", { class: "align-center", style: { gap: "4px" } }, titleChildren)
        : item.title,
      ellipsis,
    };
  });

  if (props.isShowIndex) {
    columnsList.unshift({
      title: "序号",
      key: "index",
      width: 60,
      fixed: "left",
      render: (row: any, index: number) => {
        return index + 1;
      },
    });
  }
  if (props.isMultiple) {
    columnsList.unshift({
      type: "selection",
      width: 60,
      fixed: "left",
    });
  }
  if (columnsBtnsWidthConfig.value.result?.length == 0) return columnsList;
  const columnsBtns = columnsBtnsWidthConfig.value.result;
  const btnsRender = (row: Record<string, any>, index: any) => {
    const btnList: any = columnsBtns?.filter((btn: any) => {
      if (btn.isBtnHide) return btn.isBtnHide(row);
      return true;
    });
    let startBtn = btnList;
    let endBtn: any = [];
    if (btnList && btnList?.length > 3) {
      startBtn = btnList.splice(0, 3);
      endBtn = btnList;
    }
    const allBtnList = (startBtn || []).map((item: tableBtnsTypes) => {
      if (item.render) return item.render?.(row, item);
      if (item.btnName.includes("删除") || item.isDialog)
        return delBtnRender(row, item, index);
      return othetBtnRender(row, item, false, null, index);
    });
    if (endBtn.length > 0) {
      allBtnList.push(
        h(
          NPopover,
          {},
          {
            trigger: () =>
              h(
                "span",
                {
                  style: {
                    fontSize: "14px",
                    marginLeft: "4px",
                    position: "relative",
                    top: "-4px",
                    cursor: "pointer",
                  },
                },
                { default: () => "..." }
              ),
            default: () =>
              h(
                NSpace,
                { padding: "28px 20px" },
                endBtn?.map((item: tableBtnsTypes) => {
                  if (item.btnName.includes("删除"))
                    return delBtnRender(row, item, index);
                  return othetBtnRender(row, item, false, null, index);
                })
              ),
          }
        )
      );
    }
    return allBtnList;
  };
  columnsList.push({
    title: "操作",
    key: "btns",
    align: "center",
    fixed: "right",
    width: columnsBtnsWidthConfig.value.widthNum,
    render(row: any, index: any) {
      return btnsRender(row, index);
    },
  });
  return columnsList;
});
// 权限后按钮部分动态宽度以及是否显示操作栏
const columnsBtnsWidthConfig = computed(() => {
  const allPermission = userRights || [];
  const columnsBtns = props.tableBtns || [];
  const result = columnsBtns?.filter((item: tableBtnsTypes) => {
    if (item.permission)
      return allPermission.includes(item.permission) || allPermission.includes("*:*:*");
    // 如果没有设置权限标识 默认展示该按钮
    return item;
  });
  let resultArr: any = JSON.parse(JSON.stringify(result));
  if (result.length > 2) resultArr = JSON.parse(JSON.stringify(result)).splice(0, 3);
  const length = (resultArr || []).map((item: any) => item.btnName).join("").length;
  // 系数24：14px字体 + 按钮padding(约4px*2) + 按钮间距(约2px)，确保4字按钮不换行
  let widthNum: number = length * 26 + 16;
  return {
    widthNum,
    result,
  };
});
// 拼接表格整体宽度
const columnsWidth = computed(() => {
  let width = 0;
  columnsTable.value.forEach((item: any) => {
    width += item.width || 0;
  });
  return width > 856 ? width : 856;
});
// 是否展示分页
const showPagination = computed(() => {
  const { isShowPagination, paginationConfig } = props;
  if (!isShowPagination) return isShowPagination;
  if (paginationConfig?.pagConfig) return !(paginationConfig.pagConfig.total === 0);
  return false;
});

function rowKey(row: any) {
  return row.id;
}
</script>
<style scoped lang="less">
.web-data-table {
  height: 100%;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.web-n-data-table-con {
  height: 100%;
  background-color: #fff;
  display: flex;
  flex-direction: column;
  flex: 1;
  border-radius: 8px;
}

.web-n-data-table {
  margin-bottom: calc(var(--base-width) / 2);
  flex: 1;
}

.header-tip-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #faad14;
  flex-shrink: 0;
  vertical-align: middle;

  &:hover {
    color: #ffc53d;
  }
}

.tip-content {
  font-size: 13px;
  line-height: 1.6;

  div {
    white-space: nowrap;
  }
}
</style>

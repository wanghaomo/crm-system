/* =========================================================
   api.js — 异步服务层（当前返回 mock，签名对齐未来真实接口）
   ========================================================= */

const Api = (function () {
    'use strict';

    const CACHE = { model: null };

    function delay(ms) {
        return new Promise(function (resolve) {
            setTimeout(resolve, ms);
        });
    }

    function getModel() {
        if (!CACHE.model) {
            CACHE.model = Calc.build();
        }
        return CACHE.model;
    }

    /**
     * GET /api/v1/supply/summary
     * 返回供方矿山、需方企业与总量指标
     */
    async function fetchModel() {
        await delay(280);
        // TODO: 替换为 fetch('/api/v1/supply/summary')，返回结构保持一致
        return getModel();
    }

    /**
     * GET /api/v1/match/matrix?dimension=city|enterprise
     * 返回矿种 × 客户匹配矩阵
     */
    async function fetchMatrix(dimension) {
        await delay(160);
        // TODO: 替换为 fetch('/api/v1/match/matrix?dimension=' + dimension)
        const model = getModel();
        return { dimension: dimension, matrix: model.matrix[dimension] };
    }

    /**
     * GET /api/v1/logistics/flows
     * 返回矿点城市 → 客户城市的年流量
     */
    async function fetchFlows() {
        await delay(160);
        // TODO: 替换为 fetch('/api/v1/logistics/flows')
        return getModel().flows;
    }

    return {
        fetchModel: fetchModel,
        fetchMatrix: fetchMatrix,
        fetchFlows: fetchFlows
    };
})();

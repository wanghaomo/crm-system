/* =========================================================
   calc.js — 供需匹配模型
   规则：矿种必须一致 → 品位优先 → 到厂成本次之 → 按需求量贪心分配
   ========================================================= */

const Calc = (function () {
    'use strict';

    const RAIL_DEST = { '襄阳': '铁路' };
    const COST_BASE = 80;
    const COST_FACTOR = 0.35;
    const COST_CAP = 30;
    const GRADE_CAP = 55;
    const SHORTAGE_PENALTY = 12;

    /**
     * 计算某矿点城市到某客户城市的物流方案
     * @param {string} origin 矿点城市
     * @param {string} dest 客户城市
     * @returns {{km:number, cost:number, mode:string}}
     */
    function lane(origin, dest) {
        const originLane = ORIGIN_LANES[origin] || { hub: '宜宾', preKm: 300, preMode: '公路' };
        const hub = originLane.hub;
        const hubKm = (HUB_TO_DEST[hub] && HUB_TO_DEST[hub][dest]) || 1000;
        const mainMode = RAIL_DEST[dest] || HUB_MODE[hub];
        const mainRate = FREIGHT_RATE[mainMode];
        const preCost = originLane.preKm * FREIGHT_RATE['公路'];
        const cost = preCost + hubKm * mainRate;
        const mode = originLane.preKm > 0 ? originLane.preMode + ' + ' + mainMode : mainMode;

        return {
            km: originLane.preKm + hubKm,
            cost: Math.round(cost),
            mode: mode
        };
    }

    /**
     * 综合匹配度：品位满足度 + 到厂成本 + 矿种供给富余度
     */
    function scoreOf(grade, minGrade, cost, shortage) {
        let gradePen = 0;
        if (grade < minGrade) {
            gradePen = Math.min(GRADE_CAP, 20 + ((minGrade - grade) / minGrade) * 300);
        }
        const costPen = Math.min(COST_CAP, Math.max(0, (cost - COST_BASE) * COST_FACTOR));
        const supplyPen = shortage ? SHORTAGE_PENALTY : 0;
        return Math.max(5, Math.min(100, Math.round(100 - gradePen - costPen - supplyPen)));
    }

    function sumBy(list, key) {
        return list.reduce(function (acc, item) {
            return acc + item[key];
        }, 0);
    }

    /**
     * 构建完整供需模型
     * @returns {object} 包含总量、矿种、矿山、需求、匹配链路、矩阵、流向
     */
    function build() {
        const mines = MINES.map(function (m) {
            return Object.assign({}, m, { matched: 0, stranded: 0 });
        });
        const demands = DEMANDS.map(function (d) {
            return Object.assign({}, d, { matched: 0, unmet: 0 });
        });
        const links = [];
        const mineralKeys = Object.keys(MINERALS).filter(function (k) {
            return k !== 'other';
        });

        mineralKeys.forEach(function (mk) {
            const pool = mines.filter(function (m) {
                return m.mineral === mk && m.available > 0;
            }).sort(function (a, b) {
                return b.grade - a.grade;
            });

            const rows = demands.filter(function (d) {
                return d.mineral === mk;
            }).sort(function (a, b) {
                if (b.minGrade !== a.minGrade) {
                    return b.minGrade - a.minGrade;
                }
                return b.qty - a.qty;
            });

            const totalSupply = sumBy(pool, 'available');
            const totalDemand = sumBy(rows, 'qty');
            const shortage = totalSupply < totalDemand;

            rows.forEach(function (row) {
                const ent = ENTERPRISES.find(function (e) {
                    return e.id === row.enterpriseId;
                });
                let need = row.qty;

                pool.forEach(function (mine) {
                    if (need <= 0) {
                        return;
                    }
                    const left = mine.available - mine.matched;
                    if (left <= 0) {
                        return;
                    }
                    const qty = Math.min(need, left);
                    const route = lane(mine.city, ent.city);
                    const score = scoreOf(mine.grade, row.minGrade, route.cost, shortage);

                    links.push({
                        mineId: mine.id,
                        mineName: mine.name,
                        origin: mine.city,
                        entId: ent.id,
                        entName: ent.name,
                        dest: ent.city,
                        mineral: mk,
                        qty: Math.round(qty),
                        grade: mine.grade,
                        minGrade: row.minGrade,
                        degraded: mine.grade < row.minGrade,
                        km: route.km,
                        mode: route.mode,
                        cost: route.cost,
                        score: score
                    });

                    mine.matched += qty;
                    row.matched += qty;
                    need -= qty;
                });

                row.unmet = Math.max(0, Math.round(row.qty - row.matched));
            });
        });

        mines.forEach(function (m) {
            m.matched = Math.round(m.matched);
            m.stranded = Math.max(0, Math.round(m.available - m.matched));
            m.share = m.output ? m.matched / m.output : 0;
        });

        demands.forEach(function (d) {
            d.matched = Math.round(d.matched);
            d.unmet = Math.max(0, Math.round(d.qty - d.matched));
            d.fillRate = d.qty ? d.matched / d.qty : 0;
        });

        const matrix = buildMatrix(demands, links);
        const flows = buildFlows(links);
        const minerals = Object.keys(MINERALS).map(function (mk) {
            const pool = MINES.filter(function (m) {
                return m.mineral === mk;
            });
            const rows = DEMANDS.filter(function (d) {
                return d.mineral === mk;
            });
            const available = sumBy(pool, 'available');
            const demand = sumBy(rows, 'qty');
            const matched = sumBy(links.filter(function (l) {
                return l.mineral === mk;
            }), 'qty');
            return {
                key: mk,
                name: MINERALS[mk].name,
                indicator: MINERALS[mk].indicator,
                unit: MINERALS[mk].unit,
                color: MINERALS[mk].color,
                available: available,
                output: sumBy(pool, 'output'),
                demand: demand,
                matched: matched,
                unmet: Math.max(0, demand - matched),
                stranded: Math.max(0, available - matched)
            };
        });

        const industry = {};
        ENTERPRISES.forEach(function (ent) {
            const total = sumBy(DEMANDS.filter(function (d) {
                return d.enterpriseId === ent.id;
            }), 'qty');
            industry[ent.industry] = (industry[ent.industry] || 0) + total;
        });

        const output = sumBy(MINES, 'output');
        const available = sumBy(MINES, 'available');
        const demand = sumBy(DEMANDS, 'qty');
        const matched = sumBy(links, 'qty');
        const chemDemand = (industry['磷化工'] || 0) + (industry['煤化工'] || 0) + (industry['石化'] || 0);

        return {
            mines: mines,
            demands: demands,
            links: links,
            minerals: minerals,
            matrix: matrix,
            flows: flows,
            industry: industry,
            totals: {
                output: output,
                localUse: output - available,
                available: available,
                demand: demand,
                matched: matched,
                unmet: Math.max(0, demand - matched),
                stranded: Math.max(0, available - matched),
                matchRate: demand ? matched / demand : 0,
                chemDemand: chemDemand,
                nonChemDemand: demand - chemDemand,
                ratio: demand ? available / demand : 0
            }
        };
    }

    /**
     * 生成矩阵：city 维度与 ent 维度两套
     */
    function buildMatrix(demands, links) {
        const matrix = { city: {}, ent: {} };
        const mineralKeys = Object.keys(MINERALS).filter(function (k) {
            return k !== 'other';
        });

        mineralKeys.forEach(function (mk) {
            matrix.city[mk] = {};
            matrix.ent[mk] = {};
        });

        demands.forEach(function (row) {
            const cityCells = matrix.city[row.mineral];
            const entCells = matrix.ent[row.mineral];

            if (!cityCells[row.city]) {
                cityCells[row.city] = { qty: 0, demand: 0, score: 0, degraded: false, links: [] };
            }
            if (!entCells[row.enterpriseId]) {
                entCells[row.enterpriseId] = { qty: 0, demand: 0, score: 0, degraded: false, links: [] };
            }

            cityCells[row.city].demand += row.qty;
            entCells[row.enterpriseId].demand += row.qty;
        });

        links.forEach(function (link) {
            [matrix.city[link.mineral][link.dest], matrix.ent[link.mineral][link.entId]].forEach(function (cell) {
                if (!cell) {
                    return;
                }
                cell.qty += link.qty;
                cell.links.push(link);
                cell.degraded = cell.degraded || link.degraded;
            });
        });

        Object.keys(matrix).forEach(function (mode) {
            Object.keys(matrix[mode]).forEach(function (mk) {
                Object.keys(matrix[mode][mk]).forEach(function (key) {
                    const cell = matrix[mode][mk][key];
                    const weight = cell.links.reduce(function (s, l) {
                        return s + l.qty;
                    }, 0);
                    cell.score = weight ? Math.round(cell.links.reduce(function (s, l) {
                        return s + l.score * l.qty;
                    }, 0) / weight) : 0;
                    cell.qty = Math.round(cell.qty);
                    cell.demand = Math.round(cell.demand);
                });
            });
        });

        return matrix;
    }

    /**
     * 汇总矿点城市 → 客户城市的流量
     */
    function buildFlows(links) {
        const map = {};
        links.forEach(function (link) {
            const key = link.origin + '|' + link.dest;
            if (!map[key]) {
                map[key] = {
                    origin: link.origin,
                    dest: link.dest,
                    qty: 0,
                    km: link.km,
                    cost: link.cost,
                    mode: link.mode,
                    minerals: {}
                };
            }
            map[key].qty += link.qty;
            map[key].minerals[link.mineral] = (map[key].minerals[link.mineral] || 0) + link.qty;
        });

        return Object.keys(map).map(function (key) {
            return map[key];
        }).sort(function (a, b) {
            return b.qty - a.qty;
        });
    }

    return {
        build: build,
        lane: lane,
        scoreOf: scoreOf
    };
})();

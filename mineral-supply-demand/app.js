/* =========================================================
   app.js — 视图渲染、状态管理与交互
   ========================================================= */

const App = (function () {
    'use strict';

    const CITIES = ['宜昌', '武汉', '襄阳', '黄石', '荆门', '鄂州'];
    const INDUSTRIES = ['磷化工', '煤化工', '石化', '冶金化工', '有色冶炼', '钢铁', '钛化工'];
    const DEMAND_MINERALS = ['phosphate', 'coal', 'copper', 'leadzinc', 'vanadium'];
    const SRC_CITIES = ['攀枝花', '凉山州', '乐山', '宜宾', '泸州', '达州'];
    const VIEW_TITLES = {
        overview: '供需总览',
        supply: '矿山供给',
        demand: '客户需求',
        matrix: '匹配矩阵',
        flow: '通道流向'
    };

    const ICONS = {
        mountain: '<path d="m8 3 4 8 5-5 5 15H2L8 3z"/>',
        factory: '<path d="M2 20h20"/><path d="M4 20V9l6 3V9l6 3V4h4v16"/>',
        link: '<path d="M10 13a5 5 0 0 0 7.1 0l3-3a5 5 0 0 0-7.1-7.1L11 5"/><path d="M14 11a5 5 0 0 0-7.1 0l-3 3a5 5 0 0 0 7.1 7.1L13 19"/>',
        alert: '<path d="m12 3 9 16H3L12 3z"/><path d="M12 9v4"/><path d="M12 16h.01"/>'
    };

    const state = {
        view: 'overview',
        supplyMineral: 'all',
        supplySort: 'available',
        supplyDir: 'desc',
        demandCity: 'all',
        demandIndustry: 'all',
        demandSort: 'demand',
        demandDir: 'desc',
        matrixMode: 'city',
        model: null
    };

    /* ---------------- 工具 ---------------- */
    function el(id) {
        return document.getElementById(id);
    }

    function all(sel) {
        return Array.prototype.slice.call(document.querySelectorAll(sel));
    }

    function fmt(n) {
        return Number(n).toLocaleString('zh-CN');
    }

    function pct(x, digits) {
        return (x * 100).toFixed(digits === undefined ? 0 : digits) + '%';
    }

    function esc(text) {
        return String(text).replace(/[&<>"]/g, function (ch) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch];
        });
    }

    function rgba(hex, alpha) {
        const n = parseInt(hex.slice(1), 16);
        return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + alpha + ')';
    }

    function icon(name, cls) {
        return '<svg class="ico ' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
            'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + ICONS[name] + '</svg>';
    }

    function scoreColor(score) {
        if (score >= 85) {
            return '#58B08C';
        }
        if (score >= 70) {
            return '#7FAE74';
        }
        if (score >= 55) {
            return '#C98A3E';
        }
        return '#C4624F';
    }

    let toastTimer = null;

    function toast(text) {
        const node = el('toast');
        node.textContent = text;
        node.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () {
            node.classList.remove('show');
        }, 2000);
    }

    function weightedScore(links) {
        const weight = links.reduce(function (s, l) {
            return s + l.qty;
        }, 0);
        if (!weight) {
            return 0;
        }
        return Math.round(links.reduce(function (s, l) {
            return s + l.score * l.qty;
        }, 0) / weight);
    }

    function sum(list, fn) {
        return list.reduce(function (acc, item) {
            return acc + fn(item);
        }, 0);
    }

    /* ---------------- 路由 ---------------- */
    function setView(view) {
        if (!VIEW_TITLES[view]) {
            view = 'overview';
        }
        state.view = view;
        document.body.setAttribute('data-page', view);
        all('.view').forEach(function (node) {
            node.classList.toggle('active', node.getAttribute('data-view') === view);
        });
        all('.nav-item').forEach(function (link) {
            link.classList.toggle('active', link.getAttribute('data-view') === view);
        });
        el('crumbPage').textContent = VIEW_TITLES[view];
        window.scrollTo(0, 0);
    }

    function route() {
        const hash = window.location.hash.replace('#/', '');
        setView(hash || 'overview');
    }

    /* ---------------- 总览 ---------------- */
    function renderOverview() {
        const t = state.model.totals;
        const copper = state.model.minerals.filter(function (m) {
            return m.key === 'copper';
        })[0];

        const kpis = [
            {
                cls: 'is-supply',
                label: '川内可外调量',
                icon: 'mountain',
                value: fmt(t.available),
                unit: '万吨/年',
                sub: '原矿 ' + fmt(t.output) + ' · 本地消耗 ' + fmt(t.localUse),
                bar: t.available / t.output,
                color: '#58B08C'
            },
            {
                cls: 'is-demand',
                label: '湖北客户需求',
                icon: 'factory',
                value: fmt(t.demand),
                unit: '万吨/年',
                sub: '6 个重点市 · 23 家企业 · 28 条需求',
                bar: 1,
                color: '#D98245'
            },
            {
                cls: 'is-match',
                label: '有效匹配量',
                icon: 'link',
                value: fmt(t.matched),
                unit: '万吨/年',
                sub: '匹配率 ' + pct(t.matchRate, 1) + ' · 覆盖 ' + pct(t.matched / t.available, 0) + ' 可外调量',
                bar: t.matched / t.available,
                color: '#E9EEE9'
            },
            {
                cls: 'is-gap',
                label: '硬缺口',
                icon: 'alert',
                value: fmt(t.unmet),
                unit: '万吨/年',
                sub: '铜精矿 ' + fmt(copper.unmet) + ' 万吨 · 缺口率 ' + pct(copper.unmet / copper.demand, 0),
                bar: t.unmet / t.demand,
                color: '#C4624F'
            }
        ];

        el('kpiGrid').innerHTML = kpis.map(function (k) {
            return '<div class="kpi ' + k.cls + '">' +
                '<div class="kpi-label">' + icon(k.icon) + esc(k.label) + '</div>' +
                '<div class="kpi-value">' + k.value + '<small>' + k.unit + '</small></div>' +
                '<div class="kpi-sub">' + esc(k.sub) + '</div>' +
                '<div class="kpi-bar"><i style="width:' + (k.bar * 100).toFixed(1) + '%;background:' + k.color + '"></i></div>' +
                '</div>';
        }).join('');

        renderBalance();
        renderInsights();
        renderGapList();
        renderFlowSvg(el('overviewFlow'), true);
    }

    function renderBalance() {
        const minerals = state.model.minerals.filter(function (m) {
            return DEMAND_MINERALS.indexOf(m.key) >= 0;
        });
        const scale = Math.max.apply(null, minerals.map(function (m) {
            return Math.max(m.available, m.demand);
        }));

        const rows = minerals.map(function (m) {
            return '<div class="balance-row">' +
                '<div class="balance-name">' + esc(m.name) + '<em>' + esc(m.indicator) + '</em></div>' +
                '<div class="balance-track balance-track-supply"><i style="width:' + (m.available / scale * 100).toFixed(1) + '%"></i></div>' +
                '<span class="balance-val supply">' + fmt(m.available) + '</span>' +
                '<span class="balance-val demand">' + fmt(m.demand) + '</span>' +
                '<div class="balance-track balance-track-demand"><i style="width:' + (m.demand / scale * 100).toFixed(1) + '%"></i></div>' +
                '</div>';
        }).join('');

        el('balanceList').innerHTML = rows +
            '<div class="balance-gap">' +
            '<span>仅看有需求的 5 个矿种 · 合计富余 <b>' + fmt(sum(minerals, function (m) { return m.stranded; })) + '</b> 万吨</span>' +
            '<span>硬缺口 <b style="color:#C4624F">' + fmt(state.model.totals.unmet) + '</b> 万吨</span>' +
            '</div>';
    }

    function renderInsights() {
        const byKey = {};
        state.model.minerals.forEach(function (m) {
            byKey[m.key] = m;
        });
        const copper = byKey.copper;
        const phosphate = byKey.phosphate;
        const coal = byKey.coal;
        const coalCap = state.model.mines.filter(function (m) {
            return m.mineral === 'coal' && m.grade >= 5800;
        }).reduce(function (s, m) {
            return s + m.available;
        }, 0);
        const coalHighDemand = state.model.demands.filter(function (d) {
            return d.mineral === 'coal' && d.minGrade >= 5800;
        }).reduce(function (s, d) {
            return s + d.qty;
        }, 0);
        const orphan = byKey.rareearth.available + byKey.bauxite.available + byKey.other.available;

        const list = [
            {
                tone: 'critical',
                title: '铜精矿是唯一硬缺口',
                text: '湖北铜需求 ' + fmt(copper.demand) + ' 万吨，川内可外调仅 ' + fmt(copper.available) +
                    ' 万吨，覆盖率 <span class="insight-num">' + pct(copper.available / copper.demand, 0) +
                    '</span>，缺口 ' + fmt(copper.unmet) + ' 万吨需由江西、云南或进口补充。'
            },
            {
                tone: 'good',
                title: '磷矿总量平衡，但品位错配',
                text: '可外调 ' + fmt(phosphate.available) + ' 万吨对需求 ' + fmt(phosphate.demand) +
                    ' 万吨，富余 <span class="insight-num">' + fmt(phosphate.stranded) +
                    '</span> 万吨。乐山 30.1% 高品位矿可直供宜昌磷铵装置，24.5% 低品位矿只能降级配矿。'
            },
            {
                tone: '',
                title: '煤炭富余，但高卡煤仍紧',
                text: '可外调 ' + fmt(coal.available) + ' 万吨对需求 ' + fmt(coal.demand) + ' 万吨；' +
                    '5,800 kcal 以上仅 <span class="insight-num">' + fmt(coalCap) +
                    '</span> 万吨，而武钢焦化与鄂钢合计需 <span class="insight-num">' + fmt(coalHighDemand) +
                    '</span> 万吨，已接近上限。'
            },
            {
                tone: 'critical',
                title: '供给有 1,700 万吨无对口需求',
                text: '稀土、铝土矿与其他矿种合计 <span class="insight-num">' + fmt(orphan) +
                    '</span> 万吨在湖北没有对应装置，需转向江西、湖南或出口市场。'
            }
        ];

        el('insightList').innerHTML = list.map(function (item) {
            return '<div class="insight ' + item.tone + '">' +
                '<span class="insight-mark"></span>' +
                '<div class="insight-body">' +
                '<div class="insight-title">' + item.title + '</div>' +
                '<div class="insight-text">' + item.text + '</div>' +
                '</div></div>';
        }).join('');
        el('insightHint').textContent = list.length + ' 条';
    }

    function renderGapList() {
        el('gapList').innerHTML = DATA_GAPS.map(function (text, index) {
            return '<li><span class="gap-idx">0' + (index + 1) + '</span><span>' + esc(text) + '</span></li>';
        }).join('');
    }

    /* ---------------- 供给 ---------------- */
    function renderSupplyFilters() {
        const counts = {};
        state.model.mines.forEach(function (m) {
            counts[m.mineral] = (counts[m.mineral] || 0) + 1;
        });
        const keys = ['all'].concat(Object.keys(counts));
        el('supplyFilters').innerHTML = keys.map(function (key) {
            const label = key === 'all' ? '全部' : MINERALS[key].name;
            const n = key === 'all' ? state.model.mines.length : counts[key];
            return '<button type="button" class="chip ' + (state.supplyMineral === key ? 'active' : '') +
                '" data-mineral="' + key + '">' + esc(label) + '<span class="count">' + n + '</span></button>';
        }).join('');
    }

    function renderSupply() {
        let rows = state.model.mines.filter(function (m) {
            return state.supplyMineral === 'all' || m.mineral === state.supplyMineral;
        });

        rows = rows.slice().sort(function (a, b) {
            const dir = state.supplyDir === 'asc' ? 1 : -1;
            return (a[state.supplySort] - b[state.supplySort]) * dir;
        });

        el('supplyTable').innerHTML = rows.map(function (m) {
            const mineral = MINERALS[m.mineral];
            const share = m.output ? m.available / m.output : 0;
            const gradeText = m.mineral === 'other' ? '综合' : m.grade.toFixed(1) + (m.mineral === 'coal' ? ' kcal' : ' ' + mineral.unit);
            return '<tr data-mine="' + m.id + '">' +
                '<td><span class="strong">' + esc(m.name) + '</span><span class="muted"> · ' + esc(m.owner) + '</span></td>' +
                '<td>' + esc(m.city) + '</td>' +
                '<td><span class="mineral-dot" style="background:' + mineral.color + '"></span>' + esc(mineral.name) + '</td>' +
                '<td class="num">' + gradeText + '</td>' +
                '<td class="num">' + fmt(m.output) + '</td>' +
                '<td class="num">' + fmt(m.localUse) + '</td>' +
                '<td class="num"><span class="strong" style="color:#58B08C">' + fmt(m.available) + '</span></td>' +
                '<td><div class="row-bar"><span class="row-track"><i style="width:' + (share * 100).toFixed(0) + '%"></i></span>' +
                '<span class="muted">' + pct(share, 0) + '</span></div></td>' +
                '</tr>';
        }).join('');

        if (!rows.length) {
            el('supplyTable').innerHTML = '<tr><td colspan="8"><div class="empty-state">' + icon('mountain') +
                '<div>该矿种下暂无矿山</div></div></td></tr>';
        }

        const total = function (list, key) {
            return list.reduce(function (s, m) {
                return s + m[key];
            }, 0);
        };
        el('supplyFoot').innerHTML =
            '<span>' + rows.length + ' / ' + state.model.mines.length + ' 个矿山</span>' +
            '<span>产量 ' + fmt(total(rows, 'output')) + ' · 本地消耗 ' + fmt(total(rows, 'localUse')) +
            ' · 可外调 ' + fmt(total(rows, 'available')) + ' 万吨/年</span>';
        el('supplyMeta').textContent = '可外调 ' + fmt(state.model.totals.available) + ' 万吨';
    }

    /* ---------------- 需求 ---------------- */
    function renderDemandFilters() {
        const cityChips = ['all'].concat(CITIES).map(function (key) {
            const label = key === 'all' ? '全部城市' : key;
            return '<button type="button" class="chip ' + (state.demandCity === key ? 'active' : '') +
                '" data-city="' + key + '">' + label + '</button>';
        }).join('');

        const industryChips = ['all'].concat(INDUSTRIES).map(function (key) {
            const label = key === 'all' ? '全部行业' : key;
            return '<button type="button" class="chip ' + (state.demandIndustry === key ? 'active' : '') +
                '" data-industry="' + key + '">' + label + '</button>';
        }).join('');

        el('demandFilters').innerHTML = cityChips + '<span class="filters-sep"></span>' + industryChips;
    }

    function renderDemand() {
        let rows = state.model.demands.filter(function (d) {
            const ent = ENTERPRISES.filter(function (e) {
                return e.id === d.enterpriseId;
            })[0];
            const cityOK = state.demandCity === 'all' || d.city === state.demandCity;
            const industryOK = state.demandIndustry === 'all' || ent.industry === state.demandIndustry;
            return cityOK && industryOK;
        });

        rows = rows.slice().sort(function (a, b) {
            const dir = state.demandDir === 'asc' ? 1 : -1;
            return (a[state.demandSort] - b[state.demandSort]) * dir;
        });

        el('demandTable').innerHTML = rows.map(function (d) {
            const ent = ENTERPRISES.filter(function (e) {
                return e.id === d.enterpriseId;
            })[0];
            const mineral = MINERALS[d.mineral];
            const gradeText = d.mineral === 'coal' ? '≥' + fmt(d.minGrade) + ' kcal' : '≥' + d.minGrade + mineral.unit;
            return '<tr data-ent="' + ent.id + '">' +
                '<td><span class="strong">' + esc(ent.name) + '</span></td>' +
                '<td>' + esc(ent.city) + '</td>' +
                '<td><span class="muted">' + esc(ent.industry) + '</span></td>' +
                '<td><span class="mineral-dot" style="background:' + mineral.color + '"></span>' + esc(mineral.name) + '</td>' +
                '<td><span class="muted">' + esc(ent.plant) + '</span></td>' +
                '<td class="num">' + fmt(d.qty) + '</td>' +
                '<td class="num">' + gradeText + '</td>' +
                '<td class="num"><span class="row-bar"><span class="row-track demand"><i style="width:' +
                (d.fillRate * 100).toFixed(0) + '%"></i></span><span class="strong" style="color:#D98245">' +
                fmt(d.matched) + '</span></span></td>' +
                '<td class="num">' + (d.unmet ? '<span style="color:#C4624F">' + fmt(d.unmet) + '</span>' : '<span class="muted">—</span>') + '</td>' +
                '</tr>';
        }).join('');

        if (!rows.length) {
            el('demandTable').innerHTML = '<tr><td colspan="9"><div class="empty-state">' + icon('factory') +
                '<div>当前筛选条件下暂无需求</div></div></td></tr>';
        }

        el('demandFoot').innerHTML =
            '<span>' + rows.length + ' 条装置需求</span>' +
            '<span>需求 ' + fmt(sum(rows, function (d) { return d.qty; })) +
            ' · 已匹配 ' + fmt(sum(rows, function (d) { return d.matched; })) +
            ' · 缺口 ' + fmt(sum(rows, function (d) { return d.unmet; })) + ' 万吨/年</span>';
        el('demandMeta').textContent = '需求 ' + fmt(state.model.totals.demand) + ' 万吨';
    }

    /* ---------------- 矩阵 ---------------- */
    function entColumns() {
        const totals = ENTERPRISES.map(function (ent) {
            return {
                id: ent.id,
                name: ent.name,
                total: sum(ent.demand, function (d) { return d[1]; })
            };
        }).sort(function (a, b) {
            return b.total - a.total;
        });

        const top = totals.slice(0, 12);
        const rest = totals.slice(12);
        const columns = top.map(function (e) {
            return { key: e.id, label: e.name, demand: e.total };
        });

        if (rest.length) {
            columns.push({
                key: '__other__',
                label: '其他 ' + rest.length + ' 家',
                short: '其他',
                demand: sum(rest, function (e) { return e.total; }),
                ids: rest.map(function (e) { return e.id; })
            });
        }
        return columns;
    }

    function getColumns(mode) {
        if (mode === 'city') {
            return CITIES.map(function (city) {
                return {
                    key: city,
                    label: city,
                    short: city,
                    demand: sum(state.model.demands.filter(function (d) {
                        return d.city === city;
                    }), function (d) { return d.qty; })
                };
            });
        }
        return entColumns();
    }

    function resolveCell(mode, mineral, col) {
        if (mode === 'city') {
            return state.model.matrix.city[mineral][col.key] || null;
        }
        if (col.key !== '__other__') {
            return state.model.matrix.ent[mineral][col.key] || null;
        }

        const agg = { qty: 0, demand: 0, score: 0, degraded: false, links: [] };
        col.ids.forEach(function (id) {
            const cell = state.model.matrix.ent[mineral][id];
            if (!cell) {
                return;
            }
            agg.qty += cell.qty;
            agg.demand += cell.demand;
            agg.degraded = agg.degraded || cell.degraded;
            agg.links = agg.links.concat(cell.links);
        });
        agg.score = weightedScore(agg.links);
        return agg.demand ? agg : null;
    }

    function renderMatrix() {
        const mode = state.matrixMode;
        const columns = getColumns(mode);
        const rows = DEMAND_MINERALS;

        let html = '<div class="m-corner">矿种 / 客户</div>';
        columns.forEach(function (col) {
            html += '<div class="m-col-head" data-col="' + col.key + '" title="' + esc(col.label) + '">' +
                esc(col.short || col.label) + '</div>';
        });

        rows.forEach(function (mk) {
            const mineral = MINERALS[mk];
            html += '<div class="m-row-head"><span class="mineral-dot" style="background:' + mineral.color + '"></span>' +
                esc(mineral.name) + '</div>';

            columns.forEach(function (col) {
                const cell = resolveCell(mode, mk, col);
                if (!cell || (!cell.demand && !cell.qty)) {
                    html += '<div class="m-cell empty">—</div>';
                    return;
                }
                if (!cell.qty) {
                    html += '<div class="m-cell" data-mineral="' + mk + '" data-col="' + col.key + '"' +
                        ' style="background:rgba(196,98,79,0.12);border-color:rgba(196,98,79,0.38);color:#C4624F"' +
                        ' title="' + esc(mineral.name + ' → ' + col.label + '：缺口 ' + fmt(cell.demand) + ' 万吨') + '">' +
                        '<span class="m-val">缺</span></div>';
                    return;
                }
                const color = scoreColor(cell.score);
                const alpha = 0.10 + (cell.score / 100) * 0.30;
                html += '<div class="m-cell" data-mineral="' + mk + '" data-col="' + col.key + '"' +
                    ' style="background:' + rgba(color, alpha.toFixed(2)) + ';border-color:' + rgba(color, 0.42) + '"' +
                    ' title="' + esc(mineral.name + ' → ' + col.label + '：' + fmt(cell.qty) + ' 万吨，匹配度 ' + cell.score) + '">' +
                    '<span class="m-val">' + fmt(cell.qty) + '</span>' +
                    (cell.degraded ? '<i class="m-dot" style="background:#C4624F"></i>' : '') +
                    '</div>';
            });
        });

        const grid = el('matrixGrid');
        grid.className = 'matrix' + (mode === 'ent' ? ' is-ent' : '');
        grid.style.gridTemplateColumns = '128px repeat(' + columns.length + ', minmax(' + (mode === 'ent' ? '54px' : '76px') + ', 1fr))';
        grid.innerHTML = html;

        el('matrixTitle').textContent = mode === 'city' ? '按城市汇总' : '按企业明细（TOP 12 + 其他）';
        el('matrixFoot').innerHTML =
            '<span>已匹配 ' + fmt(state.model.totals.matched) + ' / 需求 ' + fmt(state.model.totals.demand) + ' 万吨</span>' +
            '<span>匹配率 ' + pct(state.model.totals.matchRate, 1) + ' · 点击单元格查看拼盘来源</span>';

        renderStranded();
        renderMatchRule();
    }

    function renderStranded() {
        const rows = state.model.minerals.filter(function (m) {
            return m.stranded > 0;
        });
        el('strandedList').innerHTML = rows.map(function (m) {
            return '<div class="stranded-row">' +
                '<span><span class="mineral-dot" style="background:' + m.color + '"></span>' + esc(m.name) + '</span>' +
                '<span class="track"><i style="width:' + Math.max(6, (m.stranded / m.available) * 100).toFixed(0) + '%"></i></span>' +
                '<span class="val">' + fmt(m.stranded) + '</span></div>';
        }).join('') +
            '<div class="balance-gap"><span>滞留合计</span><span><b>' + fmt(state.model.totals.stranded) + '</b> 万吨</span></div>';
    }

    function renderMatchRule() {
        el('matchRule').innerHTML =
            '<div class="rule-line">① 矿种必须一致，<code>磷矿</code> 不可替代 <code>煤炭</code></div>' +
            '<div class="rule-line">② 品位：低于客户要求时仍可配矿，但匹配度按缺口比例扣分</div>' +
            '<div class="rule-line">③ 物流：<code>吨运费 = 集港公路 + 干线（水运/铁路）</code></div>' +
            '<div class="rule-line">④ 分配：品位高者优先，按需求量贪心分配，矿量用尽为止</div>' +
            '<div class="rule-line">⑤ 匹配度 = 100 − 品位扣分 − 成本扣分 − 短缺扣分</div>';
    }

    /* ---------------- 流向 ---------------- */
    function renderFlow() {
        renderFlowSvg(el('flowCanvas'), false);

        el('laneTable').innerHTML = state.model.flows.map(function (f) {
            const minerals = Object.keys(f.minerals).map(function (k) {
                return MINERALS[k].name;
            }).join(' / ');
            const season = f.mode.indexOf('水运') >= 0 ? '<span style="color:#C98A3E">限载 −15%</span>' : '<span class="muted">正常</span>';
            return '<tr data-lane="' + f.origin + '|' + f.dest + '">' +
                '<td><span class="strong">' + esc(f.origin) + '</span><span class="muted"> → </span>' + esc(f.dest) + '</td>' +
                '<td>' + esc(f.mode) + '</td>' +
                '<td class="num">' + fmt(f.km) + ' km</td>' +
                '<td class="num">' + fmt(f.cost) + ' 元/吨</td>' +
                '<td>' + esc(minerals) + '</td>' +
                '<td class="num"><span class="strong" style="color:#58B08C">' + fmt(f.qty) + '</span></td>' +
                '<td>' + season + '</td>' +
                '</tr>';
        }).join('');
    }

    function renderFlowSvg(container, mini) {
        if (!container || !state.model) {
            return;
        }
        const flows = mini ? state.model.flows.slice(0, 7) : state.model.flows;
        const maxQty = Math.max.apply(null, flows.map(function (f) {
            return f.qty;
        }));

        const nodesVol = {};
        state.model.flows.forEach(function (f) {
            nodesVol[f.origin] = (nodesVol[f.origin] || 0) + f.qty;
            nodesVol[f.dest] = (nodesVol[f.dest] || 0) + f.qty;
        });

        const gradId = mini ? 'flowGradMini' : 'flowGradFull';
        const defs = '<defs><linearGradient id="' + gradId + '" x1="0" y1="0" x2="1" y2="0">' +
            '<stop offset="0" stop-color="#58B08C"/><stop offset="1" stop-color="#D98245"/></linearGradient></defs>';

        const paths = flows.map(function (f) {
            const a = CITY_LAYOUT[f.origin];
            const b = CITY_LAYOUT[f.dest];
            if (!a || !b) {
                return '';
            }
            const dx = b.x - a.x;
            const d = 'M' + a.x + ',' + a.y + ' C' + (a.x + dx * 0.42) + ',' + a.y + ' ' +
                (b.x - dx * 0.42) + ',' + b.y + ' ' + b.x + ',' + b.y;
            const width = 1.2 + (f.qty / maxQty) * (mini ? 5 : 12);
            return '<path class="flow-link" data-key="' + f.origin + '|' + f.dest + '" d="' + d + '"' +
                ' stroke="url(#' + gradId + ')" stroke-width="' + width.toFixed(1) + '"' +
                ' stroke-dasharray="6 8" opacity="' + (mini ? 0.8 : 0.88) + '">' +
                '<title>' + esc(f.origin + ' → ' + f.dest + '：' + fmt(f.qty) + ' 万吨/年，' + f.mode) + '</title></path>';
        }).join('');

        const nodes = Object.keys(CITY_LAYOUT).map(function (city) {
            const p = CITY_LAYOUT[city];
            const isSrc = SRC_CITIES.indexOf(city) >= 0;
            const color = isSrc ? '#58B08C' : '#D98245';
            const vol = nodesVol[city] || 0;
            const labelY = mini ? p.y - 9 : p.y - 11;
            return '<g class="flow-node">' +
                '<circle cx="' + p.x + '" cy="' + p.y + '" r="' + (isSrc ? 6 : 5) + '" fill="' + rgba(color, 0.24) + '" stroke="' + color + '" stroke-width="1.2"/>' +
                '<circle cx="' + p.x + '" cy="' + p.y + '" r="2" fill="' + color + '"/>' +
                '<text class="flow-node-label" x="' + p.x + '" y="' + labelY + '" text-anchor="middle">' + esc(city) + '</text>' +
                (mini ? '' : '<text class="flow-node-vol" x="' + p.x + '" y="' + (p.y + 18) + '" text-anchor="middle">' +
                    (vol ? fmt(vol) + ' 万吨' : '') + '</text>') +
                '</g>';
        }).join('');

        const regions = mini ? '' :
            '<text x="240" y="405" class="flow-node-vol" text-anchor="middle">四川 · 供给端</text>' +
            '<text x="790" y="405" class="flow-node-vol" text-anchor="middle">湖北 · 需求端</text>' +
            '<line x1="470" y1="60" x2="470" y2="380" stroke="#243029" stroke-width="1" stroke-dasharray="2 6"/>' +
            '<text x="470" y="50" class="flow-node-vol" text-anchor="middle">长江 / 铁路通道</text>';

        container.innerHTML = '<svg viewBox="0 0 1000 420" preserveAspectRatio="xMidYMid meet">' +
            defs + regions + paths + nodes + '</svg>';

        const svg = container.querySelector('svg');
        svg.querySelectorAll('.flow-link').forEach(function (path) {
            path.addEventListener('mouseenter', function () {
                svg.querySelectorAll('.flow-link').forEach(function (other) {
                    other.classList.add('dim');
                });
                path.classList.remove('dim');
                path.classList.add('hot');
            });
            path.addEventListener('mouseleave', function () {
                svg.querySelectorAll('.flow-link').forEach(function (other) {
                    other.classList.remove('dim', 'hot');
                });
            });
        });
    }

    function highlightLane(key) {
        const svg = el('flowCanvas').querySelector('svg');
        if (!svg) {
            return;
        }
        svg.querySelectorAll('.flow-link').forEach(function (path) {
            const match = path.getAttribute('data-key') === key;
            path.classList.toggle('hot', match);
            path.classList.toggle('dim', !match);
        });
        setTimeout(function () {
            svg.querySelectorAll('.flow-link').forEach(function (path) {
                path.classList.remove('dim', 'hot');
            });
        }, 2200);
    }

    /* ---------------- 抽屉 / 弹窗 ---------------- */
    function openDrawer(kicker, title, html) {
        el('drawerKicker').textContent = kicker;
        el('drawerTitle').textContent = title;
        el('drawerBody').innerHTML = html;
        el('drawer').classList.add('open');
        el('drawerBackdrop').classList.add('open');
    }

    function openModal(kicker, title, html) {
        el('modalKicker').textContent = kicker;
        el('modalTitle').textContent = title;
        el('modalBody').innerHTML = html;
        el('modal').classList.add('open');
        el('modalBackdrop').classList.add('open');
    }

    function closeOverlays() {
        el('drawer').classList.remove('open');
        el('drawerBackdrop').classList.remove('open');
        el('modal').classList.remove('open');
        el('modalBackdrop').classList.remove('open');
    }

    function detailGrid(items) {
        return '<div class="detail-grid">' + items.map(function (item) {
            return '<div class="detail-cell"><span class="k">' + esc(item[0]) + '</span>' +
                '<span class="v ' + (item[2] ? 'mono' : '') + '">' + item[1] + '</span></div>';
        }).join('') + '</div>';
    }

    function openMineDrawer(mineId) {
        const mine = state.model.mines.filter(function (m) {
            return m.id === mineId;
        })[0];
        if (!mine) {
            return;
        }
        const mineral = MINERALS[mine.mineral];
        const links = state.model.links.filter(function (l) {
            return l.mineId === mineId;
        });

        const table = links.length ?
            '<table class="mini-table"><thead><tr><th>客户</th><th>城市</th><th class="num">配比量</th>' +
            '<th class="num">运距</th><th>方式</th><th class="num">吨运费</th><th class="num">匹配度</th></tr></thead><tbody>' +
            links.map(function (l) {
                return '<tr><td>' + esc(l.entName) + '</td><td>' + esc(l.dest) + '</td>' +
                    '<td class="num">' + fmt(l.qty) + '</td><td class="num">' + fmt(l.km) + ' km</td>' +
                    '<td>' + esc(l.mode) + '</td><td class="num">' + fmt(l.cost) + ' 元</td>' +
                    '<td class="num">' + l.score + '</td></tr>';
            }).join('') + '</tbody></table>' :
            '<div class="note">该矿山当前没有匹配到湖北客户，可外调量全部滞留。</div>';

        openDrawer('矿山详情 / 供方', mine.name,
            detailGrid([
                ['所在市', mine.city],
                ['矿种', mineral.name],
                ['品位 / 指标', mine.mineral === 'other' ? '综合' : mine.grade.toFixed(1) + ' ' + mineral.unit, true],
                ['采矿权证号', mine.permit, true],
                ['年产（原矿）', fmt(mine.output) + ' 万吨', true],
                ['本地消耗', fmt(mine.localUse) + ' 万吨', true],
                ['可外调', fmt(mine.available) + ' 万吨', true],
                ['已匹配', fmt(mine.matched) + ' 万吨', true]
            ]) +
            '<div class="section-label">流向明细</div>' + table +
            '<div class="note">口径：可外调 = 年产量 − 本地消耗，未考虑集团内部调拨与季节性检修。</div>');
    }

    function openEntDrawer(entId) {
        const ent = ENTERPRISES.filter(function (e) {
            return e.id === entId;
        })[0];
        if (!ent) {
            return;
        }
        const rows = state.model.demands.filter(function (d) {
            return d.enterpriseId === entId;
        });
        const totalDemand = sum(rows, function (d) { return d.qty; });
        const totalMatched = sum(rows, function (d) { return d.matched; });

        const table = '<table class="mini-table"><thead><tr><th>矿种</th><th class="num">需求</th>' +
            '<th class="num">已匹配</th><th class="num">缺口</th><th>主要来源</th></tr></thead><tbody>' +
            rows.map(function (d) {
                const sources = state.model.links.filter(function (l) {
                    return l.entId === entId && l.mineral === d.mineral;
                }).sort(function (a, b) {
                    return b.qty - a.qty;
                }).slice(0, 2).map(function (l) {
                    return l.mineName;
                }).join('、');
                return '<tr><td>' + esc(MINERALS[d.mineral].name) + '</td>' +
                    '<td class="num">' + fmt(d.qty) + '</td>' +
                    '<td class="num">' + fmt(d.matched) + '</td>' +
                    '<td class="num">' + (d.unmet ? '<span style="color:#C4624F">' + fmt(d.unmet) + '</span>' : '—') + '</td>' +
                    '<td>' + esc(sources || '无货源') + '</td></tr>';
            }).join('') + '</tbody></table>';

        openDrawer('客户详情 / 需方', ent.name,
            detailGrid([
                ['城市', ent.city],
                ['行业', ent.industry],
                ['主要装置', ent.plant],
                ['装置产能', ent.capacity, true],
                ['矿耗单耗', ent.unitUse, true],
                ['开工率', pct(ent.rate, 0), true],
                ['总需求', fmt(totalDemand) + ' 万吨', true],
                ['已匹配', fmt(totalMatched) + ' 万吨', true]
            ]) +
            '<div class="section-label">矿种需求与货源</div>' + table +
            '<div class="note">需求 = 装置产能 × 矿耗单耗 × 开工率，为年度折算值；检修与长协未纳入。</div>');
    }

    function openCaliber() {
        openModal('口径说明 / 原型假设', '为什么这张图和原图不一样',
            CALIBER_NOTES.map(function (note) {
                return '<div class="section-label">' + esc(note.title) + '</div><div class="note">' + esc(note.text) + '</div>';
            }).join('') +
            '<div class="section-label">数据来源</div>' +
            '<div class="note">本原型所有数值均为演示用模拟数据，用于验证交互与算法结构；接入真实数据时替换 mock.js 即可，字段结构已对齐。</div>');
    }

    function openMatchModal(mk, colKey) {
        const mode = state.matrixMode;
        const columns = getColumns(mode);
        const col = columns.filter(function (c) {
            return c.key === colKey;
        })[0];
        if (!col) {
            return;
        }
        const cell = resolveCell(mode, mk, col);
        const mineral = MINERALS[mk];

        if (!cell || (!cell.demand && !cell.qty)) {
            toast('该组合没有供需关系');
            return;
        }

        const demands = state.model.demands.filter(function (d) {
            const sameCell = mode === 'city' ? d.city === colKey : (col.ids ? col.ids.indexOf(d.enterpriseId) >= 0 : d.enterpriseId === colKey);
            return d.mineral === mk && sameCell;
        });
        const minGrades = Array.from(new Set(demands.map(function (d) {
            return d.minGrade;
        }))).sort(function (a, b) {
            return a - b;
        });
        const gradeText = mk === 'coal' ? minGrades.map(function (g) {
            return fmt(g) + ' kcal';
        }).join(' / ') : minGrades.map(function (g) {
            return g + mineral.unit;
        }).join(' / ');

        const avgKm = cell.links.length ? Math.round(sum(cell.links, function (l) { return l.km * l.qty; }) / cell.qty) : 0;
        const avgCost = cell.links.length ? Math.round(sum(cell.links, function (l) { return l.cost * l.qty; }) / cell.qty) : 0;
        const color = scoreColor(cell.score);

        const table = cell.links.length ?
            '<table class="mini-table"><thead><tr><th>矿山</th><th class="num">品位</th><th class="num">配比量</th>' +
            '<th class="num">运距</th><th>方式</th><th class="num">吨运费</th><th class="num">匹配度</th></tr></thead><tbody>' +
            cell.links.slice().sort(function (a, b) {
                return b.qty - a.qty;
            }).map(function (l) {
                return '<tr><td>' + esc(l.mineName) + '</td>' +
                    '<td class="num">' + (l.mineral === 'coal' ? fmt(l.grade) : l.grade.toFixed(1)) + '</td>' +
                    '<td class="num">' + fmt(l.qty) + '</td>' +
                    '<td class="num">' + fmt(l.km) + ' km</td>' +
                    '<td>' + esc(l.mode) + '</td>' +
                    '<td class="num">' + fmt(l.cost) + ' 元</td>' +
                    '<td class="num">' + l.score + '</td></tr>';
            }).join('') + '</tbody></table>' :
            '<div class="note">该组合存在需求，但川内没有可匹配的供给，形成硬缺口。</div>';

        openModal('匹配明细',
            mineral.name + ' → ' + col.label,
            detailGrid([
                ['需求量', fmt(cell.demand) + ' 万吨', true],
                ['匹配量', fmt(cell.qty) + ' 万吨', true],
                ['覆盖率', pct(cell.demand ? cell.qty / cell.demand : 0, 0), true],
                ['综合匹配度', '<span class="score-badge" style="color:' + color + ';background:' + rgba(color, 0.12) + '">' +
                    cell.score + '</span>'],
                ['平均运距', fmt(avgKm) + ' km', true],
                ['平均吨运费', (avgCost ? fmt(avgCost) + ' 元/吨' : '—'), true],
                ['客户品位要求', gradeText, true],
                ['配矿状态', cell.degraded ? '<span style="color:#C4624F">含降级配矿</span>' : '全部达标']
            ]) +
            '<div class="section-label">拼盘来源</div>' + table +
            '<div class="note">匹配度 = 100 − 品位扣分 − 到厂成本扣分 − 矿种短缺扣分；用于排序与议价优先级，不代表最终合同。</div>');
    }

    /* ---------------- 事件绑定 ---------------- */
    function bindEvents() {
        window.addEventListener('hashchange', route);

        all('.nav-item').forEach(function (link) {
            link.addEventListener('click', function () {
                closeOverlays();
            });
        });

        el('supplyFilters').addEventListener('click', function (event) {
            const chip = event.target.closest('[data-mineral]');
            if (!chip) {
                return;
            }
            state.supplyMineral = chip.getAttribute('data-mineral');
            renderSupplyFilters();
            renderSupply();
        });

        all('.view[data-view="supply"] th.sortable').forEach(function (th) {
            th.addEventListener('click', function () {
                const key = th.getAttribute('data-sort');
                if (state.supplySort === key) {
                    state.supplyDir = state.supplyDir === 'desc' ? 'asc' : 'desc';
                } else {
                    state.supplySort = key;
                    state.supplyDir = 'desc';
                }
                all('.view[data-view="supply"] th.sortable').forEach(function (node) {
                    node.classList.remove('active', 'asc');
                });
                th.classList.add('active');
                if (state.supplyDir === 'asc') {
                    th.classList.add('asc');
                }
                renderSupply();
            });
        });

        el('supplyTable').addEventListener('click', function (event) {
            const row = event.target.closest('[data-mine]');
            if (row) {
                openMineDrawer(row.getAttribute('data-mine'));
            }
        });

        el('demandFilters').addEventListener('click', function (event) {
            const cityChip = event.target.closest('[data-city]');
            const industryChip = event.target.closest('[data-industry]');
            if (cityChip) {
                state.demandCity = cityChip.getAttribute('data-city');
            }
            if (industryChip) {
                state.demandIndustry = industryChip.getAttribute('data-industry');
            }
            if (cityChip || industryChip) {
                renderDemandFilters();
                renderDemand();
            }
        });

        all('.view[data-view="demand"] th.sortable').forEach(function (th) {
            th.addEventListener('click', function () {
                const key = th.getAttribute('data-sort');
                if (state.demandSort === key) {
                    state.demandDir = state.demandDir === 'desc' ? 'asc' : 'desc';
                } else {
                    state.demandSort = key;
                    state.demandDir = 'desc';
                }
                all('.view[data-view="demand"] th.sortable').forEach(function (node) {
                    node.classList.remove('active', 'asc');
                });
                th.classList.add('active');
                if (state.demandDir === 'asc') {
                    th.classList.add('asc');
                }
                renderDemand();
            });
        });

        el('demandTable').addEventListener('click', function (event) {
            const row = event.target.closest('[data-ent]');
            if (row) {
                openEntDrawer(row.getAttribute('data-ent'));
            }
        });

        el('matrixMode').addEventListener('click', function (event) {
            const btn = event.target.closest('[data-mode]');
            if (!btn) {
                return;
            }
            state.matrixMode = btn.getAttribute('data-mode');
            all('#matrixMode [data-mode]').forEach(function (node) {
                node.classList.toggle('active', node === btn);
            });
            renderMatrix();
        });

        el('matrixGrid').addEventListener('click', function (event) {
            const cell = event.target.closest('.m-cell:not(.empty)');
            if (!cell) {
                return;
            }
            openMatchModal(cell.getAttribute('data-mineral'), cell.getAttribute('data-col'));
        });

        el('laneTable').addEventListener('click', function (event) {
            const row = event.target.closest('[data-lane]');
            if (row) {
                highlightLane(row.getAttribute('data-lane'));
            }
        });

        el('btnCaliber').addEventListener('click', openCaliber);
        el('drawerClose').addEventListener('click', closeOverlays);
        el('modalClose').addEventListener('click', closeOverlays);
        el('drawerBackdrop').addEventListener('click', closeOverlays);
        el('modalBackdrop').addEventListener('click', closeOverlays);

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') {
                closeOverlays();
            }
        });
    }

    /* ---------------- 骨架屏 ---------------- */
    function renderSkeletons() {
        el('kpiGrid').innerHTML = [0, 1, 2, 3].map(function () {
            return '<div class="kpi"><div class="skeleton" style="height:12px;width:56%"></div>' +
                '<div class="skeleton" style="height:30px;margin:12px 0 8px;width:74%"></div>' +
                '<div class="skeleton" style="height:10px;width:88%"></div></div>';
        }).join('');
        el('supplyTable').innerHTML = '<tr><td colspan="8"><div class="skeleton" style="height:180px"></div></td></tr>';
        el('demandTable').innerHTML = '<tr><td colspan="9"><div class="skeleton" style="height:180px"></div></td></tr>';
    }

    /* ---------------- 启动 ---------------- */
    function renderAll() {
        renderSupplyFilters();
        renderSupply();
        renderDemandFilters();
        renderDemand();
        renderOverview();
        renderMatrix();
        renderFlow();
    }

    async function boot() {
        renderSkeletons();
        bindEvents();
        route();

        try {
            state.model = await Api.fetchModel();
            renderAll();
            el('clock').textContent = new Date().toLocaleTimeString('zh-CN', { hour12: false });
            setInterval(function () {
                el('clock').textContent = new Date().toLocaleTimeString('zh-CN', { hour12: false });
            }, 1000);
        } catch (error) {
            console.error(error);
            toast('数据加载失败，请刷新重试');
        }
    }

    return {
        boot: boot,
        state: state
    };
})();

document.addEventListener('DOMContentLoaded', function () {
    App.boot();
});

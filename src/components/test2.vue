<template>
  <div class="main-container">
    <!-- 🎯 頂層分頁切換按鈕列 -->
    <div class="tab-header">
      <button
        :class="{ active: currentTab === 'stacked' }"
        @click="currentTab = 'stacked'"
      >
        📊 訪日旅客歷年客源結構分佈 (堆疊長條圖)
      </button>
      <button
        :class="{ active: currentTab === 'race' }"
        @click="currentTab = 'race'"
      >
        🏁 訪日旅客客源國動態競速 (2010 - 2025)
      </button>
    </div>

    <!-- ==================== 分頁一：堆疊長條圖與互動表格 ==================== -->
    <div v-if="currentTab === 'stacked'" class="chart-wrapper">
      <div class="chart-header">
        <div>
          <h2>訪日旅客歷年客源結構分布 (2015 - 2025)</h2>
          <p class="subtitle">
            點擊上方圖例可過濾國家，點擊下方長條圖可於下方檢視該年詳細數據表
          </p>
        </div>

        <!-- 總量 / 百分比 動態切換按鈕 -->
        <div class="toggle-container">
          <button
            :class="{ active: !isPercentMode }"
            @click="isPercentMode = false"
          >
            實際總量 (萬人次)
          </button>
          <button
            :class="{ active: isPercentMode }"
            @click="isPercentMode = true"
          >
            100% 百分比占比
          </button>
        </div>
      </div>

      <!-- 上方客源國圖例 -->
      <div class="legend">
        <div
          v-for="(key, idx) in keys"
          :key="key"
          class="legend-item"
          :class="{ muted: hiddenKeys.has(key) }"
          @click="toggleKey(key)"
        >
          <div
            class="color-box"
            :style="{ backgroundColor: colors[idx] }"
          ></div>
          <span>{{ key }}</span>
        </div>
      </div>

      <!-- 圖表畫布主體 -->
      <div
        class="chart-container"
        :style="{ width: width + 'px', height: height + 'px' }"
      >
        <!-- 背景水平刻度網格線與數字 -->
        <div
          class="y-axis-grid"
          :style="{ left: paddingLeft + 'px', right: paddingRight + 'px' }"
        >
          <div
            v-for="tick in yTicks"
            :key="tick"
            class="grid-line-wrapper"
            :style="{ bottom: getTickYPercent(tick) + '%' }"
          >
            <span class="tick-label">
              {{ isPercentMode ? tick + '%' : (tick / 100).toFixed(0) + '萬' }}
            </span>
            <div class="grid-line"></div>
          </div>
        </div>

        <!-- 堆疊長條圖核心區 -->
        <div
          class="bars-container"
          :style="{ left: paddingLeft + 'px', right: paddingRight + 'px' }"
        >
          <div
            v-for="yearData in computedChartData"
            :key="yearData.year"
            class="year-column"
            @click="selectYear(yearData.year)"
          >
            <div
              class="year-label"
              :class="{ 'selected-year-label': selectedYear === yearData.year }"
            >
              {{ yearData.year }}年
            </div>

            <div
              class="column-track"
              :class="{ 'highlight-column': selectedYear === yearData.year }"
            >
              <div
                v-for="seg in yearData.segments"
                :key="seg.country"
                class="bar-segment"
                :style="{
                  height: seg.heightPercent + '%',
                  backgroundColor: colors[keys.indexOf(seg.country)],
                }"
                @mouseover="showTooltip($event, yearData.year, seg)"
                @mousemove="moveTooltip"
                @mouseout="hideTooltip"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 互動式詳細數據表格 -->
      <div v-if="selectedYearData" class="detail-table-container">
        <div class="table-header">
          <h3>📅 {{ selectedYearData.year }} 年各國訪日旅客詳細數據</h3>
          <button class="close-btn" @click="selectedYear = null">
            ✕ 關閉表格
          </button>
        </div>
        <div class="table-scroll">
          <table>
            <thead>
              <tr>
                <th>排名</th>
                <th>國家/地區</th>
                <th>訪客人數 (萬人次)</th>
                <th>市場佔有率 (%)</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(item, index) in selectedYearData.sortedSegments"
                :key="item.country"
              >
                <td>{{ index + 1 }}</td>
                <td>
                  <span
                    class="table-color-dot"
                    :style="{
                      backgroundColor: colors[keys.indexOf(item.country)],
                    }"
                  ></span>
                  {{ item.country }}
                </td>
                <td>{{ (item.value / 100).toFixed(1) }} 萬</td>
                <td>{{ item.share }}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ==================== 分頁二：動態競速長條圖 ==================== -->
    <div v-if="currentTab === 'race'" class="chart-wrapper">
      <div class="race-header">
        <h2>訪日旅客客源國動態 (2010 - 2025 JNTO)</h2>
        <div class="controls">
          <button @click="togglePlay" class="btn-play">
            {{ isFinished ? '🔄 重新開始' : isPlaying ? '⏸ 暫停' : '▶ 播放' }}
          </button>
          <div class="year-display">{{ Math.round(displayedYear) }} 年</div>
        </div>
      </div>

      <!-- 動態競速畫布主體 -->
      <div
        class="chart-container"
        :style="{ width: width + 'px', height: height + 'px' }"
      >
        <div class="x-axis-grid">
          <div
            v-for="tick in xTicks"
            :key="tick"
            class="grid-line-wrapper-race"
            :style="{ left: getXPercent(tick) + '%' }"
          >
            <span class="tick-label-race">{{ Math.round(tick) }}萬</span>
            <div class="grid-line"></div>
          </div>
        </div>

        <div class="bars-container-race">
          <div
            v-for="(d, index) in currentRenderData"
            :key="d.country"
            class="bar-row"
            :style="{
              transform: `translateY(${index * rowHeight}px)`,
            }"
          >
            <div class="country-name">{{ d.country }}</div>
            <div class="bar-track-race">
              <div
                class="bar-fill"
                :style="{
                  width: getBarWidthPercent(d.interpolatedValue) + '%',
                  backgroundColor: raceColors[d.country] || '#ccc',
                }"
              >
                <span class="bar-value"
                  >{{ d.interpolatedValue.toFixed(1) }}萬</span
                >
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 頂層 Tooltip 提示框 -->
    <div
      v-if="hoveredData"
      class="custom-tooltip"
      :style="{ left: tooltipPos.x + 'px', top: tooltipPos.y + 'px' }"
    >
      <div class="tooltip-title">
        {{ hoveredData.year }}年 · {{ hoveredData.country }}
      </div>
      <div class="tooltip-row">
        訪客人數:
        <strong>{{ (hoveredData.value / 100).toFixed(1) }} 萬</strong>人次
      </div>
      <div class="tooltip-row">
        市場份額: <strong>{{ hoveredData.share }}%</strong>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onUnmounted, watch } from 'vue';

// 🌐 全域分頁控制
const currentTab = ref('stacked'); // 'stacked' 或 'race'

// ==================== 分頁一相關狀態 ====================
const hoveredData = ref(null);
const tooltipPos = reactive({ x: 0, y: 0 });
const hiddenKeys = ref(new Set());
const isPercentMode = ref(false);
const selectedYear = ref('2025');

const dataset = [
  {
    year: '2015',
    南韓: 40020,
    台灣: 36770,
    中國: 49940,
    美國: 10330,
    香港: 15240,
    泰國: 7970,
    澳洲: 3760,
    菲律賓: 2680,
    新加坡: 3090,
    加拿大: 2310,
    馬來西亞: 3050,
    其他: 63130,
  },
  {
    year: '2016',
    南韓: 50900,
    台灣: 41680,
    中國: 63740,
    美國: 12430,
    香港: 18390,
    泰國: 9020,
    澳洲: 4450,
    菲律賓: 3480,
    新加坡: 3620,
    加拿大: 2710,
    馬來西亞: 3940,
    其他: 59350,
  },
  {
    year: '2017',
    南韓: 71400,
    台灣: 45640,
    中國: 73560,
    美國: 13750,
    香港: 22320,
    泰國: 9870,
    澳洲: 4950,
    菲律賓: 4240,
    新加坡: 4040,
    加拿大: 3060,
    馬來西亞: 4390,
    其他: 59110,
  },
  {
    year: '2018',
    南韓: 75390,
    台灣: 47570,
    中國: 83800,
    美國: 13750,
    香港: 22080,
    泰國: 11320,
    澳洲: 5520,
    菲律賓: 5040,
    新加坡: 4370,
    加拿大: 3310,
    馬來西亞: 4680,
    其他: 55200,
  },
  {
    year: '2019',
    南韓: 55850,
    台灣: 48910,
    中國: 95940,
    美國: 17240,
    香港: 22910,
    泰國: 13190,
    澳洲: 6220,
    菲律賓: 6130,
    新加坡: 4920,
    加拿大: 3750,
    馬來西亞: 5020,
    其他: 63130,
  },
  {
    year: '2020',
    南韓: 4880,
    台灣: 6940,
    中國: 10690,
    美國: 7590,
    香港: 3460,
    泰國: 2190,
    澳洲: 1630,
    菲律賓: 1090,
    新加坡: 550,
    加拿大: 560,
    馬來西亞: 770,
    其他: 2190,
  },
  {
    year: '2021',
    南韓: 190,
    台灣: 50,
    中國: 420,
    美國: 200,
    香港: 10,
    泰國: 30,
    澳洲: 30,
    菲律賓: 60,
    新加坡: 10,
    加拿大: 40,
    馬來西亞: 20,
    其他: 140,
  },
  {
    year: '2022',
    南韓: 10130,
    台灣: 3310,
    中國: 1890,
    美國: 3240,
    香港: 2690,
    泰國: 1980,
    澳洲: 890,
    菲律賓: 1270,
    新加坡: 1320,
    加拿大: 560,
    馬來西亞: 740,
    其他: 1380,
  },
  {
    year: '2023',
    南韓: 69580,
    台灣: 42020,
    中國: 24250,
    美國: 20460,
    香港: 21140,
    泰國: 9960,
    澳洲: 6130,
    菲律賓: 6220,
    新加坡: 5910,
    加拿大: 4260,
    馬來西亞: 4160,
    其他: 25720,
  },
  {
    year: '2024',
    南韓: 88180,
    台灣: 60440,
    中國: 69810,
    美國: 27250,
    香港: 26830,
    泰國: 11490,
    澳洲: 9200,
    菲律賓: 8190,
    新加坡: 6910,
    加拿大: 5790,
    馬來西亞: 5070,
    其他: 34550,
  },
  {
    year: '2025',
    南韓: 94600,
    台灣: 67630,
    中國: 90960,
    美國: 33070,
    香港: 25170,
    泰國: 12330,
    澳洲: 10580,
    菲律賓: 8850,
    新加坡: 7260,
    加拿大: 6880,
    馬來西亞: 6370,
    其他: 40210,
  },
];

const keys = [
  '南韓',
  '台灣',
  '中國',
  '美國',
  '香港',
  '泰國',
  '澳洲',
  '菲律賓',
  '新加坡',
  '加拿大',
  '馬來西亞',
  '其他',
];
const colors = [
  '#4e79a7',
  '#f28e2c',
  '#e15759',
  '#76b7b2',
  '#59a14f',
  '#edc948',
  '#94a3b8',
  '#9c755f',
  '#b07aa1',
  '#bab0ac',
  '#ff9da7',
  '#cbd5e1',
];

const width = 850;
const height = 400;
const paddingLeft = 65;
const paddingRight = 15;

const toggleKey = (key) => {
  if (hiddenKeys.value.has(key)) hiddenKeys.value.delete(key);
  else if (hiddenKeys.value.size < keys.length - 1) hiddenKeys.value.add(key);
};

const selectYear = (year) => {
  selectedYear.value = year;
};

const computedChartData = computed(() => {
  const activeKeys = keys.filter((k) => !hiddenKeys.value.has(k));
  const yearTotals = dataset.map((d) => {
    let activeSum = 0;
    activeKeys.forEach((k) => (activeSum += d[k] || 0));
    return { year: d.year, sum: activeSum, raw: d };
  });

  let globalMax = 0;
  yearTotals.forEach((d) => {
    if (d.sum > globalMax) globalMax = d.sum;
  });
  const niceMax = globalMax > 0 ? Math.ceil(globalMax / 10000) * 10000 : 10000;

  return yearTotals.map((yData) => {
    const segments = [];
    activeKeys.forEach((k) => {
      const val = yData.raw[k] || 0;
      const share = yData.sum > 0 ? ((val / yData.sum) * 100).toFixed(1) : 0;
      let heightPercent = isPercentMode.value
        ? yData.sum > 0
          ? (val / yData.sum) * 100
          : 0
        : (val / niceMax) * 100;
      if (!isPercentMode.value && val > 0 && heightPercent < 1.5)
        heightPercent = 1.5;

      segments.push({ country: k, value: val, share, heightPercent });
    });
    return {
      year: yData.year,
      totalSum: yData.sum,
      axisMax: niceMax,
      segments,
    };
  });
});

const selectedYearData = computed(() => {
  if (!selectedYear.value) return null;
  const rawObj = dataset.find((d) => d.year === selectedYear.value);
  if (!rawObj) return null;
  let total = 0;
  keys.forEach((k) => {
    total += rawObj[k] || 0;
  });
  const segments = keys.map((k) => {
    const val = rawObj[k] || 0;
    const share = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
    return { country: k, value: val, share };
  });
  segments.sort((a, b) => b.value - a.value);
  return { year: selectedYear.value, sortedSegments: segments };
});

const yTicks = computed(() => {
  if (isPercentMode.value) return [0, 25, 50, 75, 100];
  return [
    0, 50000, 100000, 150000, 200000, 250000, 300000, 350000, 400000, 450000,
  ];
});

const getTickYPercent = (tick) => {
  if (isPercentMode.value) return tick;
  return (tick / 450000) * 100;
};

const showTooltip = (event, year, seg) => {
  hoveredData.value = {
    year,
    country: seg.country,
    value: seg.value,
    share: seg.share,
  };
  tooltipPos.x = event.clientX + 15;
  tooltipPos.y = event.clientY - 45;
};
const moveTooltip = (event) => {
  tooltipPos.x = event.clientX + 15;
  tooltipPos.y = event.clientY - 45;
};
const hideTooltip = () => {
  hoveredData.value = null;
};

// ==================== 分頁二（動態競速長條圖）相關狀態 ====================
const raceYears = [
  2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022,
  2023, 2024, 2025,
];
const timelineData = {
  2010: [
    { country: '南韓', value: 244.0 },
    { country: '台灣', value: 126.8 },
    { country: '中國', value: 141.3 },
    { country: '香港', value: 50.9 },
    { country: '泰國', value: 21.5 },
    { country: '新加坡', value: 18.1 },
    { country: '馬來西亞', value: 11.5 },
    { country: '菲律賓', value: 7.7 },
    { country: '美國', value: 72.7 },
    { country: '加拿大', value: 15.3 },
    { country: '澳洲', value: 22.6 },
  ],
  2011: [
    { country: '南韓', value: 165.8 },
    { country: '台灣', value: 99.4 },
    { country: '中國', value: 42.2 },
    { country: '香港', value: 36.5 },
    { country: '泰國', value: 14.5 },
    { country: '新加坡', value: 11.1 },
    { country: '馬來西亞', value: 8.2 },
    { country: '菲律賓', value: 6.3 },
    { country: '美國', value: 56.6 },
    { country: '加拿大', value: 13.5 },
    { country: '澳洲', value: 16.3 },
  ],
  2012: [
    { country: '南韓', value: 204.3 },
    { country: '台灣', value: 146.6 },
    { country: '中國', value: 142.5 },
    { country: '香港', value: 48.2 },
    { country: '泰國', value: 26.1 },
    { country: '新加坡', value: 14.2 },
    { country: '馬來西亞', value: 13.0 },
    { country: '菲律賓', value: 8.5 },
    { country: '美國', value: 71.7 },
    { country: '加拿大', value: 17.7 },
    { country: '澳洲', value: 20.6 },
  ],
  2013: [
    { country: '南韓', value: 245.6 },
    { country: '台灣', value: 221.1 },
    { country: '中國', value: 131.4 },
    { country: '香港', value: 74.6 },
    { country: '泰國', value: 45.4 },
    { country: '新加坡', value: 18.9 },
    { country: '馬來西亞', value: 17.7 },
    { country: '菲律賓', value: 10.8 },
    { country: '美國', value: 75.1 },
    { country: '加拿大', value: 19.5 },
    { country: '澳洲', value: 24.2 },
  ],
  2014: [
    { country: '南韓', value: 275.5 },
    { country: '台灣', value: 282.9 },
    { country: '中國', value: 240.9 },
    { country: '香港', value: 92.6 },
    { country: '泰國', value: 65.8 },
    { country: '新加坡', value: 22.8 },
    { country: '馬來西亞', value: 25.0 },
    { country: '菲律賓', value: 18.4 },
    { country: '美國', value: 88.2 },
    { country: '加拿大', value: 18.3 },
    { country: '澳洲', value: 30.3 },
  ],
  2015: [
    { country: '南韓', value: 400.2 },
    { country: '台灣', value: 367.7 },
    { country: '中國', value: 499.4 },
    { country: '香港', value: 152.4 },
    { country: '泰國', value: 79.7 },
    { country: '新加坡', value: 30.9 },
    { country: '馬來西亞', value: 30.5 },
    { country: '菲律賓', value: 26.8 },
    { country: '美國', value: 103.3 },
    { country: '加拿大', value: 23.1 },
    { country: '澳洲', value: 37.6 },
  ],
  2016: [
    { country: '南韓', value: 509.0 },
    { country: '台灣', value: 416.8 },
    { country: '中國', value: 637.4 },
    { country: '香港', value: 183.9 },
    { country: '泰國', value: 90.2 },
    { country: '新加坡', value: 36.2 },
    { country: '馬來西亞', value: 39.4 },
    { country: '菲律賓', value: 34.8 },
    { country: '美國', value: 124.3 },
    { country: '加拿大', value: 27.1 },
    { country: '澳洲', value: 44.5 },
  ],
  2017: [
    { country: '南韓', value: 714.0 },
    { country: '台灣', value: 456.4 },
    { country: '中國', value: 735.6 },
    { country: '香港', value: 223.2 },
    { country: '泰國', value: 98.7 },
    { country: '新加坡', value: 40.4 },
    { country: '馬來西亞', value: 43.9 },
    { country: '菲律賓', value: 42.4 },
    { country: '美國', value: 137.5 },
    { country: '加拿大', value: 30.6 },
    { country: '澳洲', value: 49.5 },
  ],
  2018: [
    { country: '南韓', value: 753.9 },
    { country: '台灣', value: 475.7 },
    { country: '中國', value: 838.0 },
    { country: '香港', value: 220.8 },
    { country: '泰國', value: 113.2 },
    { country: '新加坡', value: 43.7 },
    { country: '馬來西亞', value: 46.8 },
    { country: '菲律賓', value: 50.4 },
    { country: '美國', value: 137.5 },
    { country: '加拿大', value: 33.1 },
    { country: '澳洲', value: 55.2 },
  ],
  2019: [
    { country: '南韓', value: 558.5 },
    { country: '台灣', value: 489.1 },
    { country: '中國', value: 959.4 },
    { country: '香港', value: 229.1 },
    { country: '泰國', value: 131.9 },
    { country: '新加坡', value: 49.2 },
    { country: '馬來西亞', value: 50.2 },
    { country: '菲律賓', value: 61.3 },
    { country: '美國', value: 172.4 },
    { country: '加拿大', value: 37.5 },
    { country: '澳洲', value: 62.2 },
  ],
  2020: [
    { country: '南韓', value: 48.8 },
    { country: '台灣', value: 69.4 },
    { country: '中國', value: 106.9 },
    { country: '香港', value: 34.6 },
    { country: '泰國', value: 21.9 },
    { country: '新加坡', value: 5.5 },
    { country: '馬來西亞', value: 7.7 },
    { country: '菲律賓', value: 10.9 },
    { country: '美國', value: 75.9 },
    { country: '加拿大', value: 5.6 },
    { country: '澳洲', value: 16.3 },
  ],
  2021: [
    { country: '南韓', value: 1.9 },
    { country: '台灣', value: 0.5 },
    { country: '中國', value: 4.2 },
    { country: '香港', value: 0.1 },
    { country: '泰國', value: 0.3 },
    { country: '新加坡', value: 0.1 },
    { country: '馬來西亞', value: 0.2 },
    { country: '菲律賓', value: 0.6 },
    { country: '美國', value: 2.0 },
    { country: '加拿大', value: 0.4 },
    { country: '澳洲', value: 0.3 },
  ],
  2022: [
    { country: '南韓', value: 101.3 },
    { country: '台灣', value: 33.1 },
    { country: '中國', value: 18.9 },
    { country: '香港', value: 26.9 },
    { country: '泰國', value: 19.8 },
    { country: '新加坡', value: 13.2 },
    { country: '馬來西亞', value: 7.4 },
    { country: '菲律賓', value: 12.7 },
    { country: '美國', value: 32.4 },
    { country: '加拿大', value: 5.6 },
    { country: '澳洲', value: 8.9 },
  ],
  2023: [
    { country: '南韓', value: 695.8 },
    { country: '台灣', value: 420.2 },
    { country: '中國', value: 242.5 },
    { country: '香港', value: 211.4 },
    { country: '泰國', value: 99.6 },
    { country: '新加坡', value: 59.1 },
    { country: '馬來西亞', value: 41.6 },
    { country: '菲律賓', value: 62.2 },
    { country: '美國', value: 204.6 },
    { country: '加拿大', value: 42.6 },
    { country: '澳洲', value: 61.3 },
  ],
  2024: [
    { country: '南韓', value: 881.8 },
    { country: '台灣', value: 604.4 },
    { country: '中國', value: 698.1 },
    { country: '香港', value: 268.3 },
    { country: '泰國', value: 114.9 },
    { country: '新加坡', value: 69.1 },
    { country: '馬來西亞', value: 50.7 },
    { country: '菲律賓', value: 81.9 },
    { country: '美國', value: 272.5 },
    { country: '加拿大', value: 57.9 },
    { country: '澳洲', value: 92.0 },
  ],
  2025: [
    { country: '南韓', value: 946.0 },
    { country: '台灣', value: 676.3 },
    { country: '中國', value: 909.6 },
    { country: '香港', value: 251.7 },
    { country: '泰國', value: 123.3 },
    { country: '新加坡', value: 72.6 },
    { country: '馬來西亞', value: 63.7 },
    { country: '菲律賓', value: 88.5 },
    { country: '美國', value: 330.7 },
    { country: '加拿大', value: 68.8 },
    { country: '澳洲', value: 105.8 },
  ],
};

const raceColors = {
  南韓: '#4e79a7',
  台灣: '#f28e2c',
  中國: '#e15759',
  美國: '#76b7b2',
  香港: '#59a14f',
  泰國: '#edc948',
  新加坡: '#b07aa1',
  馬來西亞: '#ff9da7',
  菲律賓: '#9c755f',
  加拿大: '#bab0ac',
  澳洲: '#94a3b8',
};

const rowHeight = 40;
const kLimit = 10;
const currentIndex = ref(0);
const progress = ref(0);
const isPlaying = ref(false);
const isFinished = ref(false);
let animationFrameId = null;
let lastTime = null;
const durationPerYear = 4000;

const displayedYear = computed(() => {
  const currentY = raceYears[currentIndex.value];
  const nextY = raceYears[(currentIndex.value + 1) % raceYears.length];
  return currentY + (nextY - currentY) * progress.value;
});

const currentRenderData = computed(() => {
  const currentYearVal = raceYears[currentIndex.value];
  const nextYearVal = raceYears[(currentIndex.value + 1) % raceYears.length];

  const currentMap = new Map(
    timelineData[currentYearVal].map((d) => [d.country, d.value])
  );
  const nextMap = new Map(
    timelineData[nextYearVal].map((d) => [d.country, d.value])
  );
  const allCountries = Object.keys(raceColors);

  const interpolatedList = allCountries.map((country) => {
    const v1 = currentMap.get(country) || 0;
    const v2 = nextMap.get(country) || 0;
    return { country, interpolatedValue: v1 + (v2 - v1) * progress.value };
  });

  return interpolatedList
    .sort((a, b) => b.interpolatedValue - a.interpolatedValue)
    .slice(0, kLimit);
});

const maxDomainValue = computed(() => {
  const data = currentRenderData.value;
  if (data.length === 0) return 100;
  let max = data[0].interpolatedValue;
  for (let i = 1; i < data.length; i++) {
    if (data[i].interpolatedValue > max) max = data[i].interpolatedValue;
  }
  return Math.max(max * 1.15, 10);
});

const xTicks = computed(() => {
  const max = maxDomainValue.value;
  return [
    0,
    Math.round(max * 0.25),
    Math.round(max * 0.5),
    Math.round(max * 0.75),
    Math.round(max),
  ];
});

const getXPercent = (val) => (val / maxDomainValue.value) * 100;
const getBarWidthPercent = (val) => (val / maxDomainValue.value) * 100;

const updateAnimation = (timestamp) => {
  if (!lastTime) lastTime = timestamp;
  const elapsed = timestamp - lastTime;
  progress.value = elapsed / durationPerYear;

  if (progress.value >= 1) {
    progress.value = 0;
    if (currentIndex.value >= raceYears.length - 2) {
      currentIndex.value = raceYears.length - 2;
      progress.value = 1;
      isPlaying.value = false;
      isFinished.value = true;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      return;
    }
    currentIndex.value = (currentIndex.value + 1) % raceYears.length;
    lastTime = timestamp;
  }

  if (isPlaying.value) {
    animationFrameId = requestAnimationFrame(updateAnimation);
  }
};

const togglePlay = () => {
  if (isFinished.value) {
    currentIndex.value = 0;
    progress.value = 0;
    isFinished.value = false;
    isPlaying.value = true;
    lastTime = null;
    animationFrameId = requestAnimationFrame(updateAnimation);
    return;
  }
  isPlaying.value = !isPlaying.value;
  if (isPlaying.value) {
    lastTime = null;
    animationFrameId = requestAnimationFrame(updateAnimation);
  } else if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
};

onUnmounted(() => {
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
});
</script>

<style scoped>
.main-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  font-family: system-ui, -apple-system, sans-serif;
  margin: 20px 0;
}

/* 分頁切換列樣式 */
.tab-header {
  display: flex;
  gap: 12px;
  background: #f1f5f9;
  padding: 6px;
  border-radius: 12px;
}
.tab-header button {
  border: none;
  background: transparent;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.tab-header button.active {
  background: white;
  color: #0f172a;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.chart-wrapper {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 4px 25px rgba(0, 0, 0, 0.06);
  width: fit-content;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 40px;
}
h2 {
  color: #1e293b;
  font-size: 1.2rem;
  margin: 0 0 4px 0;
}
.subtitle {
  color: #64748b;
  font-size: 0.85rem;
  margin: 0;
}

.toggle-container {
  display: flex;
  background: #f1f3f5;
  padding: 4px;
  border-radius: 8px;
}
.toggle-container button {
  border: none;
  background: transparent;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 600;
  color: #6c757d;
  border-radius: 6px;
  cursor: pointer;
}
.toggle-container button.active {
  background: white;
  color: #2c3e50;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.legend {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 25px;
  font-size: 12px;
  flex-wrap: wrap;
  max-width: 800px;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  user-select: none;
  transition: opacity 0.2s;
}
.legend-item.muted {
  opacity: 0.25;
}
.color-box {
  width: 12px;
  height: 12px;
  border-radius: 3px;
}

.chart-container {
  position: relative;
  box-sizing: border-box;
}

/* 堆疊圖格線 */
.y-axis-grid {
  position: absolute;
  top: 10px;
  bottom: 30px;
  left: 0;
  right: 0;
  pointer-events: none;
}
.grid-line-wrapper {
  position: absolute;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  transform: translateY(50%);
}
.tick-label {
  font-size: 11px;
  color: #64748b;
  position: absolute;
  left: -55px;
  width: 50px;
  text-align: right;
}
.grid-line {
  flex: 1;
  height: 1px;
  background-color: #f1f5f9;
}

.bars-container {
  position: absolute;
  top: 10px;
  bottom: 30px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
  z-index: 2;
}
.year-column {
  width: 42px;
  height: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  cursor: pointer;
}
.year-label {
  position: absolute;
  bottom: -22px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 12px;
  color: #475569;
  font-weight: 500;
  white-space: nowrap;
  padding: 2px 6px;
  border-radius: 4px;
}
.selected-year-label {
  background: #0f172a;
  color: white;
  font-weight: bold;
}
.column-track {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column-reverse;
  border-radius: 4px;
  overflow: hidden;
  border: 2px solid transparent;
}
.highlight-column {
  border-color: #0f172a !important;
  box-shadow: 0 0 12px rgba(15, 23, 42, 0.25) !important;
}
.bar-segment {
  width: 100%;
  transition: opacity 0.2s;
}
.bar-segment:hover {
  opacity: 0.75;
}

/* 動態競速專用樣式 */
.race-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 15px;
}
.controls {
  display: flex;
  align-items: center;
  gap: 20px;
}
.btn-play {
  border: none;
  background: #2c3e50;
  color: white;
  padding: 8px 18px;
  font-size: 13px;
  font-weight: bold;
  border-radius: 6px;
  cursor: pointer;
}
.btn-play:hover {
  background: #1e293b;
}
.year-display {
  font-size: 2.2rem;
  font-weight: 900;
  color: #cbd5e1;
  font-family: Impact, sans-serif;
  min-width: 120px;
  text-align: right;
}
.x-axis-grid {
  position: absolute;
  left: 90px;
  right: 0;
  top: 0;
  bottom: 0;
  pointer-events: none;
}
.grid-line-wrapper-race {
  position: absolute;
  top: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  transform: translateX(-50%);
}
.tick-label-race {
  font-size: 11px;
  color: #777;
  position: absolute;
  top: -20px;
  white-space: nowrap;
}
.bars-container-race {
  position: absolute;
  left: 0;
  right: 0;
  top: 15px;
  bottom: 0;
}
.bar-row {
  position: absolute;
  left: 0;
  right: 0;
  height: 30px;
  display: flex;
  align-items: center;
  transition: transform 0.1s linear;
}
.country-name {
  width: 80px;
  text-align: right;
  font-size: 13px;
  font-weight: bold;
  color: #334155;
  margin-right: 10px;
  white-space: nowrap;
}
.bar-track-race {
  flex: 1;
  height: 100%;
  position: relative;
  overflow: visible;
}
.bar-fill {
  height: 100%;
  border-radius: 4px;
  display: flex;
  align-items: center;
  position: relative;
}
.bar-value {
  position: absolute;
  left: 100%;
  margin-left: 8px;
  font-size: 11px;
  font-weight: bold;
  color: #334155 !important;
  white-space: nowrap;
}

/* 詳細數據表格樣式 */
.detail-table-container {
  margin-top: 45px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 16px 20px;
}
.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  border-bottom: 1px solid #cbd5e1;
  padding-bottom: 8px;
}
.table-header h3 {
  margin: 0;
  font-size: 1rem;
  color: #1e293b;
}
.close-btn {
  background: #e2e8f0;
  border: none;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  color: #475569;
  font-weight: 600;
}
.table-scroll {
  max-height: 220px;
  overflow-y: auto;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  text-align: left;
}
th,
td {
  padding: 8px 12px;
  border-bottom: 1px solid #e2e8f0;
}
th {
  background: #f1f5f9;
  color: #475569;
  font-weight: 600;
  position: sticky;
  top: 0;
}
td {
  color: #334155;
}
.table-color-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 2px;
  margin-right: 6px;
  vertical-align: middle;
}

/* Tooltip 樣式 */
.custom-tooltip {
  position: fixed;
  padding: 10px 14px;
  background: rgba(15, 23, 42, 0.95);
  color: white;
  border-radius: 8px;
  font-size: 13px;
  pointer-events: none;
  z-index: 9999;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
  line-height: 1.6;
  border-left: 4px solid #4e79a7;
  min-width: 160px;
}
.tooltip-title {
  font-weight: bold;
  font-size: 14px;
  margin-bottom: 4px;
  color: #f8fafc;
  border-bottom: 1px solid #334155;
  padding-bottom: 4px;
}
.tooltip-row {
  color: #cbd5e1;
}
.tooltip-row strong {
  color: #f8fafc;
  font-size: 14px;
}
</style>

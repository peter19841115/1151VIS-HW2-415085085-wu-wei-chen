<template>
  <div class="chart-wrapper">
    <div class="chart-header">
      <h2>訪日旅客歷年客源結構分布 (2015 - 2025 )</h2>

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

    <!-- 上方客源國圖例（自動彈性折行排版） -->
    <div class="legend">
      <div
        v-for="(key, idx) in keys"
        :key="key"
        class="legend-item"
        :class="{ muted: hiddenKeys.has(key) }"
        @click="toggleKey(key)"
      >
        <div class="color-box" :style="{ backgroundColor: colors[idx] }"></div>
        <span>{{ key }}</span>
      </div>
    </div>

    <!-- 圖表畫布主體 -->
    <div
      class="chart-container"
      :style="{ width: width + 'px', height: height + 'px' }"
    >
      <!-- 1. 背景水平刻度網格線與數字（已校正除以100，修正左側人數放大錯誤） -->
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
          <!-- 🎯 修正處一：百分比模式顯示%，總量模式精確顯示真實萬人次 -->
          <span class="tick-label">
            {{ isPercentMode ? tick + '%' : (tick / 100).toFixed(0) + '萬' }}
          </span>
          <div class="grid-line"></div>
        </div>
      </div>

      <!-- 2. 堆疊長條圖核心區 -->
      <div
        class="bars-container"
        :style="{ left: paddingLeft + 'px', right: paddingRight + 'px' }"
      >
        <!-- 每一根大長條柱子（年份） -->
        <div
          v-for="yearData in computedChartData"
          :key="yearData.year"
          class="year-column"
        >
          <!-- 底部年份文字 -->
          <div class="year-label">{{ yearData.year }}年</div>

          <!-- 柱子內部的彩色堆疊區塊（從底部往上疊加） -->
          <div class="column-track">
            <div
              v-for="seg in yearData.segments"
              :key="seg.country"
              class="bar-segment"
              :style="{
                height: seg.heightPercent + '%',
                backgroundColor: colors[keys.indexOf(seg.country)],
                cursor: 'pointer',
              }"
              @mouseover="showTooltip($event, yearData.year, seg)"
              @mousemove="moveTooltip"
              @mouseout="hideTooltip"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 🎯 修正處二：霸王級頂層 Tooltip 提示框，使用固定定位與最高 z-index，100% 絕對看得見 -->
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
import { ref, reactive, computed } from 'vue';

const hoveredData = ref(null);
const tooltipPos = reactive({ x: 0, y: 0 });
const hiddenKeys = ref(new Set());
const isPercentMode = ref(false);

// 📊 JNTO 2015 - 2025 11國完整真實歷年統計確定值數據 (底層數據原始放大100倍以便精確加總)
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

const years = [
  2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025,
];

const width = 850;
const height = 400;
const paddingLeft = 65;
const paddingRight = 15;

const toggleKey = (key) => {
  if (hiddenKeys.value.has(key)) hiddenKeys.value.delete(key);
  else if (hiddenKeys.value.size < keys.length - 1) hiddenKeys.value.add(key);
};

// 🎯 核心數據與高度百分比計算
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

      let heightPercent = 0;
      if (isPercentMode.value) {
        heightPercent = yData.sum > 0 ? (val / yData.sum) * 100 : 0;
      } else {
        heightPercent = (val / niceMax) * 100;
        // 2021最低高度安全鎖
        if (val > 0 && heightPercent < 1.5) heightPercent = 1.5;
      }

      segments.push({
        country: k,
        value: val,
        share: share,
        heightPercent: heightPercent,
      });
    });

    return {
      year: yData.year,
      totalSum: yData.sum,
      axisMax: niceMax,
      segments: segments,
    };
  });
});

// 動態 Y 軸網格線
const yTicks = computed(() => {
  if (isPercentMode.value) {
    return [0, 25, 50, 75, 100]; // 🎯 修正處三：補上百分比模式下的刻度陣列，不再回傳空值
  }
  const currentMax = 450000;
  return [
    0, 50000, 100000, 150000, 200000, 250000, 300000, 350000, 400000, 450000,
  ];
});

const getTickYPercent = (tick) => {
  if (isPercentMode.value) return tick;
  const currentMax = 450000;
  return (tick / currentMax) * 100;
};

// 🎯 Tooltip 互動事件核心：直接抓取滑鼠相對於視窗的 Client 座標，徹底防止偏移
const showTooltip = (event, year, seg) => {
  hoveredData.value = {
    year: year,
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
</script>

<style scoped>
.chart-wrapper {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  font-family: system-ui, -apple-system, sans-serif;
  width: fit-content;
  margin: 0 auto;
}
.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 40px;
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
  transition: all 0.2s ease;
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

/* 網格線排版 */
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
  transition: bottom 0.6s ease;
}
.tick-label {
  font-size: 11px;
  color: #64748b;
  position: absolute;
  left: -55px;
  width: 50px;
  text-anchor: right;
  font-family: sans-serif;
}
.grid-line {
  flex: 1;
  height: 1px;
  background-color: #f1f5f9;
}

/* 長條圖排列區 */
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
}
.column-track {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column-reverse;
  border-radius: 3px;
  overflow: hidden;
}
.bar-segment {
  width: 100%;
  transition: height 0.6s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.2s;
}
.bar-segment:hover {
  opacity: 0.75;
}

.custom-tooltip {
  position: fixed;
  padding: 10px 14px;
  background: rgba(15, 23, 42, 0.95);
  color: white;
  border-radius: 8px;
  font-size: 13px;
  pointer-events: none;
  z-index: 9999;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3),
    0 8px 10px -6px rgba(0, 0, 0, 0.3);
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

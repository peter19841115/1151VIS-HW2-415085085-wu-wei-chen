<template>
  <div class="race-wrapper">
    <div class="race-header">
      <h2>訪日旅客客源國動態 (2010 - 2025 JNTO)</h2>
      <div class="controls">
        <button @click="togglePlay" class="btn-play">
          {{ isFinished ? '🔄 重新開始' : isPlaying ? '⏸ 暫停' : '▶ 播放' }}
        </button>
        <div class="year-display">{{ Math.round(displayedYear) }} 年</div>
      </div>
    </div>

    <!-- 圖表畫布大框 -->
    <div
      class="chart-container"
      :style="{ width: width + 'px', height: height + 'px' }"
    >
      <!-- 1. 背景水平刻度網格線與數字 -->
      <div class="x-axis-grid">
        <div
          v-for="tick in xTicks"
          :key="tick"
          class="grid-line-wrapper"
          :style="{ left: getXPercent(tick) + '%' }"
        >
          <span class="tick-label">{{ Math.round(tick) }}萬</span>
          <div class="grid-line"></div>
        </div>
      </div>

      <!-- 2. 動態競速長條陣列 -->
      <div class="bars-container">
        <div
          v-for="(d, index) in currentRenderData"
          :key="d.country"
          class="bar-row"
          :style="{
            transform: `translateY(${index * rowHeight}px)`,
          }"
        >
          <!-- 國家名稱 -->
          <div class="country-name">{{ d.country }}</div>

          <!-- 彩色長條柱體 -->
          <div class="bar-track">
            <div
              class="bar-fill"
              :class="{
                'is-short': getBarWidthPercent(d.interpolatedValue) < 12,
              }"
              :style="{
                width: getBarWidthPercent(d.interpolatedValue) + '%',
                backgroundColor: colors[d.country] || '#ccc',
              }"
            >
              <!-- 長條內部的數字標籤 -->
              <span class="bar-value"
                >{{ d.interpolatedValue.toFixed(1) }}萬</span
              >
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';

const years = [
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

const colors = {
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

const width = 720;
const height = 440;
const rowHeight = 40;
const k = 10;

const currentIndex = ref(0);
const progress = ref(0);
const isPlaying = ref(false);
const isFinished = ref(false); // 記錄是否播到 2025 終點
let animationFrameId = null;
let lastTime = null;
const durationPerYear = 6000; // 每個年份過渡時間設為 3 秒（放慢速度）

const displayedYear = computed(() => {
  const currentY = years[currentIndex.value];
  const nextY = years[(currentIndex.value + 1) % years.length];
  return currentY + (nextY - currentY) * progress.value;
});

const currentRenderData = computed(() => {
  const currentYearVal = years[currentIndex.value];
  const nextYearVal = years[(currentIndex.value + 1) % years.length];

  const currentMap = new Map(
    timelineData[currentYearVal].map((d) => [d.country, d.value])
  );
  const nextMap = new Map(
    timelineData[nextYearVal].map((d) => [d.country, d.value])
  );

  const allCountries = Object.keys(colors);

  const interpolatedList = allCountries.map((country) => {
    const v1 = currentMap.get(country) || 0;
    const v2 = nextMap.get(country) || 0;
    const interpolatedValue = v1 + (v2 - v1) * progress.value;
    return {
      country,
      interpolatedValue,
    };
  });

  return interpolatedList
    .sort((a, b) => b.interpolatedValue - a.interpolatedValue)
    .slice(0, k);
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

    // 如果即將超過最後一個過渡區間（到達 2025 終點）
    if (currentIndex.value >= years.length - 2) {
      currentIndex.value = years.length - 2;
      progress.value = 1;
      isPlaying.value = false;
      isFinished.value = true;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      return;
    }

    currentIndex.value = (currentIndex.value + 1) % years.length;
    lastTime = timestamp;
  }

  if (isPlaying.value) {
    animationFrameId = requestAnimationFrame(updateAnimation);
  }
};

const togglePlay = () => {
  // 如果已經播完停在 2025，點擊後重頭開始
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

onMounted(() => {
  startRace();
});

onUnmounted(() => {
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
});
</script>

<style scoped>
.race-wrapper {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 4px 25px rgba(0, 0, 0, 0.06);
  font-family: system-ui, -apple-system, sans-serif;
  width: fit-content;
  margin: 0 auto;
}
.race-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 15px;
}
h2 {
  color: #2c3e50;
  margin: 0;
  font-size: 1.2rem;
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
  transition: background 0.2s;
}
.btn-play:hover {
  background: #1e293b;
}
.year-display {
  font-size: 2.5rem;
  font-weight: 900;
  color: #cbd5e1;
  font-family: 'Impact', 'Arial Black', sans-serif;
  min-width: 130px;
  text-align: right;
}
.chart-container {
  position: relative;
  margin-top: 25px;
  box-sizing: border-box;
}
.x-axis-grid {
  position: absolute;
  left: 90px;
  right: 0;
  top: 0;
  bottom: 0;
  pointer-events: none;
}
.grid-line-wrapper {
  position: absolute;
  top: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  transform: translateX(-50%);
  transition: left 0.1s linear;
}
.tick-label {
  font-size: 11px;
  color: #777;
  position: absolute;
  top: -20px;
  white-space: nowrap;
}
.grid-line {
  width: 1px;
  height: 100%;
  background-color: #f3f4f6;
}
.bars-container {
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
.bar-track {
  flex: 1;
  height: 100%;
  position: relative;
}
.bar-fill {
  height: 100%;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 8px;
  box-sizing: border-box;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}
.bar-value {
  font-size: 11px;
  font-weight: bold;
  color: white;
  white-space: nowrap;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}
.bar-track {
  flex: 1;
  height: 100%;
  position: relative;
  overflow: visible; /* 確保數字超出長條時不會被切掉 */
}

.bar-fill {
  height: 100%;
  border-radius: 4px;
  display: flex;
  align-items: center;
  position: relative; /* 讓內部的 .bar-value 以長條右側為基準 */
  background-color: var(--bar-color);
}

.bar-value {
  position: absolute;
  left: 100%; /* 統一釘在長條右側外緣 */
  margin-left: 8px; /* 與長條保持固定安全距離 */
  font-size: 11px;
  font-weight: bold;
  color: #334155 !important; /* 統一使用深灰色字，在背景上非常清晰 */
  text-shadow: none;
  white-space: nowrap;
}
</style>

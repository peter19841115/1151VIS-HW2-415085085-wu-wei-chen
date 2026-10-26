<script setup>
// 1. 從 components 資料夾把三個圖表元件 import 進來
// import BarChart from './components/BarChart.vue'
// import LineChart from './components/LineChart.vue'
// import ScatterPlot from './components/ScatterPlot.vue'
// import test1 from './components/test1.vue';
// import test0 from './components/test0.vue';
import test2 from './components/test2.vue';
// import test3 from './components/test3.vue';
</script>

<template>
  <div style="padding: 20px;">
    
    <div class="chart-container">
      <!-- <BarChart />
      <LineChart />
      <ScatterPlot />
      <test1 />
      <test0 /> -->
      <test2 />
      <!-- <test3 /> -->
    </div>
  </div>
</template>

<style scoped>
.chart-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
</style>
<template>
  <div class="chart-wrapper">
    <div class="chart-header">
      <h2>2025 訪日旅客客源國比例分佈</h2>
      <p class="subtitle">總計約 4,268.3 萬人</p>
    </div>
    <!-- 圓餅圖掛載容器 -->
    <div ref="chartContainer" class="chart-container"></div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import * as d3 from 'd3';

const data = [
  { name: '南韓', value: 946.0 },
  { name: '中國', value: 909.6 },
  { name: '台灣', value: 676.3 },
  { name: '美國', value: 330.7 },
  { name: '香港', value: 251.7 },
  { name: '泰國', value: 123.3 },
  { name: '澳洲', value: 105.8 },
  { name: '菲律賓', value: 88.5 },
  { name: '新加坡', value: 72.6 },
  { name: '加拿大', value: 68.8 },
  { name: '馬來西亞', value: 63.7 },
  { name: '其他', value: 631.3 },
];

const chartContainer = ref(null);
const width = 640;
const height = 480;

const renderChart = () => {
  if (!chartContainer.value) return;
  chartContainer.value.innerHTML = '';

  const radius = Math.min(width, height) / 2 - 40;

  // 建立 SVG，預留周圍空間給外側的文字標籤
  const svg = d3.create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [-width / 2, -height / 2, width, height])
    .attr("style", "max-width: 100%; height: auto;");

  // 🎯 自訂排序：除了「其他」以外依數值大小排序，「其他」永遠排在最後面
  const sortedData = [...data].sort((a, b) => {
    if (a.name === '其他') return 1;
    if (b.name === '其他') return -1;
    return b.value - a.value;
  });

  const pie = d3.pie()
    .padAngle(0.02)
    .sort(null) // 保持我們排好的順序（不讓 d3 再次打亂）
    .value(d => d.value);

  const arc = d3.arc()
    .innerRadius(radius * 0.55)
    .outerRadius(radius * 0.85);

  // 專門給較小扇形外引線用的放大半徑
  const outerArc = d3.arc()
    .innerRadius(radius * 0.95)
    .outerRadius(radius * 0.95);

  const color = d3.scaleOrdinal()
    .domain(data.map(d => d.name))
    .range(d3.quantize(t => d3.interpolateSpectral(t * 0.8 + 0.1), data.length).reverse());

  const pieData = pie(sortedData);

  // 1. 繪製扇形圖塊
  svg.append("g")
    .selectAll("path")
    .data(pieData)
    .join("path")
      .attr("fill", d => color(d.data.name))
      .attr("d", arc)
      .attr("stroke", "white")
      .attr("stroke-width", "2px")
      .style("transition", "opacity 0.2s")
      .on("mouseover", function() { d3.select(this).style("opacity", 0.8); })
      .on("mouseout", function() { d3.select(this).style("opacity", 1.0); })
    .append("title")
      .text(d => `${d.data.name}: ${d.data.value.toLocaleString()}萬人`);

  // 2. 智慧標籤系統：大塊在內部、小塊拉到外部
  const textGroup = svg.append("g")
    .attr("font-family", "system-ui, -apple-system, sans-serif")
    .attr("font-size", 12);

  pieData.forEach(d => {
    // 計算扇形角度大小（弧度）
    const angleRange = d.endAngle - d.startAngle;
    const isLarge = angleRange > 0.35; // 角度大於約 20 度視為大塊

    if (isLarge) {
      // --- 狀況 A：空間足夠，直接顯示在扇形內部，加強字體對比 ---
      const pos = arc.centroid(d);
      const group = textGroup.append("g")
        .attr("transform", `translate(${pos})`);

      group.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "-0.3em")
        .attr("fill", "#0f172a")
        .attr("font-weight", "700")
        .text(d.data.name);

      group.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "1.1em")
        .attr("fill", "#334155")
        .attr("font-weight", "600")
        .text(`${d.data.value}萬`);
    } else {
      // --- 狀況 B：空間太小（塞不下），用折線引到外面顯示 ---
      const posA = arc.centroid(d);           // 扇形中心起點
      const posB = outerArc.centroid(d);      // 外側轉折點
      const midangle = d.startAngle + angleRange / 2;
      const posX = midangle < Math.PI ? radius * 1.05 : -radius * 1.05; // 決定文字靠右還是靠左
      const posC = [posX, posB[1]];

      const textAnchor = midangle < Math.PI ? "start" : "end";

      // 畫引線 (Polyline)
      textGroup.append("polyline")
        .attr("points", [posA, posB, posC])
        .attr("fill", "none")
        .attr("stroke", "#94a3b8")
        .attr("stroke-width", 1.5);

      // 畫外側小圓點
      textGroup.append("circle")
        .attr("cx", posC[0])
        .attr("cy", posC[1])
        .attr("r", 2.5)
        .attr("fill", color(d.data.name));

      // 放置國家名稱與數值
      const textNode = textGroup.append("text")
        .attr("transform", `translate(${posC[0] + (midangle < Math.PI ? 6 : -6)}, ${posC[1] + 4})`)
        .attr("text-anchor", textAnchor)
        .attr("font-size", 11);

      textNode.append("tspan")
        .attr("font-weight", "700")
        .attr("fill", "#0f172a")
        .text(`${d.data.name} `);

      textNode.append("tspan")
        .attr("fill", "#64748b")
        .attr("font-weight", "500")
        .text(`${d.data.value}萬`);
    }
  });

  chartContainer.value.appendChild(svg.node());
};

onMounted(() => {
  renderChart();
});
</script>

<style scoped>
.chart-wrapper {
  background: white;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 4px 25px rgba(0, 0, 0, 0.06);
  width: fit-content;
  margin: 0 auto;
  text-align: center;
}
.chart-header {
  margin-bottom: 10px;
}
h2 {
  color: #1e293b;
  margin: 0 0 4px 0;
  font-size: 1.25rem;
}
.subtitle {
  color: #64748b;
  font-size: 0.9rem;
  margin: 0;
}
.chart-container {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
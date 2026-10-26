<template>
  <div>
    <h2>一周氣溫 - Line Chart</h2>
    <svg ref="chart"></svg>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import * as d3 from "d3";

const chart = ref(null);

const data = [
  { month: "一", value: 30 },
  { month: "二", value: 33 },
  { month: "三", value: 38 },
  { month: "四", value: 22 },
  { month: "五", value: 35 },
  { month: "六", value: 25 },
  { month: "日", value: 19 }
];

onMounted(() => {

  const width = 600;
  const height = 400;

  const margin = {
    top: 20,
    right: 30,
    bottom: 50,
    left: 50
  };

  const svg = d3
    .select(chart.value)
    .attr("width", width)
    .attr("height", height);

  // X scale
  const x = d3
    .scalePoint()
    .domain(data.map(d => d.month))
    .range([margin.left, width - margin.right]);

  // Y scale
  const y = d3
    .scaleLinear()
    .domain([0, d3.max(data, d => d.value)])
    .nice()
    .range([height - margin.bottom, margin.top]);

  // Line generator
  const line = d3
    .line()
    .x(d => x(d.month))
    .y(d => y(d.value));

  // Draw line
  svg
    .append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 10)
    .attr("d", line);

  // Draw data points
  svg
    .selectAll("circle")
    .data(data)
    .join("circle")
    .attr("cx", d => x(d.month))
    .attr("cy", d => y(d.value))
    .attr("r", 15)
    .attr("fill", "orange");

  // X Axis
  svg
    .append("g")
    .attr(
      "transform",
      `translate(0,${height - margin.bottom})`
    )
    .call(d3.axisBottom(x));

  // Y Axis
  svg
    .append("g")
    .attr(
      "transform",
      `translate(${margin.left},0)`
    )
    .call(d3.axisLeft(y).tickFormat(d => d + "度"));
});
</script>
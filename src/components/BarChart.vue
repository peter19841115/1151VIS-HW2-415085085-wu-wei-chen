<template>
  <div>
    <h2>商品銷售 - Bar Chart</h2>
    <svg ref="chart"></svg>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import * as d3 from "d3";

const chart = ref(null);

const data = [
  { name: "商品1", value: 80 },
  { name: "商品2", value: 55 },
  { name: "商品3", value: 90 },
  { name: "商品4", value: 65 },
  { name: "商品5", value: 72 },
  { name: "商品6", value: 66 }
];

onMounted(() => {

  // 1. Chart size
  const width = 600;
  const height = 400;

  const margin = {
    top: 20,
    right: 20,
    bottom: 50,
    left: 50
  };

  // 2. Select SVG
  const svg = d3
    .select(chart.value)
    .attr("width", width)
    .attr("height", height);

  // 3. X scale
  const x = d3
    .scaleBand()
    .domain(data.map(d => d.name))
    .range([margin.left, width - margin.right])
    .padding(0.2);

  // 4. Y scale
  const y = d3
    .scaleLinear()
    .domain([0, 100])
    .range([height - margin.bottom, margin.top]);

  // 5. Draw bars
  svg
    .selectAll("rect")
    .data(data)
    .join("rect")
    .attr("x", d => x(d.name))
    .attr("y", d => y(d.value))
    .attr("width", x.bandwidth())
    .attr("height", d => y(0) - y(d.value))
    .attr("fill", "green");

  // 6. X Axis
  svg
    .append("g")
    .attr(
      "transform",
      `translate(0,${height - margin.bottom})`
    )
    .call(d3.axisBottom(x));

  // 7. Y Axis
  svg
    .append("g")
    .attr(
      "transform",
      `translate(${margin.left},0)`
    )
    .call(d3.axisLeft(y));
});
</script>
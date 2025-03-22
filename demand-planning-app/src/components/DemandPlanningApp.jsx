import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import trendline from "chartjs-plugin-trendline";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend, trendline);

const products = ["Agriculture", "Mesh", "Nails", "Stucco", "Wire"];
const productGroups = [
  "Rebar Tie Wire",
  "Bright Annealed Wire",
  "Galvanized Wire",
  "Bar Ties",
  "Mesh Panels",
];
const lastSalesMonths = ["Nov 2024", "Dec 2024", "Jan 2025", "Feb 2025"];
const forecastMonths = ["Mar 2025", "Apr 2025", "May 2025", "Jun 2025"];
const metrics = ["Backlog", "Forecast", "Absolute", "Final Forecast"];

const columnColors = {
  Backlog: "bg-blue-50",
  Forecast: "bg-blue-100",
  Absolute: "bg-blue-200",
  "Final Forecast": "bg-blue-300",
};

const getRandomSales = () => (Math.random() * 100 + 10).toFixed(1);
const getRandomForecast = () => (Math.random() * 50 + 5).toFixed(1);

const DemandPlanningApp = () => {
  const [expandedProduct, setExpandedProduct] = useState(null);
  const [groupSalesData, setGroupSalesData] = useState({});
  const [productSalesData, setProductSalesData] = useState({});
  const [forecastData, setForecastData] = useState({});

  useEffect(() => {
    const initialGroupSales = {};
    const initialProductSales = {};
    const initialForecast = {};

    for (const product of products) {
      initialGroupSales[product] = {};
      initialProductSales[product] = {};
      initialForecast[product] = {};

      for (const month of lastSalesMonths) {
        initialGroupSales[product][month] = {};
        let productTotal = 0;

        for (const group of productGroups) {
          const value = parseFloat(getRandomSales());
          initialGroupSales[product][month][group] = value;
          productTotal += value;
        }

        initialProductSales[product][month] = productTotal.toFixed(1);
      }

      for (const month of forecastMonths) {
        const groups = {};
        const totals = {};
        for (const metric of metrics) totals[metric] = 0;

        for (const group of productGroups) {
          groups[group] = {};
          for (const metric of metrics) {
            groups[group][metric] = "";
          }
        }

        initialForecast[product][month] = { groups, totals };
      }
    }

    setGroupSalesData(initialGroupSales);
    setProductSalesData(initialProductSales);
    setForecastData(initialForecast);
  }, []);

  const toggleAccordion = (product) => {
    setExpandedProduct((prev) => (prev === product ? null : product));
  };

  const handleGroupInputChange = (product, month, group, metric, value) => {
    setForecastData((prev) => {
      const updated = { ...prev };
      updated[product][month].groups[group][metric] = value;

      const total = productGroups.reduce((sum, grp) => {
        const num = parseFloat(updated[product][month].groups[grp][metric]);
        return sum + (isNaN(num) ? 0 : num);
      }, 0);

      updated[product][month].totals[metric] = total.toFixed(1);
      return updated;
    });
  };

  const loadSampleData = () => {
    const updated = { ...forecastData };
    for (const product of products) {
      for (const month of forecastMonths) {
        const totals = {};
        for (const metric of metrics) totals[metric] = 0;
        for (const group of productGroups) {
          for (const metric of metrics) {
            const val = getRandomForecast();
            updated[product][month].groups[group][metric] = val;
            totals[metric] += parseFloat(val);
          }
        }
        for (const metric of metrics) {
          updated[product][month].totals[metric] = totals[metric].toFixed(1);
        }
      }
    }
    setForecastData(updated);
  };

  const generateChartData = () => {
    const allMonths = [...lastSalesMonths, ...forecastMonths];
    const colorPalette = ["#EF4444", "#10B981", "#F59E0B", "#6366F1", "#14B8A6"];
  
    return {
      labels: allMonths,
      datasets: products.map((product, idx) => {
        const data = [];
  
        // Add static (Nov–Feb)
        for (const month of lastSalesMonths) {
          const groupData = groupSalesData[product]?.[month] || {};
          const total = productGroups.reduce((sum, group) => {
            const val = groupData[group];
            return sum + (isNaN(val) ? 0 : val);
          }, 0);
          data.push(Number.isFinite(total) ? parseFloat(total.toFixed(1)) : null);
        }
  
        // Add forecast (Mar–Jun)
        for (const month of forecastMonths) {
          const groupData = forecastData[product]?.[month]?.groups || {};
          const forecastSum = productGroups.reduce((sum, group) => {
            const values = groupData[group];
            return sum + (values
              ? metrics.reduce((s, key) => {
                  const num = parseFloat(values[key]);
                  return s + (isNaN(num) ? 0 : num);
                }, 0)
              : 0);
          }, 0);
          data.push(Number.isFinite(forecastSum) ? parseFloat(forecastSum.toFixed(1)) : null);
        }
  
        return {
          label: product,
          data,
          fill: false,
          tension: 0.3,
          borderColor: colorPalette[idx % colorPalette.length],
          backgroundColor: colorPalette[idx % colorPalette.length],
          trendlineLinear: {
            style: colorPalette[idx % colorPalette.length],
            lineStyle: "dotted",
            width: 1,
          },
        };
      }),
    };
  };
  

  return (
    <div className="p-6 min-h-screen bg-gray-100">
      {/* Toolbar */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <img
            src="https://www.scrapmonster.com/uploads/company_logo/2017/9/1505797707.webp"
            alt="Company Logo"
            className="h-10 w-auto rounded"
          />
          <h1 className="text-2xl font-bold text-slate-800">SLT Demand Review</h1>
          <button
            onClick={loadSampleData}
            className="ml-4 px-3 py-1 bg-blue-100 text-blue-800 border border-blue-300 rounded hover:bg-blue-200 text-sm"
          >
            Load Sample Data
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-auto rounded-xl shadow-md border border-gray-300 bg-white">
        <table className="min-w-[1400px] w-full table-fixed text-xs text-slate-700">
          <thead>
            <tr className="sticky top-0 z-10 bg-blue-100 text-gray-700 text-sm">
              <th className="text-left px-2 py-2 border w-48">Product</th>
              {lastSalesMonths.map((month) => (
                <th key={month} className="px-2 py-2 border text-center">
                  {month} Sales
                </th>
              ))}
              {forecastMonths.map((month) => (
                <th key={month} colSpan={4} className="px-2 py-2 border text-center bg-blue-50">
                  {month}
                </th>
              ))}
            </tr>
            <tr className="sticky top-[40px] z-10 bg-gray-100 text-slate-600 text-xs">
              <th></th>
              {lastSalesMonths.map(() => (
                <th key={crypto.randomUUID()}></th>
              ))}
              {forecastMonths.map(() =>
                metrics.map((metric) => (
                  <th
                    key={metric + Math.random()}
                    className={`px-1 py-1 border text-center ${columnColors[metric]}`}
                  >
                    {metric}
                  </th>
                ))
              )}
            </tr>
          </thead>

          <tbody>
            {products.map((product) => (
              <React.Fragment key={product}>
                <tr
                  className="odd:bg-white even:bg-gray-50 hover:bg-blue-50 transition cursor-pointer"
                  onClick={() => toggleAccordion(product)}
                >
                  <td className="px-2 py-2 border font-medium flex items-center gap-1">
                    {expandedProduct === product ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    {product}
                  </td>
                  {lastSalesMonths.map((month) => (
                    <td key={month} className="px-2 py-2 border text-center font-semibold">
                      {productSalesData[product]?.[month] || "-"} tons
                    </td>
                  ))}
                  {forecastMonths.map((month) =>
                    metrics.map((metric) => (
                      <td
                        key={`${product}-${month}-${metric}`}
                        className={`px-2 py-2 border text-center font-semibold ${columnColors[metric]}`}
                      >
                        {forecastData[product]?.[month]?.totals[metric] ?? "-"}
                      </td>
                    ))
                  )}
                </tr>
                

                <AnimatePresence>
                  {expandedProduct === product &&
                    productGroups.map((group) => (
                      <motion.tr
                        key={`${product}-${group}`}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="bg-gray-50"
                      >
                        <td className="px-4 py-1 border italic text-slate-600 pl-10">↳ {group}</td>
                        {lastSalesMonths.map((month) => (
                          <td key={month} className="border text-center">
                            {groupSalesData[product]?.[month]?.[group]?.toFixed(1) || "-"} tons
                          </td>
                        ))}
                        {forecastMonths.map((month) =>
                          metrics.map((metric) => (
                            <td
                              key={`${product}-${group}-${month}-${metric}`}
                              className={`border px-1 py-1 ${columnColors[metric]}`}
                            >
                              <input
                                type="number"
                                placeholder="-"
                                className="w-full text-center text-xs border rounded px-1 py-0.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-300"
                                value={
                                  forecastData[product]?.[month]?.groups[group]?.[metric] || ""
                                }
                                onChange={(e) =>
                                  handleGroupInputChange(
                                    product,
                                    month,
                                    group,
                                    metric,
                                    e.target.value
                                  )
                                }
                              />
                            </td>
                          ))
                        )}
                      </motion.tr>
                    ))}
                </AnimatePresence>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Chart */}
      <div className="mt-10 bg-white rounded-xl shadow-md p-6 border border-gray-300">
        <h2 className="text-lg font-semibold mb-4 text-slate-800">
          Forecast Totals by Product
        </h2>
        <Line
          data={generateChartData()}
          options={{
            responsive: true,
            plugins: {
              legend: {
                position: "bottom",
                labels: {
                  color: "#334155",
                  font: { size: 12 },
                },
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: { color: "#64748b" },
              },
              x: {
                ticks: { color: "#64748b" },
              },
            },
          }}
        />
      </div>
      {/* Embedded Zoho Analytics Report */}
<div className="mt-10 flex justify-center">
  <iframe
    frameBorder="0"
    width="100%"
    height="600"
    className="rounded border shadow-md"
    src="https://analytics.zoho.com/open-view/2622839000003704237"
    title="Zoho Analytics Dashboard"
  />
</div>

    </div>
  );
};

export default DemandPlanningApp;

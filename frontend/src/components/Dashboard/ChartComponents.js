import React from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { motion } from 'framer-motion';

// Color palette for consistent theming - ENTERPRISE STANDARD
const COLORS = {
  primary: '#3b82f6',    // primary-500
  secondary: '#f59e0b',  // secondary-500
  success: '#22c55e',    // success-500
  warning: '#f59e0b',    // warning-500
  error: '#ef4444',      // error-500
  info: '#06b6d4',       // cyan-500
  neutral: '#6b7280',     // neutral-500
};

const CHART_COLORS = [
  COLORS.primary,
  COLORS.secondary,
  COLORS.success,
  COLORS.warning,
  COLORS.error,
  COLORS.info,
  COLORS.neutral,
];

// Animation variants for charts
const chartVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label, labelFormatter }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-slate-200 rounded-xl shadow-elevation-3">
        <p className="font-medium text-slate-900">
          {labelFormatter ? labelFormatter(label) : label}
        </p>
        {payload.map((entry, index) => (
          <p key={index} className="text-body-regular" style={{ color: entry.color }}>
            {`${entry.name}: ${entry.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Line Chart Component
export const LineChartComponent = ({
  data,
  dataKey,
  xAxisKey = 'name',
  height = 300,
  showGrid = true,
  showLegend = true,
  color = COLORS.primary,
  labelFormatter,
  ...props
}) => (
  <motion.div
    variants={chartVariants}
    initial="hidden"
    animate="visible"
    className="w-full"
  >
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} {...props}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />}
        <XAxis
          dataKey={xAxisKey}
          stroke="#6B7280"
          fontSize={12}
        />
        <YAxis
          stroke="#6B7280"
          fontSize={12}
        />
        <Tooltip content={<CustomTooltip labelFormatter={labelFormatter} />} />
        {showLegend && <Legend />}
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2}
          dot={{ fill: color, strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: color, strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  </motion.div>
);

// Area Chart Component
export const AreaChartComponent = ({
  data,
  dataKey,
  xAxisKey = 'name',
  height = 300,
  showGrid = true,
  showLegend = true,
  color = COLORS.primary,
  labelFormatter,
  ...props
}) => (
  <motion.div
    variants={chartVariants}
    initial="hidden"
    animate="visible"
    className="w-full"
  >
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} {...props}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />}
        <XAxis
          dataKey={xAxisKey}
          stroke="#6B7280"
          fontSize={12}
        />
        <YAxis
          stroke="#6B7280"
          fontSize={12}
        />
        <Tooltip content={<CustomTooltip labelFormatter={labelFormatter} />} />
        {showLegend && <Legend />}
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          fill={color}
          fillOpacity={0.3}
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  </motion.div>
);

// Bar Chart Component
export const BarChartComponent = ({
  data,
  dataKey,
  xAxisKey = 'name',
  height = 300,
  showGrid = true,
  showLegend = true,
  color = COLORS.primary,
  labelFormatter,
  ...props
}) => (
  <motion.div
    variants={chartVariants}
    initial="hidden"
    animate="visible"
    className="w-full"
  >
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} {...props}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />}
        <XAxis
          dataKey={xAxisKey}
          stroke="#6B7280"
          fontSize={12}
        />
        <YAxis
          stroke="#6B7280"
          fontSize={12}
        />
        <Tooltip content={<CustomTooltip labelFormatter={labelFormatter} />} />
        {showLegend && <Legend />}
        <Bar
          dataKey={dataKey}
          fill={color}
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  </motion.div>
);

// Pie Chart Component
export const PieChartComponent = ({
  data,
  dataKey = 'value',
  nameKey = 'name',
  height = 300,
  showLegend = true,
  colors = CHART_COLORS,
  labelFormatter,
  ...props
}) => (
  <motion.div
    variants={chartVariants}
    initial="hidden"
    animate="visible"
    className="w-full"
  >
    <ResponsiveContainer width="100%" height={height}>
      <PieChart {...props}>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey={dataKey}
          nameKey={nameKey}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip labelFormatter={labelFormatter} />} />
        {showLegend && <Legend />}
      </PieChart>
    </ResponsiveContainer>
  </motion.div>
);

// Multi-line Chart Component
export const MultiLineChartComponent = ({
  data,
  lines = [],
  xAxisKey = 'name',
  height = 300,
  showGrid = true,
  showLegend = true,
  labelFormatter,
  ...props
}) => (
  <motion.div
    variants={chartVariants}
    initial="hidden"
    animate="visible"
    className="w-full"
  >
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} {...props}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />}
        <XAxis
          dataKey={xAxisKey}
          stroke="#6B7280"
          fontSize={12}
        />
        <YAxis
          stroke="#6B7280"
          fontSize={12}
        />
        <Tooltip content={<CustomTooltip labelFormatter={labelFormatter} />} />
        {showLegend && <Legend />}
        {lines.map((line, index) => (
          <Line
            key={line.dataKey}
            type="monotone"
            dataKey={line.dataKey}
            stroke={line.color || CHART_COLORS[index % CHART_COLORS.length]}
            strokeWidth={2}
            dot={{ fill: line.color || CHART_COLORS[index % CHART_COLORS.length], strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  </motion.div>
);

// Progress Chart Component for filing progress
export const ProgressChartComponent = ({
  data,
  height = 200,
  color = COLORS.primary,
  ...props
}) => (
  <motion.div
    variants={chartVariants}
    initial="hidden"
    animate="visible"
    className="w-full"
  >
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="horizontal" {...props}>
        <XAxis type="number" domain={[0, 100]} hide />
        <YAxis dataKey="name" type="category" width={80} fontSize={12} />
        <Tooltip
          formatter={(value) => [`${value}%`, 'Progress']}
          labelFormatter={(label) => `Step: ${label}`}
        />
        <Bar dataKey="progress" fill={color} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </motion.div>
);

// Metric Card Component
export const MetricCard = ({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  color = COLORS.primary,
  onClick,
  ...props
}) => {
  const changeColor = {
    positive: 'text-success-600',
    negative: 'text-error-600',
    neutral: 'text-neutral-600',
  }[changeType];

  return (
    <motion.div
      variants={chartVariants}
      initial="hidden"
      animate="visible"
      className={`bg-white rounded-xl shadow-elevation-2 border border-neutral-200 p-6 hover:shadow-elevation-3 transition-all duration-200 ${
        onClick ? 'cursor-pointer' : ''
      }`}
      onClick={onClick}
      {...props}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-body-regular font-medium text-neutral-600 mb-1">{title}</p>
          <p className="text-heading-2 font-bold text-neutral-900">{value}</p>
          {change && (
            <p className={`text-sm ${changeColor} flex items-center mt-1`}>
              <span className="mr-1">
                {changeType === 'positive' ? '↗' : changeType === 'negative' ? '↘' : '→'}
              </span>
              {change}
            </p>
          )}
        </div>
        {Icon && (
          <div className={'p-3 rounded-xl'} style={{ backgroundColor: `${color}20` }}>
            <Icon className="w-6 h-6" style={{ color }} />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export {
  COLORS,
  CHART_COLORS,
};

export default {
  LineChartComponent,
  AreaChartComponent,
  BarChartComponent,
  PieChartComponent,
  MultiLineChartComponent,
  ProgressChartComponent,
  MetricCard,
  COLORS,
  CHART_COLORS,
};

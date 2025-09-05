import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import type { PricePoint } from '../../types/crypto';
import { motion } from 'framer-motion';

export default function PriceChart({
  data,
  title = 'Bitcoin (7 days)',
}: {
  data: PricePoint[];
  title?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="neon-border rounded-2xl p-6"
      style={{
        background:
          'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0.28))',
      }}
    >
      <h2 className="mb-4 text-xl font-bold text-pink-400">{title}</h2>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 8, right: 12, left: 0, bottom: 6 }}
          >
            <CartesianGrid stroke="rgba(255,255,255,0.03)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={false}
            />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} />
            <Tooltip
              contentStyle={{
                background: 'rgba(5,8,15,0.95)',
                border: '1px solid rgba(34,211,238,0.28)',
              }}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke="rgba(34,211,238,1)"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6, fill: '#ec4899' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

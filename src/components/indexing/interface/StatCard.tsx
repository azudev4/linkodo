import { motion } from 'framer-motion';

interface StatCardProps {
  value: number;
  label: string;
  sublabel: string;
  colorScheme: 'blue' | 'green' | 'orange';
}

const colorSchemes = {
  blue: {
    bg: 'from-blue-50 to-white border-blue-100',
    text: 'text-blue-600'
  },
  green: {
    bg: 'from-green-50 to-white border-green-100',
    text: 'text-green-600'
  },
  orange: {
    bg: 'from-orange-50 to-white border-orange-100',
    text: 'text-orange-600'
  }
};

export function StatCard({ value, label, sublabel, colorScheme }: StatCardProps) {
  const colors = colorSchemes[colorScheme];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`space-y-2 p-4 rounded-xl bg-gradient-to-br ${colors.bg} border`}
    >
      <div className={`text-3xl font-bold ${colors.text}`}>
        {value.toLocaleString()}
      </div>
      <div className={`text-sm font-medium ${colors.text}`}>{label}</div>
      <div className="text-xs text-gray-500">
        {sublabel}
      </div>
    </motion.div>
  );
} 
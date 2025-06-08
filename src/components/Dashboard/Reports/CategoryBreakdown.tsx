import React, { useMemo, useState } from 'react';
import Card from '../../ui/Card';
import { Transaction, CategoryDefinition } from '../../../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { ArrowUpCircle, ArrowDownCircle, PieChart as PieChartIcon, List, LayoutList } from 'lucide-react';
import Button from '../../ui/Button';

interface CategoryBreakdownProps {
  transactions: Transaction[];
  categories: CategoryDefinition[];
}

interface CategoryStats {
  total: number;
  transactions: Transaction[];
}

interface CategoryNode {
  id: string;
  name: string;
  value: number;
  percentage: number;
  color: string;
  trend: 'up' | 'down' | 'stable';
  isParent: boolean;
  parentId?: string;
  children: CategoryNode[];
}

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8',
  '#82CA9D', '#FDB462', '#FB8072', '#B3DE69', '#FCCDE5'
];

const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({ transactions, categories }) => {
  const [viewMode, setViewMode] = useState<'pie' | 'tree' | 'flat'>('tree');
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  // Move getTrendForCategory to the top level so it's available everywhere
  const getTrendForCategory = (transactions: Transaction[]): 'up' | 'down' | 'stable' => {
    const sortedTransactions = [...transactions].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    if (sortedTransactions.length >= 2) {
      const firstAmount = Math.abs(sortedTransactions[0].amount);
      const lastAmount = Math.abs(sortedTransactions[sortedTransactions.length - 1].amount);
      if (lastAmount > firstAmount * 1.1) return 'up';
      if (lastAmount < firstAmount * 0.9) return 'down';
    }
    return 'stable';
  };

  const { categoryStats, categoryNodes } = useMemo(() => {
    // Group transactions by category and calculate stats
    const stats = transactions.reduce((acc, t) => {
      if (!acc[t.category]) {
        acc[t.category] = { total: 0, transactions: [] };
      }
      acc[t.category].total += Math.abs(t.amount);
      acc[t.category].transactions.push(t);

      // Handle split transactions
      if (t.isSplit && t.splits) {
        t.splits.forEach(split => {
          if (!acc[split.category]) {
            acc[split.category] = { total: 0, transactions: [] };
          }
          acc[split.category].total += Math.abs(split.amount);
          acc[split.category].transactions.push({
            ...t,
            amount: split.amount,
            category: split.category
          });
        });
      }

      return acc;
    }, {} as Record<string, CategoryStats>);

    // Calculate total spending
    const totalSpending = Object.values(stats).reduce((sum, { total }) => sum + total, 0);

    // Build category tree
    const buildCategoryTree = (parentId: string | null): CategoryNode[] => {
      return categories
        .filter(c => !c.isArchived && (parentId ? c.parentId === parentId : !c.parentId))
        .map(category => {
          const children = buildCategoryTree(category.id);
          const categoryTotal = (stats[category.id]?.total || 0) +
            children.reduce((sum, child) => sum + child.value, 0);

          // Calculate trend
          const catTransactions = stats[category.id]?.transactions || [];
          const trend = getTrendForCategory(catTransactions);

          return {
            id: category.id,
            name: category.name,
            value: categoryTotal,
            percentage: totalSpending > 0 ? (categoryTotal / totalSpending) * 100 : 0,
            color: category.color || '#CBD5E1',
            trend,
            isParent: !category.parentId,
            parentId: category.parentId,
            children
          };
        })
        .filter(node => node.value > 0)
        .sort((a, b) => b.value - a.value);
    };

    const nodes = buildCategoryTree(null);
    return { categoryStats: stats, categoryNodes: nodes };
  }, [transactions, categories, getTrendForCategory]); // Added getTrendForCategory to dependencies

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const renderTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') {
      return <ArrowUpCircle className="text-red-500" size={16} />;
    } else if (trend === 'down') {
      return <ArrowDownCircle className="text-green-500" size={16} />;
    }
    return null;
  };

  const renderTreeView = (nodes: CategoryNode[], level = 0) => {
    return nodes.map(node => (
      <React.Fragment key={node.id}>
        <div 
          className={`flex items-center justify-between py-2 ${level > 0 ? 'ml-6' : ''}`}
          style={{ opacity: level === 0 ? 1 : 0.9 }}
        >
          <div className="flex items-center gap-2">
            {node.children.length > 0 && (
              <button
                onClick={() => toggleCategory(node.id)}
                className="w-4 h-4 flex items-center justify-center text-gray-500"
              >
                {expandedCategories.includes(node.id) ? '▼' : '▶'}
              </button>
            )}
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: node.color }} 
            />
            <span className={level === 0 ? 'font-medium' : ''}>
              {node.name}
            </span>
            {renderTrendIcon(node.trend)}
          </div>
          <div className="text-right">
            <span className={`font-medium ${level === 0 ? '' : 'text-sm text-gray-600 dark:text-gray-400'}`}>
              {node.percentage.toFixed(1)}%
            </span>
            <div className="text-xs text-gray-500">
              {formatCurrency(node.value)}
            </div>
          </div>
        </div>
        {expandedCategories.includes(node.id) && node.children.length > 0 && (
          <div className="ml-4 border-l-2 border-gray-200 dark:border-gray-700">
            {renderTreeView(node.children, level + 1)}
          </div>
        )}
      </React.Fragment>
    ));
  };

  const renderFlatView = () => {
    const flattenNodes = (nodes: CategoryNode[]): CategoryNode[] => {
      return nodes.reduce<CategoryNode[]>((flat, node) => {
        flat.push(node);
        if (node.children.length > 0) {
          flat.push(...flattenNodes(node.children));
        }
        return flat;
      }, []);
    };

    return flattenNodes(categoryNodes).map((category, index) => {
      const transactions = categoryStats[category.id]?.transactions || [];
      const monthlyAvg = transactions.length > 0
        ? transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0) / 
          Math.max(1, Math.ceil(transactions.length / 30))
        : 0;

      return (
        <div 
          key={category.id} 
          className={`flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm ${!category.isParent ? 'ml-6' : ''}`}
          title={`Monthly Average: ${formatCurrency(monthlyAvg)}`}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: category.color }} 
            />
            <div>
              <span className={`${!category.isParent ? 'text-sm text-gray-600 dark:text-gray-400' : 'font-medium'}`}>
                {category.name}
              </span>
              <div className="text-xs text-gray-500">
                Monthly Avg: {formatCurrency(monthlyAvg)}
              </div>
            </div>
            {category.isParent && renderTrendIcon(category.trend)}
          </div>
          <div className="text-right">
            <span className={`${!category.isParent ? 'text-sm' : 'font-medium'}`}>
              {category.percentage.toFixed(1)}%
            </span>
            <div className="text-xs text-gray-500">
              {formatCurrency(category.value)}
            </div>
          </div>
        </div>
      );
    });
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">
          Category Breakdown
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
            (with subcategories)
          </span>
        </h3>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'pie' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('pie')}
            icon={<PieChartIcon size={16} />}
          >
            Chart
          </Button>
          <Button
            variant={viewMode === 'tree' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('tree')}
            icon={<List size={16} />}
          >
            Tree
          </Button>
          <Button
            variant={viewMode === 'flat' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('flat')}
            icon={<LayoutList size={16} />}
          >
            Flat
          </Button>
        </div>
      </div>

      {viewMode === 'pie' && (
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryNodes.filter(n => n.isParent)}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                nameKey="name"
                label={({ name, percentage }) => `${name} (${percentage.toFixed(1)}%)`}
              >
                {categoryNodes.filter(n => n.isParent).map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`}
                    fill={entry.color || COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [
                  formatCurrency(value),
                  name
                ]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className={`mt-4 space-y-2 ${viewMode === 'pie' ? 'border-t pt-4' : ''}`}>
        {viewMode === 'tree' ? (
          renderTreeView(categoryNodes)
        ) : viewMode === 'flat' ? (
          <div className="space-y-2">
            {renderFlatView()}
          </div>
        ) : null}
      </div>
    </Card>
  );
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export default CategoryBreakdown;
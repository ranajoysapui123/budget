import React, { useState } from 'react';
import { useApp } from '../../../contexts/AppContext';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import Select from '../../ui/Select';
import { Download, PieChart } from 'lucide-react';
import { ReportOptions, TransactionType, MainCategory, CategoryDefinition } from '../../../types';
import { generatePDFReport, generateCSVReport } from '../../../utils/reports';
import TransactionChart from './TransactionChart';
import CategoryBreakdown from './CategoryBreakdown';

const Reports: React.FC = () => {
  const { filteredTransactions, user } = useApp();
  const [reportOptions, setReportOptions] = useState<ReportOptions>({
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    types: ['income', 'expense', 'investment'],
    mainCategories: ['personal', 'business', 'family'],
    format: 'pdf',
    includeCharts: true,
    includeScreenshots: false
  });

  const handleDownload = async () => {
    const exportData = {
      transactions: filteredTransactions,
      categories: user.categories,
      dateRange: {
        startDate: reportOptions.startDate,
        endDate: reportOptions.endDate
      },
      summary: {
        totalIncome: filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
        totalExpenses: filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
        totalInvestments: filteredTransactions.filter(t => t.type === 'investment').reduce((sum, t) => sum + t.amount, 0),
        netBalance: 0,
        categorySummary: {}
      }
    };

    // Calculate net balance
    exportData.summary.netBalance = 
      exportData.summary.totalIncome - 
      exportData.summary.totalExpenses - 
      exportData.summary.totalInvestments;

    // Generate category summary including split transactions and subcategories
    exportData.summary.categorySummary = filteredTransactions.reduce((acc: Record<string, number>, t) => {
      const category = user.categories.find(c => c.id === t.category);
      if (!category) return acc;

      // Always add to the direct category
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      
      // Handle split transactions
      if (t.isSplit && t.splits) {
        t.splits.forEach(split => {
          const splitCategory = user.categories.find(c => c.id === split.category);
          if (!splitCategory) return;
          acc[split.category] = (acc[split.category] || 0) + split.amount;
        });
      }
      return acc;
    }, {});

    if (reportOptions.format === 'pdf') {
      await generatePDFReport(exportData);
    } else {
      generateCSVReport(exportData);
    }
  };

  return (
    <Card className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
          <PieChart size={18} className="mr-2" />
          Financial Reports
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Input
          label="Start Date"
          type="date"
          value={reportOptions.startDate}
          onChange={(value) => setReportOptions({ ...reportOptions, startDate: value })}
        />
        <Input
          label="End Date"
          type="date"
          value={reportOptions.endDate}
          onChange={(value) => setReportOptions({ ...reportOptions, endDate: value })}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Select
          label="Transaction Types"
          value={reportOptions.types.join(',')}
          onChange={(value) => setReportOptions({ ...reportOptions, types: value.split(',') as TransactionType[] })}
          options={[
            { value: 'income,expense,investment', label: 'All Types' },
            { value: 'income', label: 'Income Only' },
            { value: 'expense', label: 'Expenses Only' },
            { value: 'investment', label: 'Investments Only' }
          ]}
        />
        <Select
          label="Main Categories"
          value={reportOptions.mainCategories.join(',')}
          onChange={(value) => setReportOptions({ ...reportOptions, mainCategories: value.split(',') as MainCategory[] })}
          options={[
            { value: 'personal,business,family', label: 'All Categories' },
            { value: 'personal', label: 'Personal Only' },
            { value: 'business', label: 'Business Only' },
            { value: 'family', label: 'Family Only' }
          ]}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Select
          label="Report Format"
          value={reportOptions.format}
          onChange={(value) => setReportOptions({ ...reportOptions, format: value as 'pdf' | 'csv' })}
          options={[
            { value: 'pdf', label: 'PDF Report' },
            { value: 'csv', label: 'CSV Export' }
          ]}
        />
        <div className="flex flex-col space-y-2 mt-8">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="includeCharts"
              checked={reportOptions.includeCharts}
              onChange={(e) => setReportOptions({ ...reportOptions, includeCharts: e.target.checked })}
              className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
            />
            <label htmlFor="includeCharts" className="ml-2 block text-sm text-gray-900 dark:text-gray-100">
              Include charts in report
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="includeScreenshots"
              checked={reportOptions.includeScreenshots}
              onChange={(e) => setReportOptions({ ...reportOptions, includeScreenshots: e.target.checked })}
              className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
            />
            <label htmlFor="includeScreenshots" className="ml-2 block text-sm text-gray-900 dark:text-gray-100">
              Include reference screenshots
            </label>
          </div>
        </div>
      </div>

      <div className="space-y-6 mb-6">
        <CategoryBreakdown 
          transactions={filteredTransactions.filter(t => t.type === 'income')}
          categories={user.categories}
        />
        <CategoryBreakdown 
          transactions={filteredTransactions.filter(t => t.type === 'expense')}
          categories={user.categories}
        />
        <CategoryBreakdown 
          transactions={filteredTransactions.filter(t => t.type === 'investment')}
          categories={user.categories}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <TransactionChart
          transactions={filteredTransactions.filter(t => t.type === 'expense')}
          startDate={reportOptions.startDate}
          endDate={reportOptions.endDate}
          categories={user.categories}
        />
        <TransactionChart
          transactions={filteredTransactions.filter(t => t.type === 'income')}
          startDate={reportOptions.startDate}
          endDate={reportOptions.endDate}
          categories={user.categories}
        />
      </div>

      <div className="flex justify-end">
        <Button
          variant="primary"
          onClick={handleDownload}
          icon={<Download size={16} />}
        >
          Download Report
        </Button>
      </div>
    </Card>
  );
};

export default Reports;
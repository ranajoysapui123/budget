import React, { useState } from 'react';
import Button from '../components/ui/Button';
import ReportTemplateManager from '../components/Dashboard/Reports/ReportTemplateManager';
import ComparisonReport from '../components/Dashboard/Reports/ComparisonReport';
import { FileText, TrendingUp } from 'lucide-react';
import AnalyzeReportButton from '../components/Dashboard/Reports/AnalyzeReportButton';
import { useApp } from '../contexts/AppContext';
import { Transaction } from '../types';

const Reports: React.FC = () => {
  const { transactions } = useApp();
  const [activeTab, setActiveTab] = useState<'templates' | 'comparison'>('templates');
  const [selectedTransactions, setSelectedTransactions] = useState<Transaction[]>([]);
  const [dateRange, setDateRange] = useState<{ startDate: string; endDate: string }>({
    startDate: '',
    endDate: ''
  });

  const handleTransactionsSelected = (transactions: Transaction[], startDate: string, endDate: string) => {
    setSelectedTransactions(transactions);
    setDateRange({ startDate, endDate });
  };

  return (
    <div className="space-y-8 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Financial Reports</h1>
        <div className="flex space-x-4">
          <AnalyzeReportButton 
            transactions={selectedTransactions}
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
          />
        </div>
      </div>

      <div className="mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-4">
            <Button
              variant={activeTab === 'templates' ? 'primary' : 'outline'}
              onClick={() => setActiveTab('templates')}
              icon={<FileText size={16} />}
            >
              Report Templates
            </Button>
            <Button
              variant={activeTab === 'comparison' ? 'primary' : 'outline'}
              onClick={() => setActiveTab('comparison')}
              icon={<TrendingUp size={16} />}
            >
              Period Comparison
            </Button>
          </nav>
        </div>
      </div>

      <div className="space-y-6">
        {activeTab === 'templates' && <ReportTemplateManager />}
        {activeTab === 'comparison' && (
          <ComparisonReport 
            onTransactionsSelected={handleTransactionsSelected}
          />
        )}
      </div>
    </div>
  );
};

export default Reports;
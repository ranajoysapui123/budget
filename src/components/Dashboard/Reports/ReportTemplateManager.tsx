import React, { useState } from 'react';
import { useApp } from '../../../contexts/AppContext';
import { useNotification } from '../../../contexts/NotificationContext';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import { FileText, FileSpreadsheet } from 'lucide-react';
import { generatePDFReport, generateCSVReport, generateExcelReport } from '../../../utils/reports';
import { detectCurrency } from '../../../utils/helpers';
import Input from '../../ui/Input';
import Select from '../../ui/Select';

const ReportTemplateManager: React.FC = () => {
  const { user, filteredTransactions } = useApp();
  const { showNotification } = useNotification();
  const [exportFormat, setExportFormat] = useState<'pdf' | 'csv' | 'excel'>('pdf');
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10)
  });

  const validateCurrency = () => {
    const detectedPatterns = detectCurrency(filteredTransactions);
    if (detectedPatterns.length > 0) {
      const mostLikelyCurrency = detectedPatterns[0];
      if (mostLikelyCurrency.currency !== user.settings.currency && mostLikelyCurrency.confidence > 70) {
        showNotification({          type: 'info',
          message: `Notice: Your transactions appear to be in ${mostLikelyCurrency.currency}, but your settings use ${user.settings.currency}. This may affect report accuracy.`,
          duration: 8000
        });
        return false;
      }
    }
    return true;
  };

  const handleExport = () => {
    // Validate date range
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);
    if (startDate > endDate) {
      showNotification({
        type: 'error',
        message: 'Start date cannot be after end date',
        duration: 4000
      });
      return;
    }

    // Currency validation
    const isCurrencyValid = validateCurrency();
    if (!isCurrencyValid) {
      // Still allow export but user has been warned
    }

    // Filter transactions by date range
    const periodTransactions = filteredTransactions.filter(t => {
      const date = new Date(t.date);
      return date >= startDate && date <= endDate;
    });

    if (periodTransactions.length === 0) {
      showNotification({
        type: 'info',
        message: 'No transactions found in the selected date range',
        duration: 4000
      });
      return;
    }

    // Prepare export data
    const exportData = {
      transactions: periodTransactions,
      categories: user.categories,
      summary: {
        totalIncome: periodTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
        totalExpenses: periodTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
        totalInvestments: periodTransactions.filter(t => t.type === 'investment').reduce((sum, t) => sum + t.amount, 0),
        netBalance: 0,
        categorySummary: {}
      },
      dateRange
    };

    // Calculate net balance
    exportData.summary.netBalance = 
      exportData.summary.totalIncome - 
      exportData.summary.totalExpenses - 
      exportData.summary.totalInvestments;

    // Generate category summary including split transactions
    exportData.summary.categorySummary = periodTransactions.reduce((acc, t) => {
      // Add main transaction amount to category
      acc[t.category] = (acc[t.category] || 0) + t.amount;

      // Add split transaction amounts
      if (t.isSplit && t.splits) {
        t.splits.forEach(split => {
          acc[split.category] = (acc[split.category] || 0) + split.amount;
        });
      }

      return acc;
    }, {} as Record<string, number>);

    try {
      switch (exportFormat) {
        case 'pdf':
          generatePDFReport(exportData);
          break;
        case 'csv':
          generateCSVReport(exportData);
          break;
        case 'excel':
          generateExcelReport(exportData);
          break;
      }

      showNotification({
        type: 'success',
        message: `Report successfully exported as ${exportFormat.toUpperCase()}`,
        duration: 4000
      });
    } catch (error) {
      console.error('Export error:', error);
      showNotification({
        type: 'error',
        message: 'Failed to export report. Please try again.',
        duration: 4000
      });
    }
  };

  return (
    <Card>
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Export Report</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Start Date"
            type="date"
            value={dateRange.startDate}
            onChange={(value) => setDateRange(prev => ({ ...prev, startDate: value }))}
          />
          <Input
            label="End Date"
            type="date"
            value={dateRange.endDate}
            onChange={(value) => setDateRange(prev => ({ ...prev, endDate: value }))}
          />
        </div>

        <div>
          <Select
            label="Export Format"
            value={exportFormat}
            onChange={(value) => setExportFormat(value as 'pdf' | 'csv' | 'excel')}
            options={[
              { value: 'pdf', label: 'PDF Document' },
              { value: 'csv', label: 'CSV Spreadsheet' },
              { value: 'excel', label: 'Excel Spreadsheet' }
            ]}
          />
        </div>

        <div className="flex justify-end space-x-4">
          <Button
            variant="primary"
            onClick={handleExport}            icon={
              exportFormat === 'pdf' ? <FileText size={16} /> :
              exportFormat === 'csv' ? <FileText size={16} /> :
              <FileSpreadsheet size={16} />
            }
          >
            Export Report
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ReportTemplateManager;
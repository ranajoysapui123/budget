import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { utils as XLSXUtils, writeFile } from 'xlsx';
import 'jspdf-autotable';
import { Transaction, User } from '../types';
import { formatCurrency, formatDate, getCategoryDisplayName } from './helpers';

interface ExportableData {
  transactions: Transaction[];
  categories: User['categories'];
  summary: {
    totalIncome: number;
    totalExpenses: number;
    totalInvestments: number;
    netBalance: number;
    categorySummary: Record<string, number>;
  };
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

export const generateSummary = (transactions: Transaction[]): ExportableData['summary'] => {
  const summary = {
    totalIncome: 0,
    totalExpenses: 0,
    totalInvestments: 0,
    netBalance: 0,
    categorySummary: {} as Record<string, number>
  };

  transactions.forEach(t => {
    switch (t.type) {
      case 'income':
        summary.totalIncome += t.amount;
        break;
      case 'expense':
        summary.totalExpenses += t.amount;
        break;
      case 'investment':
        summary.totalInvestments += t.amount;
        break;
    }

    // Handle main transaction category
    summary.categorySummary[t.category] = (summary.categorySummary[t.category] || 0) + t.amount;

    // Handle split transactions
    if (t.isSplit && t.splits) {
      t.splits.forEach(split => {
        summary.categorySummary[split.category] = (summary.categorySummary[split.category] || 0) + split.amount;
      });
    }
  });

  summary.netBalance = summary.totalIncome - summary.totalExpenses - summary.totalInvestments;
  return summary;
};

export const generatePDFReport = async (data: ExportableData): Promise<void> => {
  const doc = new jsPDF() as jsPDF & { lastAutoTable?: { finalY: number } };
  
  // Add header
  doc.setFontSize(20);
  doc.text('Financial Report', 14, 20);
  
  // Add date range
  doc.setFontSize(12);
  doc.text(`Period: ${formatDate(data.dateRange.startDate)} - ${formatDate(data.dateRange.endDate)}`, 14, 30);
  
  // Add summary section
  doc.text('Summary', 14, 45);
  const summaryData = [
    ['Total Income:', formatCurrency(data.summary.totalIncome)],
    ['Total Expenses:', formatCurrency(data.summary.totalExpenses)],
    ['Total Investments:', formatCurrency(data.summary.totalInvestments)],
    ['Net Balance:', formatCurrency(data.summary.netBalance)]
  ];

  autoTable(doc, {
    startY: 50,
    head: [['Category', 'Amount']],
    body: summaryData,
    theme: 'striped',
    headStyles: { fillColor: [41, 128, 185] },
  });

  // Add category breakdown
  const categoryY = doc.lastAutoTable?.finalY || 120;
  doc.text('Category Breakdown', 14, categoryY + 10);

  // Organize data by main categories and subcategories
  const categoryGroups: Record<string, { name: string; total: number; subs: { name: string; amount: number }[] }> = {};
  
  Object.entries(data.summary.categorySummary).forEach(([categoryId, amount]) => {
    const category = data.categories.find(c => c.id === categoryId);
    if (!category) return;

    if (category.parentId) {
      // This is a subcategory
      const parent = data.categories.find(c => c.id === category.parentId);
      if (!parent) return;

      if (!categoryGroups[parent.id]) {
        categoryGroups[parent.id] = {
          name: parent.name,
          total: 0,
          subs: []
        };
      }
      categoryGroups[parent.id].subs.push({
        name: category.name,
        amount
      });
      categoryGroups[parent.id].total += amount;
    } else {
      // This is a main category
      if (!categoryGroups[category.id]) {
        categoryGroups[category.id] = {
          name: category.name,
          total: amount,
          subs: []
        };
      } else {
        categoryGroups[category.id].total += amount;
      }
    }
  });

  const categoryData = Object.values(categoryGroups)
    .sort((a, b) => b.total - a.total)
    .flatMap(group => {
      const rows = [[
        group.name,
        formatCurrency(group.total)
      ]];

      // Add subcategories
      group.subs.sort((a, b) => b.amount - a.amount)
        .forEach(sub => {
          rows.push([
            `  └ ${sub.name}`,
            formatCurrency(sub.amount)
          ]);
        });

      return rows;
    });

  autoTable(doc, {
    startY: categoryY + 15,
    head: [['Category', 'Total Amount']],
    body: categoryData,
    theme: 'striped',
    headStyles: { fillColor: [41, 128, 185] },
  });

  // Add transactions table
  const transactionsY = doc.lastAutoTable?.finalY || 180;
  doc.text('Transaction Details', 14, transactionsY + 10);

  const transactionRows = data.transactions.flatMap(t => {
    const getFullCategoryName = (categoryId: string) => {
      const category = data.categories.find(c => c.id === categoryId);
      if (!category) return 'Unknown';
      
      if (category.parentId) {
        const parent = data.categories.find(c => c.id === category.parentId);
        return parent ? `${parent.name} > ${category.name}` : category.name;
      }
      
      return category.name;
    };

    const rows = [[
      formatDate(t.date),
      t.description,
      getFullCategoryName(t.category),
      t.type,
      formatCurrency(t.amount)
    ]];

    if (t.isSplit && t.splits) {
      t.splits.forEach(split => {
        rows.push([
          '',
          `└ ${split.description || 'Split portion'}`,
          getFullCategoryName(split.category),
          'split',
          formatCurrency(split.amount)
        ]);
      });
    }

    return rows;
  });

  autoTable(doc, {
    startY: transactionsY + 15,
    head: [['Date', 'Description', 'Category', 'Type', 'Amount']],
    body: transactionRows,
    theme: 'striped',
    headStyles: { fillColor: [41, 128, 185] },
    styles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 30 },
      3: { cellWidth: 25 },
      4: { cellWidth: 25 }
    }
  });

  doc.save('financial-report.pdf');
};

export const generateCSVReport = (data: ExportableData): void => {
  // First generate the summary and category breakdown
  const summaryRows = [
    'Financial Summary',
    `Period: ${formatDate(data.dateRange.startDate)} - ${formatDate(data.dateRange.endDate)}`,
    '',
    'Overview',
    `Total Income,${formatCurrency(data.summary.totalIncome)}`,
    `Total Expenses,${formatCurrency(data.summary.totalExpenses)}`,
    `Total Investments,${formatCurrency(data.summary.totalInvestments)}`,
    `Net Balance,${formatCurrency(data.summary.netBalance)}`,
    '',
    'Category Breakdown'
  ];

  // Organize categories by main category and subcategories
  const categoryGroups: Record<string, { name: string; total: number; subs: { name: string; amount: number }[] }> = {};
  
  Object.entries(data.summary.categorySummary).forEach(([categoryId, amount]) => {
    const category = data.categories.find(c => c.id === categoryId);
    if (!category) return;

    if (category.parentId) {
      // This is a subcategory
      const parent = data.categories.find(c => c.id === category.parentId);
      if (!parent) return;

      if (!categoryGroups[parent.id]) {
        categoryGroups[parent.id] = { name: parent.name, total: 0, subs: [] };
      }
      categoryGroups[parent.id].subs.push({ name: category.name, amount });
      categoryGroups[parent.id].total += amount;
    } else {
      // This is a main category
      if (!categoryGroups[category.id]) {
        categoryGroups[category.id] = { name: category.name, total: amount, subs: [] };
      } else {
        categoryGroups[category.id].total += amount;
      }
    }
  });

  // Add category breakdown to summary
  Object.values(categoryGroups)
    .sort((a, b) => b.total - a.total)
    .forEach(group => {
      summaryRows.push(`${group.name},${formatCurrency(group.total)}`);
      
      // Add subcategories
      group.subs
        .sort((a, b) => b.amount - a.amount)
        .forEach(sub => {
          summaryRows.push(`  └ ${sub.name},${formatCurrency(sub.amount)}`);
        });
    });

  summaryRows.push('', '', 'Transaction Details');

  // Add transaction details
  const headers = [
    'Date',
    'Description',
    'Category',
    'Type',
    'Amount',
    'Split',
    'Split Description',
    'Split Category',
    'Split Amount'
  ];

  const getFullCategoryName = (categoryId: string) => {
    const category = data.categories.find(c => c.id === categoryId);
    if (!category) return 'Unknown';
    
    if (category.parentId) {
      const parent = data.categories.find(c => c.id === category.parentId);
      return parent ? `${parent.name} > ${category.name}` : category.name;
    }
    
    return category.name;
  };

  const transactionRows = data.transactions.map(t => {
    const splitInfo = t.isSplit && t.splits
      ? t.splits.map(s => 
          `${s.description || 'Split portion'},${getFullCategoryName(s.category)},${formatCurrency(s.amount)}`
        ).join(';')
      : ',,';

    return [
      formatDate(t.date),
      `"${t.description.replace(/"/g, '""')}"`,
      getFullCategoryName(t.category),
      t.type,
      formatCurrency(t.amount),
      t.isSplit ? 'Yes' : 'No',
      splitInfo
    ].join(',');
  });

  const allRows = [
    ...summaryRows,
    headers.join(','),
    ...transactionRows
  ].join('\n');

  const blob = new Blob([allRows], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'financial-report.csv';
  link.click();
};

export const generateExcelReport = (data: ExportableData): void => {
  // Create workbook with multiple sheets
  const workbook = XLSXUtils.book_new();
  
  // Summary sheet
  const summaryData = [
    ['Financial Summary'],
    [],
    ['Period:', `${formatDate(data.dateRange.startDate)} - ${formatDate(data.dateRange.endDate)}`],
    [],
    ['Total Income:', formatCurrency(data.summary.totalIncome)],
    ['Total Expenses:', formatCurrency(data.summary.totalExpenses)],
    ['Total Investments:', formatCurrency(data.summary.totalInvestments)],
    ['Net Balance:', formatCurrency(data.summary.netBalance)],
    [],
    ['Category Breakdown'],
    ['Category', 'Amount']
  ];

  // Add category breakdown
  Object.entries(data.summary.categorySummary)
    .sort(([, a], [, b]) => b - a)
    .forEach(([category, amount]) => {
      summaryData.push([getCategoryDisplayName(category), formatCurrency(amount)]);
    });

  const summarySheet = XLSXUtils.aoa_to_sheet(summaryData);
  XLSXUtils.book_append_sheet(workbook, summarySheet, 'Summary');

  // Transactions sheet
  const transactionHeaders = [
    'Date',
    'Description',
    'Amount',
    'Type',
    'Category',
    'Main Category',
    'Split',
    'Split Description',
    'Split Category',
    'Split Amount'
  ];

  const transactionData = [transactionHeaders];

  data.transactions.forEach(t => {
    const row = [
      formatDate(t.date),
      t.description,
      t.amount.toString(),
      t.type,
      getCategoryDisplayName(t.category),
      t.mainCategory || '',
      t.isSplit ? 'Yes' : 'No'
    ];

    if (!t.isSplit || !t.splits) {
      row.push('', '', '');
      transactionData.push(row);
    } else {
      // Add main transaction row
      row.push('', '', '');
      transactionData.push(row);

      // Add split rows
      t.splits.forEach(split => {
        transactionData.push([
          '', // date
          '', // description
          '', // amount
          '', // type
          '', // category
          '', // main category
          '', // split
          split.description || 'Split portion',
          getCategoryDisplayName(split.category),
          formatCurrency(split.amount)
        ]);
      });
    }
  });

  const transactionSheet = XLSXUtils.aoa_to_sheet(transactionData);

  // Set column widths
  const columnWidths = [
    { wch: 12 }, // Date
    { wch: 40 }, // Description
    { wch: 12 }, // Amount
    { wch: 12 }, // Type
    { wch: 15 }, // Category
    { wch: 15 }, // Main Category
    { wch: 8 },  // Split
    { wch: 40 }, // Split Description
    { wch: 15 }, // Split Category
    { wch: 12 }  // Split Amount
  ];
  transactionSheet['!cols'] = columnWidths;

  XLSXUtils.book_append_sheet(workbook, transactionSheet, 'Transactions');

  // Save workbook
  writeFile(workbook, 'financial-report.xlsx');
};
'use client';

import { useState } from 'react';
import { Article } from '@/types';
import { DateDisplay } from './DateDisplay';
import { ChevronUpIcon, ChevronDownIcon, ArrowsUpDownIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { RefreshButton } from './RefreshButton';

interface ArticleWithScore extends Article {
  aiRelevanceScore?: number;
  aiRelevanceReason?: string;
}

interface TabViewProps {
  articles: ArticleWithScore[];
  onRefresh?: () => void;
  bankCode?: string;
}

interface Column {
  key: 'bankCode' | 'aiRelevanceScore' | 'publishDate' | 'title' | 'summary';
  label: string;
  width?: string;
  sortable?: boolean;
  render: (article: ArticleWithScore) => React.ReactNode;
}

const BANKS = [
  { code: 'RBC', name: 'Royal Bank of Canada' },
  { code: 'TD', name: 'TD Bank' },
  { code: 'BMO', name: 'Bank of Montreal' },
  { code: 'Scotia', name: 'Scotiabank' },
  { code: 'CIBC', name: 'CIBC' }
];

export function TabView({ articles, onRefresh, bankCode }: TabViewProps) {
  const [sortConfig, setSortConfig] = useState<{
    key: 'bankCode' | 'aiRelevanceScore' | 'publishDate';
    direction: 'asc' | 'desc';
  } | null>(null);

  const [selectedBanks, setSelectedBanks] = useState<string[]>(
    bankCode ? [bankCode] : BANKS.map(bank => bank.code)
  );

  // Define initial column order
  const [columns, setColumns] = useState<Column[]>([
    {
      key: 'publishDate',
      label: 'Date',
      width: 'w-32',
      sortable: true,
      render: (article) => (
        <span className="text-sm text-gray-400 whitespace-nowrap">
          <DateDisplay date={article.publishDate} format="short" />
        </span>
      ),
    },
    {
      key: 'bankCode',
      label: 'Bank',
      width: 'w-24',
      sortable: true,
      render: (article) => (
        <span className={`px-2 py-1 text-xs font-medium rounded ${
          article.bankCode === 'RBC' ? 'bg-blue-900 text-blue-200' :
          article.bankCode === 'TD' ? 'bg-green-900 text-green-200' :
          article.bankCode === 'BMO' ? 'bg-orange-900 text-orange-200' :
          article.bankCode === 'Scotia' ? 'bg-red-900 text-red-200' :
          article.bankCode === 'CIBC' ? 'bg-yellow-900 text-yellow-200' :
          'bg-gray-700 text-gray-300'
        }`}>
          {article.bankCode}
        </span>
      ),
    },
    {
      key: 'title',
      label: 'Title',
      render: (article) => (
        <a 
          href={article.link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 hover:underline font-medium"
        >
          {article.title}
        </a>
      ),
    },
    {
      key: 'aiRelevanceScore',
      label: 'AI Score',
      width: 'w-24',
      sortable: true,
      render: (article) => (
        <div className="flex items-center gap-2">
          <div 
            className="h-2 w-16 bg-gray-700 rounded-full overflow-hidden"
            title={article.aiRelevanceReason}
          >
            <div 
              className="h-full bg-blue-500"
              style={{ width: `${(article.aiRelevanceScore || 0) * 100}%` }}
            />
          </div>
          <span className="text-sm text-gray-400">
            {((article.aiRelevanceScore || 0) * 100).toFixed(0)}%
          </span>
        </div>
      ),
    },
    {
      key: 'summary',
      label: 'Summary',
      render: (article) => (
        <div className="line-clamp-2 text-sm text-gray-300">
          {article.summary}
        </div>
      ),
    },
  ]);

  const moveColumn = (index: number, direction: 'left' | 'right') => {
    const newColumns = [...columns];
    const newIndex = direction === 'left' ? index - 1 : index + 1;
    
    if (newIndex >= 0 && newIndex < columns.length) {
      [newColumns[index], newColumns[newIndex]] = [newColumns[newIndex], newColumns[index]];
      setColumns(newColumns);
    }
  };

  const filteredArticles = articles.filter(article => selectedBanks.includes(article.bankCode));

  const sortedArticles = [...filteredArticles].sort((a, b) => {
    if (!sortConfig) {
      return (b.aiRelevanceScore || 0) - (a.aiRelevanceScore || 0);
    }

    switch (sortConfig.key) {
      case 'bankCode':
        return sortConfig.direction === 'asc'
          ? a.bankCode.localeCompare(b.bankCode)
          : b.bankCode.localeCompare(a.bankCode);
      case 'aiRelevanceScore':
        return sortConfig.direction === 'asc'
          ? (a.aiRelevanceScore || 0) - (b.aiRelevanceScore || 0)
          : (b.aiRelevanceScore || 0) - (a.aiRelevanceScore || 0);
      case 'publishDate':
        return sortConfig.direction === 'asc'
          ? new Date(a.publishDate).getTime() - new Date(b.publishDate).getTime()
          : new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
      default:
        return 0;
    }
  });

  const requestSort = (key: 'bankCode' | 'aiRelevanceScore' | 'publishDate') => {
    if (sortConfig?.key === key) {
      setSortConfig({
        key,
        direction: sortConfig.direction === 'asc' ? 'desc' : 'asc'
      });
    } else {
      setSortConfig({ key, direction: 'desc' });
    }
  };

  const getSortIcon = (key: string) => {
    const iconClasses = "w-4 h-4 inline-block ml-1";
    
    if (sortConfig?.key !== key) {
      return <ArrowsUpDownIcon className={`${iconClasses} text-gray-600`} />;
    }
    
    return sortConfig.direction === 'asc' 
      ? <ChevronUpIcon className={`${iconClasses} text-blue-400`} />
      : <ChevronDownIcon className={`${iconClasses} text-blue-400`} />;
  };

  return (
    <div className="w-full">
      <div className="mb-4 flex justify-between items-center">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedBanks(BANKS.map(bank => bank.code))}
              className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-full transition-colors"
            >
              Select All
            </button>
            <button
              onClick={() => setSelectedBanks([])}
              className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-full transition-colors"
            >
              Clear All
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {BANKS.map(bank => (
              <div
                key={bank.code}
                className={`inline-flex items-center px-3 py-1 rounded-full transition-colors cursor-pointer ${
                  selectedBanks.includes(bank.code)
                    ? bank.code === 'RBC' ? 'bg-blue-900 text-blue-200' :
                      bank.code === 'TD' ? 'bg-green-900 text-green-200' :
                      bank.code === 'BMO' ? 'bg-orange-900 text-orange-200' :
                      bank.code === 'Scotia' ? 'bg-red-900 text-red-200' :
                      bank.code === 'CIBC' ? 'bg-yellow-900 text-yellow-200' :
                      'bg-gray-700 text-gray-300'
                    : 'bg-gray-800 text-gray-500'
                }`}
                onClick={() => {
                  if (selectedBanks.includes(bank.code)) {
                    setSelectedBanks(selectedBanks.filter(code => code !== bank.code));
                  } else {
                    setSelectedBanks([...selectedBanks, bank.code]);
                  }
                }}
              >
                <span className="text-sm font-medium">{bank.code}</span>
                {selectedBanks.includes(bank.code) && (
                  <button
                    className="ml-2 hover:text-white focus:outline-none"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedBanks(selectedBanks.filter(code => code !== bank.code));
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
        {onRefresh && <RefreshButton onSuccess={onRefresh} />}
      </div>

      <table className="min-w-full divide-y divide-gray-700">
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th 
                key={column.key}
                scope="col" 
                className={`px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider ${column.width || ''} ${column.sortable ? 'cursor-pointer hover:text-gray-300' : ''} group`}
                onClick={() => column.sortable && requestSort(column.key as 'bankCode' | 'aiRelevanceScore' | 'publishDate')}
              >
                <div className="flex items-center gap-1">
                  <div className="flex items-center gap-1 flex-1">
                    {column.label}
                    {column.sortable && (
                      <span className="transition-opacity group-hover:opacity-100 opacity-70">
                        {getSortIcon(column.key)}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {index > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveColumn(index, 'left');
                        }}
                        className="p-1 rounded hover:bg-gray-700 transition-colors"
                      >
                        <ChevronLeftIcon className="w-3 h-3" />
                      </button>
                    )}
                    {index < columns.length - 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveColumn(index, 'right');
                        }}
                        className="p-1 rounded hover:bg-gray-700 transition-colors"
                      >
                        <ChevronRightIcon className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {sortedArticles.map((article) => (
            <tr 
              key={article.link} 
              className="hover:bg-gray-800/50 transition-colors"
            >
              {columns.map((column) => (
                <td key={column.key} className="px-6 py-4">
                  {column.render(article)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 
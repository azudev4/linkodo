'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Globe,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  Eye,
  MoreHorizontal,
  Play,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CrawlSession {
  id: string;
  domain: string;
  client_name: string | null;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'needs_review' | 'promoted';
  total_pages: number | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  // Derived fields for filtering
  included_pages?: number;
  excluded_pages?: number;
  last_activity?: string;
}

const mockSessions: CrawlSession[] = [
  {
    id: 'session-1',
    domain: 'acme-corp.com',
    client_name: 'ACME Corporation',
    status: 'needs_review',
    total_pages: 1247,
    started_at: '2024-01-15T09:00:00Z',
    completed_at: '2024-01-15T11:30:00Z',
    created_at: '2024-01-15T09:00:00Z',
    updated_at: '2024-01-15T11:30:00Z',
    included_pages: 0,
    excluded_pages: 0,
    last_activity: '2024-01-15T11:30:00Z'
  },
  {
    id: 'session-2',
    domain: 'techstartup.io',
    client_name: 'TechStartup Inc',
    status: 'needs_review',
    total_pages: 423,
    started_at: '2024-01-14T14:20:00Z',
    completed_at: '2024-01-14T15:45:00Z',
    created_at: '2024-01-14T14:20:00Z',
    updated_at: '2024-01-14T15:45:00Z',
    included_pages: 234,
    excluded_pages: 189,
    last_activity: '2024-01-14T16:30:00Z'
  },
  {
    id: 'session-3',
    domain: 'ecommerce-store.com',
    client_name: 'E-commerce Store',
    status: 'promoted',
    total_pages: 2891,
    started_at: '2024-01-13T08:15:00Z',
    completed_at: '2024-01-13T12:20:00Z',
    created_at: '2024-01-13T08:15:00Z',
    updated_at: '2024-01-13T16:45:00Z',
    included_pages: 567,
    excluded_pages: 2324,
    last_activity: '2024-01-13T16:45:00Z'
  },
  {
    id: 'session-4',
    domain: 'blog-site.org',
    client_name: 'Personal Blog',
    status: 'running',
    total_pages: 89,
    started_at: '2024-01-16T10:00:00Z',
    completed_at: null,
    created_at: '2024-01-16T10:00:00Z',
    updated_at: '2024-01-16T10:30:00Z',
    included_pages: 0,
    excluded_pages: 0,
    last_activity: '2024-01-16T10:30:00Z'
  }
];

interface ClientSessionsListProps {
  onSessionSelect: (sessionId: string) => void;
}

export function ClientSessionsList({ onSessionSelect }: ClientSessionsListProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const getStatusBadge = (status: CrawlSession['status']) => {
    const config = {
      running: { label: 'Running', class: 'bg-blue-100 text-blue-700' },
      needs_review: { label: 'Needs Review', class: 'bg-yellow-100 text-yellow-700' },
      promoted: { label: 'Promoted', class: 'bg-green-100 text-green-700' },
      failed: { label: 'Failed', class: 'bg-red-100 text-red-700' },
      completed: { label: 'Completed', class: 'bg-gray-100 text-gray-700' },
      pending: { label: 'Pending', class: 'bg-gray-100 text-gray-700' }
    }[status] || { label: 'Unknown', class: 'bg-gray-100 text-gray-700' };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.class}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredSessions = mockSessions.filter(session =>
    selectedStatus === 'all' || session.status === selectedStatus
  );

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { key: 'all', label: 'All' },
          { key: 'needs_review', label: 'Needs Review' },
          { key: 'running', label: 'Running' },
          { key: 'promoted', label: 'Promoted' }
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setSelectedStatus(key)}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition-all",
              selectedStatus === key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Sessions Table */}
      <div className="bg-white rounded-2xl shadow-[0_0_40px_rgb(0,0,0,0.08)] border border-blue-100">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Domain</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Pages</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredSessions.map((session) => {
                const included = session.included_pages || 0;
                const total = session.total_pages || 0;
                const progress = total > 0 ? Math.round((included / total) * 100) : 0;

                return (
                  <tr key={session.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <Globe className="w-8 h-8 p-2 bg-blue-100 rounded-lg text-blue-600 mr-3" />
                        <div>
                          <div className="font-medium text-gray-900">
                            {session.client_name || 'Unnamed Client'}
                          </div>
                          <div className="text-sm text-gray-500">ID: {session.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{session.domain}</td>
                    <td className="px-6 py-4">{getStatusBadge(session.status)}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {total.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">{progress}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(session.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onSessionSelect(session.id)}
                          className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                          {session.status === 'needs_review' ? (
                            <>
                              <Filter className="w-4 h-4 mr-1" />
                              Filter
                            </>
                          ) : (
                            <>
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </>
                          )}
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onSessionSelect(session.id)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredSessions.length === 0 && (
          <div className="text-center py-12">
            <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions found</h3>
            <p className="text-gray-500">Try changing the filter or start a new crawl.</p>
          </div>
        )}
      </div>
    </div>
  );
}
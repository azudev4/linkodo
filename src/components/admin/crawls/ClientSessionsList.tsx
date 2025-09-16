'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import {
  Globe,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  Eye,
  MoreHorizontal,
  Play,
  Trash2,
  Loader2,
  UserPlus,
  Clock,
  ArrowRight,
  RotateCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AssignClientModal } from './AssignClientModal';

interface CrawlSession {
  id: string;
  domain: string;
  client: string | null;
  client_profile?: {
    id: string;
    full_name: string | null;
    email: string | null;
    company_name: string | null;
  };
  status: 'pending' | 'running' | 'completed' | 'failed' | 'needs_review' | 'promoted';
  total_pages: number | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  included_pages?: number;
  excluded_pages?: number;
  success_rate?: number;
  review_progress?: 'needs_review' | 'in_progress' | 'pushed';
}


interface ClientSessionsListProps {
  onSessionSelect: (sessionId: string) => void;
}

export function ClientSessionsList({ onSessionSelect }: ClientSessionsListProps) {
  const router = useRouter();
  const [sessions, setSessions] = useState<CrawlSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedSessionForAssignment, setSelectedSessionForAssignment] = useState<CrawlSession | null>(null);

  useEffect(() => {
    fetchSessions();
  }, [selectedStatus]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (selectedStatus !== 'all') {
        params.append('status', selectedStatus);
      }

      const response = await fetch(`/api/admin/crawl-sessions?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }

      const data = await response.json();
      setSessions(data);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/admin/crawl-sessions/${sessionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete session');
      }

      setSessions(sessions.filter(s => s.id !== sessionId));
    } catch (err) {
      console.error('Error deleting session:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete session');
    }
  };

  const handleUpdateReviewProgress = async (sessionId: string, reviewProgress: string) => {
    try {
      const response = await fetch(`/api/admin/crawl-sessions/${sessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ review_progress: reviewProgress }),
      });

      if (!response.ok) {
        throw new Error('Failed to update review progress');
      }

      setSessions(sessions.map(session =>
        session.id === sessionId
          ? { ...session, review_progress: reviewProgress as any }
          : session
      ));
    } catch (err) {
      console.error('Error updating review progress:', err);
      setError(err instanceof Error ? err.message : 'Failed to update review progress');
    }
  };

  const openAssignModal = (session: CrawlSession) => {
    setSelectedSessionForAssignment(session);
    setAssignModalOpen(true);
  };

  const closeAssignModal = () => {
    setSelectedSessionForAssignment(null);
    setAssignModalOpen(false);
  };

  const handleAssignSession = async (clientId: string) => {
    if (!selectedSessionForAssignment) return;

    try {
      const response = await fetch(`/api/admin/crawl-sessions/${selectedSessionForAssignment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ client: clientId || null }),
      });

      if (!response.ok) {
        throw new Error('Failed to assign session');
      }

      // Fetch updated session data from the server to get complete client profile
      const updatedResponse = await fetch(`/api/admin/crawl-sessions/${selectedSessionForAssignment.id}`);
      if (updatedResponse.ok) {
        const updatedSession = await updatedResponse.json();
        setSessions(sessions.map(session =>
          session.id === selectedSessionForAssignment.id ? updatedSession : session
        ));
      } else {
        // Fallback: just update the client field
        setSessions(sessions.map(session => {
          if (session.id === selectedSessionForAssignment.id) {
            return {
              ...session,
              client: clientId || null,
              client_profile: null // Will be updated on next refresh
            };
          }
          return session;
        }));
      }
    } catch (err) {
      console.error('Error assigning session:', err);
      setError(err instanceof Error ? err.message : 'Failed to assign session');
      throw err; // Re-throw so modal can handle the error
    }
  };

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

  const getClientDisplayName = (session: CrawlSession) => {
    if (session.client_profile?.company_name) {
      return session.client_profile.company_name;
    }
    if (session.client_profile?.full_name) {
      return session.client_profile.full_name;
    }
    return 'Unassigned';
  };

  const getNextReviewProgress = (current: string = 'needs_review') => {
    const cycle = {
      'needs_review': 'in_progress',
      'in_progress': 'pushed',
      'pushed': 'needs_review'
    };
    return cycle[current] || 'in_progress';
  };

  const getReviewProgressBadge = (sessionId: string, reviewProgress: string = 'needs_review') => {
    const config = {
      needs_review: { label: 'Needs Review', class: 'bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200' },
      in_progress: { label: 'In Progress', class: 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200' },
      pushed: { label: 'Pushed', class: 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200' }
    }[reviewProgress] || { label: 'Needs Review', class: 'bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200' };

    return (
      <button
        onClick={() => handleUpdateReviewProgress(sessionId, getNextReviewProgress(reviewProgress))}
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${config.class} group`}
        title={`Click to change to ${getNextReviewProgress(reviewProgress).replace('_', ' ')}`}
      >
        {config.label}
        <RotateCw className="w-3 h-3 opacity-0 group-hover:opacity-70 transition-opacity" />
      </button>
    );
  };


  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {[
            { key: 'all', label: 'All' },
            { key: 'needs_review', label: 'Needs Review' },
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
        <div className="bg-white rounded-2xl shadow-[0_0_40px_rgb(0,0,0,0.08)] border border-blue-100">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading sessions...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {[
            { key: 'all', label: 'All' },
            { key: 'needs_review', label: 'Needs Review' },
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
        <div className="bg-white rounded-2xl shadow-[0_0_40px_rgb(0,0,0,0.08)] border border-blue-100">
          <div className="text-center py-12">
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading sessions</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <Button
              onClick={fetchSessions}
              variant="outline"
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { key: 'all', label: 'All' },
          { key: 'needs_review', label: 'Needs Review' },
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
              {sessions.map((session) => {
                return (
                  <tr key={session.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <Globe className="w-8 h-8 p-2 bg-blue-100 rounded-lg text-blue-600 mr-3" />
                        <div>
                          <div className="font-medium text-gray-900">
                            {getClientDisplayName(session)}
                          </div>
                          <div className="text-sm text-gray-500">ID: {session.id.substring(0, 8)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{session.domain}</td>
                    <td className="px-6 py-4">{getStatusBadge(session.status)}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {(session.total_pages || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      {getReviewProgressBadge(session.id, session.review_progress)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(session.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            onSessionSelect(session.id);
                            router.push(`/admin/crawls/${session.id}`);
                          }}
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
                            <DropdownMenuItem onClick={() => {
                              onSessionSelect(session.id);
                              router.push(`/admin/crawls/${session.id}`);
                            }}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openAssignModal(session)}>
                              <UserPlus className="w-4 h-4 mr-2" />
                              Assign Client
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />

                            {/* Review Progress Options */}
                            <div className="px-2 py-1.5 text-xs font-medium text-gray-500 uppercase">
                              Review Progress
                            </div>
                            <DropdownMenuItem
                              onClick={() => handleUpdateReviewProgress(session.id, 'needs_review')}
                              className={session.review_progress === 'needs_review' ? 'bg-yellow-50' : ''}
                            >
                              <Clock className="w-4 h-4 mr-2 text-yellow-600" />
                              Needs Review
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleUpdateReviewProgress(session.id, 'in_progress')}
                              className={session.review_progress === 'in_progress' ? 'bg-blue-50' : ''}
                            >
                              <Play className="w-4 h-4 mr-2 text-blue-600" />
                              In Progress
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleUpdateReviewProgress(session.id, 'pushed')}
                              className={session.review_progress === 'pushed' ? 'bg-green-50' : ''}
                            >
                              <ArrowRight className="w-4 h-4 mr-2 text-green-600" />
                              Pushed
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDeleteSession(session.id)}
                            >
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

        {sessions.length === 0 && (
          <div className="text-center py-12">
            <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions found</h3>
            <p className="text-gray-500">Try changing the filter or start a new crawl.</p>
          </div>
        )}
      </div>

      {/* Assign Client Modal */}
      <AssignClientModal
        isOpen={assignModalOpen}
        onClose={closeAssignModal}
        onAssign={handleAssignSession}
        currentClientId={selectedSessionForAssignment?.client}
        sessionDomain={selectedSessionForAssignment?.domain}
      />
    </div>
  );
}
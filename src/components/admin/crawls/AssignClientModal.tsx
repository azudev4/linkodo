'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/SearchInput';
import {
  User,
  Building2,
  Mail,
  Loader2,
  UserX,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  company_name: string | null;
  role: string | null;
}

interface AssignClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (clientId: string) => Promise<void>;
  currentClientId?: string | null;
  sessionDomain?: string;
}

export function AssignClientModal({
  isOpen,
  onClose,
  onAssign,
  currentClientId,
  sessionDomain
}: AssignClientModalProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [assigningClientId, setAssigningClientId] = useState<string | null>(null);
  const [unassigning, setUnassigning] = useState(false);
  const limit = 10;

  useEffect(() => {
    if (isOpen) {
      fetchProfiles();
    }
  }, [isOpen, currentPage, searchTerm]);

  const fetchProfiles = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
      });

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await fetch(`/api/admin/users?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      const nonAdminProfiles = (data.users || []).filter((p: Profile) => p.role !== 'admin');

      setProfiles(nonAdminProfiles);
      setTotalPages(Math.ceil((data.total || 0) / limit));
      setTotalUsers(data.total || 0);
    } catch (err) {
      console.error('Error fetching profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page on search
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setCurrentPage(1);
  };

  const handleAssign = async (clientId: string) => {
    try {
      setAssigningClientId(clientId);
      await onAssign(clientId);
      onClose();
    } catch (err) {
      console.error('Error assigning client:', err);
    } finally {
      setAssigningClientId(null);
    }
  };

  const handleUnassign = async () => {
    try {
      setUnassigning(true);
      await onAssign('');
      onClose();
    } catch (err) {
      console.error('Error unassigning client:', err);
    } finally {
      setUnassigning(false);
    }
  };

  const getProfileDisplayName = (profile: Profile) => {
    if (profile.company_name) return profile.company_name;
    if (profile.full_name) return profile.full_name;
    return profile.email || 'Unknown User';
  };

  const getProfileSubtitle = (profile: Profile) => {
    if (profile.company_name && profile.full_name) {
      return profile.full_name;
    }
    if (profile.email) {
      return profile.email;
    }
    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Assign Client
          </DialogTitle>
          <DialogDescription>
            Choose a client to assign the crawl session for <strong>{sessionDomain}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Bar */}
          <SearchInput
            placeholder="Search clients by name, company, or email..."
            value={searchTerm}
            onSearch={handleSearch}
            onClear={handleClearSearch}
            loading={loading}
          />

          {/* Current Assignment & Unassign */}
          {currentClientId && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-800">Currently assigned</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUnassign}
                  disabled={unassigning}
                  className="text-red-600 border-red-200 hover:bg-red-50 disabled:opacity-50"
                >
                  {unassigning ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <UserX className="w-4 h-4 mr-1" />
                  )}
                  {unassigning ? 'Unassigning...' : 'Unassign'}
                </Button>
              </div>
            </div>
          )}

          {/* Clients List */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-500">Loading clients...</span>
              </div>
            ) : profiles.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'No clients found matching your search' : 'No clients available'}
              </div>
            ) : (
              profiles.map((profile) => {
                const isCurrentClient = profile.id === currentClientId;
                const isAssigning = assigningClientId === profile.id;
                return (
                  <button
                    key={profile.id}
                    onClick={() => handleAssign(profile.id)}
                    disabled={isCurrentClient || isAssigning || assigningClientId !== null}
                    className={cn(
                      "w-full p-3 rounded-lg border text-left transition-all relative",
                      isCurrentClient
                        ? "bg-blue-50 border-blue-200 cursor-not-allowed"
                        : isAssigning
                        ? "bg-green-50 border-green-200"
                        : assigningClientId !== null
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-gray-50 border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium relative">
                        {isAssigning ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          profile.company_name?.[0]?.toUpperCase() ||
                          profile.full_name?.[0]?.toUpperCase() ||
                          profile.email?.[0]?.toUpperCase() || '?'
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 truncate">
                            {getProfileDisplayName(profile)}
                          </span>
                          {isCurrentClient && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                              Current
                            </span>
                          )}
                          {isAssigning && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                              Assigning...
                            </span>
                          )}
                        </div>
                        {getProfileSubtitle(profile) && (
                          <div className="flex items-center gap-1 text-sm text-gray-500 truncate">
                            {profile.company_name && profile.full_name ? (
                              <User className="w-3 h-3" />
                            ) : (
                              <Mail className="w-3 h-3" />
                            )}
                            {getProfileSubtitle(profile)}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm text-gray-500">
                Showing {((currentPage - 1) * limit) + 1}-{Math.min(currentPage * limit, totalUsers)} of {totalUsers}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1 || loading}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <span className="text-sm text-gray-500">
                  {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages || loading}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
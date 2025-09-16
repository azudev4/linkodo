'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { UserPlus, Edit, Trash2, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, useInView } from 'framer-motion';
import { cn } from '@/lib/utils';
import { AdminUsersSearch } from './AdminUsersSearch';

interface User {
  id: string;
  email: string | null;
  full_name: string | null;
  company_name: string | null;
  role: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface AnimationContainerProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

const AnimationContainer = ({ children, className, delay = 0.1 }: AnimationContainerProps) => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      className={cn("w-full h-full", className)}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 30, scale: 0.95 }}
      transition={{
        delay: delay,
        duration: 0.6,
        type: "spring",
        stiffness: 80,
        damping: 12,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
    >
      {children}
    </motion.div>
  );
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const getRoleBadge = (role: string | null) => {
  const roleConfig = {
    admin: { label: 'Admin', color: 'bg-red-100 text-red-700 border-red-200' },
    early_access: { label: 'Early Access', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    user: { label: 'User', color: 'bg-gray-100 text-gray-700 border-gray-200' },
    default: { label: 'User', color: 'bg-gray-100 text-gray-700 border-gray-200' }, // Support old 'default' role
  };

  const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.user;

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${config.color}`}>
      {config.label}
    </span>
  );
};

export function AdminUsersTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const usersPerPage = 10;

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: usersPerPage.toString(),
        search: searchTerm,
        role: selectedRole === 'all' ? '' : selectedRole
      });

      const response = await fetch(`/api/admin/users?${params}`);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Frontend - API Error:', errorData);
        throw new Error(errorData.error || 'Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users || []);
      setTotalUsers(data.total || 0);
    } catch (error) {
      console.error('Frontend - Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, selectedRole]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle search changes from the search component
  const handleSearchChange = useCallback((search: string, role: string) => {
    setSearchTerm(search);
    setSelectedRole(role);
    setCurrentPage(1); // Reset to first page when searching
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });

      if (!response.ok) throw new Error('Failed to update user role');

      fetchUsers(); // Refresh the table
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete user');

      fetchUsers(); // Refresh the table
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const totalPages = Math.ceil(totalUsers / usersPerPage);

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <AdminUsersSearch onSearchChange={handleSearchChange} />

      {/* Users Table */}
      <AnimationContainer delay={0.1}>
        <div className="bg-white rounded-2xl shadow-[0_0_40px_rgb(0,0,0,0.08)] border border-blue-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">All Users</h2>
                <p className="text-gray-600 mt-1">Manage user accounts and permissions</p>
              </div>
              <div className="text-sm text-gray-500">
                Total: {totalUsers} users
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading users...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full mx-auto mb-6 flex items-center justify-center">
                  <UserPlus className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">No users found</h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  {searchTerm || selectedRole !== 'all'
                    ? 'No users match your current filters. Try adjusting your search criteria.'
                    : 'Users will appear here once they register for the platform.'}
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.full_name || 'No name'}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.company_name || 'No company'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRoleChange(user.id, user.role === 'early_access' ? 'user' : 'early_access')}
                            className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                            title={user.role === 'early_access' ? 'Remove early access' : 'Grant early access'}
                          >
                            <Crown className={`w-4 h-4 ${user.role === 'early_access' ? 'fill-current' : ''}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {((currentPage - 1) * usersPerPage) + 1} to {Math.min(currentPage * usersPerPage, totalUsers)} of {totalUsers} users
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </AnimationContainer>
    </div>
  );
}
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { User, Mail, Calendar, Shield, Edit3, Save, X, Camera, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useProfile } from '@/lib/stores/useProfileStore';
import { motion, AnimatePresence } from 'framer-motion';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { profile, isLoading, refresh } = useProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedName, setEditedName] = useState('');

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not available';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-700 border-red-200';
      case 'early_access': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const handleEditStart = () => {
    setEditedName(profile?.full_name || '');
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditedName('');
  };

  const handleSave = async () => {
    if (!profile) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ full_name: editedName })
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      await refresh();
      setIsEditing(false);
    } catch (error) {
      console.error('Update failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-lg">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        {/* Header with gradient background */}
        <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 p-6 pb-16">
          <DialogHeader className="relative z-10">
            <DialogTitle className="text-white text-xl font-semibold">Profile Settings</DialogTitle>
          </DialogHeader>

          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12" />
        </div>

        {/* Profile Picture Section */}
        <div className="flex justify-center -mt-12 relative z-20 px-6">
          <div className="relative group">
            {profile?.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt="Profile"
                width={96}
                height={96}
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-xl"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border-4 border-white shadow-xl">
                <User className="w-12 h-12 text-gray-500" />
              </div>
            )}

            {/* Edit overlay */}
            <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
              <Camera className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 pt-4 space-y-6">
          {/* Name Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-700">Full Name</Label>
              {!isEditing && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEditStart}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 px-2"
                >
                  <Edit3 className="w-3 h-3 mr-1" />
                  Edit
                </Button>
              )}
            </div>

            <AnimatePresence mode="wait">
              {isEditing ? (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center space-x-2"
                >
                  <Input
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    placeholder="Enter your full name"
                    className="flex-1"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="h-9 px-3"
                  >
                    {isSaving ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Save className="w-3 h-3" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleEditCancel}
                    className="h-9 px-3"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="p-3 rounded-lg bg-gray-50 border"
                >
                  <div className="font-medium text-gray-900">
                    {profile?.full_name || 'Not set'}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Separator />

          {/* Profile Info Grid */}
          <div className="grid gap-4">
            <div className="flex items-center justify-between p-3 rounded-lg border bg-gray-50/50">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-gray-500" />
                <div>
                  <div className="font-medium text-gray-900 text-sm">
                    {profile?.email || 'Not set'}
                  </div>
                  <div className="text-xs text-gray-500">Email Address</div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border bg-gray-50/50">
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-gray-500" />
                <div>
                  <div className="text-xs text-gray-500 mb-1">Role</div>
                  <Badge
                    variant="outline"
                    className={`text-xs ${getRoleBadgeColor(profile?.role || 'user')}`}
                  >
                    {profile?.role === 'early_access' ? 'Early Access' :
                     profile?.role === 'admin' ? 'Admin' : 'User'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border bg-gray-50/50">
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-gray-500" />
                <div>
                  <div className="font-medium text-gray-900 text-sm">
                    {formatDate(profile?.created_at || null)}
                  </div>
                  <div className="text-xs text-gray-500">Member Since</div>
                </div>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <div className="pt-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
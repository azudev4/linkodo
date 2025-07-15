'use client'
import { useState, useEffect } from 'react';

interface User {
  username: string;
  role: string;
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(';').shift() || null;
    return cookieValue ? decodeURIComponent(cookieValue) : null;
  }
  return null;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const userDataCookie = getCookie('user-data');
    if (userDataCookie) {
      try {
        const decodedData = JSON.parse(userDataCookie);
        setUser(decodedData);
      } catch (e) {
        console.error("Error parsing user data:", e);
        document.cookie = 'user-data=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      }
    }
  }, []);

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      document.cookie = 'user-data=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      setUser(null);
      window.location.href = '/login';
    } catch (e) {
      console.error("Logout error:", e);
      window.location.href = '/login';
    }
  };

  return { user, logout };
}
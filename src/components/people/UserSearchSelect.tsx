import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Check, User } from 'lucide-react';
import { api } from '../../api/client';

interface UserSelectProps {
  value: string;
  onChange: (userId: string) => void;
  placeholder?: string;
  error?: boolean;
}

export function UserSearchSelect({ value, onChange, placeholder = "Select Manager", error = false }: UserSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUsers = async (pageNum: number, searchStr: string, append: boolean = false) => {
    setLoading(true);
    try {
      const res = await api.get('/api/v1/users', {
        params: {
          page: pageNum,
          size: 10,
          search: searchStr
        }
      });
      
      const responseData = res.data.rows || res.data.users?.rows || res.data.users || [];
      const total = res.data.count || res.data.users?.count || responseData.length;
      
      if (append) {
        setUsers(prev => [...prev, ...responseData]);
      } else {
        setUsers(responseData);
      }
      
      setHasMore((append ? users.length + responseData.length : responseData.length) < total);
      
      // If we have a value but no selectedUser object, find it
      if (value && !selectedUser) {
        const found = responseData.find((u: any) => u.id === value);
        if (found) setSelectedUser(found);
      }
    } catch (e) {
      console.error("Failed to fetch users", e);
    } finally {
      setLoading(false);
    }
  };

  // Fetch initial selected user if value exists
  useEffect(() => {
    if (value && !selectedUser) {
        api.get(`/api/v1/users/${value}`).then(res => {
            setSelectedUser(res.data.user);
        }).catch(() => {});
    }
  }, [value]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isOpen) {
        setPage(1);
        fetchUsers(1, search);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search, isOpen]);

  const loadMore = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchUsers(nextPage, search, true);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm font-medium flex items-center justify-between cursor-pointer transition-all
          ${error ? 'border-rose-500' : 'border-slate-200 hover:border-slate-300 focus:bg-white focus:border-blue-500'}
          ${isOpen ? 'bg-white border-blue-500 shadow-sm' : ''}
        `}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          {selectedUser ? (
            <>
              <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <User className="w-3 h-3 text-blue-600" />
              </div>
              <span className="truncate text-slate-800">{selectedUser.fullName || `${selectedUser.firstName} ${selectedUser.lastName}`}</span>
            </>
          ) : (
            <span className="text-slate-400 font-normal">{placeholder}</span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-[100] mt-2 w-full bg-white border border-slate-100 rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="p-3 border-b border-slate-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                autoFocus
                placeholder="Search by name or email..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-lg pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
          
          <div className="max-h-60 overflow-y-auto custom-scrollbar">
            {users.length === 0 && !loading && (
              <div className="p-8 text-center">
                <p className="text-sm text-slate-400">No users found</p>
              </div>
            )}
            
            {users.map((user) => (
              <div 
                key={user.id}
                onClick={() => {
                  setSelectedUser(user);
                  onChange(user.id);
                  setIsOpen(false);
                  setSearch('');
                }}
                className={`flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 cursor-pointer transition-colors
                  ${value === user.id ? 'bg-blue-50/50' : ''}
                `}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs">
                    {(user.fullName || `${user.firstName} ${user.lastName}`)?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-700">{user.fullName || `${user.firstName} ${user.lastName}`}</span>
                    <span className="text-[10px] text-slate-400 font-medium">{user.email}</span>
                  </div>
                </div>
                {value === user.id && <Check className="w-4 h-4 text-blue-500" />}
              </div>
            ))}
            
            {loading && (
              <div className="p-4 text-center">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            )}
            
            {hasMore && !loading && (
              <button 
                type="button"
                onClick={loadMore}
                className="w-full py-3 text-xs font-bold text-blue-600 hover:bg-blue-50/50 transition-colors border-t border-slate-50"
              >
                Load More
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

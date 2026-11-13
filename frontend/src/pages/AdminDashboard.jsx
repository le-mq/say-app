import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { adminService } from '../services/adminService';
import { 
  Shield, Sliders, Users, Activity, Save, RefreshCw, 
  CheckCircle2, AlertTriangle, Lock, UserCheck, ToggleLeft, ToggleRight, ArrowUpRight
} from 'lucide-react';
import { toast } from 'react-toastify';

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('configs'); // 'configs' | 'users' | 'metrics'
  
  // Configs state
  const [configs, setConfigs] = useState({
    MAINTENANCE_MODE: 'false',
    MAX_CAPTION_LENGTH: '150',
    MAX_SNIPPET_DURATION: '60',
    ALLOW_PUBLIC_REGISTRATION: 'true',
  });
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Users state
  const [userList, setUserList] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Metrics state
  const [stats, setStats] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  const isAdmin = user?.role === 'ADMIN';

  // Load configs
  const loadConfigs = async () => {
    if (!user?.id) return;
    try {
      const res = await adminService.getConfigs(user.id);
      const data = res?.data?.data || res?.data || res || {};
      setConfigs(prev => ({ ...prev, ...data }));
    } catch (err) {
      console.warn('Load configs notice:', err);
    }
  };

  // Load users directory
  const loadUsers = async () => {
    if (!user?.id) return;
    setIsLoadingUsers(true);
    try {
      const res = await adminService.getUsers(user.id);
      const data = Array.isArray(res) ? res : (res?.data?.data || res?.data || []);
      setUserList(data);
    } catch (err) {
      toast.error('Failed to load users directory');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Load system stats & metrics
  const loadStats = async () => {
    if (!user?.id) return;
    setIsLoadingStats(true);
    try {
      const res = await adminService.getStats(user.id);
      const data = res?.data?.data || res?.data || res;
      setStats(data);
    } catch (err) {
      toast.error('Failed to load system metrics');
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadConfigs();
      loadUsers();
      loadStats();
    }
  }, [isAdmin, user?.id]);

  // Handle saving dynamic configs
  const handleSaveConfig = async (key, val) => {
    if (!user?.id) return;
    setIsSavingConfig(true);
    try {
      await adminService.updateConfig(user.id, key, String(val));
      setConfigs(prev => ({ ...prev, [key]: String(val) }));
      toast.success(`Updated ${key} successfully`);
    } catch (err) {
      toast.error(err?.message || `Failed to update ${key}`);
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Handle user role promotion / demotion
  const handleToggleRole = async (targetUser) => {
    if (!user?.id) return;
    if (targetUser.id === user.id) {
      toast.warning('You cannot change your own administrator role.');
      return;
    }
    const newRole = targetUser.role === 'ADMIN' ? 'USER' : 'ADMIN';
    try {
      await adminService.updateUserRole(user.id, targetUser.id, newRole);
      setUserList(prev => prev.map(u => u.id === targetUser.id ? { ...u, role: newRole } : u));
      toast.success(`Role updated for ${targetUser.displayName} to ${newRole}`);
    } catch (err) {
      toast.error(err?.message || 'Failed to update role');
    }
  };

  if (!isAdmin) {
    return (
      <div className="w-full min-h-screen bg-[#071523] text-[#E8EEF0] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#0a1b2d] border border-rose-500/30 rounded-3xl p-8 text-center space-y-4">
          <Lock className="w-12 h-12 text-rose-400 mx-auto" />
          <h2 className="text-xl font-bold font-serif text-[#E8EEF0]">Access Denied</h2>
          <p className="text-xs text-[#91B9C5]/80 font-mono leading-relaxed">
            You do not possess administrator authority to view this system console.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#071523] text-[#E8EEF0] selection:bg-[#91B9C5] selection:text-[#071523] pb-24">
      {/* 1. Header Banner */}
      <section className="border-b border-[#142e44] bg-gradient-to-b from-[#0b2034] via-[#081827] to-[#071523] py-7 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#E8EEF0] tracking-wide">
                System Administration Console
              </h1>
            </div>
            <p className="text-xs font-mono text-[#91B9C5]/70">
              Manage dynamic feature flags, user roles, and monitor API traffic.
            </p>
          </div>

          {/* Sub tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#091a2a] border border-[#14324c]">
            <button
              type="button"
              onClick={() => setActiveTab('configs')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer ${
                activeTab === 'configs'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold'
                  : 'text-[#91B9C5]/70 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Configs & Flags</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold'
                  : 'text-[#91B9C5]/70 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Users ({userList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('metrics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer ${
                activeTab === 'metrics'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold'
                  : 'text-[#91B9C5]/70 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>API Traffic</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. Main Content Area */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">

        {/* TAB 1: DYNAMIC CONFIGS & FEATURE FLAGS */}
        {activeTab === 'configs' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Feature Flag 1: Maintenance Mode */}
              <div className="p-5 rounded-3xl bg-[#091b2c] border border-[#163857] flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#E8EEF0] uppercase tracking-wider">
                      Maintenance Mode
                    </span>
                    {configs.MAINTENANCE_MODE === 'true' && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#91B9C5]/70 font-sans leading-relaxed">
                    Temporarily redirects standard traffic for scheduled maintenance.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={isSavingConfig}
                  onClick={() => handleSaveConfig('MAINTENANCE_MODE', configs.MAINTENANCE_MODE === 'true' ? 'false' : 'true')}
                  className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                    configs.MAINTENANCE_MODE === 'true'
                      ? 'bg-amber-400 text-[#07131e] hover:bg-amber-300'
                      : 'bg-[#102d47] text-[#91B9C5] hover:text-white border border-[#1c476d]'
                  }`}
                >
                  {configs.MAINTENANCE_MODE === 'true' ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              {/* Feature Flag 2: Public Registration */}
              <div className="p-5 rounded-3xl bg-[#091b2c] border border-[#163857] flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-mono font-bold text-[#E8EEF0] uppercase tracking-wider block">
                    Allow Sign-Up Registration
                  </span>
                  <p className="text-xs text-[#91B9C5]/70 font-sans leading-relaxed">
                    Allow new listeners to register and participate in the community.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={isSavingConfig}
                  onClick={() => handleSaveConfig('ALLOW_PUBLIC_REGISTRATION', configs.ALLOW_PUBLIC_REGISTRATION === 'true' ? 'false' : 'true')}
                  className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                    configs.ALLOW_PUBLIC_REGISTRATION === 'true'
                      ? 'bg-cyan-400 text-[#07131e] hover:bg-cyan-300'
                      : 'bg-[#102d47] text-[#91B9C5] hover:text-white border border-[#1c476d]'
                  }`}
                >
                  {configs.ALLOW_PUBLIC_REGISTRATION === 'true' ? 'Allowed' : 'Closed'}
                </button>
              </div>

              {/* Numerical Setting 1: Max Caption Length */}
              <div className="p-5 rounded-3xl bg-[#091b2c] border border-[#163857] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#E8EEF0] uppercase tracking-wider">
                    Max Note Caption Length
                  </span>
                  <span className="text-xs font-mono text-cyan-300">
                    {configs.MAX_CAPTION_LENGTH || 150} chars
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="50"
                    max="500"
                    value={configs.MAX_CAPTION_LENGTH || 150}
                    onChange={(e) => setConfigs(prev => ({ ...prev, MAX_CAPTION_LENGTH: e.target.value }))}
                    className="flex-1 px-3 py-2 rounded-xl bg-[#061421] border border-[#183d5f] text-xs font-mono text-[#E8EEF0] focus:border-cyan-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    disabled={isSavingConfig}
                    onClick={() => handleSaveConfig('MAX_CAPTION_LENGTH', configs.MAX_CAPTION_LENGTH)}
                    className="px-4 py-2 rounded-xl bg-[#122e47] hover:bg-[#1a446a] text-cyan-200 border border-cyan-500/30 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              </div>

              {/* Numerical Setting 2: Max Snippet Duration */}
              <div className="p-5 rounded-3xl bg-[#091b2c] border border-[#163857] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#E8EEF0] uppercase tracking-wider">
                    Max Snippet Playback Length
                  </span>
                  <span className="text-xs font-mono text-cyan-300">
                    {configs.MAX_SNIPPET_DURATION || 60} seconds
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={configs.MAX_SNIPPET_DURATION || 60}
                    onChange={(e) => {
                      const val = e.target.value;
                      setConfigs(prev => ({ ...prev, MAX_SNIPPET_DURATION: val }));
                      handleSaveConfig('MAX_SNIPPET_DURATION', val);
                    }}
                    className="flex-1 px-3 py-2 rounded-xl bg-[#061421] border border-[#183d5f] text-xs font-mono text-[#E8EEF0] focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="30">30 seconds (Standard)</option>
                    <option value="45">45 seconds (Extended)</option>
                    <option value="60">60 seconds (Full snippet)</option>
                    <option value="90">90 seconds (Preview max)</option>
                  </select>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: USER DIRECTORY & ROLE MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="rounded-3xl bg-[#091b2c] border border-[#163857] overflow-hidden">
            <div className="p-5 border-b border-[#142e44] flex items-center justify-between">
              <div>
                <h3 className="text-xs font-mono font-bold text-[#E8EEF0] uppercase tracking-wider">
                  Community Directory & Roles
                </h3>
                <p className="text-xs text-[#91B9C5]/60 font-sans mt-0.5">
                  Manage administrator privileges and view user participation.
                </p>
              </div>
              <button
                type="button"
                onClick={loadUsers}
                className="p-2 rounded-xl bg-[#0d263c] text-[#91B9C5] hover:text-white transition-colors"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingUsers ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-[#061320] text-[#91B9C5]/80 font-mono uppercase text-[10px]">
                  <tr>
                    <th className="px-5 py-3.5">User</th>
                    <th className="px-5 py-3.5">Email</th>
                    <th className="px-5 py-3.5">Notes</th>
                    <th className="px-5 py-3.5">Friends</th>
                    <th className="px-5 py-3.5">Role</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#142e44]">
                  {userList.map((u) => {
                    const isSelf = u.id === user.id;
                    return (
                      <tr key={u.id} className="hover:bg-[#0c2237]/50 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-[#102434] border border-[#1e4566] shrink-0 flex items-center justify-center text-xs font-bold text-cyan-300">
                              {u.avatarUrl ? (
                                <img src={u.avatarUrl} alt={u.displayName} className="w-full h-full object-cover" />
                              ) : (
                                <span>{(u.displayName || 'U').slice(0, 2).toUpperCase()}</span>
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-[#E8EEF0]">{u.displayName}</div>
                              <div className="text-[10px] font-mono text-[#91B9C5]/60">
                                @{u.username || 'listener'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-[#91B9C5]/80">{u.email}</td>
                        <td className="px-5 py-3.5 font-mono text-cyan-300">{u.notesCount}</td>
                        <td className="px-5 py-3.5 font-mono text-amber-300">{u.friendsCount}</td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                            u.role === 'ADMIN'
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                              : 'bg-[#10283d] text-[#91B9C5]/80 border border-[#1a4163]'
                          }`}>
                            {u.role || 'USER'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            type="button"
                            disabled={isSelf}
                            onClick={() => handleToggleRole(u)}
                            className={`px-3 py-1.5 rounded-xl text-[11px] font-mono transition-all ${
                              isSelf
                                ? 'opacity-30 cursor-not-allowed text-[#91B9C5]'
                                : u.role === 'ADMIN'
                                ? 'bg-rose-950/40 text-rose-300 hover:bg-rose-900/50 cursor-pointer border border-rose-500/30'
                                : 'bg-[#102e48] text-cyan-300 hover:bg-[#163c5d] cursor-pointer border border-cyan-500/30'
                            }`}
                          >
                            {u.role === 'ADMIN' ? 'Demote to User' : 'Grant Admin'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: API METRICS & TRAFFIC MONITOR */}
        {activeTab === 'metrics' && (
          <div className="space-y-6">
            {/* Summary stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-[#091b2c] border border-[#163857]">
                <span className="text-[10px] font-mono uppercase text-[#91B9C5]/60 block">Total Listeners</span>
                <span className="text-xl font-mono font-bold text-[#E8EEF0] mt-1 block">{stats?.totalUsers ?? '-'}</span>
              </div>
              <div className="p-4 rounded-2xl bg-[#091b2c] border border-[#163857]">
                <span className="text-[10px] font-mono uppercase text-[#91B9C5]/60 block">Music Notes</span>
                <span className="text-xl font-mono font-bold text-cyan-300 mt-1 block">{stats?.totalNotes ?? '-'}</span>
              </div>
              <div className="p-4 rounded-2xl bg-[#091b2c] border border-[#163857]">
                <span className="text-[10px] font-mono uppercase text-[#91B9C5]/60 block">Total API Calls</span>
                <span className="text-xl font-mono font-bold text-amber-300 mt-1 block">{stats?.totalApiRequests ?? '-'}</span>
              </div>
              <div className="p-4 rounded-2xl bg-[#091b2c] border border-[#163857]">
                <span className="text-[10px] font-mono uppercase text-[#91B9C5]/60 block">Error Responses</span>
                <span className="text-xl font-mono font-bold text-rose-400 mt-1 block">{stats?.errorApiRequests ?? 0}</span>
              </div>
            </div>

            {/* Endpoints breakdown */}
            <div className="rounded-3xl bg-[#091b2c] border border-[#163857] p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono font-bold text-[#E8EEF0] uppercase tracking-wider">
                  API Endpoint Traffic Breakdown
                </h3>
                <button
                  type="button"
                  onClick={loadStats}
                  className="p-1.5 rounded-xl bg-[#0d263c] text-[#91B9C5] hover:text-white transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingStats ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="space-y-2">
                {stats?.requestsByEndpoint && Object.keys(stats.requestsByEndpoint).length > 0 ? (
                  Object.entries(stats.requestsByEndpoint).map(([ep, count]) => (
                    <div key={ep} className="p-3 rounded-xl bg-[#061421] border border-[#14324c] flex items-center justify-between gap-3">
                      <span className="font-mono text-xs text-cyan-200 truncate">{ep}</span>
                      <span className="font-mono text-xs font-bold text-[#91B9C5] shrink-0">{count} hits</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs font-mono text-[#91B9C5]/60 py-3 text-center">
                    Traffic data collecting... Send API calls to see real-time hits.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

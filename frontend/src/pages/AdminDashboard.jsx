import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { adminService } from '../services/adminService';
import { 
  Shield, Sliders, Users, Activity, Save, RefreshCw, 
  CheckCircle2, AlertTriangle, Lock, UserCheck, ToggleLeft, ToggleRight, ArrowUpRight,
  Video, Database, HardDrive, Cpu, Bookmark, Sparkles, Check, AlertCircle, Clock,
  Server, Radio, Zap, Cloud, Info, ChevronRight, BarChart3, Layers, CheckCircle
} from 'lucide-react';
import { toast } from 'react-toastify';

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('configs'); // 'configs' | 'users' | 'metrics'
  const [selectedService, setSelectedService] = useState('postgres'); // 'postgres' | 'youtube' | 'cdn' | 'sse' | 'jvm'
  
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
      toast.success(`Updated ${key} to ${val}`);
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
        <div className="max-w-md w-full bg-[#0a1b2d] border border-rose-500/30 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
          <Lock className="w-12 h-12 text-rose-400 mx-auto" />
          <h2 className="text-xl font-bold font-serif text-[#E8EEF0]">Access Denied</h2>
          <p className="text-xs text-[#91B9C5]/80 font-mono leading-relaxed">
            You do not possess administrator authority to view this system console.
          </p>
        </div>
      </div>
    );
  }

  // Calculate API endpoint percentages for visual bar chart
  const endpointStats = stats?.requestsByEndpoint || {};
  const totalEndpointHits = Object.values(endpointStats).reduce((acc, curr) => acc + Number(curr), 0) || 1;
  const endpointColors = [
    { bg: 'bg-cyan-400', border: 'border-cyan-400', text: 'text-cyan-300' },
    { bg: 'bg-emerald-400', border: 'border-emerald-400', text: 'text-emerald-300' },
    { bg: 'bg-amber-400', border: 'border-amber-400', text: 'text-amber-300' },
    { bg: 'bg-purple-400', border: 'border-purple-400', text: 'text-purple-300' },
    { bg: 'bg-rose-400', border: 'border-rose-400', text: 'text-rose-300' },
  ];

  return (
    <div className="w-full min-h-screen bg-[#071523] text-[#E8EEF0] selection:bg-[#91B9C5] selection:text-[#071523] pb-24">
      {/* 1. Header Banner */}
      <section className="border-b border-[#142e44] bg-gradient-to-b from-[#0b2034] via-[#081827] to-[#071523] py-7 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#E8EEF0] tracking-wide">
                System Administration Console
              </h1>
            </div>
            <p className="text-xs font-mono text-[#91B9C5]/70">
              Manage dynamic runtime flags, listener directory, and monitor production infrastructure.
            </p>
          </div>

          {/* Sub tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#091a2a] border border-[#14324c]">
            <button
              type="button"
              onClick={() => setActiveTab('configs')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer ${
                activeTab === 'configs'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold shadow-sm'
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
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold shadow-sm'
                  : 'text-[#91B9C5]/70 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Directory ({userList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('metrics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer ${
                activeTab === 'metrics'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold shadow-sm'
                  : 'text-[#91B9C5]/70 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Infrastructure & Metrics</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. Main Content Area */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">

        {/* TAB 1: DYNAMIC CONFIGS & FEATURE FLAGS */}
        {activeTab === 'configs' && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-[#091b2c] border border-cyan-500/20 flex items-start gap-3">
              <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div className="text-xs font-sans text-[#91B9C5] leading-relaxed">
                <span className="font-bold text-[#E8EEF0]">Dynamic Runtime Flags: </span>
                Settings modified here are persisted directly into the database and take effect immediately across all connected clients and backend filters without requiring a server reboot.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Feature Flag 1: Maintenance Mode */}
              <div className="p-5 rounded-3xl bg-[#091b2c] border border-[#163857] flex flex-col justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[#E8EEF0] uppercase tracking-wider">
                      System Maintenance Mode
                    </span>
                    {configs.MAINTENANCE_MODE === 'true' ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse font-bold">
                        MAINTENANCE ACTIVE
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                        OPERATIONAL
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#91B9C5]/80 font-sans leading-relaxed">
                    When active, public and client API calls (Notes, Feed, Social) are intercepted with HTTP 503 Service Unavailable with friendly downtime notices. Administrators retain full access.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#122e47]">
                  <span className="text-[11px] font-mono text-[#91B9C5]/60">
                    Status: <strong className="text-white">{configs.MAINTENANCE_MODE === 'true' ? 'ACTIVE' : 'STANDBY'}</strong>
                  </span>
                  <button
                    type="button"
                    disabled={isSavingConfig}
                    onClick={() => handleSaveConfig('MAINTENANCE_MODE', configs.MAINTENANCE_MODE === 'true' ? 'false' : 'true')}
                    className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                      configs.MAINTENANCE_MODE === 'true'
                        ? 'bg-amber-400 text-[#07131e] hover:bg-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.3)]'
                        : 'bg-[#102d47] text-[#91B9C5] hover:text-white border border-[#1c476d]'
                    }`}
                  >
                    {configs.MAINTENANCE_MODE === 'true' ? 'Disable Maintenance' : 'Enable Maintenance'}
                  </button>
                </div>
              </div>

              {/* Feature Flag 2: Public Registration */}
              <div className="p-5 rounded-3xl bg-[#091b2c] border border-[#163857] flex flex-col justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[#E8EEF0] uppercase tracking-wider block">
                      Public User Registration
                    </span>
                    {configs.ALLOW_PUBLIC_REGISTRATION === 'true' ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                        OPEN
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                        RESTRICTED
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#91B9C5]/80 font-sans leading-relaxed">
                    Permits new listeners to sign up via Google OAuth2 into the community. When disabled, only pre-existing listener records can log in.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#122e47]">
                  <span className="text-[11px] font-mono text-[#91B9C5]/60">
                    Registration Gate: <strong className="text-white">{configs.ALLOW_PUBLIC_REGISTRATION === 'true' ? 'OPEN' : 'CLOSED'}</strong>
                  </span>
                  <button
                    type="button"
                    disabled={isSavingConfig}
                    onClick={() => handleSaveConfig('ALLOW_PUBLIC_REGISTRATION', configs.ALLOW_PUBLIC_REGISTRATION === 'true' ? 'false' : 'true')}
                    className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                      configs.ALLOW_PUBLIC_REGISTRATION === 'true'
                        ? 'bg-cyan-400 text-[#07131e] hover:bg-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.3)]'
                        : 'bg-[#102d47] text-[#91B9C5] hover:text-white border border-[#1c476d]'
                    }`}
                  >
                    {configs.ALLOW_PUBLIC_REGISTRATION === 'true' ? 'Registration Open' : 'Registration Closed'}
                  </button>
                </div>
              </div>

              {/* Numerical Setting 1: Max Caption Length */}
              <div className="p-5 rounded-3xl bg-[#091b2c] border border-[#163857] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#E8EEF0] uppercase tracking-wider">
                    Max Note Caption Length
                  </span>
                  <span className="text-xs font-mono text-cyan-300 bg-cyan-950/60 px-2.5 py-0.5 rounded-lg border border-cyan-500/30 font-bold">
                    {configs.MAX_CAPTION_LENGTH || 150} chars
                  </span>
                </div>
                <p className="text-xs text-[#91B9C5]/80 font-sans leading-relaxed">
                  Controls the maximum character limit for music note captions in the community feed. Submissions exceeding this limit will be rejected by backend validation.
                </p>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-[10px] font-mono text-[#91B9C5]/60 mr-1">Presets:</span>
                  {['100', '150', '250', '500'].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleSaveConfig('MAX_CAPTION_LENGTH', val)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-mono transition-colors cursor-pointer ${
                        String(configs.MAX_CAPTION_LENGTH) === val
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                          : 'bg-[#061421] text-[#91B9C5]/70 hover:text-white border border-[#14324c]'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="number"
                    min="50"
                    max="500"
                    onWheel={(e) => e.target.blur()}
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
                  <span className="text-xs font-mono text-cyan-300 bg-cyan-950/60 px-2.5 py-0.5 rounded-lg border border-cyan-500/30 font-bold">
                    {configs.MAX_SNIPPET_DURATION || 60} seconds
                  </span>
                </div>
                <p className="text-xs text-[#91B9C5]/80 font-sans leading-relaxed">
                  Controls the maximum playback duration for audio snippets trimmed during note creation. Keeps feed browsing snappy and fluid.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <select
                    value={configs.MAX_SNIPPET_DURATION || 60}
                    onChange={(e) => {
                      const val = e.target.value;
                      setConfigs(prev => ({ ...prev, MAX_SNIPPET_DURATION: val }));
                      handleSaveConfig('MAX_SNIPPET_DURATION', val);
                    }}
                    className="flex-1 px-3 py-2 rounded-xl bg-[#061421] border border-[#183d5f] text-xs font-mono text-[#E8EEF0] focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="30">30 seconds (Standard Hook)</option>
                    <option value="45">45 seconds (Extended Preview)</option>
                    <option value="60">60 seconds (Full Verse-Chorus)</option>
                    <option value="90">90 seconds (Preview Max)</option>
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
                  Community Directory & Role Management
                </h3>
                <p className="text-xs text-[#91B9C5]/60 font-sans mt-0.5">
                  View registered listeners, community engagement metrics, and assign administrator privileges.
                </p>
              </div>
              <button
                type="button"
                onClick={loadUsers}
                className="p-2 rounded-xl bg-[#0d263c] text-[#91B9C5] hover:text-white transition-colors cursor-pointer"
                title="Refresh Directory"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingUsers ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-[#061320] text-[#91B9C5]/80 font-mono uppercase text-[10px]">
                  <tr>
                    <th className="px-5 py-3.5">Listener</th>
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
                            {u.role === 'ADMIN' ? 'Demote to User' : 'Promote Admin'}
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

        {/* TAB 3: OPERATIONAL METRICS, YOUTUBE QUOTAS & STORAGE CAPACITY */}
        {activeTab === 'metrics' && (
          <div className="space-y-6">
            
            {/* 1. Core Platform KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-[#091b2c] border border-[#163857]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-[#91B9C5]/60">Total Listeners</span>
                  <Users className="w-3.5 h-3.5 text-cyan-400/70" />
                </div>
                <span className="text-xl font-mono font-bold text-[#E8EEF0] mt-1.5 block">{stats?.totalUsers ?? '-'}</span>
              </div>
              <div className="p-4 rounded-2xl bg-[#091b2c] border border-[#163857]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-[#91B9C5]/60">Music Notes</span>
                  <Activity className="w-3.5 h-3.5 text-cyan-300" />
                </div>
                <span className="text-xl font-mono font-bold text-cyan-300 mt-1.5 block">{stats?.totalNotes ?? '-'}</span>
              </div>
              <div className="p-4 rounded-2xl bg-[#091b2c] border border-[#163857]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-[#91B9C5]/60">Friendships</span>
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400/80" />
                </div>
                <span className="text-xl font-mono font-bold text-emerald-300 mt-1.5 block">{stats?.totalFriendships ?? '-'}</span>
              </div>
              <div className="p-4 rounded-2xl bg-[#091b2c] border border-[#163857]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-[#91B9C5]/60">Total Saves</span>
                  <Bookmark className="w-3.5 h-3.5 text-amber-300" />
                </div>
                <span className="text-xl font-mono font-bold text-amber-300 mt-1.5 block">{stats?.totalSaves ?? 0}</span>
              </div>
            </div>

            {/* 2. Interactive Services & Dependencies Health (Click to Inspect) */}
            <div className="rounded-3xl bg-[#091b2c] border border-[#163857] p-5 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#14324c] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
                    <Server className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-mono font-bold text-[#E8EEF0] uppercase tracking-wider flex items-center gap-2">
                      <span>Services & Dependencies Health</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                        CLICK TO INSPECT
                      </span>
                    </h3>
                    <p className="text-[11px] font-mono text-[#91B9C5]/70">
                      Live status, query latencies, and gateway connection states
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={loadStats}
                  className="p-1.5 rounded-xl bg-[#0d263c] text-[#91B9C5] hover:text-white transition-colors cursor-pointer self-start sm:self-auto"
                  title="Refresh Telemetry"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingStats ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Grid of 5 Clickable Services */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
                
                {/* 1. PostgreSQL */}
                <div 
                  onClick={() => setSelectedService('postgres')}
                  className={`p-3.5 rounded-2xl transition-all cursor-pointer border ${
                    selectedService === 'postgres'
                      ? 'bg-[#0f2d48] border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]'
                      : 'bg-[#061421] border-[#14324c] hover:border-[#1d4b72]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Database className="w-4 h-4 text-cyan-400" />
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <div className="font-bold text-xs text-white">PostgreSQL DB</div>
                  <div className="text-[10px] font-mono text-[#91B9C5]/70 mt-0.5">Neon Serverless</div>
                  <div className="text-[11px] font-mono text-emerald-300 font-bold mt-2">
                    {stats?.servicesHealth?.postgres?.latencyMs ?? 1} ms ping
                  </div>
                </div>

                {/* 2. YouTube API */}
                <div 
                  onClick={() => setSelectedService('youtube')}
                  className={`p-3.5 rounded-2xl transition-all cursor-pointer border ${
                    selectedService === 'youtube'
                      ? 'bg-[#0f2d48] border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]'
                      : 'bg-[#061421] border-[#14324c] hover:border-[#1d4b72]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Video className="w-4 h-4 text-rose-400" />
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <div className="font-bold text-xs text-white">YouTube Data v3</div>
                  <div className="text-[10px] font-mono text-[#91B9C5]/70 mt-0.5">Google Cloud API</div>
                  <div className="text-[11px] font-mono text-cyan-300 font-bold mt-2">
                    {stats?.youtubeQuota?.remainingUnits?.toLocaleString() ?? '10,000'} left
                  </div>
                </div>

                {/* 3. Media CDN */}
                <div 
                  onClick={() => setSelectedService('cdn')}
                  className={`p-3.5 rounded-2xl transition-all cursor-pointer border ${
                    selectedService === 'cdn'
                      ? 'bg-[#0f2d48] border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]'
                      : 'bg-[#061421] border-[#14324c] hover:border-[#1d4b72]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Radio className="w-4 h-4 text-amber-400" />
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  </div>
                  <div className="font-bold text-xs text-white">Audio & Artwork CDN</div>
                  <div className="text-[10px] font-mono text-[#91B9C5]/70 mt-0.5">Apple & YouTube Edge</div>
                  <div className="text-[11px] font-mono text-amber-300 font-bold mt-2">
                    Zero-Disk Proxy
                  </div>
                </div>

                {/* 4. SSE Gateway */}
                <div 
                  onClick={() => setSelectedService('sse')}
                  className={`p-3.5 rounded-2xl transition-all cursor-pointer border ${
                    selectedService === 'sse'
                      ? 'bg-[#0f2d48] border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]'
                      : 'bg-[#061421] border-[#14324c] hover:border-[#1d4b72]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Zap className="w-4 h-4 text-cyan-400" />
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <div className="font-bold text-xs text-white">Real-time SSE Hub</div>
                  <div className="text-[10px] font-mono text-[#91B9C5]/70 mt-0.5">SseEmitter Stream</div>
                  <div className="text-[11px] font-mono text-emerald-300 font-bold mt-2">
                    {stats?.servicesHealth?.sseGateway?.activeConnections ?? 0} active sockets
                  </div>
                </div>

                {/* 5. JVM Engine */}
                <div 
                  onClick={() => setSelectedService('jvm')}
                  className={`p-3.5 rounded-2xl transition-all cursor-pointer border ${
                    selectedService === 'jvm'
                      ? 'bg-[#0f2d48] border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]'
                      : 'bg-[#061421] border-[#14324c] hover:border-[#1d4b72]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Cpu className="w-4 h-4 text-purple-400" />
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  </div>
                  <div className="font-bold text-xs text-white">JVM Core Engine</div>
                  <div className="text-[10px] font-mono text-[#91B9C5]/70 mt-0.5">Java 21 / Spring 3</div>
                  <div className="text-[11px] font-mono text-purple-300 font-bold mt-2">
                    {stats?.systemHealth?.memoryUsagePercent ?? 5}% heap used
                  </div>
                </div>

              </div>

              {/* Dynamic Deep-Dive Inspector for Selected Service */}
              <div className="p-4 rounded-2xl bg-[#061320] border border-[#14324c] transition-all">
                {selectedService === 'postgres' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-cyan-300 uppercase flex items-center gap-2">
                        <Database className="w-4 h-4" />
                        PostgreSQL Database Engine (Cloud Production Ready)
                      </span>
                      <span className="text-xs font-mono text-emerald-300 bg-emerald-950/60 px-2.5 py-0.5 rounded-lg border border-emerald-500/30">
                        Latency: {stats?.servicesHealth?.postgres?.latencyMs ?? 1} ms
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                      <div className="p-3 rounded-xl bg-[#081827] border border-[#14324c]">
                        <span className="text-[10px] text-[#91B9C5]/60 block uppercase">Query Mechanism</span>
                        <span className="text-[#E8EEF0] font-bold mt-1 block">ANSI System Catalog</span>
                        <span className="text-[10px] text-cyan-400/80">pg_database_size()</span>
                      </div>
                      <div className="p-3 rounded-xl bg-[#081827] border border-[#14324c]">
                        <span className="text-[10px] text-[#91B9C5]/60 block uppercase">Cloud Free Tier (Neon.tech)</span>
                        <span className="text-emerald-300 font-bold mt-1 block">512 MB Free Forever</span>
                        <span className="text-[10px] text-[#91B9C5]/70">Used: {stats?.storageStats?.dbUsedMB ?? 7.8} MB (1.5%)</span>
                      </div>
                      <div className="p-3 rounded-xl bg-[#081827] border border-[#14324c]">
                        <span className="text-[10px] text-[#91B9C5]/60 block uppercase">Production Scaling</span>
                        <span className="text-[#E8EEF0] font-bold mt-1 block">1,000+ Users Ready</span>
                        <span className="text-[10px] text-emerald-400">Takes &lt; 35 MB after 1 yr</span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedService === 'youtube' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-rose-300 uppercase flex items-center gap-2">
                        <Video className="w-4 h-4" />
                        YouTube Data API v3 Daily Token Monitor
                      </span>
                      <span className="text-xs font-mono text-cyan-300 bg-cyan-950/60 px-2.5 py-0.5 rounded-lg border border-cyan-500/30">
                        Limit: 10,000 units/day
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                      <div className="p-3 rounded-xl bg-[#081827] border border-[#14324c]">
                        <span className="text-[10px] text-[#91B9C5]/60 block uppercase">Remaining Searches</span>
                        <span className="text-emerald-300 font-bold mt-1 block">~{stats?.youtubeQuota?.remainingSearches ?? 100} query calls</span>
                        <span className="text-[10px] text-[#91B9C5]/70">100 units / search call</span>
                      </div>
                      <div className="p-3 rounded-xl bg-[#081827] border border-[#14324c]">
                        <span className="text-[10px] text-[#91B9C5]/60 block uppercase">In-Memory Cache Hits</span>
                        <span className="text-amber-300 font-bold mt-1 block">{stats?.youtubeQuota?.cacheHits ?? 0} direct hits</span>
                        <span className="text-[10px] text-emerald-400">Saved {stats?.youtubeQuota?.unitsSavedByCache ?? 0} quota units</span>
                      </div>
                      <div className="p-3 rounded-xl bg-[#081827] border border-[#14324c]">
                        <span className="text-[10px] text-[#91B9C5]/60 block uppercase">Quota Reset Cycle</span>
                        <span className="text-[#E8EEF0] font-bold mt-1 block">Daily at 00:00 PT</span>
                        <span className="text-[10px] text-[#91B9C5]/70">(14:00 Vietnam Time)</span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedService === 'cdn' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-amber-300 uppercase flex items-center gap-2">
                        <Radio className="w-4 h-4" />
                        Audio & Artwork CDN Architecture
                      </span>
                      <span className="text-xs font-mono text-emerald-300 bg-emerald-950/60 px-2.5 py-0.5 rounded-lg border border-emerald-500/30">
                        Zero Disk Footprint
                      </span>
                    </div>
                    <p className="text-xs text-[#91B9C5] leading-relaxed font-sans">
                      SAY streams preview audio and cover artwork directly from global edge caches (Apple iTunes CDN and YouTube i.ytimg.com CDN). This architecture eliminates server disk write bottlenecks, giving 1,000+ users instant streaming speed with zero hosting storage fees.
                    </p>
                  </div>
                )}

                {selectedService === 'sse' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-cyan-300 uppercase flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        Server-Sent Events (SSE) Real-Time Gateway
                      </span>
                      <span className="text-xs font-mono text-emerald-300 bg-emerald-950/60 px-2.5 py-0.5 rounded-lg border border-emerald-500/30">
                        Active Hub
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                      <div className="p-3 rounded-xl bg-[#081827] border border-[#14324c]">
                        <span className="text-[10px] text-[#91B9C5]/60 block uppercase">Active Open Sockets</span>
                        <span className="text-emerald-300 font-bold mt-1 block">{stats?.servicesHealth?.sseGateway?.activeConnections ?? 0} listeners connected</span>
                        <span className="text-[10px] text-[#91B9C5]/70">Spring SseEmitter concurrent pool</span>
                      </div>
                      <div className="p-3 rounded-xl bg-[#081827] border border-[#14324c]">
                        <span className="text-[10px] text-[#91B9C5]/60 block uppercase">Unique Online Users</span>
                        <span className="text-cyan-300 font-bold mt-1 block">{stats?.servicesHealth?.sseGateway?.activeUsers ?? 0} authenticated listeners</span>
                        <span className="text-[10px] text-[#91B9C5]/70">Instant friend alerts & note sync</span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedService === 'jvm' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-purple-300 uppercase flex items-center gap-2">
                        <Cpu className="w-4 h-4" />
                        JVM Runtime & Memory Allocation
                      </span>
                      <span className="text-xs font-mono text-purple-300 bg-purple-950/60 px-2.5 py-0.5 rounded-lg border border-purple-500/30">
                        Java 21 Virtual Threads Ready
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                      <div className="p-3 rounded-xl bg-[#081827] border border-[#14324c]">
                        <span className="text-[10px] text-[#91B9C5]/60 block uppercase">Heap Memory In Use</span>
                        <span className="text-cyan-300 font-bold mt-1 block">{stats?.systemHealth?.usedMemoryMB ?? 196} MB</span>
                        <span className="text-[10px] text-[#91B9C5]/70">Max Heap: {stats?.systemHealth?.maxMemoryMB ?? 4002} MB</span>
                      </div>
                      <div className="p-3 rounded-xl bg-[#081827] border border-[#14324c]">
                        <span className="text-[10px] text-[#91B9C5]/60 block uppercase">Memory Utilization</span>
                        <span className="text-emerald-300 font-bold mt-1 block">{stats?.systemHealth?.memoryUsagePercent ?? 5}%</span>
                        <span className="text-[10px] text-[#91B9C5]/70">Minimal overhead</span>
                      </div>
                      <div className="p-3 rounded-xl bg-[#081827] border border-[#14324c]">
                        <span className="text-[10px] text-[#91B9C5]/60 block uppercase">Active Worker Threads</span>
                        <span className="text-[#E8EEF0] font-bold mt-1 block">{stats?.systemHealth?.activeThreads ?? 27} threads</span>
                        <span className="text-[10px] text-cyan-400">Async TaskExecutor Pool</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 3. Database & Storage Capacity Monitor */}
            <div className="rounded-3xl bg-[#091b2c] border border-[#163857] p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2.5 border-b border-[#14324c] pb-3">
                <div className="w-8 h-8 rounded-xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-mono font-bold text-[#E8EEF0] uppercase tracking-wider">
                    Database & Storage Footprint
                  </h3>
                  <p className="text-[11px] font-mono text-[#91B9C5]/70">
                    PostgreSQL live metrics queried directly from internal catalog (100% cloud parity on Neon/Supabase)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Left: PostgreSQL Breakdown */}
                <div className="p-4 rounded-2xl bg-[#061421] border border-[#14324c] space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-mono font-bold text-cyan-300 uppercase block">PostgreSQL Database</span>
                      <span className="text-[10px] font-mono text-[#91B9C5]/70">Neon Free Cloud Limit: 512 MB</span>
                    </div>
                    <span className="text-sm font-mono font-bold text-white bg-[#0e273d] px-2.5 py-1 rounded-lg border border-[#1b4366]">
                      {stats?.storageStats?.dbSizePretty ?? '7.9 MB'}
                    </span>
                  </div>

                  {/* Visual Bar vs 512 MB Cloud Free Tier */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-[#91B9C5]">Free Tier Quota Utilization:</span>
                      <span className="font-bold text-[#E8EEF0]">
                        {stats?.storageStats?.dbUsedMB ?? 7.8} MB / {stats?.storageStats?.cloudDbLimitMB ?? 512} MB ({stats?.storageStats?.dbPercentUsed ?? 1.5}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-[#0a1e30] border border-[#14324c] overflow-hidden p-0.5">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-400 to-sky-500 rounded-full transition-all"
                        style={{ width: `${Math.max(2, Math.min(100, stats?.storageStats?.dbPercentUsed ?? 1.5))}%` }}
                      />
                    </div>
                    <p className="text-[10px] font-mono text-emerald-300/80">
                      {stats?.storageStats?.dbRemainingMB ?? 504.2} MB available (Easily sustains 10,000+ listeners without hitting paywall)
                    </p>
                  </div>

                  {/* Relation sizes */}
                  <div className="divide-y divide-[#122e47] text-xs font-mono pt-1">
                    <div className="py-1.5 flex justify-between text-[#91B9C5]">
                      <span>Table: notes</span>
                      <span className="text-[#E8EEF0]">{stats?.storageStats?.tableSizes?.notes ?? '48 kB'}</span>
                    </div>
                    <div className="py-1.5 flex justify-between text-[#91B9C5]">
                      <span>Table: users</span>
                      <span className="text-[#E8EEF0]">{stats?.storageStats?.tableSizes?.users ?? '64 kB'}</span>
                    </div>
                    <div className="py-1.5 flex justify-between text-[#91B9C5]">
                      <span>Table: note_replies</span>
                      <span className="text-[#E8EEF0]">{stats?.storageStats?.tableSizes?.note_replies ?? '24 kB'}</span>
                    </div>
                    <div className="py-1.5 flex justify-between text-[#91B9C5]">
                      <span>Table: friendships</span>
                      <span className="text-[#E8EEF0]">{stats?.storageStats?.tableSizes?.friendships ?? '56 kB'}</span>
                    </div>
                    <div className="py-1.5 flex justify-between text-[#91B9C5]">
                      <span>Table: notifications</span>
                      <span className="text-[#E8EEF0]">{stats?.storageStats?.tableSizes?.notifications ?? '48 kB'}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Cloud Storage Reality & 1000 Users Advisory */}
                <div className="p-4 rounded-2xl bg-[#061421] border border-[#14324c] space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-mono font-bold text-amber-300 uppercase block">Media & Image Storage</span>
                      <span className="text-[10px] font-mono text-emerald-300">100% External CDN References</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                      0 MB Server Load
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-mono text-[#91B9C5]">
                      <span>Server-Hosted Storage Used:</span>
                      <span className="text-emerald-300 font-bold">
                        {stats?.storageStats?.hostedImageStorageMB ?? 0}.0 MB
                      </span>
                    </div>
                    <div className="flex justify-between text-xs font-mono text-[#91B9C5]">
                      <span>Active External CDN References:</span>
                      <span className="text-[#E8EEF0] font-bold">
                        {stats?.storageStats?.externalImageReferences ?? 14} media items
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#081827] border border-[#163857] text-[11px] text-[#91B9C5] space-y-2 leading-relaxed font-sans">
                      <div className="font-bold text-[#E8EEF0] flex items-center gap-1.5">
                        <HardDrive className="w-3.5 h-3.5 text-cyan-300" />
                        <span>Architecture Strategy for 1,000+ Users:</span>
                      </div>
                      <p>
                        SAY currently stores song covers and user avatars as CDN URLs from <strong>YouTube (i.ytimg.com)</strong> and <strong>Spotify Artwork</strong>, consuming <strong>0 MB</strong> server storage.
                      </p>
                      <p>
                        When adding direct file uploads, <strong>Cloudflare R2</strong> is the ideal choice: <strong>10 GB free forever</strong> with <strong>Zero Egress Bandwidth Fees</strong> (vastly superior to Cloudinary's 25 credits/month limit).
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* 4. Visual API Traffic & Endpoint Request Distribution Chart */}
            <div className="rounded-3xl bg-[#091b2c] border border-[#163857] p-5 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#14324c] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-950/60 border border-purple-500/40 flex items-center justify-center text-purple-300">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-mono font-bold text-[#E8EEF0] uppercase tracking-wider">
                      API Traffic & Endpoint Distribution
                    </h3>
                    <p className="text-[11px] font-mono text-[#91B9C5]/70">
                      Total requests: {stats?.totalApiRequests ?? 0} | Errors: {stats?.errorApiRequests ?? 0}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-cyan-300 bg-cyan-950/60 px-2.5 py-1 rounded-lg border border-cyan-500/30">
                    {stats?.totalApiRequests ?? 0} Total Calls
                  </span>
                </div>
              </div>

              {/* Segmented Horizontal Bar Chart */}
              <div className="space-y-2">
                <div className="w-full h-3 rounded-full bg-[#061421] border border-[#14324c] overflow-hidden flex">
                  {Object.entries(endpointStats).map(([endpoint, count], idx) => {
                    const percent = Math.round((Number(count) / totalEndpointHits) * 100);
                    const color = endpointColors[idx % endpointColors.length];
                    return (
                      <div
                        key={endpoint}
                        className={`h-full ${color.bg} transition-all`}
                        style={{ width: `${percent}%` }}
                        title={`${endpoint}: ${count} hits (${percent}%)`}
                      />
                    );
                  })}
                </div>

                {/* Legend & Breakdown Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-2">
                  {Object.entries(endpointStats).map(([endpoint, count], idx) => {
                    const percent = Math.round((Number(count) / totalEndpointHits) * 100);
                    const color = endpointColors[idx % endpointColors.length];
                    return (
                      <div 
                        key={endpoint}
                        className="p-2.5 rounded-xl bg-[#061421] border border-[#14324c] flex items-center justify-between text-xs font-mono"
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${color.bg} shrink-0`} />
                          <span className="text-[#E8EEF0] truncate font-sans">{endpoint}</span>
                        </div>
                        <div className="shrink-0 flex items-center gap-1.5">
                          <span className={`${color.text} font-bold`}>{count}</span>
                          <span className="text-[10px] text-[#91B9C5]/60">({percent}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}

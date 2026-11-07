import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import { X, Shield, FileText, ArrowLeft, CheckCircle, Sparkles, Lock } from 'lucide-react';
import { toast } from 'react-toastify';

export default function LoginModal() {
  const navigate = useNavigate();
  const { isLoginModalOpen, setLoginModalOpen, setUser } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Custom profile onboarding after first Google login
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [tempUser, setTempUser] = useState(null);
  const [customDisplayName, setCustomDisplayName] = useState('');
  const [customUsername, setCustomUsername] = useState('');
  const [usernameWarning, setUsernameWarning] = useState('');

  // Policy inspection state: null | 'terms' | 'privacy'
  const [activePolicy, setActivePolicy] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isLoginModalOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLoginModalOpen]);

  if (!isLoginModalOpen) return null;

  const handleClose = () => {
    setLoginModalOpen(false);
    setShowProfileModal(false);
    setTempUser(null);
    setCustomDisplayName('');
    setCustomUsername('');
    setUsernameWarning('');
    setActivePolicy(null);
  };

  const handleUsernameChange = (val) => {
    const raw = val.replace(/^@/, '');
    if (/[^a-zA-Z0-9_.]/.test(raw)) {
      setUsernameWarning('Only letters, numbers, dot (.) and underscore (_) allowed. No emojis or spaces.');
    } else {
      setUsernameWarning('');
    }
    const clean = raw.replace(/[^a-zA-Z0-9_.]/g, '');
    setCustomUsername(clean);
  };

  // Google Single Sign-On
  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    try {
      const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

      if (window.google && googleClientId) {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: googleClientId,
          scope: 'email profile openid',
          callback: async (tokenResponse) => {
            if (tokenResponse && tokenResponse.access_token) {
              try {
                const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                const googleProfile = await userInfoRes.json();

                const payload = {
                  email: googleProfile.email,
                  displayName: googleProfile.name || 'Audiophile',
                  avatarUrl: googleProfile.picture,
                  idToken: tokenResponse.access_token,
                };
                
                let authenticatedUser = payload;
                try {
                  const res = await authService.loginWithGoogle(payload);
                  const serverUser = Array.isArray(res) ? res[0] : (res?.data?.data || res?.data || res);
                  if (serverUser && serverUser.id) {
                    authenticatedUser = serverUser;
                  }
                } catch (backendErr) {
                  console.warn("Backend auth sync skipped, fallback to client session:", backendErr);
                }

                const token = tokenResponse.access_token || ('say_tok_' + Date.now());
                sessionStorage.setItem('say_session_token', token);
                try {
                  localStorage.removeItem('say_token');
                } catch {}

                const guaranteedId = (authenticatedUser.id && authenticatedUser.id.length === 36 && !String(authenticatedUser.id).startsWith('a0000000-'))
                  ? authenticatedUser.id
                  : null;
                const resolvedUser = {
                  ...authenticatedUser,
                  id: guaranteedId,
                  token,
                };

                const userKey = googleProfile.email || guaranteedId;
                const isSetupDone = localStorage.getItem(`say_setup_done_${userKey}`);
                const savedHandle = localStorage.getItem(`say_handle_${userKey}`);
                const savedDisplayName = localStorage.getItem(`say_name_${userKey}`);

                if (isSetupDone && savedHandle) {
                  const safeUser = {
                    id: guaranteedId,
                    displayName: savedDisplayName || authenticatedUser.displayName || 'Audiophile',
                    handle: savedHandle,
                    avatarUrl: authenticatedUser.avatarUrl || null,
                    audiophileRank: authenticatedUser.audiophileRank || "Novice Listener",
                    bio: authenticatedUser.bio || "Curating timeless records on SAY.",
                    streakDays: authenticatedUser.streakDays || 1,
                    bestStreakDays: authenticatedUser.bestStreakDays || 1,
                    notesCount: authenticatedUser.notesCount || 0,
                  };
                  setUser(safeUser);
                  toast.success(`Welcome back, ${safeUser.displayName}!`);
                  handleClose();
                  navigate('/feed');
                  return;
                }

                const initialDisplayName = authenticatedUser.displayName || 'Audiophile';
                const initialUsername = initialDisplayName
                  .normalize('NFD')
                  .replace(/[\u0300-\u036f]/g, '')
                  .replace(/\s+/g, '_')
                  .replace(/[^a-zA-Z0-9_.]/g, '');

                setTempUser(resolvedUser);
                setCustomDisplayName(initialDisplayName);
                setCustomUsername(initialUsername || '');
                setShowProfileModal(true);
              } catch (err) {
                toast.error("Unable to update profile. Please try again.");
              }
            }
          },
        });
        client.requestAccessToken();
        setIsSubmitting(false);
        return;
      }

      // Safe development fallback session (Zero personal credentials leaked)
      const devEmail = import.meta.env.VITE_DEV_USER_EMAIL || "listener@say.local";
      const payload = {
        email: devEmail,
        displayName: "Audiophile",
        avatarUrl: null,
        idToken: "say-token-" + Date.now(),
      };

      let userResult = {
        displayName: "Audiophile",
        handle: "@listener",
        ...payload,
      };

      try {
        const res = await authService.loginWithGoogle(payload);
        const serverUser = Array.isArray(res) ? res[0] : (res?.data?.data || res?.data || res);
        if (serverUser && serverUser.id) {
          userResult = { ...userResult, ...serverUser };
        }
      } catch (err) {
        console.warn("Backend auth session notice:", err);
      }

      sessionStorage.setItem('say_session_token', payload.idToken);
      try {
        localStorage.removeItem('say_token');
      } catch {}

      const userKey = payload.email || userResult.id;
      const isSetupDone = localStorage.getItem(`say_setup_done_${userKey}`);
      const savedHandle = localStorage.getItem(`say_handle_${userKey}`);
      const savedDisplayName = localStorage.getItem(`say_name_${userKey}`);

      if (isSetupDone && savedHandle) {
        const safeUser = {
          ...userResult,
          displayName: savedDisplayName || userResult.displayName || "Audiophile",
          handle: savedHandle,
        };
        setUser(safeUser);
        toast.success(`Welcome back, ${safeUser.displayName}!`);
        handleClose();
        navigate('/feed');
        return;
      }

      setTempUser(userResult);
      setCustomDisplayName(userResult.displayName || "Audiophile");
      setCustomUsername(userResult.username || "audiophile");
      setShowProfileModal(true);
    } catch (err) {
      console.warn("Sign in session notice:", err);
      toast.error("Sign in failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save customized display name (with keyboard icons) + unique username (allowing uppercase)
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const finalDisplayName = customDisplayName.trim() || tempUser.displayName || 'Audiophile';
    // Preserve uppercase letters in username, strictly no emojis or invalid chars
    const cleanUsername = customUsername.trim().replace(/[^a-zA-Z0-9_.]/g, '') || 'listener';
    const formattedHandle = cleanUsername.startsWith('@') ? cleanUsername : `@${cleanUsername}`;
    const userId = (tempUser.id && tempUser.id.length === 36 && tempUser.id.includes('-') && !String(tempUser.id).startsWith('a0000000-'))
      ? tempUser.id
      : (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'u-' + Date.now());

    // Security: Only store session token in sessionStorage, never in localStorage
    if (tempUser.token) {
      sessionStorage.setItem('say_session_token', tempUser.token);
    }
    try {
      localStorage.removeItem('say_token');
    } catch {}

    // Public presentation profile ONLY - strictly NO sensitive data (no email, no password, no auth token)
    const safeUser = {
      id: userId,
      displayName: finalDisplayName, // Rich nickname with emojis & accents (Locket style)
      handle: formattedHandle, // Unique @username with preserved casing
      avatarUrl: tempUser.avatarUrl || null,
      audiophileRank: tempUser.audiophileRank || "Novice Listener",
      bio: tempUser.bio || "Curating timeless records on SAY.",
      streakDays: tempUser.streakDays || 1,
      bestStreakDays: tempUser.bestStreakDays || 1,
      notesCount: tempUser.notesCount || 0,
    };

    // Mark one-time setup as completed permanently for this user
    const userKey = tempUser.email || userId;
    localStorage.setItem(`say_setup_done_${userKey}`, 'true');
    localStorage.setItem(`say_handle_${userKey}`, formattedHandle);
    localStorage.setItem(`say_name_${userKey}`, finalDisplayName);

    try {
      if (tempUser.id && String(tempUser.id).length > 20) {
        await authService.updateProfile(tempUser.id, {
          displayName: finalDisplayName,
          bio: safeUser.bio,
        });
      }
    } catch (err) {
      // Local fallback
    }

    setUser(safeUser);
    toast.success(`Welcome to SAY, ${finalDisplayName}!`);
    handleClose();
    navigate('/feed');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#05111d]/90 backdrop-blur-md bg-grid-dots transition-opacity duration-300">
      
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={handleClose} />

      <div className="relative z-10 w-full max-w-[460px] flex flex-col items-center animate-in fade-in zoom-in-95 duration-200">
        
        {/* Main Card */}
        <div className="w-full relative rounded-[32px] bg-[#091827] border border-[#16354d]/90 shadow-[0_30px_70px_rgba(0,0,0,0.85)] p-7 sm:p-9 flex flex-col items-center text-center">
          
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center text-[#91B9C5]/50 hover:text-[#E8EEF0] hover:bg-[#142C40]/50 transition-all cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>

          {/* VIEW 1: REGULAR LOGIN FORM */}
          {!activePolicy && !showProfileModal && (
            <>
              {/* Top Logo Squircle with Serif 'S' */}
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-b from-[#132c40] to-[#0a1824] border border-[#1e4463] flex items-center justify-center mb-5 shadow-inner ring-1 ring-white/5">
                <span className="font-serif text-2xl font-bold text-[#E8EEF0]">
                  S
                </span>
              </div>

              {/* Header Title */}
              <h2 className="font-serif text-3xl font-bold text-[#E8EEF0] tracking-tight mb-2">
                Welcome back
              </h2>

              {/* Tagline */}
              <p className="font-mono text-xs sm:text-[13px] tracking-wide text-[#91B9C5] mb-2.5">
                "Sound Around You"
              </p>

              {/* Subtitle */}
              <p className="text-xs text-[#91B9C5]/80 max-w-[300px] leading-relaxed mb-8 font-sans">
                Sign in to your musical journal. Zero passwords stored, completely secure.
              </p>

              {/* Action 1: Continue with Google Button */}
              <button
                onClick={handleGoogleLogin}
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-xl bg-[#0f2436] hover:bg-[#15334c] active:scale-[0.99] border border-[#1d4363] text-[#E8EEF0] font-semibold text-xs sm:text-sm flex items-center justify-center gap-3 transition-all duration-200 shadow-sm cursor-pointer disabled:opacity-60 group"
              >
                {/* Multicolored Google 'G' icon */}
                <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.66-5.17 3.66-9.12z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.13C3.27 21.41 7.35 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.57H1.25C.45 8.17 0 9.99 0 12s.45 3.83 1.25 5.43l4.03-3.14z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.27 2.59 1.25 6.57l4.03 3.14c.95-2.83 3.6-4.96 6.72-4.96z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>
            </>
          )}

          {/* VIEW 2: CUSTOMIZE PROFILE (NICKNAME WITH EMOJIS + USERNAME) */}
          {!activePolicy && showProfileModal && (
            <form onSubmit={handleSaveProfile} className="w-full flex flex-col items-center">
              <div className="w-16 h-16 rounded-full overflow-hidden ring-4 ring-[#91B9C5]/30 mb-3 shadow-lg">
                <img
                  src={tempUser?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80"}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#142C40] border border-[#91B9C5]/30 text-[10px] font-mono text-[#91B9C5] mb-2">
                <Sparkles className="w-3 h-3 text-[#B39DDB]" />
                <span>Google Verified Account</span>
              </div>

              <h2 className="font-serif text-2xl font-bold text-[#E8EEF0] mb-1">
                Customize Your Profile
              </h2>
              <p className="text-xs text-[#91B9C5]/80 max-w-[320px] mb-5">
                Set up your display name and unique handle to connect with friends.
              </p>

              {/* Field 1: Display Name - Allows emojis/icons from keyboard */}
              <div className="w-full mb-4 text-left">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-[#91B9C5]/90 tracking-wide">
                    Display Name
                  </label>
                  <span className="text-[10px] text-[#B39DDB] font-mono">
                    Keyboard emojis & icons allowed
                  </span>
                </div>
                <input
                  type="text"
                  value={customDisplayName}
                  onChange={(e) => setCustomDisplayName(e.target.value)}
                  placeholder="e.g. Audiophile 🎧"
                  required
                  maxLength={40}
                  className="w-full bg-[#081724] border border-[#1b3e5a] rounded-xl px-3.5 py-2.5 text-sm text-[#E8EEF0] font-sans focus:outline-none focus:border-[#91B9C5] transition-colors"
                />
                <span className="text-[10px] text-[#91B9C5]/50 mt-1 block">
                  Displayed on your music notes and profile. Emojis and full Unicode supported.
                </span>
              </div>

              {/* Field 2: Username (@username) - Strictly letters, numbers, dot, underscore. NO emojis. */}
              <div className="w-full mb-6 text-left">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-[#91B9C5]/90 tracking-wide">
                    Username (@username)
                  </label>
                  <span className="text-[10px] text-[#91B9C5]/60 font-mono">
                    3 - 30 chars (A-Z, a-z, 0-9, _, .)
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-[#91B9C5] text-sm select-none">
                    @
                  </span>
                  <input
                    type="text"
                    value={customUsername.replace(/^@/, '')}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    placeholder="audiophile_01"
                    required
                    minLength={3}
                    maxLength={30}
                    className="w-full bg-[#081724] border border-[#1b3e5a] rounded-xl pl-8 pr-3 py-2.5 text-sm text-[#E8EEF0] font-mono focus:outline-none focus:border-[#91B9C5] transition-colors"
                  />
                </div>
                {usernameWarning ? (
                  <span className="text-[10px] text-amber-300/90 mt-1 block font-medium">
                    ⚠️ {usernameWarning}
                  </span>
                ) : (
                  <span className="text-[10px] text-[#91B9C5]/50 mt-1 block">
                    Case-preserved (e.g. @Audiophile). Strictly letters, numbers, '.' and '_'. No emojis or spaces.
                  </span>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#91B9C5] to-[#B39DDB] hover:from-[#A2C7D3] hover:to-[#C1ACE8] text-[#081724] font-extrabold text-xs tracking-wider uppercase font-mono transition-all duration-200 cursor-pointer shadow-lg hover:scale-[1.02]"
              >
                Confirm & Enter Feed →
              </button>
            </form>
          )}

          {/* VIEW 3: TRANSPARENT POLICY VIEWER (TERMS & PRIVACY) */}
          {activePolicy && (
            <div className="w-full text-left animate-in fade-in duration-200">
              <button
                onClick={() => setActivePolicy(null)}
                className="inline-flex items-center gap-1.5 text-xs font-mono text-[#91B9C5] hover:text-[#E8EEF0] mb-4 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </button>

              {activePolicy === 'terms' ? (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-5 h-5 text-[#91B9C5]" />
                    <h3 className="font-serif text-xl font-bold text-[#E8EEF0]">
                      Terms of Archiving
                    </h3>
                  </div>
                  <p className="text-xs text-[#91B9C5]/80 mb-4 font-mono">
                    Transparent music archival and streaming policy:
                  </p>

                  <div className="space-y-3.5 text-xs text-[#91B9C5]/90 max-h-[300px] overflow-y-auto pr-1">
                    <div className="p-3 rounded-xl bg-[#081724] border border-[#183952]">
                      <p className="font-bold text-[#E8EEF0] mb-1 flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-[#91B9C5]" />
                        1. Fair-Use Music Streaming
                      </p>
                      <p className="text-[11px] leading-relaxed text-[#91B9C5]/80">
                        SAY does not host or redistribute MP3 files. All music tracks are streamed directly via official Spotify and YouTube APIs under non-commercial 30-second curation principles.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-[#081724] border border-[#183952]">
                      <p className="font-bold text-[#E8EEF0] mb-1 flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-[#91B9C5]" />
                        2. Content Ownership
                      </p>
                      <p className="text-[11px] leading-relaxed text-[#91B9C5]/80">
                        All listening journals, personal reflections, and aesthetic descriptions you write remain 100% your intellectual property.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-[#081724] border border-[#183952]">
                      <p className="font-bold text-[#E8EEF0] mb-1 flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-[#91B9C5]" />
                        3. Community Respect
                      </p>
                      <p className="text-[11px] leading-relaxed text-[#91B9C5]/80">
                        SAY is a civilized haven for passionate listeners. Spam, harassment, and unauthorized advertising are strictly prohibited.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-5 h-5 text-[#91B9C5]" />
                    <h3 className="font-serif text-xl font-bold text-[#E8EEF0]">
                      Privacy Manifesto
                    </h3>
                  </div>
                  <p className="text-xs text-[#91B9C5]/80 mb-4 font-mono">
                    Zero-compromise privacy and security commitment:
                  </p>

                  <div className="space-y-3.5 text-xs text-[#91B9C5]/90 max-h-[300px] overflow-y-auto pr-1">
                    <div className="p-3 rounded-xl bg-[#081724] border border-[#183952]">
                      <p className="font-bold text-[#E8EEF0] mb-1 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-[#91B9C5]" />
                        1. Safe Passwordless Sign-In
                      </p>
                      <p className="text-[11px] leading-relaxed text-[#91B9C5]/80">
                        Sign in instantly and securely with your verified account. SAY never asks for or stores your password, keeping your account completely protected.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-[#081724] border border-[#183952]">
                      <p className="font-bold text-[#E8EEF0] mb-1 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-[#91B9C5]" />
                        2. Respect for Your Privacy
                      </p>
                      <p className="text-[11px] leading-relaxed text-[#91B9C5]/80">
                        Your private email is never published. Other listeners only see your chosen display name, avatar, and musical reflections.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-[#081724] border border-[#183952]">
                      <p className="font-bold text-[#E8EEF0] mb-1 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-[#91B9C5]" />
                        3. Pure Music Experience
                      </p>
                      <p className="text-[11px] leading-relaxed text-[#91B9C5]/80">
                        SAY is created for true music enthusiasts. We never sell your personal data or musical tastes to advertisers.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={() => setActivePolicy(null)}
                className="w-full mt-5 py-2.5 rounded-xl bg-[#142C40] hover:bg-[#31566A] text-[#E8EEF0] font-mono text-xs font-bold transition-colors cursor-pointer text-center"
              >
                Understood & Continue
              </button>
            </div>
          )}

        </div>

        {/* Footer Terms & Audiophile Privacy Manifesto (Interactive) */}
        {!activePolicy && (
          <p className="mt-5 text-[11px] font-mono text-[#91B9C5]/60 text-center max-w-[360px] leading-relaxed">
            By entering SAY, you agree to our{' '}
            <button
              type="button"
              onClick={() => setActivePolicy('terms')}
              className="text-[#91B9C5] underline underline-offset-4 hover:text-[#E8EEF0] transition-colors cursor-pointer"
            >
              Terms of Archiving
            </button>{' '}
            and{' '}
            <button
              type="button"
              onClick={() => setActivePolicy('privacy')}
              className="text-[#91B9C5] underline underline-offset-4 hover:text-[#E8EEF0] transition-colors cursor-pointer"
            >
              Audiophile Privacy Manifesto
            </button>.
          </p>
        )}

      </div>
    </div>
  );
}

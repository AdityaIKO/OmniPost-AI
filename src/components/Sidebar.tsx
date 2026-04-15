import { NavLink, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { 
  LayoutDashboard, 
  Briefcase, 
  Sparkles, 
  Calendar as CalendarIcon, 
  Settings as SettingsIcon,
  LogOut,
  ChevronRight,
  X as CloseIcon,
  UserPlus,
  ChevronDown,
  User,
  Check
} from 'lucide-react';
import { cn } from '../utils/cn';
import { useState, useEffect } from 'react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/brand-profiles', label: 'Brand Profiles', icon: Briefcase },
  { path: '/generator', label: 'Content Generator', icon: Sparkles },
  { path: '/calendar', label: 'Omni-Channel Calendar', icon: CalendarIcon },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Account {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    const savedAccounts = JSON.parse(localStorage.getItem('known_accounts') || '[]');
    setAccounts(savedAccounts);

    if (auth.currentUser) {
      const currentAccount = {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email,
        displayName: auth.currentUser.displayName,
        photoURL: auth.currentUser.photoURL
      };
      
      const exists = savedAccounts.find((a: Account) => a.uid === currentAccount.uid);
      if (!exists) {
        const newAccounts = [...savedAccounts, currentAccount];
        localStorage.setItem('known_accounts', JSON.stringify(newAccounts));
        setAccounts(newAccounts);
      }
    }
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/auth');
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const handleAddAccount = async () => {
    await handleSignOut();
  };

  const handleSwitchAccount = async (account: Account) => {
    if (account.uid === auth.currentUser?.uid) return;
    await handleSignOut();
  };

  return (
    <aside className={cn(
      "fixed md:sticky top-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-screen transition-transform duration-300 ease-in-out md:translate-x-0",
      isOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      <div className="p-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
          OmniPost AI
        </h1>
        <button 
          onClick={onClose}
          className="md:hidden p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
        >
          <CloseIcon className="w-6 h-6 text-slate-400" />
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => onClose()}
            className={({ isActive }) =>
              cn(
                "flex items-center justify-between px-4 py-3 rounded-xl transition-all group",
                isActive 
                  ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-semibold" 
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
              )
            }
          >
            <div className="flex items-center gap-3">
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </div>
            <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100 dark:border-slate-800">
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group"
          >
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold overflow-hidden">
              {auth.currentUser?.photoURL ? (
                <img src={auth.currentUser.photoURL} alt="" className="w-full h-full object-cover" />
              ) : (
                auth.currentUser?.displayName?.[0] || auth.currentUser?.email?.[0].toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                {auth.currentUser?.displayName || 'User'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {auth.currentUser?.email}
              </p>
            </div>
            <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", isProfileOpen && "rotate-180")} />
          </button>

          {isProfileOpen && (
            <div className="absolute bottom-full left-0 w-full mb-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50">
              <div className="p-2 space-y-1">
                <button
                  onClick={() => {
                    navigate('/settings');
                    setIsProfileOpen(false);
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                >
                  <SettingsIcon className="w-4 h-4" />
                  <span>Settings</span>
                </button>
                
                <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
                
                <div className="px-4 py-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Switch Account</p>
                  <div className="space-y-1">
                    {accounts.map((acc) => (
                      <button
                        key={acc.uid}
                        onClick={() => handleSwitchAccount(acc)}
                        className={cn(
                          "w-full flex items-center gap-3 px-2 py-1.5 rounded-lg transition-all",
                          acc.uid === auth.currentUser?.uid 
                            ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400" 
                            : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                        )}
                      >
                        <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold overflow-hidden">
                          {acc.photoURL ? <img src={acc.photoURL} alt="" className="w-full h-full object-cover" /> : (acc.displayName?.[0] || 'U')}
                        </div>
                        <span className="text-xs truncate">{acc.displayName || acc.email}</span>
                        {acc.uid === auth.currentUser?.uid && <Check className="w-3 h-3 ml-auto" />}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleAddAccount}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add Account</span>
                </button>

                <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

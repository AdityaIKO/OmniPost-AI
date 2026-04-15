import { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { updateProfile } from 'firebase/auth';
import { 
  User, 
  Moon, 
  Sun, 
  Bell, 
  Shield, 
  Globe, 
  Check, 
  Loader2,
  Camera
} from 'lucide-react';
import { motion } from 'motion/react';

export default function Settings() {
  const [user, setUser] = useState(auth.currentUser);
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'security' | 'language'>('profile');
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(
    (localStorage.getItem('theme') as 'light' | 'dark') || 'light'
  );

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      document.body.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
    // Dispatch a custom event so other components can react if needed
    window.dispatchEvent(new Event('theme-change'));
  }, [theme]);

  const handleUpdateProfile = async () => {
    if (!auth.currentUser) return;
    setIsUpdating(true);
    try {
      await updateProfile(auth.currentUser, {
        displayName: displayName,
        photoURL: photoURL
      });
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoURL(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-12">
      <input 
        type="file" 
        id="profile-photo-upload" 
        className="hidden" 
        accept="image/*"
        onChange={handlePhotoUpload}
      />
      <header>
        <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Manage your account preferences and application theme.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
        {/* Navigation Sidebar */}
        <div className="md:col-span-4 space-y-2">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-5 py-3 rounded-2xl font-bold transition-all ${
              activeTab === 'profile' 
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" 
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <User className="w-5 h-5" />
            <span>Profile</span>
          </button>
          <button 
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center gap-3 px-5 py-3 rounded-2xl font-bold transition-all ${
              activeTab === 'notifications' 
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" 
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Bell className="w-5 h-5" />
            <span>Notifications</span>
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center gap-3 px-5 py-3 rounded-2xl font-bold transition-all ${
              activeTab === 'security' 
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" 
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Shield className="w-5 h-5" />
            <span>Security</span>
          </button>
          <button 
            onClick={() => setActiveTab('language')}
            className={`w-full flex items-center gap-3 px-5 py-3 rounded-2xl font-bold transition-all ${
              activeTab === 'language' 
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" 
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Globe className="w-5 h-5" />
            <span>Language</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="md:col-span-8 space-y-8">
          {activeTab === 'profile' && (
            <>
              {/* Profile Section */}
              <section className="bg-white dark:bg-slate-900 p-8 rounded-[32px] shadow-sm border border-slate-200 dark:border-slate-800 space-y-8">
                <div className="flex items-center gap-6">
                  <div className="relative group">
                    <div className="w-24 h-24 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-3xl font-black overflow-hidden">
                      {photoURL ? (
                        <img src={photoURL} alt="" className="w-full h-full object-cover" />
                      ) : (
                        displayName ? displayName[0].toUpperCase() : 'U'
                      )}
                    </div>
                    <button 
                      onClick={() => document.getElementById('profile-photo-upload')?.click()}
                      className="absolute bottom-0 right-0 w-8 h-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"
                    >
                      <Camera className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    </button>
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">Public Profile</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">This is how others will see you in the agency.</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Display Name</label>
                    <input 
                      type="text" 
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-slate-700 dark:text-slate-200"
                      placeholder="Enter your name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Email Address</label>
                    <input 
                      type="email" 
                      value={user?.email || ''} 
                      disabled
                      className="w-full px-5 py-3 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-slate-400 cursor-not-allowed"
                    />
                  </div>
                </div>

                <button 
                  onClick={handleUpdateProfile}
                  disabled={isUpdating || (displayName === user?.displayName && photoURL === user?.photoURL)}
                  className="px-8 py-4 bg-slate-900 dark:bg-indigo-600 hover:bg-indigo-600 dark:hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest flex items-center gap-3 transition-all disabled:opacity-50"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : updateSuccess ? (
                    <>
                      <Check className="w-5 h-5" />
                      <span>Profile Saved</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </section>

              {/* Appearance Section */}
              <section className="bg-white dark:bg-slate-900 p-8 rounded-[32px] shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">Appearance</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Customize how the application looks for you.</p>
                </div>

                <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700">
                      {theme === 'light' ? <Sun className="w-6 h-6 text-amber-500" /> : <Moon className="w-6 h-6 text-indigo-400" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">{theme === 'light' ? 'Light Mode' : 'Dark Mode'}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Switch between light and dark themes.</p>
                    </div>
                  </div>
                  <button 
                    onClick={toggleTheme}
                    className="relative w-14 h-8 bg-slate-200 dark:bg-indigo-600 rounded-full transition-colors focus:outline-none"
                  >
                    <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${theme === 'dark' ? 'translate-x-6' : ''}`} />
                  </button>
                </div>
              </section>
            </>
          )}

          {activeTab === 'notifications' && (
            <section className="bg-white dark:bg-slate-900 p-8 rounded-[32px] shadow-sm border border-slate-200 dark:border-slate-800 space-y-8">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Notifications</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Configure how you receive alerts and updates.</p>
              </div>
              <div className="space-y-4">
                <NotificationToggle label="Email Notifications" description="Receive campaign updates via email" defaultChecked />
                <NotificationToggle label="Push Notifications" description="Get real-time alerts in your browser" defaultChecked />
                <NotificationToggle label="Weekly Reports" description="Summary of your agency performance" />
              </div>
            </section>
          )}

          {activeTab === 'security' && (
            <section className="bg-white dark:bg-slate-900 p-8 rounded-[32px] shadow-sm border border-slate-200 dark:border-slate-800 space-y-8">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Security</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Manage your account security and authentication.</p>
              </div>
              <div className="space-y-6">
                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-700">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-2">Two-Factor Authentication</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Add an extra layer of security to your account.</p>
                  <button className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm">Enable 2FA</button>
                </div>
                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-700">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-2">Change Password</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Update your password regularly to stay safe.</p>
                  <button className="px-6 py-2 bg-slate-900 dark:bg-slate-700 text-white rounded-xl font-bold text-sm">Update Password</button>
                </div>
              </div>
            </section>
          )}

          {activeTab === 'language' && (
            <section className="bg-white dark:bg-slate-900 p-8 rounded-[32px] shadow-sm border border-slate-200 dark:border-slate-800 space-y-8">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Language & Region</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Select your preferred language and time zone.</p>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Preferred Language</label>
                  <select className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-slate-700 dark:text-slate-200">
                    <option>English (US)</option>
                    <option>Spanish</option>
                    <option>French</option>
                    <option>German</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Time Zone</label>
                  <select className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-slate-700 dark:text-slate-200">
                    <option>UTC-07:00 (Pacific Time)</option>
                    <option>UTC+00:00 (GMT)</option>
                    <option>UTC+01:00 (CET)</option>
                  </select>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function NotificationToggle({ label, description, defaultChecked }: { label: string, description: string, defaultChecked?: boolean }) {
  const [checked, setChecked] = useState(defaultChecked || false);
  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
      <div>
        <h4 className="font-bold text-slate-900 dark:text-white text-sm">{label}</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      <button 
        onClick={() => setChecked(!checked)}
        className={`relative w-12 h-6 rounded-full transition-colors focus:outline-none ${checked ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}
      >
        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-300 ${checked ? 'translate-x-6' : ''}`} />
      </button>
    </div>
  );
}

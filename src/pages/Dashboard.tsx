import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { GeneratedPost } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Calendar, Briefcase, TrendingUp, ArrowRight, Clock, Plus, Twitter, Facebook, Instagram } from 'lucide-react';
import { format } from 'date-fns';
import CampaignDetails from '../components/CampaignDetails';

export default function Dashboard() {
  const navigate = useNavigate();
  const [recentPosts, setRecentPosts] = useState<GeneratedPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<GeneratedPost | null>(null);
  const [stats, setStats] = useState({
    totalPosts: 0,
    scheduled: 0,
    published: 0,
    brands: 0
  });

  useEffect(() => {
    if (!auth.currentUser) return;

    // Listen to all posts for accurate statistics and recent list
    const postsQuery = query(
      collection(db, 'Users', auth.currentUser.uid, 'Generated_Posts'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribePosts = onSnapshot(postsQuery, (snapshot) => {
      const allPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GeneratedPost));
      
      // Update recent campaigns (top 5)
      setRecentPosts(allPosts.slice(0, 5));
      
      // Update dynamic stats based on the entire collection
      setStats(prev => ({
        ...prev,
        totalPosts: allPosts.length,
        scheduled: allPosts.filter(p => p.status === 'scheduled').length,
        published: allPosts.filter(p => p.status === 'published').length
      }));
    });

    const brandsQuery = collection(db, 'Users', auth.currentUser.uid, 'Brand_Profiles');
    const unsubscribeBrands = onSnapshot(brandsQuery, (snapshot) => {
      setStats(prev => ({ ...prev, brands: snapshot.size }));
    });

    return () => {
      unsubscribePosts();
      unsubscribeBrands();
    };
  }, []);

  return (
    <div className="space-y-10 pb-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Welcome back, <span className="text-indigo-600 dark:text-indigo-400 font-bold">{auth.currentUser?.displayName || 'User'}</span>. Here's your agency overview.
          </p>
        </div>
        <button 
          onClick={() => navigate('/generator')}
          className="flex items-center gap-2 bg-slate-900 dark:bg-indigo-600 text-white px-6 py-3 rounded-full font-bold hover:bg-indigo-600 dark:hover:bg-indigo-700 transition-all shadow-lg shadow-slate-200 dark:shadow-none group"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
          Create New Campaign
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Content" 
          value={stats.totalPosts} 
          icon={Sparkles} 
          color="bg-indigo-600" 
          index={0}
        />
        <StatCard 
          title="Scheduled" 
          value={stats.scheduled} 
          icon={Calendar} 
          color="bg-emerald-500" 
          index={1}
        />
        <StatCard 
          title="Published" 
          value={stats.published} 
          icon={TrendingUp} 
          color="bg-amber-500" 
          index={2}
        />
        <StatCard 
          title="Brand Profiles" 
          value={stats.brands} 
          icon={Briefcase} 
          color="bg-violet-600" 
          index={3}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Recent Campaigns</h2>
            <button 
              onClick={() => navigate('/calendar')}
              className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 group"
            >
              View Full Calendar <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          
          <div className="grid gap-4">
            {recentPosts.length > 0 ? (
              recentPosts.map((post, idx) => (
                <motion.div 
                  key={post.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => setSelectedPost(post)}
                  className="group relative flex flex-col md:flex-row md:items-center justify-between p-5 bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-2xl hover:shadow-indigo-100 dark:hover:shadow-none transition-all cursor-pointer overflow-hidden"
                >
                  <div className="flex items-center gap-5">
                    <div className="relative w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                      {post.mediaUrl ? (
                        <img src={post.mediaUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <Sparkles className="w-8 h-8 text-indigo-500" />
                      )}
                      <div className="absolute inset-0 bg-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-lg text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors tracking-tight">
                        {post.topic}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        {post.createdAt && (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                            <Clock className="w-3.5 h-3.5" />
                            {format(post.createdAt.toDate(), 'MMM d, yyyy')}
                          </div>
                        )}
                        <span className="text-slate-200 dark:text-slate-700">•</span>
                        <div className="flex items-center gap-2">
                          {post.platforms.map((platform) => {
                            const Icon = PLATFORM_ICONS[platform];
                            return (
                              <div key={platform} className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                {Icon && <Icon className="w-3.5 h-3.5" />}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-4 mt-4 md:mt-0">
                    <div className="flex flex-col items-end">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border-2 ${
                        post.status === 'published' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30' :
                        post.status === 'scheduled' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/30' :
                        'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-700'
                      }`}>
                        {post.status}
                      </span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center group-hover:bg-indigo-600 dark:group-hover:bg-indigo-500 group-hover:text-white transition-all">
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-[32px] border-2 border-dashed border-slate-200 dark:border-slate-800 p-16 text-center">
                <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="w-10 h-10 text-indigo-400" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">No Campaigns Yet</h3>
                <p className="text-slate-500 dark:text-slate-400 font-medium mb-8">Your creative journey starts with a single prompt.</p>
                <button 
                  onClick={() => navigate('/generator')}
                  className="bg-indigo-600 text-white px-8 py-4 rounded-full font-black uppercase tracking-widest hover:bg-slate-900 dark:hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 dark:shadow-none"
                >
                  Launch Generator
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <div className="bg-slate-900 dark:bg-slate-800 rounded-[32px] p-8 text-white relative overflow-hidden group border border-slate-800 dark:border-slate-700">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl group-hover:bg-indigo-600/40 transition-all duration-700" />
            <h2 className="text-2xl font-black text-white tracking-tight mb-6 relative z-10">Quick Actions</h2>
            <div className="space-y-4 relative z-10">
              <QuickAction 
                icon={Sparkles} 
                label="New Campaign" 
                color="text-white" 
                bg="bg-indigo-600" 
                onClick={() => navigate('/generator')}
              />
              <QuickAction 
                icon={Briefcase} 
                label="Brand Profile" 
                color="text-white" 
                bg="bg-violet-600" 
                onClick={() => navigate('/brand-profiles')}
              />
              <QuickAction 
                icon={Calendar} 
                label="Calendar" 
                color="text-white" 
                bg="bg-emerald-500" 
                onClick={() => navigate('/calendar')}
              />
            </div>
          </div>

          <div className="bg-indigo-600 rounded-[32px] p-8 text-white">
            <h3 className="text-xl font-black mb-2">Agency Tip</h3>
            <p className="text-indigo-100 text-sm font-medium leading-relaxed">
              Consistency is key. Use the Content Generator to maintain a 5-day posting streak for maximum engagement.
            </p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedPost && (
          <CampaignDetails
            selectedPost={selectedPost}
            user={auth.currentUser}
            onClose={() => setSelectedPost(null)}
            onUpdate={(updatedPost) => {
              setRecentPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

const PLATFORM_ICONS: Record<string, any> = {
  X: Twitter,
  Facebook: Facebook,
  Instagram: Instagram,
};

function StatCard({ title, value, icon: Icon, color, index }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -2, scale: 1.01 }}
      className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4 hover:shadow-md transition-all"
    >
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center text-white shadow-sm shrink-0`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest truncate">{title}</p>
        <p className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">{value}</p>
      </div>
    </motion.div>
  );
}

function QuickAction({ icon: Icon, label, color, bg, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center gap-4 p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group"
    >
      <div className={`w-12 h-12 rounded-xl ${bg} ${color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
        <Icon className="w-6 h-6" />
      </div>
      <span className="font-black text-white uppercase tracking-tight">{label}</span>
    </button>
  );
}

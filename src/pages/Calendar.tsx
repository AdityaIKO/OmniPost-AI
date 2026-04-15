import { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { collection, onSnapshot, query, orderBy, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { GeneratedPost } from '../types';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  isToday
} from 'date-fns';
import { 
  ChevronLeft, 
  ChevronRight, 
  Twitter, 
  Facebook, 
  Instagram, 
  Plus,
  Sparkles,
  X as CloseIcon,
  Trash2,
  Edit3,
  ArrowLeft,
  Clock,
  ExternalLink,
  Check,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils/cn';
import CampaignDetails from '../components/CampaignDetails';

const PLATFORM_ICONS: Record<string, any> = {
  X: Twitter,
  Facebook: Facebook,
  Instagram: Instagram,
};

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [posts, setPosts] = useState<GeneratedPost[]>([]);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedPost, setSelectedPost] = useState<GeneratedPost | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'Users', auth.currentUser.uid, 'Generated_Posts'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GeneratedPost));
      console.log('Calendar: Received updated posts from Firestore:', newPosts.length);
      setPosts(newPosts);
    }, (error) => {
      console.error('Calendar onSnapshot error:', error);
    });

    return () => unsubscribe();
  }, []);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const getPostsForDay = (day: Date) => {
    return posts.filter(post => {
      const postDate = post.scheduledDate ? post.scheduledDate.toDate() : post.createdAt.toDate();
      return isSameDay(postDate, day);
    });
  };

  const openPostDetail = (post: GeneratedPost) => {
    setSelectedPost(post);
    setEditData(post.outputs);
    setIsEditing(false);
  };

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Omni-Channel Calendar</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Visualize and manage your scheduled content across all platforms.</p>
        </div>
        <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <button onClick={prevMonth} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all">
            <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
          <span className="text-lg font-black text-slate-900 dark:text-white min-w-[140px] text-center">
            {format(currentDate, 'MMMM yyyy')}
          </span>
          <button onClick={nextMonth} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all">
            <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>
      </header>

      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Calendar Grid Header */}
        <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div key={day} className="py-4 text-center text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid Body */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, idx) => {
            const dayPosts = getPostsForDay(day);
            const isCurrentMonth = isSameMonth(day, monthStart);
            
            return (
              <div
                key={idx}
                onClick={() => setSelectedDay(day)}
                className={cn(
                  "min-h-[140px] p-3 border-r border-b border-slate-100 dark:border-slate-800 transition-all relative group cursor-pointer",
                  !isCurrentMonth && "bg-slate-50/30 dark:bg-slate-950/30",
                  isToday(day) && "bg-indigo-50/30 dark:bg-indigo-900/10",
                  "hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={cn(
                    "text-sm font-black w-7 h-7 flex items-center justify-center rounded-full transition-all",
                    isToday(day) ? "bg-indigo-600 text-white" : "text-slate-400 dark:text-slate-600",
                    !isCurrentMonth && "opacity-30"
                  )}>
                    {format(day, 'd')}
                  </span>
                  {dayPosts.length > 0 && (
                    <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded-md">
                      {dayPosts.length} Posts
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 mt-2">
                  {dayPosts.slice(0, 3).map((post) => (
                    <motion.div
                      key={post.id}
                      whileHover={{ scale: 1.02 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        openPostDetail(post);
                      }}
                      className={cn(
                        "p-2 rounded-xl border transition-all cursor-pointer group/post shadow-sm hover:shadow-md",
                        post.status === 'published' ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30 hover:border-emerald-300" :
                        post.status === 'scheduled' ? "bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/30 hover:border-amber-300" :
                        "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-400"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex -space-x-1">
                          {post.platforms.map((platform) => {
                            const Icon = PLATFORM_ICONS[platform];
                            return (
                              <div key={platform} className="w-4 h-4 rounded-full bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 flex items-center justify-center">
                                {Icon && <Icon className="w-2.5 h-2.5 text-slate-500 dark:text-slate-400" />}
                              </div>
                            );
                          })}
                        </div>
                        {post.publishTime && (
                          <span className={cn(
                            "text-[8px] font-black px-1 rounded uppercase tracking-tighter",
                            post.status === 'published' ? "text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40" :
                            post.status === 'scheduled' ? "text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40" :
                            "text-slate-600 dark:text-slate-400 bg-slate-200 dark:bg-slate-700"
                          )}>
                            {post.publishTime}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate">
                        {post.topic}
                      </p>
                    </motion.div>
                  ))}
                  {dayPosts.length > 3 && (
                    <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 text-center py-1 bg-slate-50/50 dark:bg-slate-800/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
                      +{dayPosts.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-6 text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span>Published</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span>Scheduled</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-sky-400" />
          <span>Draft</span>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {/* Step One: Day View Modal */}
        {selectedDay && !selectedPost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
            >
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white italic tracking-tight">Content for {format(selectedDay, 'MMMM d')}</h3>
                  <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">{getPostsForDay(selectedDay).length} items scheduled</p>
                </div>
                <button onClick={() => setSelectedDay(null)} className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-600 transition-all">
                  <CloseIcon className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <div className="p-8 max-h-[60vh] overflow-y-auto space-y-4 custom-scrollbar">
                {getPostsForDay(selectedDay).length > 0 ? (
                  getPostsForDay(selectedDay).map((post) => (
                    <div 
                      key={post.id}
                      onClick={() => openPostDetail(post)}
                      className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-500 hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shadow-sm">
                          {post.mediaUrl ? (
                            <img src={post.mediaUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <Sparkles className="w-6 h-6 text-indigo-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 dark:text-white text-sm truncate max-w-[180px] italic">{post.topic}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{post.publishTime}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-1">
                          {post.platforms.map((platform) => {
                            const Icon = PLATFORM_ICONS[platform];
                            return (
                              <div key={platform} className="w-6 h-6 rounded-full bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 flex items-center justify-center shadow-sm">
                                {Icon && <Icon className="w-3 h-3 text-slate-400 dark:text-slate-300" />}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Sparkles className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
                    <p className="text-slate-400 dark:text-slate-500 font-bold">No content scheduled for this day.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {/* Step Two: Post Detail View Modal */}
        {selectedPost && (
          <CampaignDetails
            selectedPost={selectedPost}
            user={auth.currentUser}
            onClose={() => setSelectedPost(null)}
            onDayViewClose={() => setSelectedDay(null)}
            onUpdate={(updatedPost) => {
              setPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
              setToast("Post updated successfully.");
            }}
          />
        )}
      </AnimatePresence>

      {/* Success Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-800"
          >
            <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
              <Check className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm tracking-tight">{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

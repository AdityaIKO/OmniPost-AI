import React, { useState } from 'react';
import { doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { GeneratedPost } from '../types';
import { format } from 'date-fns';
import { 
  Twitter, 
  Facebook, 
  Instagram, 
  X as CloseIcon,
  Trash2,
  Edit3,
  ArrowLeft,
  Clock,
  ExternalLink,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../utils/cn';

const PLATFORM_ICONS: Record<string, any> = {
  X: Twitter,
  Facebook: Facebook,
  Instagram: Instagram,
};

interface CampaignDetailsProps {
  selectedPost: GeneratedPost;
  user: any;
  onClose: () => void;
  onDayViewClose?: () => void;
  onUpdate?: (updatedPost: GeneratedPost) => void;
}

export default function CampaignDetails({ 
  selectedPost, 
  user, 
  onClose, 
  onDayViewClose,
  onUpdate 
}: CampaignDetailsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>(selectedPost.outputs);
  const [isRegeneratingImage, setIsRegeneratingImage] = useState(false);
  const [refinementPrompt, setRefinementPrompt] = useState('');

  const handleRegenerateImage = async () => {
    if (!user || !selectedPost.id) return;
    setIsRegeneratingImage(true);
    try {
      const basePrompt = (refinementPrompt || selectedPost.topic) + " professional, high-fidelity, 4k";
      const encodedPrompt = encodeURIComponent(basePrompt);
      const newMediaUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&model=flux&seed=${Math.floor(Math.random() * 1000000)}`;
      
      const postRef = doc(db, 'Users', user.uid, 'Generated_Posts', selectedPost.id);
      await updateDoc(postRef, { mediaUrl: newMediaUrl });
      
      if (onUpdate) {
        onUpdate({ ...selectedPost, mediaUrl: newMediaUrl });
      }
    } catch (error) {
      console.error('Error regenerating image:', error);
    } finally {
      setIsRegeneratingImage(false);
    }
  };

  const handleDelete = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId || !selectedPost?.id) return console.log("Missing ID");

      // Direct Action without confirmation to bypass preview blockers
      await deleteDoc(doc(db, "Users", userId, "Generated_Posts", selectedPost.id));

      // Force UI to close and refresh data
      onClose();
      if (onDayViewClose) onDayViewClose();
      console.log("SUCCESSFULLY DELETED FROM FIRESTORE");
    } catch (e: any) {
      console.log("DATABASE ERROR:", e.message);
    }
  };

  const handleUpdatePost = async () => {
    if (!user || !selectedPost?.id || !editData) return;
    try {
      await updateDoc(doc(db, 'Users', user.uid, 'Generated_Posts', selectedPost.id), {
        outputs: editData
      });
      setIsEditing(false);
      if (onUpdate) {
        onUpdate({ ...selectedPost, outputs: editData });
      }
    } catch (error) {
      console.error('Error updating post:', error);
    }
  };

  const handleStatusChange = async (newStatus: 'draft' | 'scheduled' | 'published') => {
    if (!user || !selectedPost?.id) return;
    try {
      await updateDoc(doc(db, 'Users', user.uid, 'Generated_Posts', selectedPost.id), {
        status: newStatus
      });
      if (onUpdate) {
        onUpdate({ ...selectedPost, status: newStatus });
      }
      console.log("STATUS UPDATED TO:", newStatus);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200 dark:border-slate-800"
      >
        {/* Header */}
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-5">
            <button 
              onClick={onClose} 
              className="w-12 h-12 flex items-center justify-center bg-white dark:bg-slate-800 rounded-2xl transition-all border border-slate-200 dark:border-slate-700 hover:border-indigo-600 hover:text-indigo-600 shadow-sm"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Campaign Details</h3>
              <div className="flex items-center gap-4 mt-1">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "w-2.5 h-2.5 rounded-full animate-pulse",
                    selectedPost.status === 'published' ? "bg-emerald-500" :
                    selectedPost.status === 'scheduled' ? "bg-amber-500" : "bg-sky-400"
                  )} />
                  <select
                    value={selectedPost.status}
                    onChange={(e) => handleStatusChange(e.target.value as any)}
                    className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] bg-transparent border-none focus:ring-0 cursor-pointer hover:text-indigo-600 transition-colors"
                  >
                    <option value="draft">Draft</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="published">Published</option>
                  </select>
                </div>
                <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.2em]">
                  • {selectedPost.publishTime}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleDelete}
              className="px-5 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border border-red-100 dark:border-red-900/30 italic"
            >
              Delete Post
            </button>
            <button 
              type="button"
              onClick={onClose} 
              className="w-12 h-12 flex items-center justify-center bg-white dark:bg-slate-800 rounded-2xl transition-all border border-slate-200 dark:border-slate-700 hover:border-indigo-600 hover:text-indigo-600 shadow-sm"
            >
              <CloseIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Visual Preview */}
            <div className="lg:col-span-5 space-y-8">
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Visual Asset</h4>
                <div className="aspect-square bg-slate-100 dark:bg-slate-800 rounded-[40px] border border-slate-200 dark:border-slate-700 overflow-hidden shadow-2xl shadow-slate-200 dark:shadow-none relative group">
                  {selectedPost.mediaUrl ? (
                    <>
                      <img 
                        src={selectedPost.mediaUrl} 
                        alt="" 
                        className={cn(
                          "w-full h-full object-cover group-hover:scale-105 transition-transform duration-700",
                          isRegeneratingImage && "opacity-50 grayscale animate-pulse"
                        )} 
                        referrerPolicy="no-referrer" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      <div className="absolute bottom-6 left-6 right-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all space-y-3">
                        <input 
                          type="text"
                          placeholder="Refine image prompt..."
                          value={refinementPrompt}
                          onChange={(e) => setRefinementPrompt(e.target.value)}
                          className="w-full px-5 py-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-2xl text-xs font-bold border-none focus:ring-2 focus:ring-indigo-500 outline-none shadow-xl text-slate-900 dark:text-white"
                        />
                        <button 
                          onClick={handleRegenerateImage}
                          disabled={isRegeneratingImage}
                          className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-900 transition-all shadow-xl"
                        >
                          <RefreshCw className={cn("w-4 h-4", isRegeneratingImage && "animate-spin")} />
                          {isRegeneratingImage ? 'Regenerating...' : 'Regenerate Image'}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Sparkles className="w-12 h-12 text-indigo-200 animate-spin" />
                    </div>
                  )}
                </div>
              </div>
              <div className="p-8 bg-slate-900 dark:bg-slate-800 rounded-[32px] border border-slate-800 dark:border-slate-700 shadow-xl">
                <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Topic Angle</h5>
                <p className="text-xl font-black text-white leading-tight tracking-tight">{selectedPost.topic}</p>
              </div>
            </div>

            {/* Platform Copy */}
            <div className="lg:col-span-7 space-y-8">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Platform Specific Copy</h4>
                {!isEditing ? (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 uppercase tracking-widest flex items-center gap-2 italic"
                  >
                    <Edit3 className="w-4 h-4" /> Edit Content
                  </button>
                ) : (
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setIsEditing(false)}
                      className="text-[10px] font-black text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400 uppercase tracking-widest"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleUpdatePost}
                      className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 uppercase tracking-widest italic"
                    >
                      Save Changes
                    </button>
                  </div>
                )}
              </div>
              
              <div className="space-y-8">
                {selectedPost.platforms.map((platform) => {
                  const Icon = PLATFORM_ICONS[platform];
                  return (
                    <div key={platform} className="space-y-4 group/platform">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-700 group-hover/platform:scale-110 transition-transform">
                          {Icon && <Icon className="w-5 h-5 text-slate-900 dark:text-white" />}
                        </div>
                        <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{platform}</span>
                      </div>
                      {isEditing ? (
                        <textarea
                          value={editData?.[platform] || ''}
                          onChange={(e) => setEditData({ ...editData, [platform]: e.target.value })}
                          className="w-full p-6 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[24px] text-sm text-slate-700 dark:text-slate-200 leading-relaxed focus:ring-2 focus:ring-indigo-500 outline-none h-32 resize-none font-medium"
                        />
                      ) : (
                        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-[24px] p-6 text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-medium group-hover/platform:border-indigo-200 dark:group-hover/platform:border-indigo-500 transition-all">
                          {selectedPost.outputs?.[platform as keyof typeof selectedPost.outputs] || 'No copy generated.'}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-8 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Scheduled for {format(selectedPost.scheduledDate?.toDate() || new Date(), 'MMMM d, yyyy')}</span>
          </div>
          <div className="flex gap-4 w-full sm:w-auto">
            <button 
              onClick={onClose}
              className="flex-1 sm:flex-none px-10 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700 transition-all italic"
            >
              Close
            </button>
            <button 
              onClick={() => {
                alert('This would trigger the platform-specific publishing flow.');
              }}
              className="flex-1 sm:flex-none px-10 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 dark:hover:bg-indigo-700 shadow-xl shadow-indigo-100 dark:shadow-none transition-all italic"
            >
              Publish Now
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

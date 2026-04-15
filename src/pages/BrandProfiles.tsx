import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, onSnapshot, query, orderBy, Timestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { BrandProfile } from '../types';
import { Plus, Trash2, Edit2, X, Briefcase, Users, MessageSquare, Settings, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function BrandProfiles() {
  const [brands, setBrands] = useState<BrandProfile[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<BrandProfile | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    brandName: '',
    industry: '',
    targetAudience: '',
    toneOfVoice: 'Professional',
    customInstructions: ''
  });

  useEffect(() => {
    if (!auth.currentUser) return;

    // Use the path requested by the user: Users/{uid}/Brand_Profiles
    const q = query(
      collection(db, 'Users', auth.currentUser.uid, 'Brand_Profiles'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const brandData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as BrandProfile));
      setBrands(brandData);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) {
      alert('You must be logged in to save brand profiles.');
      return;
    }

    try {
      const brandData = {
        ...formData,
        updatedAt: Timestamp.now()
      };

      if (editingBrand) {
        await updateDoc(doc(db, 'Users', auth.currentUser.uid, 'Brand_Profiles', editingBrand.id!), brandData);
      } else {
        await addDoc(collection(db, 'Users', auth.currentUser.uid, 'Brand_Profiles'), {
          ...brandData,
          createdAt: Timestamp.now()
        });
      }

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      closeModal();
    } catch (error) {
      console.error('Error saving brand profile:', error);
      alert('Failed to save brand profile. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!auth.currentUser) return;
    if (!window.confirm('Are you sure you want to delete this brand profile?')) return;

    try {
      await deleteDoc(doc(db, 'Users', auth.currentUser.uid, 'Brand_Profiles', id));
    } catch (error) {
      console.error('Error deleting brand profile:', error);
      alert('Failed to delete brand profile.');
    }
  };

  const openModal = (brand?: BrandProfile) => {
    if (brand) {
      setEditingBrand(brand);
      setFormData({
        brandName: brand.brandName,
        industry: brand.industry,
        targetAudience: brand.targetAudience,
        toneOfVoice: brand.toneOfVoice,
        customInstructions: brand.customInstructions || ''
      });
    } else {
      setEditingBrand(null);
      setFormData({
        brandName: '',
        industry: '',
        targetAudience: '',
        toneOfVoice: 'Professional',
        customInstructions: ''
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBrand(null);
  };

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Brand Profiles</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Manage your brand identities and AI personas.</p>
        </div>
        <div className="flex items-center gap-4">
          <AnimatePresence>
            {showSuccess && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 rounded-xl text-sm font-medium"
              >
                <CheckCircle2 className="w-4 h-4" />
                Profile saved successfully!
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={() => openModal()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-200 dark:shadow-none"
          >
            <Plus className="w-5 h-5" />
            Add Brand
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {brands.map((brand) => (
            <motion.div
              key={brand.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 hover:border-indigo-300 dark:hover:border-indigo-500 transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => openModal(brand)}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(brand.id!)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{brand.brandName}</h3>
              <p className="text-sm text-indigo-600 dark:text-indigo-400 font-bold mb-4">{brand.industry}</p>

              <div className="space-y-3">
                <div className="flex items-start gap-3 text-sm">
                  <Users className="w-4 h-4 text-slate-400 dark:text-slate-500 mt-0.5" />
                  <p className="text-slate-600 dark:text-slate-400 font-medium line-clamp-2">{brand.targetAudience}</p>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <MessageSquare className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md font-bold">
                    {brand.toneOfVoice}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
            >
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {editingBrand ? 'Edit Brand Profile' : 'Add New Brand Profile'}
                </h2>
                <button onClick={closeModal} className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-full transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Brand Name</label>
                    <input
                      required
                      value={formData.brandName}
                      onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                      className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-slate-700 dark:text-slate-200"
                      placeholder="e.g. Acme Corp"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Industry / Niche</label>
                    <input
                      required
                      value={formData.industry}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                      className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-slate-700 dark:text-slate-200"
                      placeholder="e.g. SaaS, E-commerce"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Target Audience</label>
                  <textarea
                    required
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                    className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all h-24 resize-none font-bold text-slate-700 dark:text-slate-200"
                    placeholder="Describe who your brand speaks to..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Tone of Voice</label>
                  <select
                    value={formData.toneOfVoice}
                    onChange={(e) => setFormData({ ...formData, toneOfVoice: e.target.value })}
                    className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-slate-700 dark:text-slate-200"
                  >
                    <option>Professional</option>
                    <option>Playful & Witty</option>
                    <option>Inspirational</option>
                    <option>Technical & Authoritative</option>
                    <option>Minimalist</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Custom AI Instructions (Optional)
                  </label>
                  <textarea
                    value={formData.customInstructions}
                    onChange={(e) => setFormData({ ...formData, customInstructions: e.target.value })}
                    className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all h-24 resize-none font-bold text-slate-700 dark:text-slate-200"
                    placeholder="Specific rules for the AI to follow..."
                  />
                </div>

                <div className="pt-4 flex gap-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl font-black uppercase tracking-widest transition-all italic"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-4 bg-indigo-600 hover:bg-slate-900 dark:hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-100 dark:shadow-none italic"
                  >
                    {editingBrand ? 'Save Changes' : 'Create Profile'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { collection, addDoc, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';
import { BrandProfile, GeneratedPost } from '../types';
import { GoogleGenAI } from "@google/genai";
import { 
  Sparkles, 
  Image as ImageIcon, 
  Save, 
  Check, 
  Loader2,
  Twitter,
  Facebook,
  Instagram,
  RefreshCw,
  Calendar as CalendarIcon,
  Clock,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  addDays, 
  format, 
  startOfWeek, 
  addWeeks, 
  isMonday, 
  nextMonday, 
  isSameDay, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval,
  isToday,
  isPast,
  setHours,
  setMinutes
} from 'date-fns';
import { cn } from '../utils/cn';

// For testing purposes, using the provided key as a fallback.
const FALLBACK_API_KEY = "AIzaSyDh8g1Qeu-iUgE5rbhERvYzGnXVwZ7nhTo";
const GET_API_KEY = () => process.env.GEMINI_API_KEY || process.env.API_KEY || FALLBACK_API_KEY;

const PLATFORMS = [
  { id: 'X', icon: Twitter, color: 'text-slate-900', bg: 'bg-slate-100' },
  { id: 'Facebook', icon: Facebook, color: 'text-blue-600', bg: 'bg-blue-50' },
  { id: 'Instagram', icon: Instagram, color: 'text-pink-600', bg: 'bg-pink-50' },
];

const PILLARS = ['Educational', 'Behind-the-Scenes', 'Promotional', 'Inspirational', 'Entertainment'];
const TIME_SLOTS = [
  { id: 'morning', label: 'Morning', time: '09:00' },
  { id: 'noon', label: 'Noon', time: '13:00' },
  { id: 'afternoon', label: 'Afternoon', time: '18:00' },
];

export default function ContentGenerator() {
  const navigate = useNavigate();
  const [brands, setBrands] = useState<BrandProfile[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [contentPillar, setContentPillar] = useState(PILLARS[0]);
  const [startDate, setStartDate] = useState<Date>(nextMonday(new Date()));
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(TIME_SLOTS[0].id);
  const [topic, setTopic] = useState('');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPosts, setGeneratedPosts] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [refinementPrompts, setRefinementPrompts] = useState<Record<number, string>>({});
  const [isRegeneratingImage, setIsRegeneratingImage] = useState<Record<number, boolean>>({});

  const handleRegenerateImage = async (index: number) => {
    setIsRegeneratingImage(prev => ({ ...prev, [index]: true }));
    try {
      const post = generatedPosts[index];
      const refinement = refinementPrompts[index] || '';
      const basePrompt = (refinement || post.topic) + " professional, high-fidelity, 4k";
      const encodedPrompt = encodeURIComponent(basePrompt);
      const newMediaUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&model=flux&seed=${Math.floor(Math.random() * 1000000)}`;
      
      const updatedPosts = [...generatedPosts];
      updatedPosts[index] = { ...post, mediaUrl: newMediaUrl };
      setGeneratedPosts(updatedPosts);
    } finally {
      setIsRegeneratingImage(prev => ({ ...prev, [index]: false }));
    }
  };
  const [allPosts, setAllPosts] = useState<GeneratedPost[]>([]);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'Users', auth.currentUser.uid, 'Brand_Profiles'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setBrands(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BrandProfile)));
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'Users', auth.currentUser.uid, 'Generated_Posts')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAllPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GeneratedPost)));
    });

    return () => unsubscribe();
  }, []);

  const calculateStartDate = async () => {
    return startDate;
  };

  const generateCampaign = async () => {
    if (!selectedBrandId || selectedPlatforms.length === 0 || !topic) return;
    
    setIsGenerating(true);
    setGeneratedPosts([]);
    setSaveSuccess(false);

    const brand = brands.find(b => b.id === selectedBrandId);
    if (!brand) return;

    try {
      const apiKey = GET_API_KEY();
      const ai = new GoogleGenAI({ apiKey });
      
      // 1. Generate Weekly Strategy and Copy
      const textModel = "gemini-3.1-pro-preview";
      const systemInstruction = `You are a world-class social media strategist for ${brand.brandName}, a business in the ${brand.industry} industry. 
      Target Audience: ${brand.targetAudience}. 
      Tone of Voice: ${brand.toneOfVoice}. 
      Custom Instructions: ${brand.customInstructions || 'None'}.
      
      Your task is to take the user's "Core Topic" and break it down into a 5-day weekly campaign strategy.
      For each of the 5 days, generate highly tailored content for the following platforms: ${selectedPlatforms.join(', ')}.
      Content Pillar: ${contentPillar}.
      
      Strict Formatting Rules:
      - Return a JSON array of 5 objects.
      - Each object must have:
        - "day": number (1-5)
        - "subTopic": string (a specific angle for that day)
        - "imagePrompt": string (a detailed prompt for an AI image generator, focused on high-quality, professional photography or digital art suitable for the brand)
        - "platforms": an object where keys are platform names and values are the generated text.
      
      Platform Specifics:
      - X (Twitter): Max 280 characters, strong hook, 2 hashtags.
      - Facebook: 3-4 professional paragraphs, formatted for readability.
      - Instagram: Clean visual description, strong CTA, 5-7 niche hashtags.`;

      const textResponse = await ai.models.generateContent({
        model: textModel,
        contents: `Generate a 5-day weekly social media campaign about: ${topic}`,
        config: {
          systemInstruction,
          responseMimeType: "application/json"
        }
      });

      const campaignData = JSON.parse(textResponse.text || '[]');
      
      // 2. Assign AI Generated Images and Timing for each post
      const postsWithImages = [];
      const startDate = await calculateStartDate();
      
      for (let i = 0; i < campaignData.length; i++) {
        const dayData = campaignData[i];
        const scheduledDate = addDays(startDate, i);
        const timeSlot = TIME_SLOTS.find(s => s.id === selectedTimeSlot);
        const publishTime = timeSlot?.time || '09:00';
        
        // Use Pollinations AI for real image generation based on the prompt
        const encodedPrompt = encodeURIComponent(dayData.imagePrompt + " professional, high-fidelity, 4k");
        const mediaUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&model=flux&seed=${Math.floor(Math.random() * 1000000)}`;

        postsWithImages.push({
          topic: dayData.subTopic,
          outputs: dayData.platforms,
          mediaUrl,
          scheduledDate,
          publishTime,
          day: i + 1
        });
        
        setGeneratedPosts([...postsWithImages]);
      }

    } catch (error: any) {
      console.error('Generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const saveWeeklyCampaign = async () => {
    console.log('Attempting to save weekly campaign...', {
      brandId: selectedBrandId,
      platforms: selectedPlatforms,
      postsCount: generatedPosts.length
    });

    if (!auth.currentUser || generatedPosts.length === 0) {
      console.warn('Save aborted: No user or no generated posts.');
      return;
    }

    // Data Protection: Removed confirmation to enable multi-campaign stacking as requested
    console.log('Proceeding with multi-campaign stacking for dates:', 
      generatedPosts.map(p => format(p.scheduledDate, 'yyyy-MM-dd'))
    );

    setIsSaving(true);
    try {
      for (const postData of generatedPosts) {
        console.log('Saving post to Firestore:', postData);
        const post: Omit<GeneratedPost, 'id'> = {
          brandProfileId: selectedBrandId,
          platforms: selectedPlatforms,
          contentPillar,
          topic: postData.topic,
          outputs: postData.outputs,
          mediaUrl: postData.mediaUrl,
          mediaType: 'image',
          status: 'scheduled',
          // Ensure we are saving a clean Firestore Timestamp for March 2026
          scheduledDate: Timestamp.fromDate(new Date(postData.scheduledDate)),
          publishTime: postData.publishTime,
          createdAt: Timestamp.now()
        };
        const docRef = await addDoc(collection(db, 'Users', auth.currentUser.uid, 'Generated_Posts'), post);
        console.log('Post saved successfully with ID:', docRef.id);
      }
      setSaveSuccess(true);
      console.log('All posts saved successfully. Redirecting to calendar...');
      setTimeout(() => {
        navigate('/calendar');
      }, 1000);
    } catch (error) {
      console.error('Error saving campaign:', error);
      alert('Failed to save campaign. Check console for details.');
    } finally {
      setIsSaving(false);
    }
  };

  const togglePlatform = (id: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-10 pb-12">
      <header>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Content Generator</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Create multi-channel campaigns in seconds with <span className="text-indigo-600 dark:text-indigo-400 font-bold">AI Precision</span>.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Input Form */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] shadow-sm border border-slate-200 dark:border-slate-800 space-y-8">
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Select Brand Profile</label>
              <select
                value={selectedBrandId}
                onChange={(e) => setSelectedBrandId(e.target.value)}
                className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-slate-700 dark:text-slate-200"
              >
                <option value="">Choose a brand...</option>
                {brands.map(brand => (
                  <option key={brand.id} value={brand.id}>{brand.brandName}</option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Target Platforms</label>
              <div className="grid grid-cols-2 gap-3">
                {PLATFORMS.map(platform => (
                  <button
                    key={platform.id}
                    onClick={() => togglePlatform(platform.id)}
                    className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                      selectedPlatforms.includes(platform.id)
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-100 dark:shadow-none"
                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-300 dark:hover:border-indigo-500"
                    }`}
                  >
                    <platform.icon className="w-5 h-5" />
                    <span className="text-sm font-black uppercase">{platform.id}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Content Pillar</label>
              <div className="flex flex-wrap gap-2">
                {PILLARS.map(pillar => (
                  <button
                    key={pillar}
                    onClick={() => setContentPillar(pillar)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      contentPillar === pillar
                        ? "bg-indigo-600 text-white border border-indigo-600 shadow-lg shadow-indigo-100 dark:shadow-none"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                    }`}
                  >
                    {pillar}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Campaign Schedule</label>
              
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Time Slot</label>
                <div className="grid grid-cols-3 gap-2">
                  {TIME_SLOTS.map(slot => (
                    <button
                      key={slot.id}
                      onClick={() => setSelectedTimeSlot(slot.id)}
                      className={cn(
                        "py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                        selectedTimeSlot === slot.id
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100 dark:shadow-none"
                          : "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                      )}
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Start Date</label>
                <MiniCalendar 
                  selectedDate={startDate} 
                  onDateSelect={setStartDate} 
                  allPosts={allPosts}
                  selectedTimeSlot={selectedTimeSlot}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">What is the core topic?</label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all h-40 resize-none font-medium text-slate-700 dark:text-slate-200"
                placeholder="e.g. Launching our new summer collection with a 20% discount..."
              />
            </div>

            <button
              onClick={generateCampaign}
              disabled={isGenerating || !selectedBrandId || selectedPlatforms.length === 0 || !topic}
              className="w-full py-5 bg-slate-900 dark:bg-indigo-600 hover:bg-indigo-600 dark:hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-2xl shadow-slate-200 dark:shadow-none disabled:opacity-50 disabled:shadow-none italic"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6" />
                  <span>Generate Campaign</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Output Preview */}
        <div className="lg:col-span-8 space-y-6">
          {generatedPosts.length === 0 && !isGenerating && (
            <div className="bg-white dark:bg-slate-900 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-slate-800 p-20 flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mb-8">
                <Sparkles className="w-12 h-12 text-indigo-400" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-3">Ready to create?</h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium max-w-md">
                Fill out the brief to generate a high-impact 5-day campaign with AI-generated visuals and copy.
              </p>
            </div>
          )}

          {isGenerating && generatedPosts.length === 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 p-20 flex flex-col items-center justify-center text-center space-y-8">
              <div className="relative">
                <div className="w-32 h-32 border-[6px] border-indigo-50 dark:border-indigo-900/20 border-t-indigo-600 rounded-full animate-spin"></div>
                <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">AI is working its magic...</h3>
                <p className="text-slate-500 dark:text-slate-400 mt-3 font-medium">Crafting strategy and rendering high-fidelity cinematic visuals. This may take a moment...</p>
              </div>
              <div className="flex gap-3">
                <div className="w-3 h-3 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-3 h-3 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-3 h-3 bg-indigo-600 rounded-full animate-bounce"></div>
              </div>
            </div>
          )}

          {generatedPosts.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl shadow-slate-200 dark:shadow-none border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-xl">
                      <Sparkles className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Campaign Assets</h3>
                      <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{generatedPosts.length}/5 Posts Ready</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={generateCampaign}
                      disabled={isGenerating}
                      className="p-4 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 rounded-2xl border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all disabled:opacity-50"
                    >
                      <RefreshCw className={`w-6 h-6 ${isGenerating ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      onClick={saveWeeklyCampaign}
                      disabled={isSaving || generatedPosts.length === 0}
                      className={`px-8 py-4 rounded-2xl font-black uppercase tracking-widest flex items-center gap-3 transition-all italic ${
                        saveSuccess 
                          ? "bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" 
                          : "bg-indigo-600 text-white hover:bg-slate-900 dark:hover:bg-indigo-700 shadow-xl shadow-indigo-100 dark:shadow-none disabled:opacity-50"
                      }`}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : saveSuccess ? (
                        <>
                          <Check className="w-5 h-5" />
                          <span>Scheduled</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          <span>Schedule All</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="p-8 space-y-12">
                  {generatedPosts.map((post, index) => (
                    <div key={index} className="grid grid-cols-1 xl:grid-cols-2 gap-10 pb-12 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0">
                      {/* Media Preview */}
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h4 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-3 uppercase italic">
                            <span className="w-8 h-8 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl flex items-center justify-center text-xs">
                              {index + 1}
                            </span>
                            Day {index + 1}
                          </h4>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-full uppercase tracking-widest">
                              {post.publishTime}
                            </span>
                            <span className="text-[10px] uppercase tracking-widest font-black text-slate-300 dark:text-slate-600">
                              AI Generated • 1:1
                            </span>
                          </div>
                        </div>
                        <div className="aspect-square bg-slate-100 dark:bg-slate-800 rounded-[32px] border border-slate-200 dark:border-slate-700 overflow-hidden relative group shadow-inner">
                          {post.mediaUrl ? (
                            <>
                              <img 
                                src={post.mediaUrl} 
                                alt={`Day ${index + 1}`} 
                                className={cn(
                                  "w-full h-full object-cover group-hover:scale-105 transition-transform duration-700",
                                  isRegeneratingImage[index] && "opacity-50 grayscale animate-pulse"
                                )} 
                                referrerPolicy="no-referrer" 
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                              
                              <div className="absolute bottom-4 left-4 right-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all space-y-2">
                                <input 
                                  type="text"
                                  placeholder="Refine image prompt..."
                                  value={refinementPrompts[index] || ''}
                                  onChange={(e) => setRefinementPrompts({ ...refinementPrompts, [index]: e.target.value })}
                                  className="w-full px-4 py-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-xl text-xs font-bold border-none focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white"
                                />
                                <button 
                                  onClick={() => handleRegenerateImage(index)}
                                  disabled={isRegeneratingImage[index]}
                                  className="w-full py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-900 transition-all"
                                >
                                  <RefreshCw className={cn("w-3 h-3", isRegeneratingImage[index] && "animate-spin")} />
                                  {isRegeneratingImage[index] ? 'Regenerating...' : 'Regenerate Image'}
                                </button>
                              </div>
                            </>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Loader2 className="w-10 h-10 text-indigo-200 animate-spin" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Text Outputs */}
                      <div className="space-y-8">
                        <div>
                          <h5 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2">Topic Angle</h5>
                          <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight italic">{post.topic}</p>
                        </div>
                        <div className="space-y-6 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                          {selectedPlatforms.map(platform => {
                            const platformData = PLATFORMS.find(p => p.id === platform);
                            const Icon = platformData?.icon;
                            return (
                              <div key={platform} className="space-y-3 group/platform">
                                <div className="flex items-center gap-2">
                                  <div className={`w-8 h-8 rounded-lg ${platformData?.bg} dark:bg-slate-800 ${platformData?.color} dark:text-white flex items-center justify-center shadow-sm group-hover/platform:scale-110 transition-transform`}>
                                    {Icon && <Icon className="w-4 h-4" />}
                                  </div>
                                  <h4 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{platform}</h4>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl p-5 text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-medium group-hover/platform:border-indigo-200 dark:group-hover/platform:border-indigo-500 transition-all">
                                  {post.outputs[platform] || 'Generating...'}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniCalendar({ 
  selectedDate, 
  onDateSelect, 
  allPosts, 
  selectedTimeSlot 
}: { 
  selectedDate: Date, 
  onDateSelect: (date: Date) => void, 
  allPosts: GeneratedPost[],
  selectedTimeSlot: string
}) {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(selectedDate));
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth)),
    end: addDays(startOfWeek(addDays(endOfMonth(currentMonth), 6)), 0)
  });

  const timeSlot = TIME_SLOTS.find(s => s.id === selectedTimeSlot);
  const publishTime = timeSlot?.time || '09:00';

  const isBusy = (date: Date) => {
    return allPosts.some(post => {
      if (!post.scheduledDate) return false;
      const postDate = post.scheduledDate.toDate();
      return isSameDay(postDate, date) && post.publishTime === publishTime;
    });
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-6 border border-slate-100 dark:border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-tight">
          {format(currentMonth, 'MMMM yyyy')}
        </h4>
        <div className="flex gap-2">
          <button 
            onClick={() => setCurrentMonth(addDays(currentMonth, -30))}
            className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all"
          >
            <ChevronLeft className="w-4 h-4 text-slate-400" />
          </button>
          <button 
            onClick={() => setCurrentMonth(addDays(currentMonth, 30))}
            className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all"
          >
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
          <div key={idx} className="text-[10px] font-black text-slate-400 text-center uppercase tracking-widest mb-2">
            {day}
          </div>
        ))}
        {days.map((day, i) => {
          const busy = isBusy(day);
          const selected = isSameDay(day, selectedDate);
          const past = isPast(day) && !isToday(day);
          
          return (
            <button
              key={i}
              disabled={past}
              onClick={() => onDateSelect(day)}
              className={cn(
                "aspect-square rounded-xl text-xs font-bold flex flex-col items-center justify-center relative transition-all",
                selected 
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none scale-110 z-10" 
                  : "hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400",
                past && "opacity-20 cursor-not-allowed",
                !selected && isSameDay(day, new Date()) && "text-indigo-600 dark:text-indigo-400"
              )}
            >
              {format(day, 'd')}
              {busy && !selected && (
                <div className="absolute bottom-1.5 w-1 h-1 rounded-full bg-amber-500" />
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-6 flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          <span>Slot Filled</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-indigo-600" />
          <span>Selected</span>
        </div>
      </div>
    </div>
  );
}

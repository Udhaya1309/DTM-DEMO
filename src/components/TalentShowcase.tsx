import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Talent, Profile } from '../lib/supabase';
// --- FIX: Removed unused 'Filter' and 'Video' imports ---
import { Plus, Heart, X, Upload, Image as ImageIcon, Search, MessageSquare, Send } from 'lucide-react';

interface TalentComment {
  id: string;
  created_at: string;
  content: string;
  user_id: string;
  talent_id: string;
  profiles: {
    full_name: string;
  } | null;
}

type TalentWithProfile = Omit<Talent, 'profile'> & {
  profile: Profile | null;
};

const CATEGORIES = [
  'All', 'Music', 'Dance', 'Art', 'Sports', 'Photography', 'Writing', 'Acting', 'Coding', 'Other',
];

const CommentsModal = ({ talent, onClose }: { talent: TalentWithProfile; onClose: () => void; }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<TalentComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComments();
  }, [talent.id]);

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('talent_comments')
        .select('*, profiles(full_name)')
        .eq('talent_id', talent.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    try {
      const { error } = await supabase
        .from('talent_comments')
        .insert({
          content: newComment,
          talent_id: talent.id,
          user_id: user.id,
        });

      if (error) throw error;
      setNewComment('');
      fetchComments();
    } catch (error) {
      console.error('Error posting comment:', error);
      alert('Failed to post comment.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[1001]">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Comments on "{talent.title}"</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
        </div>
        
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {loading ? <p>Loading comments...</p> : comments.length === 0 ? <p>No comments yet. Be the first!</p> : (
            comments.map(comment => (
              <div key={comment.id} className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-semibold text-gray-600">
                  {comment.profiles?.full_name?.charAt(0) || 'U'}
                </div>
                <div className="flex-1 bg-gray-100 rounded-lg p-3">
                  <p className="font-semibold text-sm text-gray-900">{comment.profiles?.full_name}</p>
                  <p className="text-gray-700">{comment.content}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {user && (
          <form onSubmit={handlePostComment} className="p-4 border-t border-gray-200 flex gap-2">
            <input
              type="text"
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
              <Send size={16} /> Post
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

const UploadTalentModal = ({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void; }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', category: 'Other', tags: '' });
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        setFileError('File is too large. Please select a file smaller than 10MB.');
        return;
      }
      setFileError('');
      setMediaFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !mediaFile) {
      setFileError('Please select a media file to upload.');
      return;
    }
    setLoading(true);
    setFileError('');

    try {
      const fileExt = mediaFile.name.split('.').pop();
      const filePath = `${user.id}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage.from('talent-media').upload(filePath, mediaFile);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('talent-media').getPublicUrl(filePath);
      if (!publicUrl) throw new Error('Could not get public URL for the media.');

      const mediaType = mediaFile.type.startsWith('video') ? 'video' : 'image';
      
      const { error: insertError } = await supabase.from('talents').insert({
        user_id: user.id,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        media_url: publicUrl,
        media_type: mediaType,
        tags: formData.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      });

      if (insertError) throw insertError;
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error uploading talent:', error);
      alert('Error uploading talent: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[1001]">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Upload Your Talent</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
              {CATEGORIES.filter((c) => c !== 'All').map((category) => (<option key={category} value={category}>{category}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma-separated)</label>
            <input type="text" value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="e.g., guitar, acoustic, performance" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload Media (Image or Video)</label>
            <input type="file" onChange={handleFileChange} accept="image/*,video/*" className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" required />
            {mediaFile && <p className="mt-2 text-sm text-gray-600">Selected: {mediaFile.name}</p>}
            {fileError && <p className="mt-2 text-sm text-red-600">{fileError}</p>}
          </div>
          <div className="flex gap-4">
            <button type="submit" disabled={loading} className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
              <Upload size={20} />
              {loading ? 'Uploading...' : 'Upload Talent'}
            </button>
            <button type="button" onClick={onClose} className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const TalentCard = ({ talent, onLike, onCommentClick }: { talent: TalentWithProfile; onLike: (id: string) => void; onCommentClick: () => void; }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
      <div className="aspect-video bg-gray-200 relative">
        {talent.media_url ? (
          talent.media_type === 'video' ? (
            <video src={talent.media_url} className="w-full h-full object-cover" controls />
          ) : (
            <img src={talent.media_url} alt={talent.title} className="w-full h-full object-cover" />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon size={48} className="text-gray-400" />
          </div>
        )}
        <div className="absolute top-3 right-3">
          <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-sm font-medium text-gray-700">{talent.category}</span>
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-bold text-lg text-gray-900 mb-1">{talent.title}</h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2 flex-1">{talent.description}</p>
        {talent.tags && talent.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {talent.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">#{tag}</span>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-xs font-semibold text-gray-600">{talent.profile?.full_name?.charAt(0) || 'U'}</span>
            </div>
            <span className="text-sm text-gray-700">{talent.profile?.full_name}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onCommentClick} className="flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
              <MessageSquare size={16} />
            </button>
            <button onClick={() => onLike(talent.id)} className={`flex items-center gap-1 px-3 py-1 rounded-full transition-colors ${talent.is_liked ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              <Heart size={16} fill={talent.is_liked ? 'currentColor' : 'none'} />
              <span className="text-sm font-medium">{talent.likes_count}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const TalentShowcase = () => {
  const { user } = useAuth();
  const [talents, setTalents] = useState<TalentWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'created_at' | 'likes_count'>('created_at');
  const [selectedTalentForComments, setSelectedTalentForComments] = useState<TalentWithProfile | null>(null);

  useEffect(() => {
    fetchTalents();
  }, [user, sortBy]);

  const fetchTalents = async () => {
    setLoading(true);
    try {
      const { data: talentsData, error: talentsError } = await supabase
        .from('talents')
        .select('*')
        .order(sortBy, { ascending: false });

      if (talentsError) throw talentsError;
      if (!talentsData) {
        setTalents([]);
        return;
      }
      
      let processedTalents: TalentWithProfile[] = talentsData.map(t => ({...t, profile: null, is_liked: false}));

      const userIds = [...new Set(talentsData.map(t => t.user_id))];
      if (userIds.length > 0) {
        // --- FIX: Change select query to fetch all columns ---
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', userIds);
        if (profilesError) throw profilesError;
        
        const profilesMap = new Map(profilesData.map(p => [p.id, p]));
        processedTalents = processedTalents.map(talent => ({
            ...talent,
            profile: profilesMap.get(talent.user_id) || null
        }));
      }

      if (user) {
        const { data: likesData } = await supabase.from('talent_likes').select('talent_id').eq('user_id', user.id);
        const likedIds = new Set(likesData?.map(like => like.talent_id) || []);
        processedTalents = processedTalents.map(talent => ({
          ...talent,
          is_liked: likedIds.has(talent.id),
        }));
      }
      
      setTalents(processedTalents);

    } catch (error) {
      console.error('Error fetching talents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (talentId: string) => {
    if (!user) {
        alert('You must be logged in to like a post.');
        return;
    };

    const talent = talents.find((t) => t.id === talentId);
    if (!talent) return;

    try {
      if (talent.is_liked) {
        await supabase.from('talent_likes').delete().match({ talent_id: talentId, user_id: user.id });
      } else {
        await supabase.from('talent_likes').insert({ talent_id: talentId, user_id: user.id });
      }
      fetchTalents();
    } catch (error) {
      console.error('Error liking talent:', error);
    }
  };

  const filteredTalents = talents.filter(
    (talent) =>
      talent.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      talent.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      talent.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-8">
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Talent Showcase</h1>
          <p className="text-gray-600 mt-1">Discover and share amazing talents</p>
        </div>
        <button onClick={() => setShowUploadModal(true)} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus size={20} /> Upload Talent
        </button>
      </div>

      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search talents, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600">Sort by:</span>
          <button onClick={() => setSortBy('created_at')} className={`px-3 py-1 rounded-full text-sm font-medium ${sortBy === 'created_at' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>Most Recent</button>
          <button onClick={() => setSortBy('likes_count')} className={`px-3 py-1 rounded-full text-sm font-medium ${sortBy === 'likes_count' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>Most Liked</button>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-12"><div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div><p className="text-gray-600 mt-4">Loading talents...</p></div>
      ) : filteredTalents.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg"><p className="text-gray-600">No talents found matching your search.</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTalents.map((talent) => (
            <TalentCard key={talent.id} talent={talent} onLike={handleLike} onCommentClick={() => setSelectedTalentForComments(talent)} />
          ))}
        </div>
      )}

      {showUploadModal && <UploadTalentModal onClose={() => setShowUploadModal(false)} onSuccess={fetchTalents} />}
      {selectedTalentForComments && <CommentsModal talent={selectedTalentForComments} onClose={() => setSelectedTalentForComments(null)} />}
    </div>
  );
};
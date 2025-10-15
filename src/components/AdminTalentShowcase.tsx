import { useState, useEffect } from 'react';
import { supabase, Talent, Profile } from '../lib/supabase';
import { Trash2 } from 'lucide-react';

// --- THIS IS THE CORRECTED TYPE DEFINITION ---
// We use Omit to create a new type that is the same as Talent,
// but without the original 'profile' property, which we then add back with the correct type.
type TalentWithProfile = Omit<Talent, 'profile'> & {
  profile: Profile | null;
};

export const AdminTalentShowcase = () => {
  const [talents, setTalents] = useState<TalentWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAllTalents();
  }, []);

  const fetchAllTalents = async () => {
    setLoading(true);
    setError('');
    try {
      const { data: talentsData, error: talentsError } = await supabase
        .from('talents')
        .select('*')
        .order('created_at', { ascending: false });

      if (talentsError) throw talentsError;

      if (!talentsData || talentsData.length === 0) {
        setTalents([]);
        return;
      }

      const userIds = [...new Set(talentsData.map(t => t.user_id))];
      if (userIds.length === 0) {
        setTalents(talentsData.map(t => ({...t, profile: null})));
        return;
      }

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      const profilesMap = new Map(profilesData.map(p => [p.id, p]));
      const talentsWithProfiles = talentsData.map(talent => ({
        ...talent,
        profile: profilesMap.get(talent.user_id) || null
      }));

      setTalents(talentsWithProfiles);

    } catch (err: any) {
      console.error('Error fetching talents:', err);
      setError('Failed to fetch talents. Please check the console.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (talentId: string) => {
    if (window.confirm('Are you sure you want to delete this talent submission?')) {
      try {
        const { error } = await supabase
          .from('talents')
          .delete()
          .eq('id', talentId);
        
        if (error) throw error;
        fetchAllTalents();
      } catch (err: any) {
        console.error('Error deleting talent:', err);
        alert('Failed to delete talent: ' + err.message);
      }
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading talents...</div>;
  }

  if (error) {
    return <div className="p-8 bg-red-50 text-red-700 rounded-lg">{error}</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Moderate Talent Showcase</h1>
        <p className="text-gray-600 mt-1">View and delete all student talent submissions.</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {talents.map((talent) => (
              <tr key={talent.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{talent.profile?.full_name || 'N/A'}</div>
                  <div className="text-sm text-gray-500">{talent.profile?.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{talent.title}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{talent.category}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(talent.created_at).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleDelete(talent.id)}
                    className="text-red-600 hover:text-red-900 flex items-center gap-1"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
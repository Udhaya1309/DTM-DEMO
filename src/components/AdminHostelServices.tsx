import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Clock, AlertCircle, CheckCircle, LucideProps, ChevronDown, ChevronRight } from 'lucide-react';
import { FC } from 'react';

// Reverted to the full interface to include the profile object and description
interface HostelServiceWithProfile {
  id: string;
  created_at: string;
  service_type: string;
  room_number: string;
  hostel_block: string;
  status: string;
  priority: string;
  description: string;
  user_id: string; // Keep user_id for merging
  profiles: {
    full_name: string;
    email: string;
  } | null;
}

const STATUS_ICONS: { [key: string]: FC<LucideProps> } = {
  Pending: Clock, 'In Progress': AlertCircle, Completed: CheckCircle,
};

const STATUS_COLORS = {
  Pending: 'bg-yellow-100 text-yellow-700',
  'In Progress': 'bg-blue-100 text-blue-700',
  Completed: 'bg-green-100 text-green-700',
};

export const AdminHostelServices = () => {
  const [services, setServices] = useState<HostelServiceWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  useEffect(() => {
    fetchAllServices();
  }, []);

  const fetchAllServices = async () => {
    setLoading(true);
    setError('');
    try {
      const { data: servicesData, error: servicesError } = await supabase
        .from('hostel_services')
        .select('*')
        .order('created_at', { ascending: false });

      if (servicesError) throw servicesError;

      if (!servicesData || servicesData.length === 0) {
        setServices([]);
        setLoading(false); // Make sure to stop loading
        return;
      }

      const userIds = [...new Set(servicesData.map(s => s.user_id))];

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      const profilesMap = new Map(profilesData.map(p => [p.id, p]));

      const servicesWithProfiles = servicesData.map(service => ({
        ...service,
        profiles: profilesMap.get(service.user_id) || null
      }));

      setServices(servicesWithProfiles as HostelServiceWithProfile[]);

    } catch (err: any) {
      console.error('Error fetching services:', err);
      setError('Failed to fetch service requests. Please check the console.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (serviceId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('hostel_services')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', serviceId);
      if (error) throw error;
      fetchAllServices();
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status.');
    }
  };

  const toggleRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  if (loading) { return <div className="p-8 text-center">Loading...</div>; }
  if (error) { return <div className="p-8 bg-red-50 text-red-700 rounded-lg">{error}</div>; }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Manage Hostel Services</h1>
        <p className="text-gray-600 mt-1">View and update all student service requests.</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-12"></th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {services.map((service) => {
              const StatusIcon = STATUS_ICONS[service.status as keyof typeof STATUS_ICONS] || Clock;
              const isExpanded = expandedRow === service.id;
              return (
                <>
                  <tr key={service.id} className="hover:bg-gray-50">
                    <td className="px-4">
                      <button onClick={() => toggleRow(service.id)} className="text-gray-500 hover:text-gray-800">
                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{service.profiles?.full_name || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{service.profiles?.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{service.service_type}</div>
                      <div className="text-sm text-gray-500">{new Date(service.created_at).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      Room {service.room_number}, Block {service.hostel_block}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex items-center gap-1 text-xs leading-5 font-semibold rounded-full ${STATUS_COLORS[service.status as keyof typeof STATUS_COLORS]}`}>
                        <StatusIcon size={14} />
                        {service.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <select
                        value={service.status}
                        // --- THIS IS THE CORRECTED LINE ---
                        onChange={(e) => handleStatusChange(service.id, e.target.value)}
                        className="p-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-gray-50">
                      <td colSpan={6} className="px-12 py-3 text-sm text-gray-700">
                        <strong>Description:</strong> {service.description || 'No description provided.'}
                      </td>
                    </tr>
                  )}
                </>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
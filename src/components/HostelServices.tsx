import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, HostelService, MessMenu } from '../lib/supabase';
import {
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  X,
  Utensils,
  Calendar,
  Wrench,
} from 'lucide-react';

const SERVICE_TYPES = [
  'Maintenance',
  'Cleaning',
  'Laundry',
  'Electrical',
  'Plumbing',
  'Furniture',
  'Internet',
  'Other',
];

const PRIORITY_LEVELS = ['Low', 'Medium', 'High'];

const STATUS_ICONS = {
  Pending: Clock,
  'In Progress': AlertCircle,
  Completed: CheckCircle,
};

const STATUS_COLORS = {
  Pending: 'bg-yellow-100 text-yellow-700',
  'In Progress': 'bg-blue-100 text-blue-700',
  Completed: 'bg-green-100 text-green-700',
};

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export const HostelServices = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'services' | 'mess'>('services');
  const [services, setServices] = useState<HostelService[]>([]);
  const [messMenu, setMessMenu] = useState<MessMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);

  useEffect(() => {
    fetchServices();
    fetchMessMenu();
  }, [user]);

  const fetchServices = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('hostel_services')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessMenu = async () => {
    try {
      const { data, error } = await supabase
        .from('mess_menu')
        .select('*')
        .order('day_of_week');

      if (error) throw error;
      setMessMenu(data || []);
    } catch (error) {
      console.error('Error fetching mess menu:', error);
    }
  };

  const handleCancelService = async (serviceId: string) => {
    try {
      const { error } = await supabase.from('hostel_services').delete().eq('id', serviceId);

      if (error) throw error;
      fetchServices();
    } catch (error) {
      console.error('Error canceling service:', error);
      alert('Error canceling service. Please try again.');
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Hostel Services</h1>
        <p className="text-gray-600 mt-1">Manage service requests and view mess menu</p>
      </div>

      <div className="mb-6 flex gap-4">
        <button
          onClick={() => setActiveTab('services')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
            activeTab === 'services'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Wrench size={20} />
          Service Requests
        </button>
        <button
          onClick={() => setActiveTab('mess')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
            activeTab === 'mess'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Utensils size={20} />
          Mess Menu
        </button>
      </div>

      {activeTab === 'services' ? (
        <ServicesTab
          services={services}
          loading={loading}
          onRequestService={() => setShowRequestModal(true)}
          onCancelService={handleCancelService}
        />
      ) : (
        <MessMenuTab messMenu={messMenu} />
      )}

      {showRequestModal && (
        <RequestServiceModal
          onClose={() => setShowRequestModal(false)}
          onSuccess={() => {
            fetchServices();
            setShowRequestModal(false);
          }}
        />
      )}
    </div>
  );
};

const ServicesTab = ({
  services,
  loading,
  onRequestService,
  onCancelService,
}: {
  services: HostelService[];
  loading: boolean;
  onRequestService: () => void;
  onCancelService: (id: string) => void;
}) => {
  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Your Service Requests</h2>
          <p className="text-gray-600 text-sm">Track and manage your hostel service requests</p>
        </div>
        <button
          onClick={onRequestService}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          New Request
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 bg-white rounded-lg">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 mt-4">Loading services...</p>
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg">
          <Wrench size={48} className="text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">No service requests yet</p>
          <button
            onClick={onRequestService}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Request Your First Service
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onCancel={onCancelService}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const ServiceCard = ({
  service,
  onCancel,
}: {
  service: HostelService;
  onCancel: (id: string) => void;
}) => {
  const StatusIcon = STATUS_ICONS[service.status as keyof typeof STATUS_ICONS] || Clock;
  const statusColor = STATUS_COLORS[service.status as keyof typeof STATUS_COLORS];

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-bold text-lg text-gray-900 mb-1">{service.service_type}</h3>
          <p className="text-sm text-gray-600">
            Room {service.room_number}, Block {service.hostel_block}
          </p>
        </div>
        <div className={`p-2 rounded-lg ${statusColor}`}>
          <StatusIcon size={20} />
        </div>
      </div>

      <p className="text-gray-700 mb-4 line-clamp-2">{service.description}</p>

      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Status:</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
            {service.status}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Priority:</span>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              service.priority === 'High'
                ? 'bg-red-100 text-red-700'
                : service.priority === 'Medium'
                ? 'bg-orange-100 text-orange-700'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {service.priority}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Requested:</span>
          <span className="text-gray-900">
            {new Date(service.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>

      {service.status !== 'Completed' && (
        <button
          onClick={() => onCancel(service.id)}
          className="w-full px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
        >
          Cancel Request
        </button>
      )}
    </div>
  );
};

const MessMenuTab = ({ messMenu }: { messMenu: MessMenu[] }) => {
  const [selectedDay, setSelectedDay] = useState(
    DAYS_OF_WEEK[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]
  );

  const todayMenu = messMenu.filter((item) => item.day_of_week === selectedDay);
  const mealsByType = {
    Breakfast: todayMenu.filter((item) => item.meal_type === 'Breakfast'),
    Lunch: todayMenu.filter((item) => item.meal_type === 'Lunch'),
    Snacks: todayMenu.filter((item) => item.meal_type === 'Snacks'),
    Dinner: todayMenu.filter((item) => item.meal_type === 'Dinner'),
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Weekly Mess Menu</h2>
        <div className="flex flex-wrap gap-2">
          {DAYS_OF_WEEK.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedDay === day
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(mealsByType).map(([mealType, meals]) => (
          <div key={mealType} className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Utensils size={24} className="text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900">{mealType}</h3>
                {meals[0]?.is_special && (
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                    Special
                  </span>
                )}
              </div>
            </div>

            {meals.length > 0 ? (
              <ul className="space-y-2">
                {meals[0].items.map((item, index) => (
                  <li key={index} className="flex items-center gap-2 text-gray-700">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">No menu available</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const RequestServiceModal = ({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    service_type: 'Maintenance',
    description: '',
    room_number: '',
    hostel_block: '',
    priority: 'Medium',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('hostel_services').insert({
        user_id: user.id,
        service_type: formData.service_type,
        description: formData.description,
        room_number: formData.room_number,
        hostel_block: formData.hostel_block,
        priority: formData.priority,
        status: 'Pending',
      });

      if (error) throw error;
      onSuccess();
    } catch (error) {
      console.error('Error requesting service:', error);
      alert('Error requesting service. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-lg w-full">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Request Service</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service Type
            </label>
            <select
              value={formData.service_type}
              onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {SERVICE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Room Number
              </label>
              <input
                type="text"
                value={formData.room_number}
                onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                placeholder="101"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hostel Block
              </label>
              <input
                type="text"
                value={formData.hostel_block}
                onChange={(e) => setFormData({ ...formData, hostel_block: e.target.value })}
                placeholder="A"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {PRIORITY_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              placeholder="Describe the issue or service needed..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              required
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Requesting...' : 'Submit Request'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

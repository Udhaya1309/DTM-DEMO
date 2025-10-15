import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, CampusLocation, CustomMarker } from '../lib/supabase';
import {
  MapPin,
  Navigation,
  Plus,
  Filter,
  X,
  Locate,
  TrendingUp,
  Search,
} from 'lucide-react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from 'react-leaflet';
import { LatLngExpression, divIcon } from 'leaflet';

const LOCATION_CATEGORIES = [
  'All',
  'Academic',
  'Administrative',
  'Hostel',
  'Food & Dining',
  'Sports',
  'Healthcare',
  'Transportation',
  'Banking',
  'Shopping',
  'Events',
  'Fitness',
];

const SRM_CENTER = { lat: 12.8230, lng: 80.0408 };

const categoryColorMap: { [key: string]: string } = {
  Academic: '#f56565', // red
  Administrative: '#ed8936', // orange
  Hostel: '#4299e1', // blue
  'Food & Dining': '#48bb78', // green
  Sports: '#9f7aea', // purple
  Healthcare: '#38b2ac', // teal
  Default: '#718096', // gray
};

const createCustomIcon = (color: string) => {
  return divIcon({
    html: `<div style="background-color: ${color}; width: 20px; height: 20px;"></div>`,
    className: 'custom-div-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};


export const CampusMap = () => {
  const { user } = useAuth();
  const [locations, setLocations] = useState<CampusLocation[]>([]);
  const [customMarkers, setCustomMarkers] = useState<CustomMarker[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<CampusLocation[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showAddMarker, setShowAddMarker] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<CampusLocation | null>(null);
  const [showFrequentOnly, setShowFrequentOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLocations();
    if (user) {
      fetchCustomMarkers();
    }
  }, [user]);

  useEffect(() => {
    filterLocations();
  }, [locations, selectedCategory, searchQuery, showFrequentOnly]);

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('campus_locations')
        .select('*')
        .order('name');

      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomMarkers = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('custom_markers')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setCustomMarkers(data || []);
    } catch (error) {
      console.error('Error fetching custom markers:', error);
    }
  };

  const filterLocations = () => {
    let filtered = locations;

    if (selectedCategory !== 'All') {
      filtered = filtered.filter((loc) => loc.category === selectedCategory);
    }

    if (showFrequentOnly) {
      filtered = filtered.filter((loc) => loc.is_frequently_used);
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (loc) =>
          loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          loc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          loc.building_code?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredLocations(filtered);
  };

  const getUserLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get your location. Please enable location services.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Campus Navigation</h1>
        <p className="text-gray-600 mt-1">
          Navigate SRM University Kattankulathur with ease
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={getUserLocation}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Locate size={18} />
                My Location
              </button>
              <button
                onClick={() => setShowAddMarker(true)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Plus size={18} />
                Add Marker
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Filter size={18} />
                Filters
              </button>
            </div>

            {showFilters && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Category</h3>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {LOCATION_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="frequent"
                    checked={showFrequentOnly}
                    onChange={(e) => setShowFrequentOnly(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="frequent" className="text-sm text-gray-700">
                    Show frequently used only
                  </label>
                </div>
              </div>
            )}

            <div className="relative mb-4">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {userLocation && (
              <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg flex items-center gap-2">
                <Navigation size={18} />
                <span className="text-sm">
                  Your location: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                </span>
              </div>
            )}

            <div className="space-y-2 max-h-[calc(100vh-450px)] overflow-y-auto">
              {loading ? (
                <p className="text-gray-600 text-center py-4">Loading locations...</p>
              ) : filteredLocations.length === 0 ? (
                <p className="text-gray-600 text-center py-4">No locations found</p>
              ) : (
                filteredLocations.map((location) => (
                  <LocationCard
                    key={location.id}
                    location={location}
                    userLocation={userLocation}
                    isSelected={selectedLocation?.id === location.id}
                    onClick={() => setSelectedLocation(location)}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden h-[calc(100vh-200px)]">
            <MapView
              locations={filteredLocations}
              customMarkers={customMarkers}
              selectedLocation={selectedLocation}
              userLocation={userLocation}
              center={SRM_CENTER}
            />
          </div>
        </div>
      </div>

      {showAddMarker && (
        <AddMarkerModal
          onClose={() => setShowAddMarker(false)}
          onSuccess={() => {
            fetchCustomMarkers();
            setShowAddMarker(false);
          }}
        />
      )}
    </div>
  );
};

const LocationCard = ({
  location,
  userLocation,
  isSelected,
  onClick,
}: {
  location: CampusLocation;
  userLocation: { lat: number; lng: number } | null;
  isSelected: boolean;
  onClick: () => void;
}) => {
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c * 1000; // Distance in meters
  };

  const distance = userLocation
    ? calculateDistance(
        userLocation.lat,
        userLocation.lng,
        Number(location.latitude),
        Number(location.longitude)
      )
    : null;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
        isSelected
          ? 'border-blue-600 bg-blue-50'
          : 'border-gray-200 hover:border-gray-300 bg-white'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900">{location.name}</h3>
            {location.is_frequently_used && (
              <TrendingUp size={14} className="text-orange-500" />
            )}
          </div>
          <p className="text-sm text-gray-600 mb-2">{location.description}</p>
          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
              {location.category}
            </span>
            {location.building_code && (
              <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded">
                {location.building_code}
              </span>
            )}
            {distance && (
              <span className="px-2 py-1 bg-green-100 text-green-600 text-xs rounded">
                {distance < 1000 ? `${Math.round(distance)}m` : `${(distance / 1000).toFixed(1)}km`}
              </span>
            )}
          </div>
        </div>
        <MapPin size={20} className={isSelected ? 'text-blue-600' : 'text-gray-400'} />
      </div>
    </button>
  );
};

const MapView = ({
  locations,
  customMarkers,
  selectedLocation,
  userLocation,
  center,
}: {
  locations: CampusLocation[];
  customMarkers: CustomMarker[];
  selectedLocation: CampusLocation | null;
  userLocation: { lat: number; lng: number } | null;
  center: { lat: number; lng: number };
}) => {
  const ChangeView = ({ center, zoom }: { center: LatLngExpression; zoom: number }) => {
    const map = useMap();
    useEffect(() => {
      map.flyTo(center, zoom);
    }, [center, zoom, map]);
    return null;
  };

  const selectedPosition: LatLngExpression | null = selectedLocation
    ? [selectedLocation.latitude, selectedLocation.longitude]
    : null;

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={16}
      scrollWheelZoom={true}
      style={{ height: '100%', width: '100%' }}
    >
      {selectedPosition && <ChangeView center={selectedPosition} zoom={18} />}

      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {userLocation && (
        <Marker 
          position={[userLocation.lat, userLocation.lng]}
          icon={createCustomIcon('#e53e3e')}
        >
          <Popup>Your Location</Popup>
        </Marker>
      )}

      {locations.map((location) => (
        <Marker
          key={location.id}
          position={[location.latitude, location.longitude]}
          icon={createCustomIcon(categoryColorMap[location.category] || categoryColorMap.Default)}
        >
          <Popup>
            <b>{location.name}</b>
            <br />
            {location.description}
          </Popup>
        </Marker>
      ))}

      {customMarkers.map((marker) => (
        <Marker
          key={marker.id}
          position={[marker.latitude, marker.longitude]}
          icon={createCustomIcon(marker.color)}
        >
          <Popup>
            <b>{marker.name}</b> (Custom)
            <br />
            {marker.description}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

const AddMarkerModal = ({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    latitude: '',
    longitude: '',
    color: '#3b82f6',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('custom_markers').insert({
        user_id: user.id,
        name: formData.name,
        description: formData.description,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        color: formData.color,
        icon: 'map-pin',
      });

      if (error) throw error;
      onSuccess();
    } catch (error) {
      console.error('Error adding marker:', error);
      alert('Error adding marker. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-lg w-full">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Add Custom Marker</h2>
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
              Marker Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Latitude
              </label>
              <input
                type="number"
                step="0.000001"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                placeholder="12.8230"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Longitude
              </label>
              <input
                type="number"
                step="0.000001"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                placeholder="80.0408"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Marker Color
            </label>
            <input
              type="color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="w-full h-12 border border-gray-300 rounded-lg cursor-pointer"
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Marker'}
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
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Home, User, Award, Map, Hotel, LogOut, Shield, Wrench, Star, Users } from 'lucide-react';
import { ProfilePage } from './ProfilePage';
import { TalentShowcase } from './TalentShowcase';
import { CampusMap } from './CampusMap';
import { HostelServices } from './HostelServices';
import { AdminHostelServices } from './AdminHostelServices';
import { AdminTalentShowcase } from './AdminTalentShowcase';
import { AdminUserManagement } from './AdminUserManagement';

type PageType = 'home' | 'profile' | 'talents' | 'map' | 'hostel' | 'admin';
type AdminPageType = 'hostel' | 'talents' | 'users';

const AdminDashboard = () => {
  const [adminPage, setAdminPage] = useState<AdminPageType>('hostel');

  const adminTabs = [
    { id: 'hostel' as AdminPageType, label: 'Hostel Services', icon: Wrench },
    { id: 'talents' as AdminPageType, label: 'Moderate Talents', icon: Star },
    { id: 'users' as AdminPageType, label: 'User Management', icon: Users },
  ];

  return (
    <div>
      <div className="p-8 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-4">
          {adminTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setAdminPage(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                adminPage === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      
      {adminPage === 'hostel' && <AdminHostelServices />}
      {adminPage === 'talents' && <AdminTalentShowcase />}
      {adminPage === 'users' && <AdminUserManagement />}
    </div>
  );
};

export const Dashboard = () => {
  const { user, profile, signOut } = useAuth();
  const [currentPage, setCurrentPage] = useState<PageType>('home');
  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      setCurrentPage('admin');
    } else {
      setCurrentPage('home');
    }
  }, [isAdmin]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const userNavItems = [
    { id: 'home' as PageType, icon: Home, label: 'Dashboard' },
    { id: 'profile' as PageType, icon: User, label: 'Profile' },
    { id: 'talents' as PageType, icon: Award, label: 'Talent Showcase' },
    { id: 'map' as PageType, icon: Map, label: 'Campus Map' },
    { id: 'hostel' as PageType, icon: Hotel, label: 'Hostel Services' },
  ];

  const adminNavItems = [
    { id: 'admin' as PageType, icon: Shield, label: 'Admin Panel' },
    ...userNavItems,
  ];

  const navItems = isAdmin ? adminNavItems : userNavItems;

  const renderPage = () => {
    if (isAdmin && currentPage === 'admin') {
      return <AdminDashboard />;
    }

    switch (currentPage) {
      case 'home':
        return <HomePage setCurrentPage={setCurrentPage} />;
      case 'profile':
        return <ProfilePage />;
      case 'talents':
        return <TalentShowcase />;
      case 'map':
        return <CampusMap />;
      case 'hostel':
        return <HostelServices />;
      default:
        return <HomePage setCurrentPage={setCurrentPage} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">SRM</span>
            </div>
            <div>
              <h1 className="font-bold text-lg text-gray-900">Campus Hub</h1>
              <p className="text-xs text-gray-500">SRM University</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                currentPage === item.id
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-gray-600 font-semibold">
                {profile?.full_name?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {profile?.full_name || 'User'}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">{renderPage()}</main>
    </div>
  );
};

const HomePage = ({ setCurrentPage }: { setCurrentPage: (page: PageType) => void }) => {
  const { profile } = useAuth();

  const quickActions = [
    { id: 'talents' as PageType, icon: Award, title: 'Talent Showcase', description: 'Share your talents with the community', color: 'bg-purple-500' },
    { id: 'map' as PageType, icon: Map, title: 'Campus Map', description: 'Navigate around SRM campus', color: 'bg-green-500' },
    { id: 'hostel' as PageType, icon: Hotel, title: 'Hostel Services', description: 'Request services and view mess menu', color: 'bg-orange-500' },
    { id: 'profile' as PageType, icon: User, title: 'My Profile', description: 'Update your profile information', color: 'bg-blue-500' },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {profile?.full_name || 'Student'}!
        </h1>
        <p className="text-gray-600">Here's what's happening on campus today</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {quickActions.map((action) => (
          <button
            key={action.id}
            onClick={() => setCurrentPage(action.id)}
            className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 text-left group"
          >
            <div className="flex items-start gap-4">
              <div className={`${action.color} w-12 h-12 rounded-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform`}>
                <action.icon size={24} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-900 mb-1">{action.title}</h3>
                <p className="text-gray-600 text-sm">{action.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {profile && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Your Profile</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><p className="text-sm text-gray-500">Department</p><p className="font-medium text-gray-900">{profile.department || 'Not specified'}</p></div>
            <div><p className="text-sm text-gray-500">Year</p><p className="font-medium text-gray-900">{profile.year || 'Not specified'}</p></div>
            <div><p className="text-sm text-gray-500">Phone</p><p className="font-medium text-gray-900">{profile.phone || 'Not specified'}</p></div>
            <div><p className="text-sm text-gray-500">Bio</p><p className="font-medium text-gray-900">{profile.bio || 'Not specified'}</p></div>
          </div>
        </div>
      )}
    </div>
  );
};
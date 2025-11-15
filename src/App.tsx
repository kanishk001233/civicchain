import { useState, useEffect } from 'react';
import { LoginPage } from './components/LoginPage';
import { DashboardLayout } from './components/DashboardLayout';
import { OverviewPage } from './components/OverviewPage';
import { DepartmentsPage } from './components/DepartmentsPage';
import { StatsPage } from './components/StatsPage';
import { PerformancePage } from './components/PerformancePage';
import { ReportsPage } from './components/ReportsPage';
import { HelpPage } from './components/HelpPage';
import { StateOverviewPage } from './components/StateOverviewPage';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner@2.0.3';
import * as api from './utils/api';

interface Complaint {
  id: number;
  category: string;
  title: string;
  description: string;
  location: string;
  latitude?: number;
  longitude?: number;
  votes: number;
  submittedDate: string;
  status: 'pending' | 'resolved' | 'verified';
  photo: string;
  resolutionImage?: string;
  resolutionImages?: string[];
  resolvedDate?: string;
  verificationCount?: number;
  daysPending?: number;
  resolvedByOfficer?: string;
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginType, setLoginType] = useState<'municipal' | 'state'>('municipal');
  const [currentPage, setCurrentPage] = useState('overview');
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(false);
  const [municipalId, setMunicipalId] = useState<string>('');
  const [municipalName, setMunicipalName] = useState<string>('');
  const [stateId, setStateId] = useState<string>('');
  const [stateName, setStateName] = useState<string>('');

  // Load complaints when logged in
  useEffect(() => {
    if (isLoggedIn && municipalId) {
      loadComplaints();
    }
  }, [isLoggedIn, municipalId]);

  const loadComplaints = async () => {
    try {
      setLoading(true);
      const data = await api.getComplaintsByMunicipal(municipalId);
      console.log('Loaded complaints:', data);
      if (data && data.length > 0) {
        console.log('First complaint GPS data:', {
          latitude: data[0]?.latitude,
          longitude: data[0]?.longitude,
          latType: typeof data[0]?.latitude,
          lngType: typeof data[0]?.longitude,
        });
        
        // Log resolution images for resolved/verified complaints
        const resolvedComplaints = data.filter((c: any) => c.status === 'resolved' || c.status === 'verified');
        if (resolvedComplaints.length > 0) {
          console.log('Resolved/Verified complaints with images:', resolvedComplaints.map((c: any) => ({
            id: c.id,
            status: c.status,
            resolutionImages: c.resolutionImages,
            resolutionImagesCount: c.resolutionImages?.length || 0,
          })));
        }
      }
      setComplaints(data as any);
    } catch (error) {
      console.error('Error loading complaints:', error);
      toast.error('Failed to load complaints', {
        description: 'Please try refreshing the page',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (municipalId: string, municipalName: string) => {
    setIsLoggedIn(true);
    setLoginType('municipal');
    setMunicipalId(municipalId);
    setMunicipalName(municipalName);
    toast.success(`Successfully logged in to ${municipalName}`);
  };

  const handleStateLogin = (stateId: string, stateName: string) => {
    setIsLoggedIn(true);
    setLoginType('state');
    setStateId(stateId);
    setStateName(stateName);
    setCurrentPage('overview');
    toast.success(`Successfully logged in to ${stateName} State Dashboard`);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentPage('overview');
    setMunicipalId('');
    setMunicipalName('');
    setStateId('');
    setStateName('');
    setComplaints([]);
    toast.info('Logged out successfully');
  };

  const handleResolve = async (id: number, imageUrl: string) => {
    try {
      await api.resolveComplaint(id, imageUrl);
      const now = new Date().toISOString();
      setComplaints(prev => 
        prev.map(complaint => 
          complaint.id === id 
            ? { 
                ...complaint, 
                status: 'resolved' as const,
                resolutionImage: imageUrl,
                resolutionImages: [imageUrl],
                resolvedDate: now,
              }
            : complaint
        )
      );
      toast.success('Complaint resolved successfully', {
        description: 'The complaint has been marked as resolved with verification photo.',
      });
    } catch (error) {
      console.error('Error resolving complaint:', error);
      toast.error('Failed to resolve complaint', {
        description: 'Please try again',
      });
    }
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} onStateLogin={handleStateLogin} />;
  }

  const renderPage = () => {
    // State login - only show overview page
    if (loginType === 'state') {
      return <StateOverviewPage stateId={stateId} stateName={stateName} />;
    }

    // Municipal login - show all pages
    switch (currentPage) {
      case 'overview':
        return <OverviewPage complaints={complaints} loading={loading} />;
      case 'departments':
        return (
          <DepartmentsPage
            complaints={complaints}
            onResolve={handleResolve}
            loading={loading}
          />
        );
      case 'stats':
        return <StatsPage municipalId={municipalId} />;
      case 'performance':
        return <PerformancePage municipalId={municipalId} />;
      case 'reports':
        return <ReportsPage complaints={complaints} loading={loading} municipalName={municipalName} />;
      case 'help':
        return <HelpPage />;
      default:
        return <OverviewPage complaints={complaints} loading={loading} />;
    }
  };

  return (
    <>
      <DashboardLayout
        currentPage={currentPage}
        onNavigate={loginType === 'state' ? () => {} : setCurrentPage}
        onLogout={handleLogout}
        municipalName={loginType === 'state' ? stateName : municipalName}
        isStateLogin={loginType === 'state'}
      >
        {renderPage()}
      </DashboardLayout>
      <Toaster position="top-right" />
    </>
  );
}

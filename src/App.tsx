import { useState, useEffect } from 'react';
import { LoginPage } from './components/LoginPage';
import { DashboardLayout } from './components/DashboardLayout';
import { OverviewPageEnhanced } from './components/OverviewPageEnhanced';
import { DepartmentsPage } from './components/DepartmentsPage';
import { StatsPageEnhanced } from './components/StatsPageEnhanced';
import { PerformancePage } from './components/PerformancePage';
import { ReportsPage } from './components/ReportsPage';
import { HelpPage } from './components/HelpPage';
import { StateOverviewPageEnhanced } from './components/StateOverviewPageEnhanced';
import { AIInsightsPage } from './components/AIInsightsPage';
import { MunicipalCommunicationChat } from './components/MunicipalCommunicationChat';
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

  // Initialize from localStorage on mount
  useEffect(() => {
    const savedLoginType = localStorage.getItem('loginType');
    const savedMunicipalId = localStorage.getItem('municipalId');
    const savedMunicipalName = localStorage.getItem('municipalName');
    const savedStateId = localStorage.getItem('stateId');
    const savedStateName = localStorage.getItem('stateName');
    const savedCurrentPage = localStorage.getItem('currentPage');

    if (savedLoginType === 'municipal' && savedMunicipalId && savedMunicipalName) {
      setIsLoggedIn(true);
      setLoginType('municipal');
      setMunicipalId(savedMunicipalId);
      setMunicipalName(savedMunicipalName);
      // Load state info for municipal login
      if (savedStateId && savedStateName) {
        setStateId(savedStateId);
        setStateName(savedStateName);
      }
      if (savedCurrentPage) {
        setCurrentPage(savedCurrentPage);
      }
    } else if (savedLoginType === 'state' && savedStateId && savedStateName) {
      setIsLoggedIn(true);
      setLoginType('state');
      setStateId(savedStateId);
      setStateName(savedStateName);
      setCurrentPage('overview');
    }
  }, []);

  // Load complaints when logged in as municipal
  useEffect(() => {
    if (isLoggedIn && loginType === 'municipal' && municipalId) {
      loadComplaints();
    }
  }, [isLoggedIn, loginType, municipalId]);

  // Save current page to localStorage whenever it changes
  useEffect(() => {
    if (isLoggedIn && loginType === 'municipal') {
      localStorage.setItem('currentPage', currentPage);
    }
  }, [currentPage, isLoggedIn, loginType]);

  const loadComplaints = async () => {
    try {
      setLoading(true);
      const data = await api.getComplaintsByMunicipal(municipalId);
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
    setCurrentPage('overview');
    
    // Get state ID from localStorage (set during municipal selection in LoginPage)
    const savedStateId = localStorage.getItem('selectedStateId');
    const savedStateName = localStorage.getItem('selectedStateName');
    
    if (savedStateId && savedStateName) {
      setStateId(savedStateId);
      setStateName(savedStateName);
      localStorage.setItem('stateId', savedStateId);
      localStorage.setItem('stateName', savedStateName);
    }
    
    // Save to localStorage
    localStorage.setItem('loginType', 'municipal');
    localStorage.setItem('municipalId', municipalId);
    localStorage.setItem('municipalName', municipalName);
    localStorage.setItem('currentPage', 'overview');
    
    toast.success(`Successfully logged in to ${municipalName}`);
  };

  const handleStateLogin = (stateId: string, stateName: string) => {
    setIsLoggedIn(true);
    setLoginType('state');
    setStateId(stateId);
    setStateName(stateName);
    setCurrentPage('overview');
    
    // Save to localStorage
    localStorage.setItem('loginType', 'state');
    localStorage.setItem('stateId', stateId);
    localStorage.setItem('stateName', stateName);
    
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
    
    // Clear localStorage
    localStorage.removeItem('loginType');
    localStorage.removeItem('municipalId');
    localStorage.removeItem('municipalName');
    localStorage.removeItem('stateId');
    localStorage.removeItem('stateName');
    localStorage.removeItem('currentPage');
    
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
      
      // Reload complaints to get fresh data from database
      setTimeout(() => {
        loadComplaints();
      }, 1000);
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
      return <StateOverviewPageEnhanced stateId={stateId} stateName={stateName} />;
    }

    // Municipal login - show all pages
    switch (currentPage) {
      case 'overview':
        return <OverviewPageEnhanced complaints={complaints} loading={loading} />;
      case 'departments':
        return (
          <DepartmentsPage
            complaints={complaints}
            onResolve={handleResolve}
            loading={loading}
          />
        );
      case 'stats':
        return <StatsPageEnhanced municipalId={municipalId} />;
      case 'ai-insights':
        return <AIInsightsPage municipalId={municipalId} />;
      case 'performance':
        return <PerformancePage municipalId={municipalId} />;
      case 'reports':
        return <ReportsPage complaints={complaints} loading={loading} municipalName={municipalName} />;
      case 'help':
        return <HelpPage />;
      default:
        return <OverviewPageEnhanced complaints={complaints} loading={loading} />;
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
      
      {/* Municipal Communication Chat - Only for municipal login */}
      {loginType === 'municipal' && municipalId && stateId && (
        <MunicipalCommunicationChat
          stateId={stateId}
          stateName={stateName}
          municipalId={municipalId}
          municipalName={municipalName}
        />
      )}
      
      <Toaster position="top-right" />
    </>
  );
}
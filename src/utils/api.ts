import { projectId, publicAnonKey } from './supabase/info';

const SERVER_URL = `https://${projectId}.supabase.co/functions/v1/make-server-60aaff80`;

export interface Complaint {
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
  resolvedDate?: string;
  resolutionImage?: string; // First image for backwards compatibility
  resolutionImages?: string[]; // All resolution images
  verificationCount?: number;
  daysPending?: number;
  resolvedBy?: string;
  resolvedByOfficer?: string;
}

export interface Category {
  id: string;
  name: string;
  department_id: string;
  icon?: string;
}

export interface State {
  id: string;
  name: string;
}

export interface Municipal {
  id: string;
  state_id: string;
  name: string;
}

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${SERVER_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${publicAnonKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`API Error: ${endpoint}`, errorText);
    throw new Error(`API Error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

// Auth API
export async function loginMunicipal(municipalId: string, password: string) {
  return fetchAPI('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ municipalId, password }),
  });
}

// States API
export async function getStates(): Promise<State[]> {
  return fetchAPI('/states');
}

// Municipals API
export async function getMunicipalsByState(stateId: string): Promise<Municipal[]> {
  return fetchAPI(`/municipals/${stateId}`);
}

// Categories API
export async function getCategories(): Promise<Category[]> {
  return fetchAPI('/categories');
}

// Complaints API
export async function getComplaintsByMunicipal(municipalId: string): Promise<Complaint[]> {
  return fetchAPI(`/complaints/${municipalId}`);
}

export async function resolveComplaint(complaintId: number, imageUrl: string, officerName?: string) {
  return fetchAPI(`/complaints/${complaintId}/resolve`, {
    method: 'PUT',
    body: JSON.stringify({ imageUrl, officerName }),
  });
}

export async function addCitizenVerification(
  complaintId: number, 
  citizenName: string, 
  citizenEmail: string,
  citizenPhone?: string
) {
  return fetchAPI(`/complaints/${complaintId}/citizen-verify`, {
    method: 'POST',
    body: JSON.stringify({ citizenName, citizenEmail, citizenPhone }),
  });
}

export async function getCitizenVerifications(complaintId: number) {
  return fetchAPI(`/complaints/${complaintId}/verifications`);
}

export interface ComplaintStats {
  total: number;
  pending: number;
  verified: number;
  resolved: number;
}

export interface MonthlyTrend {
  month: string;
  roads: number;
  waste: number;
  streetlights: number;
  water: number;
  sewage: number;
  others: number;
}

export interface DepartmentPerformance {
  department: string;
  total: number;
  resolved: number;
  avgResolutionTime: string;
  score: number;
}

// Stats API
export async function getComplaintStats(municipalId: string): Promise<ComplaintStats> {
  return fetchAPI(`/stats/${municipalId}`);
}

export async function getMonthlyTrends(municipalId: string): Promise<MonthlyTrend[]> {
  return fetchAPI(`/stats/${municipalId}/monthly`);
}

export async function getDepartmentPerformance(municipalId: string): Promise<DepartmentPerformance[]> {
  return fetchAPI(`/stats/${municipalId}/performance`);
}

export interface AnalyticsData {
  categoryStats: {
    [categoryId: string]: {
      total: number;
      resolved: number;
      totalDays: number;
      resolvedCount: number;
    };
  };
  monthlyTrends: {
    [month: string]: {
      [categoryId: string]: number;
    };
  };
  totalComplaints: number;
  resolvedComplaints: number;
  verificationRate: number;
  avgVerificationsPerComplaint: number;
}

export async function getAnalyticsData(municipalId: string): Promise<AnalyticsData> {
  // Fetch directly from Supabase instead of using edge function
  // This avoids deployment issues
  const { createClient } = await import('./supabase/client');
  const supabase = createClient();
  
  // Get all complaints with verification count
  const { data: complaints, error } = await supabase
    .from('complaints_with_verification_count')
    .select('*')
    .eq('municipal_id', municipalId);
  
  if (error) {
    console.error('Error fetching analytics data:', error);
    throw new Error(`Failed to fetch analytics: ${error.message}`);
  }
  
  // Calculate insights
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Category distribution
  const categoryStats: any = {};
  complaints?.forEach(c => {
    if (!categoryStats[c.category_id]) {
      categoryStats[c.category_id] = { total: 0, resolved: 0, totalDays: 0, resolvedCount: 0 };
    }
    categoryStats[c.category_id].total++;
    if (c.status === 'resolved' || c.status === 'verified') {
      categoryStats[c.category_id].resolved++;
      if (c.resolved_date) {
        const days = (new Date(c.resolved_date).getTime() - new Date(c.submitted_date).getTime()) / (1000 * 60 * 60 * 24);
        categoryStats[c.category_id].totalDays += days;
        categoryStats[c.category_id].resolvedCount++;
      }
    }
  });
  
  // Monthly trends by category (last 3 months for trend analysis)
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  
  const monthlyTrends: any = {};
  complaints?.filter(c => new Date(c.submitted_date) >= threeMonthsAgo).forEach(c => {
    const date = new Date(c.submitted_date);
    const monthKey = monthNames[date.getMonth()];
    
    if (!monthlyTrends[monthKey]) {
      monthlyTrends[monthKey] = {};
    }
    if (!monthlyTrends[monthKey][c.category_id]) {
      monthlyTrends[monthKey][c.category_id] = 0;
    }
    monthlyTrends[monthKey][c.category_id]++;
  });
  
  // Calculate verification metrics
  const resolvedWithVerification = complaints?.filter(c => c.status === 'verified' && c.verification_count >= 3).length || 0;
  const resolvedTotal = complaints?.filter(c => c.status === 'resolved' || c.status === 'verified').length || 0;
  const verificationRate = resolvedTotal > 0 ? (resolvedWithVerification / resolvedTotal) * 100 : 0;
  
  return {
    categoryStats,
    monthlyTrends,
    totalComplaints: complaints?.length || 0,
    resolvedComplaints: resolvedTotal,
    verificationRate,
    avgVerificationsPerComplaint: complaints && complaints.length > 0 
      ? complaints.reduce((sum, c) => sum + (c.verification_count || 0), 0) / complaints.length 
      : 0,
  };
}

// State-level API functions
export interface StateStats {
  totalComplaints: number;
  pending: number;
  verified: number;
  resolved: number;
  totalMunicipals: number;
  avgResolutionTime: number;
}

export interface MunicipalStats {
  municipalId: string;
  municipalName: string;
  totalComplaints: number;
  pending: number;
  resolved: number;
  verified: number;
  resolutionRate: number;
  avgResolutionTime: number;
  score: number;
}

export async function getStateStats(stateId: string): Promise<StateStats> {
  const { createClient } = await import('./supabase/client');
  const supabase = createClient();
  
  // Get all municipals in the state
  const { data: municipals, error: municipalsError } = await supabase
    .from('municipals')
    .select('id')
    .eq('state_id', stateId);
  
  if (municipalsError) {
    console.error('Error fetching municipals:', municipalsError);
    throw new Error(`Failed to fetch municipals: ${municipalsError.message}`);
  }
  
  const municipalIds = municipals?.map(m => m.id) || [];
  
  // Get all complaints for these municipals
  const { data: complaints, error: complaintsError } = await supabase
    .from('complaints')
    .select('*')
    .in('municipal_id', municipalIds);
  
  if (complaintsError) {
    console.error('Error fetching complaints:', complaintsError);
    throw new Error(`Failed to fetch complaints: ${complaintsError.message}`);
  }
  
  const total = complaints?.length || 0;
  const pending = complaints?.filter(c => c.status === 'pending').length || 0;
  const verified = complaints?.filter(c => c.status === 'verified').length || 0;
  const resolved = complaints?.filter(c => c.status === 'resolved').length || 0;
  
  // Calculate average resolution time
  const resolvedComplaints = complaints?.filter(c => (c.status === 'resolved' || c.status === 'verified') && c.resolved_date) || [];
  let totalDays = 0;
  resolvedComplaints.forEach(c => {
    const days = (new Date(c.resolved_date).getTime() - new Date(c.submitted_date).getTime()) / (1000 * 60 * 60 * 24);
    totalDays += days;
  });
  const avgResolutionTime = resolvedComplaints.length > 0 ? totalDays / resolvedComplaints.length : 0;
  
  return {
    totalComplaints: total,
    pending,
    verified,
    resolved,
    totalMunicipals: municipalIds.length,
    avgResolutionTime,
  };
}

export async function getMunicipalStatsForState(stateId: string): Promise<MunicipalStats[]> {
  const { createClient } = await import('./supabase/client');
  const supabase = createClient();
  
  // Get all municipals in the state
  const { data: municipals, error: municipalsError } = await supabase
    .from('municipals')
    .select('id, name')
    .eq('state_id', stateId);
  
  if (municipalsError) {
    throw new Error(`Failed to fetch municipals: ${municipalsError.message}`);
  }
  
  const stats: MunicipalStats[] = [];
  
  for (const municipal of municipals || []) {
    const { data: complaints, error } = await supabase
      .from('complaints')
      .select('*')
      .eq('municipal_id', municipal.id);
    
    if (error) continue;
    
    const total = complaints?.length || 0;
    const pending = complaints?.filter(c => c.status === 'pending').length || 0;
    const resolved = complaints?.filter(c => c.status === 'resolved').length || 0;
    const verified = complaints?.filter(c => c.status === 'verified').length || 0;
    
    const resolvedComplaints = complaints?.filter(c => (c.status === 'resolved' || c.status === 'verified') && c.resolved_date) || [];
    let totalDays = 0;
    resolvedComplaints.forEach(c => {
      const days = (new Date(c.resolved_date).getTime() - new Date(c.submitted_date).getTime()) / (1000 * 60 * 60 * 24);
      totalDays += days;
    });
    const avgResolutionTime = resolvedComplaints.length > 0 ? totalDays / resolvedComplaints.length : 0;
    
    const resolutionRate = total > 0 ? ((resolved + verified) / total) * 100 : 0;
    
    // Calculate performance score
    const resolutionScore = resolutionRate;
    const timeScore = avgResolutionTime > 0 ? Math.max(0, 100 - (avgResolutionTime * 2)) : 50;
    const score = Math.round((resolutionScore * 0.6) + (timeScore * 0.4));
    
    stats.push({
      municipalId: municipal.id,
      municipalName: municipal.name,
      totalComplaints: total,
      pending,
      resolved,
      verified,
      resolutionRate,
      avgResolutionTime,
      score,
    });
  }
  
  return stats.sort((a, b) => b.score - a.score);
}

export async function getStateComplaints(stateId: string): Promise<Complaint[]> {
  const { createClient } = await import('./supabase/client');
  const supabase = createClient();
  
  // Get all municipals in the state
  const { data: municipals, error: municipalsError } = await supabase
    .from('municipals')
    .select('id')
    .eq('state_id', stateId);
  
  if (municipalsError) {
    throw new Error(`Failed to fetch municipals: ${municipalsError.message}`);
  }
  
  const municipalIds = municipals?.map(m => m.id) || [];
  
  // Get all complaints for these municipals
  const { data: complaints, error: complaintsError } = await supabase
    .from('complaints_with_verification_count')
    .select('*')
    .in('municipal_id', municipalIds)
    .order('submitted_date', { ascending: false });
  
  if (complaintsError) {
    throw new Error(`Failed to fetch complaints: ${complaintsError.message}`);
  }
  
  // Transform to Complaint type
  return (complaints || []).map(c => ({
    id: c.id,
    category: c.category_id,
    title: c.title,
    description: c.description,
    location: c.location,
    latitude: c.latitude,
    longitude: c.longitude,
    votes: c.votes,
    submittedDate: c.submitted_date,
    status: c.status,
    photo: c.photo_url || '',
    resolvedDate: c.resolved_date,
    resolutionImages: c.resolution_image_urls || [],
    resolutionImage: c.resolution_image_urls?.[0],
    verificationCount: c.verification_count || 0,
    resolvedByOfficer: c.resolved_by,
  }));
}

export interface StateDepartmentPerformance {
  categoryId: string;
  categoryName: string;
  statewideAvg: number;
  worstMunicipal: string;
  worstMunicipalAvg: number;
  bestMunicipal: string;
  bestMunicipalAvg: number;
  totalComplaints: number;
  resolvedPercentage: number;
}

export async function getStateDepartmentPerformance(stateId: string): Promise<StateDepartmentPerformance[]> {
  const { createClient } = await import('./supabase/client');
  const supabase = createClient();
  
  // Get all municipals in the state
  const { data: municipals, error: municipalsError } = await supabase
    .from('municipals')
    .select('id, name')
    .eq('state_id', stateId);
  
  if (municipalsError) {
    throw new Error(`Failed to fetch municipals: ${municipalsError.message}`);
  }
  
  // Get all categories
  const { data: categories, error: categoriesError } = await supabase
    .from('categories')
    .select('id, name');
  
  if (categoriesError) {
    throw new Error(`Failed to fetch categories: ${categoriesError.message}`);
  }
  
  const municipalIds = municipals?.map(m => m.id) || [];
  
  // Get all complaints for these municipals
  const { data: complaints, error: complaintsError } = await supabase
    .from('complaints')
    .select('*')
    .in('municipal_id', municipalIds);
  
  if (complaintsError) {
    throw new Error(`Failed to fetch complaints: ${complaintsError.message}`);
  }
  
  const deptPerformance: StateDepartmentPerformance[] = [];
  
  for (const category of categories || []) {
    const categoryComplaints = complaints?.filter(c => c.category_id === category.id) || [];
    
    if (categoryComplaints.length === 0) continue;
    
    // Calculate municipal-level stats for this category
    const municipalStats: { [key: string]: { avgDays: number; name: string; count: number } } = {};
    
    for (const municipal of municipals || []) {
      const munComplaints = categoryComplaints.filter(c => c.municipal_id === municipal.id);
      const resolved = munComplaints.filter(c => (c.status === 'resolved' || c.status === 'verified') && c.resolved_date);
      
      if (resolved.length > 0) {
        const totalDays = resolved.reduce((sum, c) => {
          const days = (new Date(c.resolved_date).getTime() - new Date(c.submitted_date).getTime()) / (1000 * 60 * 60 * 24);
          return sum + days;
        }, 0);
        
        municipalStats[municipal.id] = {
          avgDays: totalDays / resolved.length,
          name: municipal.name,
          count: munComplaints.length,
        };
      }
    }
    
    // Calculate statewide average
    const allResolved = categoryComplaints.filter(c => (c.status === 'resolved' || c.status === 'verified') && c.resolved_date);
    let statewideAvg = 0;
    if (allResolved.length > 0) {
      const totalDays = allResolved.reduce((sum, c) => {
        const days = (new Date(c.resolved_date).getTime() - new Date(c.submitted_date).getTime()) / (1000 * 60 * 60 * 24);
        return sum + days;
      }, 0);
      statewideAvg = totalDays / allResolved.length;
    }
    
    // Find best and worst
    const statsArray = Object.entries(municipalStats);
    if (statsArray.length === 0) continue;
    
    const worst = statsArray.reduce((prev, curr) => prev[1].avgDays > curr[1].avgDays ? prev : curr);
    const best = statsArray.reduce((prev, curr) => prev[1].avgDays < curr[1].avgDays ? prev : curr);
    
    const resolvedCount = categoryComplaints.filter(c => c.status === 'resolved' || c.status === 'verified').length;
    const resolvedPercentage = categoryComplaints.length > 0 ? (resolvedCount / categoryComplaints.length) * 100 : 0;
    
    deptPerformance.push({
      categoryId: category.id,
      categoryName: category.name,
      statewideAvg,
      worstMunicipal: worst[1].name,
      worstMunicipalAvg: worst[1].avgDays,
      bestMunicipal: best[1].name,
      bestMunicipalAvg: best[1].avgDays,
      totalComplaints: categoryComplaints.length,
      resolvedPercentage,
    });
  }
  
  return deptPerformance;
}

export interface YearlyTrend {
  year: string;
  total: number;
  resolved: number;
  avgDays: number;
}

export async function getStateHistoricalTrends(stateId: string): Promise<YearlyTrend[]> {
  const { createClient } = await import('./supabase/client');
  const supabase = createClient();
  
  // Get all municipals in the state
  const { data: municipals, error: municipalsError } = await supabase
    .from('municipals')
    .select('id')
    .eq('state_id', stateId);
  
  if (municipalsError) {
    throw new Error(`Failed to fetch municipals: ${municipalsError.message}`);
  }
  
  const municipalIds = municipals?.map(m => m.id) || [];
  
  // Get all complaints for these municipals
  const { data: complaints, error: complaintsError } = await supabase
    .from('complaints')
    .select('*')
    .in('municipal_id', municipalIds);
  
  if (complaintsError) {
    throw new Error(`Failed to fetch complaints: ${complaintsError.message}`);
  }
  
  // Group by year
  const yearlyData: { [key: string]: YearlyTrend } = {};
  
  complaints?.forEach(c => {
    const year = new Date(c.submitted_date).getFullYear().toString();
    
    if (!yearlyData[year]) {
      yearlyData[year] = { year, total: 0, resolved: 0, avgDays: 0 };
    }
    
    yearlyData[year].total++;
    
    if ((c.status === 'resolved' || c.status === 'verified') && c.resolved_date) {
      yearlyData[year].resolved++;
    }
  });
  
  // Calculate average resolution days for each year
  Object.keys(yearlyData).forEach(year => {
    const yearComplaints = complaints?.filter(c => 
      new Date(c.submitted_date).getFullYear().toString() === year &&
      (c.status === 'resolved' || c.status === 'verified') &&
      c.resolved_date
    ) || [];
    
    if (yearComplaints.length > 0) {
      const totalDays = yearComplaints.reduce((sum, c) => {
        const days = (new Date(c.resolved_date).getTime() - new Date(c.submitted_date).getTime()) / (1000 * 60 * 60 * 24);
        return sum + days;
      }, 0);
      yearlyData[year].avgDays = totalDays / yearComplaints.length;
    }
  });
  
  // Convert to array and sort by year
  return Object.values(yearlyData).sort((a, b) => parseInt(a.year) - parseInt(b.year));
}

export interface CategoryForecast {
  categoryId: string;
  categoryName: string;
  forecast2025: number;
  confidence: number;
}

export async function getStateForecast(stateId: string): Promise<CategoryForecast[]> {
  const { createClient } = await import('./supabase/client');
  const supabase = createClient();
  
  // Get all municipals in the state
  const { data: municipals, error: municipalsError } = await supabase
    .from('municipals')
    .select('id')
    .eq('state_id', stateId);
  
  if (municipalsError) {
    throw new Error(`Failed to fetch municipals: ${municipalsError.message}`);
  }
  
  // Get all categories
  const { data: categories, error: categoriesError } = await supabase
    .from('categories')
    .select('id, name');
  
  if (categoriesError) {
    throw new Error(`Failed to fetch categories: ${categoriesError.message}`);
  }
  
  const municipalIds = municipals?.map(m => m.id) || [];
  
  // Get all complaints for these municipals
  const { data: complaints, error: complaintsError } = await supabase
    .from('complaints')
    .select('*')
    .in('municipal_id', municipalIds);
  
  if (complaintsError) {
    throw new Error(`Failed to fetch complaints: ${complaintsError.message}`);
  }
  
  const forecasts: CategoryForecast[] = [];
  const currentYear = new Date().getFullYear();
  
  for (const category of categories || []) {
    // Get last 3 years of data for this category
    const categoryComplaints = complaints?.filter(c => c.category_id === category.id) || [];
    
    // Group by year
    const yearlyCount: { [key: number]: number } = {};
    categoryComplaints.forEach(c => {
      const year = new Date(c.submitted_date).getFullYear();
      if (year >= currentYear - 3) {
        yearlyCount[year] = (yearlyCount[year] || 0) + 1;
      }
    });
    
    // Calculate trend (simple linear regression)
    const years = Object.keys(yearlyCount).map(Number).sort();
    if (years.length >= 2) {
      const counts = years.map(y => yearlyCount[y]);
      const avgCount = counts.reduce((a, b) => a + b, 0) / counts.length;
      
      // Calculate growth rate
      const firstYear = counts[0];
      const lastYear = counts[counts.length - 1];
      const growthRate = lastYear > 0 ? ((lastYear - firstYear) / firstYear) : 0;
      
      // Forecast for next year
      const forecast = Math.round(lastYear * (1 + growthRate));
      
      // Confidence based on data consistency
      const variance = counts.reduce((sum, c) => sum + Math.pow(c - avgCount, 2), 0) / counts.length;
      const stdDev = Math.sqrt(variance);
      const cv = avgCount > 0 ? (stdDev / avgCount) : 1;
      const confidence = Math.max(60, Math.min(95, 90 - (cv * 30)));
      
      forecasts.push({
        categoryId: category.id,
        categoryName: category.name,
        forecast2025: forecast > 0 ? forecast : avgCount,
        confidence: Math.round(confidence),
      });
    } else {
      // Not enough data, use current year count
      const currentCount = categoryComplaints.filter(c => 
        new Date(c.submitted_date).getFullYear() === currentYear
      ).length;
      
      forecasts.push({
        categoryId: category.id,
        categoryName: category.name,
        forecast2025: currentCount,
        confidence: 65,
      });
    }
  }
  
  return forecasts;
}
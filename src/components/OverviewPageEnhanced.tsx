import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  Activity, 
  Loader2,
  MapPin,
  Calendar,
  Users,
  BarChart3,
  Zap,
  ThumbsUp,
  Eye,
  ArrowUp,
  ArrowDown,
  Sparkles,
} from "lucide-react";
import { categories } from "../data/dummyData";

interface Complaint {
  id: number;
  category: string;
  title: string;
  description: string;
  location: string;
  votes: number;
  submittedDate: string;
  status: 'pending' | 'verified' | 'resolved';
  photo: string;
  resolutionImage?: string;
  resolvedDate?: string;
}

interface OverviewPageProps {
  complaints: Complaint[];
  loading?: boolean;
}

export function OverviewPageEnhanced({ complaints, loading }: OverviewPageProps) {
  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-16 w-16 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-lg text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const pendingCount = complaints.filter(c => c.status === 'pending').length;
  const verifiedCount = complaints.filter(c => c.status === 'verified').length;
  const resolvedCount = complaints.filter(c => c.status === 'resolved').length;
  const totalCount = complaints.length;
  const resolutionRate = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0;

  // Calculate trends (last 7 days vs previous 7 days)
  const now = new Date();
  const last7Days = complaints.filter(c => {
    const daysDiff = Math.floor((now.getTime() - new Date(c.submittedDate).getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff <= 7;
  });
  const prev7Days = complaints.filter(c => {
    const daysDiff = Math.floor((now.getTime() - new Date(c.submittedDate).getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff > 7 && daysDiff <= 14;
  });
  const weeklyTrend = prev7Days.length > 0 
    ? Math.round(((last7Days.length - prev7Days.length) / prev7Days.length) * 100)
    : 0;

  // Get recent complaints (last 5)
  const recentComplaints = [...complaints]
    .sort((a, b) => new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime())
    .slice(0, 5);

  // Get urgent complaints (pending with high votes)
  const urgentComplaints = complaints
    .filter(c => c.status === 'pending')
    .sort((a, b) => b.votes - a.votes)
    .slice(0, 5);

  // Calculate average resolution time
  const resolvedWithDates = complaints.filter(c => c.status === 'resolved' && c.resolvedDate);
  const avgResolutionTime = resolvedWithDates.length > 0
    ? Math.round(resolvedWithDates.reduce((sum, c) => {
        const submitDate = new Date(c.submittedDate);
        const resolveDate = new Date(c.resolvedDate!);
        const days = (resolveDate.getTime() - submitDate.getTime()) / (1000 * 60 * 60 * 24);
        return sum + days;
      }, 0) / resolvedWithDates.length)
    : 0;

  // Get top categories
  const categoryCounts = categories.map(cat => ({
    ...cat,
    count: complaints.filter(c => c.category === cat.id).length,
    pending: complaints.filter(c => c.category === cat.id && c.status === 'pending').length,
  })).sort((a, b) => b.count - a.count);

  return (
    <div className="p-8 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-xl">
            <BarChart3 className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl mb-1">Dashboard Overview</h1>
            <p className="text-sm text-gray-600">Real-time municipal complaint system insights</p>
          </div>
        </div>

      </div>

      {/* Main Stats Cards - Enhanced Design */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Complaints */}
        <Card className="overflow-hidden bg-white border border-gray-200 shadow-sm">
  {/* Main Content Area */}
  <div className="p-6">
    <div className="flex items-start justify-between mb-4">
      {/* Icon */}
      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
        <Activity className="w-6 h-6 text-blue-600" />
      </div>
      
      {/* Badge */}
      <div className="text-right">
        <div className="text-xs text-gray-500 mb-1">Total</div>
        <Badge variant="outline" className="bg-gray-50 border-gray-200 text-gray-700">
          All Time
        </Badge>
      </div>
    </div>
    
    {/* Main Stats */}
    <div className="text-4xl font-bold text-gray-900 mb-1">{totalCount}</div>
    <div className="text-sm text-gray-500">All Complaints</div>
  </div>
  
  {/* Footer Area with different background */}
  <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
    <div className="flex items-center justify-between text-sm text-gray-600">
      <span>This Week</span>
      <span className="flex items-center gap-1 font-medium">
        {last7Days.length}
        
        {/* Trend Indicator */}
        {weeklyTrend !== 0 && (
          <span className={`flex items-center ml-2 text-xs ${weeklyTrend > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {weeklyTrend > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
            {Math.abs(weeklyTrend)}%
          </span>
        )}
      </span>
    </div>
  </div>
</Card>

        {/* Pending */}
        <Card className="overflow-hidden bg-white border border-gray-200 shadow-sm">
  {/* Main Content Area */}
  <div className="p-6">
    <div className="flex items-start justify-between mb-4">
      {/* Icon */}
      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
        <Clock className="w-8 h-8 text-blue-600" />
      </div>
      
      {/* Badge */}
      <div className="text-right">
        <div className="text-xs text-gray-500 mb-1">Pending</div>
        <Badge variant="outline" className="bg-gray-50 border-gray-200 text-gray-700">
          {totalCount > 0 ? Math.round((pendingCount / totalCount) * 100) : 0}%
        </Badge>
      </div>
    </div>
    
    {/* Main Stats */}
    <div className="text-4xl font-bold text-gray-900 mb-1">{pendingCount}</div>
    <div className="text-sm text-gray-500">Awaiting Action</div>
  </div>
  
  {/* Footer Area with different background */}
  <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
    <div className="flex items-center justify-between text-sm text-gray-600">
      <span>Requires Review</span>
      <span className="flex items-center gap-1 font-medium text-orange-600"> {/* Added color for emphasis */}
        <AlertTriangle className="w-4 h-4" /> {/* Slightly larger icon */}
        High Priority
      </span>
    </div>
  </div>
</Card>

        {/* In Progress */}
        <Card className="overflow-hidden bg-white border border-gray-200 shadow-sm">
  {/* Main Content */}
  <div className="p-6">
    <div className="flex items-start justify-between mb-4">
      
      {/* Icon */}
      <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center">
        <TrendingUp className="w-6 h-6 text-cyan-600" />
      </div>

      {/* Badge + Label */}
      <div className="text-right">
        <div className="text-xs text-gray-500 mb-1">Active</div>
        <Badge variant="outline" className="bg-gray-50 border-gray-200 text-gray-700">
          {totalCount > 0 ? Math.round((verifiedCount / totalCount) * 100) : 0}%
        </Badge>
      </div>
    </div>

    {/* Main Stats */}
    <div className="text-4xl font-bold text-gray-900 mb-1">{verifiedCount}</div>
    <div className="text-sm text-gray-500">In Progress</div>
  </div>

  {/* Footer */}
  <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
    <div className="flex items-center justify-between text-sm text-gray-600">
      <span>Being Resolved</span>

      <span className="flex items-center gap-1 font-medium">
        Active
        <Zap className="w-4 h-4 text-cyan-600" />
      </span>
    </div>
  </div>
</Card>


        {/* Resolved */}
        <Card className="overflow-hidden bg-white border border-gray-200 shadow-sm">
  {/* Main Content */}
  <div className="p-6">
    <div className="flex items-start justify-between mb-4">

      {/* Icon */}
      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
        <CheckCircle className="w-6 h-6 text-green-600" />
      </div>

      {/* Badge + Label */}
      <div className="text-right">
        <div className="text-xs text-gray-500 mb-1">Success Rate</div>
        <Badge variant="outline" className="bg-gray-50 border-gray-200 text-gray-700">
          {resolutionRate}%
        </Badge>
      </div>
    </div>

    {/* Main Stats */}
    <div className="text-4xl font-bold text-gray-900 mb-1">{resolvedCount}</div>
    <div className="text-sm text-gray-500">Resolved</div>
  </div>

  {/* Footer */}
  <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
    <div className="flex items-center justify-between text-sm text-gray-600">
      <span>Avg Resolution</span>

      <span className="flex items-center gap-1 font-medium">
        {avgResolutionTime} days
      </span>
    </div>
  </div>
</Card>

      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6 bg-white shadow-lg hover:shadow-xl transition-shadow border-l-4 ">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center">
              <ThumbsUp className="w-8 h-8 text-purple-600" />
            </div>
            <div className="flex-1">
              <div className="text-xs text-gray-600 mb-1">Citizen Engagement</div>
              <div className="text-3xl mb-1">
                {complaints.reduce((sum, c) => sum + c.votes, 0)}
              </div>
              <div className="text-xs text-gray-600">Total Votes</div>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white shadow-lg hover:shadow-xl transition-shadow border-l-4 border-indigo-500">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-2xl flex items-center justify-center">
              <MapPin className="w-8 h-8 text-indigo-600" />
            </div>
            <div className="flex-1">
              <div className="text-xs text-gray-600 mb-1">Active Locations</div>
              <div className="text-3xl mb-1">
                {new Set(complaints.map(c => c.location)).size}
              </div>
              <div className="text-xs text-gray-600">Unique Areas</div>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white shadow-lg hover:shadow-xl transition-shadow border-l-4 border-pink-500">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-pink-200 rounded-2xl flex items-center justify-center">
              <Calendar className="w-8 h-8 text-pink-600" />
            </div>
            <div className="flex-1">
              <div className="text-xs text-gray-600 mb-1">This Week</div>
              <div className="text-3xl mb-1">{last7Days.length}</div>
              <div className="text-xs text-gray-600 flex items-center gap-1">
                New Complaints
                {weeklyTrend !== 0 && (
                  <span className={`flex items-center ${weeklyTrend > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {weeklyTrend > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                    {Math.abs(weeklyTrend)}%
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Category Overview - Enhanced */}
      <Card className="p-6 mb-8 bg-white shadow-xl border-t-4 border-blue-500">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl">Category Overview</h2>
          <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
            {categoryCounts.filter(c => c.count > 0).length} Active
          </Badge>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
  {categoryCounts.map((category) => {
    const percentage =
      totalCount > 0 ? Math.round((category.count / totalCount) * 100) : 0;

    return (
      <div
        key={category.id}
        className="relative group text-center p-5 bg-white rounded-xl 
        border border-gray-200 hover:border-blue-400 
        transition-all cursor-pointer transform hover:-translate-y-1 
        hover:shadow-lg"
      >
        {/* Icon */}
        <div className="text-4xl mb-3 transform group-hover:scale-110 transition-transform">
          {category.icon}
        </div>

        {/* Count */}
        <div className="text-3xl font-semibold text-gray-800 mb-1">
          {category.count}
        </div>

        {/* Label */}
        <p className="text-sm text-gray-600 mb-4">{category.name}</p>

        {/* Improved Progress Bar */}
        <div className="w-full mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-lg font-medium text-gray-600">Progress</span>
            <span className="text-lg font-semibold text-gray-900">
              {percentage}%
            </span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="h-2.5 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 
              transition-all duration-300 shadow-inner"
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
        </div>

        {/* Footer (Pending Badge) */}
        <div className="flex items-center justify-between text-lg mt-1">
          <span className="text-gray-500">Total</span>

          {category.pending > 0 && (
            <Badge className="bg-orange-100 text-orange-800 border-0 text-lg px-2 py-0.5 rounded-md">
              {category.pending}
            </Badge>
          )}
        </div>
      </div>
    );
  })}
</div>

      </Card>

      {/* Bottom Grid - Urgent & Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Urgent Complaints */}
        <Card className="p-6 bg-white shadow-xl border-l-4 border-red-500">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-black" />
            </div>
            <h2 className="text-xl">Urgent Complaints</h2>
            <Badge className="bg-gradient-to-r from-red-600 to-orange-600 text-white border-0">
              High Priority
            </Badge>
          </div>
          <div className="space-y-3">
            {urgentComplaints.length > 0 ? (
              urgentComplaints.map((complaint) => (
                <div 
                  key={complaint.id} 
                  className="p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl hover:shadow-md transition-all border border-red-200 hover:border-red-400"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-sm flex-1 pr-2">{complaint.title}</h3>
                    <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 text-xs flex items-center gap-1">
                      <ThumbsUp className="w-3 h-3" />
                      {complaint.votes}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <MapPin className="w-3 h-3" />
                      {complaint.location}
                    </div>
                    <div className="text-xs text-gray-500">
                      {getTimeAgo(new Date(complaint.submittedDate))}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="text-gray-500">No urgent complaints</p>
                <p className="text-xs text-gray-400 mt-1">All complaints are being handled</p>
              </div>
            )}
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-6 bg-white shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl">Recent Activity</h2>
            <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
              <Sparkles className="w-3 h-3 mr-1" />
              Live
            </Badge>
          </div>
          <div className="space-y-3">
            {recentComplaints.map((complaint) => {
              const date = new Date(complaint.submittedDate);
              const timeAgo = getTimeAgo(date);
              
              const statusConfig = {
                pending: { 
                  label: 'Pending', 
                  className: 'bg-gradient-to-r from-orange-500 to-amber-500 text-white',
                  bgClass: 'from-orange-50 to-amber-50 border-orange-200'
                },
                verified: { 
                  label: 'In Progress', 
                  className: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white',
                  bgClass: 'from-blue-50 to-cyan-50 border-blue-200'
                },
                resolved: { 
                  label: 'Resolved', 
                  className: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white',
                  bgClass: 'from-green-50 to-emerald-50 border-green-200'
                },
              };
              
              return (
                <div 
                  key={complaint.id} 
                  className={`p-4 bg-gradient-to-r ${statusConfig[complaint.status].bgClass} rounded-xl border hover:shadow-md transition-all`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-sm flex-1 pr-2">{complaint.title}</h3>
                    <Badge className={`${statusConfig[complaint.status].className} border-0 text-xs`}>
                      {statusConfig[complaint.status].label}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <MapPin className="w-3 h-3" />
                      {complaint.location}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      {timeAgo}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

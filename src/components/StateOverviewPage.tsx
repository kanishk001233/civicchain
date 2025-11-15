import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { 
  Building2, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Award,
  MapPin,
  BarChart3,
  Users,
  Target,
  Activity
} from "lucide-react";
import { useState, useEffect } from "react";
import { getStateStats, getMunicipalStatsForState, StateStats, MunicipalStats } from "../utils/api";

interface StateOverviewPageProps {
  stateId: string;
  stateName: string;
}

export function StateOverviewPage({ stateId, stateName }: StateOverviewPageProps) {
  const [stateStats, setStateStats] = useState<StateStats | null>(null);
  const [municipalStats, setMunicipalStats] = useState<MunicipalStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [stateId]);

  async function loadData() {
    try {
      setLoading(true);
      const [stats, municipals] = await Promise.all([
        getStateStats(stateId),
        getMunicipalStatsForState(stateId),
      ]);
      setStateStats(stats);
      setMunicipalStats(municipals);
    } catch (error) {
      console.error('Error loading state data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading state data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!stateStats) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-600">
          <p>No data available for this state</p>
        </div>
      </div>
    );
  }

  const resolutionRate = stateStats.totalComplaints > 0 
    ? ((stateStats.resolved + stateStats.verified) / stateStats.totalComplaints * 100).toFixed(1)
    : '0';

  const topPerformers = municipalStats.slice(0, 5);
  const needsAttention = municipalStats.filter(m => m.score < 70).slice(0, 5);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <Building2 className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1>{stateName} - State Overview</h1>
            <p className="text-gray-600">Comprehensive view of all municipal corporations</p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <Badge className="bg-blue-600 text-white">State-wide</Badge>
          </div>
          <h3 className="text-3xl mb-2">{stateStats.totalComplaints.toLocaleString()}</h3>
          <p className="text-gray-700">Total Complaints</p>
          <div className="mt-3 flex items-center gap-2 text-sm">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span className="text-gray-600">{stateStats.totalMunicipals} Municipal Corporations</span>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-amber-600 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <Badge className="bg-amber-600 text-white">Pending</Badge>
          </div>
          <h3 className="text-3xl mb-2">{stateStats.pending.toLocaleString()}</h3>
          <p className="text-gray-700">Awaiting Action</p>
          <div className="mt-3 flex items-center gap-2 text-sm">
            <Activity className="w-4 h-4 text-amber-600" />
            <span className="text-gray-600">
              {stateStats.totalComplaints > 0 
                ? ((stateStats.pending / stateStats.totalComplaints) * 100).toFixed(1)
                : '0'}% of total
            </span>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <Badge className="bg-green-600 text-white">Success</Badge>
          </div>
          <h3 className="text-3xl mb-2">{(stateStats.resolved + stateStats.verified).toLocaleString()}</h3>
          <p className="text-gray-700">Resolved</p>
          <div className="mt-3 flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-gray-600">{resolutionRate}% Resolution Rate</span>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
            <Badge className="bg-purple-600 text-white">Avg Time</Badge>
          </div>
          <h3 className="text-3xl mb-2">{stateStats.avgResolutionTime.toFixed(1)}</h3>
          <p className="text-gray-700">Days to Resolve</p>
          <div className="mt-3 flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-purple-600" />
            <span className="text-gray-600">Across all municipals</span>
          </div>
        </Card>
      </div>

      {/* Municipal Performance Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Top Performers */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Award className="w-6 h-6 text-green-600" />
            <h2>Top Performing Municipals</h2>
            <Badge variant="outline" className="ml-auto">{topPerformers.length} Shown</Badge>
          </div>
          
          <div className="space-y-4">
            {topPerformers.map((municipal, index) => (
              <div key={municipal.municipalId} className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-700' : 'bg-blue-600'
                } text-white shadow-md`}>
                  {index + 1}
                </div>
                
                <div className="flex-1">
                  <h3 className="mb-1">{municipal.municipalName}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>{municipal.totalComplaints} complaints</span>
                    <span>•</span>
                    <span>{municipal.resolutionRate.toFixed(1)}% resolved</span>
                    <span>•</span>
                    <span>{municipal.avgResolutionTime.toFixed(1)} days avg</span>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-2xl text-green-600 mb-1">{municipal.score}</div>
                  <Badge className="bg-green-600 text-white">Excellent</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Needs Attention */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <AlertCircle className="w-6 h-6 text-amber-600" />
            <h2>Needs Attention</h2>
            <Badge variant="outline" className="ml-auto">{needsAttention.length} Municipal{needsAttention.length !== 1 ? 's' : ''}</Badge>
          </div>
          
          {needsAttention.length > 0 ? (
            <div className="space-y-4">
              {needsAttention.map((municipal, index) => (
                <div key={municipal.municipalId} className="flex items-center gap-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                  <div className="w-10 h-10 bg-amber-600 rounded-full flex items-center justify-center text-white">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="mb-1">{municipal.municipalName}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{municipal.pending} pending</span>
                      <span>•</span>
                      <span>{municipal.resolutionRate.toFixed(1)}% resolved</span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl text-amber-600 mb-1">{municipal.score}</div>
                    <Badge className="bg-amber-600 text-white">Needs Work</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-600" />
              <p>All municipals performing well!</p>
            </div>
          )}
        </Card>
      </div>

      {/* All Municipal Corporations */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Building2 className="w-6 h-6 text-blue-600" />
          <h2>All Municipal Corporations</h2>
          <Badge variant="outline" className="ml-auto">{municipalStats.length} Total</Badge>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-4">Rank</th>
                <th className="text-left py-3 px-4">Municipal Corporation</th>
                <th className="text-right py-3 px-4">Total</th>
                <th className="text-right py-3 px-4">Pending</th>
                <th className="text-right py-3 px-4">Resolved</th>
                <th className="text-right py-3 px-4">Resolution Rate</th>
                <th className="text-right py-3 px-4">Avg Time</th>
                <th className="text-right py-3 px-4">Score</th>
              </tr>
            </thead>
            <tbody>
              {municipalStats.map((municipal, index) => (
                <tr key={municipal.municipalId} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm text-blue-600">
                      {index + 1}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>{municipal.municipalName}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">{municipal.totalComplaints}</td>
                  <td className="py-3 px-4 text-right">
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-sm">
                      {municipal.pending}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm">
                      {municipal.resolved + municipal.verified}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">{municipal.resolutionRate.toFixed(1)}%</td>
                  <td className="py-3 px-4 text-right">{municipal.avgResolutionTime.toFixed(1)} days</td>
                  <td className="py-3 px-4 text-right">
                    <Badge className={
                      municipal.score >= 90 ? "bg-green-600 text-white" :
                      municipal.score >= 80 ? "bg-blue-600 text-white" :
                      municipal.score >= 70 ? "bg-amber-600 text-white" :
                      "bg-red-600 text-white"
                    }>
                      {municipal.score}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Status Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Card className="p-6 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between mb-4">
            <Clock className="w-8 h-8 text-amber-600" />
            <Badge className="bg-amber-100 text-amber-700">Pending</Badge>
          </div>
          <h3 className="text-3xl mb-2">{stateStats.pending.toLocaleString()}</h3>
          <p className="text-gray-600">Awaiting resolution</p>
          <div className="mt-4 bg-gray-200 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-amber-500 h-full" 
              style={{ 
                width: `${stateStats.totalComplaints > 0 ? (stateStats.pending / stateStats.totalComplaints) * 100 : 0}%` 
              }}
            />
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 text-blue-600" />
            <Badge className="bg-blue-100 text-blue-700">Verified</Badge>
          </div>
          <h3 className="text-3xl mb-2">{stateStats.verified.toLocaleString()}</h3>
          <p className="text-gray-600">Citizen verified</p>
          <div className="mt-4 bg-gray-200 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-blue-500 h-full" 
              style={{ 
                width: `${stateStats.totalComplaints > 0 ? (stateStats.verified / stateStats.totalComplaints) * 100 : 0}%` 
              }}
            />
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-green-500">
          <div className="flex items-center justify-between mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
            <Badge className="bg-green-100 text-green-700">Resolved</Badge>
          </div>
          <h3 className="text-3xl mb-2">{stateStats.resolved.toLocaleString()}</h3>
          <p className="text-gray-600">Successfully resolved</p>
          <div className="mt-4 bg-gray-200 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-green-500 h-full" 
              style={{ 
                width: `${stateStats.totalComplaints > 0 ? (stateStats.resolved / stateStats.totalComplaints) * 100 : 0}%` 
              }}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}

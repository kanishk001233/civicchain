import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ComplaintCard } from "./ComplaintCard";
import { ComplaintDetailsDialog } from "./ComplaintDetailsDialog";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import * as api from "../utils/api";

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

interface DepartmentsPageProps {
  complaints: Complaint[];
  onResolve: (id: number, imageUrl: string) => void;
  loading?: boolean;
}

export function DepartmentsPage({ complaints, onResolve, loading }: DepartmentsPageProps) {
  const [categories, setCategories] = useState<api.Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await api.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const getCategoryComplaints = (categoryId: string, status?: string) => {
    return complaints.filter(c => {
      const matchesCategory = c.category === categoryId;
      if (status === 'pending') {
        return matchesCategory && c.status === 'pending';
      }
      if (status === 'resolved') {
        return matchesCategory && c.status === 'resolved';
      }
      if (status === 'verified') {
        return matchesCategory && c.status === 'verified';
      }
      return matchesCategory;
    });
  };

  const getCategoryStats = (categoryId: string) => {
    const total = getCategoryComplaints(categoryId).length;
    const pending = getCategoryComplaints(categoryId).filter(c => c.status === 'pending').length;
    const resolved = getCategoryComplaints(categoryId).filter(c => c.status === 'resolved').length;
    const verified = getCategoryComplaints(categoryId).filter(c => c.status === 'verified').length;
    return { total, pending, resolved, verified };
  };

  if (selectedCategory) {
    const category = categories.find(c => c.id === selectedCategory);
    const pendingComplaints = getCategoryComplaints(selectedCategory, 'pending');
    const resolvedComplaints = getCategoryComplaints(selectedCategory, 'resolved');
    const verifiedComplaints = getCategoryComplaints(selectedCategory, 'verified');

    return (
      <>
        <div className="p-8">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => setSelectedCategory(null)}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Categories
            </Button>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{category?.icon}</span>
              <div>
                <h1>{category?.name}</h1>
                <p className="text-gray-600">Click on any complaint to view full details</p>
              </div>
            </div>
          </div>

          <Tabs defaultValue="pending" className="w-full">
            <TabsList>
              <TabsTrigger value="pending">
                Pending
                <Badge className="ml-2 bg-amber-100 text-amber-800">
                  {pendingComplaints.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="resolved">
                Resolved
                <Badge className="ml-2 bg-blue-100 text-blue-800">
                  {resolvedComplaints.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="verified">
                Verified
                <Badge className="ml-2 bg-green-100 text-green-800">
                  {verifiedComplaints.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-6">
              <div className="space-y-4">
                {pendingComplaints.length > 0 ? (
                  pendingComplaints.map((complaint) => (
                    <ComplaintCard
                      key={complaint.id}
                      complaint={complaint}
                      onResolve={onResolve}
                      onClick={setSelectedComplaint}
                    />
                  ))
                ) : (
                  <Card className="p-12 text-center">
                    <p className="text-gray-500">No pending complaints in this category</p>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="resolved" className="mt-6">
              <div className="space-y-4">
                {resolvedComplaints.length > 0 ? (
                  resolvedComplaints.map((complaint) => (
                    <ComplaintCard
                      key={complaint.id}
                      complaint={complaint}
                      onResolve={onResolve}
                      onClick={setSelectedComplaint}
                    />
                  ))
                ) : (
                  <Card className="p-12 text-center">
                    <p className="text-gray-500">No resolved complaints in this category</p>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="verified" className="mt-6">
              <div className="space-y-4">
                {verifiedComplaints.length > 0 ? (
                  verifiedComplaints.map((complaint) => (
                    <ComplaintCard
                      key={complaint.id}
                      complaint={complaint}
                      onResolve={onResolve}
                      onClick={setSelectedComplaint}
                    />
                  ))
                ) : (
                  <Card className="p-12 text-center">
                    <p className="text-gray-500">No verified complaints yet</p>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        <ComplaintDetailsDialog
          complaint={selectedComplaint}
          open={!!selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
        />
      </>
    );
  }

  if (loadingCategories || loading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading departments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="mb-2">Departments</h1>
        <p className="text-gray-600">Select a department to view and manage complaints</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => {
          const stats = getCategoryStats(category.id);
          return (
            <Card
              key={category.id}
              className="p-6 cursor-pointer hover:shadow-lg transition-all hover:scale-105"
              onClick={() => setSelectedCategory(category.id)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{category.icon || '📋'}</span>
                  <div>
                    <h3>{category.name}</h3>
                  </div>
                </div>
                <Badge variant="outline" className="text-lg px-3 py-1">
                  {stats.total}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
                <div className="text-center">
                  <div className="text-amber-600">{stats.pending}</div>
                  <div className="text-xs text-gray-500 mt-1">Pending</div>
                </div>
                <div className="text-center">
                  <div className="text-blue-600">{stats.resolved}</div>
                  <div className="text-xs text-gray-500 mt-1">Resolved</div>
                </div>
                <div className="text-center">
                  <div className="text-green-600">{stats.verified}</div>
                  <div className="text-xs text-gray-500 mt-1">Verified</div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

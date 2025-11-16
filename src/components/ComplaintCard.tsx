import { useState } from "react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { MapPin, ThumbsUp, Calendar, CheckCircle, Users } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { ResolveDialog } from "./ResolveDialog";

interface Complaint {
  id: number | string;
  category: string;
  title: string;
  description: string;
  location: string;
  latitude?: number | null;
  longitude?: number | null;
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

interface ComplaintCardProps {
  complaint: Complaint;
  onResolve: (id: number | string, imageUrl: string) => void;
  onClick: (complaint: Complaint) => void;
}

export function ComplaintCard({ complaint, onResolve, onClick }: ComplaintCardProps) {
  const [showResolveDialog, setShowResolveDialog] = useState(false);

  const statusConfig = {
    pending: { label: 'Pending', className: 'bg-amber-100 text-amber-800' },
    resolved: { label: 'Resolved', className: 'bg-blue-100 text-blue-800' },
    verified: { label: 'Verified', className: 'bg-green-100 text-green-800' },
  };

  const status = statusConfig[complaint.status];
  const date = new Date(complaint.submittedDate);
  const formattedDate = date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
  const formattedTime = date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  const resolvedDate = complaint.resolvedDate ? new Date(complaint.resolvedDate) : null;
  const formattedResolvedDate = resolvedDate?.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
  const formattedResolvedTime = resolvedDate?.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  const handleResolveClick = () => {
    setShowResolveDialog(true);
  };

  const handleResolveSubmit = (imageUrl: string) => {
    onResolve(complaint.id, imageUrl);
  };

  const handleSearchLocation = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const location = complaint.location?.trim();
    
    if (!location) {
      alert('Location information is not available for this complaint.');
      return;
    }
    
    // Encode the location for URL
    const encodedLocation = encodeURIComponent(location);
    
    // Open Google Maps search with the location (works for both addresses and coordinates)
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`;
    
    console.log('Searching Google Maps for:', location);
    console.log('Maps URL:', mapsUrl);
    
    window.open(mapsUrl, '_blank');
  };

  return (
    <>
      <Card 
        className="overflow-hidden hover:shadow-lg transition-all cursor-pointer border-2 hover:border-blue-300"
        onClick={() => onClick(complaint)}
      >
        <div className="flex flex-col md:flex-row">
          {/* Image */}
          <div className="md:w-48 h-48 md:h-auto bg-gray-100 flex-shrink-0 relative group">
            <ImageWithFallback
              src={complaint.photo}
              alt={complaint.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-opacity-0 group-hover:bg-opacity-10 transition-all flex items-center justify-center">
  
  {/* Translucent (Frosted Glass) Box */}
  <div className="
    opacity-0 group-hover:opacity-100 transition-opacity
    
    /* These two classes create the translucent effect */
    bg-white bg-opacity-100
    backdrop-blur-lg
    
    /* Your existing box styles */
    border border-white border-opacity-90
    rounded-lg px-3 py-1.5
    
    /* Your existing glow effect */
    group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]
  ">
    <p className="text-black text-sm">
      Click for details
    </p>
  </div>
</div>
          </div>

          {/* Content */}
          <div className="flex-1 p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="mb-2">{complaint.title}</h3>
                <p className="text-gray-600 mb-3 line-clamp-2">{complaint.description}</p>
              </div>
              <Badge className={status.className}>
                {status.label}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <div className="flex items-start gap-2 text-gray-600">
                <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm block">{complaint.location}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <ThumbsUp className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{complaint.votes} votes</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{formattedDate}</span>
              </div>
              {complaint.verificationCount !== undefined && complaint.verificationCount > 0 && (
                <div className="flex items-center gap-2 text-purple-600">
                  <Users className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">{complaint.verificationCount} verifications</span>
                </div>
              )}
            </div>

            {/* Resolution Info */}
            {(complaint.status === 'resolved' || complaint.status === 'verified') && complaint.resolvedDate && (
              <div className={`mb-4 p-3 rounded-lg ${
                complaint.status === 'verified' 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-blue-50 border border-blue-200'
              }`}>
                <div className={`flex items-center gap-2 mb-1 ${
                  complaint.status === 'verified' ? 'text-green-800' : 'text-blue-800'
                }`}>
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">Resolved on {formattedResolvedDate}</span>
                </div>
                {complaint.status === 'resolved'}
                {complaint.status === 'verified' && (
                  <p className="text-xs text-green-700 mt-1">
                    ✓ Verified by {complaint.verificationCount} citizens
                  </p>
                )}
                
                {/* Resolution Images */}
                {complaint.resolutionImages && complaint.resolutionImages.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-600 mb-2">
                      Resolution Photo{complaint.resolutionImages.length > 1 ? 's' : ''}:
                    </p>
                    <div className={`grid gap-2 ${
                      complaint.resolutionImages.length > 1 ? 'grid-cols-2' : 'grid-cols-1'
                    }`}>
                      {complaint.resolutionImages.slice(0, 2).map((imageUrl, index) => (
                        <div 
                          key={index} 
                          className={`rounded border-2 overflow-hidden ${
                            complaint.status === 'verified' 
                              ? 'border-green-300' 
                              : 'border-blue-300'
                          }`}
                        >
                          <ImageWithFallback
                            src={imageUrl}
                            alt={`Resolution photo ${index + 1}`}
                            className="w-full h-24 object-cover"
                          />
                        </div>
                      ))}
                    </div>
                    {complaint.resolutionImages.length > 2 && (
                      <p className="text-xs text-gray-500 mt-1">
                        +{complaint.resolutionImages.length - 2} more photo{complaint.resolutionImages.length - 2 !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
              {complaint.location && (
                <Button
                  onClick={handleSearchLocation}
                  size="sm"
                  variant="outline"
                  className="gap-2"
                >
                  <MapPin className="w-4 h-4" />
                  Search Location
                </Button>
              )}
              {complaint.status === 'pending' && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleResolveClick();
                  }}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark Resolved
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      <ResolveDialog
        open={showResolveDialog}
        onClose={() => setShowResolveDialog(false)}
        onResolve={handleResolveSubmit}
        complaintTitle={complaint.title}
      />
    </>
  );
}

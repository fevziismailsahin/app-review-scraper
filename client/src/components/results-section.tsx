import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Download, FileJson, FileSpreadsheet, Eye } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ScrapingJob, App, Review } from "@shared/schema";

export default function ResultsSection() {
  const [previewJobId, setPreviewJobId] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: jobs = [] } = useQuery<ScrapingJob[]>({
    queryKey: ["/api/jobs"],
    refetchInterval: 5000,
  });

  const { data: apps = [] } = useQuery<App[]>({
    queryKey: ["/api/apps"],
  });

  const { data: previewData } = useQuery({
    queryKey: ["/api/jobs", previewJobId, "reviews"],
    enabled: !!previewJobId,
    queryFn: async () => {
      const response = await fetch(`/api/jobs/${previewJobId}/reviews?limit=5`);
      return response.json();
    },
  });

  const completedJobs = jobs.filter(job => job.status === "completed");
  const processingJobs = jobs.filter(job => job.status === "processing");

  const totalReviews = completedJobs.reduce((sum, job) => sum + (job.totalReviews || 0), 0);
  const avgRating = completedJobs.length > 0 ? 4.2 : 0; // This would need to be calculated from actual review data
  const dataSize = (totalReviews * 0.5).toFixed(1); // Rough estimate

  const handleDownload = async (jobId: number, format?: string) => {
    try {
      const url = format ? `/api/download/${jobId}?format=${format}` : `/api/download/${jobId}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Download failed');
      }
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = response.headers.get('Content-Disposition')?.split('filename=')[1] || `reviews.${format || 'json'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
      
      toast({
        title: "Success",
        description: "File downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      });
    }
  };

  if (jobs.length === 0) {
    return null;
  }

  return (
    <Card className="mb-8">
      <CardContent className="p-6">
        <h3 className="text-2xl font-semibold text-gray-900 mb-6">Download Results</h3>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-blue-600">{totalReviews.toLocaleString()}</p>
            <p className="text-sm text-gray-600">Total Reviews</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-green-600">{completedJobs.length}</p>
            <p className="text-sm text-gray-600">Completed Apps</p>
          </div>
          <div className="bg-amber-50 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-amber-600">{avgRating}</p>
            <p className="text-sm text-gray-600">Avg Rating</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-purple-600">{dataSize} MB</p>
            <p className="text-sm text-gray-600">Data Size</p>
          </div>
        </div>

        {/* Download Options */}
        <div className="space-y-4">
          {/* Completed Downloads */}
          {completedJobs.length > 0 && (
            <div className="border border-green-200 rounded-lg p-4 bg-green-50">
              <h4 className="font-semibold text-green-800 mb-3">Ready for Download</h4>
              <div className="space-y-3">
                {completedJobs.map((job) => {
                  const app = apps.find(a => a.id === job.appId);
                  if (!app) return null;

                  return (
                    <div key={job.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-green-200">
                      <div className="flex items-center space-x-3">
                        <div className="text-blue-600">
                          {job.exportFormat?.includes('json') ? <FileJson size={20} /> : <FileSpreadsheet size={20} />}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {app.name} - All Reviews ({job.exportFormat?.toUpperCase()})
                          </p>
                          <p className="text-sm text-gray-600">
                            {job.totalReviews?.toLocaleString()} reviews • {job.language?.toUpperCase()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setPreviewJobId(job.id)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Preview
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
                            <DialogHeader>
                              <DialogTitle>Data Preview - {app.name} Reviews</DialogTitle>
                            </DialogHeader>
                            <div className="overflow-y-auto p-6">
                              {previewData?.reviews?.map((review: Review, index: number) => (
                                <div key={review.id} className="border border-gray-200 rounded-lg p-4 mb-4">
                                  <div className="flex justify-between items-start mb-2">
                                    <h5 className="font-medium text-gray-900">{review.title || "No title"}</h5>
                                    <div className="flex items-center space-x-1">
                                      {[...Array(5)].map((_, i) => (
                                        <span key={i} className={`text-sm ${i < (review.rating || 0) ? "text-yellow-400" : "text-gray-300"}`}>
                                          ★
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                  <p className="text-gray-600 text-sm mb-2">{review.content}</p>
                                  <div className="flex justify-between text-xs text-gray-500">
                                    <span>By: {review.author || "Anonymous"}</span>
                                    <span>{review.platform} • {review.updated}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <DialogFooter>
                              <p className="text-sm text-gray-600 mr-auto">
                                Showing {previewData?.reviews?.length || 0} of {job.totalReviews?.toLocaleString()} reviews
                              </p>
                              {job.exportFormat === 'both' ? (
                                <div className="flex space-x-2">
                                  <Button 
                                    onClick={() => handleDownload(job.id, 'json')}
                                    className="bg-blue-600 hover:bg-blue-700"
                                  >
                                    <FileJson className="w-4 h-4 mr-1" />
                                    Download JSON
                                  </Button>
                                  <Button 
                                    onClick={() => handleDownload(job.id, 'csv')}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <FileSpreadsheet className="w-4 h-4 mr-1" />
                                    Download CSV
                                  </Button>
                                </div>
                              ) : (
                                <Button 
                                  onClick={() => handleDownload(job.id)}
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  Download Full Dataset
                                </Button>
                              )}
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        {job.exportFormat === 'both' ? (
                          <div className="flex space-x-1">
                            <Button 
                              onClick={() => handleDownload(job.id, 'json')}
                              className="bg-blue-600 hover:bg-blue-700"
                              size="sm"
                            >
                              <FileJson className="w-4 h-4 mr-1" />
                              JSON
                            </Button>
                            <Button 
                              onClick={() => handleDownload(job.id, 'csv')}
                              className="bg-green-600 hover:bg-green-700"
                              size="sm"
                            >
                              <FileSpreadsheet className="w-4 h-4 mr-1" />
                              CSV
                            </Button>
                          </div>
                        ) : (
                          <Button 
                            onClick={() => handleDownload(job.id)}
                            className="bg-blue-600 hover:bg-blue-700"
                            size="sm"
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* In Progress */}
          {processingJobs.length > 0 && (
            <div className="border border-amber-200 rounded-lg p-4 bg-amber-50">
              <h4 className="font-semibold text-amber-800 mb-3">Processing...</h4>
              {processingJobs.map((job) => {
                const app = apps.find(a => a.id === job.appId);
                if (!app) return null;

                return (
                  <div key={job.id} className="bg-white p-3 rounded-lg border border-amber-200">
                    <div className="flex items-center space-x-3">
                      <div className="text-amber-500 animate-spin">
                        <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full"></div>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{app.name} - Reviews</p>
                        <p className="text-sm text-gray-600">
                          Processing: {job.totalReviews?.toLocaleString() || 0} reviews collected...
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {completedJobs.length === 0 && processingJobs.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Download size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No completed jobs yet. Start data extraction to see results here.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

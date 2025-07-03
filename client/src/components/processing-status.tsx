import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, Loader2 } from "lucide-react";
import type { ScrapingJob, App } from "@shared/schema";

export default function ProcessingStatus() {
  const { data: jobs = [], isLoading } = useQuery<ScrapingJob[]>({
    queryKey: ["/api/jobs"],
    refetchInterval: 2000, // Poll every 2 seconds for real-time updates
  });

  const { data: apps = [] } = useQuery<App[]>({
    queryKey: ["/api/apps"],
  });

  if (isLoading) {
    return (
      <Card className="mb-8">
        <CardContent className="p-6">
          <h3 className="text-2xl font-semibold text-gray-900 mb-6">Processing Status</h3>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (jobs.length === 0) {
    return null;
  }

  const completedJobs = jobs.filter(job => job.status === "completed").length;
  const totalJobs = jobs.length;
  const overallProgress = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="text-green-600" size={20} />;
      case "processing":
        return <Loader2 className="text-amber-500 animate-spin" size={20} />;
      case "failed":
        return <CheckCircle className="text-red-500" size={20} />;
      default:
        return <Clock className="text-gray-400" size={20} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600";
      case "processing":
        return "text-amber-600";
      case "failed":
        return "text-red-600";
      default:
        return "text-gray-500";
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-50 border-green-200";
      case "processing":
        return "bg-amber-50 border-amber-200";
      case "failed":
        return "bg-red-50 border-red-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  return (
    <Card className="mb-8">
      <CardContent className="p-6">
        <h3 className="text-2xl font-semibold text-gray-900 mb-6">Processing Status</h3>
        
        {/* Overall Progress */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Progress</span>
            <span className="text-sm text-gray-600">{Math.round(overallProgress)}%</span>
          </div>
          <Progress value={overallProgress} className="h-3" />
          <p className="text-sm text-gray-600 mt-2">
            Processing {completedJobs} of {totalJobs} applications...
          </p>
        </div>

        {/* Individual Job Status */}
        <div className="space-y-4">
          {jobs.map((job) => {
            const app = apps.find(a => a.id === job.appId);
            if (!app) return null;

            return (
              <div key={job.id} className={`border rounded-lg p-4 ${getStatusBg(job.status)}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center">
                      {getStatusIcon(job.status)}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{app.name}</h4>
                      <p className="text-sm text-gray-600">
                        {job.status === "completed" && "Completed successfully"}
                        {job.status === "processing" && "Currently processing..."}
                        {job.status === "failed" && "Failed"}
                        {job.status === "pending" && "Waiting in queue..."}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${getStatusColor(job.status)}`}>
                      {job.status === "completed" && "✓ Complete"}
                      {job.status === "processing" && "⟳ Processing"}
                      {job.status === "failed" && "✗ Failed"}
                      {job.status === "pending" && "⧖ Queued"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {job.totalReviews || 0} reviews
                    </p>
                  </div>
                </div>

                {(job.platform === "both" || job.appStoreReviews || job.playStoreReviews) && (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className={`p-3 rounded-lg ${
                      job.appStoreReviews && job.appStoreReviews > 0 ? "bg-green-50" : "bg-gray-50"
                    }`}>
                      <p className={`font-medium ${
                        job.appStoreReviews && job.appStoreReviews > 0 ? "text-green-800" : "text-gray-700"
                      }`}>
                        App Store
                      </p>
                      <p className={
                        job.appStoreReviews && job.appStoreReviews > 0 ? "text-green-600" : "text-gray-500"
                      }>
                        {job.appStoreReviews || 0} reviews
                        {job.appStoreReviews && job.appStoreReviews > 0 ? " ✓" : ""}
                      </p>
                    </div>
                    <div className={`p-3 rounded-lg ${
                      job.playStoreReviews && job.playStoreReviews > 0 ? "bg-green-50" : "bg-gray-50"
                    }`}>
                      <p className={`font-medium ${
                        job.playStoreReviews && job.playStoreReviews > 0 ? "text-green-800" : "text-gray-700"
                      }`}>
                        Play Store
                      </p>
                      <p className={
                        job.playStoreReviews && job.playStoreReviews > 0 ? "text-green-600" : "text-gray-500"
                      }>
                        {job.playStoreReviews || 0} reviews
                        {job.playStoreReviews && job.playStoreReviews > 0 ? " ✓" : ""}
                      </p>
                    </div>
                  </div>
                )}

                {job.errorMessage && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">Error: {job.errorMessage}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

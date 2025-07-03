import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Smartphone } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { App } from "@shared/schema";
import type { Platform } from "@/pages/home";

interface AppFormProps {
  platform: Platform;
}

export default function AppForm({ platform }: AppFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    appStoreId: "",
    packageName: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: apps = [], isLoading } = useQuery<App[]>({
    queryKey: ["/api/apps"],
  });

  const addAppMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/apps", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/apps"] });
      setFormData({ name: "", appStoreId: "", packageName: "" });
      toast({
        title: "Success",
        description: "App added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add app",
        variant: "destructive",
      });
    },
  });

  const deleteAppMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/apps/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/apps"] });
      toast({
        title: "Success",
        description: "App removed successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove app",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "App name is required",
        variant: "destructive",
      });
      return;
    }
    
    // Validate based on platform selection
    if (platform === "appstore" && !formData.appStoreId.trim()) {
      toast({
        title: "Error",
        description: "App Store ID is required for App Store platform",
        variant: "destructive",
      });
      return;
    }
    
    if (platform === "playstore" && !formData.packageName.trim()) {
      toast({
        title: "Error",
        description: "Package Name is required for Play Store platform",
        variant: "destructive",
      });
      return;
    }
    
    if (platform === "both" && !formData.appStoreId.trim() && !formData.packageName.trim()) {
      toast({
        title: "Error",
        description: "Either App Store ID or Package Name is required",
        variant: "destructive",
      });
      return;
    }
    
    addAppMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <h3 className="text-2xl font-semibold text-gray-900 mb-6">App Information</h3>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
      <h3 className="text-2xl font-semibold text-gray-900 mb-6">App Information</h3>
      
      <div className="space-y-6">
        {/* Add App Form */}
        <Card className="bg-gray-50">
          <CardContent className="p-4">
            <h4 className="font-medium text-gray-900 mb-4">Add Application</h4>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className={`grid gap-4 ${platform === "both" ? "md:grid-cols-2" : "grid-cols-1"}`}>
                {(platform === "appstore" || platform === "both") && (
                  <div>
                    <Label htmlFor="appStoreId" className="text-sm font-medium text-gray-700">
                      App Store ID {platform === "appstore" ? "*" : ""}
                    </Label>
                    <Input
                      id="appStoreId"
                      type="text"
                      placeholder="e.g., 571800810"
                      value={formData.appStoreId}
                      onChange={(e) => setFormData(prev => ({ ...prev, appStoreId: e.target.value }))}
                      className="mt-1"
                      required={platform === "appstore"}
                    />
                    <p className="text-xs text-gray-500 mt-1">Found in App Store URL</p>
                  </div>
                )}
                {(platform === "playstore" || platform === "both") && (
                  <div>
                    <Label htmlFor="packageName" className="text-sm font-medium text-gray-700">
                      Play Store Package Name {platform === "playstore" ? "*" : ""}
                    </Label>
                    <Input
                      id="packageName"
                      type="text"
                      placeholder="e.g., com.calm.android"
                      value={formData.packageName}
                      onChange={(e) => setFormData(prev => ({ ...prev, packageName: e.target.value }))}
                      className="mt-1"
                      required={platform === "playstore"}
                    />
                    <p className="text-xs text-gray-500 mt-1">Found in Play Store URL</p>
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="appName" className="text-sm font-medium text-gray-700">
                  App Name
                </Label>
                <Input
                  id="appName"
                  type="text"
                  placeholder="e.g., Calm - Sleep & Meditation"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-1"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">For easier identification in results</p>
              </div>
              <Button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700"
                disabled={addAppMutation.isPending}
              >
                <Plus className="w-4 h-4 mr-2" />
                {addAppMutation.isPending ? "Adding..." : "Add App"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Added Apps List */}
        {apps.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Added Applications ({apps.length})</h4>
            
            {apps.map((app) => (
              <Card key={app.id} className="border border-gray-200">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Smartphone className="text-blue-600" size={20} />
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900">{app.name}</h5>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        {app.appStoreId && <span>App Store: {app.appStoreId}</span>}
                        {app.packageName && <span>Play Store: {app.packageName}</span>}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteAppMutation.mutate(app.id)}
                    className="text-red-500 hover:text-red-700"
                    disabled={deleteAppMutation.isPending}
                  >
                    <Trash2 size={16} />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {apps.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Smartphone size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No apps added yet. Add your first app above to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}

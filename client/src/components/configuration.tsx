import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Play, CheckCircle } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ConfigurationState } from "@/pages/home";
import type { App } from "@shared/schema";

interface ConfigurationProps {
  configuration: ConfigurationState;
  onChange: (config: ConfigurationState) => void;
  onStartScraping: () => void;
}

export default function Configuration({ configuration, onChange, onStartScraping }: ConfigurationProps) {
  const { toast } = useToast();

  const { data: apps = [] } = useQuery<App[]>({
    queryKey: ["/api/apps"],
  });

  const startScrapingMutation = useMutation({
    mutationFn: async () => {
      const appIds = apps.map(app => app.id);
      const response = await apiRequest("POST", "/api/scrape", {
        appIds,
        platform: configuration.platform,
        maxReviews: configuration.maxReviews,
        language: configuration.language,
        sortMethod: configuration.sortMethod,
        exportFormat: configuration.exportFormat,
      });
      return response.json();
    },
    onSuccess: () => {
      onStartScraping();
      toast({
        title: "Success",
        description: "Data extraction started successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start data extraction",
        variant: "destructive",
      });
    },
  });

  const validateAppsMutation = useMutation({
    mutationFn: async () => {
      const appIds = apps.map(app => app.id);
      const response = await apiRequest("POST", "/api/validate", { appIds });
      return response.json();
    },
    onSuccess: (results) => {
      const invalidApps = results.filter((r: any) => !r.valid);
      if (invalidApps.length === 0) {
        toast({
          title: "Success",
          description: "All app IDs are valid",
        });
      } else {
        toast({
          title: "Validation Issues",
          description: `${invalidApps.length} app(s) have validation issues`,
          variant: "destructive",
        });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to validate app IDs",
        variant: "destructive",
      });
    },
  });

  const handleStartScraping = () => {
    if (apps.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one app before starting",
        variant: "destructive",
      });
      return;
    }
    startScrapingMutation.mutate();
  };

  const handleValidateApps = () => {
    if (apps.length === 0) {
      toast({
        title: "Error",
        description: "Please add apps to validate",
        variant: "destructive",
      });
      return;
    }
    validateAppsMutation.mutate();
  };

  return (
    <>
      {/* Configuration Options */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <h3 className="text-2xl font-semibold text-gray-900 mb-6">Scraping Configuration</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label className="text-sm font-medium text-gray-700">Maximum Reviews per App</Label>
              <Select 
                value={configuration.maxReviews.toString()} 
                onValueChange={(value) => onChange({...configuration, maxReviews: parseInt(value)})}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1000">1,000 reviews</SelectItem>
                  <SelectItem value="5000">5,000 reviews</SelectItem>
                  <SelectItem value="10000">10,000 reviews</SelectItem>
                  <SelectItem value="25000">25,000 reviews</SelectItem>
                  <SelectItem value="50000">50,000 reviews</SelectItem>
                  <SelectItem value="100000">Unlimited</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Export Format</Label>
              <Select 
                value={configuration.exportFormat} 
                onValueChange={(value) => onChange({...configuration, exportFormat: value as any})}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">JSON Format</SelectItem>
                  <SelectItem value="csv">CSV Format</SelectItem>
                  <SelectItem value="both">Both (JSON + CSV)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Language Filter</Label>
              <Select 
                value={configuration.language} 
                onValueChange={(value) => onChange({...configuration, language: value})}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English (en)</SelectItem>
                  <SelectItem value="es">Spanish (es)</SelectItem>
                  <SelectItem value="fr">French (fr)</SelectItem>
                  <SelectItem value="de">German (de)</SelectItem>
                  <SelectItem value="tr">Turkish (tr)</SelectItem>
                  <SelectItem value="all">All Languages</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Sort Method</Label>
              <Select 
                value={configuration.sortMethod} 
                onValueChange={(value) => onChange({...configuration, sortMethod: value as any})}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mostrecent">Most Recent</SelectItem>
                  <SelectItem value="mosthelpful">Most Helpful</SelectItem>
                  <SelectItem value="highest">Highest Rating</SelectItem>
                  <SelectItem value="lowest">Lowest Rating</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={handleStartScraping}
              className="bg-blue-600 hover:bg-blue-700 px-8 py-3 text-lg font-medium"
              disabled={startScrapingMutation.isPending}
            >
              <Play className="w-5 h-5 mr-2" />
              {startScrapingMutation.isPending ? "Starting..." : "Start Data Extraction"}
            </Button>
            <Button 
              variant="outline"
              onClick={handleValidateApps}
              className="px-8 py-3 text-lg font-medium"
              disabled={validateAppsMutation.isPending}
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              {validateAppsMutation.isPending ? "Validating..." : "Validate App IDs"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

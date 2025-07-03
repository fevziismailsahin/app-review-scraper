import Header from "@/components/header";
import Hero from "@/components/hero";
import PlatformSelection from "@/components/platform-selection";
import AppForm from "@/components/app-form";
import Configuration from "@/components/configuration";
import ProcessingStatus from "@/components/processing-status";
import ResultsSection from "@/components/results-section";
import Footer from "@/components/footer";
import { useState } from "react";

export type Platform = "appstore" | "playstore" | "both";
export type ExportFormat = "json" | "csv" | "both";
export type SortMethod = "mostrecent" | "mosthelpful" | "highest" | "lowest";

export interface ConfigurationState {
  platform: Platform;
  maxReviews: number;
  exportFormat: ExportFormat;
  language: string;
  sortMethod: SortMethod;
}

export default function Home() {
  const [configuration, setConfiguration] = useState<ConfigurationState>({
    platform: "both",
    maxReviews: 25000,
    exportFormat: "json",
    language: "en",
    sortMethod: "mostrecent",
  });

  const [isProcessing, setIsProcessing] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Hero />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <PlatformSelection 
          platform={configuration.platform}
          onChange={(platform) => setConfiguration(prev => ({ ...prev, platform }))}
        />
        
        <AppForm platform={configuration.platform} />
        
        <Configuration 
          configuration={configuration}
          onChange={setConfiguration}
          onStartScraping={() => setIsProcessing(true)}
        />
        
        {isProcessing && <ProcessingStatus />}
        
        <ResultsSection />
      </main>
      
      <Footer />
    </div>
  );
}

import { Smartphone } from "lucide-react";
import { SiGoogleplay, SiApple } from "react-icons/si";
import type { Platform } from "@/pages/home";

interface PlatformSelectionProps {
  platform: Platform;
  onChange: (platform: Platform) => void;
}

export default function PlatformSelection({ platform, onChange }: PlatformSelectionProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
      <h3 className="text-2xl font-semibold text-gray-900 mb-6">Select Data Sources</h3>
      <p className="text-gray-600 mb-6">Choose which platforms to extract reviews from. Your selection will determine which app IDs are required and which data sources are scraped.</p>
      <div className="grid md:grid-cols-3 gap-4">
        {/* App Store Option */}
        <label className="relative cursor-pointer">
          <input 
            type="radio" 
            name="platform" 
            value="appstore" 
            className="sr-only peer"
            checked={platform === "appstore"}
            onChange={(e) => onChange(e.target.value as Platform)}
          />
          <div className="border-2 border-gray-200 rounded-xl p-6 text-center hover:border-blue-600 peer-checked:border-blue-600 peer-checked:bg-blue-50 transition-all">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4 peer-checked:bg-blue-600 peer-checked:text-white">
              <SiApple className="text-2xl" size={24} />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">App Store Only</h4>
            <p className="text-sm text-gray-600">Extract reviews from iOS App Store</p>
          </div>
        </label>

        {/* Play Store Option */}
        <label className="relative cursor-pointer">
          <input 
            type="radio" 
            name="platform" 
            value="playstore" 
            className="sr-only peer"
            checked={platform === "playstore"}
            onChange={(e) => onChange(e.target.value as Platform)}
          />
          <div className="border-2 border-gray-200 rounded-xl p-6 text-center hover:border-blue-600 peer-checked:border-blue-600 peer-checked:bg-blue-50 transition-all">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4 peer-checked:bg-blue-600 peer-checked:text-white">
              <SiGoogleplay className="text-2xl" size={24} />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Play Store Only</h4>
            <p className="text-sm text-gray-600">Extract reviews from Google Play Store</p>
          </div>
        </label>

        {/* Both Platforms Option */}
        <label className="relative cursor-pointer">
          <input 
            type="radio" 
            name="platform" 
            value="both" 
            className="sr-only peer"
            checked={platform === "both"}
            onChange={(e) => onChange(e.target.value as Platform)}
          />
          <div className={`border-2 rounded-xl p-6 text-center transition-all ${
            platform === "both" 
              ? "border-blue-600 bg-blue-50" 
              : "border-gray-200 hover:border-blue-600"
          }`}>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4 ${
              platform === "both" 
                ? "bg-blue-600 text-white" 
                : "bg-gray-100"
            }`}>
              <Smartphone className="text-2xl" size={24} />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Both Platforms</h4>
            <p className="text-sm text-gray-600">Extract from both App Store & Play Store</p>
          </div>
        </label>
      </div>
    </div>
  );
}

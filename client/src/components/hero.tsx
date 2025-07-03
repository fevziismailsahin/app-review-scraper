import { Download } from "lucide-react";
import { SiGoogleplay, SiApple } from "react-icons/si";

export default function Hero() {
  return (
    <section className="bg-gradient-to-br from-blue-600 to-blue-700 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-6">Extract App Reviews with Ease</h2>
        <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
          Powerful tool for researchers and developers to scrape and analyze user reviews from App Store and Google Play Store
        </p>
        <div className="flex flex-wrap justify-center gap-4 text-sm md:text-base">
          <div className="flex items-center space-x-2 bg-blue-600 bg-opacity-50 px-4 py-2 rounded-lg">
            <SiApple className="text-lg" size={18} />
            <span>App Store Reviews</span>
          </div>
          <div className="flex items-center space-x-2 bg-blue-600 bg-opacity-50 px-4 py-2 rounded-lg">
            <SiGoogleplay className="text-lg" size={18} />
            <span>Google Play Store</span>
          </div>
          <div className="flex items-center space-x-2 bg-blue-600 bg-opacity-50 px-4 py-2 rounded-lg">
            <Download className="text-lg" size={18} />
            <span>Multiple Formats</span>
          </div>
        </div>
      </div>
    </section>
  );
}

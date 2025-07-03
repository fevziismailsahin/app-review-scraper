import { Smartphone } from "lucide-react";

export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Smartphone className="text-white text-sm" size={16} />
            </div>
            <h1 className="text-xl font-bold text-gray-900">AppReview Scraper</h1>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <a href="https://github.com/docs/app-review-scraper" target="_blank" className="text-gray-600 hover:text-blue-600 transition-colors">Documentation</a>
            <a href="https://api.appreview-scraper.com/docs" target="_blank" className="text-gray-600 hover:text-blue-600 transition-colors">API</a>
            <a href="mailto:support@appreview-scraper.com" className="text-gray-600 hover:text-blue-600 transition-colors">Support</a>
          </nav>
        </div>
      </div>
    </header>
  );
}

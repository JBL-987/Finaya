import { Github, Twitter, Mail, BarChart3 } from "lucide-react";

const Footer_Component = ({}) => {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="w-full max-w-7xl mx-auto p-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-yellow-500 rounded-lg">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                Finaya
              </h3>
            </div>
            <p className="text-gray-600 mb-6 max-w-md text-lg">
              AI-powered location analysis platform that helps businesses make data-driven decisions about their next strategic move.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://github.com"
                className="text-gray-400 hover:text-yellow-600 transition-colors p-2 rounded-lg hover:bg-yellow-50"
              >
                <Github size={24} />
              </a>
              <a
                href="https://twitter.com"
                className="text-gray-400 hover:text-yellow-600 transition-colors p-2 rounded-lg hover:bg-yellow-50"
              >
                <Twitter size={24} />
              </a>
              <a
                href="mailto:contact@finaya.com"
                className="text-gray-400 hover:text-yellow-600 transition-colors p-2 rounded-lg hover:bg-yellow-50"
              >
                <Mail size={24} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-4 text-lg">Product</h4>
            <ul className="space-y-3">
              <li>
                <a href="/features" className="text-gray-600 hover:text-yellow-600 transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="/pricing" className="text-gray-600 hover:text-yellow-600 transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <a href="/documentation" className="text-gray-600 hover:text-yellow-600 transition-colors">
                  Documentation
                </a>
              </li>
              <li>
                <a href="/api" className="text-gray-600 hover:text-yellow-600 transition-colors">
                  API
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-4 text-lg">Company</h4>
            <ul className="space-y-3">
              <li>
                <a href="/about" className="text-gray-600 hover:text-yellow-600 transition-colors">
                  About
                </a>
              </li>
              <li>
                <a href="/contact" className="text-gray-600 hover:text-yellow-600 transition-colors">
                  Contact
                </a>
              </li>
              <li>
                <a href="/careers" className="text-gray-600 hover:text-yellow-600 transition-colors">
                  Careers
                </a>
              </li>
              <li>
                <a href="/privacy" className="text-gray-600 hover:text-yellow-600 transition-colors">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center">
          <span className="text-sm text-gray-500 mb-4 md:mb-0">
            © 2025 <span className="font-semibold text-gray-700">Finaya</span>. All Rights Reserved.
          </span>
          <div className="flex space-x-6 text-sm text-gray-500">
            <a href="/terms" className="hover:text-yellow-600 transition-colors">
              Terms of Service
            </a>
            <a href="/privacy" className="hover:text-yellow-600 transition-colors">
              Privacy Policy
            </a>
            <a href="/cookies" className="hover:text-yellow-600 transition-colors">
              Cookie Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer_Component;
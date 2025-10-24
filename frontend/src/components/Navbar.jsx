import { useState } from "react";
import { Menu, X, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";

const Navbar_Component = ({isAuthenticated, logout}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <nav className="bg-white/90 backdrop-blur-md fixed w-full z-50 top-0 start-0 border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl flex flex-wrap items-center justify-between mx-auto p-4">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <Link to="/" className="flex items-center space-x-2">
            <div className="p-2 bg-yellow-500 rounded-lg">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <span className="self-center text-xl sm:text-2xl font-bold whitespace-nowrap text-gray-900">
              Finaya
            </span>
          </Link>
        </div>

        <button
          onClick={toggleMobileMenu}
          className="md:hidden text-gray-700 hover:text-yellow-600 focus:outline-none transition-colors p-2 rounded-lg hover:bg-gray-100"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
          <a 
            href="#features" 
            className="text-gray-600 hover:text-yellow-600 transition-colors font-medium text-sm lg:text-base py-2"
          >
            Features
          </a>
          <a 
            href="#how-it-works" 
            className="text-gray-600 hover:text-yellow-600 transition-colors font-medium text-sm lg:text-base py-2"
          >
            How It Works
          </a>
          <a 
            href="#countries" 
            className="text-gray-600 hover:text-yellow-600 transition-colors font-medium text-sm lg:text-base py-2"
          >
            Coverage
          </a>
          <a 
            href="#testimonials" 
            className="text-gray-600 hover:text-yellow-600 transition-colors font-medium text-sm lg:text-base py-2"
          >
            Testimonials
          </a>
                  
          {isAuthenticated && (
            <button
              onClick={logout}
              className="rounded-full bg-yellow-600 text-white border border-transparent transition-all duration-300 ease-out transform hover:scale-105 hover:bg-white hover:text-yellow-600 hover:border-yellow-600 flex items-center justify-center gap-2 px-6 py-3 font-medium shadow-lg hover:shadow-xl text-sm"
            >
              Logout
            </button>
          )}
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden w-full mt-4 bg-white rounded-lg p-6 border border-gray-200 shadow-lg">
            <div className="flex flex-col space-y-4">
              <a
                href="#features"
                className="text-gray-700 hover:text-yellow-600 transition-colors py-3 px-4 rounded-lg hover:bg-yellow-50 font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="text-gray-700 hover:text-yellow-600 transition-colors py-3 px-4 rounded-lg hover:bg-yellow-50 font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                How It Works
              </a>
              <a
                href="#countries"
                className="text-gray-700 hover:text-yellow-600 transition-colors py-3 px-4 rounded-lg hover:bg-yellow-50 font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Coverage
              </a>
              <a
                href="#testimonials"
                className="text-gray-700 hover:text-yellow-600 transition-colors py-3 px-4 rounded-lg hover:bg-yellow-50 font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Testimonials
              </a>
              
              <div className="border-t border-gray-200 pt-4 mt-2">
                {isAuthenticated && (
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full rounded-full bg-yellow-600 text-white border border-transparent transition-all duration-300 ease-out transform hover:scale-105 hover:bg-white hover:text-yellow-600 hover:border-yellow-600 flex items-center justify-center gap-2 py-3 font-medium shadow-lg hover:shadow-xl"
                  >
                    Logout
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar_Component;
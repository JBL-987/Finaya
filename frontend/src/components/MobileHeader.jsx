import { Menu } from 'lucide-react';

const MobileHeader = ({ setMobileSidebarOpen }) => {
  return (
    <div className="md:hidden flex items-center justify-between p-3 bg-white border-b border-gray-200 shadow-sm">
      <button
        onClick={() => setMobileSidebarOpen(true)}
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Menu className="w-5 h-5 text-gray-700" />
      </button>
      <div className="text-lg font-bold text-gray-900">
        Finaya
      </div>
      <div className="w-10"></div>
    </div>
  );
};

export default MobileHeader;
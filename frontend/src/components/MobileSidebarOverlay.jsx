const MobileSidebarOverlay = ({ mobileSidebarOpen, setMobileSidebarOpen }) => {
  if (!mobileSidebarOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-white bg-opacity-50 z-40 md:hidden transition-opacity duration-300"
      onClick={() => setMobileSidebarOpen(false)}
    ></div>
  );
};

export default MobileSidebarOverlay;
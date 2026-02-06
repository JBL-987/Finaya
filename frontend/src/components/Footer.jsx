import { Github, Twitter, Mail } from "lucide-react";

const Footer_Component = () => {
  return (
    <footer className="bg-black/95 backdrop-blur-md border-t border-yellow-500/30 shadow-inner">
      <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col items-center text-center space-y-8">
        <div className="flex items-center space-x-3">
          <div className="p-2">
           <img
            src="/Finaya_Logo.svg"
            alt="Finaya Logo"
            className="h-20 w-20 sm:h-24 sm:w-24 object-contain"
            />
          </div>
        </div>

        <p className="text-gray-400 max-w-lg text-base leading-relaxed">
          Finaya is an AI-powered financial and location intelligence platform
          that helps you make smarter, data-driven decisions with confidence.
        </p>

        <div className="flex space-x-5">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-gray-400 hover:text-yellow-400 hover:bg-neutral-900 rounded-lg transition-colors"
          >
            <Github size={22} />
          </a>
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-gray-400 hover:text-yellow-400 hover:bg-neutral-900 rounded-lg transition-colors"
          >
            <Twitter size={22} />
          </a>
          <a
            href="mailto:contact@finaya.com"
            className="p-2 text-gray-400 hover:text-yellow-400 hover:bg-neutral-900 rounded-lg transition-colors"
          >
            <Mail size={22} />
          </a>
        </div>

        <div className="w-full border-t border-neutral-900" />

        <div className="flex flex-col sm:flex-row justify-between items-center w-full text-sm text-gray-400">
          <p>
            © {new Date().getFullYear()}{" "}
            <span className="text-gray-200 font-semibold">Finaya</span>. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-3 sm:mt-0">
            <a href="/terms" className="hover:text-yellow-400 transition-colors">
              Terms
            </a>
            <a href="/privacy" className="hover:text-yellow-400 transition-colors">
              Privacy
            </a>
            <a href="/cookies" className="hover:text-yellow-400 transition-colors">
              Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer_Component;

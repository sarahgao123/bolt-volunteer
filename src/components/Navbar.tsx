import React from 'react';
import { Menu, X, Github, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export function Navbar() {
  const [isOpen, setIsOpen] = React.useState(false);
  const { user, signOut } = useAuthStore();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Github className="h-8 w-8 text-indigo-600" />
            <span className="ml-2 text-xl font-bold text-gray-800">TREX Club</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-600 hover:text-indigo-600">Features</a>
            <a href="#about" className="text-gray-600 hover:text-indigo-600">About</a>
            <a href="#contact" className="text-gray-600 hover:text-indigo-600">Contact</a>
            {user && (
              <div className="flex items-center space-x-4">
                <span className="text-gray-600">{user.email}</span>
                <button
                  onClick={handleSignOut}
                  className="flex items-center text-gray-600 hover:text-indigo-600"
                >
                  <LogOut className="h-5 w-5 mr-1" />
                  Sign Out
                </button>
              </div>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-600">
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <a href="#features" className="block px-3 py-2 text-gray-600 hover:text-indigo-600">Features</a>
            <a href="#about" className="block px-3 py-2 text-gray-600 hover:text-indigo-600">About</a>
            <a href="#contact" className="block px-3 py-2 text-gray-600 hover:text-indigo-600">Contact</a>
            {user && (
              <>
                <div className="px-3 py-2 text-gray-600">{user.email}</div>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center px-3 py-2 text-gray-600 hover:text-indigo-600"
                >
                  <LogOut className="h-5 w-5 mr-1" />
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
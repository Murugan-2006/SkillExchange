import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);
  const [credits, setCredits] = React.useState(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const loadCredits = React.useCallback(async () => {
    try {
      if (isAuthenticated) {
        const res = await import('../services/api').then(m => m.creditsService.getCredits());
        setCredits(res.data.credits);
      }
    } catch (err) {
      console.warn('Failed to load credits:', err);
    }
  }, [isAuthenticated]);

  React.useEffect(() => {
    loadCredits();
  }, [loadCredits, user]);

  // Listen for credits update events (triggered after withdrawal, enrollment, etc.)
  React.useEffect(() => {
    const handleCreditsUpdate = () => {
      loadCredits();
    };
    
    window.addEventListener('creditsUpdated', handleCreditsUpdate);
    return () => window.removeEventListener('creditsUpdated', handleCreditsUpdate);
  }, [loadCredits]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleDocClick = (e) => {
      if (!e.target.closest || !document) return;
      const menu = document.querySelector('.profile-dropdown');
      const btn = document.querySelector('.profile-button');
      if (!menu || !btn) return;
      if (!btn.contains(e.target) && !menu.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('click', handleDocClick);
    return () => document.removeEventListener('click', handleDocClick);
  }, []);

  const avatarContent = () => {
    if (user?.profilePicture) return (
      <img src={user.profilePicture} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
    );
    // Fallback: initials
    const initials = (user?.name || 'U').split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase();
    return (
      <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">{initials}</div>
    );
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-blue-600">
          SkillExchange
        </Link>

        <div className="flex gap-6 items-center">
          {isAuthenticated ? (
            <>
              <Link to="/courses" className="text-gray-600 hover:text-gray-900">
                Courses
              </Link>
              <Link to="/admin/dashboard" className="text-gray-600 hover:text-gray-900">
                Manage Courses
              </Link>
              <Link to="/student/dashboard" className="text-gray-600 hover:text-gray-900">
                My Learning
              </Link>

              {/* Avatar + dropdown */}
              <div className="relative">
                <button
                  onClick={() => setOpen(!open)}
                  className="flex items-center gap-2 focus:outline-none profile-button"
                  aria-haspopup="true"
                  aria-expanded={open}
                >
                  {avatarContent()}
                </button>

                {open && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border rounded-lg shadow-lg z-50 profile-dropdown">
                    <div className="p-4 border-b">
                      <div className="font-semibold">{user?.name}</div>
                      <div className="text-xs text-gray-500">{user?.email}</div>
                    </div>
                    <div className="p-4 border-b">
                      <div className="text-sm text-gray-700">Credits</div>
                      <div className="text-lg font-bold">{credits ? credits.balance : '—'}</div>
                    </div>
                    <div className="p-3">
                      <button
                        onClick={handleLogout}
                        className="w-full bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-600 hover:text-gray-900">
                Login
              </Link>
              <Link
                to="/register"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

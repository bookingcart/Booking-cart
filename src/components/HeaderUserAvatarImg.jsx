import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

const PLACEHOLDER = 'https://ui-avatars.com/api/?name=User&background=random';

function fallbackAvatarUrl(label) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(label)}&background=random`;
}

/** Header profile image: Google picture when logged in, otherwise generic placeholder (hidden until sign-in by auth.js). */
export function HeaderUserAvatarImg({ className = 'w-full h-full object-cover' }) {
  const { user } = useAuth();

  const { src, alt } = useMemo(() => {
    if (!user) {
      return { src: PLACEHOLDER, alt: 'User Profile' };
    }
    const label = String(user.name || user.email || '').trim();
    if (!label) {
      return { src: PLACEHOLDER, alt: 'User Profile' };
    }
    return {
      src: user.picture || fallbackAvatarUrl(user.name || user.email || 'Account'),
      alt: user.name || user.email || 'User Profile',
    };
  }, [user]);

  return <img src={src} alt={alt} className={className} />;
}

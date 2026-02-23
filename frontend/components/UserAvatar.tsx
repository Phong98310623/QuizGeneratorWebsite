import React from 'react';
import { User } from '../types';
import { stringToSafeColor } from '../utils/avatar';

interface UserAvatarProps {
  user: User;
  size?: 'sm' | 'md' | 'lg' | number;
  className?: string;
  showVipFrame?: boolean;
}

/**
 * UserAvatar component displays user avatar or initial letter.
 * If user is VIP, it adds an overlay frame (KhungAvatar.png).
 */
const UserAvatar: React.FC<UserAvatarProps> = ({ user, size = 'md', className = '', showVipFrame = true }) => {
  const isVip = user.role === 'VIP';
  
  // Base classes for different sizes
  let containerSizeClass = 'w-8 h-8';
  let textSizeClass = 'text-xs';
  let customStyle: React.CSSProperties = {};

  if (size === 'sm') {
    containerSizeClass = 'w-6 h-6';
    textSizeClass = 'text-[10px]';
  } else if (size === 'md') {
    containerSizeClass = 'w-8 h-8';
    textSizeClass = 'text-xs';
  } else if (size === 'lg') {
    containerSizeClass = 'w-20 h-20';
    textSizeClass = 'text-2xl';
  } else if (typeof size === 'number') {
    customStyle = { width: size, height: size };
    textSizeClass = ''; // Controlled by inline style
  }

  const initialLetter = (user.fullName || user.email).charAt(0).toUpperCase();
  const avatarBgColor = stringToSafeColor(user.email);

  return (
    <div className={`relative flex-shrink-0 flex items-center justify-center ${className}`} style={customStyle}>
      {/* Base Avatar Circle */}
      <div 
        className={`rounded-full overflow-hidden flex items-center justify-center border border-neutral-200 bg-white ${typeof size === 'number' ? 'w-full h-full' : containerSizeClass}`}
      >
        {user.avatar ? (
          <img 
            src={user.avatar} 
            alt={user.fullName || user.email} 
            className="w-full h-full object-cover" 
          />
        ) : (
          <div
            className={`w-full h-full flex items-center justify-center font-semibold text-white ${textSizeClass}`}
            style={{ 
              backgroundColor: avatarBgColor, 
              fontSize: typeof size === 'number' ? size / 2.2 : undefined 
            }}
          >
            {initialLetter}
          </div>
        )}
      </div>

      {/* VIP Frame Overlay */}
      {isVip && showVipFrame && (
        <img
          src="/KhungAvatar.png"
          alt="VIP Frame"
          className="absolute pointer-events-none max-w-none"
          style={{
            // The frame needs to be slightly larger than the avatar circle.
            // 1.35x seems appropriate for this kind of circular frame.
            width: '135%',
            height: '135%',
            zIndex: 1,
            // Center adjustments if needed (should be centered by absolute & flex-center)
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />
      )}
    </div>
  );
};

export default UserAvatar;

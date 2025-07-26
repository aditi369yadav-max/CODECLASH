// client/app/components/dashboard/ProfileCard.tsx

'use client';

import React from 'react';
import Link from 'next/link'; // <--- Make sure this import is present

interface ProfileCardProps {
  username: string;
  handle: string;
  rank: number;
  avatar: string;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ username, handle, rank, avatar }) => {
  return (
    <div className="card profile-card">
      <img src={avatar} alt={`${username}'s avatar`} className="profile-avatar" width={100} height={100} />
      <h3 className="profile-name">{username}</h3>
      <p className="profile-handle">{handle}</p>
      <p className="profile-rank">Rank <span className="rank-value">{rank.toLocaleString()}</span></p>

      {/* This is the crucial part */}
      <Link href="/profile/edit" className="edit-profile-btn link-as-button">
        Edit Profile
      </Link>
    </div>
  );
};

export default ProfileCard;
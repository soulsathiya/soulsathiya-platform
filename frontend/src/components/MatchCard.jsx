import React, { useState } from 'react';
import { Heart, MapPin, Briefcase, Shield, Sparkles, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import DeepExplorationCTA from './DeepExplorationCTA';

const MatchCard = ({
  match,
  userTier = 'free',
  onViewProfile,
  onSendInterest,
  showDeepCTA = true,
  compact = false
}) => {
  const [showDeepSection, setShowDeepSection] = useState(false);
  
  const {
    user = {},
    profile_preview = {},
    compatibility_score,
    psychometric_score,
    archetype,
    is_boosted,
    distance_km
  } = match;

  const calculateAge = (dob) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const age = calculateAge(profile_preview?.date_of_birth);
  const score = psychometric_score || compatibility_score || 0;

  const getScoreColor = (score) => {
    if (score >= 85) return 'text-green-600 bg-green-100';
    if (score >= 70) return 'text-blue-600 bg-blue-100';
    if (score >= 55) return 'text-amber-600 bg-amber-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getArchetypeColor = (archetype) => {
    const colors = {
      nurturing_anchor: 'bg-pink-100 text-pink-700',
      passionate_catalyst: 'bg-red-100 text-red-700',
      intellectual_companion: 'bg-blue-100 text-blue-700',
      adventurous_spirit: 'bg-orange-100 text-orange-700',
      harmonizer: 'bg-green-100 text-green-700',
      independent_partner: 'bg-purple-100 text-purple-700',
      devoted_traditionalist: 'bg-amber-100 text-amber-700'
    };
    return colors[archetype] || 'bg-gray-100 text-gray-700';
  };

  if (compact) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden">
              {user.picture ? (
                <img src={user.picture} alt={user.full_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-400">
                  {user.full_name?.[0]}
                </div>
              )}
            </div>
            {is_boosted && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                <Zap className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-gray-900 truncate">{user.full_name}</h3>
              {user.is_verified && <Shield className="w-4 h-4 text-blue-500" />}
            </div>
            <p className="text-sm text-gray-500">
              {age && `${age} • `}{profile_preview?.city || 'Location hidden'}
            </p>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getScoreColor(score)}`}>
            {score}%
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
      data-testid={`match-card-${user.user_id}`}
    >
      {/* Boosted Badge */}
      {is_boosted && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-medium py-1 px-3 flex items-center justify-center">
          <Zap className="w-3 h-3 mr-1" /> Boosted Profile
        </div>
      )}

      {/* Photo Section */}
      <div className="relative aspect-[4/3] bg-gray-100">
        {user.picture ? (
          <img
            src={user.picture}
            alt={user.full_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl font-bold text-gray-300">
            {user.full_name?.[0]}
          </div>
        )}
        
        {/* Compatibility Score Overlay */}
        <div className="absolute top-3 right-3">
          <div className={`px-3 py-1.5 rounded-full text-sm font-bold shadow-lg ${getScoreColor(score)}`}>
            <Heart className="w-4 h-4 inline mr-1" />
            {score}%
          </div>
        </div>

        {/* Verified Badge */}
        {user.is_verified && (
          <div className="absolute top-3 left-3">
            <div className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center">
              <Shield className="w-3 h-3 mr-1" /> Verified
            </div>
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-heading text-xl font-bold text-gray-900">
              {user.full_name}{age && `, ${age}`}
            </h3>
            <div className="flex items-center text-sm text-gray-500 mt-1">
              <MapPin className="w-4 h-4 mr-1" />
              {profile_preview?.city || 'Location hidden'}
              {distance_km && <span className="ml-1">• {distance_km} km</span>}
            </div>
          </div>
        </div>

        {profile_preview?.occupation && (
          <div className="flex items-center text-sm text-gray-600">
            <Briefcase className="w-4 h-4 mr-2" />
            {profile_preview.occupation}
          </div>
        )}

        {archetype && (
          <Badge className={`${getArchetypeColor(archetype)} border-0`}>
            <Sparkles className="w-3 h-3 mr-1" />
            {archetype.replace(/_/g, ' ')}
          </Badge>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onViewProfile && onViewProfile(user.user_id)}
            data-testid={`view-profile-${user.user_id}`}
          >
            View Profile
          </Button>
          <Button
            className="flex-1"
            onClick={() => onSendInterest && onSendInterest(user.user_id)}
            data-testid={`send-interest-${user.user_id}`}
          >
            <Heart className="w-4 h-4 mr-1" /> Interest
          </Button>
        </div>

        {/* Deep Exploration CTA */}
        {showDeepCTA && (
          <div className="pt-2 border-t border-gray-100">
            <button
              onClick={() => setShowDeepSection(!showDeepSection)}
              className="w-full text-sm text-primary font-medium hover:underline flex items-center justify-center"
              data-testid={`deep-cta-toggle-${user.user_id}`}
            >
              <Sparkles className="w-4 h-4 mr-1" />
              {showDeepSection ? 'Hide Deep Compatibility' : 'Explore Deeper Compatibility'}
            </button>
            
            {showDeepSection && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <DeepExplorationCTA
                  partnerId={user.user_id}
                  userTier={userTier}
                  compact={true}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchCard;

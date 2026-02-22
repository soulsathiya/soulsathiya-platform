import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Heart, LogOut, User, Users, MessageCircle, Settings, ShieldCheck, Crown, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';
import NotificationBell from '../components/NotificationBell';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const DashboardPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(location.state?.user || null);
  const [isAuthenticated, setIsAuthenticated] = useState(location.state?.user ? true : null);
  const [stats, setStats] = useState({
    matchesCount: 0,
    interestsReceived: 0,
    conversations: 0
  });

  useEffect(() => {
    // Skip auth check if user data passed from AuthCallback
    if (location.state?.user) return;

    const checkAuth = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/auth/me`, {
          withCredentials: true
        });
        setUser(response.data);
        setIsAuthenticated(true);
      } catch (error) {
        setIsAuthenticated(false);
        navigate('/login');
      }
    };

    checkAuth();
  }, [location.state, navigate]);

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      try {
        const [matchesRes, interestsRes, conversationsRes] = await Promise.all([
          axios.get(`${BACKEND_URL}/api/matches`, { withCredentials: true }),
          axios.get(`${BACKEND_URL}/api/interests/received`, { withCredentials: true }),
          axios.get(`${BACKEND_URL}/api/messages/conversations`, { withCredentials: true })
        ]);

        setStats({
          matchesCount: matchesRes.data.count || 0,
          interestsReceived: interestsRes.data.interests?.length || 0,
          conversations: conversationsRes.data.conversations?.length || 0
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };

    fetchStats();
  }, [user]);

  const handleLogout = async () => {
    try {
      await axios.post(`${BACKEND_URL}/api/auth/logout`, {}, { withCredentials: true });
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const quickActions = [
    {
      icon: <Users className="w-6 h-6" />,
      title: "Find Matches",
      description: "Discover compatible profiles",
      link: "/matches",
      count: stats.matchesCount,
      testId: "find-matches-card"
    },
    {
      icon: <Heart className="w-6 h-6" />,
      title: "Interests",
      description: "View and respond to interests",
      link: "/interests",
      count: stats.interestsReceived,
      badge: stats.interestsReceived > 0,
      testId: "interests-card"
    },
    {
      icon: <MessageCircle className="w-6 h-6" />,
      title: "Messages",
      description: "Chat with your matches",
      link: "/messages",
      count: stats.conversations,
      testId: "messages-card"
    },
    {
      icon: <User className="w-6 h-6" />,
      title: "My Profile",
      description: "View and edit your profile",
      link: "/profile",
      testId: "my-profile-card"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FDFBF7] to-white">
      {/* Header */}
      <header className="glass-card border-b sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <Heart className="w-8 h-8 text-primary fill-primary" />
            <span className="text-2xl font-heading font-bold text-foreground">SoulSathiya</span>
          </Link>
          <div className="flex items-center space-x-4">
            {user.subscription_status !== 'free' && (
              <Badge variant="secondary" className="hidden sm:flex">
                <Crown className="w-3 h-3 mr-1" />
                {user.subscription_tier}
              </Badge>
            )}
            <Link to="/profile">
              <Avatar className="cursor-pointer" data-testid="user-avatar">
                <AvatarImage src={user.picture} />
                <AvatarFallback>{user.full_name?.[0]}</AvatarFallback>
              </Avatar>
            </Link>
            <Button variant="ghost" size="icon" onClick={handleLogout} data-testid="logout-btn">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12 max-w-6xl">
        {/* Welcome Section */}
        <div className="mb-12 animate-fade-in">
          <h1 className="font-heading text-4xl mb-2">
            Welcome back, {user.full_name?.split(' ')[0]}!
          </h1>
          <p className="text-lg text-muted-foreground">
            {user.is_profile_complete
              ? "Continue your journey to find your perfect match"
              : "Complete your profile to start matching"}
          </p>
        </div>

        {/* Profile Completion Banner */}
        {!user.is_profile_complete && (
          <div
            className="card-surface p-6 mb-8 border-l-4 border-l-primary"
            data-testid="complete-profile-banner"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-heading text-xl mb-2">Complete Your Profile</h3>
                <p className="text-muted-foreground mb-4">
                  Add your details and photos to start receiving matches
                </p>
                <Link to="/onboarding/profile">
                  <Button data-testid="complete-profile-btn">Complete Now</Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Verification Banner */}
        {user.is_profile_complete && !user.is_verified && (
          <div
            className="card-surface p-6 mb-8 bg-gradient-to-r from-primary/5 to-secondary/5"
            data-testid="verification-banner"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <ShieldCheck className="w-6 h-6 text-primary" />
                  <h3 className="font-heading text-xl">Get Verified</h3>
                </div>
                <p className="text-muted-foreground mb-4">
                  Verify your profile to build trust and increase your chances of finding a match
                </p>
                <Link to="/verification">
                  <Button variant="outline" data-testid="get-verified-btn">
                    Start Verification
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Boost Banner */}
        {user.is_profile_complete && (
          <div
            className="card-surface p-6 mb-8 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-l-4 border-l-amber-500"
            data-testid="boost-banner"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <svg className="w-6 h-6 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
                  </svg>
                  <h3 className="font-heading text-xl">Boost Your Profile</h3>
                </div>
                <p className="text-muted-foreground mb-2">
                  Get 3x more profile views! Appear at the top of matches for 24 hours.
                </p>
                <p className="text-sm font-medium text-amber-600">
                  Starting from just ₹299
                </p>
              </div>
              <Link to="/boost">
                <Button className="bg-amber-500 hover:bg-amber-600" data-testid="boost-profile-btn">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
                  </svg>
                  Boost Now
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Quick Actions Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {quickActions.map((action, index) => (
            <Link to={action.link} key={index}>
              <div
                className="card-surface p-6 space-y-4 hover:shadow-lg transition-all duration-200 cursor-pointer group"
                data-testid={action.testId}
              >
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    {action.icon}
                  </div>
                  {action.badge && action.count > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {action.count}
                    </Badge>
                  )}
                </div>
                <div>
                  <h3 className="font-heading text-lg mb-1">{action.title}</h3>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                  {action.count !== undefined && !action.badge && (
                    <p className="text-2xl font-bold text-primary mt-2">{action.count}</p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Subscription CTA */}
        {user.subscription_status === 'free' && (
          <div className="card-surface p-8 bg-gradient-to-r from-primary to-secondary text-white">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1 text-center md:text-left">
                <h3 className="font-heading text-2xl mb-2">Upgrade to Premium</h3>
                <p className="text-white/90">
                  Unlock unlimited matches, advanced filters, and priority support
                </p>
              </div>
              <Link to="/subscription">
                <Button variant="secondary" size="lg" data-testid="upgrade-premium-btn">
                  <Crown className="w-5 h-5 mr-2" />
                  Upgrade Now
                </Button>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DashboardPage;

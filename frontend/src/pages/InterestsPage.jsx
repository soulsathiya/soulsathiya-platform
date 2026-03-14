import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Check, X, MessageCircle, Loader2, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import axios from 'axios';
import NotificationBell from '../components/NotificationBell';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const InterestCard = ({ interest, onRespond }) => {
  const { from_user, status, sent_at, interest_id } = interest;
  const [responding, setResponding] = useState(false);

  const handleRespond = async (action) => {
    setResponding(true);
    await onRespond(interest_id, action);
    setResponding(false);
  };

  const statusColors = {
    pending: 'bg-amber-500/10 border-amber-700/50',
    accepted: 'bg-green-900/20 border-green-700/50',
    rejected: 'bg-muted/50 border-border',
  };

  return (
    <div className={`rounded-xl border p-5 space-y-4 transition-all ${statusColors[status] || 'card-surface border-border'}`} data-testid={`interest-card-${interest_id}`}>
      <div className="flex items-start justify-between gap-4">
        <Link to={`/profile/${from_user?.user_id}`} className="flex items-center space-x-3 flex-1 min-w-0">
          <Avatar className="w-12 h-12 flex-shrink-0">
            <AvatarImage src={from_user?.picture} />
            <AvatarFallback className="bg-primary/20 text-primary">{from_user?.full_name?.[0]}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-heading text-base font-semibold truncate">{from_user?.full_name}</p>
            <p className="text-xs text-muted-foreground">Sent on {formatDate(sent_at)}</p>
          </div>
        </Link>
        <Badge variant={status === 'accepted' ? 'default' : status === 'rejected' ? 'secondary' : 'outline'} className="flex-shrink-0 capitalize">
          {status}
        </Badge>
      </div>

      {status === 'pending' && (
        <div className="flex gap-3">
          <Button
            size="sm"
            className="flex-1 bg-green-600 hover:bg-green-700"
            onClick={() => handleRespond('accept')}
            disabled={responding}
            data-testid={`accept-interest-${interest_id}`}
          >
            {responding ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 mr-1" /> Accept</>}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 border-red-800 text-red-400 hover:bg-red-900/20"
            onClick={() => handleRespond('reject')}
            disabled={responding}
            data-testid={`reject-interest-${interest_id}`}
          >
            <X className="w-4 h-4 mr-1" /> Decline
          </Button>
        </div>
      )}

      {status === 'accepted' && (
        <Link to={`/messages/${from_user?.user_id}`}>
          <Button size="sm" className="w-full" variant="outline">
            <MessageCircle className="w-4 h-4 mr-2" /> Start Chatting
          </Button>
        </Link>
      )}
    </div>
  );
};

const InterestsPage = () => {
  const navigate = useNavigate();
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchInterests = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/api/interests/received`, { withCredentials: true });
        setInterests(res.data.interests || []);
      } catch (error) {
        if (error.response?.status === 401) navigate('/login');
        else toast.error('Failed to load interests');
      } finally {
        setLoading(false);
      }
    };
    fetchInterests();
  }, [navigate]);

  const handleRespond = async (interestId, action) => {
    try {
      await axios.post(`${BACKEND_URL}/api/interests/${interestId}/respond`, { action }, { withCredentials: true });
      setInterests(prev => prev.map(i => i.interest_id === interestId ? { ...i, status: action === 'accept' ? 'accepted' : 'rejected' } : i));
      toast.success(action === 'accept' ? 'Interest accepted! You can now chat.' : 'Interest declined.');
    } catch (error) {
      toast.error('Failed to respond');
    }
  };

  const filtered = interests.filter(i => filter === 'all' || i.status === filter);
  const pendingCount = interests.filter(i => i.status === 'pending').length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-card">
      <header className="glass-card border-b sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center space-x-2">
            <img src="/logo.png" alt="SoulSathiya" className="w-8 h-8 object-contain" draggable={false} />
            <span className="text-2xl font-heading font-bold">Soul<span className="text-primary">Sathiya</span></span>
          </Link>
          <div className="flex items-center space-x-3">
            <NotificationBell />
            <Link to="/dashboard"><Button variant="ghost" size="sm">Dashboard</Button></Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10 max-w-3xl">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-1">
            <h1 className="font-heading text-4xl">Interests Received</h1>
            {pendingCount > 0 && (
              <Badge className="bg-primary text-white">{pendingCount} new</Badge>
            )}
          </div>
          <p className="text-muted-foreground">People who want to connect with you</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-2 mb-6">
          {['all', 'pending', 'accepted', 'rejected'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-all ${filter === f ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground border border-border hover:border-primary/40'}`}
            >
              {f}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-24 space-y-3">
            <Inbox className="w-16 h-16 text-primary/30 mx-auto" />
            <h2 className="font-heading text-2xl text-muted-foreground">
              {filter === 'all' ? 'No interests yet' : `No ${filter} interests`}
            </h2>
            <p className="text-muted-foreground text-sm">
              {filter === 'all' ? 'Complete your profile and boost visibility to attract interests.' : ''}
            </p>
            {filter === 'all' && (
              <Link to="/boost"><Button variant="outline">Boost Your Profile</Button></Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((interest) => (
              <InterestCard key={interest.interest_id} interest={interest} onRespond={handleRespond} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default InterestsPage;

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Heart, MessageCircle, Loader2, Search } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import axios from 'axios';
import NotificationBell from '../components/NotificationBell';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString('en-IN', { weekday: 'short' });
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const MessagesPage = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/api/messages/conversations`, { withCredentials: true });
        setConversations(res.data.conversations || []);
      } catch (error) {
        if (error.response?.status === 401) navigate('/login');
        else toast.error('Failed to load messages');
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
  }, [navigate]);

  const filtered = conversations.filter(c =>
    c.other_user?.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FDFBF7] to-white">
      <header className="glass-card border-b sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center space-x-2">
            <Heart className="w-8 h-8 text-primary fill-primary" />
            <span className="text-2xl font-heading font-bold">SoulSathiya</span>
          </Link>
          <div className="flex items-center space-x-3">
            <NotificationBell />
            <Link to="/dashboard"><Button variant="ghost" size="sm">Dashboard</Button></Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10 max-w-2xl">
        <div className="mb-6">
          <h1 className="font-heading text-4xl mb-1">Messages</h1>
          <p className="text-muted-foreground">{conversations.length} conversation{conversations.length !== 1 ? 's' : ''}</p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-24 space-y-3">
            <MessageCircle className="w-16 h-16 text-primary/30 mx-auto" />
            <h2 className="font-heading text-2xl text-muted-foreground">
              {search ? 'No results found' : 'No conversations yet'}
            </h2>
            <p className="text-muted-foreground text-sm">Accept an interest to start chatting</p>
            <Link to="/interests"><Button variant="outline">View Interests</Button></Link>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((conv, idx) => (
              <Link
                key={idx}
                to={`/messages/${conv.other_user?.user_id}`}
                className="block"
                data-testid={`conversation-${conv.other_user?.user_id}`}
              >
                <div className="flex items-center space-x-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer">
                  <Avatar className="w-12 h-12 flex-shrink-0">
                    <AvatarImage src={conv.other_user?.picture} />
                    <AvatarFallback className="bg-primary/20 text-primary">{conv.other_user?.full_name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900 truncate">{conv.other_user?.full_name}</p>
                      <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">{formatTime(conv.last_message_at)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate mt-0.5">{conv.last_message || 'Start a conversation'}</p>
                  </div>
                  {conv.unread_count > 0 && (
                    <Badge className="bg-primary text-white text-xs flex-shrink-0">{conv.unread_count}</Badge>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MessagesPage;

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Heart, Send, ArrowLeft, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const formatMsgTime = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

const ChatPage = () => {
  const { otherUserId } = useParams();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const init = async () => {
      try {
        const [meRes, profileRes, convRes] = await Promise.all([
          axios.get(`${BACKEND_URL}/api/auth/me`, { withCredentials: true }),
          axios.get(`${BACKEND_URL}/api/profile/${otherUserId}`, { withCredentials: true }),
          axios.get(`${BACKEND_URL}/api/messages/conversation/${otherUserId}`, { withCredentials: true }),
        ]);
        setCurrentUser(meRes.data);
        setOtherUser(profileRes.data.user);
        setMessages(convRes.data.messages || []);
      } catch (error) {
        if (error.response?.status === 401) navigate('/login');
        else if (error.response?.status === 403) {
          toast.error('You need mutual interest to message this person.');
          navigate('/interests');
        } else {
          toast.error('Failed to load conversation');
        }
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [otherUserId, navigate]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Poll for new messages every 5 seconds
  useEffect(() => {
    if (!currentUser) return;
    pollRef.current = setInterval(async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/api/messages/conversation/${otherUserId}`, { withCredentials: true });
        setMessages(res.data.messages || []);
      } catch {}
    }, 5000);
    return () => clearInterval(pollRef.current);
  }, [currentUser, otherUserId]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setSending(true);
    const msgText = newMessage.trim();
    setNewMessage('');
    try {
      await axios.post(`${BACKEND_URL}/api/messages/send`, { to_user_id: otherUserId, content: msgText }, { withCredentials: true });
      const res = await axios.get(`${BACKEND_URL}/api/messages/conversation/${otherUserId}`, { withCredentials: true });
      setMessages(res.data.messages || []);
    } catch (error) {
      setNewMessage(msgText);
      const detail = error?.response?.data?.detail;
      const message = (Array.isArray(detail) ? detail[0]?.msg : detail) || error?.message || 'Failed to send message';
      toast.error(message);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF7]">
      {/* Chat Header */}
      <header className="glass-card border-b z-50 flex-shrink-0">
        <div className="container mx-auto px-4 py-3 flex items-center space-x-4 max-w-2xl">
          <Link to="/messages">
            <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <Avatar className="w-10 h-10">
            <AvatarImage src={otherUser?.picture} />
            <AvatarFallback className="bg-primary/20 text-primary">{otherUser?.full_name?.[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <p className="font-heading font-semibold">{otherUser?.full_name}</p>
              {otherUser?.is_verified && <ShieldCheck className="w-4 h-4 text-green-500" />}
            </div>
            <Link to={`/profile/${otherUserId}`} className="text-xs text-primary hover:underline">View profile</Link>
          </div>
          <Link to="/" className="flex items-center space-x-1">
            <Heart className="w-5 h-5 text-primary fill-primary" />
          </Link>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto container mx-auto px-4 py-6 max-w-2xl space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-12">
            <p>Start the conversation! Say hello.</p>
          </div>
        )}
        {messages.map((msg, idx) => {
          const isOwn = msg.from_user_id === currentUser?.user_id;
          return (
            <div key={msg.message_id || idx} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm ${isOwn ? 'bg-primary text-white rounded-br-sm' : 'bg-white border border-gray-100 text-gray-900 rounded-bl-sm shadow-sm'}`}>
                <p>{msg.content}</p>
                <p className={`text-xs mt-1 ${isOwn ? 'text-white/70 text-right' : 'text-muted-foreground'}`}>{formatMsgTime(msg.sent_at)}</p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t bg-white flex-shrink-0">
        <form onSubmit={handleSend} className="container mx-auto px-4 py-4 max-w-2xl flex items-center space-x-3">
          <input
            type="text"
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-[#FDFBF7]"
            data-testid="message-input"
          />
          <Button type="submit" size="icon" disabled={sending || !newMessage.trim()} data-testid="send-message-btn">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatPage;

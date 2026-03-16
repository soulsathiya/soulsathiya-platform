import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Heart, TrendingUp, MessageCircle, Users, Home, Shield, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';
import { getDimensionInsight } from '../utils/compatibilityInsights';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const DeepReportView = () => {
  const { pairId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);

  useEffect(() => {
    fetchReport();
  }, [pairId]);

  const fetchReport = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/deep/report/${pairId}`, {
        withCredentials: true
      });
      setReport(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        navigate('/login');
      } else {
        toast.error('Failed to load report');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Report not available</p>
          <Link to="/dashboard">
            <Button className="mt-4">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const sections = [
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: "Compatibility Overview",
      content: (
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-primary to-secondary mb-6">
            <span className="text-4xl font-bold text-white">{report.deep_score}%</span>
          </div>
          <h3 className="font-heading text-2xl mb-4">Deep Compatibility Score</h3>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {report.long_term_outlook}
          </p>
        </div>
      )
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Core Alignment Strengths",
      content: (
        <div className="space-y-4">
          {report.strengths.map((strength, index) => (
            <div key={index} className="flex items-start space-x-3 p-4 bg-primary/8 rounded-xl border border-primary/20">
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="flex-1 text-foreground text-sm leading-relaxed">{strength}</p>
            </div>
          ))}
        </div>
      )
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Expectation Alignment Map",
      content: (
        <div className="grid md:grid-cols-2 gap-4">
          {Object.entries(report.dimension_scores).slice(0, 3).map(([dimension, score]) => (
            <div key={dimension} className="p-4 card-surface rounded-xl border border-primary/10 space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium capitalize text-foreground flex-1 min-w-0 truncate">{dimension.replace(/_/g, ' ')}</span>
                <Badge variant={score >= 80 ? "default" : score >= 60 ? "secondary" : "outline"} className="flex-shrink-0">
                  {score}%
                </Badge>
              </div>
              <Progress value={score} className="h-2" />
              <p className="text-xs text-muted-foreground italic leading-snug">
                {getDimensionInsight(dimension, score)}
              </p>
            </div>
          ))}
        </div>
      )
    },
    {
      icon: <MessageCircle className="w-6 h-6" />,
      title: "Communication Dynamics",
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            Understanding how you both handle disagreements and express needs is key to relationship success.
          </p>
          <div className="p-4 card-surface rounded-xl border border-primary/20">
            <h4 className="font-medium mb-2 text-foreground">Your Communication Pattern</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Based on your responses, you both value open dialogue and tend to address issues directly.
              This creates a foundation for healthy conflict resolution.
            </p>
          </div>
        </div>
      )
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Attachment & Trust Pattern",
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Your attachment styles and trust needs shape how you connect and provide security for each other.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 card-surface rounded-xl border border-primary/15">
              <h4 className="font-medium mb-2 text-foreground">Trust Foundation</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Both of you show secure attachment patterns with healthy boundaries.
              </p>
            </div>
            <div className="p-4 card-surface rounded-xl border border-primary/15">
              <h4 className="font-medium mb-2 text-foreground">Emotional Security</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                You provide emotional safety and consistent reassurance to each other.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      icon: <Home className="w-6 h-6" />,
      title: "Lifestyle Integration",
      content: (
        <div className="space-y-4">
          {Object.entries(report.dimension_scores).slice(3, 6).map(([dimension, score]) => (
            <div key={dimension} className="p-4 card-surface rounded-xl border border-primary/10 space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium capitalize text-foreground flex-1 min-w-0 truncate">{dimension.replace(/_/g, ' ')}</span>
                <span className="text-xl font-bold text-primary flex-shrink-0">{score}%</span>
              </div>
              <Progress value={score} className="h-2" />
              <p className="text-xs text-muted-foreground italic leading-snug">
                {getDimensionInsight(dimension, score)}
              </p>
            </div>
          ))}
        </div>
      )
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Growth Opportunities",
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Every relationship has areas for continued growth and deeper understanding.
          </p>
          {report.growth_areas.map((area, index) => (
            <div key={index} className="p-4 card-surface rounded-xl border border-primary/15">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/30 text-primary flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">
                  {index + 1}
                </div>
                <p className="flex-1 text-foreground text-sm leading-relaxed">{area}</p>
              </div>
            </div>
          ))}
        </div>
      )
    },
    {
      icon: <MessageCircle className="w-6 h-6" />,
      title: "Conversation Starters",
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Use these prompts to deepen your connection and address important topics together.
          </p>
          {report.conversation_prompts.map((prompt, index) => (
            <div key={index} className="p-4 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg border border-primary/20">
              <div className="flex items-start space-x-3">
                <MessageCircle className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                <p className="flex-1 font-medium">{prompt}</p>
              </div>
            </div>
          ))}
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass-card border-b border-primary/10 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center space-x-2.5">
            <img src="/logo.png" alt="SoulSathiya" className="w-8 h-8 object-contain" draggable={false} />
            <span className="text-2xl font-heading font-bold text-foreground">Soul<span className="text-primary">Sathiya</span></span>
          </Link>
          <Link to="/dashboard">
            <Button variant="ghost">Back to Dashboard</Button>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-6 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-gradient-to-r from-primary to-secondary text-white">
            Deep Compatibility Report
          </Badge>
          <h1 className="font-heading text-4xl mb-4">Your Relationship Insights</h1>
          <p className="text-lg text-muted-foreground">
            A comprehensive analysis of your compatibility across key relationship dimensions
          </p>
        </div>

        <div className="space-y-8">
          {sections.map((section, index) => (
            <div key={index} className="card-surface p-8 animate-fade-in">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                  {section.icon}
                </div>
                <h2 className="font-heading text-2xl">{section.title}</h2>
              </div>
              {section.content}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center card-surface p-8 bg-gradient-to-r from-primary/10 to-secondary/10">
          <h3 className="font-heading text-2xl mb-4">Continue Your Journey Together</h3>
          <p className="text-muted-foreground mb-6">
            Use these insights to strengthen your relationship and build a lasting partnership.
          </p>
          <Link to="/dashboard">
            <Button size="lg">
              Back to Matches
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default DeepReportView;

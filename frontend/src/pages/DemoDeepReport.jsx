import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, TrendingUp, MessageCircle, Users, Home, Shield, Sparkles, ArrowRight, Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';
import { getDimensionInsight } from '../utils/compatibilityInsights';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const DemoDeepReport = () => {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);

  useEffect(() => {
    fetchDemoReport();
  }, []);

  const fetchDemoReport = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/deep/demo-report`);
      setReport(response.data);
    } catch (error) {
      toast.error('Failed to load demo report');
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
          <p className="text-lg text-muted-foreground">Demo report not available</p>
          <Link to="/">
            <Button className="mt-4">Back to Home</Button>
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
      title: "Dimension Scores",
      content: (
        <div className="grid md:grid-cols-2 gap-4">
          {Object.entries(report.dimension_scores).map(([dimension, score]) => (
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
          <Link to="/" className="flex items-center space-x-2.5">
            <img src="/logo.png" alt="SoulSathiya" className="w-8 h-8 object-contain" draggable={false} />
            <span className="text-2xl font-heading font-bold text-foreground">Soul<span className="text-primary">Sathiya</span></span>
          </Link>
          <Link to="/register">
            <Button data-testid="demo-get-started-btn">Get Started</Button>
          </Link>
        </div>
      </header>

      {/* Demo Banner */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 px-6">
        <div className="container mx-auto max-w-4xl flex items-center justify-center space-x-2">
          <Lock className="w-4 h-4" />
          <span className="font-medium">Sample Report</span>
          <span className="text-white/90">— See what your personalized Deep Compatibility Report looks like</span>
        </div>
      </div>

      {/* Content */}
      <main className="container mx-auto px-6 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-gradient-to-r from-primary to-secondary text-white">
            Sample Deep Compatibility Report
          </Badge>
          <h1 className="font-heading text-4xl mb-4">Your Relationship Insights</h1>
          <p className="text-lg text-muted-foreground">
            A comprehensive analysis of couple compatibility across key relationship dimensions
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
          <h3 className="font-heading text-2xl mb-4">Get Your Own Deep Compatibility Report</h3>
          <p className="text-muted-foreground mb-6">
            Start your journey today and discover your true compatibility with your matches.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" data-testid="demo-cta-register-btn">
                Create Free Account
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/">
              <Button size="lg" variant="outline" data-testid="demo-learn-more-btn">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DemoDeepReport;

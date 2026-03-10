import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Heart, Check, Loader2, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const PsychometricOnboarding = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [responses, setResponses] = useState({});
  const [currentSection, setCurrentSection] = useState(0);

  const sections = [
    { name: 'Emotional Style', domain: 'emotional_style', start: 0, end: 6 },
    { name: 'Personality', domain: 'personality', start: 6, end: 12 },
    { name: 'Values', domain: 'values', start: 12, end: 18 },
    { name: 'Trust & Attachment', domain: 'trust_attachment', start: 18, end: 23 },
    { name: 'Lifestyle', domain: 'lifestyle', start: 23, end: 29 },
    { name: 'Growth Mindset', domain: 'growth_mindset', start: 29, end: 32 },
    { name: 'Marriage Expectations', domain: 'marriage_expectations', start: 32, end: 36 }
  ];

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/psychometric/questions`, {
        withCredentials: true
      });
      setQuestions(response.data.questions || []);
    } catch (error) {
      console.error('Failed to fetch questions:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      } else {
        toast.error('Failed to load questionnaire');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = (questionId, value) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: parseInt(value)
    }));
  };

  const currentSectionQuestions = questions.slice(
    sections[currentSection].start,
    sections[currentSection].end
  );

  const isSectionComplete = () => {
    return currentSectionQuestions.every(q => responses[q.question_id] !== undefined);
  };

  const handleNext = () => {
    if (!isSectionComplete()) {
      toast.error('Please answer all questions in this section');
      return;
    }

    if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
      window.scrollTo(0, 0);
    }
  };

  const handlePrevious = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = async () => {
    if (!isSectionComplete()) {
      toast.error('Please answer all questions');
      return;
    }

    setSubmitting(true);

    try {
      const formattedResponses = Object.entries(responses).map(([question_id, response]) => ({
        question_id,
        response
      }));

      await axios.post(
        `${BACKEND_URL}/api/psychometric/submit`,
        { responses: formattedResponses },
        { withCredentials: true }
      );

      toast.success('Psychometric profile completed!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit profile');
    } finally {
      setSubmitting(false);
    }
  };

  const progress = ((Object.keys(responses).length / 36) * 100).toFixed(0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FDFBF7] to-white px-4 py-12">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Heart className="w-10 h-10 text-primary fill-primary" />
            <span className="text-3xl font-heading font-bold">SoulSathiya</span>
          </div>
          <h1 className="font-heading text-3xl mb-2">Compatibility Assessment</h1>
          <p className="text-muted-foreground mb-4">
            Help us understand you better to find your perfect match
          </p>
          <div className="max-w-md mx-auto">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground mt-2">
              {Object.keys(responses).length} of 36 questions answered ({progress}%)
            </p>
          </div>
        </div>

        <div className="card-surface p-8 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-heading text-2xl">
              {sections[currentSection].name}
            </h2>
            <span className="text-sm text-muted-foreground">
              Section {currentSection + 1} of {sections.length}
            </span>
          </div>

          <div className="space-y-8">
            {currentSectionQuestions.map((question, index) => (
              <div key={question.question_id} className="space-y-3">
                <Label className="text-base font-medium">
                  {index + 1}. {question.question_text}
                </Label>
                <RadioGroup
                  value={responses[question.question_id]?.toString()}
                  onValueChange={(value) => handleResponse(question.question_id, value)}
                >
                  <div className="grid grid-cols-5 gap-2">
                    {question.options.map((option, optIndex) => (
                      <div key={optIndex} className="flex flex-col items-center space-y-2">
                        <RadioGroupItem value={(optIndex + 1).toString()} id={`${question.question_id}-${optIndex}`} />
                        <label
                          htmlFor={`${question.question_id}-${optIndex}`}
                          className="text-xs text-center cursor-pointer"
                        >
                          {option}
                        </label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentSection === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          {currentSection < sections.length - 1 ? (
            <Button onClick={handleNext} disabled={!isSectionComplete()}>
              Next Section
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!isSectionComplete() || submitting}>
              {submitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting...</>
              ) : (
                <>Complete Assessment<Check className="w-4 h-4 ml-2" /></>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PsychometricOnboarding;

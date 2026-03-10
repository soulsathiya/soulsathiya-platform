import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Heart, Check, Loader2, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const DeepQuestionnaireFlow = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pairId = searchParams.get('pair_id');
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [responses, setResponses] = useState({});
  const [currentModule, setCurrentModule] = useState(0);

  const modules = [
    { name: 'Expectations & Roles', key: 'expectations_roles', description: 'Understanding relationship roles and expectations' },
    { name: 'Conflict & Repair', key: 'conflict_repair', description: 'How you handle disagreements and make amends' },
    { name: 'Attachment & Trust', key: 'attachment_trust', description: 'Security needs and trust dynamics' },
    { name: 'Lifestyle Integration', key: 'lifestyle_integration', description: 'Daily life compatibility and habits' },
    { name: 'Intimacy & Communication', key: 'intimacy_communication', description: 'Emotional and physical connection' },
    { name: 'Family & In-Law Dynamics', key: 'family_inlaw_dynamics', description: 'Family involvement and boundaries' }
  ];

  useEffect(() => {
    if (!pairId) {
      toast.error('Invalid access. Please unlock deep exploration first.');
      navigate('/dashboard');
      return;
    }
    fetchQuestions();
  }, [pairId]);

  const fetchQuestions = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/deep/questions`, {
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

  const currentModuleQuestions = questions.filter(
    q => q.module === modules[currentModule].key
  );

  const isModuleComplete = () => {
    return currentModuleQuestions.every(q => responses[q.question_id] !== undefined);
  };

  const handleNext = () => {
    if (!isModuleComplete()) {
      toast.error('Please answer all questions in this module');
      return;
    }

    if (currentModule < modules.length - 1) {
      setCurrentModule(currentModule + 1);
      window.scrollTo(0, 0);
    }
  };

  const handlePrevious = () => {
    if (currentModule > 0) {
      setCurrentModule(currentModule - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = async () => {
    if (!isModuleComplete()) {
      toast.error('Please answer all questions');
      return;
    }

    if (Object.keys(responses).length !== 108) {
      toast.error('Please complete all modules before submitting');
      return;
    }

    setSubmitting(true);

    try {
      const formattedResponses = Object.entries(responses).map(([question_id, response]) => ({
        question_id,
        response
      }));

      const result = await axios.post(
        `${BACKEND_URL}/api/deep/submit`,
        formattedResponses,
        { 
          params: { pair_id: pairId },
          withCredentials: true 
        }
      );

      if (result.data.report_generated) {
        toast.success('Deep Compatibility Report generated! View your insights now.');
        navigate(`/deep/report/${pairId}`);
      } else {
        toast.success('Assessment complete! Waiting for your partner to complete.');
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit assessment');
    } finally {
      setSubmitting(false);
    }
  };

  const progress = ((Object.keys(responses).length / 108) * 100).toFixed(0);

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
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Heart className="w-10 h-10 text-primary fill-primary" />
            <span className="text-3xl font-heading font-bold">SoulSathiya</span>
          </div>
          <Badge className="mb-4 bg-gradient-to-r from-primary to-secondary text-white">
            <Sparkles className="w-3 h-3 mr-1" />
            Deep Couple Compatibility
          </Badge>
          <h1 className="font-heading text-3xl mb-2">Relationship Exploration</h1>
          <p className="text-muted-foreground mb-4">
            Answer honestly to get the most accurate compatibility insights
          </p>
          <div className="max-w-md mx-auto">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground mt-2">
              {Object.keys(responses).length} of 108 questions answered ({progress}%)
            </p>
          </div>
        </div>

        {/* Module Progress */}
        <div className="grid grid-cols-6 gap-2 mb-8">
          {modules.map((module, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all ${
                index < currentModule
                  ? 'bg-primary'
                  : index === currentModule
                  ? 'bg-primary/50'
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Current Module */}
        <div className="card-surface p-8 mb-6">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-heading text-2xl">
                {modules[currentModule].name}
              </h2>
              <span className="text-sm text-muted-foreground">
                Module {currentModule + 1} of {modules.length}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {modules[currentModule].description}
            </p>
          </div>

          <div className="space-y-8">
            {currentModuleQuestions.map((question, index) => (
              <div key={question.question_id} className="space-y-3">
                <Label className="text-base font-medium">
                  {index + 1}. {question.question_text}
                </Label>
                <RadioGroup
                  value={responses[question.question_id]?.toString()}
                  onValueChange={(value) => handleResponse(question.question_id, value)}
                >
                  <div className="grid grid-cols-5 gap-2">
                    {['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'].map((option, optIndex) => (
                      <div key={optIndex} className="flex flex-col items-center space-y-2">
                        <RadioGroupItem 
                          value={(optIndex + 1).toString()} 
                          id={`${question.question_id}-${optIndex}`}
                        />
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

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentModule === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous Module
          </Button>

          {currentModule < modules.length - 1 ? (
            <Button onClick={handleNext} disabled={!isModuleComplete()}>
              Next Module
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!isModuleComplete() || submitting}>
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

export default DeepQuestionnaireFlow;

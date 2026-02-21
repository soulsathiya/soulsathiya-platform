import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Heart, User, MapPin, Briefcase, Info, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const ProfileOnboarding = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(location.state?.user || null);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(location.state?.user ? true : null);
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState({
    date_of_birth: '',
    gender: '',
    phone_number: '',
    marital_status: '',
    height_cm: '',
    religion: '',
    city: '',
    state: '',
    education_level: '',
    occupation: '',
    annual_income: '',
    bio: ''
  });

  useEffect(() => {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(
        `${BACKEND_URL}/api/profile`,
        formData,
        { withCredentials: true }
      );

      toast.success('Profile created successfully!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create profile');
    } finally {
      setLoading(false);
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

  const steps = [
    { number: 1, title: 'Basic Info', icon: <User className=\"w-5 h-5\" /> },
    { number: 2, title: 'Location', icon: <MapPin className=\"w-5 h-5\" /> },
    { number: 3, title: 'Career', icon: <Briefcase className=\"w-5 h-5\" /> },
    { number: 4, title: 'About You', icon: <Info className=\"w-5 h-5\" /> }
  ];

  return (
    <div className=\"min-h-screen bg-gradient-to-br from-[#FDFBF7] to-white px-4 py-12\">
      <div className=\"container mx-auto max-w-4xl\">
        {/* Header */}
        <div className=\"text-center mb-12\">
          <div className=\"flex items-center justify-center space-x-2 mb-4\">
            <Heart className=\"w-10 h-10 text-primary fill-primary\" />
            <span className=\"text-3xl font-heading font-bold text-foreground\">SoulSathiya</span>
          </div>
          <h1 className=\"font-heading text-3xl mb-2\">Complete Your Profile</h1>
          <p className=\"text-muted-foreground\">
            Help us find your perfect match by sharing a bit about yourself
          </p>
        </div>

        {/* Progress Steps */}
        <div className=\"flex justify-between mb-12\">
          {steps.map((s, index) => (
            <div key={s.number} className=\"flex items-center flex-1\">
              <div className=\"flex flex-col items-center flex-1\">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${\n                    step > s.number\n                      ? 'bg-primary border-primary text-white'\n                      : step === s.number\n                      ? 'border-primary text-primary bg-primary/10'\n                      : 'border-gray-300 text-gray-400'\n                  }`}
                >
                  {step > s.number ? <Check className=\"w-6 h-6\" /> : s.icon}
                </div>
                <span className=\"text-xs mt-2 text-center hidden sm:block\">{s.title}</span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-2 transition-all ${\n                    step > s.number ? 'bg-primary' : 'bg-gray-300'\n                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className=\"card-surface p-8 space-y-6\">
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className=\"space-y-4 animate-fade-in\">
                <div className=\"grid md:grid-cols-2 gap-4\">
                  <div className=\"space-y-2\">
                    <Label htmlFor=\"date_of_birth\">Date of Birth *</Label>
                    <Input
                      id=\"date_of_birth\"
                      type=\"date\"
                      value={formData.date_of_birth}
                      onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                      required
                      data-testid=\"date-of-birth-input\"
                    />
                  </div>
                  <div className=\"space-y-2\">
                    <Label htmlFor=\"gender\">Gender *</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) => setFormData({ ...formData, gender: value })}
                    >
                      <SelectTrigger data-testid=\"gender-select\">
                        <SelectValue placeholder=\"Select gender\" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value=\"male\">Male</SelectItem>
                        <SelectItem value=\"female\">Female</SelectItem>
                        <SelectItem value=\"other\">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className=\"grid md:grid-cols-2 gap-4\">
                  <div className=\"space-y-2\">
                    <Label htmlFor=\"phone_number\">Phone Number *</Label>
                    <Input
                      id=\"phone_number\"
                      type=\"tel\"
                      placeholder=\"9876543210\"
                      value={formData.phone_number}
                      onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                      required
                      pattern=\"[6-9]\\d{9}\"
                      data-testid=\"phone-input\"
                    />
                  </div>
                  <div className=\"space-y-2\">
                    <Label htmlFor=\"height_cm\">Height (cm)</Label>
                    <Input
                      id=\"height_cm\"
                      type=\"number\"
                      placeholder=\"170\"
                      value={formData.height_cm}
                      onChange={(e) => setFormData({ ...formData, height_cm: e.target.value })}
                      min=\"120\"
                      max=\"250\"
                      data-testid=\"height-input\"
                    />
                  </div>
                </div>

                <div className=\"grid md:grid-cols-2 gap-4\">
                  <div className=\"space-y-2\">
                    <Label htmlFor=\"marital_status\">Marital Status *</Label>
                    <Select
                      value={formData.marital_status}
                      onValueChange={(value) => setFormData({ ...formData, marital_status: value })}
                    >
                      <SelectTrigger data-testid=\"marital-status-select\">
                        <SelectValue placeholder=\"Select status\" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value=\"never_married\">Never Married</SelectItem>
                        <SelectItem value=\"divorced\">Divorced</SelectItem>
                        <SelectItem value=\"widowed\">Widowed</SelectItem>
                        <SelectItem value=\"awaiting_divorce\">Awaiting Divorce</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className=\"space-y-2\">
                    <Label htmlFor=\"religion\">Religion</Label>
                    <Select
                      value={formData.religion}
                      onValueChange={(value) => setFormData({ ...formData, religion: value })}
                    >
                      <SelectTrigger data-testid=\"religion-select\">
                        <SelectValue placeholder=\"Select religion\" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value=\"hindu\">Hindu</SelectItem>
                        <SelectItem value=\"muslim\">Muslim</SelectItem>
                        <SelectItem value=\"christian\">Christian</SelectItem>
                        <SelectItem value=\"sikh\">Sikh</SelectItem>
                        <SelectItem value=\"buddhist\">Buddhist</SelectItem>
                        <SelectItem value=\"jain\">Jain</SelectItem>
                        <SelectItem value=\"other\">Other</SelectItem>
                        <SelectItem value=\"no_religion\">No Religion</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Location */}
            {step === 2 && (
              <div className=\"space-y-4 animate-fade-in\">
                <div className=\"grid md:grid-cols-2 gap-4\">
                  <div className=\"space-y-2\">
                    <Label htmlFor=\"city\">City *</Label>
                    <Input
                      id=\"city\"
                      type=\"text\"
                      placeholder=\"Bangalore\"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      required
                      data-testid=\"city-input\"
                    />
                  </div>
                  <div className=\"space-y-2\">
                    <Label htmlFor=\"state\">State *</Label>
                    <Input
                      id=\"state\"
                      type=\"text\"
                      placeholder=\"Karnataka\"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      required
                      data-testid=\"state-input\"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Career */}
            {step === 3 && (
              <div className=\"space-y-4 animate-fade-in\">
                <div className=\"space-y-2\">
                  <Label htmlFor=\"education_level\">Education Level *</Label>
                  <Select
                    value={formData.education_level}
                    onValueChange={(value) => setFormData({ ...formData, education_level: value })}
                  >
                    <SelectTrigger data-testid=\"education-select\">
                      <SelectValue placeholder=\"Select education\" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=\"high_school\">High School</SelectItem>
                      <SelectItem value=\"bachelors\">Bachelor's Degree</SelectItem>
                      <SelectItem value=\"masters\">Master's Degree</SelectItem>
                      <SelectItem value=\"doctorate\">Doctorate</SelectItem>
                      <SelectItem value=\"diploma\">Diploma</SelectItem>
                      <SelectItem value=\"other\">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className=\"space-y-2\">
                  <Label htmlFor=\"occupation\">Occupation *</Label>
                  <Input
                    id=\"occupation\"
                    type=\"text\"
                    placeholder=\"Software Engineer\"
                    value={formData.occupation}
                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                    required
                    data-testid=\"occupation-input\"
                  />
                </div>

                <div className=\"space-y-2\">
                  <Label htmlFor=\"annual_income\">Annual Income (Optional)</Label>
                  <Input
                    id=\"annual_income\"
                    type=\"text\"
                    placeholder=\"₹10-15 Lakhs\"
                    value={formData.annual_income}
                    onChange={(e) => setFormData({ ...formData, annual_income: e.target.value })}
                    data-testid=\"income-input\"
                  />
                </div>
              </div>
            )}

            {/* Step 4: About You */}
            {step === 4 && (
              <div className=\"space-y-4 animate-fade-in\">
                <div className=\"space-y-2\">
                  <Label htmlFor=\"bio\">About You (Optional)</Label>
                  <Textarea
                    id=\"bio\"
                    placeholder=\"Tell us about yourself, your interests, and what you're looking for in a partner...\"
                    rows={6}
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    maxLength={1000}
                    data-testid=\"bio-textarea\"
                  />
                  <p className=\"text-xs text-muted-foreground\">
                    {formData.bio?.length || 0}/1000 characters
                  </p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className=\"flex justify-between pt-6 border-t\">
              {step > 1 && (
                <Button
                  type=\"button\"
                  variant=\"outline\"
                  onClick={() => setStep(step - 1)}
                  data-testid=\"previous-btn\"
                >
                  Previous
                </Button>
              )}
              {step < 4 ? (
                <Button
                  type=\"button\"
                  onClick={() => setStep(step + 1)}
                  className={step === 1 ? 'ml-auto' : ''}
                  data-testid=\"next-btn\"
                >
                  Next
                </Button>
              ) : (
                <Button
                  type=\"submit\"
                  disabled={loading}
                  className=\"ml-auto\"
                  data-testid=\"submit-profile-btn\"
                >
                  {loading ? (
                    <>
                      <Loader2 className=\"w-4 h-4 mr-2 animate-spin\" />
                      Creating Profile...
                    </>
                  ) : (
                    'Complete Profile'
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileOnboarding;

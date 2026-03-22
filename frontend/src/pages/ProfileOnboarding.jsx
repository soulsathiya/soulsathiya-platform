import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  User, Settings2, BookOpen, Brain, ClipboardCheck,
  ChevronRight, ChevronLeft, Loader2, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const STORAGE_KEY = 'soulsathiya_onboarding_state';

// ─── Step metadata ────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Basic Info',   icon: User },
  { id: 2, label: 'Preferences',  icon: Settings2 },
  { id: 3, label: 'About You',    icon: BookOpen },
  { id: 4, label: 'Psychometric', icon: Brain },
  { id: 5, label: 'Review',       icon: ClipboardCheck },
];

// ─── Default form state ───────────────────────────────────────────────────────
const DEFAULT_PROFILE = {
  date_of_birth: '',
  gender: '',
  phone_number: '',
  marital_status: '',
  height_cm: '',
  religion: '',
};

const DEFAULT_PREFERENCES = {
  age_min: '21',
  age_max: '35',
  height_min: '',
  height_max: '',
  preferred_religion: [],
  preferred_education: [],
  preferred_marital_status: [],
  preferred_cities: '',
};

const DEFAULT_ABOUT = {
  city: '',
  state: '',
  education_level: '',
  occupation: '',
  annual_income: '',
  bio: '',
  diet: '',
  drinking: '',
  smoking: '',
  linkedin_url: '',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const loadState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const saveState = (state) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
};

const clearState = () => {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
};

// Checkbox-group toggle
const toggleItem = (arr, value) =>
  arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];

const CheckboxGroup = ({ options, selected, onChange, columns = 2 }) => (
  <div className={`grid grid-cols-${columns} gap-2`}>
    {options.map(({ value, label }) => (
      <label
        key={value}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm transition-colors
          ${selected.includes(value)
            ? 'border-primary bg-primary/10 text-primary font-medium'
            : 'border-border hover:border-primary/50'}`}
      >
        <input
          type="checkbox"
          className="hidden"
          checked={selected.includes(value)}
          onChange={() => onChange(toggleItem(selected, value))}
        />
        <span className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0
          ${selected.includes(value) ? 'bg-primary border-primary' : 'border-muted-foreground'}`}>
          {selected.includes(value) && <Check className="w-3 h-3 text-white" />}
        </span>
        {label}
      </label>
    ))}
  </div>
);

// ─── Step 1: Basic Info ───────────────────────────────────────────────────────
const Step1BasicInfo = ({ data, onChange }) => (
  <div className="space-y-5">
    <h2 className="font-heading text-xl">Basic Information</h2>
    <div className="grid md:grid-cols-2 gap-4">
      <div className="space-y-1">
        <Label>Date of Birth <span className="text-destructive">*</span></Label>
        <Input
          type="date"
          value={data.date_of_birth}
          max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
          onChange={(e) => onChange({ ...data, date_of_birth: e.target.value })}
        />
      </div>
      <div className="space-y-1">
        <Label>Gender <span className="text-destructive">*</span></Label>
        <Select value={data.gender} onValueChange={(v) => onChange({ ...data, gender: v })}>
          <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="male">Male</SelectItem>
            <SelectItem value="female">Female</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
    <div className="grid md:grid-cols-2 gap-4">
      <div className="space-y-1">
        <Label>Phone Number <span className="text-destructive">*</span></Label>
        <Input
          type="tel"
          placeholder="9876543210"
          maxLength={10}
          value={data.phone_number}
          onChange={(e) => onChange({ ...data, phone_number: e.target.value.replace(/\D/g, '') })}
        />
        <p className="text-xs text-muted-foreground">10-digit Indian mobile number</p>
      </div>
      <div className="space-y-1">
        <Label>Marital Status <span className="text-destructive">*</span></Label>
        <Select value={data.marital_status} onValueChange={(v) => onChange({ ...data, marital_status: v })}>
          <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="never_married">Never Married</SelectItem>
            <SelectItem value="divorced">Divorced</SelectItem>
            <SelectItem value="widowed">Widowed</SelectItem>
            <SelectItem value="awaiting_divorce">Awaiting Divorce</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
    <div className="grid md:grid-cols-2 gap-4">
      <div className="space-y-1">
        <Label>Height (cm)</Label>
        <Input
          type="number"
          placeholder="165"
          min={120}
          max={250}
          value={data.height_cm}
          onChange={(e) => onChange({ ...data, height_cm: e.target.value })}
        />
      </div>
      <div className="space-y-1">
        <Label>Religion</Label>
        <Select value={data.religion} onValueChange={(v) => onChange({ ...data, religion: v })}>
          <SelectTrigger><SelectValue placeholder="Select religion" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="hindu">Hindu</SelectItem>
            <SelectItem value="muslim">Muslim</SelectItem>
            <SelectItem value="christian">Christian</SelectItem>
            <SelectItem value="sikh">Sikh</SelectItem>
            <SelectItem value="buddhist">Buddhist</SelectItem>
            <SelectItem value="jain">Jain</SelectItem>
            <SelectItem value="parsi">Parsi</SelectItem>
            <SelectItem value="no_religion">No Religion</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  </div>
);

// ─── Step 2: Partner Preferences ─────────────────────────────────────────────
const Step2Preferences = ({ data, onChange }) => (
  <div className="space-y-5">
    <h2 className="font-heading text-xl">Partner Preferences</h2>
    <div className="grid md:grid-cols-2 gap-4">
      <div className="space-y-1">
        <Label>Preferred Age (Min) <span className="text-destructive">*</span></Label>
        <Input
          type="number"
          min={18}
          max={80}
          value={data.age_min}
          onChange={(e) => onChange({ ...data, age_min: e.target.value })}
        />
      </div>
      <div className="space-y-1">
        <Label>Preferred Age (Max) <span className="text-destructive">*</span></Label>
        <Input
          type="number"
          min={18}
          max={80}
          value={data.age_max}
          onChange={(e) => onChange({ ...data, age_max: e.target.value })}
        />
      </div>
    </div>
    <div className="grid md:grid-cols-2 gap-4">
      <div className="space-y-1">
        <Label>Preferred Height Min (cm)</Label>
        <Input
          type="number"
          min={120}
          max={250}
          placeholder="150"
          value={data.height_min}
          onChange={(e) => onChange({ ...data, height_min: e.target.value })}
        />
      </div>
      <div className="space-y-1">
        <Label>Preferred Height Max (cm)</Label>
        <Input
          type="number"
          min={120}
          max={250}
          placeholder="185"
          value={data.height_max}
          onChange={(e) => onChange({ ...data, height_max: e.target.value })}
        />
      </div>
    </div>
    <div className="space-y-2">
      <Label>Preferred Religion (select all that apply)</Label>
      <CheckboxGroup
        columns={3}
        selected={data.preferred_religion}
        onChange={(v) => onChange({ ...data, preferred_religion: v })}
        options={[
          { value: 'hindu', label: 'Hindu' },
          { value: 'muslim', label: 'Muslim' },
          { value: 'christian', label: 'Christian' },
          { value: 'sikh', label: 'Sikh' },
          { value: 'jain', label: 'Jain' },
          { value: 'buddhist', label: 'Buddhist' },
          { value: 'parsi', label: 'Parsi' },
          { value: 'no_religion', label: 'No Preference' },
          { value: 'other', label: 'Other' },
        ]}
      />
    </div>
    <div className="space-y-2">
      <Label>Preferred Education (select all that apply)</Label>
      <CheckboxGroup
        columns={2}
        selected={data.preferred_education}
        onChange={(v) => onChange({ ...data, preferred_education: v })}
        options={[
          { value: 'high_school', label: 'High School' },
          { value: 'diploma', label: 'Diploma' },
          { value: 'bachelors', label: "Bachelor's" },
          { value: 'masters', label: "Master's" },
          { value: 'doctorate', label: 'Doctorate' },
          { value: 'other', label: 'Other' },
        ]}
      />
    </div>
    <div className="space-y-2">
      <Label>Preferred Marital Status (select all that apply)</Label>
      <CheckboxGroup
        columns={2}
        selected={data.preferred_marital_status}
        onChange={(v) => onChange({ ...data, preferred_marital_status: v })}
        options={[
          { value: 'never_married', label: 'Never Married' },
          { value: 'divorced', label: 'Divorced' },
          { value: 'widowed', label: 'Widowed' },
          { value: 'awaiting_divorce', label: 'Awaiting Divorce' },
        ]}
      />
    </div>
    <div className="space-y-1">
      <Label>Preferred Cities (comma-separated)</Label>
      <Input
        placeholder="Mumbai, Delhi, Bangalore"
        value={data.preferred_cities}
        onChange={(e) => onChange({ ...data, preferred_cities: e.target.value })}
      />
    </div>
  </div>
);

// ─── Step 3: About You ────────────────────────────────────────────────────────
const Step3AboutYou = ({ data, onChange }) => (
  <div className="space-y-5">
    <h2 className="font-heading text-xl">About You</h2>
    <div className="grid md:grid-cols-2 gap-4">
      <div className="space-y-1">
        <Label>City <span className="text-destructive">*</span></Label>
        <Input
          placeholder="Mumbai"
          value={data.city}
          onChange={(e) => onChange({ ...data, city: e.target.value })}
        />
      </div>
      <div className="space-y-1">
        <Label>State <span className="text-destructive">*</span></Label>
        <Input
          placeholder="Maharashtra"
          value={data.state}
          onChange={(e) => onChange({ ...data, state: e.target.value })}
        />
      </div>
    </div>
    <div className="grid md:grid-cols-2 gap-4">
      <div className="space-y-1">
        <Label>Education Level <span className="text-destructive">*</span></Label>
        <Select value={data.education_level} onValueChange={(v) => onChange({ ...data, education_level: v })}>
          <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="high_school">High School</SelectItem>
            <SelectItem value="diploma">Diploma</SelectItem>
            <SelectItem value="bachelors">Bachelor's</SelectItem>
            <SelectItem value="masters">Master's</SelectItem>
            <SelectItem value="doctorate">Doctorate</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label>Occupation <span className="text-destructive">*</span></Label>
        <Input
          placeholder="e.g. Software Engineer"
          value={data.occupation}
          onChange={(e) => onChange({ ...data, occupation: e.target.value })}
        />
      </div>
    </div>
    <div className="grid md:grid-cols-3 gap-4">
      <div className="space-y-1">
        <Label>Annual Income</Label>
        <Select value={data.annual_income} onValueChange={(v) => onChange({ ...data, annual_income: v })}>
          <SelectTrigger><SelectValue placeholder="Select range" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="below_3L">Below ₹3 LPA</SelectItem>
            <SelectItem value="3L_6L">₹3–6 LPA</SelectItem>
            <SelectItem value="6L_10L">₹6–10 LPA</SelectItem>
            <SelectItem value="10L_20L">₹10–20 LPA</SelectItem>
            <SelectItem value="20L_50L">₹20–50 LPA</SelectItem>
            <SelectItem value="above_50L">Above ₹50 LPA</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label>Diet</Label>
        <Select value={data.diet} onValueChange={(v) => onChange({ ...data, diet: v })}>
          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="vegetarian">Vegetarian</SelectItem>
            <SelectItem value="non_vegetarian">Non-Vegetarian</SelectItem>
            <SelectItem value="vegan">Vegan</SelectItem>
            <SelectItem value="eggetarian">Eggetarian</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label>Drinking</Label>
        <Select value={data.drinking} onValueChange={(v) => onChange({ ...data, drinking: v })}>
          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="never">Never</SelectItem>
            <SelectItem value="occasionally">Occasionally</SelectItem>
            <SelectItem value="regularly">Regularly</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
    <div className="grid md:grid-cols-2 gap-4">
      <div className="space-y-1">
        <Label>Smoking</Label>
        <Select value={data.smoking} onValueChange={(v) => onChange({ ...data, smoking: v })}>
          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="never">Never</SelectItem>
            <SelectItem value="occasionally">Occasionally</SelectItem>
            <SelectItem value="regularly">Regularly</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
    <div className="space-y-1">
      <Label>About You</Label>
      <Textarea
        rows={4}
        placeholder="Tell potential matches a little about yourself, your values, and what you're looking for..."
        value={data.bio}
        onChange={(e) => onChange({ ...data, bio: e.target.value })}
        maxLength={1000}
      />
      <p className="text-xs text-muted-foreground text-right">{data.bio.length}/1000</p>
    </div>

    {/* LinkedIn (Optional) */}
    <div className="space-y-1">
      <Label>LinkedIn Profile <span className="text-muted-foreground text-xs font-normal">(Optional)</span></Label>
      <Input
        type="url"
        placeholder="https://linkedin.com/in/your-profile"
        value={data.linkedin_url}
        onChange={(e) => onChange({ ...data, linkedin_url: e.target.value })}
      />
      <p className="text-xs text-muted-foreground">
        Profiles with LinkedIn tend to receive more meaningful responses
      </p>
      {data.linkedin_url && !data.linkedin_url.toLowerCase().includes('linkedin.com') && (
        <p className="text-xs text-amber-400">Please enter a valid LinkedIn URL (e.g. linkedin.com/in/...)</p>
      )}
    </div>
  </div>
);

// ─── Step 4: Psychometric Info ────────────────────────────────────────────────
const Step4Psychometric = () => (
  <div className="space-y-6 text-center py-4">
    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
      <Brain className="w-10 h-10 text-primary" />
    </div>
    <div>
      <h2 className="font-heading text-2xl mb-3">Compatibility Assessment</h2>
      <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
        After completing your profile, you'll take a short psychometric questionnaire.
        This helps us find truly compatible matches based on your values, personality, and life goals.
      </p>
    </div>
    <div className="grid grid-cols-3 gap-4 text-sm max-w-sm mx-auto">
      {[
        { emoji: '🧠', label: '36 questions' },
        { emoji: '⏱️', label: '~10 minutes' },
        { emoji: '💑', label: 'Better matches' },
      ].map(({ emoji, label }) => (
        <div key={label} className="card-surface p-3 rounded-xl">
          <div className="text-2xl mb-1">{emoji}</div>
          <div className="text-muted-foreground">{label}</div>
        </div>
      ))}
    </div>
    <p className="text-sm text-muted-foreground">
      Click <strong>Next</strong> to review your profile before submitting.
    </p>
  </div>
);

// ─── Step 5: Review ───────────────────────────────────────────────────────────

/** Capitalize first letter of each word and replace underscores with spaces */
const formatLabel = (val) => {
  if (!val) return '—';
  return String(val)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
};

/** Format array values with proper capitalization */
const formatArray = (arr) => {
  if (!Array.isArray(arr) || !arr.length) return '—';
  return arr.map(v => formatLabel(v)).join(', ');
};

/** Format date from YYYY-MM-DD to DD MMM YYYY (e.g. 15 Jun 1993) */
const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [y, m, d] = parts;
  return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`;
};

/** Format annual income to readable format */
const formatIncome = (val) => {
  if (!val) return '—';
  const incomeMap = {
    'below_3l': 'Below ₹3 LPA', '3l_6l': '₹3–6 LPA', '6l_10l': '₹6–10 LPA',
    '10l_20l': '₹10–20 LPA', '20l_50l': '₹20–50 LPA', 'above_50l': 'Above ₹50 LPA',
    'Below ₹3 LPA': 'Below ₹3 LPA', '₹3-6 LPA': '₹3–6 LPA', '₹6-10 LPA': '₹6–10 LPA',
    '₹10-20 LPA': '₹10–20 LPA', '₹20-50 LPA': '₹20–50 LPA', 'Above ₹50 LPA': 'Above ₹50 LPA',
  };
  return incomeMap[val] || formatLabel(val);
};

const ReviewRow = ({ label, value }) => (
  <div className="flex justify-between py-2 border-b last:border-0">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="text-sm font-medium text-right max-w-[60%] truncate">
      {Array.isArray(value) ? formatArray(value) : (value || '—')}
    </span>
  </div>
);

const Step5Review = ({ profile, preferences, about }) => (
  <div className="space-y-6">
    <h2 className="font-heading text-xl">Review Your Profile</h2>
    <div className="card-surface p-4 rounded-xl space-y-1">
      <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-2">Basic Info</h3>
      <ReviewRow label="Date of Birth" value={formatDate(profile.date_of_birth)} />
      <ReviewRow label="Gender" value={formatLabel(profile.gender)} />
      <ReviewRow label="Phone" value={profile.phone_number} />
      <ReviewRow label="Marital Status" value={formatLabel(profile.marital_status)} />
      <ReviewRow label="Height" value={profile.height_cm ? `${profile.height_cm} cm` : ''} />
      <ReviewRow label="Religion" value={formatLabel(profile.religion)} />
    </div>
    <div className="card-surface p-4 rounded-xl space-y-1">
      <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-2">About You</h3>
      <ReviewRow label="City / State" value={about.city && about.state ? `${about.city}, ${about.state}` : (about.city || about.state)} />
      <ReviewRow label="Education" value={formatLabel(about.education_level)} />
      <ReviewRow label="Occupation" value={about.occupation} />
      <ReviewRow label="Annual Income" value={formatIncome(about.annual_income)} />
      <ReviewRow label="Diet" value={about.diet ? formatLabel(about.diet) : 'Prefer not to say'} />
      {about.linkedin_url && <ReviewRow label="LinkedIn" value="✓ Linked" />}
    </div>
    <div className="card-surface p-4 rounded-xl space-y-1">
      <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-2">Partner Preferences</h3>
      <ReviewRow label="Age Range" value={preferences.age_min && preferences.age_max ? `${preferences.age_min}–${preferences.age_max} yrs` : ''} />
      <ReviewRow label="Height Range" value={preferences.height_min && preferences.height_max ? `${preferences.height_min}–${preferences.height_max} cm` : ''} />
      <ReviewRow label="Religion Pref." value={Array.isArray(preferences.preferred_religion) ? formatArray(preferences.preferred_religion) : formatLabel(preferences.preferred_religion)} />
      <ReviewRow label="Education Pref." value={Array.isArray(preferences.preferred_education) ? formatArray(preferences.preferred_education) : formatLabel(preferences.preferred_education)} />
      <ReviewRow label="Marital Status Pref." value={Array.isArray(preferences.preferred_marital_status) ? formatArray(preferences.preferred_marital_status) : formatLabel(preferences.preferred_marital_status)} />
      <ReviewRow label="Cities Pref." value={preferences.preferred_cities} />
    </div>
  </div>
);

// ─── Step indicator ───────────────────────────────────────────────────────────
const StepIndicator = ({ currentStep }) => (
  <div className="flex items-center justify-center mb-8 overflow-x-auto pb-2">
    {STEPS.map((step, index) => {
      const Icon = step.icon;
      const isCompleted = currentStep > step.id;
      const isActive = currentStep === step.id;
      return (
        <React.Fragment key={step.id}>
          <div className="flex flex-col items-center flex-shrink-0">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors
              ${isCompleted ? 'bg-primary text-white'
                : isActive ? 'bg-primary/20 border-2 border-primary text-primary'
                : 'bg-muted text-muted-foreground'}`}>
              {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
            </div>
            <span className={`text-xs mt-1 hidden sm:block ${isActive ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
              {step.label}
            </span>
          </div>
          {index < STEPS.length - 1 && (
            <div className={`h-0.5 flex-1 mx-1 min-w-[16px] max-w-[48px] transition-colors
              ${currentStep > step.id ? 'bg-primary' : 'bg-muted'}`} />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────
const ProfileOnboarding = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(location.state?.user || null);
  const [isAuthenticated, setIsAuthenticated] = useState(location.state?.user ? true : null);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [about, setAbout] = useState(DEFAULT_ABOUT);

  // Restore saved progress on mount
  useEffect(() => {
    const saved = loadState();
    if (saved) {
      if (saved.currentStep) setCurrentStep(saved.currentStep);
      if (saved.profile) setProfile(saved.profile);
      if (saved.preferences) setPreferences(saved.preferences);
      if (saved.about) setAbout(saved.about);
    }
  }, []);

  // Auth check
  useEffect(() => {
    if (location.state?.user) return;
    const checkAuth = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/api/auth/me`, { withCredentials: true });
        setUser(res.data);
        setIsAuthenticated(true);
      } catch {
        setIsAuthenticated(false);
        navigate('/login');
      }
    };
    checkAuth();
  }, [location.state, navigate]);

  // Persist helpers
  const persist = useCallback((step, p, pref, ab) => {
    saveState({ currentStep: step, profile: p, preferences: pref, about: ab });
  }, []);

  const handleProfileChange = (val) => { setProfile(val); persist(currentStep, val, preferences, about); };
  const handlePrefsChange = (val) => { setPreferences(val); persist(currentStep, profile, val, about); };
  const handleAboutChange = (val) => { setAbout(val); persist(currentStep, profile, preferences, val); };

  // Per-step validation
  const validateStep = () => {
    if (currentStep === 1) {
      if (!profile.date_of_birth) { toast.error('Please enter your date of birth'); return false; }
      if (!profile.gender) { toast.error('Please select your gender'); return false; }
      if (!profile.phone_number || profile.phone_number.length !== 10) {
        toast.error('Please enter a valid 10-digit phone number'); return false;
      }
      if (!profile.marital_status) { toast.error('Please select your marital status'); return false; }
    }
    if (currentStep === 2) {
      if (!preferences.age_min || !preferences.age_max) { toast.error('Please set preferred age range'); return false; }
      if (parseInt(preferences.age_min) > parseInt(preferences.age_max)) {
        toast.error('Min age cannot be greater than max age'); return false;
      }
    }
    if (currentStep === 3) {
      if (!about.city) { toast.error('Please enter your city'); return false; }
      if (!about.state) { toast.error('Please enter your state'); return false; }
      if (!about.education_level) { toast.error('Please select your education level'); return false; }
      if (!about.occupation) { toast.error('Please enter your occupation'); return false; }
    }
    return true;
  };

  const goNext = () => {
    if (!validateStep()) return;
    const next = Math.min(currentStep + 1, 5);
    setCurrentStep(next);
    persist(next, profile, preferences, about);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    const prev = Math.max(currentStep - 1, 1);
    setCurrentStep(prev);
    persist(prev, profile, preferences, about);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Final submit
  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Build profile payload (merge basic + about)
      const aboutClean = { ...about };
      // Only save linkedin_url if it's a valid LinkedIn URL
      if (aboutClean.linkedin_url && !aboutClean.linkedin_url.toLowerCase().includes('linkedin.com')) {
        delete aboutClean.linkedin_url;
      }
      const profilePayload = {
        ...aboutClean,
        ...profile,
        height_cm: profile.height_cm ? parseInt(profile.height_cm) : undefined,
        user_id: user?.user_id || '',
      };
      // Remove empty strings / undefined
      Object.keys(profilePayload).forEach((k) => {
        if (profilePayload[k] === '' || profilePayload[k] === undefined) delete profilePayload[k];
      });

      // POST profile; if already exists (400) fall back to PUT
      try {
        await axios.post(`${BACKEND_URL}/api/profile`, profilePayload, { withCredentials: true });
      } catch (err) {
        const errDetail = err?.response?.data?.detail;
        const errMsg = (Array.isArray(errDetail) ? errDetail[0]?.msg : errDetail) || '';
        if (err?.response?.status === 400 && errMsg.includes('already exists')) {
          await axios.put(`${BACKEND_URL}/api/profile`, profilePayload, { withCredentials: true });
        } else {
          throw err;
        }
      }

      // Build partner preferences payload
      const citiesArr = preferences.preferred_cities
        ? preferences.preferred_cities.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      // Derive preferred_gender from user's own gender (opposite by default)
      const ownGender = profile.gender;
      const derivedPreferredGender =
        ownGender === 'male' ? 'female' :
        ownGender === 'female' ? 'male' :
        undefined;

      const prefsPayload = {
        user_id: user?.user_id || '',
        age_min: parseInt(preferences.age_min) || 21,
        age_max: parseInt(preferences.age_max) || 35,
        ...(preferences.height_min && { height_min: parseInt(preferences.height_min) }),
        ...(preferences.height_max && { height_max: parseInt(preferences.height_max) }),
        ...(derivedPreferredGender && { preferred_gender: derivedPreferredGender }),
        preferred_religion: preferences.preferred_religion,
        preferred_education: preferences.preferred_education,
        preferred_marital_status: preferences.preferred_marital_status,
        preferred_cities: citiesArr,
      };

      // POST preferences; on 400 fall back to PUT
      try {
        await axios.post(`${BACKEND_URL}/api/partner-preferences`, prefsPayload, { withCredentials: true });
      } catch (err) {
        if (err?.response?.status === 400) {
          await axios.put(`${BACKEND_URL}/api/partner-preferences`, prefsPayload, { withCredentials: true });
        } else {
          throw err;
        }
      }

      clearState();
      toast.success('Profile saved! Now complete your compatibility assessment.');
      navigate('/onboarding/psychometric');
    } catch (error) {
      const detail = error?.response?.data?.detail;
      const message = (Array.isArray(detail) ? detail[0]?.msg : detail) || error?.message || 'Failed to save profile';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Loading / auth guard
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-card px-4 py-10">
      <div className="container mx-auto max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-3">
            <img src="/logo.png" alt="SoulSathiya" className="w-8 h-8 object-contain" draggable={false} />
            <span className="text-2xl font-heading font-bold">Soul<span className="text-primary">Sathiya</span></span>
          </div>
          <h1 className="font-heading text-2xl">Complete Your Profile</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Step {currentStep} of {STEPS.length} — {STEPS[currentStep - 1].label}
          </p>
        </div>

        {/* Step indicator */}
        <StepIndicator currentStep={currentStep} />

        {/* Step content */}
        <div className="card-surface p-6 md:p-8 rounded-2xl shadow-sm">
          {currentStep === 1 && <Step1BasicInfo data={profile} onChange={handleProfileChange} />}
          {currentStep === 2 && <Step2Preferences data={preferences} onChange={handlePrefsChange} />}
          {currentStep === 3 && <Step3AboutYou data={about} onChange={handleAboutChange} />}
          {currentStep === 4 && <Step4Psychometric />}
          {currentStep === 5 && <Step5Review profile={profile} preferences={preferences} about={about} />}

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8 pt-4 border-t">
            <Button
              type="button"
              variant="ghost"
              onClick={goBack}
              disabled={currentStep === 1}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </Button>

            {currentStep < 5 ? (
              <Button type="button" onClick={goNext} className="flex items-center gap-1">
                Next <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button type="button" onClick={handleSubmit} disabled={loading} className="flex items-center gap-2">
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                  : <><Check className="w-4 h-4" /> Submit Profile</>}
              </Button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Your progress is saved automatically — you can return anytime.
        </p>
      </div>
    </div>
  );
};

export default ProfileOnboarding;

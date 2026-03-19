import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';

const INCOME_MAP = {
  below_3l:  'Below ₹3 LPA',
  '3l_5l':   '₹3–5 LPA',
  '5l_10l':  '₹5–10 LPA',
  '10l_20l': '₹10–20 LPA',
  '20l_50l': '₹20–50 LPA',
  above_50l: 'Above ₹50 LPA',
};

const EDU_MAP = {
  high_school: 'High School',
  diploma:     'Diploma',
  bachelors:   "Bachelor's Degree",
  masters:     "Master's Degree",
  phd:         'PhD',
  mbbs:        'MBBS',
  ca:          'CA',
  other:       'Other',
};

const formatIncome = (v) => {
  if (!v) return null;
  const key = v.toLowerCase().replace(/\s+/g, '_');
  return INCOME_MAP[key] || v.replace(/_/g, ' ');
};

const formatEdu = (v) => EDU_MAP[v?.toLowerCase()] || v;

const formatHeight = (cm) => {
  if (!cm) return null;
  const totalIn = Math.round(cm / 2.54);
  const ft = Math.floor(totalIn / 12);
  const inches = totalIn % 12;
  return `${ft}'${inches}" (${cm} cm)`;
};

const capitalize = (v) => v ? v.charAt(0).toUpperCase() + v.slice(1).toLowerCase().replace(/_/g, ' ') : null;

const FieldRow = ({ label, value }) =>
  value ? (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-foreground capitalize">{value}</p>
    </div>
  ) : null;

const TABS = ['Basics', 'Lifestyle', 'Mind & Values'];

const AboutSection = ({ profileData }) => {
  const [activeTab, setActiveTab] = useState('Basics');

  if (!profileData) return null;

  const basics = [
    { label: 'Religion',       value: capitalize(profileData.religion) },
    { label: 'Marital Status', value: capitalize(profileData.marital_status) },
    { label: 'Height',         value: formatHeight(profileData.height_cm) },
    { label: 'Annual Income',  value: formatIncome(profileData.annual_income) },
    { label: 'Education',      value: formatEdu(profileData.education_level) },
    { label: 'Education Details', value: profileData.education_details || null },
  ].filter(f => f.value);

  const lifestyle = [
    { label: 'Diet',     value: capitalize(profileData.diet) },
    { label: 'Smoking',  value: capitalize(profileData.smoking) },
    { label: 'Hobbies',  value: profileData.hobbies?.length ? profileData.hobbies.join(', ') : null },
  ].filter(f => f.value);

  const mindValues = [
    profileData.religion && { label: 'Spiritual Belief', value: capitalize(profileData.religion) },
    profileData.marital_status === 'never_married' && { label: 'Life Stage', value: 'Ready for a first serious commitment' },
    profileData.diet === 'vegetarian' && { label: 'Lifestyle Value', value: 'Mindful living' },
    profileData.hobbies?.length > 0 && { label: 'Passion Areas', value: profileData.hobbies.slice(0, 3).join(' · ') },
  ].filter(Boolean);

  const tabContent = {
    Basics: basics,
    Lifestyle: lifestyle,
    'Mind & Values': mindValues,
  };

  const items = tabContent[activeTab] || [];

  return (
    <div className="card-surface rounded-2xl p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-4 h-4 text-primary" />
        <h2 className="font-heading text-base font-semibold text-foreground">About</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-white/[0.04] p-1 rounded-xl w-fit">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
              activeTab === tab
                ? 'bg-primary text-primary-foreground shadow'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {items.map(({ label, value }) => (
            <FieldRow key={label} label={label} value={value} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground/50 italic">No information available yet.</p>
      )}
    </div>
  );
};

export default AboutSection;

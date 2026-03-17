import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import {
  Shield, Upload, CheckCircle, Clock, XCircle,
  FileText, Camera, Zap, ChevronRight, Lock, Star, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// ── Image optimiser (browser Canvas API) ─────────────────────────────────────
async function optimiseImage(file, maxWidthPx = 1024, quality = 0.78) {
  return new Promise((resolve) => {
    if (file.type === 'application/pdf') { resolve(file); return; }
    const img    = new Image();
    const reader = new FileReader();
    reader.onload = (e) => {
      img.onload = () => {
        const scale  = Math.min(1, maxWidthPx / img.width);
        const canvas = document.createElement('canvas');
        canvas.width  = Math.round(img.width  * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => resolve(new File([blob], file.name, { type: 'image/jpeg' })),
          'image/jpeg',
          quality,
        );
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// ── Status badge ──────────────────────────────────────────────────────────────
function KYCStatusBadge({ status }) {
  const map = {
    not_submitted: { label: 'Not Submitted',   cls: 'bg-slate-700 text-slate-300',         icon: <Shield     className="w-3.5 h-3.5" /> },
    pending:       { label: 'Pending Review',   cls: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30', icon: <Clock      className="w-3.5 h-3.5" /> },
    approved:      { label: 'Identity Verified',cls: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30', icon: <CheckCircle className="w-3.5 h-3.5" /> },
    rejected:      { label: 'Rejected',         cls: 'bg-red-500/20 text-red-400 border border-red-500/30',         icon: <XCircle    className="w-3.5 h-3.5" /> },
  };
  const s = map[status] || map.not_submitted;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${s.cls}`}>
      {s.icon}{s.label}
    </span>
  );
}

// ── Drop Zone ─────────────────────────────────────────────────────────────────
function DropZone({ label, accept, maxMB, file, setFile, icon: Icon }) {
  const ref = useRef();
  const [dragging, setDragging] = useState(false);

  const pick = (f) => {
    if (!f) return;
    if (f.size > maxMB * 1024 * 1024) {
      toast.error(`File too large. Max ${maxMB} MB.`); return;
    }
    setFile(f);
  };

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false);
    pick(e.dataTransfer.files[0]);
  }, []);

  return (
    <div
      onClick={() => ref.current.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={`
        relative flex flex-col items-center justify-center gap-3
        border-2 border-dashed rounded-xl p-6 cursor-pointer transition-all
        ${dragging ? 'border-yellow-400 bg-yellow-400/5' : file ? 'border-emerald-500/60 bg-emerald-500/5' : 'border-slate-600 hover:border-yellow-500/60 hover:bg-yellow-400/3'}
      `}
    >
      <input ref={ref} type="file" accept={accept} className="hidden"
        onChange={(e) => pick(e.target.files[0])} />
      {file ? (
        <>
          <CheckCircle className="w-8 h-8 text-emerald-400" />
          <p className="text-sm text-emerald-400 font-medium text-center">{file.name}</p>
          <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(0)} KB — click to replace</p>
        </>
      ) : (
        <>
          <Icon className="w-8 h-8 text-slate-500" />
          <p className="text-sm font-semibold text-slate-300">{label}</p>
          <p className="text-xs text-slate-500">Drag & drop or click · max {maxMB} MB</p>
          <p className="text-xs text-slate-600">JPG, PNG{maxMB === 3 ? ', PDF' : ''}</p>
        </>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function KYCVerificationPage() {
  const navigate = useNavigate();

  const [kycStatus, setKycStatus]     = useState(null);   // fetched from API
  const [loading,   setLoading]       = useState(true);
  const [method,    setMethod]        = useState(null);    // 'manual' | 'digilocker' | null
  const [docType,   setDocType]       = useState('aadhaar');
  const [docFile,   setDocFile]       = useState(null);
  const [selfieFile,setSelfieFile]    = useState(null);
  const [consent,   setConsent]       = useState(false);
  const [submitting,setSubmitting]    = useState(false);
  const [optimising,setOptimising]    = useState(false);

  // ── Fetch current status ──────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`${BACKEND_URL}/api/kyc/status`, { withCredentials: true });
        setKycStatus(data);
      } catch {
        toast.error('Could not load KYC status. Please refresh.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Submit manual KYC ─────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!docFile || !selfieFile) { toast.error('Please upload both your document and selfie.'); return; }
    if (!consent)                { toast.error('Please give your consent to proceed.'); return; }

    try {
      setOptimising(true);
      const [optimDoc, optimSelfie] = await Promise.all([
        optimiseImage(docFile,    1024, 0.78),
        optimiseImage(selfieFile, 1024, 0.78),
      ]);
      setOptimising(false);
      setSubmitting(true);

      const fd = new FormData();
      fd.append('document_type', docType);
      fd.append('document_file', optimDoc);
      fd.append('selfie_file',   optimSelfie);
      fd.append('consent',       'true');

      const { data } = await axios.post(`${BACKEND_URL}/api/kyc/manual/submit`, fd, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(data.message || 'KYC submitted! We\'ll review within 24 hours.');
      setKycStatus(prev => ({ ...prev, kyc_status: 'pending', kyc_method: 'manual' }));
      setMethod(null);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Submission failed. Please retry.');
    } finally {
      setSubmitting(false);
      setOptimising(false);
    }
  };

  // ── DigiLocker initiate (mock) ────────────────────────────────────────────
  const handleDigiLocker = async () => {
    try {
      const { data } = await axios.get(`${BACKEND_URL}/api/kyc/digilocker/initiate`, { withCredentials: true });
      toast.info(data.message || 'DigiLocker coming soon.');
    } catch {
      toast.error('DigiLocker unavailable. Please use manual upload.');
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
    </div>
  );

  const status = kycStatus?.kyc_status || 'not_submitted';

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-8">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-4 py-1.5 rounded-full text-sm font-medium">
            <Shield className="w-4 h-4" />
            Identity Verification
          </div>
          <h1 className="font-heading text-3xl font-bold text-foreground">
            Become a <span className="text-primary">Verified Member</span>
          </h1>
          <p className="text-muted-foreground">
            Build trust before you even say hello
          </p>
          <div className="flex items-center justify-center">
            <KYCStatusBadge status={status} />
          </div>
        </div>

        {/* ── Trust stats ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: Star,     text: '3× more connections' },
            { icon: Lock,     text: 'सुरक्षित & encrypted' },
            { icon: CheckCircle, text: 'Govt-backed ID check' },
          ].map(({ icon: Icon, text }, i) => (
            <div key={i} className="text-center p-4 rounded-xl bg-card border border-border">
              <Icon className="w-5 h-5 text-primary mx-auto mb-2" />
              <p className="text-xs text-muted-foreground font-medium">{text}</p>
            </div>
          ))}
        </div>

        {/* ── Status: Already approved ───────────────────────────────────── */}
        {status === 'approved' && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center space-y-4">
            <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto" />
            <h2 className="text-2xl font-bold text-emerald-400">
              {kycStatus?.kyc_method === 'digilocker' ? '🏛️ Government Verified' : '✔ Identity Verified'}
            </h2>
            <p className="text-muted-foreground">
              Your profile is now verified.
              {kycStatus?.kyc_method === 'digilocker' && ' Verified via DigiLocker — highest trust level.'}
            </p>
            <Button onClick={() => navigate('/dashboard')} className="mt-2">
              Back to Dashboard <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        {/* ── Status: Pending ────────────────────────────────────────────── */}
        {status === 'pending' && (
          <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/5 p-8 text-center space-y-4">
            <Clock className="w-16 h-16 text-yellow-400 mx-auto animate-pulse" />
            <h2 className="text-xl font-bold text-yellow-400">Under Review</h2>
            <p className="text-muted-foreground">
              We're verifying your documents. This usually takes less than 24 hours.
            </p>
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        )}

        {/* ── Status: Rejected ───────────────────────────────────────────── */}
        {status === 'rejected' && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <XCircle className="w-8 h-8 text-red-400 shrink-0" />
              <div>
                <h2 className="text-lg font-bold text-red-400">Verification Rejected</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Reason: {kycStatus?.kyc_rejection_reason || 'Please resubmit with clearer documents.'}
                </p>
              </div>
            </div>
            <Button onClick={() => setKycStatus(prev => ({ ...prev, kyc_status: 'not_submitted' }))}
              variant="outline" className="w-full border-red-500/40 text-red-400 hover:bg-red-500/10">
              Resubmit Documents
            </Button>
          </div>
        )}

        {/* ── Not submitted: method selection ────────────────────────────── */}
        {(status === 'not_submitted' || (status === 'rejected' && !method)) && method === null && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground text-center">Choose Verification Method</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* DigiLocker card */}
              <button onClick={handleDigiLocker}
                className="group text-left p-5 rounded-2xl border border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/60 transition-all space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-xs font-bold text-primary bg-primary/15 px-2 py-0.5 rounded-full">FASTEST</span>
                </div>
                <div>
                  <h3 className="font-bold text-foreground">Verify via DigiLocker ⚡</h3>
                  <p className="text-sm text-muted-foreground mt-1">30 seconds · Government verified</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-primary font-semibold group-hover:gap-2 transition-all">
                  Connect DigiLocker <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </button>

              {/* Manual card */}
              <button onClick={() => setMethod('manual')}
                className="group text-left p-5 rounded-2xl border border-border bg-card hover:border-primary/40 hover:bg-card/80 transition-all space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center">
                    <Upload className="w-5 h-5 text-slate-300" />
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground bg-slate-700 px-2 py-0.5 rounded-full">MANUAL</span>
                </div>
                <div>
                  <h3 className="font-bold text-foreground">Upload documents manually</h3>
                  <p className="text-sm text-muted-foreground mt-1">2 minutes · Reviewed within 24 hours</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground font-semibold group-hover:text-foreground group-hover:gap-2 transition-all">
                  Upload Documents <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </button>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              Your documents are सुरक्षित (secure) and encrypted · never shared without consent
            </p>
          </div>
        )}

        {/* ── Manual upload form ─────────────────────────────────────────── */}
        {method === 'manual' && (
          <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
            <div className="flex items-center gap-3">
              <button onClick={() => setMethod(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                ← Back
              </button>
              <h2 className="text-lg font-bold text-foreground">Upload Your Documents</h2>
            </div>

            {/* Document type */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Document Type</label>
              <div className="flex gap-3">
                {['aadhaar', 'pan'].map(t => (
                  <button key={t} onClick={() => setDocType(t)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${docType === t ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}>
                    {t === 'aadhaar' ? '🪪 Aadhaar Card' : '🧾 PAN Card'}
                  </button>
                ))}
              </div>
            </div>

            {/* Document upload */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">
                {docType === 'aadhaar' ? 'Aadhaar Card' : 'PAN Card'}
                <span className="text-muted-foreground font-normal ml-1">(JPG, PNG, PDF · max 3 MB)</span>
              </label>
              <DropZone
                label="Upload your document"
                accept="image/jpeg,image/png,application/pdf"
                maxMB={3}
                file={docFile}
                setFile={setDocFile}
                icon={FileText}
              />
            </div>

            {/* Selfie upload */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">
                Live Selfie
                <span className="text-muted-foreground font-normal ml-1">(JPG, PNG · max 2 MB)</span>
              </label>
              <DropZone
                label="Upload a clear selfie photo"
                accept="image/jpeg,image/png"
                maxMB={2}
                file={selfieFile}
                setFile={setSelfieFile}
                icon={Camera}
              />
            </div>

            {/* Consent */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded accent-yellow-500 shrink-0" />
              <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                I consent to identity verification and secure encrypted storage of my documents by SoulSathiya.
                My documents will never be shared with third parties.
              </span>
            </label>

            {/* Submit */}
            {optimising && (
              <div className="flex items-center gap-2 text-sm text-primary animate-pulse">
                <AlertCircle className="w-4 h-4" />
                Optimising your image for faster verification…
              </div>
            )}

            <Button
              onClick={handleSubmit}
              disabled={submitting || optimising || !docFile || !selfieFile || !consent}
              className="w-full h-12 text-base font-semibold"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Shield className="w-4 h-4" /> Submit for Verification
                </span>
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              🔒 256-bit encrypted upload · Reviewed by our trust & safety team within 24 hours
            </p>
          </div>
        )}

      </div>
    </div>
  );
}

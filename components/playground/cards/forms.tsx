import React, { useRef, useState } from 'react';
import { AlertCircle, Check, CheckCircle2, ChevronRight, Clock, FileText, Info, Lock, Search, Star, Upload } from 'lucide-react';
import { Button, Card, Divider, Field, Hint, Note, Progress, Segmented, Switch, Tag } from '../ui';

const sm = { className: 'ico s', strokeWidth: 1.8 } as const;

export const LoginCard: React.FC = () => (
  <Card title="Sign in">
    <h3>Sign in</h3><p className="sm muted mt-s">Use your work email.</p>
    <div className="col mt">
      <Field id="pg-login-email" label="Email" type="email" placeholder="you@company.com" />
      <div>
        <div className="row between"><label className="lbl" htmlFor="pg-login-pass">Password</label><a href="#" className="xs" style={{ color: 'var(--accent-text)' }} onClick={e => e.preventDefault()}>Forgot it?</a></div>
        <input id="pg-login-pass" className="field" type="password" defaultValue="password" aria-invalid="true" aria-describedby="pg-login-err" />
        <Hint tone="danger" id="pg-login-err"><AlertCircle {...sm} /> Incorrect password. 2 attempts left.</Hint>
      </div>
      <Button full>Sign in</Button>
      <Button full variant="line">Continue with Google</Button>
    </div>
  </Card>
);

export const PreferencesCard: React.FC = () => {
  const [saved, setSaved] = useState(false);
  return (
  <Card title="Notification preferences">
    <h3>Notifications</h3><p className="sm muted mt-s">Choose what we tell you about.</p>
    <div className="col mt">
      {[['Comments on my palettes', true], ['Weekly digest', true], ['Product news', false]].map(([label, on]) => (
        <label key={label as string} className="row between sm"><span>{label}</span><Switch defaultChecked={on as boolean} aria-label={label as string} /></label>
      ))}
    </div>
    <Divider />
    <label className="lbl" htmlFor="pg-pref-freq">Frequency</label>
    <select id="pg-pref-freq" className="field"><option>Instant</option><option>Daily</option></select>
    <div className="row mt" style={{ justifyContent: 'flex-end' }}>
      {saved && <Hint tone="success" style={{ margin: '0 auto 0 0' }} role="status"><Check {...sm} /> Saved</Hint>}
      <Button variant="ghost" onClick={() => setSaved(false)}>Cancel</Button><Button onClick={() => setSaved(true)}>Save changes</Button>
    </div>
  </Card>
  );
};

export const UploadCard: React.FC = () => (
  <Card title="File upload">
    <h3>Import palette</h3>
    <div className="drop mt">
      <span className="av" style={{ margin: '0 auto 8px' }}><Upload {...sm} /></span>
      <p className="sm"><b style={{ color: 'var(--accent-text)' }}>Choose a file</b> or drop it here</p>
      <p className="xs faint mt-s">.ase, .json or .css, up to 5 MB</p>
    </div>
    <div className="row mt">
      <span className="av" style={{ borderRadius: 'var(--r-sm)' }}><FileText {...sm} /></span>
      <div style={{ flex: 1 }}><p className="sm">brand-2026.json</p><Progress value={68} className="mt-s" /></div>
      <span className="xs muted">68%</span>
    </div>
    <div className="row mt">
      <span className="av" style={{ borderRadius: 'var(--r-sm)', background: 'var(--success-soft)', color: 'var(--on-success-soft)' }}><FileText {...sm} /></span>
      <div style={{ flex: 1 }}><p className="sm">ocean-dusk.ase</p><p className="xs muted">24 KB</p></div>
      <Tag tone="success"><Check {...sm} /> Uploaded</Tag>
    </div>
    <div className="row mt">
      <span className="av" style={{ borderRadius: 'var(--r-sm)', background: 'var(--danger-soft)', color: 'var(--on-danger-soft)' }}><FileText {...sm} /></span>
      <div style={{ flex: 1 }}><p className="sm">moodboard.psd</p><Hint tone="danger" style={{ marginTop: 2 }}>File type not supported</Hint></div>
      <Button variant="ghost" style={{ height: 30, fontSize: 12 }}>Remove</Button>
    </div>
  </Card>
);

export const FeedbackCard: React.FC = () => {
  const [rating, setRating] = useState(4);
  const [sent, setSent] = useState(false);
  return (
    <Card title="Feedback">
      <h3>How was the generation?</h3><p className="sm muted mt-s">Your rating trains Pigmento.</p>
      <div className="stars mt" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map(i => (
          <button key={i} type="button" role="radio" aria-checked={i <= rating} aria-label={`${i} stars`} className={i <= rating ? 'on' : undefined} onClick={() => setRating(i)}>
            <Star />
          </button>
        ))}
      </div>
      <textarea className="field mt" style={{ height: 76, padding: 10, resize: 'none' }} placeholder="Tell us more (optional)" aria-label="Comments" />
      {sent
        ? <Note tone="success" className="mt" icon={<CheckCircle2 {...sm} />}><b>Thanks!</b> Pigmento will use it on your next palette.</Note>
        : <Button full className="mt" onClick={() => setSent(true)}>Send feedback</Button>}
    </Card>
  );
};

export const PinCard: React.FC = () => {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const [filled, setFilled] = useState(0);
  const recount = () => setFilled(refs.current.filter(el => el?.value).length);
  return (
    <Card title="Verification code">
      <h3>Verify your email</h3><p className="sm muted mt-s">We sent a 4-digit code to ana@studio.es</p>
      <div className="pin mt">
        {[0, 1, 2, 3].map(i => (
          <input key={i} ref={el => { refs.current[i] = el; }} inputMode="numeric" maxLength={1} aria-label={`Digit ${i + 1}`}
            onInput={e => { const el = e.currentTarget; el.value = el.value.replace(/\D/g, ''); if (el.value) refs.current[i + 1]?.focus(); recount(); }}
            onKeyDown={e => { if (e.key === 'Backspace' && !e.currentTarget.value) refs.current[i - 1]?.focus(); }} />
        ))}
      </div>
      {filled === 4
        ? <Hint tone="success" role="status"><CheckCircle2 {...sm} /> Code accepted</Hint>
        : <Hint tone="info"><Info {...sm} /> The code expires in 10 minutes.</Hint>}
      <Button full className="mt" disabled={filled < 4}>Verify</Button>
      <p className="xs muted mt-s">Didn't get it? <a href="#" style={{ color: 'var(--accent-text)' }} onClick={e => e.preventDefault()}>Resend in 0:42</a></p>
    </Card>
  );
};

export const PaymentCard: React.FC = () => (
  <Card title="Payment method">
    <h3>Payment method</h3>
    <Segmented options={['Card', 'PayPal', 'Bizum']} className="mt" />
    <div className="col mt">
      <div>
        <Field id="pg-pay-num" label="Card number" className="mono" defaultValue="4242 4242 4242 4242" />
        <Hint tone="success"><CheckCircle2 {...sm} /> Visa ending 4242 verified</Hint>
      </div>
      <div className="row">
        <div style={{ flex: 1 }}><Field id="pg-pay-exp" label="Expiry" defaultValue="08/28" /></div>
        <div style={{ flex: 1 }}><Field id="pg-pay-cvc" label="CVC" placeholder="123" /></div>
      </div>
      <Note tone="info" icon={<Info {...sm} />}>You won't be charged until your trial ends on 30 October.</Note>
      <Button full><Lock {...sm} /> Pay €24.00</Button>
    </div>
  </Card>
);

export const SearchCard: React.FC = () => (
  <Card title="Search">
    <div className="row field" style={{ height: 44 }}>
      <Search {...sm} /><input style={{ border: 0, background: 'none', outline: 'none', flex: 1, color: 'var(--text)' }} placeholder="Search palettes, colors…" aria-label="Search" /><span className="kbd">⌘K</span>
    </div>
    <p className="xs faint mt">Recent</p>
    <div className="col mt-s">
      {['Ocean dusk', 'Soft terracotta', 'Fintech dark'].map(s => <div key={s} className="row sm"><Clock {...sm} /><span style={{ flex: 1 }}>{s}</span><ChevronRight {...sm} /></div>)}
    </div>
    <div className="row mt" style={{ flexWrap: 'wrap', gap: 6 }}><Tag tone="success"><Check {...sm} /> AA accessible</Tag><Tag>Monochrome</Tag><Tag>Pastel</Tag><Tag tone="info">New</Tag></div>
  </Card>
);

export const CookieConsentCard: React.FC = () => (
  <Card title="Cookie consent">
    <h3>We use cookies</h3><p className="sm muted mt-s">Essential ones keep you signed in. Analytics help us improve; you can turn them off.</p>
    <div className="col mt">
      <label className="row between sm"><span>Essential</span><Switch defaultChecked disabled aria-label="Essential cookies" /></label>
      <label className="row between sm"><span>Analytics</span><Switch aria-label="Analytics cookies" /></label>
    </div>
    <div className="row mt"><Button variant="ghost" style={{ flex: 1 }}>Essential only</Button><Button style={{ flex: 1 }}>Accept all</Button></div>
  </Card>
);

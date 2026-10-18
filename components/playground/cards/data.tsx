import React, { useState } from 'react';
import { AlertTriangle, Battery, ChevronLeft, ChevronRight, Cloud, Droplets, Flame, Footprints, Sun, TrendingUp, Wifi, Wind } from 'lucide-react';
import { Button, Card, Divider, Hint, Note, Progress, Segmented, Stat, Tag } from '../ui';

const sm = { className: 'ico s', strokeWidth: 1.8 } as const;

export const StatsCard: React.FC = () => (
  <Card title="Metrics">
    <div className="row between"><p className="sm muted">Palettes exported</p><Tag tone="success">+18.2%</Tag></div>
    <Stat className="mt-s">12,840</Stat>
    <div className="bars mt" aria-hidden>{[40, 55, 35, 70, 60, 85, 95].map((v, i) => <i key={i} className={i === 6 ? 'hi' : undefined} style={{ height: `${v}%` }} />)}</div>
    <div className="row between xs faint mt-s">{['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <span key={i}>{d}</span>)}</div>
  </Card>
);

export const SalesCard: React.FC = () => (
  <Card title="Revenue">
    <div className="row between"><h3>Revenue</h3><Segmented options={['7d', '30d']} defaultValue="30d" style={{ width: 'auto' }} /></div>
    <Stat className="mt">€48,320</Stat><p className="xs muted"><span className="up"><TrendingUp {...sm} style={{ verticalAlign: '-3px' }} /> +15.3%</span> vs €41,900 last month</p>
    <svg viewBox="0 0 280 70" className="mt" style={{ width: '100%', height: 70 }} aria-hidden>
      <polyline fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinejoin="round" points="0,55 40,48 80,52 120,30 160,36 200,18 240,24 280,8" />
      <polyline fill="none" stroke="var(--border-strong)" strokeWidth="1.5" strokeDasharray="4 4" points="0,60 40,58 80,50 120,48 160,44 200,40 240,38 280,34" />
    </svg>
    <div className="row sm mt-s">
      <span className="row" style={{ gap: 6 }}><i style={{ width: 10, height: 3, background: 'var(--accent)', borderRadius: 2 }} />This month</span>
      <span className="row muted" style={{ gap: 6 }}><i style={{ width: 10, height: 3, background: 'var(--border-strong)', borderRadius: 2 }} />Previous</span>
    </div>
  </Card>
);

export const StorageCard: React.FC = () => (
  <Card title="Storage">
    <div className="row between"><h3>Storage</h3><Tag tone="warning">74% used</Tag></div>
    <p className="sm muted mt-s">7.4 of 10 GB</p>
    <div className="bar-t mt" style={{ height: 10, display: 'flex' }} aria-hidden>
      <i style={{ width: '44%' }} /><i style={{ width: '18%', background: 'var(--info)', borderRadius: 0 }} /><i style={{ width: '12%', background: 'var(--warning)', borderRadius: 0 }} />
    </div>
    <div className="col mt sm">
      {[['var(--accent)', 'Palettes', '4.4 GB'], ['var(--info)', 'Images', '1.8 GB'], ['var(--warning)', 'Exports', '1.2 GB']].map(([c, l, v]) => (
        <div key={l} className="row"><i style={{ width: 8, height: 8, borderRadius: '50%', background: c }} /><span style={{ flex: 1 }}>{l}</span><span className="muted">{v}</span></div>
      ))}
    </div>
    <Hint tone="warning"><AlertTriangle {...sm} /> At this pace you'll run out in about 3 weeks.</Hint>
    <Button variant="soft" full className="mt">Upgrade plan</Button>
  </Card>
);

export const WeatherCard: React.FC = () => (
  <Card title="Weather">
    <div className="row between">
      <div><p className="sm muted">Madrid</p><Stat style={{ fontSize: 44 }}>23°</Stat><p className="sm">Partly cloudy</p><Tag tone="warning" className="mt-s">UV index 8 · High</Tag></div>
      <Sun strokeWidth={1.5} style={{ width: 56, height: 56, color: 'var(--warning)' }} aria-hidden />
    </div>
    <div className="row between mt sm muted">
      <span className="row" style={{ gap: 4 }}><Droplets {...sm} />12%</span>
      <span className="row" style={{ gap: 4 }}><Wind {...sm} />9 km/h</span>
      <span>H 26° · L 14°</span>
    </div>
    <Divider />
    <div className="row between sm" style={{ textAlign: 'center' }}>
      {[['Fri', 24, false], ['Sat', 21, false], ['Sun', 19, true], ['Mon', 22, false]].map(([d, t, cloudy]) => (
        <div key={d as string} className="col" style={{ gap: 4, alignItems: 'center' }}><span className="muted">{d}</span>{cloudy ? <Cloud {...sm} /> : <Sun {...sm} />}<b>{t}°</b></div>
      ))}
    </div>
  </Card>
);

export const CalendarCard: React.FC = () => {
  const [day, setDay] = useState(16);
  return (
    <Card title="Calendar">
      <div className="row between">
        <h3>October 2026</h3>
        <div className="row" style={{ gap: 4 }}>
          <Button variant="plain" icon style={{ height: 30, width: 30 }} aria-label="Previous month"><ChevronLeft {...sm} /></Button>
          <Button variant="plain" icon style={{ height: 30, width: 30 }} aria-label="Next month"><ChevronRight {...sm} /></Button>
        </div>
      </div>
      <div className="cal mt" role="grid">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <b key={i}>{d}</b>)}
        {[28, 29, 30].map(d => <button key={`p${d}`} type="button" className="out" tabIndex={-1}>{d}</button>)}
        {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
          <button key={d} type="button" aria-pressed={d === day} className={d === day ? 'on' : d > day && d < day + 5 ? 'range' : undefined} onClick={() => setDay(d)}>{d}</button>
        ))}
      </div>
    </Card>
  );
};

export const WorkoutCard: React.FC = () => (
  <Card title="Workout">
    <div className="row between"><h3>Today</h3><Tag tone="warning"><Flame {...sm} /> 5-day streak</Tag></div>
    <div className="row mt" style={{ gap: 16 }}>
      <div className="dial" style={{ '--v': 72 } as React.CSSProperties} role="img" aria-label="72% of daily goal"><div><b>72%</b></div></div>
      <div className="col sm" style={{ gap: 6 }}>
        <div><span className="muted">Calories</span><br /><b>520</b> / 720 kcal</div>
        <div><span className="muted">Active</span><br /><b>48</b> min</div>
      </div>
    </div>
    <Button full className="mt">Start session</Button>
  </Card>
);

export const StepsCard: React.FC = () => (
  <Card title="Steps">
    <div className="row"><span className="av"><Footprints {...sm} /></span><div><h3>8,204 steps</h3><p className="xs muted">Goal 10,000</p></div></div>
    <Progress value={82} className="mt" style={{ height: 8 }} />
    <div className="row between mt sm panel">
      <div><p className="muted xs">Distance</p><b>6.1 km</b></div>
      <div><p className="muted xs">Time</p><b>1 h 12</b></div>
      <div><p className="muted xs">Pace</p><b>11'48"</b></div>
    </div>
  </Card>
);

export const DroneMonitorCard: React.FC = () => (
  <Card title="Drone monitor">
    <div className="row between"><h3>Unit DX-04</h3><Tag tone="success"><span className="dot success" /> In flight</Tag></div>
    <div className="drone mt" role="img" aria-label="Live camera feed">
      <span className="mono" style={{ position: 'absolute', left: 8, top: 6, color: 'var(--p-200)' }}>REC 00:14:22</span>
      <span className="mono" style={{ position: 'absolute', right: 8, bottom: 6, color: 'var(--p-200)' }}>ALT 82 m</span>
    </div>
    <div className="row between mt sm">
      <span className="row" style={{ gap: 4 }}><Battery {...sm} /> 64%</span>
      <span className="row" style={{ gap: 4 }}><Wifi {...sm} /> Strong</span>
      <span className="muted">40.4168° N</span>
    </div>
    <Note tone="danger" className="mt" icon={<AlertTriangle {...sm} />}><b>Wind gusts 42 km/h.</b> Return to base recommended.</Note>
  </Card>
);

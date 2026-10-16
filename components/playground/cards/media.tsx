import React, { useState } from 'react';
import { Heart, MessageCircle, Mic, MoreHorizontal, Pause, Phone, Play, Share2, SkipBack, SkipForward, Video } from 'lucide-react';
import * as Slider from '@radix-ui/react-slider';
import { Avatar, Button, Card, Hero, Progress, Tag } from '../ui';

const ico = { className: 'ico', strokeWidth: 1.8 } as const;
const sm = { className: 'ico s', strokeWidth: 1.8 } as const;

const LikeButton: React.FC = () => {
  const [on, setOn] = useState(false);
  return (
    <Button variant="ghost" icon aria-pressed={on} aria-label="Like" onClick={() => setOn(v => !v)} style={{ color: on ? 'var(--danger)' : undefined }}>
      <Heart {...ico} fill={on ? 'currentColor' : 'none'} />
    </Button>
  );
};

export const MusicPlayerCard: React.FC = () => {
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState([40]);
  return (
    <Card title="Music player">
      <Hero ratio="1.6" photo="vinyl record album cover" style={{ margin: '-6px -6px 14px' }} />
      <div className="row between">
        <div><h3>Midnight Static</h3><p className="sm muted">Lumen Avenue</p></div>
        <LikeButton />
      </div>
      <Progress value={42} className="mt" />
      <div className="row between xs faint mt-s"><span>1:38</span><span>3:52</span></div>
      <div className="row mt" style={{ justifyContent: 'center', gap: 14 }}>
        <Button variant="ghost" icon aria-label="Previous"><SkipBack {...sm} /></Button>
        <Button icon aria-label={playing ? 'Pause' : 'Play'} onClick={() => setPlaying(v => !v)} style={{ width: 48, height: 48, borderRadius: '50%' }}>
          {playing ? <Pause {...ico} /> : <Play {...ico} />}
        </Button>
        <Button variant="ghost" icon aria-label="Next"><SkipForward {...sm} /></Button>
      </div>
      <Slider.Root className="row mt" value={volume} onValueChange={setVolume} max={100} aria-label="Volume" style={{ position: 'relative', height: 20 }}>
        <Slider.Track className="bar-t" style={{ flex: 1 }}><Slider.Range asChild><i /></Slider.Range></Slider.Track>
        <Slider.Thumb style={{ display: 'block', width: 16, height: 16, borderRadius: '50%', background: 'var(--surface)', border: '2px solid var(--accent)' }} />
      </Slider.Root>
    </Card>
  );
};

export const VideoCard: React.FC = () => (
  <Card title="Video">
    <Hero photo="designer color swatches desk" style={{ display: 'grid', placeItems: 'center' }}>
      <span className="btn icon" style={{ width: 52, height: 52, borderRadius: '50%', zIndex: 1, position: 'relative' }}><Play {...ico} /></span>
    </Hero>
    <h3 className="mt">Designing perceptual color scales</h3>
    <div className="row mt-s sm muted"><Avatar initials="IR" style={{ width: 24, height: 24, fontSize: 10 }} />Inés Rubio · 12 min</div>
    <div className="row mt"><Tag>Tutorial</Tag><Tag tone="info">New</Tag><Tag tone="success">Free</Tag></div>
  </Card>
);

export const SocialPostCard: React.FC = () => (
  <Card title="Social post">
    <div className="row">
      <Avatar initials="LS" />
      <div style={{ flex: 1 }}><h3 style={{ fontSize: 14 }}>lucia.studio</h3><p className="xs muted">Valencia</p></div>
      <MoreHorizontal {...sm} />
    </div>
    <Hero ratio="1" photo="colorful street mural" className="mt" style={{ marginInline: -18, borderRadius: 0 }} />
    <div className="row mt">
      <LikeButton />
      <Button variant="ghost" icon aria-label="Comment"><MessageCircle {...ico} /></Button>
      <Button variant="ghost" icon aria-label="Share"><Share2 {...ico} /></Button>
    </div>
    <p className="sm mt-s"><b>2,481 likes</b> · <span className="muted">New mural series in El Cabanyal</span></p>
    <p className="xs mt-s up">+312 since yesterday</p>
  </Card>
);

export const VideoCallCard: React.FC = () => (
  <Card title="Video call">
    <div className="row between"><h3>Design review</h3><Tag tone="danger">● 24:10</Tag></div>
    <div className="vc mt">
      {[['AM', 'Ana', true], ['JP', 'Jorge'], ['SL', 'Sara'], ['You', 'You']].map(([i, n, talk]) => (
        <div key={n as string} className={talk ? 'talk' : undefined}><Avatar initials={i as string} /><span>{n}</span></div>
      ))}
    </div>
    <div className="row mt" style={{ justifyContent: 'center' }}>
      <Button variant="ghost" icon aria-label="Microphone"><Mic {...sm} /></Button>
      <Button variant="ghost" icon aria-label="Camera"><Video {...sm} /></Button>
      <Button style={{ background: 'var(--danger)', color: 'var(--n-50)' }}><Phone {...sm} /> Leave</Button>
    </div>
  </Card>
);

import React, { useState } from 'react';
import { AlertTriangle, Clock, Mail, MapPin, Phone, Plane, Send, ShoppingCart, Star, Wifi } from 'lucide-react';
import { Avatar, Button, Card, Divider, Hero, Note, Stat, Tag } from '../ui';

const sm = { className: 'ico s', strokeWidth: 1.8 } as const;
const ico = { className: 'ico', strokeWidth: 1.8 } as const;

export const ChatCard: React.FC = () => (
  <Card title="Chat">
    <div className="row"><Avatar initials="MR" /><div style={{ flex: 1 }}><h3 style={{ fontSize: 14 }}>Marta Ríos</h3><p className="xs row" style={{ gap: 5, color: 'var(--success-text)' }}><span className="dot success" />Online</p></div><Phone {...sm} /></div>
    <Divider />
    <div className="col" style={{ gap: 6 }}>
      <div className="bubble in">Did you see the new palette?</div>
      <div className="bubble out">Yes, the 600 looks great on buttons</div>
      <div className="bubble in">Let's try dark mode tomorrow</div>
    </div>
    <div className="row mt"><input className="field" placeholder="Write a message" aria-label="Message" /><Button icon aria-label="Send"><Send {...sm} /></Button></div>
  </Card>
);

export const ProfileCard: React.FC = () => {
  const [following, setFollowing] = useState(false);
  return (
    <Card title="Profile">
      <Hero photo="abstract colorful paint texture" style={{ height: 70, margin: '-18px -18px 0', borderRadius: 0, aspectRatio: 'auto' }} />
      <Avatar initials="CV" size="lg" style={{ marginTop: -28, border: '3px solid var(--surface)' }} />
      <h3 className="mt-s">Carla Vidal</h3><p className="sm muted">Product designer at Lumen</p>
      <div className="row between mt sm" style={{ textAlign: 'center' }}>
        <div><b>128</b><p className="xs muted">Palettes</p></div><div><b>4.2k</b><p className="xs muted">Followers</p></div><div><b>310</b><p className="xs muted">Following</p></div>
      </div>
      <div className="row mt"><Button variant={following ? 'ghost' : 'primary'} style={{ flex: 1 }} aria-pressed={following} onClick={() => setFollowing(v => !v)}>{following ? 'Following' : 'Follow'}</Button><Button variant="ghost" icon aria-label="Message"><Mail {...sm} /></Button></div>
    </Card>
  );
};

export const ContactCard: React.FC = () => (
  <Card title="Contact">
    <div className="row"><Avatar initials="DG" size="lg" /><div><h3>Daniel García</h3><p className="sm muted">Head of Brand</p><Tag className="mt-s">Client</Tag></div></div>
    <div className="col mt sm">
      <div className="row"><Mail {...sm} /><span>daniel@nortestudio.es</span></div>
      <div className="row"><Phone {...sm} /><span>+34 612 448 920</span></div>
      <div className="row"><MapPin {...sm} /><span>Bilbao</span></div>
    </div>
    <div className="row mt"><Button variant="line" style={{ flex: 1 }}>Call</Button><Button style={{ flex: 1 }}>Message</Button></div>
  </Card>
);

export const CandidatesCard: React.FC = () => (
  <Card title="Candidates">
    <div className="row between"><h3>Candidates</h3><span className="sm muted">3 of 24</span></div>
    <div className="col mt">
      {([['PL', 'Pablo León', 'UI Designer', 'Interview', 'info'], ['NM', 'Noa Martín', 'Front-end', 'Offer', 'success'], ['ER', 'Elena Ruiz', 'UX Research', 'Review', 'warning']] as const).map(([a, n, r, s, t]) => (
        <div key={n} className="row"><Avatar initials={a} /><div style={{ flex: 1 }}><p className="sm"><b>{n}</b></p><p className="xs muted">{r}</p></div><Tag tone={t}>{s}</Tag></div>
      ))}
    </div>
    <Button variant="ghost" full className="mt">See all</Button>
  </Card>
);

export const ProductCard: React.FC = () => (
  <Card title="Product">
    <Hero ratio="4/3" photo="minimal desk lamp" />
    <div className="row between mt"><div className="row" style={{ gap: 6 }}><Tag>Limited edition</Tag><Tag tone="warning">Only 3 left</Tag></div><span className="row sm" style={{ gap: 3, color: 'var(--warning)' }}><Star {...sm} fill="currentColor" /><span style={{ color: 'var(--text)' }}>4.8</span></span></div>
    <h3 className="mt-s">Halo lamp</h3><p className="sm muted">Anodised aluminium, dimmable warm light</p>
    <div className="row between mt"><Stat style={{ fontSize: 22 }}>€129</Stat><Button><ShoppingCart {...sm} /> Add</Button></div>
  </Card>
);

const QtyRow: React.FC<{ name: string; photo: string; price: number; initial: number }> = ({ name, photo, price, initial }) => {
  const [q, setQ] = useState(initial);
  return (
    <div className="row">
      <Hero photo={photo} thumb orientation="square" style={{ width: 48, height: 48, flex: 'none', aspectRatio: 'auto' }} />
      <div style={{ flex: 1 }}><p className="sm"><b>{name}</b></p><p className="xs muted">€{price.toFixed(2)}</p></div>
      <div className="row" style={{ gap: 6 }}>
        <Button variant="ghost" icon style={{ width: 28, height: 28 }} aria-label={`Remove one ${name}`} onClick={() => setQ(v => Math.max(0, v - 1))}>−</Button>
        <b className="sm" aria-live="polite">{q}</b>
        <Button variant="ghost" icon style={{ width: 28, height: 28 }} aria-label={`Add one ${name}`} onClick={() => setQ(v => v + 1)}>+</Button>
      </div>
    </div>
  );
};

export const FoodOrderCard: React.FC = () => (
  <Card title="Food order">
    <div className="row between"><h3>Your order</h3><Tag tone="success"><Clock {...sm} /> 25 min</Tag></div>
    <div className="col mt"><QtyRow name="Salmon poke" photo="salmon poke bowl" price={12.5} initial={1} /><QtyRow name="Gyozas" photo="gyoza dumplings" price={6.9} initial={2} /></div>
    <Divider />
    <div className="row between sm"><span className="muted">Promo SPRING10</span><b className="up">−€2.63</b></div>
    <div className="row between mt-s"><span className="muted">Total</span><b>€23.67</b></div>
    <Button full className="mt">Confirm order</Button>
  </Card>
);

export const CreditCardCard: React.FC = () => (
  <Card title="Bank card">
    <div className="cc">
      <div className="row between"><b>Chroma Bank</b><Wifi {...ico} /></div>
      <div><p className="mono" style={{ fontSize: 16, letterSpacing: '.08em' }}>•••• •••• •••• 4417</p><div className="row between mt-s xs"><span>ANA MARTÍN</span><span>08/28</span></div></div>
    </div>
    <div className="row between mt"><div><p className="xs muted">Available balance</p><Stat style={{ fontSize: 22 }}>€3,240.18</Stat></div><Button variant="soft">Freeze</Button></div>
    <div className="col mt sm" style={{ gap: 8 }}>
      <div className="row"><span style={{ flex: 1 }}>Mercado Central</span><span className="down">−€18.40</span></div>
      <div className="row"><span style={{ flex: 1 }}>Salary · Lumen SL</span><span className="up">+€2,150.00</span></div>
      <div className="row"><span style={{ flex: 1 }}>Spotify</span><Tag tone="warning">Pending</Tag></div>
    </div>
  </Card>
);

export const BoardingPassCard: React.FC = () => (
  <Card title="Boarding pass">
    <div className="row between sm"><b style={{ color: 'var(--accent-text)' }}>Chroma Air</b><Tag tone="success">On time</Tag></div>
    <div className="ticket mt">
      <div><p className="iata">MAD</p><p className="xs muted">Madrid · 07:40</p></div>
      <Plane {...ico} style={{ color: 'var(--accent-text)' }} />
      <div><p className="iata">LIS</p><p className="xs muted">Lisbon · 07:55</p></div>
    </div>
    <div className="perf" aria-hidden />
    <div className="row between sm">
      <div><p className="xs muted">Gate</p><b style={{ color: 'var(--warning-text)' }}>K48</b></div><div><p className="xs muted">Seat</p><b>14A</b></div><div><p className="xs muted">Group</p><b>2</b></div><div><p className="xs muted">Boarding</p><b>07:10</b></div>
    </div>
    <Note tone="warning" className="mt" icon={<AlertTriangle {...sm} />}><b>Gate changed</b> from K42 to K48.</Note>
  </Card>
);

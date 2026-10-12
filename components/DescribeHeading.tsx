import React, { useEffect, useState } from 'react';

const WORDS = [
  'a palette',
  'a brand',
  'a mood',
  'a landscape',
  'a food',
  'a product',
  'a city',
  'a season',
  'a material',
  'a film',
];

const HOLD_MS = 1500;
const MOVE_MS = 160;

const useReducedMotion = () => {
  const [reduce, setReduce] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduce(media.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  return reduce;
};

const DescribeHeading: React.FC = () => {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (reduce) return;
    const timer = window.setTimeout(() => {
      if (leaving) {
        setIndex((value) => (value + 1) % WORDS.length);
        setLeaving(false);
        return;
      }
      setLeaving(true);
    }, leaving ? MOVE_MS : HOLD_MS);
    return () => window.clearTimeout(timer);
  }, [reduce, leaving, index]);

  const word = reduce ? WORDS[0] : WORDS[index];

  return (
    <h2 className="text-center text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
      Describe{' '}
      <span className="inline-grid overflow-hidden align-bottom">
        <span
          key={reduce ? 'still' : `${index}-${leaving ? 'out' : 'in'}`}
          className={`whitespace-nowrap ${reduce ? '' : leaving ? 'describe-word-out' : 'describe-word-in'}`}
        >
          {word}
        </span>
      </span>
    </h2>
  );
};

export default DescribeHeading;

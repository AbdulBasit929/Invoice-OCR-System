// src/components/AnimatedCounter.jsx
import { useEffect, useState } from 'react';
import { Typography, Box } from '@mui/material';

const AnimatedCounter = ({ end, suffix = '', duration = 2000 }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start > end) {
        setCount(end);
        clearInterval(timer);
      } else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [end, duration]);

  return (
    <Typography variant="h3" component="span" fontWeight={900}>
      {count.toLocaleString()}{suffix}
    </Typography>
  );
};

export default AnimatedCounter;
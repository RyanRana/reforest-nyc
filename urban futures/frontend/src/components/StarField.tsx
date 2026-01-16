import React, { useMemo } from 'react';
import './StarField.css';

interface StarFieldProps {
  size?: number;
  width?: number;
  height?: number;
}

const StarField: React.FC<StarFieldProps> = ({
  size = 1024,
  width = 3840,
  height = 3840
}) => {
  const random = (max: number) => Math.floor(Math.random() * max);

  const smallStars = useMemo(() => {
    return Array.from({ length: size }, () => {
      return `${random(width)}px ${random(height)}px #FFF, ${random(width)}px ${random(height)}px #FFF`;
    });
  }, [size, width, height]);

  const mediumStars = useMemo(() => {
    return Array.from({ length: size / 2 }, () => {
      return `${random(width)}px ${random(height)}px #FFF, ${random(width)}px ${random(height)}px #FFF`;
    });
  }, [size, width, height]);

  const largeStars = useMemo(() => {
    return Array.from({ length: size / 4 }, () => {
      return `${random(width)}px ${random(height)}px #FFF, ${random(width)}px ${random(height)}px #FFF`;
    });
  }, [size, width, height]);

  return (
    <div className="star-field">
      <div
        className="star-field__small"
        style={{ boxShadow: smallStars.join(',') }}
      />
      <div
        className="star-field__medium"
        style={{ boxShadow: mediumStars.join(',') }}
      />
      <div
        className="star-field__large"
        style={{ boxShadow: largeStars.join(',') }}
      />
    </div>
  );
};

export default StarField;


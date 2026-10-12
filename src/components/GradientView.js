import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * Cross-platform Gradient Container
 * Supports light sunset sunrise gradients, cards, and buttons.
 */
export default function GradientView({
  colors = ['#34D399', '#059669'],
  start = { x: 0, y: 0 },
  end = { x: 1, y: 0 },
  style,
  children,
  ...props
}) {
  return (
    <LinearGradient
      colors={colors}
      start={start}
      end={end}
      style={style}
      {...props}
    >
      {children}
    </LinearGradient>
  );
}

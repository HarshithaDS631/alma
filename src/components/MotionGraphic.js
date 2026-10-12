import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, TouchableOpacity } from 'react-native';

const isWeb = Platform.OS === 'web';
const nativeDriver = !isWeb;

/**
 * FloatingElement
 * Continuously floats up and down gently (2-4px) with smooth sinusoidal easing.
 * Adds a living motion graphic effect to mascots, hero icons, and badge tags.
 */
export function FloatingElement({ 
  children, 
  distance = 3, 
  duration = 2400, 
  delay = 0, 
  style, 
  ...rest 
}) {
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let isMounted = true;
    const timeout = setTimeout(() => {
      if (!isMounted) return;
      Animated.loop(
        Animated.sequence([
          Animated.timing(translateY, {
            toValue: -distance,
            duration: duration / 2,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: nativeDriver,
          }),
          Animated.timing(translateY, {
            toValue: distance,
            duration: duration / 2,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: nativeDriver,
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: duration / 4,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: nativeDriver,
          }),
        ])
      ).start();
    }, delay);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
      translateY.stopAnimation();
    };
  }, [distance, duration, delay, translateY]);

  return (
    <Animated.View style={[{ transform: [{ translateY }] }, style]} {...rest}>
      {children}
    </Animated.View>
  );
}

/**
 * PulseElement
 * Gentle breathing scale pulse (1.0 to 1.05).
 * Ideal for notification dots, CTA buttons, and highlighted chips.
 */
export function PulseElement({ 
  children, 
  minScale = 0.96, 
  maxScale = 1.05, 
  duration = 2000, 
  delay = 0, 
  style, 
  ...rest 
}) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let isMounted = true;
    const timeout = setTimeout(() => {
      if (!isMounted) return;
      Animated.loop(
        Animated.sequence([
          Animated.timing(scale, {
            toValue: maxScale,
            duration: duration / 2,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: nativeDriver,
          }),
          Animated.timing(scale, {
            toValue: minScale,
            duration: duration / 2,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: nativeDriver,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: duration / 4,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: nativeDriver,
          }),
        ])
      ).start();
    }, delay);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
      scale.stopAnimation();
    };
  }, [minScale, maxScale, duration, delay, scale]);

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]} {...rest}>
      {children}
    </Animated.View>
  );
}

/**
 * MotionPod
 * Combines gentle ambient floating with responsive spring-bounce feedback on press.
 */
export function MotionPod({ 
  children, 
  floating = true, 
  floatDistance = 2.5, 
  style, 
  ...rest 
}) {
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!floating) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: -floatDistance,
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: nativeDriver,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: nativeDriver,
        }),
      ])
    );
    anim.start();

    return () => {
      anim.stop();
      translateY.stopAnimation();
    };
  }, [floating, floatDistance, translateY]);

  return (
    <Animated.View 
      style={[
        { transform: [{ translateY }, { scale }] }, 
        style
      ]} 
      {...rest}
    >
      {children}
    </Animated.View>
  );
}

/**
 * SpringPressable
 * Micro-interaction wrapper that compresses slightly on press-in and springs back with overshoot on release.
 */
export function SpringPressable({ 
  children, 
  onPress, 
  scaleTo = 0.95, 
  style, 
  disabled,
  activeOpacity = 0.85,
  ...rest 
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: scaleTo,
      tension: 160,
      friction: 10,
      useNativeDriver: nativeDriver,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      tension: 140,
      friction: 8,
      useNativeDriver: nativeDriver,
    }).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={activeOpacity}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      {...rest}
    >
      <Animated.View style={[{ transform: [{ scale }] }, style]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
}

export default {
  FloatingElement,
  PulseElement,
  MotionPod,
  SpringPressable,
};

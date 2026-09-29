import Ionicons from '@expo/vector-icons/Ionicons';
import * as SplashScreen from 'expo-splash-screen';
import { useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

const INITIAL_SCALE_FACTOR = Dimensions.get('screen').height / 90;
// Duración total de la bienvenida: entra suave, se queda visible un rato,
// sale suave — unos 3 segundos en total, como pidió Danny.
const DURATION = 3000;
const COLOR_FONDO = '#0284C7';

export function AnimatedSplashOverlay() {
  const [animate, setAnimate] = useState(false);
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const splashKeyframe = new Keyframe({
    0: {
      transform: [{ scale: 0.9 }],
      opacity: 0,
    },
    15: {
      transform: [{ scale: 1 }],
      opacity: 1,
      easing: Easing.out(Easing.cubic),
    },
    78: {
      opacity: 1,
    },
    100: {
      opacity: 0,
      transform: [{ scale: 1.04 }],
      easing: Easing.inOut(Easing.cubic),
    },
  });

  const marca = (
    <View style={styles.marca}>
      <View style={styles.iconoWrap}>
        <Ionicons name="barbell" size={38} color="#ffffff" />
      </View>
      <Text style={styles.titulo}>GymPro</Text>
      <Text style={styles.subtitulo}>Powered by SPI Solutions</Text>
    </View>
  );

  return animate ? (
    <Animated.View
      entering={splashKeyframe.duration(DURATION).withCallback((finished) => {
        'worklet';
        if (finished) {
          scheduleOnRN(setVisible, false);
        }
      })}
      style={styles.splashOverlay}>
      {marca}
    </Animated.View>
  ) : (
    <View
      onLayout={() => {
        SplashScreen.hideAsync().finally(() => {
          setAnimate(true);
        });
      }}
      style={styles.splashOverlay}>
      {marca}
    </View>
  );
}

const keyframe = new Keyframe({
  0: {
    transform: [{ scale: INITIAL_SCALE_FACTOR }],
  },
  100: {
    transform: [{ scale: 1 }],
    easing: Easing.elastic(0.7),
  },
});

const logoKeyframe = new Keyframe({
  0: {
    transform: [{ scale: 1.3 }],
    opacity: 0,
  },
  40: {
    transform: [{ scale: 1.3 }],
    opacity: 0,
    easing: Easing.elastic(0.7),
  },
  100: {
    opacity: 1,
    transform: [{ scale: 1 }],
    easing: Easing.elastic(0.7),
  },
});

const glowKeyframe = new Keyframe({
  0: {
    transform: [{ rotateZ: '0deg' }],
  },
  100: {
    transform: [{ rotateZ: '7200deg' }],
  },
});

export function AnimatedIcon() {
  return (
    <View style={styles.iconContainer}>
      <Animated.View entering={glowKeyframe.duration(60 * 1000 * 4)} style={styles.glow} />
      <Animated.View entering={keyframe.duration(600)} style={styles.background} />
      <Animated.View style={styles.imageContainer} entering={logoKeyframe.duration(600)}>
        <Ionicons name="barbell" size={48} color="#ffffff" />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  splashOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: COLOR_FONDO,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  marca: {
    alignItems: 'center',
    gap: 10,
  },
  iconoWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  titulo: {
    fontSize: 34,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  subtitulo: {
    fontSize: 12.5,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.78)',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    width: 201,
    height: 201,
    position: 'absolute',
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 128,
    height: 128,
    zIndex: 100,
  },
  background: {
    borderRadius: 40,
    backgroundColor: COLOR_FONDO,
    width: 128,
    height: 128,
    position: 'absolute',
  },
});

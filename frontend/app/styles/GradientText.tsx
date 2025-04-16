import React from 'react';
import { Text } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../styles/theme';

interface GradientTextProps {
  text: string;
  style?: any;
  colors?: readonly [string, string, ...string[]];
}

const GradientText = ({ 
  text, 
  style, 
  colors = [COLORS.primary, COLORS.secondary] as const
}: GradientTextProps) => {
  return (
    <MaskedView
      maskElement={<Text style={style}>{text}</Text>}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text style={[style, { opacity: 0 }]}>{text}</Text>
      </LinearGradient>
    </MaskedView>
  );
};

export default GradientText;
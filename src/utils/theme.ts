import React from 'react';
import {
  Appearance,
  AppearancePreferences,
  ColorSchemeName,
} from 'react-native-appearance';
import {API} from './../refactored-services';
import {StorageKeys} from './../refactored-services/storage.service';

export type Mapping = 'eva' | 'material';
export type Theme = 'light' | 'dark' | 'brand' | 'no-preference';

export interface MappingContextValue {
  currentMapping: Mapping;
  setCurrentMapping: (mapping: Mapping) => Promise<void> | void;
  isEva: () => boolean;
}

export interface ThemeContextValue {
  currentTheme: Theme;
  setCurrentTheme: (theme: Theme) => void;
  isDarkMode: () => boolean;
  createTheme: (upstearmTheme: Theme) => void;
}

const defaultMappingContexValue: MappingContextValue = {
  currentMapping: 'eva',
  setCurrentMapping: () => {},
  isEva: () => true,
};

const defaultThemeContextValue: ThemeContextValue = {
  currentTheme: 'light',
  setCurrentTheme: (_theme: Theme) => {},
  isDarkMode: () => false,
  createTheme: (_theme: Theme) => {},
};

export const MappingContext = React.createContext<MappingContextValue>(
  defaultMappingContexValue,
);
export const ThemeContext = React.createContext<ThemeContextValue>(
  defaultThemeContextValue,
);

export function useMapping(mappings: any, mapping: Mapping) {
  const setCurrentMapping = (nextMapping: Mapping) =>
    API.storage.saveToStorage(StorageKeys.MAPPING_KEY, nextMapping);

  const isEva = () => mapping === 'eva';
  const mappingContext: MappingContextValue = {
    currentMapping: mapping,
    setCurrentMapping,
    isEva,
  };

  return [mappingContext, mappings[mapping]];
}

export function useTheming(
  themes: Record<Mapping, Record<Theme, any>> | any,
  mapping: Mapping,
  theme: Theme,
): [ThemeContextValue, any] {
  const [currentTheme, setCurrentTheme] = React.useState<Theme>(theme);

  React.useEffect(() => {
    const subscription = Appearance.addChangeListener(
      (preferences: AppearancePreferences): void => {
        const appearanceTheme: Theme = createAppearanceTheme(
          preferences.colorScheme,
          theme,
        );
        setCurrentTheme(appearanceTheme);
      },
    );

    return () => subscription.remove();
  }, [theme]);

  const isDarkMode = (): boolean => {
    return currentTheme === 'dark';
  };

  const createTheme = (upstreamTheme: Theme): any => {
    return {
      ...themes[mapping][currentTheme],
      ...themes[mapping][upstreamTheme][currentTheme],
    };
  };

  const themeContext: ThemeContextValue = {
    currentTheme,
    setCurrentTheme: nextTheme => {
      API.storage.saveToStorage(StorageKeys.MAPPING_KEY, nextTheme);
      setCurrentTheme(nextTheme);
    },
    isDarkMode,
    createTheme,
  };

  return [themeContext, themes[mapping][currentTheme]];
}

export function useTheme(uptreameTheme: Theme) {
  const themeContext = React.useContext(ThemeContext);
  if (!themeContext.createTheme) {
    return;
  }
  return themeContext.createTheme(uptreameTheme);
}

function createAppearanceTheme(
  appearance: ColorSchemeName,
  preffredTmeme: Theme,
) {
  if (!appearance) {
    return preffredTmeme;
  }
  return appearance;
}

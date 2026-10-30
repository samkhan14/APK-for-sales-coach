import { useColorScheme } from "react-native";
import { useContext } from "react";
import colors from "@/constants/colors";
import { AppContext } from "@/contexts/AppContext";

export function useColors() {
  const scheme = useColorScheme();
  const appCtx = useContext(AppContext);
  const appTheme = appCtx?.theme ?? "system";

  let isDark: boolean;
  if (appTheme === "dark") isDark = true;
  else if (appTheme === "light") isDark = false;
  else isDark = scheme === "dark";

  const palette = isDark && "dark" in colors
    ? (colors as unknown as Record<string, typeof colors.light>).dark
    : colors.light;

  return { ...palette, radius: colors.radius, isDark };
}

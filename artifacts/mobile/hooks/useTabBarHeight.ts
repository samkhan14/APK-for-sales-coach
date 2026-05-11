import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TAB_BAR_HEIGHT = 56;

export function useTabBarHeight(): number {
  const insets = useSafeAreaInsets();
  if (Platform.OS === "web") {
    return TAB_BAR_HEIGHT + 28;
  }
  return TAB_BAR_HEIGHT + insets.bottom;
}

import { useNavigation } from "expo-router";
import React from "react";

export function useHideNavigationHeader(hidden: boolean) {
  const navigation = useNavigation();

  React.useLayoutEffect(() => {
    navigation.setOptions({ headerShown: !hidden });

    return () => {
      navigation.setOptions({ headerShown: true });
    };
  }, [hidden, navigation]);
}

export default useHideNavigationHeader;

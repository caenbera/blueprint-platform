"use client";

import { useContext } from "react";
import { NavigatorContext, type NavigatorContextValue } from "@/providers/navigator-provider";

export function useNavigator(): NavigatorContextValue {
  const context = useContext(NavigatorContext);
  if (!context) {
    throw new Error("useNavigator debe usarse dentro de <NavigatorProvider>.");
  }
  return context;
}

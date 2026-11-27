import { getCurrentInstance } from "vue";

// Shadows the package's composable: the smoke check looks for this prefix in the bundle.
export function useComponentId(prefix = ""): string {
  const uid = `smoke-shadow-${getCurrentInstance()?.uid ?? 0}`;
  return prefix ? `${prefix}-${uid}` : uid;
}

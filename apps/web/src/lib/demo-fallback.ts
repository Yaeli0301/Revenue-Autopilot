import { cookies } from "next/headers";
import {
  DEMO_PROFILE_COOKIE,
  type DemoProfile,
} from "./demo-fallback-data";

export {
  DEMO_SESSION_VALUE,
  DEMO_PROFILE_COOKIE,
  getDemoOrgName,
  getDemoDashboardMetrics,
  getDemoAppointments,
  DEMO_ACTIVITY,
} from "./demo-fallback-data";
export type { DemoProfile, DemoAppointment } from "./demo-fallback-data";

export function getDemoProfileFromCookies(): DemoProfile {
  const raw = cookies().get(DEMO_PROFILE_COOKIE)?.value;
  if (!raw) return {};
  try {
    return JSON.parse(decodeURIComponent(raw)) as DemoProfile;
  } catch {
    return {};
  }
}

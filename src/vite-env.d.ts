/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OMLOX_API_URL: string;
  readonly VITE_OMLOX_AUTH_TOKEN: string;
  readonly VITE_BUILD_NUMBER?: string;
  readonly VITE_BUILD_TIME?: string;
  readonly VITE_LOAD_INITIAL_DATA?: string;
  readonly VITE_FLOOR_WIDTH?: string;
  readonly VITE_FLOOR_LENGTH?: string;
  readonly VITE_ZONE_ID?: string;
  readonly VITE_ZONE_POSITION?: string;
  readonly VITE_GROUND_CONTROL_POINTS?: string;
  readonly VITE_DEMO_FENCES?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}


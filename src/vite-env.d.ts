/// <reference types="vite/client" />

// Define environment variable types
// Note: Runtime configuration is now loaded from JSON files via /api/config
// Only build-time metadata is kept as environment variables
interface ImportMetaEnv {
  // Build metadata (injected at build time)
  readonly VITE_BUILD_NUMBER?: string;
  readonly VITE_BUILD_TIME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}


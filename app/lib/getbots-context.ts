type StudioEnv = {
  GETBOTS_EXTERNAL_MODE?: string;
  GETBOTS_USER_ID?: string;
  GETBOTS_APP_ID?: string;
  GETBOTS_APP_NAME?: string;
  GETBOTS_APP_PROMPT?: string;
  GETBOTS_DEFAULT_TEAM_SLUG?: string;
};

export type GetBotsStudioContext = {
  externalMode: boolean;
  userId: string | null;
  appId: string | null;
  appName: string | null;
  prompt: string | null;
  defaultTeamSlug: string | null;
};

function readRootEnv(): StudioEnv {
  if (typeof window === 'undefined') return {};
  const ctx = (window as any).__remixContext;
  const rootLoaderData = ctx?.state?.loaderData?.root;
  return (rootLoaderData?.ENV ?? {}) as StudioEnv;
}

export function getGetBotsStudioContext(): GetBotsStudioContext {
  const env = readRootEnv();
  return {
    externalMode: env.GETBOTS_EXTERNAL_MODE === '1',
    userId: env.GETBOTS_USER_ID ?? null,
    appId: env.GETBOTS_APP_ID ?? null,
    appName: env.GETBOTS_APP_NAME ?? null,
    prompt: env.GETBOTS_APP_PROMPT ?? null,
    defaultTeamSlug: env.GETBOTS_DEFAULT_TEAM_SLUG ?? null,
  };
}

export function isGetBotsStudioExternalMode(): boolean {
  return getGetBotsStudioContext().externalMode;
}


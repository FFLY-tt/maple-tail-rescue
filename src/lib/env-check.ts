/**
 * Checks the environment variables a production build bakes into the site.
 * Pure (no framework or file access) so it can be unit-tested; next.config.ts
 * runs it for `next build` only. See README ("Production builds").
 */

/** Set to "1" to skip the check, e.g. in CI, where the build uses dummy values. */
export const SKIP_FLAG = "ALLOW_PLACEHOLDER_ENV";

const REQUIRED = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "NEXT_PUBLIC_SITE_URL"] as const;
const URL_VARS = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SITE_URL"] as const;

/** Text copied from .env.example or the defaults in src/content/site.ts. */
const PLACEHOLDER_TEXT = /your-project-ref|your-publishable-key|changeme|placeholder|replace[-_ ]me/i;
/** Reserved, example and local hosts: fine for development, wrong for a deployed site. */
const PLACEHOLDER_HOST = /(^|\.)(example\.(com|org|net)|[^.]+\.example|localhost)$|^127\.0\.0\.1$/i;

function urlProblem(name: string, value: string): string | null {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return `${name} is not a valid URL ("${value}")`;
  }
  if (url.protocol !== "https:") return `${name} must start with https:// ("${value}")`;
  if (PLACEHOLDER_HOST.test(url.hostname)) {
    return `${name} still points at a placeholder or local address ("${value}")`;
  }
  return null;
}

/** True for a Supabase secret / service_role key, which must never be shipped to browsers. */
function isSecretKey(key: string): boolean {
  if (key.startsWith("sb_secret_")) return true;
  try {
    const payload = JSON.parse(atob(key.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload.role === "service_role";
  } catch {
    return false; // not a JWT, so nothing more to check
  }
}

/** Everything wrong with the environment, one message per problem. Empty when it is fine. */
export function findEnvProblems(env: Record<string, string | undefined>): string[] {
  const problems: string[] = [];

  for (const name of REQUIRED) {
    const value = env[name]?.trim();
    if (!value) problems.push(`${name} is not set`);
    else if (PLACEHOLDER_TEXT.test(value)) problems.push(`${name} still has a placeholder value ("${value}")`);
    else if ((URL_VARS as readonly string[]).includes(name)) {
      const problem = urlProblem(name, value);
      if (problem) problems.push(problem);
    }
  }

  const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (key && isSecretKey(key)) {
    problems.push(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY is a secret / service_role key, which would be published in the site's JavaScript. Use the publishable (anon) key",
    );
  }

  return problems;
}

/**
 * Throws a readable error listing every problem, unless the skip flag is set.
 * Returns whether the check was skipped, so the caller can say so.
 */
export function assertProductionEnv(env: Record<string, string | undefined>): { skipped: boolean } {
  if (env[SKIP_FLAG] === "1") return { skipped: true };

  const problems = findEnvProblems(env);
  if (problems.length > 0) {
    throw new Error(
      [
        "",
        "Production build stopped: the environment is not ready for a real deployment.",
        "",
        ...problems.map((problem) => `  - ${problem}`),
        "",
        "Set the real values in .env.local (locally) or in your host's environment settings; see .env.example.",
        "They are baked into the built site, so a wrong value ships to every visitor.",
        `For a throwaway build with dummy values (CI, tests), set ${SKIP_FLAG}=1.`,
        "",
      ].join("\n"),
    );
  }
  return { skipped: false };
}

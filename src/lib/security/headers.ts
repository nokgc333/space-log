export type Header = { key: string; value: string };

const TWO_YEARS_IN_SECONDS = 63_072_000;

function policy(directives: Record<string, readonly string[] | true>): string {
  return Object.entries(directives)
    .map(([name, values]) =>
      values === true ? name : `${name} ${values.join(" ")}`,
    )
    .join("; ");
}

export function securityHeaders({
  isDevelopment,
}: {
  isDevelopment: boolean;
}): Header[] {
  const developmentScript = isDevelopment ? ["'unsafe-eval'"] : [];
  const csp = policy({
    "default-src": ["'self'"],
    "script-src": ["'self'", "'unsafe-inline'", ...developmentScript],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:"],
    "font-src": ["'self'", "data:"],
    "connect-src": ["'self'"],
    "worker-src": ["'self'", "blob:"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
    "upgrade-insecure-requests": true,
  });

  return [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "X-Frame-Options", value: "DENY" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
    },
    {
      key: "Strict-Transport-Security",
      value: `max-age=${TWO_YEARS_IN_SECONDS}; includeSubDomains`,
    },
    { key: "Content-Security-Policy", value: csp },
  ];
}

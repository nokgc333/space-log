const BASE = "http://localhost:3400";

module.exports = {
  ci: {
    collect: {
      startServerCommand: "npm run start -- -p 3400",
      startServerReadyPattern: "Ready",
      url: [`${BASE}/`, `${BASE}/privacy`],
      numberOfRuns: 3,
    },
    assert: {
      assertMatrix: [
        {
          matchingUrlPattern: "^http://localhost:3400/$",
          aggregationMethod: "median-run",
          assertions: {
            "categories:performance": ["error", { minScore: 0.4 }],
            "largest-contentful-paint": ["error", { maxNumericValue: 5000 }],
            "resource-summary:script:size": [
              "error",
              { maxNumericValue: 520000 },
            ],
            "resource-summary:total:size": [
              "error",
              { maxNumericValue: 1300000 },
            ],
            "total-blocking-time": ["error", { maxNumericValue: 7500 }],
          },
        },
        {
          matchingUrlPattern: "^http://localhost:3400/.+",
          aggregationMethod: "median-run",
          assertions: {
            "categories:performance": ["error", { minScore: 0.8 }],
            "largest-contentful-paint": ["error", { maxNumericValue: 4400 }],
            "resource-summary:script:size": [
              "error",
              { maxNumericValue: 240000 },
            ],
            "resource-summary:total:size": [
              "error",
              { maxNumericValue: 850000 },
            ],
            "total-blocking-time": ["error", { maxNumericValue: 450 }],
          },
        },
        {
          matchingUrlPattern: ".*",
          aggregationMethod: "median-run",
          assertions: {
            "cumulative-layout-shift": ["error", { maxNumericValue: 0.1 }],
          },
        },
      ],
    },
    upload: { target: "filesystem", outputDir: ".lighthouseci" },
  },
};

const expectedTitle = 'Philosophies Of A Cyborg';
const canonicalHost = 'www.ositukengere.xyz';
const legacyHost = 'philosophiesofacyborg.com';

const checks = [
  {
    label: 'root redirects to canonical www host',
    url: 'https://ositukengere.xyz/',
    expectStatus: 200,
    expectFinalHost: canonicalHost,
    expectBody: expectedTitle
  },
  {
    label: 'canonical homepage is public',
    url: 'https://www.ositukengere.xyz/',
    expectStatus: 200,
    expectFinalHost: canonicalHost,
    expectBody: expectedTitle
  },
  {
    label: 'clean Vercel alias is public',
    url: 'https://philosophies-of-a-cyborg.vercel.app/',
    expectStatus: 200,
    expectBody: expectedTitle
  },
  {
    label: 'sitemap uses canonical domain',
    url: 'https://www.ositukengere.xyz/sitemap.xml',
    expectStatus: 200,
    expectBody: `<loc>https://${canonicalHost}/</loc>`,
    rejectBody: legacyHost
  },
  {
    label: 'robots uses canonical sitemap',
    url: 'https://www.ositukengere.xyz/robots.txt',
    expectStatus: 200,
    expectBody: `Sitemap: https://${canonicalHost}/sitemap.xml`,
    rejectBody: legacyHost
  },
  {
    label: 'admin stays locked',
    url: 'https://www.ositukengere.xyz/admin/',
    expectStatus: 401,
    rejectBody: expectedTitle
  }
];

function fail(message) {
  throw new Error(message);
}

async function checkRoute(check) {
  const response = await fetch(check.url, { redirect: 'follow' });
  const body = await response.text();
  const finalUrl = new URL(response.url);

  if (response.status !== check.expectStatus) {
    fail(`${check.label}: expected status ${check.expectStatus}, got ${response.status} for ${response.url}`);
  }

  if (check.expectFinalHost && finalUrl.hostname !== check.expectFinalHost) {
    fail(`${check.label}: expected final host ${check.expectFinalHost}, got ${finalUrl.hostname}`);
  }

  if (check.expectBody && !body.includes(check.expectBody)) {
    fail(`${check.label}: expected response body to include ${JSON.stringify(check.expectBody)}`);
  }

  if (check.rejectBody && body.includes(check.rejectBody)) {
    fail(`${check.label}: response body still includes ${JSON.stringify(check.rejectBody)}`);
  }

  return {
    label: check.label,
    status: response.status,
    finalUrl: response.url,
    bytes: body.length
  };
}

const results = [];
for (const check of checks) {
  results.push(await checkRoute(check));
}

for (const result of results) {
  console.log(`ok - ${result.label} [${result.status}] ${result.finalUrl} (${result.bytes} bytes)`);
}

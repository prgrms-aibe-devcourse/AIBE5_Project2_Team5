export type FeedIntegrationProvider = "figma" | "adobe";

export type FeedIntegration = {
  provider: FeedIntegrationProvider;
  label: string;
  url: string;
};

const FIGMA_CODE = "f";
const ADOBE_CODE = "a";

function normalizeUrl(url: string | null | undefined) {
  return typeof url === "string" ? url.trim() : "";
}

export function inferFeedIntegrationProvider(url: string): FeedIntegrationProvider {
  const normalizedUrl = url.trim().toLowerCase();
  if (normalizedUrl.includes("figma")) {
    return "figma";
  }
  return "adobe";
}

export function getFeedIntegrationLabel(provider: FeedIntegrationProvider) {
  return provider === "figma" ? "Figma" : "Adobe";
}

function toFeedIntegration(provider: FeedIntegrationProvider, url: string): FeedIntegration {
  return {
    provider,
    label: getFeedIntegrationLabel(provider),
    url,
  };
}

export function parseFeedIntegrations(serializedValue: string | null | undefined): FeedIntegration[] {
  const normalizedValue = normalizeUrl(serializedValue);
  if (!normalizedValue) {
    return [];
  }

  const lines = normalizedValue
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const supportsCompactFormat =
    lines.length > 0 &&
    lines.every((line) => /^(f|a)\|/i.test(line));

  if (!supportsCompactFormat) {
    const provider = inferFeedIntegrationProvider(normalizedValue);
    return [toFeedIntegration(provider, normalizedValue)];
  }

  const integrations: FeedIntegration[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    const separatorIndex = line.indexOf("|");
    if (separatorIndex < 0) {
      continue;
    }

    const providerCode = line.slice(0, separatorIndex).toLowerCase();
    const url = line.slice(separatorIndex + 1).trim();
    if (!url || seen.has(url)) {
      continue;
    }

    const provider = providerCode === FIGMA_CODE ? "figma" : "adobe";
    integrations.push(toFeedIntegration(provider, url));
    seen.add(url);
  }

  return integrations;
}

export function serializeFeedIntegrations(
  integrations: Array<Pick<FeedIntegration, "provider" | "url">>,
) {
  const seen = new Set<string>();

  return integrations
    .map((integration) => ({
      provider: integration.provider,
      url: normalizeUrl(integration.url),
    }))
    .filter((integration) => {
      if (!integration.url || seen.has(integration.url)) {
        return false;
      }
      seen.add(integration.url);
      return true;
    })
    .map((integration) => {
      const providerCode = integration.provider === "figma" ? FIGMA_CODE : ADOBE_CODE;
      return `${providerCode}|${integration.url}`;
    })
    .join("\n");
}

export function getPrimaryFeedIntegrationUrl(serializedValue: string | null | undefined) {
  return parseFeedIntegrations(serializedValue)[0]?.url ?? "";
}

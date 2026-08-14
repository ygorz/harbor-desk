import { createClient, type Client } from "@osdk/client";
import { createPublicOauthClient } from "@osdk/oauth";

function getMetaTagContent(tagName: string): string {
  const elements = document.querySelectorAll(`meta[name="${tagName}"]`);
  const element = elements.item(elements.length - 1);
  const value = element ? element.getAttribute("content") : null;
  if (value == null || value === "") {
    throw new Error(`Meta tag ${tagName} not found or empty`);
  }
  if (value.match(/%.+%/)) {
    throw new Error(
      `Meta tag ${tagName} contains placeholder value. Please add ${value.replace(/%/g, "")} to your .env files`,
    );
  }
  return value;
}

const foundryUrl = getMetaTagContent("osdk-foundryUrl");
const clientId = getMetaTagContent("osdk-clientId");
const redirectUrl = getMetaTagContent("osdk-redirectUrl");
const ontologyRid = getMetaTagContent("osdk-ontologyRid");

const scopes =
  undefined; /* Uses default scopes, must be updated if new Platform API operations are enabled */

const useMockAuth = import.meta.env.VITE_USE_MOCK_AUTH === "true";

export const auth = useMockAuth
  ? async () => "mock-token-for-local-dev"
  : createPublicOauthClient(clientId, foundryUrl, redirectUrl, { scopes });

/**
 * Initialize the client to interact with the Ontology and Platform SDKs
 */
export const client: Client = createClient(foundryUrl, ontologyRid, auth);

export default client;

/**
 * Builds a Postman Collection v2.1 for the public Pombo API (`/api/v1`) — the
 * surface an external integration drives with its `pmb_` token. Every request
 * inherits collection-level Bearer auth (`{{token}}`) and uses `{{baseUrl}}`,
 * `{{deviceId}}` and `{{phone}}` variables so the file is import-and-run.
 *
 * Client-side generated (no backend endpoint): the public surface is stable and
 * small, so a static generator is simpler than a served spec. Keep this in sync
 * with `apps/api/.../public-api.routes.ts` when public endpoints change.
 */

interface PostmanUrl {
  raw: string;
  host: string[];
  path: string[];
}

interface PostmanRequest {
  method: "GET" | "POST";
  header: { key: string; value: string }[];
  url: PostmanUrl;
  description?: string;
  body?: {
    mode: "raw";
    raw: string;
    options: { raw: { language: "json" } };
  };
}

interface PostmanItem {
  name: string;
  request?: PostmanRequest;
  item?: PostmanItem[];
}

export interface PostmanCollection {
  info: {
    name: string;
    schema: string;
    description: string;
  };
  auth: {
    type: "bearer";
    bearer: { key: string; value: string; type: "string" }[];
  };
  variable: { key: string; value: string; type?: "string" }[];
  item: PostmanItem[];
}

const jsonHeader = [{ key: "Content-Type", value: "application/json" }];

function url(...segments: string[]): PostmanUrl {
  return {
    raw: ["{{baseUrl}}", ...segments].join("/"),
    host: ["{{baseUrl}}"],
    path: segments,
  };
}

function post(name: string, path: string, body: unknown): PostmanItem {
  return {
    name,
    request: {
      method: "POST",
      header: jsonHeader,
      url: url("devices", "{{deviceId}}", path),
      body: {
        mode: "raw",
        raw: JSON.stringify(body, null, 2),
        options: { raw: { language: "json" } },
      },
    },
  };
}

/**
 * @param baseUrl absolute public API base, e.g. `https://api.example.com/api/v1`
 *                — becomes the default of the `{{baseUrl}}` variable.
 */
export function buildPostmanCollection(baseUrl: string): PostmanCollection {
  return {
    info: {
      name: "Pombo API",
      schema:
        "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
      description:
        "Public Pombo API (/api/v1). Set the `token` variable to your `pmb_` API token, `deviceId` to a connected device id, and `phone` to the recipient (E.164, e.g. 5548999999999).",
    },
    auth: {
      type: "bearer",
      bearer: [{ key: "token", value: "{{token}}", type: "string" }],
    },
    variable: [
      { key: "baseUrl", value: baseUrl, type: "string" },
      { key: "token", value: "", type: "string" },
      { key: "deviceId", value: "", type: "string" },
      { key: "phone", value: "", type: "string" },
    ],
    item: [
      {
        name: "Devices",
        item: [
          {
            name: "List devices",
            request: {
              method: "GET",
              header: [],
              url: url("devices"),
              description: "Lists the account's devices and their status.",
            },
          },
        ],
      },
      {
        name: "Messages",
        item: [
          post("Send text", "send-text", {
            phone: "{{phone}}",
            message: "Hello from Pombo",
          }),
          post("Send image", "send-image", {
            phone: "{{phone}}",
            image: "https://example.com/image.png",
            caption: "Optional caption",
          }),
          post("Send audio", "send-audio", {
            phone: "{{phone}}",
            audio: "https://example.com/audio.ogg",
          }),
          post("Send video", "send-video", {
            phone: "{{phone}}",
            video: "https://example.com/video.mp4",
            caption: "Optional caption",
          }),
          post("Send document", "send-document", {
            phone: "{{phone}}",
            document: "https://example.com/document.pdf",
            fileName: "document.pdf",
            caption: "Optional caption",
          }),
        ],
      },
    ],
  };
}

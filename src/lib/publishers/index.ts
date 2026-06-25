import { ZernioPublisher } from "./ZernioPublisher";

export interface Publisher {
  publish(
    videoUrl: string,
    platform: string,
    zernioAccountId: string | null,
    content: string,
    title?: string,
    scheduledFor?: string,
    apiKey?: string
  ): Promise<{ externalId: string; watchUrl?: string }>;
}

export function getPublisherForPlatform(_platform: string): Publisher {
  // Every platform — including YouTube — publishes through the Zernio API using
  // the account the user connected via Zernio OAuth. (Previously YouTube hit a
  // no-op stub that returned a fake id and never actually posted anything.)
  return new ZernioPublisher();
}


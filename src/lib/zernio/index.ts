export function getZernioApiKey(): string {
  const apiKey = process.env.ZERNIO_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing ZERNIO_API_KEY environment variable. " +
        "Please add ZERNIO_API_KEY=your_key to your .env.local file."
    );
  }
  return apiKey;
}

export function getZernioBaseUrl(): string {
  return process.env.ZERNIO_BASE_URL || "https://zernio.com/api/v1";
}

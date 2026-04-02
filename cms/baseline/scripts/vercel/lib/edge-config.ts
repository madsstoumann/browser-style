import { createClient } from '@vercel/edge-config';

const client = createClient(process.env.EDGE_CONFIG);

/** Read a single key from Edge Config (sub-ms at the edge) */
export async function edgeGet<T>(key: string): Promise<T | undefined> {
  return client.get<T>(key);
}

/** Batch-read multiple keys in a single call */
export async function edgeGetAll(keys: string[]): Promise<Map<string, unknown>> {
  const entries = await client.getAll(keys);
  return new Map(Object.entries(entries));
}

/** Batch-write (upsert/delete) items to Edge Config via Vercel API */
export async function edgeWrite(
  items: Array<{ operation: 'upsert' | 'delete'; key: string; value?: unknown }>
) {
  const res = await fetch(
    `https://api.vercel.com/v1/edge-config/${process.env.EDGE_CONFIG_ID}/items`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ items }),
    }
  );
  if (!res.ok) {
    throw new Error(`Edge Config write failed: ${res.status} ${await res.text()}`);
  }
}

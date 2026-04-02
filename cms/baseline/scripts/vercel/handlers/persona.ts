import { edgeWrite } from '../lib/edge-config';

interface PersonaFields {
  slug: string;
  display_name: string;
  system_prompt: string;
  search_bias?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Personas are written as an array. The caller is responsible
 * for passing the resolved array of all persona fields.
 */
export async function handlePersonas(personas: PersonaFields[]) {
  await edgeWrite([
    { operation: 'upsert', key: 'personas', value: personas },
  ]);
}

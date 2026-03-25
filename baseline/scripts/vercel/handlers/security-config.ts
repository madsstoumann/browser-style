import { edgeWrite } from '../lib/edge-config';

interface SecurityConfigFields {
  title: string;
  security_txt: string;
}

export async function handleSecurityConfig(fields: SecurityConfigFields) {
  await edgeWrite([
    { operation: 'upsert', key: 'security_txt', value: fields.security_txt },
  ]);
}

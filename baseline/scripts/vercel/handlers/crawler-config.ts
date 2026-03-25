import { edgeWrite } from '../lib/edge-config';

interface CrawlerConfigFields {
  title: string;
  robots_txt: string;
  manifest: Record<string, unknown>;
  app_icon_small?: { url: string };
  app_icon_medium?: { url: string };
  app_icon_large?: { url: string };
  llms_enabled: boolean;
  llms_preamble: string;
  llms_exclude_patterns: string[];
}

export async function handleCrawlerConfig(fields: CrawlerConfigFields) {
  const icons: Array<{ src: string; sizes: string; type: string }> = [];
  if (fields.app_icon_small) icons.push({ src: fields.app_icon_small.url, sizes: '192x192', type: 'image/png' });
  if (fields.app_icon_medium) icons.push({ src: fields.app_icon_medium.url, sizes: '384x384', type: 'image/png' });
  if (fields.app_icon_large) icons.push({ src: fields.app_icon_large.url, sizes: '512x512', type: 'image/png' });

  await edgeWrite([
    { operation: 'upsert', key: 'crawler_robots', value: fields.robots_txt },
    { operation: 'upsert', key: 'crawler_manifest', value: { ...fields.manifest, icons } },
    {
      operation: 'upsert',
      key: 'crawler_llms_config',
      value: {
        enabled: fields.llms_enabled,
        preamble: fields.llms_preamble,
        exclude_patterns: fields.llms_exclude_patterns,
      },
    },
  ]);
}

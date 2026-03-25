import { edgeWrite } from '../lib/edge-config';

interface SiteConfigFields {
  site_name: string;
  site_url: string;
  site_description?: string;
  default_locale: string;
  legal_name?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  favicon?: { url: string };
  favicon_svg?: { url: string };
  apple_touch_icon?: { url: string };
  og_image?: { url: string };
  error_pages?: Array<{ status_code: number; slug: string }>;
  [key: string]: unknown;
}

export async function handleSiteConfig(fields: SiteConfigFields) {
  const errorPagesMap: Record<string, string> = {};
  if (fields.error_pages) {
    for (const ep of fields.error_pages) {
      errorPagesMap[String(ep.status_code)] = `/${ep.slug}`;
    }
  }

  await edgeWrite([
    {
      operation: 'upsert',
      key: 'site',
      value: {
        site_name: fields.site_name,
        site_url: fields.site_url,
        site_description: fields.site_description,
        default_locale: fields.default_locale,
        legal_name: fields.legal_name,
        contact_email: fields.contact_email,
        contact_phone: fields.contact_phone,
        address: fields.address,
        favicon: fields.favicon?.url,
        favicon_svg: fields.favicon_svg?.url,
        apple_touch_icon: fields.apple_touch_icon?.url,
        og_image: fields.og_image?.url,
        error_pages: errorPagesMap,
      },
    },
  ]);
}

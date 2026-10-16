import { absoluteUrl } from '../config/site';

export function GET() {
  const body = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /contact/thanks/
Disallow: /newsletter/thanks/

Sitemap: ${absoluteUrl('/sitemap.xml')}
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}

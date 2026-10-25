const productionHost = 'farraaffandi.com';
export default {
 async fetch(request, env) {
  const url = new URL(request.url);
  if (url.hostname === 'www.' + productionHost) {
   url.hostname = productionHost;
   url.protocol = 'https:';
   return Response.redirect(url.href, 301);
  }
  if (url.pathname === '/index.html' || url.pathname === '/en/index.html' || url.pathname === '/en') {
   url.pathname = url.pathname.startsWith('/en') ? '/en/' : '/';
   return Response.redirect(url.href, 301);
  }
  const assetUrl = new URL(url);
  if (assetUrl.pathname === '/' || assetUrl.pathname === '/en/') assetUrl.pathname += 'index.html';
  let response = await env.ASSETS.fetch(new Request(assetUrl, request));
  if (response.status === 404 && url.pathname.startsWith('/en/')) {
   const errorUrl = new URL('/en/404.html', url);
   const errorPage = await env.ASSETS.fetch(new Request(errorUrl, request));
   response = new Response(errorPage.body, {status:404, headers:errorPage.headers});
  }
  response = new Response(response.body, response);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (url.hostname !== productionHost || response.status === 404) response.headers.set('X-Robots-Tag', 'noindex, follow');
  return response;
 }
};

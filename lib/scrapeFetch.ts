// 일부 기관 홈페이지는 User-Agent가 없는 요청을 403으로 차단합니다.
// (예: onnainna.kr) 실제 브라우저처럼 보이도록 헤더를 붙여서 요청합니다.
const SCRAPE_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

export function scrapeFetch(url: string) {
  return fetch(url, {
    headers: {
      'User-Agent': SCRAPE_USER_AGENT,
      'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
    },
  });
}

// 대부분의 기관 사이트는 UTF-8이지만, 오래된 사이트(예: 함지골청소년수련관)는
// 여전히 EUC-KR을 씁니다. Content-Type 헤더나 <meta charset> 선언을 보고
// 알맞은 인코딩으로 디코딩해서 반환합니다.
export async function scrapeText(url: string): Promise<string> {
  const res = await scrapeFetch(url);
  const buffer = Buffer.from(await res.arrayBuffer());

  const headerCharset = res.headers.get('content-type')?.match(/charset=([\w-]+)/i)?.[1];
  const metaCharset = headerCharset
    ? undefined
    : buffer.subarray(0, 2048).toString('latin1').match(/charset=["']?([\w-]+)/i)?.[1];
  const charset = (headerCharset || metaCharset || 'utf-8').toLowerCase();

  if (charset === 'utf-8' || charset === 'utf8') {
    return buffer.toString('utf-8');
  }
  try {
    return new TextDecoder(charset).decode(buffer);
  } catch {
    return buffer.toString('utf-8');
  }
}

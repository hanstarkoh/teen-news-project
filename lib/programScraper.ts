import * as cheerio from 'cheerio';
import { ProgramSource } from '@/lib/programSources';
import { scrapeText } from '@/lib/scrapeFetch';

export type ProgramListItem = {
  title: string;
  url: string;
  period: string;
  deadlineDate: string | null;
  // onclick 계열 게시판은 목록 자체에 대상/마감상태가 이미 나와있어서
  // AI 상세 추출 없이 이 값들을 바로 씁니다.
  targetAudience?: string;
  closed?: boolean;
};

function parseEndDate(rangeText: string): string | null {
  // 날짜 뒤에 시각("15:00", "18시" 등)이 붙는 경우까지 넉넉하게 허용합니다.
  const match = rangeText.match(/(\d{4})[.\-](\d{1,2})[.\-](\d{1,2})[\s\S]{0,20}?~[\s\S]{0,10}?(\d{4})[.\-](\d{1,2})[.\-](\d{1,2})/);
  if (!match) return null;
  const [, , , , y2, m2, d2] = match;
  return `${y2}-${m2.padStart(2, '0')}-${d2.padStart(2, '0')}`;
}

function extractLabelValue(text: string, label: string): string {
  const match = text.match(new RegExp(`${label}\\s*[:：]\\s*([\\s\\S]{1,60}?)(?=\\n|·|접수현황|대기현황|장소|접\\s*수|일\\s*시|$)`));
  return match ? match[1].replace(/\s+/g, ' ').trim() : '';
}

// 'card' 타입 게시판(카드 목록 + 상세페이지)에서 프로그램 목록을 긁어옵니다.
async function fetchCardBoardItems(source: ProgramSource): Promise<ProgramListItem[]> {
  const html = await scrapeText(source.listUrl);
  const $ = cheerio.load(html);
  const items: ProgramListItem[] = [];

  $('.program_list').each((_, el) => {
    const $item = $(el);
    const href = $item.find('a').first().attr('href');
    const title = $item.find('.program_inf strong').first().text().replace(/\s+/g, ' ').trim();
    const period = $item.find('.program_date span').first().text().replace(/\s+/g, ' ').trim();
    if (!href || !title) return;

    items.push({
      title,
      url: new URL(href, source.listUrl).href,
      period,
      deadlineDate: parseEndDate(period),
    });
  });

  return items;
}

// 'table' 타입 게시판(표 형태, 상세페이지 없음)에서 프로그램 목록을 긁어옵니다.
async function fetchTableBoardItems(source: ProgramSource): Promise<ProgramListItem[]> {
  const html = await scrapeText(source.listUrl);
  const $ = cheerio.load(html);
  const items: ProgramListItem[] = [];

  $('table.tb2 tbody tr').each((_, el) => {
    const $tds = $(el).find('td');
    if ($tds.length < 3) return;

    const title = $tds.eq(0).text().replace(/\s+/g, ' ').trim();
    const period = $tds.eq(1).text().replace(/\s+/g, ' ').trim();
    const applyHref = $tds.eq(2).find('a').attr('href');
    if (!title || !period) return;

    // 신청 링크가 있으면 그걸 원문 링크로 쓰고, 마감돼서 링크가 없으면
    // 게시판 주소 + 제목으로 이 프로그램만의 고유 식별자를 만듭니다.
    const url = applyHref || `${source.listUrl}#${encodeURIComponent(title)}`;

    items.push({
      title,
      url,
      period,
      deadlineDate: parseEndDate(period),
    });
  });

  return items;
}

function isClosedStatus(text: string): boolean {
  return /마감|종료/.test(text) && !/마감임박/.test(text);
}

// 'onclick-table' 타입 게시판(가야/금곡): 옛날 방식 <table>에 <td onclick="location.href='...'">로
// 상세페이지 이동. 대상·접수기간이 목록 행 안에 이미 텍스트로 있어서 상세페이지를 따로 볼 필요가 없습니다.
async function fetchOnclickTableItems(source: ProgramSource): Promise<ProgramListItem[]> {
  const html = await scrapeText(source.listUrl);
  const $ = cheerio.load(html);
  const items: ProgramListItem[] = [];

  $('tr').each((_, el) => {
    const $row = $(el);
    const $onclickEl = $row.find('[onclick*="pidx="]').first();
    if ($onclickEl.length === 0) return;

    const onclick = $onclickEl.attr('onclick') || '';
    const hrefMatch = onclick.match(/location\.href='([^']+)'/);
    if (!hrefMatch) return;

    const $tds = $row.find('td');
    const title = $tds.eq(0).text().replace(/\s+/g, ' ').trim().split(/\s*-\s*대상/)[0].trim();
    const rowText = $row.text();
    const period = $tds.eq(2).text().replace(/\s+/g, ' ').trim();
    if (!title || !period) return;

    items.push({
      title,
      url: new URL(hrefMatch[1], source.listUrl).href,
      period,
      deadlineDate: parseEndDate(period),
      targetAudience: extractLabelValue(rowText, '대\\s*상'),
      closed: isClosedStatus($tds.last().text()),
    });
  });

  return items;
}

// 'onclick-card' 타입 게시판(사상/사하/중구): onclick 카드형, 목록 안에 대상/접수기간이 이미 다 있어서
// 상세페이지가 필요 없는 형태.
async function fetchOnclickCardItems(source: ProgramSource): Promise<ProgramListItem[]> {
  const html = await scrapeText(source.listUrl);
  const $ = cheerio.load(html);
  const items: ProgramListItem[] = [];

  $('[onclick*="pidx="]').each((_, el) => {
    const $item = $(el);
    // 카드 안에 onclick이 중복으로(제목 영역+상태뱃지) 걸려있는 경우가 있어,
    // 바깥쪽(카드 전체) onclick 요소만 취급하고 안쪽 것은 건너뜁니다.
    if ($item.parents('[onclick*="pidx="]').length > 0) return;

    const onclick = $item.attr('onclick') || '';
    const hrefMatch = onclick.match(/location\.href='([^']+)'/);
    if (!hrefMatch) return;

    const title = $item.find('td').first().text().replace(/\s+/g, ' ').trim();
    const itemText = $item.text();
    const period = extractLabelValue(itemText, '접\\s*수');
    if (!title) return;

    items.push({
      title,
      url: new URL(hrefMatch[1], source.listUrl).href,
      period: period || extractLabelValue(itemText, '일\\s*시'),
      deadlineDate: period ? parseEndDate(period) : null,
      targetAudience: extractLabelValue(itemText, '대\\s*상'),
      closed: isClosedStatus(itemText),
    });
  });

  return items;
}

// 'card-status' 타입 게시판(동래): 카드형인데 마감여부가 텍스트가 아니라
// 카드 div의 클래스(program_accepting/program_close)로만 표시됩니다.
async function fetchCardStatusItems(source: ProgramSource): Promise<ProgramListItem[]> {
  const html = await scrapeText(source.listUrl);
  const $ = cheerio.load(html);
  const items: ProgramListItem[] = [];

  $('.program_list > li > a').each((_, el) => {
    const $link = $(el);
    const href = $link.attr('href');
    const title = $link.find('.card-title').first().text().replace(/\s+/g, ' ').trim();
    if (!href || !title) return;

    const itemText = $link.text();
    const period = extractLabelValue(itemText, '접수\\s*기간');
    const closed = $link.find('.card').hasClass('program_close');

    items.push({
      title,
      url: new URL(href, source.listUrl).href,
      period,
      deadlineDate: period ? parseEndDate(period) : null,
      closed,
    });
  });

  return items;
}

// 'reservation-portal' 타입(금련산): 부산시 통합예약 포털. dt/dd 라벨로 정보가 잘 정리돼 있습니다.
async function fetchReservationPortalItems(source: ProgramSource): Promise<ProgramListItem[]> {
  const html = await scrapeText(source.listUrl);
  const $ = cheerio.load(html);
  const items: ProgramListItem[] = [];

  $('a.reserveItem').each((_, el) => {
    const $item = $(el);
    const onclick = $item.attr('onclick') || '';
    const idMatch = onclick.match(/fn_viewProgrm\('(\d+)',\s*'(\d+)'\)/);
    const title = $item.find('.infoBox p.tit').first().text().replace(/\s+/g, ' ').trim();
    if (!idMatch || !title) return;

    const getDd = (label: string) => {
      const $dt = $item.find('dl > dt').filter((_, dt) => $(dt).text().trim() === label).first();
      return $dt.next('dd').text().replace(/\s+/g, ' ').trim();
    };

    const dateText = $item.find('dl dd.date').text();
    // [신청] 기간을 우선 찾고, 없으면 전체 텍스트에서 첫 날짜범위를 씁니다.
    const applyRangeMatch = dateText.match(/\[신청\]\s*([\s\S]*?)(?=\[|$)/);
    const period = (applyRangeMatch ? applyRangeMatch[1] : dateText).replace(/\s+/g, ' ').trim();

    const statusText = $item.find('.infoBox span.statusMark').first().text().trim();

    items.push({
      title,
      url: `https://reserve.busan.go.kr/lctre/view?resveGroupSn=${idMatch[1]}&progrmSn=${idMatch[2]}`,
      period,
      deadlineDate: parseEndDate(period),
      targetAudience: getDd('대상'),
      closed: isClosedStatus(statusText),
    });
  });

  return items;
}

// 'json-api' 타입(전포): 목록이 정적 HTML이 아니라 JSON API로만 내려옵니다.
async function fetchJsonApiItems(source: ProgramSource): Promise<ProgramListItem[]> {
  const res = await fetch(source.listUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    },
    body: 'filter=all&sort=desc',
  });
  const data = await res.json();
  const rows: any[] = Array.isArray(data?.data) ? data.data : [];

  return rows.map((row) => {
    const period: string = row.spt_application_date || '';
    return {
      title: String(row.spt_title || '').trim(),
      // 프로그램별 별도 상세페이지가 없어서, 목록 페이지 주소 + 고유번호로 식별합니다.
      url: `https://www.jinguzzang.com/application#${row.spt_idx}`,
      period,
      deadlineDate: parseEndDate(period),
      targetAudience: String(row.spt_target || '').trim(),
      closed: Number(row.spt_status) === 2,
    };
  }).filter(item => item.title);
}

// 'gu-reservation-portal' 타입(해운대구): 구청 예약 포털인데 다른 시설과 게시판을 같이 써서
// "교육장소"에 이 기관 이름이 포함된 항목만 걸러냅니다.
async function fetchGuReservationPortalItems(source: ProgramSource): Promise<ProgramListItem[]> {
  const html = await scrapeText(source.listUrl);
  const $ = cheerio.load(html);
  const items: ProgramListItem[] = [];

  $('.reserVbox').each((_, el) => {
    const $item = $(el);
    const itemText = $item.text();
    if (source.facilityFilter && !itemText.includes(source.facilityFilter)) return;

    const $link = $item.find('.base a').first();
    const href = $link.attr('href');
    const title = $link.find('strong.title').first().text().replace(/\s+/g, ' ').trim();
    if (!href || !title) return;

    // 날짜 안에 줄바꿈이 많이 섞여있어서(날짜/시각이 따로따로 줄바뀜), 정규식보다
    // "신청기간" li 자체를 찾아 그 안 텍스트를 통째로 공백 정리하는 편이 안전합니다.
    const periodLi = $link.find('ul li').filter((_, li) => $(li).text().includes('신청기간')).first();
    const period = periodLi.text().replace(/\s+/g, ' ').trim().replace(/^신청기간\s*:\s*/, '');
    const statusText = $item.find('.btn_reserv a[href*="res_no="] span.head').first().text().trim();

    items.push({
      title,
      url: new URL(href, source.listUrl).href,
      period,
      deadlineDate: parseEndDate(period),
      closed: isClosedStatus(statusText),
    });
  });

  return items;
}

export async function fetchProgramListItems(source: ProgramSource): Promise<ProgramListItem[]> {
  switch (source.boardType) {
    case 'card': return fetchCardBoardItems(source);
    case 'table': return fetchTableBoardItems(source);
    case 'onclick-table': return fetchOnclickTableItems(source);
    case 'onclick-card': return fetchOnclickCardItems(source);
    case 'card-status': return fetchCardStatusItems(source);
    case 'reservation-portal': return fetchReservationPortalItems(source);
    case 'json-api': return fetchJsonApiItems(source);
    case 'gu-reservation-portal': return fetchGuReservationPortalItems(source);
  }
}

export type ProgramDetail = {
  targetAudience: string;
  contact: string;
  summary: string;
};

// 'card' 타입 상세페이지 본문을 AI로 요약해서 대상/연락처/한줄요약을 뽑아냅니다.
// (신청 기간·제목은 이미 목록에서 구조화된 값으로 확보했으므로, AI에게는 이 세 항목만 맡깁니다.)
export async function extractCardProgramDetail(source: ProgramSource, targetUrl: string, title: string): Promise<ProgramDetail> {
  const html = await scrapeText(targetUrl);
  const $ = cheerio.load(html);
  const rawText = $('.program_txt').first().text().replace(/\s+/g, ' ').trim()
    || $('.program_view .text').first().text().replace(/\s+/g, ' ').trim();

  if (!rawText) {
    return { targetAudience: '', contact: '', summary: '' };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;

  const prompt = `
    너는 부산 청소년 프로그램 정보를 정리하는 편집 보조야.
    아래는 "${source.name}"의 프로그램 신청 게시글 "${title}"의 상세 내용이야.

    반드시 지켜야 할 규칙:
    1. [원본 텍스트]에 없는 내용은 절대로 지어내지 마. 확인 안 되는 값은 빈 문자열("")로 둬.
    2. 반드시 아래 JSON 형식으로만 응답해. 다른 설명이나 마크다운 코드블록 없이 JSON 객체 하나만 출력해.

    {
      "targetAudience": "모집 대상 (예: 14~19세 청소년)",
      "contact": "문의 연락처",
      "summary": "한두 문장 요약"
    }

    [원본 텍스트]: ${rawText}
  `;

  const geminiRes = await fetch(geminiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' },
    }),
  });

  const data = await geminiRes.json();
  if (!geminiRes.ok) {
    console.error('AI 에러:', data);
    return { targetAudience: '', contact: '', summary: '' };
  }

  try {
    const parsed = JSON.parse(data.candidates[0].content.parts[0].text);
    return {
      targetAudience: parsed.targetAudience || '',
      contact: parsed.contact || '',
      summary: parsed.summary || '',
    };
  } catch (err) {
    console.error('AI 응답 JSON 파싱 실패:', data);
    return { targetAudience: '', contact: '', summary: '' };
  }
}

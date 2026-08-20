// 부산 청소년수련시설별 갤러리 게시판 스크래핑 설정.
// 새 기관을 추가할 땐 실제 사이트 구조를 확인한 뒤 이 배열에 항목을 추가하면 되고,
// API 라우트는 건드릴 필요가 없습니다.
export type GallerySource = {
  id: string;
  name: string;
  listUrl: string;
  // 목록 페이지에서 게시물 하나하나를 감싸는 컨테이너 셀렉터 (그 자체가 링크 태그여도 됨)
  listItemSelector: string;
  // 컨테이너 안에서 링크를 가진 요소를 찾는 셀렉터. 컨테이너 자신이 링크면 'self'.
  listLinkSelector: string;
  // 링크를 읽어올 속성. 기본은 href. onclick="location.href='...'" 같은 구식 사이트는 'onclick'.
  listLinkAttr?: string;
  // listLinkAttr 값에서 실제 URL만 뽑아내는 정규식 (예: onclick 파싱용). 없으면 속성값을 그대로 URL로 사용.
  listLinkPattern?: RegExp;
  // 추출한 URL에 포함되어야 하는 문자열 (내비게이션 링크 등 오탐 방지)
  listLinkFilter: string;
  // 컨테이너 안에서 제목 텍스트를 찾는 셀렉터 (못 찾으면 컨테이너 전체 텍스트로 대체)
  listTitleSelector: string;
  // 상세 페이지에서 본문 텍스트 + 이미지를 함께 포함하는 컨테이너 셀렉터
  viewContainerSelector: string;
};

export const gallerySources: GallerySource[] = [
  {
    id: 'geumjeong',
    name: '금정청소년수련관',
    listUrl: 'https://www.youthcool.or.kr/SW_bbs/gallery/list.php?zipEncode=5jxzSXwyN91vt1drjrMCH9MyMetpSfMvWLME',
    listItemSelector: '.photoList a',
    listLinkSelector: 'self',
    listLinkFilter: 'view.php',
    listTitleSelector: '.tit',
    viewContainerSelector: '.bbsView .view',
  },
  {
    id: 'dongnae',
    name: '동래구청소년센터',
    listUrl: 'https://www.onnainna.kr/community/photo_board',
    listItemSelector: '.card a',
    listLinkSelector: 'self',
    listLinkFilter: 'photo_board_view',
    listTitleSelector: '.card-title',
    viewContainerSelector: 'td.view_txt',
  },
  // 아래 3곳은 금정청소년수련관과 동일한 "SW_bbs" 플랫폼(같은 CMS)을 쓰는 시설입니다.
  {
    id: 'yangjeong',
    name: '양정청소년수련관',
    listUrl: 'https://www.power0924.org/SW_bbs/gallery/list.php?zipEncode=5jxzSXwyN91vt1drjrMCH9MyMetpSfMvWLME',
    listItemSelector: '.photoList a',
    listLinkSelector: 'self',
    listLinkFilter: 'view.php',
    listTitleSelector: '.tit',
    viewContainerSelector: '.bbsView .view',
  },
  {
    id: 'seogu',
    name: '서구청소년문화의집',
    listUrl: 'https://www.seoguyouth.co.kr/SW_bbs/gallery/list.php?zipEncode=5jxzSXwyN91vt1drjrMCH9MyMetpSfMvWLME',
    listItemSelector: '.photoList a',
    listLinkSelector: 'self',
    listLinkFilter: 'view.php',
    listTitleSelector: '.tit',
    viewContainerSelector: '.bbsView .view',
  },
  {
    id: 'suyeong',
    name: '수영구청소년문화의집',
    listUrl: 'http://www.seeyouth.or.kr/SW_bbs/gallery/list.php?zipEncode==qEHn3x5jxzSXwyN91vt1drjrMCH9MyMetpSfMvWLME',
    listItemSelector: '.photoList a',
    listLinkSelector: 'self',
    listLinkFilter: 'view.php',
    listTitleSelector: '.tit',
    viewContainerSelector: '.bbsView .view',
  },
  // 그누보드5 갤러리형 게시판
  {
    id: 'haeundae_ymca',
    name: '해운대청소년수련관',
    listUrl: 'https://www.ymcahy.or.kr/bbs/board.php?bo_table=06_05',
    listItemSelector: '.gall_li a.bo_tit',
    listLinkSelector: 'self',
    listLinkFilter: 'wr_id',
    listTitleSelector: '.bo_tit',
    viewContainerSelector: '#bo_v_con',
  },
  // XpressEngine(구 제로보드) sketchbook 스킨 갤러리
  {
    id: 'bukgu',
    name: '북구청소년문화의집',
    listUrl: 'http://bkyouth.or.kr/board_iMHU23',
    listItemSelector: '.bd_tmb_lst > li',
    listLinkSelector: 'a.hx',
    listLinkFilter: 'board_iMHU23',
    listTitleSelector: 'p',
    viewContainerSelector: '.xe_content',
  },
  // 구식 테이블 레이아웃 + onclick 기반 게시판 (가야/금곡 동일 템플릿)
  {
    id: 'gaya',
    name: '가야청소년센터',
    listUrl: 'http://gayayouth.or.kr/p42.php',
    listItemSelector: 'td:has(img[onclick])',
    listLinkSelector: 'img',
    listLinkAttr: 'onclick',
    listLinkPattern: /location\.href='([^']+)'/,
    listLinkFilter: 'md=V',
    listTitleSelector: 'div',
    viewContainerSelector: 'td:has(#DivContents)',
  },
  {
    id: 'geumgok',
    name: '금곡청소년수련관',
    listUrl: 'http://kum-gok.or.kr/p42.php',
    listItemSelector: 'td:has(img[onclick])',
    listLinkSelector: 'img',
    listLinkAttr: 'onclick',
    listLinkPattern: /location\.href='([^']+)'/,
    listLinkFilter: 'md=V',
    listTitleSelector: 'div',
    viewContainerSelector: 'td:has(#DivContents)',
  },
  {
    id: 'sasang',
    name: '사상구청소년센터',
    listUrl: 'https://www.yzzang.com/sb53.php',
    listItemSelector: 'td:has(img[onclick])',
    listLinkSelector: 'img',
    listLinkAttr: 'onclick',
    listLinkPattern: /location\.href='([^']+)'/,
    listLinkFilter: 'md=V',
    listTitleSelector: 'div',
    viewContainerSelector: 'td:has(#DivContents)',
  },
  {
    id: 'saha',
    name: '사하구청소년문화의집',
    listUrl: 'http://www.sahayouth.or.kr/sb72.php',
    listItemSelector: 'td:has(img[onclick])',
    listLinkSelector: 'img',
    listLinkAttr: 'onclick',
    listLinkPattern: /location\.href='([^']+)'/,
    listLinkFilter: 'md=V',
    listTitleSelector: 'div',
    viewContainerSelector: 'td:has(#DivContents)',
  },
  {
    id: 'junggu',
    name: '중구청소년문화의집',
    listUrl: 'https://purun1318.org/sb52.php',
    listItemSelector: 'td:has(img[onclick])',
    listLinkSelector: 'img',
    listLinkAttr: 'onclick',
    listLinkPattern: /location\.href='([^']+)'/,
    listLinkFilter: 'md=V',
    listTitleSelector: 'div',
    viewContainerSelector: 'td:has(#DivContents)',
  },
  // XpressEngine 계열 (전포/부전은 같은 도구업체 템플릿, 북구와는 스킨이 다름)
  {
    id: 'jeonpo',
    name: '전포청소년센터',
    listUrl: 'https://www.jinguzzang.com/news_02',
    listItemSelector: '.itemBox',
    listLinkSelector: 'a',
    listLinkFilter: 'news_02/',
    listTitleSelector: '.gallerytitle',
    viewContainerSelector: '.xe_content',
  },
  {
    id: 'bujeon',
    name: '부전청소년센터',
    listUrl: 'https://teenstory.kr/xe/sub7_04',
    listItemSelector: '.itemBox a',
    listLinkSelector: 'self',
    listLinkFilter: 'sub7_04/',
    listTitleSelector: 'h4',
    viewContainerSelector: '.xe_content',
  },
  // 부산시 공식 포털(busan.go.kr) 산하 시설
  {
    id: 'geumnyeonsan',
    name: '금련산청소년수련원',
    listUrl: 'https://www.busan.go.kr/youth/gnsaler05',
    listItemSelector: '.thumbListType1 a.item',
    listLinkSelector: 'self',
    listLinkFilter: 'gnsaler05/',
    listTitleSelector: '.tit',
    viewContainerSelector: '.bs-form-box',
  },
  {
    id: 'haeundae_gu',
    name: '해운대청소년문화의집',
    listUrl: 'https://www.haeundae.go.kr/board/list.do?boardId=BBS_0000301&menuCd=DOM_000001305002000000&paging=ok&startPage=1',
    listItemSelector: '.photo_list.album_type li',
    listLinkSelector: 'a.txt',
    listLinkFilter: 'boardId=BBS_0000301',
    listTitleSelector: 'a.txt strong',
    viewContainerSelector: 'td.cont',
  },
  // EUC-KR 인코딩 사이트 (scrapeText가 <meta charset>을 보고 자동으로 디코딩합니다)
  {
    id: 'hamji',
    name: '함지골청소년수련관',
    listUrl: 'http://www.hamji.or.kr/skin_build61/bbs_list.php?unsingcode1=1185858077&unsingcode2=1369279526&code=flashphoto',
    listItemSelector: 'a[href*="boardT=v"]',
    listLinkSelector: 'self',
    listLinkFilter: 'boardT=v',
    listTitleSelector: 'no-title-element', // 앵커 안에 별도 제목 태그가 없어 컨테이너 전체 텍스트로 대체됨
    viewContainerSelector: 'table:has(> tbody > tr > td > a > img[src*="bbsData"])',
  },
];

// 기사의 원본 링크(original_link)가 등록된 기관 사이트와 일치하면 기관명을 돌려줍니다.
// 기사 상세 페이지에서 "사진/내용 출처" 표기에 사용합니다.
export function getSourceNameByLink(originalLink?: string | null): string | null {
  if (!originalLink) return null;
  try {
    const host = new URL(originalLink).hostname.replace(/^www\./, '');
    const match = gallerySources.find(
      (s) => new URL(s.listUrl).hostname.replace(/^www\./, '') === host
    );
    return match ? match.name : null;
  } catch {
    return null;
  }
}

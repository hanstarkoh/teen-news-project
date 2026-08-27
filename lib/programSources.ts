import { GallerySource } from '@/lib/gallerySources';

// 프로그램 신청 정보를 긁어올 기관의 "공지사항" 게시판 설정.
// GallerySource와 셀렉터 구조는 동일하고, 지도에 핀을 꽂기 위한 좌표만 추가로 갖습니다.
export type ProgramSource = GallerySource & {
  lat: number;
  lng: number;
  address: string;
};

export const programSources: ProgramSource[] = [
  {
    id: 'geumjeong',
    name: '금정청소년수련관',
    listUrl: 'https://www.youthcool.or.kr/SW_bbs/notice/list.php?zipEncode==atpLrxydrMCH9MyMu2yPr3BU91vt1drjrMCH9MyMetpSfMvWLME',
    listItemSelector: '.subject_all a',
    listLinkSelector: 'self',
    listLinkFilter: 'view.php',
    listTitleSelector: 'strong',
    viewContainerSelector: '.bbsView .view',
    address: '부산광역시 금정구 기찰로 96번길 47',
    lat: 35.2390079,
    lng: 129.0953120,
  },
  {
    id: 'yangjeong',
    name: '양정청소년수련관',
    listUrl: 'https://www.power0924.org/SW_bbs/notice/list.php?zipEncode==u2yPr3BU91vt1drjrMCH9MyMetpSfMvWLME',
    listItemSelector: '.subject_all a',
    listLinkSelector: 'self',
    listLinkFilter: 'view.php',
    listTitleSelector: 'strong',
    viewContainerSelector: '.bbsView .view',
    address: '부산광역시 부산진구 동평로 405번길 85',
    lat: 35.1764430,
    lng: 129.0714302,
  },
  {
    id: 'seogu',
    name: '서구청소년문화의집',
    listUrl: 'https://www.seoguyouth.co.kr/SW_bbs/notice/list.php?zipEncode==u2yPr3BU91vt1drjrMCH9MyMetpSfMvWLME',
    listItemSelector: '.subject_all a',
    listLinkSelector: 'self',
    listLinkFilter: 'view.php',
    listTitleSelector: 'strong',
    viewContainerSelector: '.bbsView .view',
    address: '부산광역시 서구 천마로 87',
    lat: 35.0844976,
    lng: 129.0205745,
  },
  {
    id: 'suyeong',
    name: '수영구청소년문화의집',
    listUrl: 'http://www.seeyouth.or.kr/SW_bbs/notice/list.php?zipEncode=5f2CFv2yPr3BU91vt1drjrMCH9MyMetpSfMvWLME',
    listItemSelector: '.subject a',
    listLinkSelector: 'self',
    listLinkFilter: 'view.php',
    listTitleSelector: 'strong',
    viewContainerSelector: '.bbsView .view',
    address: '부산광역시 수영구 수영로 521번길 77',
    lat: 35.1530246,
    lng: 129.1083237,
  },
];

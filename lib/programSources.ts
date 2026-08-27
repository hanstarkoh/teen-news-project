// 프로그램 신청 정보를 긁어올 기관의 "프로그램 신청" 게시판 설정.
// 공지사항이 아니라, 기관들이 신청/모집 공고만 모아두는 전용 게시판을 긁습니다.
// 이 전용 게시판 템플릿은 기관마다 네 가지 형태 중 하나입니다:
//  - 'card': 카드형 목록(.program_list) + 상세페이지(program_view.php)가 따로 있는 형태
//  - 'table': 표 형태로 제목/접수기간/신청링크가 한 줄에 다 나오는 형태 (상세페이지 없음)
//  - 'onclick-table': 옛날 방식 <table>에 onclick="location.href='...'"으로 상세 이동 (가야/금곡 계열)
//  - 'onclick-card': onclick 카드형, 목록 안에 대상/접수기간이 이미 다 나와있어 상세페이지가 필요 없는 형태 (사상/사하/중구 계열)
export type ProgramBoardType = 'card' | 'table' | 'onclick-table' | 'onclick-card';

export type ProgramSource = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  boardType: ProgramBoardType;
  listUrl: string;
};

export const programSources: ProgramSource[] = [
  {
    id: 'geumjeong',
    name: '금정청소년수련관',
    boardType: 'card',
    listUrl: 'https://www.youthcool.or.kr/active/sub6.php',
    address: '부산광역시 금정구 기찰로 96번길 47',
    lat: 35.2390079,
    lng: 129.0953120,
  },
  {
    id: 'yangjeong',
    name: '양정청소년수련관',
    boardType: 'card',
    listUrl: 'https://www.power0924.org/community/sub2.php',
    address: '부산광역시 부산진구 동평로 405번길 85',
    lat: 35.1764430,
    lng: 129.0714302,
  },
  {
    id: 'seogu',
    name: '서구청소년문화의집',
    boardType: 'card',
    listUrl: 'https://www.seoguyouth.co.kr/board/sub1.php',
    address: '부산광역시 서구 천마로 87',
    lat: 35.0844976,
    lng: 129.0205745,
  },
  {
    id: 'suyeong',
    name: '수영구청소년문화의집',
    boardType: 'table',
    listUrl: 'http://www.seeyouth.or.kr/board/program.php',
    address: '부산광역시 수영구 수영로 521번길 77',
    lat: 35.1530246,
    lng: 129.1083237,
  },
  {
    id: 'gaya',
    name: '가야청소년센터',
    boardType: 'onclick-table',
    listUrl: 'http://gayayouth.or.kr/p44.php',
    address: '부산광역시 부산진구 엄광로 147번길 37 4층',
    lat: 35.1489509,
    lng: 129.0317938,
  },
  {
    id: 'geumgok',
    name: '금곡청소년수련관',
    boardType: 'onclick-table',
    listUrl: 'http://kum-gok.or.kr/program2_list_c.php',
    address: '부산광역시 북구 효열로 158',
    lat: 35.2595109,
    lng: 129.0166740,
  },
  {
    id: 'sasang',
    name: '사상구청소년센터',
    boardType: 'onclick-card',
    listUrl: 'https://www.yzzang.com/program1.php',
    address: '부산광역시 사상구 덕상로 129',
    lat: 35.1828393,
    lng: 128.9917979,
  },
  {
    id: 'saha',
    name: '사하구청소년문화의집',
    boardType: 'onclick-card',
    listUrl: 'http://www.sahayouth.or.kr/sb51.php',
    address: '부산광역시 사하구 다대로 716-1',
    lat: 35.0480476,
    lng: 128.9694075,
  },
  {
    id: 'junggu',
    name: '중구청소년문화의집',
    boardType: 'onclick-card',
    listUrl: 'https://purun1318.org/sb61.php',
    address: '부산광역시 중구 보수대로 124번길 24-2',
    lat: 35.1055952,
    lng: 129.0232611,
  },
];

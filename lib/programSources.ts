// 프로그램 신청 정보를 긁어올 기관의 "프로그램 신청" 게시판 설정.
// 공지사항이 아니라, 기관들이 신청/모집 공고만 모아두는 전용 게시판을 긁습니다.
// 이 전용 게시판 템플릿은 기관마다 두 가지 형태 중 하나입니다:
//  - 'card': 카드형 목록(.program_list) + 상세페이지(program_view.php)가 따로 있는 형태
//  - 'table': 표 형태로 제목/접수기간/신청링크가 한 줄에 다 나오는 형태 (상세페이지 없음)
export type ProgramBoardType = 'card' | 'table';

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
];

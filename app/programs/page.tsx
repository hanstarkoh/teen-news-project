'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

declare global {
  interface Window {
    L: any;
  }
}

type Program = {
  id: number;
  source_id: string;
  institution_name: string;
  is_program: boolean;
  program_name: string;
  target_audience: string;
  period: string;
  deadline: string;
  deadline_date: string | null;
  contact: string;
  summary: string;
  original_link: string;
  lat: number;
  lng: number;
  address: string;
  approved: boolean;
  created_at: string;
};

// 주소 문자열에서 "OO구"만 뽑아냅니다 (예: "부산광역시 금정구 기찰로..." → "금정구").
function getDistrict(address: string): string {
  const match = address.match(/(\S+구)(?=\s|$)/);
  return match ? match[1] : '기타';
}

function ProgramCard({ p }: { p: Program }) {
  return (
    <a
      href={p.original_link}
      target="_blank"
      rel="noopener noreferrer"
      className="block border border-gray-200 rounded-2xl p-4 hover:border-emerald-300 transition-all"
    >
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-xs font-bold">{p.institution_name}</span>
        {p.deadline && <span className="text-xs font-bold text-red-500">마감 {p.deadline}</span>}
      </div>
      <div className="font-bold text-gray-900">{p.program_name}</div>
      {p.summary && <p className="text-sm text-gray-600 mt-1">{p.summary}</p>}
      <div className="text-xs text-gray-400 mt-2 flex gap-3 flex-wrap">
        {p.target_audience && <span>👤 {p.target_audience}</span>}
        {p.period && <span>🗓️ {p.period}</span>}
        {p.contact && <span>☎️ {p.contact}</span>}
      </div>
    </a>
  );
}

export default function ProgramsPage() {
  const [map, setMap] = useState<any>(null);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [districtFilter, setDistrictFilter] = useState('all');
  const [selectedInstitution, setSelectedInstitution] = useState<string | null>(null);

  const router = useRouter();
  const mapContainer = useRef<HTMLDivElement>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('byNewsAdmin') === 'true') setIsAdmin(true);
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    setLoading(true);
    const { data } = await supabase.from('programs').select('*').order('created_at', { ascending: false });
    if (data) setPrograms(data);
    setLoading(false);
  };

  const todayKST = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });

  // 프로그램/모집 공고가 맞고, 관리자가 승인했고, 마감일이 지나지 않은 것만 공개로 보여줍니다.
  // 마감이 지난 프로그램은 삭제하지 않고 목록에서만 숨깁니다 (AI가 날짜를 잘못 읽었을 때를 대비).
  const approvedPrograms = programs
    .filter(p => p.approved && p.is_program && (!p.deadline_date || p.deadline_date >= todayKST))
    .sort((a, b) => {
      if (a.deadline_date && b.deadline_date) return a.deadline_date.localeCompare(b.deadline_date);
      if (a.deadline_date) return -1;
      if (b.deadline_date) return 1;
      return b.created_at.localeCompare(a.created_at);
    });
  const availableDistricts = Array.from(new Set(approvedPrograms.map(p => getDistrict(p.address)))).sort();

  // 지도 위 핀은 "구" 필터만 따르고, 특정 기관 선택 여부와는 무관하게 그대로 보여줍니다
  // (다른 핀을 바로 또 클릭할 수 있도록).
  const mapPrograms = approvedPrograms.filter(p => districtFilter === 'all' || getDistrict(p.address) === districtFilter);
  // 오른쪽 리스트는 구 필터 + 핀으로 고른 기관까지 둘 다 반영합니다.
  const listPrograms = mapPrograms.filter(p => !selectedInstitution || p.institution_name === selectedInstitution);

  // 기관을 하나도 안 골랐을 땐 기관별로 묶어서 보여줘야 어느 기관 건지 한눈에 들어옵니다.
  const groupedByInstitution = (() => {
    const groups = new Map<string, Program[]>();
    listPrograms.forEach(p => {
      if (!groups.has(p.institution_name)) groups.set(p.institution_name, []);
      groups.get(p.institution_name)!.push(p);
    });
    return groups;
  })();

  const handleDistrictChange = (value: string) => {
    setDistrictFilter(value);
    setSelectedInstitution(null);
  };

  const pendingPrograms = programs.filter(p => !p.approved && p.is_program);
  // 승인은 했지만 접수기간이 지나서 공개 목록에서 자동으로 숨겨진 것들.
  // 삭제하지 않고 보관만 하므로, 정리하고 싶은 관리자를 위해 여기서 볼 수 있게 합니다.
  const expiredPrograms = programs
    .filter(p => p.approved && p.is_program && p.deadline_date && p.deadline_date < todayKST)
    .sort((a, b) => (b.deadline_date || '').localeCompare(a.deadline_date || ''));

  const handleApprove = async (id: number) => {
    await supabase.from('programs').update({ approved: true }).eq('id', id);
    fetchPrograms();
  };

  const handleReject = async (id: number) => {
    if (window.confirm('이 프로그램을 목록에서 삭제하시겠습니까?')) {
      await supabase.from('programs').delete().eq('id', id);
      fetchPrograms();
    }
  };

  const handleDeleteExpired = async (id: number) => {
    await supabase.from('programs').delete().eq('id', id);
    fetchPrograms();
  };

  useEffect(() => {
    const initMap = () => {
      if (!window.L || !mapContainer.current || map) return;

      const initialMap = window.L.map(mapContainer.current).setView([35.1795543, 129.0756416], 12);

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(initialMap);

      setMap(initialMap);
    };

    if (window.L) {
      initMap();
    } else {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = initMap;
      document.head.appendChild(script);
    }
  }, []);

  useEffect(() => {
    if (!map || !window.L) return;

    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];

    // 같은 기관의 프로그램은 한 지점에 여러 개 있을 수 있어서, 기관별로 묶어 하나의 핀에 표시합니다.
    const grouped = new Map<string, Program[]>();
    mapPrograms.forEach(p => {
      const key = `${p.lat},${p.lng}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(p);
    });

    grouped.forEach((progs) => {
      const isSelected = progs[0].institution_name === selectedInstitution;
      const icon = window.L.divIcon({
        html: `<div style="width:${isSelected ? 26 : 20}px; height:${isSelected ? 26 : 20}px; border-radius:50%; background:${isSelected ? '#059669' : '#10b981'}; border:3px solid white; box-shadow:0 1px 4px rgba(0,0,0,0.4);"></div>`,
        className: '',
        iconSize: [isSelected ? 26 : 20, isSelected ? 26 : 20],
        iconAnchor: [isSelected ? 13 : 10, isSelected ? 13 : 10],
      });
      const marker = window.L.marker([progs[0].lat, progs[0].lng], { icon }).addTo(map);
      marker.bindTooltip(`${progs[0].institution_name} (${progs.length}건)`, { direction: 'top', offset: [0, -10] });

      marker.on('click', () => {
        setSelectedInstitution(progs[0].institution_name);
        map.panTo([progs[0].lat, progs[0].lng]);
      });

      markersRef.current.push(marker);
    });
  }, [map, mapPrograms, selectedInstitution]);

  return (
    <div className="min-h-screen bg-emerald-50 py-10 px-4 text-gray-900">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <button onClick={() => router.push('/')} className="text-gray-500 font-bold hover:text-emerald-700">← 홈으로</button>
          <h1 className="text-3xl font-black text-emerald-900 tracking-tight">📅 부산 청소년 프로그램 지도</h1>
          <div className="w-16"></div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-2/3 space-y-6">
            <div className="bg-white p-4 rounded-3xl shadow-md border border-emerald-100">
              <div className="flex flex-wrap items-center gap-3 mb-4 ml-1">
                <label className="text-sm font-bold text-gray-700">📍 구별 보기</label>
                <select
                  value={districtFilter}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  className="border border-gray-300 rounded-lg text-sm font-bold px-3 py-1.5 outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="all">전체 ({approvedPrograms.length})</option>
                  {availableDistricts.map(d => (
                    <option key={d} value={d}>{d} ({approvedPrograms.filter(p => getDistrict(p.address) === d).length})</option>
                  ))}
                </select>
                {selectedInstitution && (
                  <button onClick={() => setSelectedInstitution(null)} className="ml-auto text-xs font-bold text-emerald-700 hover:underline whitespace-nowrap">
                    ← 전체 기관 보기
                  </button>
                )}
              </div>

              <div className="flex flex-col md:flex-row gap-4">
                <div ref={mapContainer} className="w-full md:w-3/5 h-[500px] rounded-2xl border border-gray-200 z-0 relative flex-shrink-0"></div>

                <div className="w-full md:w-2/5 h-[500px] overflow-y-auto pr-1 space-y-4">
                  {loading ? (
                    <div className="text-center py-8 text-gray-400 font-bold text-sm">불러오는 중...</div>
                  ) : listPrograms.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 font-bold text-sm">
                      {approvedPrograms.length === 0 ? '아직 등록된 프로그램이 없습니다.' : '이 조건에 맞는 프로그램이 없어요.'}
                    </div>
                  ) : selectedInstitution ? (
                    <div className="space-y-3">
                      {listPrograms.map(p => <ProgramCard key={p.id} p={p} />)}
                    </div>
                  ) : (
                    Array.from(groupedByInstitution.entries()).map(([name, progs]) => (
                      <div key={name}>
                        <button
                          onClick={() => setSelectedInstitution(name)}
                          className="sticky top-0 bg-emerald-50/95 backdrop-blur w-full text-left px-2 py-1.5 rounded-lg text-xs font-bold text-emerald-800 mb-2 hover:bg-emerald-100 transition"
                        >
                          📍 {name} ({progs.length})
                        </button>
                        <div className="space-y-3">
                          {progs.map(p => <ProgramCard key={p.id} p={p} />)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3 ml-1">👇 지도 핀이나 기관 이름을 클릭하면 그 기관 프로그램만 오른쪽에 모아서 볼 수 있어요.</p>
            </div>
          </div>

          <div className="w-full lg:w-1/3 space-y-6">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-3xl shadow-md text-white">
              <h3 className="font-bold text-lg mb-2">💡 이용 가이드</h3>
              <ul className="text-sm space-y-2 opacity-90">
                <li>• 매일 아침 AI가 여러 청소년기관의 공지사항을 확인해 모집 공고를 자동으로 찾아와요.</li>
                <li>• 편집장이 실제 프로그램이 맞는지 확인한 뒤에만 지도에 표시됩니다.</li>
                <li>• 신청은 각 기관의 원문 링크를 눌러 직접 진행해주세요.</li>
              </ul>
            </div>

            {isAdmin && pendingPrograms.length > 0 && (
              <div className="bg-white p-6 rounded-3xl shadow-md border border-orange-200">
                <h3 className="font-bold text-lg mb-4 text-orange-600">🕵️ 승인 대기 중인 프로그램 ({pendingPrograms.length})</h3>
                <div className="space-y-3">
                  {pendingPrograms.map(p => (
                    <div key={p.id} className="border border-gray-200 rounded-2xl p-4">
                      <div className="text-xs text-gray-400 font-bold mb-1">{p.institution_name}</div>
                      <div className="font-bold text-gray-900">{p.program_name}</div>
                      {p.summary && <p className="text-sm text-gray-600 mt-1">{p.summary}</p>}
                      <div className="text-xs text-gray-400 mt-2 flex gap-3 flex-wrap">
                        {p.target_audience && <span>👤 {p.target_audience}</span>}
                        {p.period && <span>🗓️ {p.period}</span>}
                        {p.deadline && <span>⏰ {p.deadline}</span>}
                        {p.contact && <span>☎️ {p.contact}</span>}
                      </div>
                      <a href={p.original_link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline mt-2 inline-block">원본 글 확인하기 ↗</a>
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => handleApprove(p.id)} className="flex-1 bg-emerald-600 text-white text-sm font-bold py-2 rounded-xl hover:bg-emerald-700">승인</button>
                        <button onClick={() => handleReject(p.id)} className="flex-1 bg-red-100 text-red-600 text-sm font-bold py-2 rounded-xl hover:bg-red-200">삭제</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isAdmin && expiredPrograms.length > 0 && (
              <div className="bg-white p-6 rounded-3xl shadow-md border border-gray-200">
                <h3 className="font-bold text-lg mb-1 text-gray-500">📁 마감된 프로그램 ({expiredPrograms.length})</h3>
                <p className="text-xs text-gray-400 mb-4">접수기간이 지나 공개 목록에서는 자동으로 숨겨졌어요. 삭제하지 않아도 되고, 정리하고 싶은 것만 지우면 됩니다.</p>
                <div className="space-y-2">
                  {expiredPrograms.map(p => (
                    <div key={p.id} className="flex items-center justify-between gap-3 border border-gray-100 rounded-xl p-3">
                      <div className="min-w-0">
                        <div className="text-xs text-gray-400 font-bold">{p.institution_name}</div>
                        <div className="text-sm font-bold text-gray-700 truncate">{p.program_name}</div>
                        <div className="text-xs text-gray-400">마감 {p.deadline_date}</div>
                      </div>
                      <button onClick={() => handleDeleteExpired(p.id)} className="flex-shrink-0 bg-red-100 text-red-600 text-xs font-bold px-3 py-2 rounded-xl hover:bg-red-200">삭제</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

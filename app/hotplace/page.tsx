'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

// 오픈스트리트맵(Leaflet) 타입 설정
declare global {
  interface Window {
    L: any;
  }
}

export default function HotPlacePage() {
  const [map, setMap] = useState<any>(null);
  const [places, setPlaces] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  const [selectedLatLng, setSelectedLatLng] = useState<{ lat: number; lng: number } | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('가성비 맛집');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const router = useRouter();
  const mapContainer = useRef<HTMLDivElement>(null);
  const tempMarkerRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('byNewsAdmin') === 'true') setIsAdmin(true);
    fetchPlaces();
  }, []);

  const fetchPlaces = async () => {
    const { data } = await supabase.from('hotplaces').select('*').order('created_at', { ascending: false });
    if (data) setPlaces(data);
  };

  const approvedPlaces = places.filter(p => p.approved);
  const pendingPlaces = places.filter(p => !p.approved);

  const handleApprovePlace = async (id: number) => {
    await supabase.from('hotplaces').update({ approved: true }).eq('id', id);
    fetchPlaces();
  };

  const handleDeletePlace = async (id: number) => {
    if (window.confirm('이 핫플을 삭제하시겠습니까?')) {
      await supabase.from('hotplaces').delete().eq('id', id);
      fetchPlaces();
    }
  };

  // API 키 없이 완전 무료 지도를 가져오는 로직
  useEffect(() => {
    const initMap = () => {
      if (!window.L || !mapContainer.current || map) return;

      // 1. 지도 그리기 (부산 시청 중심)
      const initialMap = window.L.map(mapContainer.current).setView([35.1795543, 129.0756416], 13);

      // 2. 무료 타일(지도 이미지) 불러오기
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(initialMap);

      // 3. 지도 클릭 시 좌표 얻기 & 핀 꽂기
      initialMap.on('click', function(e: any) {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        setSelectedLatLng({ lat, lng });

        // 기존에 찍은 임시 핀 지우기
        if (tempMarkerRef.current) {
          initialMap.removeLayer(tempMarkerRef.current);
        }

        // 클릭한 곳에 핀 꽂고 말풍선 띄우기
        const newMarker = window.L.marker([lat, lng]).addTo(initialMap)
          .bindPopup("<b>여기에 등록할까요?</b><br>오른쪽 폼을 작성해주세요!").openPopup();
        tempMarkerRef.current = newMarker;
      });

      setMap(initialMap);
    };

    if (window.L) {
      initMap();
    } else {
      // 지도 디자인(CSS) 불러오기
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      // 지도 기능(JS) 불러오기
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = initMap;
      document.head.appendChild(script);
    }
  }, []);

  // 승인된 핫플만 지도에 뿌려주기
  useEffect(() => {
    if (!map || !window.L) return;

    // 기존 핀 지우기
    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];

    approvedPlaces.forEach(place => {
      const marker = window.L.marker([place.lat, place.lng]).addTo(map);

      const popupContent = `
        <div style="width:180px;">
          <h4 style="font-weight:bold; color:#111827; margin-bottom:4px; font-size:14px;">${place.title}</h4>
          <span style="font-size:11px; background:#f3f4f6; padding:2px 6px; font-weight:bold;">${place.category}</span>
          <p style="font-size:12px; margin-top:6px; color:#4b5563;">${place.description}</p>
        </div>
      `;

      marker.bindPopup(popupContent);
      markersRef.current.push(marker);
    });
  }, [map, places]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLatLng) return;

    setSubmitting(true);
    const { error } = await supabase.from('hotplaces').insert([{
      title, category, description, lat: selectedLatLng.lat, lng: selectedLatLng.lng, approved: false
    }]);

    if (!error) {
      alert('등록되었습니다. 편집장 승인 후 지도에 표시됩니다.');
      setTitle('');
      setDescription('');
      setSelectedLatLng(null);
      fetchPlaces();
    } else {
      alert('등록에 실패했습니다.');
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-white py-10 px-4 text-gray-900">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8 border-b border-gray-900 pb-4">
          <button onClick={() => router.push('/')} className="text-gray-500 font-bold text-sm hover:text-gray-900">← 홈으로</button>
          <h1 className="font-serif text-3xl font-black text-gray-900 tracking-tight">부산 청소년 핫플 지도</h1>
          <div className="w-16"></div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-2/3 bg-white p-4 border border-gray-200">
            <p className="text-sm font-bold text-gray-500 mb-4 ml-2">지도에서 원하는 위치를 클릭하면 핫플을 등록할 수 있어요.</p>

            {/* 오픈소스 지도가 그려질 도화지 (z-0을 줘서 메뉴바를 안 가리게 함) */}
            <div ref={mapContainer} className="w-full h-[500px] border border-gray-200 z-0 relative"></div>
          </div>

          <div className="w-full lg:w-1/3 space-y-6">
            <div className="bg-white p-6 border border-gray-200">
              <h3 className="font-serif font-bold text-gray-900 text-sm border-b-2 border-gray-900 pb-2 mb-4">내 아지트 공유하기</h3>

              {!selectedLatLng ? (
                <div className="bg-gray-50 text-gray-600 p-6 font-bold text-center text-sm border border-dashed border-gray-300">
                  먼저 왼쪽 지도에서<br/>공유하고 싶은 장소를 클릭해주세요.
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="text-xs font-bold text-gray-400">위치가 선택되었습니다. 내용을 입력해주세요.</div>
                  <input className="w-full p-3 border border-gray-300 bg-white text-gray-900 font-bold text-sm outline-none focus:ring-1 focus:ring-gray-900" placeholder="장소 이름 (예: 동래역 앞 스터디카페)" value={title} onChange={(e) => setTitle(e.target.value)} required />

                  <select className="w-full p-3 border border-gray-300 bg-white text-gray-900 font-bold text-sm outline-none focus:ring-1 focus:ring-gray-900" value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option>가성비 맛집</option>
                    <option>스터디 카페</option>
                    <option>사진 맛집</option>
                    <option>휴식/놀거리</option>
                  </select>

                  <textarea className="w-full p-3 border border-gray-300 bg-white text-gray-900 text-sm h-24 outline-none focus:ring-1 focus:ring-gray-900" placeholder="이곳의 꿀팁이나 특징을 알려주세요." value={description} onChange={(e) => setDescription(e.target.value)} required />

                  <button type="submit" disabled={submitting} className="w-full bg-gray-900 text-white font-bold p-3 text-sm hover:bg-black transition">
                    {submitting ? '등록 중...' : '지도에 핀 꽂기'}
                  </button>
                  <button type="button" onClick={() => setSelectedLatLng(null)} className="w-full text-gray-400 font-bold text-xs hover:text-gray-600">선택 취소</button>
                </form>
              )}
            </div>

            <div className="bg-gray-50 p-6 border border-gray-200">
              <h3 className="font-serif font-bold text-gray-900 text-sm border-b-2 border-gray-900 pb-2 mb-3">이용 가이드</h3>
              <ul className="text-xs text-gray-600 space-y-2">
                <li>· 누구나 핫플을 등록할 수 있어요.</li>
                <li>· 편집장 승인 후에 지도에 표시됩니다.</li>
                <li>· 부적절한 장소 등록 시 관리자에 의해 삭제될 수 있습니다.</li>
                <li>· 지도에 찍힌 핀을 클릭하면 정보를 볼 수 있어요.</li>
              </ul>
            </div>

            {isAdmin && pendingPlaces.length > 0 && (
              <div className="bg-white p-6 border border-gray-200">
                <h3 className="font-serif font-bold text-gray-900 text-sm border-b-2 border-red-600 pb-2 mb-4">승인 대기 중인 핫플 ({pendingPlaces.length})</h3>
                <div className="space-y-3">
                  {pendingPlaces.map(place => (
                    <div key={place.id} className="border border-gray-200 p-4">
                      <div className="font-bold text-gray-900 text-sm">{place.title}</div>
                      <div className="text-xs text-gray-400 font-bold mb-1">{place.category}</div>
                      <p className="text-sm text-gray-600 mb-3">{place.description}</p>
                      <div className="flex gap-2">
                        <button onClick={() => handleApprovePlace(place.id)} className="flex-1 bg-gray-900 text-white text-xs font-bold py-2 hover:bg-black">승인</button>
                        <button onClick={() => handleDeletePlace(place.id)} className="flex-1 bg-white text-red-600 border border-red-200 text-xs font-bold py-2 hover:bg-red-50">삭제</button>
                      </div>
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

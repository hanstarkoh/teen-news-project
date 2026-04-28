'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Script from 'next/script';

declare global {
  interface Window {
    kakao: any;
  }
}

export default function HotPlacePage() {
  const [map, setMap] = useState<any>(null);
  const [places, setPlaces] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  const [selectedLatLng, setSelectedLatLng] = useState<{ lat: number; lng: number } | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('가성비 맛집 🍔');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    fetchPlaces();
  }, []);

  const fetchPlaces = async () => {
    const { data } = await supabase.from('hotplaces').select('*').order('created_at', { ascending: false });
    if (data) setPlaces(data);
  };

  // ⭐️ 지도 로딩 안정화 
  const loadKakaoMap = () => {
    if (window.kakao && window.kakao.maps) {
      window.kakao.maps.load(() => {
        const container = document.getElementById('map');
        if (!container) return; // 컨테이너가 없으면 에러 방지

        const options = {
          center: new window.kakao.maps.LatLng(35.1795543, 129.0756416),
          level: 7
        };
        const newMap = new window.kakao.maps.Map(container, options);
        setMap(newMap);

        window.kakao.maps.event.addListener(newMap, 'click', function(mouseEvent: any) {
          setSelectedLatLng({ lat: mouseEvent.latLng.getLat(), lng: mouseEvent.latLng.getLng() });
        });
      });
    }
  };

  useEffect(() => {
    if (!map || places.length === 0) return;

    places.forEach(place => {
      const markerPosition = new window.kakao.maps.LatLng(place.lat, place.lng);
      const marker = new window.kakao.maps.Marker({ position: markerPosition });
      marker.setMap(map);

      const iwContent = `
        <div style="padding:10px; width:200px; border-radius:10px;">
          <h4 style="font-weight:bold; color:#1e40af; margin-bottom:4px;">${place.title}</h4>
          <span style="font-size:11px; background:#f3f4f6; padding:2px 6px; border-radius:4px; font-weight:bold;">${place.category}</span>
          <p style="font-size:12px; margin-top:6px; color:#4b5563;">${place.description}</p>
        </div>
      `;
      const infowindow = new window.kakao.maps.InfoWindow({ content: iwContent });

      window.kakao.maps.event.addListener(marker, 'mouseover', () => infowindow.open(map, marker));
      window.kakao.maps.event.addListener(marker, 'mouseout', () => infowindow.close());
    });
  }, [map, places]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('기자단 로그인 후 핫플을 추가할 수 있습니다!');
      return;
    }
    if (!selectedLatLng) return;
    
    setSubmitting(true);
    const { error } = await supabase.from('hotplaces').insert([{
      title, category, description, lat: selectedLatLng.lat, lng: selectedLatLng.lng
    }]);

    if (!error) {
      alert('🎉 새로운 핫플레이스가 지도에 등록되었습니다!');
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
    <div className="min-h-screen bg-blue-50 py-10 px-4 text-gray-900">
      {/* ⭐️ https:// 추가 및 beforeInteractive 설정으로 로딩 타이밍 변경 */}
      <Script
        strategy="beforeInteractive"
        src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=d19d054a9b9daf8e0fa961cba989ef2b&autoload=false`}
        onLoad={loadKakaoMap}
      />

      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <button onClick={() => router.push('/')} className="text-gray-500 font-bold hover:text-blue-700">← 홈으로</button>
          <h1 className="text-3xl font-black text-blue-900 tracking-tight">🗺️ 부산 청소년 핫플 지도</h1>
          <div className="w-16"></div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-2/3 bg-white p-4 rounded-3xl shadow-md border border-blue-100">
            <p className="text-sm font-bold text-blue-600 mb-4 ml-2">👇 지도에서 원하는 위치를 클릭하면 핫플을 등록할 수 있어요!</p>
            <div id="map" className="w-full h-[500px] rounded-2xl border border-gray-200"></div>
          </div>

          <div className="w-full lg:w-1/3 space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-md border border-blue-100">
              <h3 className="font-bold text-xl mb-4">📍 내 아지트 공유하기</h3>
              
              {!selectedLatLng ? (
                <div className="bg-blue-50 text-blue-800 p-6 rounded-2xl font-bold text-center border border-dashed border-blue-300">
                  먼저 왼쪽 지도에서<br/>공유하고 싶은 장소를 클릭해주세요!
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="text-xs font-bold text-gray-400">위치가 선택되었습니다! 내용을 입력해주세요.</div>
                  <input className="w-full p-3 border rounded-xl bg-gray-50 text-gray-900 font-bold" placeholder="장소 이름 (예: 동래역 앞 스터디카페)" value={title} onChange={(e) => setTitle(e.target.value)} required />
                  
                  <select className="w-full p-3 border rounded-xl bg-gray-50 text-gray-900 font-bold" value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option>가성비 맛집 🍔</option>
                    <option>스터디 카페 📚</option>
                    <option>사진 맛집 📸</option>
                    <option>휴식/놀거리 🎮</option>
                  </select>

                  <textarea className="w-full p-3 border rounded-xl bg-gray-50 text-gray-900 h-24" placeholder="이곳의 꿀팁이나 특징을 알려주세요!" value={description} onChange={(e) => setDescription(e.target.value)} required />
                  
                  <button type="submit" disabled={submitting} className="w-full bg-blue-700 text-white font-bold p-4 rounded-xl shadow-md hover:bg-blue-800 transition">
                    {submitting ? '등록 중...' : '지도에 핀 꽂기! 📌'}
                  </button>
                  <button type="button" onClick={() => setSelectedLatLng(null)} className="w-full text-gray-400 font-bold text-sm hover:text-gray-600">선택 취소</button>
                </form>
              )}
            </div>
            
            <div className="bg-gradient-to-br from-indigo-500 to-blue-600 p-6 rounded-3xl shadow-md text-white">
              <h3 className="font-bold text-lg mb-2">💡 이용 가이드</h3>
              <ul className="text-sm space-y-2 opacity-90">
                <li>• 핫플 등록은 <b>로그인한 기자단</b>만 가능해요.</li>
                <li>• 부적절한 장소 등록 시 관리자에 의해 삭제될 수 있습니다.</li>
                <li>• 지도에 찍힌 핀에 마우스를 올리면 정보를 볼 수 있어요!</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
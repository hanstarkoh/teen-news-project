'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
// ⭐️ 복잡한 스크립트 로딩을 한 줄로 끝내주는 마법의 공식 도구!
import { Map, MapMarker, CustomOverlayMap, useKakaoLoader } from 'react-kakao-maps-sdk';

export default function HotPlacePage() {
  const [places, setPlaces] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  const [selectedLatLng, setSelectedLatLng] = useState<{ lat: number; lng: number } | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('가성비 맛집 🍔');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hoveredPlace, setHoveredPlace] = useState<number | null>(null);

  const router = useRouter();

  // ⭐️ 여기서 카카오 지도를 가장 안전하게 불러옵니다!
  const [loading, error] = useKakaoLoader({
    appkey: "d19d054a9b9daf8e0fa961cba989ef2b",
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    fetchPlaces();
  }, []);

  const fetchPlaces = async () => {
    const { data } = await supabase.from('hotplaces').select('*').order('created_at', { ascending: false });
    if (data) setPlaces(data);
  };

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
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <button onClick={() => router.push('/')} className="text-gray-500 font-bold hover:text-blue-700">← 홈으로</button>
          <h1 className="text-3xl font-black text-blue-900 tracking-tight">🗺️ 부산 청소년 핫플 지도</h1>
          <div className="w-16"></div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-2/3 bg-white p-4 rounded-3xl shadow-md border border-blue-100">
            <p className="text-sm font-bold text-blue-600 mb-4 ml-2">👇 지도에서 원하는 위치를 클릭하면 핫플을 등록할 수 있어요!</p>

            {/* ⭐️ 로딩 상태와 에러 상태를 화면에 직접 보여줍니다 */}
            {error ? (
              <div className="w-full h-[500px] flex items-center justify-center bg-red-50 text-red-500 font-bold rounded-2xl border border-red-200 text-center p-6 leading-relaxed">
                ❌ 카카오 지도를 가져오지 못했습니다.<br/><br/>
                현재 사용 중인 인터넷(학교/관공서) 방화벽에서<br/>카카오 접속을 차단했을 확률이 99%입니다.<br/>스마트폰 데이터(핫스팟)로 연결해 보세요!
              </div>
            ) : loading ? (
              <div className="w-full h-[500px] flex items-center justify-center bg-gray-100 text-gray-400 font-bold rounded-2xl border border-gray-200">
                지도를 안전하게 불러오는 중입니다... 🚀
              </div>
            ) : (
              <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm relative">
                <Map
                  center={{ lat: 35.1795543, lng: 129.0756416 }}
                  style={{ width: "100%", height: "500px" }}
                  level={7}
                  onClick={(_t, mouseEvent) => setSelectedLatLng({
                    lat: mouseEvent.latLng.getLat(),
                    lng: mouseEvent.latLng.getLng(),
                  })}
                >
                  {/* 클릭한 곳에 꽂히는 임시 빨간 핀 */}
                  {selectedLatLng && (
                    <MapMarker position={selectedLatLng} image={{ src: 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png', size: { width: 24, height: 35 } }} />
                  )}

                  {/* 데이터베이스에 저장된 핫플 마커들 */}
                  {places.map((place) => (
                    <div key={place.id}>
                      <MapMarker
                        position={{ lat: place.lat, lng: place.lng }}
                        onMouseOver={() => setHoveredPlace(place.id)}
                        onMouseOut={() => setHoveredPlace(null)}
                      />
                      {/* 마우스 올리면 뜨는 예쁜 말풍선 */}
                      {hoveredPlace === place.id && (
                        <CustomOverlayMap position={{ lat: place.lat, lng: place.lng }} yAnchor={1.5}>
                          <div className="bg-white p-3 rounded-xl shadow-lg border border-blue-200 w-48 z-10 absolute -left-24">
                            <h4 className="font-bold text-blue-800 text-sm mb-1">{place.title}</h4>
                            <span className="text-[10px] bg-gray-100 px-2 py-1 rounded text-gray-600 font-bold">{place.category}</span>
                            <p className="text-xs mt-2 text-gray-600">{place.description}</p>
                          </div>
                        </CustomOverlayMap>
                      )}
                    </div>
                  ))}
                </Map>
              </div>
            )}
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
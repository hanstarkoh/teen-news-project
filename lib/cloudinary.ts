// Cloudinary의 "fetch" 배달 방식으로 원본 이미지 URL을 그대로 가져와
// 얼굴만 자동으로 블러 처리한 URL로 바꿔줍니다. 원본 서버에는 아무 영향 없고,
// 우리 쪽에서 저장/표시하는 thumbnail_url만 블러 처리된 버전이 됩니다.
// CLOUDINARY_CLOUD_NAME이 설정 안 되어 있으면 원본 URL을 그대로 반환합니다(안전한 기본값).
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;

export function blurFacesUrl(originalUrl: string): string {
  if (!CLOUD_NAME || !originalUrl) return originalUrl;
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/fetch/e_blur_faces:1000/${encodeURIComponent(originalUrl)}`;
}

// 사진 전체를 블러 처리합니다. 얼굴 감지가 실패했을 때의 안전한 대체 수단입니다.
function fullBlurUrl(originalUrl: string): string {
  if (!CLOUD_NAME || !originalUrl) return originalUrl;
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/fetch/e_blur:1500/${encodeURIComponent(originalUrl)}`;
}

// Cloudinary의 얼굴 감지(콜라주 사진, 작고 여러 명이 겹친 사진 등)는 완벽하지 않아서,
// 감지된 얼굴이 하나도 없으면 조용히 원본과 똑같은(블러 안 된) 사진을 돌려줍니다.
// fl_getinfo 플래그로 실제 감지된 얼굴 개수를 확인해서, 0명이면 사진 전체를 블러 처리하는
// 쪽으로 안전하게 대체합니다 (인물 사진이 그대로 노출되는 것보다 안전한 쪽을 택함).
export async function resolveSafeBlurredUrl(originalUrl: string): Promise<string> {
  if (!CLOUD_NAME || !originalUrl) return originalUrl;

  const infoUrl = `https://res.cloudinary.com/${CLOUD_NAME}/image/fetch/fl_getinfo,e_blur_faces:1000/${encodeURIComponent(originalUrl)}`;

  try {
    const res = await fetch(infoUrl);
    const data = await res.json();
    const faceCount = Array.isArray(data?.landmarks?.[0]) ? data.landmarks[0].length : 0;

    return faceCount > 0 ? blurFacesUrl(originalUrl) : fullBlurUrl(originalUrl);
  } catch (err) {
    console.error('얼굴 감지 확인 실패, 안전하게 전체 블러로 대체:', err);
    return fullBlurUrl(originalUrl);
  }
}

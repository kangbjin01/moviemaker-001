// 날씨 및 일출/일몰 정보 자동 조회
// Open-Meteo API (무료, API 키 불필요)
// Daum Postcode + 한국 도시 좌표 매핑

export interface WeatherInfo {
  weather: string // 날씨 (맑음, 흐림, 비 등)
  precipitation: string // 강수확률 (%)
  tempLow: string // 최저온도
  tempHigh: string // 최고온도
  sunrise: string // 일출시간
  sunset: string // 일몰시간
}

interface GeocodingResult {
  lat: number
  lon: number
}

// 한국 주요 시/도 좌표 (시청 기준)
const KOREAN_CITY_COORDS: Record<string, GeocodingResult> = {
  '서울': { lat: 37.5665, lon: 126.9780 },
  '서울특별시': { lat: 37.5665, lon: 126.9780 },
  '부산': { lat: 35.1796, lon: 129.0756 },
  '부산광역시': { lat: 35.1796, lon: 129.0756 },
  '대구': { lat: 35.8714, lon: 128.6014 },
  '대구광역시': { lat: 35.8714, lon: 128.6014 },
  '인천': { lat: 37.4563, lon: 126.7052 },
  '인천광역시': { lat: 37.4563, lon: 126.7052 },
  '광주': { lat: 35.1595, lon: 126.8526 },
  '광주광역시': { lat: 35.1595, lon: 126.8526 },
  '대전': { lat: 36.3504, lon: 127.3845 },
  '대전광역시': { lat: 36.3504, lon: 127.3845 },
  '울산': { lat: 35.5384, lon: 129.3114 },
  '울산광역시': { lat: 35.5384, lon: 129.3114 },
  '세종': { lat: 36.4800, lon: 127.2890 },
  '세종특별자치시': { lat: 36.4800, lon: 127.2890 },
  '경기': { lat: 37.4138, lon: 127.5183 },
  '경기도': { lat: 37.4138, lon: 127.5183 },
  '강원': { lat: 37.8228, lon: 128.1555 },
  '강원도': { lat: 37.8228, lon: 128.1555 },
  '강원특별자치도': { lat: 37.8228, lon: 128.1555 },
  '충북': { lat: 36.6357, lon: 127.4912 },
  '충청북도': { lat: 36.6357, lon: 127.4912 },
  '충남': { lat: 36.6588, lon: 126.6728 },
  '충청남도': { lat: 36.6588, lon: 126.6728 },
  '전북': { lat: 35.8203, lon: 127.1089 },
  '전라북도': { lat: 35.8203, lon: 127.1089 },
  '전북특별자치도': { lat: 35.8203, lon: 127.1089 },
  '전남': { lat: 34.8161, lon: 126.4629 },
  '전라남도': { lat: 34.8161, lon: 126.4629 },
  '경북': { lat: 36.4919, lon: 128.8889 },
  '경상북도': { lat: 36.4919, lon: 128.8889 },
  '경남': { lat: 35.4606, lon: 128.2132 },
  '경상남도': { lat: 35.4606, lon: 128.2132 },
  '제주': { lat: 33.4996, lon: 126.5312 },
  '제주특별자치도': { lat: 33.4996, lon: 126.5312 },
}

// 한국 주요 구/군 좌표
const KOREAN_DISTRICT_COORDS: Record<string, GeocodingResult> = {
  // 서울
  '강남구': { lat: 37.5172, lon: 127.0473 },
  '강동구': { lat: 37.5301, lon: 127.1238 },
  '강북구': { lat: 37.6396, lon: 127.0257 },
  '강서구': { lat: 37.5509, lon: 126.8495 },
  '관악구': { lat: 37.4784, lon: 126.9516 },
  '광진구': { lat: 37.5385, lon: 127.0823 },
  '구로구': { lat: 37.4954, lon: 126.8874 },
  '금천구': { lat: 37.4519, lon: 126.9020 },
  '노원구': { lat: 37.6542, lon: 127.0568 },
  '도봉구': { lat: 37.6688, lon: 127.0471 },
  '동대문구': { lat: 37.5744, lon: 127.0400 },
  '동작구': { lat: 37.5124, lon: 126.9393 },
  '마포구': { lat: 37.5663, lon: 126.9014 },
  '서대문구': { lat: 37.5791, lon: 126.9368 },
  '서초구': { lat: 37.4837, lon: 127.0324 },
  '성동구': { lat: 37.5633, lon: 127.0371 },
  '성북구': { lat: 37.5894, lon: 127.0167 },
  '송파구': { lat: 37.5145, lon: 127.1066 },
  '양천구': { lat: 37.5169, lon: 126.8665 },
  '영등포구': { lat: 37.5264, lon: 126.8962 },
  '용산구': { lat: 37.5324, lon: 126.9907 },
  '은평구': { lat: 37.6027, lon: 126.9291 },
  '종로구': { lat: 37.5735, lon: 126.9790 },
  '중구': { lat: 37.5641, lon: 126.9979 },
  '중랑구': { lat: 37.6063, lon: 127.0925 },
}

// 주소에서 좌표 추출 (한국 도시 매핑 우선)
function getKoreanCityCoords(address: string): GeocodingResult | null {
  // 구/군 먼저 체크
  for (const [district, coords] of Object.entries(KOREAN_DISTRICT_COORDS)) {
    if (address.includes(district)) {
      return coords
    }
  }

  // 시/도 체크
  for (const [city, coords] of Object.entries(KOREAN_CITY_COORDS)) {
    if (address.includes(city)) {
      return coords
    }
  }

  return null
}

// 주소를 좌표로 변환
async function geocodeAddress(address: string): Promise<GeocodingResult | null> {
  console.log('[Weather] Geocoding address:', address)

  // 1. 한국 도시/구 매핑으로 먼저 시도
  const koreanCoords = getKoreanCityCoords(address)
  if (koreanCoords) {
    console.log('[Weather] Found Korean city mapping:', koreanCoords)
    return koreanCoords
  }

  console.log('[Weather] No Korean mapping found, trying Nominatim...')
  // 2. Nominatim fallback
  return geocodeAddressFallback(address)
}

// Fallback: Nominatim with Korea suffix
async function geocodeAddressFallback(address: string): Promise<GeocodingResult | null> {
  try {
    const searchQuery = `${address}, 대한민국`
    const encodedAddress = encodeURIComponent(searchQuery)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&countrycodes=kr`,
      {
        headers: {
          'User-Agent': 'FilmProductionOS/1.0',
        },
      }
    )

    if (!response.ok) return null

    const data = await response.json()
    if (data.length === 0) return null

    return {
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon),
    }
  } catch (error) {
    console.error('Fallback geocoding error:', error)
    return null
  }
}

// WMO 날씨 코드를 한글로 변환
function getWeatherDescription(code: number): string {
  const weatherCodes: Record<number, string> = {
    0: '맑음',
    1: '대체로 맑음',
    2: '구름 조금',
    3: '흐림',
    45: '안개',
    48: '안개',
    51: '이슬비',
    53: '이슬비',
    55: '이슬비',
    56: '진눈깨비',
    57: '진눈깨비',
    61: '약한 비',
    63: '비',
    65: '강한 비',
    66: '진눈깨비',
    67: '진눈깨비',
    71: '약한 눈',
    73: '눈',
    75: '강한 눈',
    77: '눈',
    80: '소나기',
    81: '소나기',
    82: '강한 소나기',
    85: '눈보라',
    86: '눈보라',
    95: '뇌우',
    96: '뇌우',
    99: '뇌우',
  }
  return weatherCodes[code] || '맑음'
}

// 시간 포맷 (ISO -> 한글)
function formatTime(isoTime: string): string {
  const date = new Date(isoTime)
  const hours = date.getHours()
  const minutes = date.getMinutes()
  return `${hours}시 ${minutes.toString().padStart(2, '0')}분`
}

// 날씨 정보 조회
export async function fetchWeatherInfo(
  date: string, // YYYY-MM-DD
  address: string
): Promise<WeatherInfo | null> {
  console.log('[Weather] fetchWeatherInfo called with:', { date, address })

  try {
    // 1. 주소를 좌표로 변환
    const coords = await geocodeAddress(address)
    if (!coords) {
      console.error('[Weather] Failed to geocode address:', address)
      return null
    }

    console.log('[Weather] Coords found:', coords)

    // 2. Open-Meteo API로 날씨 조회
    const apiUrl = `https://api.open-meteo.com/v1/forecast?` +
      `latitude=${coords.lat}&longitude=${coords.lon}` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset` +
      `&timezone=Asia/Seoul` +
      `&start_date=${date}&end_date=${date}`

    console.log('[Weather] Fetching from:', apiUrl)

    const response = await fetch(apiUrl)

    if (!response.ok) {
      console.error('[Weather] API error:', response.status)
      return null
    }

    const data = await response.json()
    console.log('[Weather] API response:', data)

    if (!data.daily || data.daily.time.length === 0) {
      console.error('[Weather] No weather data for date:', date)
      return null
    }

    const daily = data.daily

    const result = {
      weather: getWeatherDescription(daily.weather_code[0]),
      precipitation: `${daily.precipitation_probability_max[0] || 0}%`,
      tempLow: `${Math.round(daily.temperature_2m_min[0])}`,
      tempHigh: `${Math.round(daily.temperature_2m_max[0])}`,
      sunrise: formatTime(daily.sunrise[0]),
      sunset: formatTime(daily.sunset[0]),
    }

    console.log('[Weather] Result:', result)
    return result
  } catch (error) {
    console.error('[Weather] Fetch error:', error)
    return null
  }
}

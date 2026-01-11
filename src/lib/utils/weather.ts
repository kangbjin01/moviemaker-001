// 날씨 및 일출/일몰 정보 자동 조회
// Open-Meteo API (무료, API 키 불필요)
// Nominatim API for geocoding (무료)

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

// 주소를 좌표로 변환 (Nominatim - OpenStreetMap)
async function geocodeAddress(address: string): Promise<GeocodingResult | null> {
  try {
    const encodedAddress = encodeURIComponent(address)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`,
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
    console.error('Geocoding error:', error)
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
  try {
    // 1. 주소를 좌표로 변환
    const coords = await geocodeAddress(address)
    if (!coords) {
      console.error('Failed to geocode address:', address)
      return null
    }

    // 2. Open-Meteo API로 날씨 조회
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?` +
        `latitude=${coords.lat}&longitude=${coords.lon}` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset` +
        `&timezone=Asia/Seoul` +
        `&start_date=${date}&end_date=${date}`
    )

    if (!response.ok) {
      console.error('Weather API error:', response.status)
      return null
    }

    const data = await response.json()

    if (!data.daily || data.daily.time.length === 0) {
      console.error('No weather data for date:', date)
      return null
    }

    const daily = data.daily

    return {
      weather: getWeatherDescription(daily.weather_code[0]),
      precipitation: `${daily.precipitation_probability_max[0] || 0}%`,
      tempLow: `${Math.round(daily.temperature_2m_min[0])}`,
      tempHigh: `${Math.round(daily.temperature_2m_max[0])}`,
      sunrise: formatTime(daily.sunrise[0]),
      sunset: formatTime(daily.sunset[0]),
    }
  } catch (error) {
    console.error('Weather fetch error:', error)
    return null
  }
}

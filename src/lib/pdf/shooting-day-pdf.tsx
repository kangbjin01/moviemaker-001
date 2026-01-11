import React from 'react'
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'

// Pretendard 폰트 등록
Font.register({
  family: 'Pretendard',
  fonts: [
    {
      src: 'https://cdn.jsdelivr.net/gh/Project-Noonnu/noonfonts_2107@1.1/Pretendard-Regular.woff',
      fontWeight: 400,
    },
    {
      src: 'https://cdn.jsdelivr.net/gh/Project-Noonnu/noonfonts_2107@1.1/Pretendard-Bold.woff',
      fontWeight: 700,
    },
  ],
})

// 타입 정의
interface ShootingDayPDFData {
  projectName: string
  dayNumber: number | null
  shootDate: string
  callTime: string | null
  weather: string | null
  tempLow: string | null
  tempHigh: string | null
  baseLocation: string | null
  assemblyLocation: string | null
  precipitation: string | null
  sunrise: string | null
  sunset: string | null
  shootingTimeStart: string | null
  shootingTimeEnd: string | null
  notes: string | null

  shotPlanItems: Array<{
    sequence: number
    scene_number: string | null
    cut_number: string | null
    scene_time: string | null
    scene_location_type: string | null
    start_time: string | null
    end_time: string | null
    location: string | null
    content: string
    notes: string | null
  }>

  scheduleItems: Array<{
    sequence: number
    time: string
    title: string
    description: string
  }>

  staffItems: Array<{
    role: string
    name: string
    phone: string
  }>

  equipmentItems: Array<{
    department: string
    content: string
  }>

  castItems: Array<{
    character_name: string
    actor_name: string
    call_time: string
    call_location: string
    scenes: string
    costume_props: string
    phone: string
  }>
}

// 스타일 정의 (잉크 절약형)
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 8,
    fontFamily: 'Pretendard',
    backgroundColor: '#ffffff',
  },

  // 헤더
  header: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottom: '2px solid #000000',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  headerDate: {
    fontSize: 10,
    color: '#333333',
    textAlign: 'center',
    marginTop: 4,
  },

  // 기본정보 테이블
  infoSection: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 6,
    paddingBottom: 3,
    borderBottom: '1px solid #666666',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  infoItem: {
    flexDirection: 'row',
    width: '23%',
    marginBottom: 3,
  },
  infoLabel: {
    fontWeight: 'bold',
    marginRight: 4,
    color: '#333333',
  },
  infoValue: {
    color: '#000000',
  },
  infoItemWide: {
    flexDirection: 'row',
    width: '48%',
    marginBottom: 3,
  },

  // 테이블 공통
  table: {
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderTop: '1px solid #333333',
    borderBottom: '1px solid #333333',
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '0.5px solid #cccccc',
    paddingVertical: 3,
    paddingHorizontal: 4,
  },
  tableCell: {
    fontSize: 7,
    color: '#000000',
  },
  tableCellHeader: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#000000',
  },

  // 촬영계획 테이블 컬럼
  col1: { width: '4%' },   // 순서
  col2: { width: '6%' },   // S#
  col3: { width: '5%' },   // CUT
  col4: { width: '4%' },   // M/D/E/N
  col5: { width: '3%' },   // I/E
  col6: { width: '8%' },   // 시작시간
  col7: { width: '8%' },   // 종료시간
  col8: { width: '15%' },  // 장소
  col9: { width: '30%' },  // 내용
  col10: { width: '17%' }, // 비고

  // 하단 섹션 (3단 레이아웃)
  bottomSection: {
    marginTop: 10,
  },
  threeColumnLayout: {
    flexDirection: 'row',
    gap: 10,
  },
  column: {
    flex: 1,
  },
  miniTable: {
    marginBottom: 10,
  },
  miniTableRow: {
    flexDirection: 'row',
    borderBottom: '0.5px solid #cccccc',
    paddingVertical: 2,
    paddingHorizontal: 3,
  },

  // 캐스트 테이블 컬럼
  castCol1: { width: '15%' }, // 배역
  castCol2: { width: '12%' }, // 연기자
  castCol3: { width: '10%' }, // 집합시간
  castCol4: { width: '18%' }, // 집합위치
  castCol5: { width: '12%' }, // 등장씬
  castCol6: { width: '20%' }, // 의상/소품
  castCol7: { width: '13%' }, // 연락처

  // 스태프 테이블 컬럼
  staffCol1: { width: '30%' }, // 역할
  staffCol2: { width: '35%' }, // 이름
  staffCol3: { width: '35%' }, // 연락처

  // 일정 테이블 컬럼
  scheduleCol1: { width: '15%' }, // 시간
  scheduleCol2: { width: '30%' }, // 일정명
  scheduleCol3: { width: '55%' }, // 내용

  // 세부진행 섹션 (3x3 그리드)
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  detailCell: {
    width: '31.5%',
    border: '0.5px solid #cccccc',
    padding: 4,
    marginBottom: 4,
  },
  detailTitle: {
    fontSize: 7,
    fontWeight: 'bold',
    marginBottom: 2,
    borderBottom: '0.5px solid #e0e0e0',
    paddingBottom: 2,
  },
  detailContent: {
    fontSize: 6,
    color: '#333333',
    minHeight: 20,
  },
})

// 부서명 한글 매핑
const departmentNameMap: Record<string, string> = {
  'direction': '연출',
  'assistant_direction': '조연출',
  'camera': '촬영/관련장비',
  'lighting': '조명',
  'sound': '음향',
  'art': '미술',
  'costume': '의상',
  'production': '제작',
  'others': '기타',
  // 한글도 지원
  '연출': '연출',
  '조연출': '조연출',
  '촬영': '촬영/관련장비',
  '조명': '조명',
  '음향': '음향',
  '미술': '미술',
  '의상': '의상',
  '제작': '제작',
  '기타': '기타',
}

export function ShootingDayPDF({ data }: { data: ShootingDayPDFData }) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{data.projectName} {data.dayNumber || '-'}회차 일일촬영계획표</Text>
          <Text style={styles.headerDate}>{data.shootDate}</Text>
        </View>

        {/* 기본정보 */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>기본정보</Text>
          <View style={styles.infoGrid}>
            {/* 시간 정보 */}
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>집합시간:</Text>
              <Text style={styles.infoValue}>{data.callTime || '-'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>촬영시작:</Text>
              <Text style={styles.infoValue}>{data.shootingTimeStart || '-'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>촬영종료:</Text>
              <Text style={styles.infoValue}>{data.shootingTimeEnd || '-'}</Text>
            </View>

            {/* 장소 정보 */}
            <View style={styles.infoItemWide}>
              <Text style={styles.infoLabel}>촬영장소:</Text>
              <Text style={styles.infoValue}>{data.baseLocation || '-'}</Text>
            </View>
            <View style={styles.infoItemWide}>
              <Text style={styles.infoLabel}>집합장소:</Text>
              <Text style={styles.infoValue}>{data.assemblyLocation || '-'}</Text>
            </View>

            {/* 날씨 정보 */}
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>일기:</Text>
              <Text style={styles.infoValue}>{data.weather || '-'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>강수:</Text>
              <Text style={styles.infoValue}>{data.precipitation || '-'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>최저:</Text>
              <Text style={styles.infoValue}>{data.tempLow || '-'}°C</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>최고:</Text>
              <Text style={styles.infoValue}>{data.tempHigh || '-'}°C</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>일출:</Text>
              <Text style={styles.infoValue}>{data.sunrise || '-'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>일몰:</Text>
              <Text style={styles.infoValue}>{data.sunset || '-'}</Text>
            </View>

            {/* 기타사항 */}
            {data.notes && (
              <View style={{ width: '100%', marginTop: 3 }}>
                <Text style={styles.infoLabel}>기타사항: <Text style={styles.infoValue}>{data.notes}</Text></Text>
              </View>
            )}
          </View>
        </View>

        {/* 촬영계획 테이블 */}
        <View style={styles.table}>
          <Text style={styles.sectionTitle}>촬영계획</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCellHeader, styles.col1]}>순서</Text>
            <Text style={[styles.tableCellHeader, styles.col2]}>S#</Text>
            <Text style={[styles.tableCellHeader, styles.col3]}>CUT</Text>
            <Text style={[styles.tableCellHeader, styles.col4]}>시간</Text>
            <Text style={[styles.tableCellHeader, styles.col5]}>I/E</Text>
            <Text style={[styles.tableCellHeader, styles.col6]}>시작</Text>
            <Text style={[styles.tableCellHeader, styles.col7]}>종료</Text>
            <Text style={[styles.tableCellHeader, styles.col8]}>장소</Text>
            <Text style={[styles.tableCellHeader, styles.col9]}>내용</Text>
            <Text style={[styles.tableCellHeader, styles.col10]}>비고</Text>
          </View>
          {data.shotPlanItems.map((item) => (
            <View key={item.sequence} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.col1]}>{item.sequence}</Text>
              <Text style={[styles.tableCell, styles.col2]}>{item.scene_number || '-'}</Text>
              <Text style={[styles.tableCell, styles.col3]}>{item.cut_number || '-'}</Text>
              <Text style={[styles.tableCell, styles.col4]}>{item.scene_time || '-'}</Text>
              <Text style={[styles.tableCell, styles.col5]}>{item.scene_location_type || '-'}</Text>
              <Text style={[styles.tableCell, styles.col6]}>{item.start_time || '-'}</Text>
              <Text style={[styles.tableCell, styles.col7]}>{item.end_time || '-'}</Text>
              <Text style={[styles.tableCell, styles.col8]}>{item.location || '-'}</Text>
              <Text style={[styles.tableCell, styles.col9]}>{item.content || '-'}</Text>
              <Text style={[styles.tableCell, styles.col10]}>{item.notes || '-'}</Text>
            </View>
          ))}
        </View>

        {/* 하단 섹션 (2단 레이아웃) */}
        <View style={styles.bottomSection}>
          <View style={styles.threeColumnLayout}>
            {/* 전체일정 */}
            <View style={styles.column}>
              <Text style={styles.sectionTitle}>전체일정</Text>
              <View style={styles.miniTable}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableCellHeader, styles.scheduleCol1]}>시간</Text>
                  <Text style={[styles.tableCellHeader, styles.scheduleCol2]}>일정</Text>
                  <Text style={[styles.tableCellHeader, styles.scheduleCol3]}>내용</Text>
                </View>
                {data.scheduleItems.slice(0, 8).map((item) => (
                  <View key={item.sequence} style={styles.miniTableRow}>
                    <Text style={[styles.tableCell, styles.scheduleCol1]}>{item.time}</Text>
                    <Text style={[styles.tableCell, styles.scheduleCol2]}>{item.title}</Text>
                    <Text style={[styles.tableCell, styles.scheduleCol3]}>{item.description}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* 스태프 */}
            <View style={styles.column}>
              <Text style={styles.sectionTitle}>스태프</Text>
              <View style={styles.miniTable}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableCellHeader, styles.staffCol1]}>역할</Text>
                  <Text style={[styles.tableCellHeader, styles.staffCol2]}>이름</Text>
                  <Text style={[styles.tableCellHeader, styles.staffCol3]}>연락처</Text>
                </View>
                {data.staffItems.slice(0, 8).map((item, idx) => (
                  <View key={idx} style={styles.miniTableRow}>
                    <Text style={[styles.tableCell, styles.staffCol1]}>{item.role}</Text>
                    <Text style={[styles.tableCell, styles.staffCol2]}>{item.name}</Text>
                    <Text style={[styles.tableCell, styles.staffCol3]}>{item.phone}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* 세부진행 (별도 페이지) */}
        <View break />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{data.projectName} {data.dayNumber || '-'}회차 세부진행</Text>
          <Text style={styles.headerDate}>{data.shootDate}</Text>
        </View>
        <View style={styles.detailGrid}>
          {data.equipmentItems.map((item, idx) => (
            <View key={idx} style={styles.detailCell}>
              <Text style={styles.detailTitle}>{departmentNameMap[item.department] || item.department}</Text>
              <Text style={styles.detailContent}>{item.content || '-'}</Text>
            </View>
          ))}
        </View>

        {/* 캐스트 (같은 페이지) */}
        {data.castItems.length > 0 && (
          <View style={{ marginTop: 15 }}>
            <Text style={styles.sectionTitle}>캐스트 리스트</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableCellHeader, styles.castCol1]}>배역</Text>
                <Text style={[styles.tableCellHeader, styles.castCol2]}>연기자</Text>
                <Text style={[styles.tableCellHeader, styles.castCol3]}>집합시간</Text>
                <Text style={[styles.tableCellHeader, styles.castCol4]}>집합위치</Text>
                <Text style={[styles.tableCellHeader, styles.castCol5]}>등장씬</Text>
                <Text style={[styles.tableCellHeader, styles.castCol6]}>의상/소품</Text>
                <Text style={[styles.tableCellHeader, styles.castCol7]}>연락처</Text>
              </View>
              {data.castItems.map((item, idx) => (
                <View key={idx} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.castCol1]}>{item.character_name}</Text>
                  <Text style={[styles.tableCell, styles.castCol2]}>{item.actor_name}</Text>
                  <Text style={[styles.tableCell, styles.castCol3]}>{item.call_time}</Text>
                  <Text style={[styles.tableCell, styles.castCol4]}>{item.call_location}</Text>
                  <Text style={[styles.tableCell, styles.castCol5]}>{item.scenes}</Text>
                  <Text style={[styles.tableCell, styles.castCol6]}>{item.costume_props}</Text>
                  <Text style={[styles.tableCell, styles.castCol7]}>{item.phone}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </Page>
    </Document>
  )
}

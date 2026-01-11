'use client'

import { useCallback } from 'react'
import { Input } from './input'
import { Button } from './button'
import { Search } from 'lucide-react'

// Daum Postcode 타입 선언
declare global {
  interface Window {
    daum: {
      Postcode: new (options: {
        oncomplete: (data: DaumPostcodeResult) => void
        onclose?: () => void
        width?: string | number
        height?: string | number
      }) => {
        open: () => void
        embed: (element: HTMLElement) => void
      }
    }
  }
}

interface DaumPostcodeResult {
  zonecode: string // 우편번호
  address: string // 기본 주소
  addressEnglish: string // 영문 주소
  addressType: 'R' | 'J' // R: 도로명, J: 지번
  roadAddress: string // 도로명 주소
  roadAddressEnglish: string
  jibunAddress: string // 지번 주소
  jibunAddressEnglish: string
  buildingName: string // 건물명
  buildingCode: string
  apartment: 'Y' | 'N' // 아파트 여부
  sido: string // 시도
  sigungu: string // 시군구
  sigunguCode: string
  bname: string // 법정동/법정리
  bname1: string
  bname2: string
  roadname: string // 도로명
  roadnameCode: string
}

interface AddressInputProps {
  value: string
  onChange: (address: string, extraData?: { sido: string; sigungu: string }) => void
  placeholder?: string
  className?: string
}

export function AddressInput({
  value,
  onChange,
  placeholder = '주소 검색',
  className,
}: AddressInputProps) {
  const handleSearch = useCallback(() => {
    if (!window.daum) {
      alert('주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.')
      return
    }

    new window.daum.Postcode({
      oncomplete: (data: DaumPostcodeResult) => {
        // 도로명 주소 우선, 없으면 지번 주소
        const fullAddress = data.roadAddress || data.jibunAddress

        // 건물명이 있으면 추가
        const finalAddress = data.buildingName
          ? `${fullAddress} (${data.buildingName})`
          : fullAddress

        onChange(finalAddress, {
          sido: data.sido,
          sigungu: data.sigungu,
        })
      },
      width: '100%',
      height: '100%',
    }).open()
  }, [onChange])

  return (
    <div className={`flex gap-2 ${className}`}>
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 h-8 text-sm"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleSearch}
        className="h-8 whitespace-nowrap"
      >
        <Search className="h-4 w-4 mr-1" />
        주소 검색
      </Button>
    </div>
  )
}

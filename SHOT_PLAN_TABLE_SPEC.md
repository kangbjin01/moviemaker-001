# Shot Plan Table - Detailed Design Specification

## 1. 정체성 (Identity)

**이 테이블은 "촬영 하루를 설계하는 작업대(workbench)"입니다.**

- 문서 뷰어가 아님
- 데이터 입력 도구임
- 엑셀보다 빨라야 함
- 출력은 자동 생성됨

---

## 2. 테이블 컬럼 구조 (고정)

### 2.1 컬럼 정의

| # | 컬럼명 | 영문 Key | 타입 | 너비 | 편집 방식 | 설명 |
|---|--------|---------|------|------|----------|------|
| 1 | 촬영순서 | `sequence` | number | 60px | Drag handle | 자동 넘버링, 드래그로 재정렬 |
| 2 | S# | `scene_number` | text | 80px | Text input | 씬 번호 (8, 8+9, 7A) |
| 3 | CUT | `cut_number` | text | 80px | Text input | 컷 번호 (nullable) |
| 4 | M/D/E/N | `scene_time` | enum | 70px | Single key | M/D/E/N 키 입력 |
| 5 | I/E | `scene_location_type` | enum | 60px | Single key | I/E 키 입력 |
| 6 | 시작 | `start_time` | time | 90px | Time input | 촬영 시작 시간 |
| 7 | 끝 | `end_time` | time | 90px | Time input | 촬영 종료 시간 |
| 8 | 촬영장소 | `location` | ref | 140px | Autocomplete | 로케이션 선택 |
| 9 | 촬영내용 | `content` | textarea | flex | Multi-line | **핵심 컬럼** |
| 10 | 주요인물 | `cast_ids` | multi-select | 180px | Chip selector | 배우/배역 멀티 선택 |
| 11 | 비고 | `notes` | text | 160px | Text input | 렌즈/샷/장비 |

**컬럼 순서는 절대 변경 불가**
- 제작자가 "눈 감고도 입력" 가능하도록 고정

---

## 3. 테이블 레이아웃 디자인

### 3.1 기본 스타일

```css
.shot-plan-table {
  /* Row */
  --row-height: 38px;
  --row-height-expanded: auto; /* for content cell */
  
  /* Border */
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  
  /* Background */
  background: var(--bg-primary);
  
  /* No zebra striping */
  /* No heavy shadows */
}

.shot-plan-row {
  border-bottom: 1px solid var(--border-light);
  transition: background-color 120ms ease;
}

.shot-plan-row:hover {
  background: var(--bg-tertiary);
}

.shot-plan-row:focus-within {
  background: #FAFAFA;
  box-shadow: inset 0 0 0 1px var(--border-medium);
}

.shot-plan-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--bg-secondary);
  border-bottom: 2px solid var(--border-dark);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
```

### 3.2 컬럼 폭 전략

```typescript
const COLUMN_WIDTHS = {
  sequence: 60,        // 고정
  scene_number: 80,    // 고정
  cut_number: 80,      // 고정
  scene_time: 70,      // 고정
  scene_location_type: 60, // 고정
  start_time: 90,      // 고정
  end_time: 90,        // 고정
  location: 140,       // 고정
  content: 'flex',     // 가변 (남은 공간 차지)
  cast_ids: 180,       // 최소폭
  notes: 160,          // 최소폭
} as const;
```

---

## 4. 셀 입력 UX (엑셀보다 빠르게)

### 4.1 키보드 내비게이션

```typescript
// Global keyboard shortcuts
const KEYBOARD_SHORTCUTS = {
  'Enter': () => moveDown(), // 아래 행 같은 컬럼
  'Tab': () => moveRight(), // 오른쪽 컬럼
  'Shift+Tab': () => moveLeft(), // 왼쪽 컬럼
  'Cmd+Enter': () => addNewRow(), // 새 행 추가
  'Cmd+D': () => duplicateRow(), // 행 복제
  'Escape': () => exitEdit(), // 편집 취소
  'Cmd+Z': () => undo(),
  'Cmd+Shift+Z': () => redo(),
};
```

### 4.2 컬럼별 입력 방식

#### ① 촬영순서 (Sequence)
```typescript
// Auto-numbering + Drag handle
<Cell>
  <DragHandle />
  <span>{sequence}</span>
</Cell>

// On drag end
const handleDragEnd = (result) => {
  const items = reorder(
    shotPlanItems,
    result.source.index,
    result.destination.index
  );
  
  // Auto-renumber
  items.forEach((item, index) => {
    item.sequence = index + 1;
  });
  
  updateShotPlan(items);
};
```

#### ② S# (Scene Number)
```typescript
// Autocomplete with registry
<Autocomplete
  options={scenes.map(s => s.scene_number)}
  freeSolo // Allow custom input like "8+9"
  onSelect={(value) => {
    updateCell('scene_number', value);
    // Auto-populate content from scene registry
    const scene = scenes.find(s => s.scene_number === value);
    if (scene?.description) {
      prefillCell('content', scene.description);
    }
  }}
/>

// Validation
const isValidSceneNumber = (input: string) => {
  // "8", "8+9", "7A", "12B" 모두 허용
  return /^\d+[A-Z]?(\+\d+[A-Z]?)?$/.test(input);
};
```

#### ③ CUT (Cut Number)
```typescript
// Simple text input, nullable
<TextInput
  placeholder="—"
  value={cut_number || ''}
  onChange={(value) => updateCell('cut_number', value || null)}
/>
```

#### ④ M/D/E/N (Scene Time)
```typescript
// Single key input (no dropdown)
<Cell
  onKeyDown={(e) => {
    const key = e.key.toUpperCase();
    if (['M', 'D', 'E', 'N'].includes(key)) {
      updateCell('scene_time', key);
      moveToNextCell();
    }
  }}
>
  <Badge variant={scene_time}>
    {scene_time || '—'}
  </Badge>
</Cell>

// Visual indicators
const SCENE_TIME_COLORS = {
  M: '#F59E0B', // Morning - Amber
  D: '#3B82F6', // Day - Blue
  E: '#8B5CF6', // Evening - Purple
  N: '#1F2937', // Night - Dark gray
};
```

#### ⑤ I/E (Location Type)
```typescript
// Same as M/D/E/N but simpler
<Cell
  onKeyDown={(e) => {
    const key = e.key.toUpperCase();
    if (['I', 'E'].includes(key)) {
      updateCell('scene_location_type', key);
      moveToNextCell();
    }
  }}
>
  {scene_location_type || '—'}
</Cell>
```

#### ⑥⑦ 시작/끝 (Time)
```typescript
// Smart time input
<TimeInput
  value={start_time}
  onChange={(value) => {
    updateCell('start_time', value);
    
    // Auto-calculate end time (+10 min default)
    if (!end_time && value) {
      const estimatedEnd = addMinutes(parseTime(value), 10);
      prefillCell('end_time', formatTime(estimatedEnd));
    }
  }}
  format="HH:mm" // 09:00
  autoCorrect // 0900 → 09:00
/>

// Validation
const validateTimeRange = (start, end) => {
  if (start && end && parseTime(end) < parseTime(start)) {
    showWarning('종료 시간이 시작 시간보다 빠릅니다');
  }
};
```

#### ⑧ 촬영장소 (Location)
```typescript
// Autocomplete with inheritance
<Autocomplete
  options={locations}
  value={location_override || location_id}
  placeholder={baseLocation?.name} // From shooting day header
  onChange={(value) => {
    updateCell('location_id', value);
    
    // Highlight if different from base location
    if (value !== shootingDay.base_location_id) {
      highlightCell('location', 'warning');
    }
  }}
  renderOption={(option) => (
    <>
      <MapPinIcon />
      {option.name}
      {option.address && (
        <span className="text-xs text-secondary">
          {option.address}
        </span>
      )}
    </>
  )}
/>
```

#### ⑨ 촬영내용 (Content) - 가장 중요
```typescript
// Multi-line textarea with auto-expand
<TextareaAutosize
  value={content}
  onChange={(e) => updateCell('content', e.target.value)}
  minRows={2}
  maxRows={10}
  placeholder="촬영 내용을 입력하세요..."
  className="content-cell"
  onKeyDown={(e) => {
    if (e.key === 'Enter' && e.metaKey) {
      e.preventDefault();
      addNewRow();
    }
    // Plain Enter = new line (default behavior)
  }}
/>

// Style
.content-cell {
  font-size: 14px;
  line-height: 1.5;
  padding: 8px;
  resize: none;
  border: none;
  width: 100%;
  
  /* Auto-expand on focus */
  &:focus {
    outline: 2px solid var(--border-medium);
    outline-offset: -2px;
  }
}
```

#### ⑩ 주요인물 (Cast)
```typescript
// Multi-select with chips
<MultiSelect
  options={characters}
  value={cast_ids}
  onChange={(selectedIds) => updateCell('cast_ids', selectedIds)}
  renderValue={(selected) => (
    <div className="flex flex-wrap gap-1">
      {selected.map(char => (
        <Chip
          key={char.id}
          label={char.character_name}
          onRemove={() => removeFromCell('cast_ids', char.id)}
        />
      ))}
    </div>
  )}
  searchable
  quickAdd // Type name to add
/>
```

#### ⑪ 비고 (Notes)
```typescript
// Free text with templates
<TextInput
  value={notes}
  onChange={(value) => updateCell('notes', value)}
  placeholder="렌즈/샷/장비..."
  suggestions={[
    '50mm, Close-up',
    'Wide, Steadicam',
    'Drone shot',
    // ... more templates
  ]}
/>
```

---

## 5. 엑셀을 넘어서는 기능들

### 5.1 시간 흐름 시각화

```typescript
// Calculate time gaps between shots
const calculateTimeGaps = (items: ShotPlanItem[]) => {
  const gaps = [];
  
  for (let i = 0; i < items.length - 1; i++) {
    const current = items[i];
    const next = items[i + 1];
    
    if (current.end_time && next.start_time) {
      const gap = differenceInMinutes(
        parseTime(next.start_time),
        parseTime(current.end_time)
      );
      
      gaps.push({
        afterRow: i,
        minutes: gap,
        warning: gap > 30 || gap < 0, // Too long gap or overlap
      });
    }
  }
  
  return gaps;
};

// UI
{gaps.map(gap => (
  <GapIndicator
    key={gap.afterRow}
    minutes={gap.minutes}
    warning={gap.warning}
  >
    {gap.warning && (
      <WarningIcon />
    )}
    {gap.minutes > 0 ? `+${gap.minutes}분` : `${gap.minutes}분 겹침`}
  </GapIndicator>
))}
```

### 5.2 씬 그룹 하이라이트

```typescript
// Group consecutive scenes with same S#
const sceneGroups = useMemo(() => {
  const groups = [];
  let currentGroup = null;
  
  items.forEach((item, index) => {
    if (currentGroup?.scene_number === item.scene_number) {
      currentGroup.endIndex = index;
    } else {
      if (currentGroup) groups.push(currentGroup);
      currentGroup = {
        scene_number: item.scene_number,
        startIndex: index,
        endIndex: index,
      };
    }
  });
  
  if (currentGroup) groups.push(currentGroup);
  return groups.filter(g => g.endIndex > g.startIndex); // Only multi-row groups
}, [items]);

// Visual bracket on left side
<div className="scene-group-bracket">
  {sceneGroups.map(group => (
    <Bracket
      key={group.startIndex}
      top={group.startIndex * ROW_HEIGHT}
      height={(group.endIndex - group.startIndex + 1) * ROW_HEIGHT}
    >
      S#{group.scene_number}
    </Bracket>
  ))}
</div>
```

### 5.3 자동 복사 & 연속 입력

```typescript
// Duplicate row (Cmd+D)
const duplicateRow = (rowIndex: number) => {
  const original = items[rowIndex];
  const duplicate = {
    ...original,
    id: generateId(),
    sequence: rowIndex + 2, // Insert after
    // Inherit these by default:
    location_id: original.location_id,
    cast_ids: original.cast_ids,
    scene_time: original.scene_time,
    scene_location_type: original.scene_location_type,
    // Clear these:
    cut_number: null,
    content: '',
    start_time: null,
    end_time: null,
    notes: '',
  };
  
  insertRow(rowIndex + 1, duplicate);
  focusCell(rowIndex + 1, 'content');
};

// Smart inheritance from above row
const inheritFromAbove = (columnKey: string) => {
  const prevRow = items[currentRowIndex - 1];
  if (prevRow) {
    updateCell(columnKey, prevRow[columnKey]);
  }
};
```

---

## 6. 테이블 상단 컨트롤

```typescript
<TableToolbar>
  <ToolbarSection>
    <Button onClick={addRow}>
      <PlusIcon /> 행 추가
    </Button>
    <Button onClick={deleteSelected} disabled={!hasSelection}>
      <TrashIcon /> 삭제
    </Button>
  </ToolbarSection>
  
  <ToolbarSection>
    <Button onClick={recalculateTimes}>
      <ClockIcon /> 시간 재계산
    </Button>
    <Button onClick={openPreview}>
      <EyeIcon /> 미리보기
    </Button>
  </ToolbarSection>
  
  <ToolbarStats>
    <Stat>
      <Label>총 씬 수</Label>
      <Value>{items.length}</Value>
    </Stat>
    <Stat>
      <Label>총 촬영 시간</Label>
      <Value>{totalShootingTime}</Value>
    </Stat>
    {missingBreak && (
      <Alert variant="warning">
        <AlertIcon /> 점심/브레이크 없음
      </Alert>
    )}
  </ToolbarStats>
</TableToolbar>
```

---

## 7. 성능 최적화

### 7.1 Virtual Scrolling

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

const TableWithVirtualization = ({ items }) => {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 5, // Pre-render 5 rows above/below viewport
  });
  
  return (
    <div ref={parentRef} className="table-container">
      <div style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
        {rowVirtualizer.getVirtualItems().map(virtualRow => (
          <Row
            key={virtualRow.index}
            item={items[virtualRow.index]}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          />
        ))}
      </div>
    </div>
  );
};
```

### 7.2 Optimistic Updates

```typescript
const updateCell = useMutation({
  mutationFn: async (update: CellUpdate) => {
    return supabase
      .from('shot_plan_items')
      .update({ [update.column]: update.value })
      .eq('id', update.rowId);
  },
  onMutate: async (update) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries(['shot-plan']);
    
    // Snapshot previous value
    const previous = queryClient.getQueryData(['shot-plan']);
    
    // Optimistically update
    queryClient.setQueryData(['shot-plan'], (old) =>
      old.map(item =>
        item.id === update.rowId
          ? { ...item, [update.column]: update.value }
          : item
      )
    );
    
    return { previous };
  },
  onError: (err, update, context) => {
    // Rollback on error
    queryClient.setQueryData(['shot-plan'], context.previous);
  },
  onSettled: () => {
    queryClient.invalidateQueries(['shot-plan']);
  },
});
```

### 7.3 Debounced Auto-save

```typescript
const debouncedSave = useMemo(
  () =>
    debounce(async (items: ShotPlanItem[]) => {
      await saveShotPlan(items);
      showToast('저장됨', { duration: 1000 });
    }, 500),
  []
);

useEffect(() => {
  if (hasChanges) {
    debouncedSave(items);
  }
}, [items, hasChanges, debouncedSave]);
```

---

## 8. 출력(Export)과의 관계

### 8.1 PDF 출력

```typescript
// This table is the SOURCE OF TRUTH
// PDF is auto-generated from table data

const generatePDF = async (shootingDay: ShootingDay) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  
  // Header
  doc.setFontSize(16);
  doc.text('일일촬영계획표', 105, 20, { align: 'center' });
  
  // Metadata
  doc.setFontSize(10);
  doc.text(`촬영일: ${formatDate(shootingDay.shoot_date)}`, 20, 30);
  doc.text(`회차: ${shootingDay.day_number}회차`, 20, 36);
  
  // Shot Plan Table
  const tableData = shootingDay.shot_plan_items.map(item => [
    item.sequence,
    item.scene_number,
    item.cut_number || '—',
    item.scene_time || '—',
    item.scene_location_type || '—',
    formatTime(item.start_time),
    formatTime(item.end_time),
    getLocationName(item.location_id),
    item.content,
    getCastNames(item.cast_ids).join(', '),
    item.notes || '—',
  ]);
  
  doc.autoTable({
    head: [TABLE_HEADERS],
    body: tableData,
    startY: 45,
    styles: {
      font: 'NanumGothic', // Korean font
      fontSize: 9,
      cellPadding: 2,
    },
    columnStyles: {
      8: { cellWidth: 50 }, // Content column wider
    },
  });
  
  return doc.output('blob');
};
```

### 8.2 Excel 출력

```typescript
import * as XLSX from 'xlsx';

const generateExcel = (shootingDay: ShootingDay) => {
  const ws = XLSX.utils.json_to_sheet(
    shootingDay.shot_plan_items.map(item => ({
      '촬영순서': item.sequence,
      'S#': item.scene_number,
      'CUT': item.cut_number,
      'M/D/E/N': item.scene_time,
      'I/E': item.scene_location_type,
      '시작': formatTime(item.start_time),
      '끝': formatTime(item.end_time),
      '촬영장소': getLocationName(item.location_id),
      '촬영내용': item.content,
      '주요인물': getCastNames(item.cast_ids).join(', '),
      '비고': item.notes,
    }))
  );
  
  // Set column widths
  ws['!cols'] = [
    { wch: 8 },  // 촬영순서
    { wch: 10 }, // S#
    { wch: 8 },  // CUT
    { wch: 8 },  // M/D/E/N
    { wch: 6 },  // I/E
    { wch: 8 },  // 시작
    { wch: 8 },  // 끝
    { wch: 20 }, // 촬영장소
    { wch: 50 }, // 촬영내용
    { wch: 20 }, // 주요인물
    { wch: 20 }, // 비고
  ];
  
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '촬영계획');
  
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
};
```

---

## 9. Accessibility

```typescript
// ARIA labels for screen readers
<table
  role="grid"
  aria-label="Shot plan table"
  aria-rowcount={items.length}
  aria-colcount={11}
>
  <thead>
    <tr role="row">
      {columns.map((col, i) => (
        <th
          key={col.key}
          role="columnheader"
          aria-colindex={i + 1}
          aria-sort={sortedBy === col.key ? sortDirection : 'none'}
        >
          {col.label}
        </th>
      ))}
    </tr>
  </thead>
  <tbody>
    {items.map((item, rowIndex) => (
      <tr
        key={item.id}
        role="row"
        aria-rowindex={rowIndex + 1}
        aria-selected={isSelected(item.id)}
      >
        {/* cells */}
      </tr>
    ))}
  </tbody>
</table>

// Keyboard navigation announcement
const announceNavigation = (cell: Cell) => {
  const message = `${cell.columnLabel}, row ${cell.rowIndex + 1}, ${cell.value}`;
  announceToScreenReader(message);
};
```

---

## 10. Error Handling

```typescript
// Cell-level validation
const validateCell = (column: string, value: any) => {
  const errors = [];
  
  switch (column) {
    case 'scene_number':
      if (!value) errors.push('씬 번호는 필수입니다');
      break;
    case 'content':
      if (!value || value.trim().length === 0) {
        errors.push('촬영내용은 필수입니다');
      }
      break;
    case 'start_time':
    case 'end_time':
      if (value && !isValidTime(value)) {
        errors.push('올바른 시간 형식이 아닙니다 (HH:mm)');
      }
      break;
  }
  
  return errors;
};

// Show inline errors
<Cell error={cellErrors[cell.id]}>
  {cellErrors[cell.id] && (
    <ErrorTooltip>{cellErrors[cell.id]}</ErrorTooltip>
  )}
</Cell>
```

---

## 11. Testing Strategy

```typescript
// Unit tests for cell logic
describe('Shot Plan Cell Logic', () => {
  it('should auto-number sequences on reorder', () => {
    const items = [
      { id: '1', sequence: 1 },
      { id: '2', sequence: 2 },
      { id: '3', sequence: 3 },
    ];
    
    const reordered = reorderItems(items, 0, 2);
    
    expect(reordered).toEqual([
      { id: '2', sequence: 1 },
      { id: '3', sequence: 2 },
      { id: '1', sequence: 3 },
    ]);
  });
  
  it('should estimate end time based on start time', () => {
    const startTime = '09:00';
    const estimated = estimateEndTime(startTime, 10); // +10 minutes
    expect(estimated).toBe('09:10');
  });
});

// E2E test for full workflow
describe('Shot Plan Workflow', () => {
  it('should create shot plan faster than Excel', async () => {
    // 1. Add row
    await page.click('[data-testid="add-row"]');
    
    // 2. Fill cells with keyboard only
    await page.keyboard.type('8'); // S#
    await page.keyboard.press('Tab');
    await page.keyboard.type('1'); // CUT
    await page.keyboard.press('Tab');
    await page.keyboard.press('D'); // Day
    await page.keyboard.press('Tab');
    await page.keyboard.press('E'); // Exterior
    // ... continue
    
    // 3. Save should happen automatically
    await page.waitForSelector('[data-testid="auto-saved"]');
  });
});
```

---

## 12. Migration from Excel

```typescript
// Import from Excel
const importFromExcel = async (file: File) => {
  const workbook = XLSX.read(await file.arrayBuffer());
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet);
  
  // Map Excel columns to our structure
  const mapped = data.map((row: any) => ({
    sequence: row['촬영순서'] || row['순서'] || row['No'],
    scene_number: row['S#'] || row['씬번호'],
    cut_number: row['CUT'] || row['컷'],
    scene_time: row['M/D/E/N'],
    scene_location_type: row['I/E'],
    start_time: parseTime(row['시작'] || row['시작시간']),
    end_time: parseTime(row['끝'] || row['종료시간']),
    location: row['촬영장소'] || row['장소'],
    content: row['촬영내용'] || row['내용'],
    cast: row['주요인물'] || row['출연'],
    notes: row['비고'] || row['메모'],
  }));
  
  return mapped;
};
```

---

## Summary

이 Shot Plan Table은:
- ✅ 엑셀보다 빠른 입력 (키보드 중심)
- ✅ 자동화된 계산 (시간, 순서)
- ✅ 실시간 검증 (에러 방지)
- ✅ 스마트 자동완성 (장소, 인물)
- ✅ 출력 자동 생성 (PDF/Excel)
- ✅ 협업 가능 (실시간 동기화)

**제작자는 이 표만 잘 채우면 됩니다. 나머지는 자동입니다.**

# Color Grading Tool - UX Specification

## Tasarım Prensipleri

### 1. Professional Tool Mindset
- "Web app" değil, "profesyonel araç" hissi
- Her piksel bir iş yapıyor, gereksiz boşluk yok
- Bilgi yoğunluğu yüksek ama organize

### 2. Doğrudan Manipülasyon
- Slider kaydır → anında preview'de gör
- Gecikme yok, güven kaybı yok
- Her değişiklik geri alınabilir

### 3. Keyboard-First (Desktop)
- Pro kullanıcılar klavye kısayolu bekler
- Her önemli aksiyon kısayolla erişilebilir
- Mouse + keyboard combo workflow

### 4. Mobile Adaptation
- Desktop layout'u sadeleştir, kopyalama
- Tek elle kullanım için optimize
- Bottom sheet pattern

---

## Renk Paleti & Tema

```
Pro Dark Theme
─────────────────────────────────
Background L0:   #0D0D0D   (en koyu, main bg)
Background L1:   #141414   (panels)
Background L2:   #1A1A1A   (cards, inputs)
Background L3:   #222222   (hover states)
Border:          #2A2A2A
Text Primary:    #E5E5E5
Text Secondary:  #888888
Text Tertiary:   #555555
Accent:          #3B82F6   (mavi)
Accent Alt:      #8B5CF6   (mor, secondary actions)
Success:         #22C55E
Error:           #EF4444
```

Video editing uygulamalarında dark theme standarttır - göz yorgunluğunu azaltır ve renkleri doğru değerlendirmeyi sağlar.

---

## Tipografi

```
Font Family:    Inter veya SF Pro
Font Sizes:
  - App Title:  14px / semibold
  - Section:    12px / semibold / uppercase / letter-spacing: 0.5px
  - Label:      12px / medium
  - Value:      12px / mono (sayılar için)
  - Caption:    11px / regular
```

Slider değerleri monospace olmalı - sayılar değişirken layout kaymamalı.

---

## Spacing System

```
4px   - içsel padding, ikon spacing
8px   - element arası minimum
12px  - grup içi spacing
16px  - section arası
24px  - panel padding
```

---

## Ekran Yapısı (Desktop) - Pro Layout

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [☰]  Color Grader            video-name.mp4               [?] [⚙] [Export ↓]│
├────┬─────────────────────────────────────────────────────────┬───────────────┤
│    │                                                         │  SCOPES       │
│ 🎨 │                                                         │ ┌───────────┐ │
│    │                                                         │ │ Histogram │ │
│ 📊 │                                                         │ │  ░▓█▓░    │ │
│    │                                                         │ └───────────┘ │
│ 🔧 │              VIDEO PREVIEW                              ├───────────────┤
│    │           (split view divider)                          │  INFO         │
│    │          Before  ┃  After                               │ ────────────  │
│    │                  ┃                                      │ 722 × 798     │
│    │                 [⇔]                                     │ 30 fps        │
│    │                  ┃                                      │ 0:12          │
│    │                                                         │ H.264         │
├────┼─────────────────────────────────────────────────────────┼───────────────┤
│    │ ▶  00:02 ━━━━●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  00:12 │      🔊       │
├────┴─────────────────────────────────────────────────────────┴───────────────┤
│ LUTs                              │ Adjustments                              │
│ ┌────┐┌────┐┌────┐┌────┐┌────┐   │                                          │
│ │None││ L1 ││ L2 ││ L3 ││ +  │   │ Exposure   ━━━━●━━━━ 0   Highlights ━━●━ │
│ └────┘└────┘└────┘└────┘└────┘   │ Contrast   ━━━━●━━━━ 0   Shadows    ━●━━ │
│ Intensity ━━━━━━━━━━━━━━━● 100%  │ Saturation ━━━━●━━━━ 0   Temp       ━━●━ │
│                                   │ Vibrance   ━━━━●━━━━ 0   Tint       ━●━━ │
└───────────────────────────────────┴──────────────────────────────────────────┘
```

### Bölge Detayları

#### 1. Top Bar (48px yükseklik)
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [☰]  Color Grader            video-name.mp4               [?] [⚙] [Export ↓]│
└──────────────────────────────────────────────────────────────────────────────┘
  │        │                        │                         │   │      │
  │        │                        │                         │   │      └─ Primary CTA (accent color)
  │        │                        │                         │   └─ Settings
  │        │                        │                         └─ Help
  │        │                        └─ Dosya adı (centered, truncate if long)
  │        └─ App name
  └─ Menu (opsiyonel)
```

- Background: L1 (#141414)
- Border bottom: 1px #2A2A2A
- Export butonu: Accent renk, padding 12px 20px

#### 2. Sol Toolbar (56px genişlik)
```
┌────┐
│    │
│ 🎨 │  ← Color tools (aktif)
│    │
│ 📊 │  ← Scopes toggle
│    │
│ 🔧 │  ← Settings
│    │
│    │
│    │
└────┘
```

- Dikey ikon listesi
- Aktif: accent background + beyaz ikon
- Inactive: transparent + #888 ikon
- Hover: L3 background
- İkon boyutu: 20px
- Tooltip on hover

#### 3. Video Preview (Merkez - Ana Alan)

**Split View Divider:**
```
        BEFORE          │          AFTER
                        │
                        │
                       [⇔]  ← Sürüklenebilir handle
                        │
                        │
```

- Divider: 2px beyaz çizgi, %50 opacity
- Handle: 24x24px pill, L2 background, border
- Drag ile sola/sağa hareket
- Min: %10, Max: %90
- Double click: %50'ye reset
- Cursor: ew-resize

**Video Aspect Ratio:**
- Container'a fit, letterbox (siyah bantlar) gerekirse
- Minimum padding: 16px her yönde

#### 4. Sağ Panel (240px genişlik)

**Scopes Section:**
```
┌─────────────────────────────┐
│ SCOPES                    ▼ │  ← Collapsible header
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │                         │ │
│ │      ░░▓██▓░░           │ │  Histogram
│ │    ░▓████████▓░         │ │  120px height
│ │  ░▓████████████▓░       │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

- Section header: 12px uppercase, collapsible
- Histogram: RGB overlay veya Luma
- Background: L0
- Subtle grid lines: #1A1A1A

**Info Section:**
```
┌─────────────────────────────┐
│ INFO                      ▼ │
├─────────────────────────────┤
│ Resolution     722 × 798    │
│ Frame Rate     30 fps       │
│ Duration       0:12         │
│ Codec          H.264        │
│ File Size      4.2 MB       │
└─────────────────────────────┘
```

- Key-value pairs
- Label: Text Secondary (#888)
- Value: Text Primary (#E5E5E5)
- Row height: 24px

#### 5. Timeline Bar (48px yükseklik)
```
┌────┬─────────────────────────────────────────────────────────┬───────────────┐
│    │ ▶  00:02 ━━━━●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  00:12 │      🔊       │
└────┴─────────────────────────────────────────────────────────┴───────────────┘
       │    │                    │                       │            │
       │    │                    │                       │            └─ Volume toggle
       │    │                    │                       └─ Duration
       │    │                    └─ Scrubber (accent color thumb)
       │    └─ Current time (mono font)
       └─ Play/Pause toggle
```

- Scrubber track: #2A2A2A
- Scrubber progress: Accent color
- Thumb: 12px circle, beyaz
- Time display: Mono font

#### 6. Alt Panel - Controls (140px yükseklik)

**İki Bölüm Yan Yana:**

```
┌─────────────────────────────────────┬────────────────────────────────────────┐
│ LUTs                                │ ADJUSTMENTS                            │
├─────────────────────────────────────┼────────────────────────────────────────┤
│ ┌────┐┌────┐┌────┐┌────┐┌────┐     │                                        │
│ │    ││    ││    ││    ││ +  │     │ Exposure   ━━━━●━━━━ 0   Highlights ━●━ │
│ │None││ L1 ││ L2 ││ L3 ││Add │     │ Contrast   ━━━━●━━━━ 0   Shadows    ━●━ │
│ └────┘└────┘└────┘└────┘└────┘     │ Saturation ━━━━●━━━━ 0   Temp       ━●━ │
│ Intensity ━━━━━━━━━━━━━━● 100%     │ Vibrance   ━━━━●━━━━ 0   Tint       ━●━ │
└─────────────────────────────────────┴────────────────────────────────────────┘
```

**LUT Thumbnails:**
- Boyut: 64x64px
- Border radius: 6px
- Gap: 8px
- Horizontal scroll (eğer sığmazsa)
- Seçili: 2px accent border
- Hover: brightness(1.1)
- "None" = orijinal frame, no LUT
- "+" = custom upload, dashed border

**Adjustments Grid:**
- 2 sütun layout
- Sol: Exposure, Contrast, Saturation, Vibrance
- Sağ: Highlights, Shadows, Temperature, Tint
- Row height: 28px
- Label width: 80px (fixed)
- Slider: flex grow
- Value width: 40px (fixed, right aligned)

---

## Ekran Yapısı (Mobile)

```
┌─────────────────────────────────────┐
│ ←  Color Grader           [Export] │  Header (48px)
├─────────────────────────────────────┤
│                                     │
│                                     │
│         VIDEO PREVIEW               │  Preview Area
│        (tap for before)             │
│                                     │
│                                     │
├─────────────────────────────────────┤
│ ▶ 00:02 ━━━●━━━━━━━━━━━━━━━ 00:12  │  Timeline (44px)
├─────────────────────────────────────┤
│ ═══════════════════════════════════ │  Drag Handle
│                                     │
│ LUTs ──────────────────────────────│
│ ┌────┐┌────┐┌────┐┌────┐┌────┐     │
│ │None││ L1 ││ L2 ││ L3 ││ +  │     │  Horizontal scroll
│ └────┘└────┘└────┘└────┘└────┘     │
│ Intensity ━━━━━━━━━━━━━━● 100%     │
│                                     │
│ Adjustments ───────────────────────│
│ Exposure   ━━━━━━━━●━━━━━━━━━━  0  │
│ Contrast   ━━━━━━━━●━━━━━━━━━━  0  │
│ Saturation ━━━━━━━━●━━━━━━━━━━  0  │
│ Temperature━━━━━━━━●━━━━━━━━━━  0  │
│ ... (scroll for more)              │
└─────────────────────────────────────┘
```

### Mobile Farklılıkları

1. **Tek sütun slider layout** (2 sütun çok dar)
2. **Bottom sheet** pattern (yukarı sürükle)
3. **Before/After:** Video'ya long press
4. **Histogram yok** (alan yetersiz)
5. **Info panel yok** (gereksiz mobile'da)
6. **Sol toolbar yok** (tek görünüm)

---

## Responsive Breakpoints

```
Mobile:     < 768px    → Single column, bottom sheet
Tablet:     768-1024px → Simplified desktop, narrower panels
Desktop:    > 1024px   → Full pro layout
Wide:       > 1440px   → Wider preview area
```

---

## Component Detayları

### 1. Video Preview Area (Desktop)

**Boş Durum (Empty State)**
```
┌───────────────────────────────────────────────────────────────┐
│                                                               │
│                                                               │
│                            🎬                                 │
│                                                               │
│                   Drop video here                             │
│                   or click to browse                          │
│                                                               │
│                   MP4, WebM • Max 3 min                       │
│                                                               │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```
- Tüm preview alanı tıklanabilir
- Drag sırasında: dashed border → solid accent border
- Drop feedback: subtle pulse animation
- Background: L0 (#0D0D0D)

**Split View (Video Yüklü)**
```
┌──────────────────────────┬──────────────────────────┐
│                          │                          │
│                          │                          │
│         BEFORE           │          AFTER           │
│        (Original)        │        (Graded)          │
│                          │                          │
│                         [⇔]                         │
│                          │                          │
│                          │                          │
└──────────────────────────┴──────────────────────────┘
```

**Split Divider Özellikleri:**
- Divider line: 2px, #FFFFFF @ 50% opacity
- Handle: 32x20px pill shape
- Handle background: L2 (#1A1A1A)
- Handle border: 1px #2A2A2A
- Handle icon: ⇔ veya grip dots
- Cursor: ew-resize
- Drag range: %10 - %90
- Double click: Reset to %50
- Smooth animation: 150ms ease-out

---

### 2. Histogram

```
┌─────────────────────────────┐
│ SCOPES                    ▾ │
├─────────────────────────────┤
│                             │
│        ░░▓▓██████▓▓░░       │
│      ░▓██████████████▓░     │
│    ░▓██████████████████▓░   │
│  ░▓██████████████████████▓░ │
│ ▓████████████████████████▓  │
│                             │
└─────────────────────────────┘
```

**Specs:**
- Height: 120px
- Background: L0 (#0D0D0D)
- Grid lines: #1A1A1A (subtle)
- RGB mode: Red, Green, Blue overlay
- Luma mode: White only
- Real-time update on adjustment
- Click to toggle RGB/Luma

---

### 3. Info Panel

```
┌─────────────────────────────┐
│ INFO                      ▾ │
├─────────────────────────────┤
│ Resolution     1920 × 1080  │
│ Frame Rate     30 fps       │
│ Duration       0:12         │
│ Codec          H.264        │
│ File Size      4.2 MB       │
│ Color Space    Rec.709      │
└─────────────────────────────┘
```

**Specs:**
- Row height: 24px
- Label: Text Secondary (#888), 12px
- Value: Text Primary (#E5E5E5), 12px mono
- Collapsible section
- Updates when video loads

---

### 4. LUT Selector

**Desktop Layout (Alt Panel Sol):**
```
┌─────────────────────────────────────────┐
│ LUTS                                    │
├─────────────────────────────────────────┤
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐    │
│ │      │ │      │ │      │ │  +   │    │
│ │ None │ │ Cine │ │ Teal │ │ Add  │    │
│ │      │ │      │ │      │ │      │    │
│ └──────┘ └──────┘ └──────┘ └──────┘    │
│    ●        ○        ○        ○        │
│                                         │
│ Intensity ━━━━━━━━━━━━━━━━━━━● 100%    │
└─────────────────────────────────────────┘
```

**LUT Thumbnail Specs:**
- Boyut: 64x64px
- Border radius: 6px
- Gap: 8px
- Background: L2 (#1A1A1A)
- Seçili: 2px accent border (#3B82F6)
- Hover: brightness(1.1) + slight lift
- "None": İlk frame, hiçbir LUT uygulanmamış
- "+": Dashed border, upload ikonu

**Thumbnail Oluşturma:**
1. Video yüklendiğinde ilk frame capture
2. Her built-in LUT için frame'e LUT uygula
3. Canvas'ta 64x64'e resize
4. Base64 olarak cache'le
5. Lazy load (görünür olunca)

**Intensity Slider:**
- Track: L2 (#1A1A1A)
- Fill: Accent gradient
- Thumb: 14px circle, white
- Value: Right aligned, mono font
- Range: 0-100%
- Default: 100%

---

### 5. Adjustments Panel

**Desktop Layout (Alt Panel Sağ - 2 Sütun):**
```
┌────────────────────────────────────────────────────────────┐
│ ADJUSTMENTS                                    [↺ Reset]   │
├────────────────────────────────────────────────────────────┤
│ Exposure   ━━━━━━━●━━━━━━━  0    Highlights  ━━━━●━━━━━  0 │
│ Contrast   ━━━━━━━●━━━━━━━  0    Shadows     ━━━━●━━━━━  0 │
│ Saturation ━━━━━━━●━━━━━━━  0    Temperature ━━━━●━━━━━  0 │
│ Vibrance   ━━━━━━━●━━━━━━━  0    Tint        ━━━━●━━━━━  0 │
└────────────────────────────────────────────────────────────┘
```

**Grid Layout Specs:**
- 2 columns, 4 rows
- Column gap: 32px
- Row height: 28px
- Label width: 80px (fixed)
- Slider: flex-grow
- Value width: 32px (fixed, right-aligned)

**Slider Davranışları:**

| Gesture | Aksiyon |
|---------|---------|
| Drag | Değeri değiştir |
| Shift + Drag | Fine control (hassas mod) |
| Double click | Reset to 0 |
| Click on value | Direct input (opsiyonel) |

**Slider Görsel Özellikleri:**
- Track: L2 (#1A1A1A), 4px height
- Fill: Accent color (center'dan başlar, iki yöne)
- Thumb: 12px circle, white, subtle shadow
- 0 point: Center indicator (subtle tick mark)
- Range: -100 to +100
- Value display: Signed integer (+15, -20, 0)

**Özel Slider'lar:**
- Temperature: Gradient track (Mavi → Turuncu)
- Tint: Gradient track (Yeşil → Magenta)

**Reset Button:**
- Position: Section header sağ tarafı
- Style: Ghost button, subtle
- Icon: ↺
- Click: Tüm slider'ları 0'a reset
- Confirm: Yok (instant, undo ile geri al)

---

### 6. Export (Top Bar Button + Modal)

**Export Button (Top Bar):**
```
┌─────────────────┐
│  ↓  Export      │
└─────────────────┘
```
- Background: Accent (#3B82F6)
- Text: White
- Padding: 8px 16px
- Border radius: 6px
- Hover: brightness(1.1)

**Export Modal:**
```
┌─────────────────────────────────────────────┐
│ Export Video                            ✕   │
├─────────────────────────────────────────────┤
│                                             │
│ Quality                                     │
│ ┌───────────┬───────────┬───────────┐      │
│ │    Low    │  Medium   │   High    │      │
│ │   720p    │  1080p    │ Original  │      │
│ └───────────┴───────────┴───────────┘      │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ Estimated size         ~45 MB           │ │
│ │ Estimated time         ~30 sec          │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │            Start Export                 │ │
│ └─────────────────────────────────────────┘ │
│                                             │
└─────────────────────────────────────────────┘
```

**Modal Specs:**
- Width: 400px
- Background: L1 (#141414)
- Border: 1px #2A2A2A
- Border radius: 12px
- Backdrop: Black @ 60%

**Quality Segment Control:**
- 3 options: Low (720p), Medium (1080p), High (Original)
- Selected: Accent background
- Unselected: L2 background

**Progress State:**
```
┌─────────────────────────────────────────────┐
│ Exporting...                            ✕   │
├─────────────────────────────────────────────┤
│                                             │
│ ████████████████░░░░░░░░░░░░░░░  47%       │
│                                             │
│ Processing frame 1128 / 2400                │
│ Estimated time remaining: 18 sec            │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │              Cancel                     │ │
│ └─────────────────────────────────────────┘ │
│                                             │
└─────────────────────────────────────────────┘
```

**Complete State:**
```
┌─────────────────────────────────────────────┐
│ Export Complete                         ✕   │
├─────────────────────────────────────────────┤
│                                             │
│                   ✓                         │
│             Video exported                  │
│              successfully                   │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │           Save to Device                │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │              Share                      │ │
│ └─────────────────────────────────────────┘ │
│                                             │
└─────────────────────────────────────────────┘
```

---

### 7. Timeline / Playback Bar

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ▶  00:02  ━━━━━━━━━━━●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  00:12   🔊 │
└─────────────────────────────────────────────────────────────────────────────┘
  │    │              │                                            │       │
  │    │              │                                            │       └─ Volume toggle
  │    │              │                                            └─ Duration (total)
  │    │              └─ Scrubber
  │    └─ Current time
  └─ Play/Pause
```

**Specs:**
- Height: 48px
- Background: L1 (#141414)
- Border top: 1px #2A2A2A

**Play/Pause Button:**
- Size: 32x32px
- Icon: ▶ (play) / ❚❚ (pause)
- Hover: L3 background circle

**Time Display:**
- Font: Mono, 12px
- Color: Text Primary
- Format: MM:SS

**Scrubber:**
- Track height: 4px
- Track color: L2 (#1A1A1A)
- Progress color: Accent
- Thumb: 12px circle, white
- Hover: Track expands to 6px
- Click anywhere: Seek to position

**Volume Toggle:**
- Icon: 🔊 (on) / 🔇 (off)
- Click: Toggle mute

---

## Micro-interactions

### Video Upload
1. Drag başladığında: overlay görünür, border glow
2. Drop zone'a girince: border solid olur, scale(1.02)
3. Drop: loading spinner, progress bar
4. Complete: video preview'e fade in

### LUT Değişimi
1. Yeni LUT seçildiğinde: 200ms crossfade
2. Thumbnail'da: scale bounce (1.0 → 1.05 → 1.0)
3. Haptic: kısa tık

### Slider Değişimi
1. Parmak değince: thumb büyür, değer tooltip çıkar
2. Değer değişince: real-time preview
3. Bırakınca: thumb normale döner, tooltip kaybolur
4. Double tap: 0'a animate (300ms ease-out)

### Export Complete
1. Progress %100
2. Button yeşile döner (300ms)
3. Checkmark icon animate in
4. 1sn sonra Save/Share butonları fade in

---

## Error States

### Video Format Error
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                          ⚠️                                     │
│                                                                 │
│                Format not supported                             │
│                                                                 │
│          Please use MP4 or WebM video files                     │
│                                                                 │
│                   [ Try Again ]                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Video Too Long
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                          ⚠️                                     │
│                                                                 │
│                  Video too long                                 │
│                                                                 │
│         Maximum duration is 3 minutes.                          │
│         Your video is 5:32.                                     │
│                                                                 │
│                   [ Choose Another ]                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Export Failed
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                          ❌                                     │
│                                                                 │
│                  Export failed                                  │
│                                                                 │
│          Something went wrong during export.                    │
│          Try again or use a lower quality.                      │
│                                                                 │
│         [ Try Again ]     [ Lower Quality ]                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Error State Design:**
- Background: L1 (#141414)
- Icon: 48px, centered
- Title: 16px semibold
- Message: 14px, Text Secondary
- Buttons: Ghost style veya filled

---

## Keyboard Shortcuts (Desktop)

Pro kullanıcılar klavye kısayolu bekler:

| Kısayol | Aksiyon |
|---------|---------|
| `Space` | Play/Pause |
| `B` | Before/After toggle (hold) |
| `R` | Reset all adjustments |
| `Cmd/Ctrl + E` | Export |
| `Cmd/Ctrl + Z` | Undo |
| `Cmd/Ctrl + Shift + Z` | Redo |
| `1-9` | LUT intensity %10-%90 |
| `0` | LUT intensity %100 |
| `←` / `→` | Frame step (paused) |
| `Shift + ←` / `→` | 5 frame step |
| `Home` | Go to start |
| `End` | Go to end |

Kısayollar için tooltip'lerde hint göster (örn: "Play [Space]").

---

## Micro-interactions

### Video Upload
1. **Drag start:** Dashed border görünür (2px, accent @ 50%)
2. **Drag over:** Border solid olur, background subtle highlight
3. **Drop:** Pulse animation, loading state
4. **Load complete:** Fade in preview, generate LUT thumbnails

### Split Divider Drag
1. **Hover:** Cursor ew-resize, handle subtle glow
2. **Drag start:** Handle accent color olur
3. **Dragging:** Smooth follow (no lag)
4. **Release:** Handle normale döner
5. **Double click:** Animate to 50% (200ms ease-out)

### LUT Selection
1. **Click:** Instant selection (no delay)
2. **Transition:** 200ms crossfade on preview
3. **Thumbnail:** Scale bounce (1.0 → 1.02 → 1.0)
4. **Border:** Fade in accent (100ms)

### Slider Interaction
1. **Hover:** Thumb subtle grow (10px → 12px)
2. **Drag start:** Value tooltip appears (opsiyonel)
3. **Dragging:** Real-time preview update
4. **Release:** Tooltip fades, thumb shrinks
5. **Double click:** Animate to 0 (150ms ease-out)

### Export Flow
1. **Click Export:** Modal slides up (200ms)
2. **Start Export:** Button → progress bar morph
3. **Processing:** Smooth progress fill, frame counter
4. **Complete:** Checkmark scale-in animation
5. **Save:** Native download dialog

---

## Loading States

### Video Loading
- Centered spinner
- "Loading video..." text
- Background: L0

### LUT Thumbnails Loading
- Skeleton placeholder (L2 background, subtle pulse)
- Progressive load (left to right)
- Fade in when ready

### Export Processing
- Progress bar (determinate)
- Frame counter: "Processing frame 1128 / 2400"
- Estimated time remaining
- Cancel option always visible

---

## Animation Timing

| Animasyon | Duration | Easing |
|-----------|----------|--------|
| Split divider snap | 200ms | ease-out |
| LUT crossfade | 200ms | ease-out |
| Slider reset | 150ms | ease-out |
| Modal open | 200ms | ease-out |
| Modal close | 150ms | ease-in |
| Button state | 100ms | ease |
| Thumbnail scale | 150ms | spring(1, 80, 10) |
| Progress bar | linear | - |
| Tooltip fade | 100ms | ease |

---

## Touch Targets

- Desktop minimum: 32x32px (with padding extending to 44px)
- Mobile minimum: 44x44px (Apple HIG)
- Clickable area padding ile genişletilmeli

---

## Accessibility

- Tüm interactive elementlerde visible focus state
- Focus ring: 2px accent, 2px offset
- Slider attributes: `aria-label`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- Color contrast: WCAG AA minimum (4.5:1 text, 3:1 UI)
- `prefers-reduced-motion`: Animasyonları minimize et
- Screen reader labels for icon-only buttons
- Keyboard navigation: Logical tab order
- Skip to main content link (opsiyonel)

---

## Performance Considerations

### Preview
- Preview resolution: Max 1080p (even if source is 4K)
- Frame rate: 30fps preview yeterli
- RequestAnimationFrame throttle
- GPU-accelerated transforms

### LUT Thumbnails
- Generate async (Web Worker)
- Show skeleton placeholder
- Cache in memory
- Max 64x64px resolution

### Adjustments
- Debounce slider değişimi (16ms - 1 frame)
- Batch multiple adjustments
- Avoid layout thrashing

### Export
- Web Worker for encoding
- Chunked processing (memory management)
- Show meaningful progress (frame count)
- Allow cancel at any point

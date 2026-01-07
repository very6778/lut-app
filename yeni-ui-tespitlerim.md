# UI Mimari Analizi: Layout Sistemi

## 1. Yapısal Anatomia

Bu arayüz üç ana katmandan oluşuyor:

### Katman Hiyerarşisi (Z-Index Mantığı)

```
Z-0: Canvas/Video (tam ekran, kesintisiz)
Z-1: Timeline bar (floating, blur backdrop)
Z-2: Tool rail (sol kenar, sabit anchor)
Z-3: Header bar (minimal, şeffaf)
```

---

## 2. Grid Sistemi

```
┌─────────────────────────────────────────────────────────┐
│  [←]              Silent Passage ✎  +                   │  ← Header: height: 56px, transparent
├────┬────────────────────────────────────────────────────┤
│    │                                                    │
│ T  │                                                    │
│ O  │                                                    │
│ O  │              CANVAS ZONE                           │
│ L  │              (100vw × 100vh)                       │
│    │              Video fills entirely                  │
│ R  │                                                    │
│ A  │                                                    │
│ I  │                                                    │
│ L  │                                                    │
│    │                                                    │
├────┴────────────────────────────────────────────────────┤
│            TIMELINE BAR (floating)                      │  ← height: ~180px
│  ┌─────────────────────────────────────────────────┐   │
│  │ Scrubber + Thumbnails + Controls                │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Komponent Detayları

### A. Tool Rail (Sol Dikey Bar)

**Pozisyon:** `position: fixed; left: 0; top: 50%; transform: translateY(-50%)`

**Boyutlar:**
- Width: 56px
- Padding: 12px
- Gap between icons: 8px
- Icon size: 40px × 40px
- Border-radius (container): 28px

**Davranış:**
- Viewport'a sabitlenmiş, scroll'dan bağımsız
- Canvas içeriğini kesmez, üzerine float eder
- Active state: filled background (lime/accent)
- Hover state: subtle glow veya scale

**İkon Sırası (yukarıdan aşağı):**
1. Camera/Video (active)
2. Microphone
3. Music/Audio
4. AI/Magic
5. Equalizer/Effects
6. Character/Avatar
7. Text/Typography

---

### B. Header Bar

**Pozisyon:** `position: fixed; top: 0; left: 0; right: 0`

**Boyutlar:**
- Height: 56px
- Padding: 0 24px

**İçerik Layout:**
```
[Back ←]                    [Title ✎] [+]
   ↑                              ↑
left-aligned                  centered
```

**Stil:**
- Background: transparent veya rgba(0,0,0,0.1)
- Backdrop-filter yok (canvas görünürlüğü için)
- Text: white, medium weight

---

### C. Timeline Bar (Kritik Komponent)

**Pozisyon:** `position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%)`

**Boyutlar:**
- Width: calc(100vw - 160px) veya max-width: 1200px
- Height: ~160-180px
- Border-radius: 24px
- Padding: 16px 24px

**İç Yapı (yukarıdan aşağı):**

```
┌─────────────────────────────────────────────────────────┐
│  ○────────[◄►]────────────────────────────────────────○ │  ← Scrubber line
│  0s   5s   10s   15s   20s   25s   30s   35s   ...    │  ← Time markers
├─────────────────────────────────────────────────────────┤
│ [thumb1] [thumb2] [thumb3] [thumb4]  [◄] [►]  [+]     │  ← Thumbnail strip
├─────────────────────────────────────────────────────────┤
│ [⏮][✂][▶][⏭]      [9:16] [1440p] [18s] [None]    [⊞][●]│  ← Control bar
└─────────────────────────────────────────────────────────┘
```

**Alt-Komponentler:**

**Scrubber:**
- Track: 2px height, rgba(255,255,255,0.3)
- Playhead: Draggable bracket ile (◄►)
- Active range: Accent color (lime)

**Time Markers:**
- Font: 11px, monospace
- Color: rgba(255,255,255,0.5)
- Interval: 5s

**Thumbnail Strip:**
- Thumbnail size: ~120px × 68px (16:9)
- Gap: 8px
- Border-radius: 8px
- Navigation arrows: 32px circular buttons (accent color)

**Control Bar:**
- Left group: Playback controls (skip, cut, play)
- Center group: Pills/chips (aspect, resolution, duration, effects)
- Right group: Grid view, record

**Pill/Chip Stil:**
- Background: rgba(255,255,255,0.1)
- Border: 1px solid rgba(255,255,255,0.2)
- Border-radius: 20px
- Padding: 8px 16px
- Icon + text layout

---

### D. Canvas Zone

**Pozisyon:** Tüm viewport'u kaplar

**Davranış:**
- Video/content hiçbir UI elementi tarafından kesilmez
- UI elementleri overlay olarak üzerinde float eder
- Aspect ratio korunur, letterbox/pillarbox mümkün

---

## 4. Glassmorphism Spesifikasyonları

**Timeline Bar için:**
```css
background: rgba(30, 30, 30, 0.6);
backdrop-filter: blur(40px) saturate(180%);
border: 1px solid rgba(255, 255, 255, 0.08);
box-shadow: 
  0 8px 32px rgba(0, 0, 0, 0.3),
  inset 0 1px 0 rgba(255, 255, 255, 0.05);
```

**Tool Rail için:**
```css
background: rgba(40, 40, 40, 0.7);
backdrop-filter: blur(20px);
border: 1px solid rgba(255, 255, 255, 0.1);
```

---

## 5. Renk Sistemi

| Token | Değer | Kullanım |
|-------|-------|----------|
| --accent | #BFFF00 (lime) | Active states, CTAs |
| --surface | rgba(30,30,30,0.6) | Panel backgrounds |
| --text-primary | #FFFFFF | Headings, active |
| --text-secondary | rgba(255,255,255,0.5) | Labels, time |
| --border | rgba(255,255,255,0.08) | Subtle dividers |

---

## 6. Responsive Davranış

**< 1024px:**
- Tool rail collapse to bottom tab bar
- Timeline thumbnails reduce to 3 visible

**< 768px:**
- Timeline height reduces
- Pills stack or become icon-only

---

## 7. Refactor Stratejisi

1. **Adım 1:** Canvas'ı tam viewport yapılandır, tüm UI'ı `position: fixed` yap
2. **Adım 2:** Tool rail'i viewport sol kenarına anchor et
3. **Adım 3:** Timeline'ı floating container olarak bottom-center'a yerleştir
4. **Adım 4:** Backdrop-filter katmanlarını ekle
5. **Adım 5:** Z-index hiyerarşisini kur (canvas: 0, timeline: 10, tools: 20)

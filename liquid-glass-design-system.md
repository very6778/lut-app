# Liquid Glass Design System - Complete Implementation Guide

This document provides a comprehensive guide to implementing the "Liquid Glass" design system, a premium UI aesthetic that combines glassmorphism with fluid, liquid-like lighting effects.

---

## Table of Contents
1. [Core Concept](#1-core-concept)
2. [CSS Variables Setup](#2-css-variables-setup)
3. [The Liquid Glass Class](#3-the-liquid-glass-class-glass-button)
4. [Gold Tinted Glass Variant](#4-special-variant-gold-tinted-glass)
5. [Tab Navigation (Segmented Control)](#5-tab-navigation-liquid-glass-tabs)
6. [Theme Switching (Light/Dark Mode)](#6-theme-switching-mechanism)
7. [Font Requirements](#7-font-requirements)
8. [Browser Compatibility](#8-browser-compatibility)
9. [Component Examples](#9-component-examples)
10. [Implementation Tips](#10-implementation-tips)

---

## 1. Core Concept

The "Liquid Glass" effect creates a tangible, premium feel by simulating:

| Property | Description |
|----------|-------------|
| **Translucency** | Background blur using `backdrop-filter` |
| **Volume** | Complex inner shadows and highlights create depth |
| **Fluid Lighting** | Soft, organic reflections that look like liquid trapped in glass |
| **Responsiveness** | Adapts to Light and Dark modes via CSS variables |

---

## 2. CSS Variables Setup

Add these variables to your root CSS file. They control the base colors and lighting physics.

```css
:root {
  /* ===== LIQUID GLASS BASE COLORS ===== */
  --glass-color: #bbbbbc;       /* Base tint color */
  --glass-light: #fff;          /* Highlight color */
  --glass-dark: #000;           /* Shadow color */
  
  /* ===== LIGHTING PHYSICS ===== */
  --glass-reflex-light: 1;      /* Intensity of light reflections (0-2) */
  --glass-reflex-dark: 1;       /* Intensity of dark shadows (0-2) */
  --glass-saturation: 150%;     /* Color vibrancy through the glass */

  /* ===== TRANSITIONS ===== */
  --transition-theme: 400ms cubic-bezier(1, 0.0, 0.4, 1);
  --transition-fast: 150ms ease;
  
  /* ===== BORDER RADIUS ===== */
  --radius-sm: 12px;
  --radius-md: 16px;
  --radius-lg: 24px;
  --radius-full: 9999px;
}

/* ===== DARK MODE ADJUSTMENTS ===== */
[data-theme="dark"] {
  --glass-color: #888888;
  --glass-reflex-light: 0.4;    /* Dimmer highlights in dark mode */
  --glass-reflex-dark: 2;       /* Stronger shadows in dark mode */
}
```

---

## 3. The Liquid Glass Class (`.glass-button`)

This is the core CSS class that applies the effect. It works on any element (button, div, badge, card).

### Key Implementation Details:
- Uses `color-mix()` for dynamic transparency
- Uses multiple `inset` box-shadows to simulate 3D lighting curves
- `-webkit-backdrop-filter` prefix is required for Safari

```css
.glass-button {
  /* ===== 1. BASE MATERIAL ===== */
  background-color: color-mix(in srgb, var(--glass-color) 15%, transparent);
  backdrop-filter: blur(12px) saturate(var(--glass-saturation));
  -webkit-backdrop-filter: blur(12px) saturate(var(--glass-saturation));
  border: none;
  
  /* ===== 2. COMPLEX LIGHTING (The "Liquid" Effect) ===== */
  box-shadow:
    /* --- Inner light reflections (Top-Left curvature) --- */
    inset 0 0 0 1px color-mix(in srgb, var(--glass-light) calc(var(--glass-reflex-light) * 12%), transparent),
    inset 1.5px 2.5px 0px -1.5px color-mix(in srgb, var(--glass-light) calc(var(--glass-reflex-light) * 80%), transparent),
    inset -1.5px -1.5px 0px -1px color-mix(in srgb, var(--glass-light) calc(var(--glass-reflex-light) * 70%), transparent),
    inset -2px -6px 1px -4px color-mix(in srgb, var(--glass-light) calc(var(--glass-reflex-light) * 50%), transparent),
    
    /* --- Inner dark shadows (Bottom-Right depth) --- */
    inset -0.5px -1px 3px 0px color-mix(in srgb, var(--glass-dark) calc(var(--glass-reflex-dark) * 10%), transparent),
    inset -1px 2px 0px -1px color-mix(in srgb, var(--glass-dark) calc(var(--glass-reflex-dark) * 15%), transparent),
    inset 0px 2px 3px -1.5px color-mix(in srgb, var(--glass-dark) calc(var(--glass-reflex-dark) * 15%), transparent),
    
    /* --- Outer shadow (Drop shadow) --- */
    0px 1px 4px 0px color-mix(in srgb, var(--glass-dark) calc(var(--glass-reflex-dark) * 8%), transparent),
    0px 4px 12px 0px color-mix(in srgb, var(--glass-dark) calc(var(--glass-reflex-dark) * 6%), transparent);

  /* ===== 3. TRANSITIONS ===== */
  transition:
    transform var(--transition-fast),
    box-shadow var(--transition-theme),
    background-color var(--transition-theme),
    color var(--transition-theme);
}

/* ===== HOVER STATE - "Liquid" movement ===== */
.glass-button:hover {
  background-color: color-mix(in srgb, var(--glass-color) 22%, transparent);
  transform: scale(1.05);
  cursor: pointer;
}

/* ===== ACTIVE/PRESS STATE ===== */
.glass-button:active {
  transform: scale(0.98);
}
```

---

## 4. Special Variant: Gold Tinted Glass

Used for premium actions (Back button, AI Analysis button, etc.)

```css
.gold-glass-button {
  /* ===== GOLD COLOR DEFINITIONS ===== */
  --gold-glass: hsl(38, 35%, 55%);
  --gold-light: hsl(45, 50%, 92%);
  --gold-dark: hsl(30, 25%, 18%);

  /* ===== APPLY GOLD TINT ===== */
  background-color: color-mix(in srgb, var(--gold-glass) 18%, transparent);
  backdrop-filter: blur(12px) saturate(160%);
  -webkit-backdrop-filter: blur(12px) saturate(160%);
  border: none;
  
  /* ===== GOLD SHADOWS ===== */
  box-shadow:
    inset 0 0 0 1px color-mix(in srgb, var(--gold-light) 15%, transparent),
    inset 1.5px 2.5px 0px -1.5px color-mix(in srgb, var(--gold-light) 85%, transparent),
    inset -1.5px -1.5px 0px -1px color-mix(in srgb, var(--gold-light) 75%, transparent),
    inset -2px -6px 1px -4px color-mix(in srgb, var(--gold-light) 55%, transparent),
    inset -0.5px -1px 3px 0px color-mix(in srgb, var(--gold-dark) 12%, transparent),
    inset -1px 2px 0px -1px color-mix(in srgb, var(--gold-dark) 18%, transparent),
    0px 1px 4px 0px color-mix(in srgb, var(--gold-dark) 10%, transparent),
    0px 4px 12px 0px color-mix(in srgb, var(--gold-dark) 8%, transparent);
    
  transition: box-shadow var(--transition-theme), background-color var(--transition-theme);
}

/* ===== DARK MODE - less bright gold ===== */
[data-theme="dark"] .gold-glass-button {
  --gold-glass: hsl(38, 18%, 38%);
  --gold-light: hsl(45, 25%, 70%);
  --gold-dark: hsl(30, 20%, 10%);
  background-color: color-mix(in srgb, var(--gold-glass) 7%, transparent);
}
```

---

## 5. Tab Navigation (Liquid Glass Tabs)

A segmented control with a sliding indicator, using the Liquid Glass effect.

```css
.tab-nav {
  /* ===== GOLD TINT VARIABLES ===== */
  --gold-glass: hsl(38, 35%, 55%);
  --gold-light: hsl(45, 50%, 92%);
  --gold-dark: hsl(30, 25%, 18%);

  /* ===== LAYOUT ===== */
  position: relative;
  display: flex;
  gap: 4px;
  padding: 4px 6px;
  border-radius: var(--radius-full);
  
  /* ===== GLASS EFFECT ===== */
  background: color-mix(in srgb, var(--gold-glass) 15%, transparent);
  backdrop-filter: blur(8px) saturate(160%);
  -webkit-backdrop-filter: blur(8px) saturate(160%);
  
  box-shadow:
    inset 0 0 0 1px color-mix(in srgb, var(--gold-light) 12%, transparent),
    inset 1.8px 3px 0px -2px color-mix(in srgb, var(--gold-light) 75%, transparent),
    inset -2px -2px 0px -2px color-mix(in srgb, var(--gold-light) 65%, transparent),
    inset -0.3px -1px 4px 0px color-mix(in srgb, var(--gold-dark) 12%, transparent),
    0px 2px 8px 0px color-mix(in srgb, var(--gold-dark) 8%, transparent);
}

/* ===== SLIDING INDICATOR (::after pseudo-element) ===== */
.tab-nav::after {
  content: '';
  position: absolute;
  top: 4px;
  left: 6px;
  width: calc((100% - 12px - 8px) / 3); /* Adjust based on tab count */
  height: calc(100% - 8px);
  border-radius: var(--radius-full);
  background: color-mix(in srgb, var(--gold-glass) 35%, transparent);
  z-index: 0;
  pointer-events: none;
  
  box-shadow:
    inset 0 0 0 1px color-mix(in srgb, var(--gold-light) 15%, transparent),
    inset 2px 1px 0px -1px color-mix(in srgb, var(--gold-light) 80%, transparent),
    0px 2px 6px 0px color-mix(in srgb, var(--gold-dark) 8%, transparent);
    
  /* ===== SMOOTH SLIDE ANIMATION ===== */
  transition: translate 400ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* ===== INDICATOR POSITIONS ===== */
.tab-nav[data-active-tab="0"]::after { translate: 0 0; }
.tab-nav[data-active-tab="1"]::after { translate: calc(100% + 4px) 0; }
.tab-nav[data-active-tab="2"]::after { translate: calc(200% + 8px) 0; }

/* ===== TAB BUTTON STYLE ===== */
.tab-button {
  position: relative;
  z-index: 1;
  padding: 8px 16px;
  background: transparent;
  border: none;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: color 200ms ease;
}

.tab-button.active {
  color: var(--color-text);
}
```

---

## 6. Theme Switching Mechanism

The Liquid Glass effect adapts automatically based on `data-theme` attribute.

### React ThemeProvider Example:

```tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

const ThemeContext = createContext<{
  theme: Theme;
  toggleTheme: () => void;
}>({
  theme: "light",
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    // Check system preference on mount
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    const initialTheme = savedTheme || (prefersDark ? "dark" : "light");
    
    setTheme(initialTheme);
    document.documentElement.setAttribute("data-theme", initialTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
```

### Theme Toggle Button:

```tsx
import { Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button 
      onClick={toggleTheme} 
      className="theme-toggle glass-button"
      aria-label="Toggle theme"
    >
      {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
    </button>
  );
}
```

---

## 7. Font Requirements

For the complete aesthetic, load these fonts from Google Fonts:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:wght@500;600&display=swap" rel="stylesheet">
```

CSS Variables:

```css
:root {
  --font-heading: 'Playfair Display', Georgia, serif;
  --font-body: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}
```

---

## 8. Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| `backdrop-filter` | ✅ 76+ | ✅ 103+ | ✅ 9+ (with prefix) | ✅ 79+ |
| `color-mix()` | ✅ 111+ | ✅ 113+ | ✅ 16.2+ | ✅ 111+ |

### Fallback for Older Browsers:

```css
.glass-button {
  /* Fallback: solid semi-transparent background */
  background-color: rgba(180, 180, 180, 0.3);
}

@supports (backdrop-filter: blur(12px)) {
  .glass-button {
    background-color: color-mix(in srgb, var(--glass-color) 15%, transparent);
    backdrop-filter: blur(12px) saturate(var(--glass-saturation));
  }
}
```

---

## 9. Component Examples

### React Button Component

```tsx
interface GlassButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "default" | "gold";
  fullWidth?: boolean;
}

export function GlassButton({ 
  children, 
  onClick, 
  variant = "default",
  fullWidth = false 
}: GlassButtonProps) {
  return (
    <button 
      className={`glass-button ${variant === "gold" ? "gold-glass-button" : ""}`}
      onClick={onClick}
      style={{
        padding: '12px 24px',
        borderRadius: '9999px',
        color: 'var(--color-text)',
        fontWeight: 500,
        width: fullWidth ? '100%' : 'auto'
      }}
    >
      {children}
    </button>
  );
}
```

### Vanilla HTML

```html
<!-- Standard Glass Button -->
<button class="glass-button">
  Click Me
</button>

<!-- Gold Glass Button -->
<button class="glass-button gold-glass-button">
  Premium Action
</button>
```

---

## 10. Implementation Tips

1. **Border Radius**: The liquid effect works best on fully rounded elements (`border-radius: 9999px`). Sharp corners break the illusion of surface tension.

2. **Background Context**: Liquid Glass needs a colored or textured background to show its translucency. It looks flat on pure white/black backgrounds.

3. **Dark Mode Handling**: In dark mode, reduce `background-color` opacity (7% instead of 18%) but increase shadow intensity to maintain visibility.

4. **Touch Feel**: The `transform: scale(1.05)` on hover and `scale(0.98)` on click creates a tactile, jelly-like feel that complements the visual liquid effect.

5. **Performance**: `backdrop-filter` can be GPU-intensive. Limit usage to small elements (buttons, badges) rather than full-screen overlays.

6. **Z-Index**: Glass elements should stack properly. Use `z-index` to ensure blur doesn't affect overlapping content.

---

## Credits

Design System created for **Etimoloji** - Turkish Etymology Research Tool.

---

*Last updated: January 2026*

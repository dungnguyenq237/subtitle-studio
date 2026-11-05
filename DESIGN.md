---
name: Subtitle Studio
description: The subtitle finishing room
colors:
  primary: "#ff906a"
  ground: "#191b1b"
  surface: "#222525"
  ink: "#f0eee8"
  muted: "#aeb6b1"
typography:
  display:
    fontFamily: "Studio (Miriam Libre Bold)"
    fontWeight: 700
    letterSpacing: "-0.035em"
  body:
    fontFamily: "system-ui, sans-serif"
    fontSize: "15px"
    lineHeight: 1.65
rounded:
  control: "5px"
spacing:
  compact: "12px"
  regular: "24px"
---

# Design System: Subtitle Studio

## Overview

**Creative North Star: "The subtitle finishing room"**

Tonal graphite layers and a warm playhead accent surround a working subtitle editor. The caption demonstration is explicitly sample content; the timeline moves only on request.

## Colors

The primary accent distinguishes actionable controls. Neutral surfaces provide hierarchy without decorative gradients.

## Typography

Self-hosted Studio (Miriam Libre Bold) carries display and brand text. System sans supports form labels and explanatory copy. Monospace is reserved for subtitle data, timestamps and puzzle grids. Fonts are subset and licensed under SIL OFL; notices are in assets/.

## Layout

A 1380px maximum container uses fluid horizontal padding. The desktop hero is asymmetric and two-column. The working area stacks on narrow screens. The main task remains accessible through a skip link and header navigation.

## Elevation & Depth

The demo has a soft offset shadow; the editor separates source and output through tonal surfaces and borders.

## Shapes

Small-radius controls contrast with the focal caption frame and timeline.

## Components

Primary actions carry the accent. Disabled controls cannot export stale results. All fields have labels, visible focus and recovery text. Timing step buttons adjust by half a second; playback is user-controlled and stops when the tab becomes hidden.

## Do's and Don'ts

- Do preserve useful feedback under reduced motion.
- Do keep all input and processing local.
- Do keep print styles separate from screen preview styles.
- Don't introduce invented proof, fake customers or fake advertising.
- Don't make routine tasks wait for decoration.

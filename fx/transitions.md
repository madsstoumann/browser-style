---
title: Transitions
author: Mads Stoumann
tags: [layout, designer, utilities]
---

# Utilities > Transitions

**Transitions** is a collection of micro-classes to control transitions. 

## Abbreviations:

| Prefix    | Function        |
| --------- | --------------  |
| `.trs-`   | transition-name |
| `.trsde-` | transition-delay |
| `.trsdu-` | transition-duration |
| `.trstf-` | transition-timing-function |

To **trigger** a transition, add the class `trs` to the element.
You should only add the class to the *outermost* element with a `trs-` class, children will be animated automatically.

---

## Transitions

### Fade

| Name       | Value           |
| ---------- | --------------- |
| `.trs-fdd` | Fade Down       |
| `.trs-fdl` | Fade Down Left  |
| `.trs-fdr` | Fade Down Right |
| `.trs-fal` | Fade Left       |
| `.trs-far` | Fade Right      |
| `.trs-fau` | Fade Up         |
| `.trs-ful` | Fade Up Left    |
| `.trs-fur` | Fade Up Right   |

### Flip
| Name       | Value      |
| ---------- | ---------- |
| `.trs-fld` | Flip Down  |
| `.trs-fll` | Flip Left  |
| `.trs-flr` | Flip Right |
| `.trs-flu` | Flip Up    |

### Zoom
| Name       | Value        |
| ---------- | ------------ |
| `.trs-zoi` | Zoom In      |
| `.trs-zod` | Zoom In Down |
| `.trs-ziu` | Zoom In Up   |
| `.trs-zoo` | Zoom Out     |

## Delays
| Name          | Value  |
| ------------- | ------ |
| `.trsde-0`    | 0ms    |
| `.trsde-25`   | 25ms   |
| `.trsde-50`   | 50ms   |
| `.trsde-75`   | 75ms   |
| `.trsde-100`  | 100ms  |
| `.trsde-150`  | 150ms  |
| `.trsde-250`  | 250ms  |
| `.trsde-375`  | 375ms  |
| `.trsde-500`  | 500ms  |
| `.trsde-750`  | 750ms  |
| `.trsde-1000` | 1000ms |
| `.trsde-1500` | 1500ms |
| `.trsde-2000` | 2000ms |

## Duration
| Name          | Value  |
| ------------- | ------ |
| `.trsdu-100`  | 100ms  |
| `.trsdu-200`  | 200ms  |
| `.trsdu-300`  | 300ms  |
| `.trsdu-400`  | 400ms  |
| `.trsdu-500`  | 500ms  |
| `.trsdu-750`  | 750ms  |
| `.trsdu-1000` | 1000ms |
| `.trsdu-1500` | 1500ms |
| `.trsdu-2000` | 2000ms |

## Timing Functions (Easings)
| Name           | Value  |
| -------------- | ------ |
| `.trstf-eas-1` | ease-1 |
| `.trstf-eas-2` | ease-2 |
| `.trstf-eas-3` | ease-3 |
| `.trstf-eas-4` | ease-4 |
| `.trstf-eas-5` | ease-5 |
| `.trstf-eai-1` | ease-in-1 |
| `.trstf-eai-2` | ease-in-2 |
| `.trstf-eai-3` | ease-in-3 |
| `.trstf-eai-4` | ease-in-4 |
| `.trstf-eai-5` | ease-in-5  |
| `.trstf-eao-1` | ease-out-1 |
| `.trstf-eao-2` | ease-out-2 |
| `.trstf-eao-3` | ease-out-3 |
| `.trstf-eao-4` | ease-out-4 |
| `.trstf-eao-5` | ease-out-5 |
| `.trstf-eio-1` | ease-in-out-1 |
| `.trstf-eio-2` | ease-in-out-2 |
| `.trstf-eio-3` | ease-in-out-3 |
| `.trstf-eio-4` | ease-in-out-4 |
| `.trstf-eio-5` | ease-in-out-5 |
| `.trstf-eel-1` | ease-elastic-1 |
| `.trstf-eel-2` | ease-elastic-2 |
| `.trstf-eel-3` | ease-elastic-3 |
| `.trstf-eel-4` | ease-elastic-4 |
| `.trstf-eel-5` | ease-elastic-5 |
| `.trstf-esq-1` | ease-squish-1 |
| `.trstf-esq-2` | ease-squish-2 |
| `.trstf-esq-3` | easing-squish-3 |
| `.trstf-esq-4` | easing-squish-4 |
| `.trstf-esq-5` | easing-squish-5 |
| `.trstf-lin`   | linear |
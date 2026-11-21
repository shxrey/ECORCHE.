// Initially generated from reference/protocol.html by scripts/extract-legacy.mjs.
// This file is now the source of truth for the program: edit it here.
// Exercise keys ("push-a1" ... "legs-b7") and set indices are permanent IDs:
// saved logs and old JSON backups reference them, so never rename them.

import type { Day, Exercise } from './types';

export const days: Day[] = [
  {
    "id": "pushA",
    "group": "push",
    "letter": "A",
    "sectionId": "workoutPushA",
    "active": false,
    "eyebrow": "Session 02",
    "title": "Push Day",
    "subtitleHtml": "Cable-anchored incline focus with one heavy flat-bench peak set. Cables keep constant tension on the chest and delts through the full range, while the single flat-bench set gives you one true heavy-mechanical-tension stimulus per week.",
    "totalSets": 21,
    "progressHeading": "Session Progress",
    "progressHint": "Tap a set number on any exercise as you complete it.",
    "resetLabel": "Reset Day A",
    "exerciseKeys": [
      "push-a1",
      "push-a2",
      "push-a3",
      "push-a4",
      "push-a5",
      "push-a6",
      "push-a7",
      "push-a8"
    ]
  },
  {
    "id": "pushB",
    "group": "push",
    "letter": "B",
    "sectionId": "workoutPushB",
    "active": false,
    "eyebrow": "Session 05",
    "title": "Push Day",
    "subtitleHtml": "Free-weight flat/incline flip side. The barbell takes the heavy compound slot this time, the dumbbell press takes the peak-intensity slot, and the fly work shifts to a wider crossover pattern for a different stretch angle on the chest.",
    "totalSets": 21,
    "progressHeading": "Session Progress",
    "progressHint": "Tap a set number on any exercise as you complete it.",
    "resetLabel": "Reset Day B",
    "exerciseKeys": [
      "push-b1",
      "push-b2",
      "push-b3",
      "push-b4",
      "push-b5",
      "push-b6",
      "push-b7",
      "push-b8"
    ]
  },
  {
    "id": "pullA",
    "group": "pull",
    "letter": "A",
    "sectionId": "workoutPullA",
    "active": false,
    "eyebrow": "Session 03",
    "title": "Pull Day",
    "subtitleHtml": "Pre-exhaust pulldown opener into horizontal rowing, a heavy unilateral peak set, and traps/biceps to finish. Shrugs and both curl variations now live here instead of on push day.",
    "totalSets": 24,
    "progressHeading": "Session Progress",
    "progressHint": "Tap a set number on any exercise as you complete it.",
    "resetLabel": "Reset Day A",
    "exerciseKeys": [
      "pull-a1",
      "pull-a2",
      "pull-a3",
      "pull-a4",
      "pull-a5",
      "pull-a6",
      "pull-a7",
      "pull-a8"
    ]
  },
  {
    "id": "pullB",
    "group": "pull",
    "letter": "B",
    "sectionId": "workoutPullB",
    "active": false,
    "eyebrow": "Session 06",
    "title": "Pull Day",
    "subtitleHtml": "Straight into pulldowns and rows without the pre-exhaust superset, a pure lat-isolation pullover, and the same traps/biceps finish as Day A with different variations.",
    "totalSets": 24,
    "progressHeading": "Session Progress",
    "progressHint": "Tap a set number on any exercise as you complete it.",
    "resetLabel": "Reset Day B",
    "exerciseKeys": [
      "pull-b1",
      "pull-b2",
      "pull-b3",
      "pull-b4",
      "pull-b5",
      "pull-b6",
      "pull-b7",
      "pull-b8"
    ]
  },
  {
    "id": "legsA",
    "group": "legs",
    "letter": "A",
    "sectionId": "workoutLegsA",
    "active": true,
    "eyebrow": "Session 01",
    "title": "Leg Day",
    "subtitleHtml": "Free-bar squat as the primary quad/glute driver, heavy RDLs for the hamstrings, and forearms now finishing the day instead of pull day so grip stays fresh for rowing. No leg curls this cycle — RDLs carry the full hamstring stimulus.",
    "totalSets": 21,
    "progressHeading": "Session Progress",
    "progressHint": "Tap a set number on any exercise as you complete it.",
    "resetLabel": "Reset Day A",
    "exerciseKeys": [
      "legs-a1",
      "legs-a2",
      "legs-a3",
      "legs-a4",
      "legs-a5",
      "legs-a6",
      "legs-a7"
    ]
  },
  {
    "id": "legsB",
    "group": "legs",
    "letter": "B",
    "sectionId": "workoutLegsB",
    "active": false,
    "eyebrow": "Session 04",
    "title": "Leg Day",
    "subtitleHtml": "Same free-bar squat and Widowmaker leg press, dumbbell shoulder press and dumbbell RDLs for variety, and the extensor half of the forearm pairing to balance Day A's flexor work.",
    "totalSets": 21,
    "progressHeading": "Session Progress",
    "progressHint": "Tap a set number on any exercise as you complete it.",
    "resetLabel": "Reset Day B",
    "exerciseKeys": [
      "legs-b1",
      "legs-b2",
      "legs-b3",
      "legs-b4",
      "legs-b5",
      "legs-b6",
      "legs-b7"
    ]
  }
];

export const exercises: Exercise[] = [
  {
    "key": "push-a1",
    "number": 1,
    "name": "Seated Cable Incline Press",
    "nameSuffix": null,
    "tags": [
      {
        "tone": "chest",
        "label": "Upper Chest"
      },
      {
        "tone": "delt",
        "label": "Front Delt"
      }
    ],
    "sets": "3",
    "reps": "8-10",
    "rir": "0-1",
    "pillVariant": null,
    "setDots": [
      {
        "idx": "1",
        "label": "1"
      },
      {
        "idx": "2",
        "label": "2"
      },
      {
        "idx": "3",
        "label": "3"
      }
    ],
    "blocks": [
      {
        "heading": "Execution Cues",
        "items": [
          {
            "kind": "text",
            "html": "Your opening compound. Set the seat so the handles start at upper-chest height, and drive up and slightly back along the incline plane. Unlike a barbell, the cables keep the upper chest under load even at full lockout, so don't rest at the top — reset immediately into the next rep."
          },
          {
            "kind": "intensity",
            "level": "rir1",
            "html": "Intensity: 0-1 RIR — push close to the wall"
          }
        ]
      },
      {
        "heading": "Muscle Activation",
        "items": [
          {
            "kind": "activation",
            "rows": [
              {
                "label": "Upper Chest",
                "tone": "chest",
                "pct": 82,
                "scale": "0.82",
                "filter": null
              },
              {
                "label": "Front Delt",
                "tone": "delt",
                "pct": 74,
                "scale": "0.74",
                "filter": null
              },
              {
                "label": "Triceps",
                "tone": "tri",
                "pct": 48,
                "scale": "0.48",
                "filter": null
              }
            ]
          },
          {
            "kind": "sourceNote",
            "html": "Illustrative % of MVIC, directionally consistent with incline-press EMG literature. Cables hold tension through the top third of the rep that a barbell loses entirely."
          }
        ]
      }
    ]
  },
  {
    "key": "push-a2",
    "number": 2,
    "name": "Flat Barbell Bench Press",
    "nameSuffix": {
      "text": "— Peak Intensity",
      "tone": "danger"
    },
    "tags": [
      {
        "tone": "chest",
        "label": "Mid/Lower Chest"
      },
      {
        "tone": "delt",
        "label": "Front Delt"
      }
    ],
    "sets": "1",
    "reps": "4-6",
    "rir": "FAILURE",
    "pillVariant": "danger",
    "setDots": [
      {
        "idx": "1",
        "label": "1"
      }
    ],
    "blocks": [
      {
        "heading": "Execution Cues",
        "items": [
          {
            "kind": "text",
            "html": "<strong>One single set. Total focus.</strong> Warm up thoroughly, then treat this like a competitive max attempt at a 4-6 rep load. Full 3-second negative, brief chest touch, explosive drive. The flat angle biases the sternocostal (mid/lower) head of the pec harder than any incline variation — this is your heaviest mechanical-tension stimulus of the day."
          },
          {
            "kind": "intensity",
            "level": "failure",
            "html": "Intensity: Absolute Failure — 0 RIR"
          }
        ]
      },
      {
        "heading": "Muscle Activation",
        "items": [
          {
            "kind": "activation",
            "rows": [
              {
                "label": "Mid/Lower Chest",
                "tone": "chest",
                "pct": 95,
                "scale": "0.95",
                "filter": null
              },
              {
                "label": "Front Delt",
                "tone": "delt",
                "pct": 62,
                "scale": "0.62",
                "filter": null
              },
              {
                "label": "Triceps",
                "tone": "tri",
                "pct": 58,
                "scale": "0.58",
                "filter": null
              }
            ]
          },
          {
            "kind": "sourceNote",
            "html": "EMG work comparing bench angles found the sternocostal (mid/lower) pectoralis fires hardest at 0° flat, while the clavicular (upper) head and anterior deltoid peak at steeper angles."
          }
        ]
      }
    ]
  },
  {
    "key": "push-a3",
    "number": 3,
    "name": "Incline Dumbbell Press",
    "nameSuffix": null,
    "tags": [
      {
        "tone": "chest",
        "label": "Upper Chest"
      },
      {
        "tone": "delt",
        "label": "Front Delt"
      }
    ],
    "sets": "3",
    "reps": "8-10",
    "rir": "1-2",
    "pillVariant": null,
    "setDots": [
      {
        "idx": "1",
        "label": "1"
      },
      {
        "idx": "2",
        "label": "2"
      },
      {
        "idx": "3",
        "label": "3"
      }
    ],
    "blocks": [
      {
        "heading": "Execution Cues",
        "items": [
          {
            "kind": "text",
            "html": "The free range of dumbbells lets your elbows travel slightly outside the barbell's fixed path, adding a genuine stretch at the bottom that machines and cables can't replicate. Let the dumbbells drop until you feel a deep stretch across the upper chest, then press up and slightly inward without clacking the weights together."
          },
          {
            "kind": "intensity",
            "level": "rir2",
            "html": "Intensity: 1-2 RIR"
          }
        ]
      },
      {
        "heading": "Muscle Activation",
        "items": [
          {
            "kind": "activation",
            "rows": [
              {
                "label": "Upper Chest",
                "tone": "chest",
                "pct": 86,
                "scale": "0.86",
                "filter": null
              },
              {
                "label": "Front Delt",
                "tone": "delt",
                "pct": 70,
                "scale": "0.7",
                "filter": null
              },
              {
                "label": "Triceps",
                "tone": "tri",
                "pct": 50,
                "scale": "0.5",
                "filter": null
              }
            ]
          },
          {
            "kind": "sourceNote",
            "html": "Free-weight presses at longer muscle lengths are consistently linked to greater upper-chest hypertrophy than fixed-path machine equivalents of similar intensity."
          }
        ]
      }
    ]
  },
  {
    "key": "push-a4",
    "number": 4,
    "name": "Slight-Incline Cable Bench Flyes",
    "nameSuffix": null,
    "tags": [
      {
        "tone": "chest",
        "label": "Chest (Isolation)"
      }
    ],
    "sets": "2",
    "reps": "10-12",
    "rir": "1-2",
    "pillVariant": null,
    "setDots": [
      {
        "idx": "1",
        "label": "1"
      },
      {
        "idx": "2",
        "label": "2"
      }
    ],
    "blocks": [
      {
        "heading": "Execution Cues",
        "items": [
          {
            "kind": "text",
            "html": "Pure isolation to finish the chest — no triceps or delt to bail you out. Set the pulleys slightly below shoulder height, keep a soft bend in the elbow throughout, and think about hugging a barrel rather than pressing. Squeeze and hold half a second at full contraction."
          },
          {
            "kind": "intensity",
            "level": "rir2",
            "html": "Intensity: 1-2 RIR"
          }
        ]
      },
      {
        "heading": "Muscle Activation",
        "items": [
          {
            "kind": "activation",
            "rows": [
              {
                "label": "Chest",
                "tone": "chest",
                "pct": 92,
                "scale": "0.92",
                "filter": null
              },
              {
                "label": "Front Delt",
                "tone": "delt",
                "pct": 38,
                "scale": "0.38",
                "filter": null
              }
            ]
          },
          {
            "kind": "sourceNote",
            "html": "Cable flyes keep tension on the pecs through horizontal adduction without meaningfully loading the triceps, making them the cleanest finisher after two pressing movements."
          }
        ]
      }
    ]
  },
  {
    "key": "push-a5",
    "number": 5,
    "name": "Crossbody Cable Lateral Raise",
    "nameSuffix": null,
    "tags": [
      {
        "tone": "delt",
        "label": "Side Delt"
      }
    ],
    "sets": "3",
    "reps": "10-12",
    "rir": "1-2",
    "pillVariant": null,
    "setDots": [
      {
        "idx": "1",
        "label": "1"
      },
      {
        "idx": "2",
        "label": "2"
      },
      {
        "idx": "3",
        "label": "3"
      }
    ],
    "blocks": [
      {
        "heading": "Execution Cues",
        "items": [
          {
            "kind": "text",
            "html": "Pull the low cable across your body and up in an arc, leading with the elbow. Crossing the body puts the side delt under load at the bottom of the rep, where a standard dumbbell raise goes completely slack — this is the single most defensible spot in the whole week to add sets if width is a priority."
          },
          {
            "kind": "intensity",
            "level": "rir2",
            "html": "Intensity: 1-2 RIR"
          }
        ]
      },
      {
        "heading": "Muscle Activation",
        "items": [
          {
            "kind": "activation",
            "rows": [
              {
                "label": "Side Delt",
                "tone": "delt",
                "pct": 90,
                "scale": "0.9",
                "filter": null
              },
              {
                "label": "Front Delt",
                "tone": "delt",
                "pct": 35,
                "scale": "0.35",
                "filter": "hue-rotate(15deg)"
              }
            ]
          },
          {
            "kind": "sourceNote",
            "html": "Cable lateral raises maintain resistance in the bottom half of the rep that dumbbells lose to gravity, keeping the side delt loaded through a longer portion of its strength curve."
          }
        ]
      }
    ]
  },
  {
    "key": "push-a6",
    "number": 6,
    "name": "Triceps: Overhead Cable Extensions",
    "nameSuffix": {
      "text": "(Long Head)",
      "tone": "muted"
    },
    "tags": [
      {
        "tone": "tri",
        "label": "Triceps — Long Head"
      }
    ],
    "sets": "3",
    "reps": "10-12",
    "rir": "0-1",
    "pillVariant": null,
    "setDots": [
      {
        "idx": "1",
        "label": "1"
      },
      {
        "idx": "2",
        "label": "2"
      },
      {
        "idx": "3",
        "label": "3"
      }
    ],
    "blocks": [
      {
        "heading": "Execution Cues",
        "items": [
          {
            "kind": "text",
            "html": "Now a standalone movement, so take the full rest between sets rather than racing into a pushdown. Move into a deep overhead stretch — because the long head crosses the shoulder joint as well as the elbow, only an overhead arm position lengthens it enough to be a serious growth driver."
          },
          {
            "kind": "intensity",
            "level": "rir1",
            "html": "Intensity: 0-1 RIR"
          }
        ]
      },
      {
        "heading": "Muscle Activation",
        "items": [
          {
            "kind": "activation",
            "rows": [
              {
                "label": "Long Head",
                "tone": "tri",
                "pct": 92,
                "scale": "0.92",
                "filter": null
              },
              {
                "label": "Medial Head",
                "tone": "tri",
                "pct": 60,
                "scale": "0.6",
                "filter": "hue-rotate(15deg)"
              },
              {
                "label": "Lateral Head",
                "tone": "tri",
                "pct": 55,
                "scale": "0.55",
                "filter": "hue-rotate(-15deg)"
              }
            ]
          },
          {
            "kind": "sourceNote",
            "html": "A 12-week controlled trial found overhead-position triceps training produced 28.5% long-head muscle growth versus 19.6% for the same exercise performed with the arm neutral at the side — despite lower absolute loads lifted overhead."
          },
          {
            "kind": "cite",
            "html": "Maeo et al. (2022), Eur J Sport Sci 23(7)"
          }
        ]
      }
    ]
  },
  {
    "key": "push-a7",
    "number": 7,
    "name": "Triceps: Cable Pushdowns",
    "nameSuffix": {
      "text": "(Lateral Head)",
      "tone": "muted"
    },
    "tags": [
      {
        "tone": "tri",
        "label": "Triceps — Lateral Head"
      }
    ],
    "sets": "3",
    "reps": "10-12",
    "rir": "0-1",
    "pillVariant": null,
    "setDots": [
      {
        "idx": "1",
        "label": "1"
      },
      {
        "idx": "2",
        "label": "2"
      },
      {
        "idx": "3",
        "label": "3"
      }
    ],
    "blocks": [
      {
        "heading": "Execution Cues",
        "items": [
          {
            "kind": "text",
            "html": "Pin your elbows to your sides and don't let them drift forward. This short, neutral-arm position biases the lateral head — the \"horseshoe\" you see from the side — hardest, because the long head is slack and contributes little. Full rest before and after now that it's not paired with the overhead extension."
          },
          {
            "kind": "intensity",
            "level": "rir1",
            "html": "Intensity: 0-1 RIR"
          }
        ]
      },
      {
        "heading": "Muscle Activation",
        "items": [
          {
            "kind": "activation",
            "rows": [
              {
                "label": "Lateral Head",
                "tone": "tri",
                "pct": 88,
                "scale": "0.88",
                "filter": null
              },
              {
                "label": "Medial Head",
                "tone": "tri",
                "pct": 70,
                "scale": "0.7",
                "filter": "hue-rotate(15deg)"
              },
              {
                "label": "Long Head",
                "tone": "tri",
                "pct": 45,
                "scale": "0.45",
                "filter": "hue-rotate(-15deg)"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "key": "push-a8",
    "number": 8,
    "name": "Core: Cable Crunches",
    "nameSuffix": {
      "text": "(Upper Bias)",
      "tone": "muted"
    },
    "tags": [
      {
        "tone": "core",
        "label": "Rectus Abdominis"
      }
    ],
    "sets": "3",
    "reps": "To Fail",
    "rir": "FAILURE",
    "pillVariant": "danger",
    "setDots": [
      {
        "idx": "1",
        "label": "1"
      },
      {
        "idx": "2",
        "label": "2"
      },
      {
        "idx": "3",
        "label": "3"
      }
    ],
    "blocks": [
      {
        "heading": "Execution Cues",
        "items": [
          {
            "kind": "text",
            "html": "Core now lives permanently on push day. Kneel facing the cable stack, rope behind your neck. Don't yank the weight with your hip flexors — round your lower back intentionally and crunch your chest toward your pelvis. Add weight over time; don't just chase more reps."
          },
          {
            "kind": "intensity",
            "level": "failure",
            "html": "Intensity: Absolute Failure — 0 RIR"
          }
        ]
      },
      {
        "heading": "Muscle Activation",
        "items": [
          {
            "kind": "activation",
            "rows": [
              {
                "label": "Rectus Abd.",
                "tone": "core",
                "pct": 90,
                "scale": "0.9",
                "filter": null
              },
              {
                "label": "Obliques",
                "tone": "core",
                "pct": 40,
                "scale": "0.4",
                "filter": "hue-rotate(15deg)"
              },
              {
                "label": "Hip Flexors",
                "tone": "core",
                "pct": 15,
                "scale": "0.15",
                "filter": "hue-rotate(-15deg)"
              }
            ]
          },
          {
            "kind": "sourceNote",
            "html": "Weighted, resisted trunk flexion follows the same volume dose-response logic as every other muscle group: progressively adding load and sets drives more growth than endless bodyweight reps."
          },
          {
            "kind": "cite",
            "html": "Schoenfeld, Ogborn &amp; Krieger (2017), J Sports Sci 35(11)"
          }
        ]
      }
    ]
  },
  {
    "key": "push-b1",
    "number": 1,
    "name": "Flat Barbell Bench Press",
    "nameSuffix": null,
    "tags": [
      {
        "tone": "chest",
        "label": "Mid/Lower Chest"
      },
      {
        "tone": "delt",
        "label": "Front Delt"
      }
    ],
    "sets": "3",
    "reps": "8-10",
    "rir": "1-2",
    "pillVariant": null,
    "setDots": [
      {
        "idx": "1",
        "label": "1"
      },
      {
        "idx": "2",
        "label": "2"
      },
      {
        "idx": "3",
        "label": "3"
      }
    ],
    "blocks": [
      {
        "heading": "Execution Cues",
        "items": [
          {
            "kind": "text",
            "html": "Your opening compound, worked across a normal 3-set spread rather than a single peak set. Full 3-second negative to a light chest touch, then drive back explosively. The flat angle keeps this squarely biased toward the mid/lower pec."
          },
          {
            "kind": "intensity",
            "level": "rir2",
            "html": "Intensity: 1-2 RIR"
          }
        ]
      },
      {
        "heading": "Muscle Activation",
        "items": [
          {
            "kind": "activation",
            "rows": [
              {
                "label": "Mid/Lower Chest",
                "tone": "chest",
                "pct": 93,
                "scale": "0.93",
                "filter": null
              },
              {
                "label": "Front Delt",
                "tone": "delt",
                "pct": 60,
                "scale": "0.6",
                "filter": null
              },
              {
                "label": "Triceps",
                "tone": "tri",
                "pct": 56,
                "scale": "0.56",
                "filter": null
              }
            ]
          },
          {
            "kind": "sourceNote",
            "html": "EMG work comparing bench angles found the sternocostal (mid/lower) pectoralis fires hardest at 0° flat, while the clavicular (upper) head and anterior deltoid peak at steeper angles."
          }
        ]
      }
    ]
  },
  {
    "key": "push-b2",
    "number": 2,
    "name": "Incline Dumbbell Press",
    "nameSuffix": {
      "text": "— Peak Intensity",
      "tone": "danger"
    },
    "tags": [
      {
        "tone": "chest",
        "label": "Upper Chest"
      },
      {
        "tone": "delt",
        "label": "Front Delt"
      }
    ],
    "sets": "1",
    "reps": "To Fail",
    "rir": "FAILURE",
    "pillVariant": "danger",
    "setDots": [
      {
        "idx": "1",
        "label": "1"
      }
    ],
    "blocks": [
      {
        "heading": "Execution Cues",
        "items": [
          {
            "kind": "text",
            "html": "<strong>The peak-intensity slot flips to the dumbbell incline on Day B.</strong> Pick a weight you can control for roughly 8-12 reps, then push every rep to true failure — the point where your last rep stalls mid-range no matter how hard you try. The extra stretch under the dumbbells makes this a genuinely different stimulus from Day A's flat-bench peak set."
          },
          {
            "kind": "intensity",
            "level": "failure",
            "html": "Intensity: Absolute Failure — 0 RIR"
          }
        ]
      },
      {
        "heading": "Muscle Activation",
        "items": [
          {
            "kind": "activation",
            "rows": [
              {
                "label": "Upper Chest",
                "tone": "chest",
                "pct": 90,
                "scale": "0.9",
                "filter": null
              },
              {
                "label": "Front Delt",
                "tone": "delt",
                "pct": 75,
                "scale": "0.75",
                "filter": null
              },
              {
                "label": "Triceps",
                "tone": "tri",
                "pct": 52,
                "scale": "0.52",
                "filter": null
              }
            ]
          },
          {
            "kind": "sourceNote",
            "html": "Taking a free-weight press to genuine muscular failure recruits the highest-threshold motor units in the upper chest that sub-maximal sets often leave untouched."
          }
        ]
      }
    ]
  },
  {
    "key": "push-b3",
    "number": 3,
    "name": "Seated Cable Incline Press",
    "nameSuffix": null,
    "tags": [
      {
        "tone": "chest",
        "label": "Upper Chest"
      },
      {
        "tone": "delt",
        "label": "Front Delt"
      }
    ],
    "sets": "2",
    "reps": "8-10",
    "rir": "1-2",
    "pillVariant": null,
    "setDots": [
      {
        "idx": "1",
        "label": "1"
      },
      {
        "idx": "2",
        "label": "2"
      }
    ],
    "blocks": [
      {
        "heading": "Execution Cues",
        "items": [
          {
            "kind": "text",
            "html": "Same movement as Day A's opener, now dropped to a shorter 2-set top-up after two heavier compounds. Keep the same setup and bar path — handles start at upper-chest height, drive up and slightly back, reset immediately at the top."
          },
          {
            "kind": "intensity",
            "level": "rir2",
            "html": "Intensity: 1-2 RIR"
          }
        ]
      },
      {
        "heading": "Muscle Activation",
        "items": [
          {
            "kind": "activation",
            "rows": [
              {
                "label": "Upper Chest",
                "tone": "chest",
                "pct": 80,
                "scale": "0.8",
                "filter": null
              },
              {
                "label": "Front Delt",
                "tone": "delt",
                "pct": 72,
                "scale": "0.72",
                "filter": null
              },
              {
                "label": "Triceps",
                "tone": "tri",
                "pct": 46,
                "scale": "0.46",
                "filter": null
              }
            ]
          },
          {
            "kind": "sourceNote",
            "html": "Illustrative % of MVIC, directionally consistent with incline-press EMG literature."
          }
        ]
      }
    ]
  },
  {
    "key": "push-b4",
    "number": 4,
    "name": "Adjustable Cable Crossovers",
    "nameSuffix": {
      "text": "(Fly Movement)",
      "tone": "muted"
    },
    "tags": [
      {
        "tone": "chest",
        "label": "Chest (Isolation)"
      }
    ],
    "sets": "3",
    "reps": "12-15",
    "rir": "1-2",
    "pillVariant": null,
    "setDots": [
      {
        "idx": "1",
        "label": "1"
      },
      {
        "idx": "2",
        "label": "2"
      },
      {
        "idx": "3",
        "label": "3"
      }
    ],
    "blocks": [
      {
        "heading": "Execution Cues",
        "items": [
          {
            "kind": "text",
            "html": "Run the pulleys from a slightly higher position than Day A's fly for a low-to-high crossing path, meeting your hands in front of your hips. This angle emphasizes the lower/outer pec fibers differently than the flat cable fly, rounding out the week's chest stimulus at a higher rep range."
          },
          {
            "kind": "intensity",
            "level": "rir2",
            "html": "Intensity: 1-2 RIR"
          }
        ]
      },
      {
        "heading": "Muscle Activation",
        "items": [
          {
            "kind": "activation",
            "rows": [
              {
                "label": "Chest (Lower/Outer)",
                "tone": "chest",
                "pct": 90,
                "scale": "0.9",
                "filter": null
              },
              {
                "label": "Front Delt",
                "tone": "delt",
                "pct": 32,
                "scale": "0.32",
                "filter": null
              }
            ]
          },
          {
            "kind": "sourceNote",
            "html": "Adjustable-pulley crossovers let you angle the resistance vector to match whichever pec fibers you're targeting, which a fixed-height fly machine can't replicate."
          }
        ]
      }
    ]
  },
  {
    "key": "push-b5",
    "number": 5,
    "name": "Cable Lateral Raises",
    "nameSuffix": null,
    "tags": [
      {
        "tone": "delt",
        "label": "Side Delt"
      }
    ],
    "sets": "3",
    "reps": "10-12",
    "rir": "1-2",
    "pillVariant": null,
    "setDots": [
      {
        "idx": "1",
        "label": "1"
      },
      {
        "idx": "2",
        "label": "2"
      },
      {
        "idx": "3",
        "label": "3"
      }
    ],
    "blocks": [
      {
        "heading": "Execution Cues",
        "items": [
          {
            "kind": "text",
            "html": "A standard straight-on cable raise this time, cable positioned at the low pulley in front of you. Lead with the elbow, raise to roughly shoulder height, and control the negative rather than letting the cable snap your arm back down."
          },
          {
            "kind": "intensity",
            "level": "rir2",
            "html": "Intensity: 1-2 RIR"
          }
        ]
      },
      {
        "heading": "Muscle Activation",
        "items": [
          {
            "kind": "activation",
            "rows": [
              {
                "label": "Side Delt",
                "tone": "delt",
                "pct": 87,
                "scale": "0.87",
                "filter": null
              },
              {
                "label": "Front Delt",
                "tone": "delt",
                "pct": 30,
                "scale": "0.3",
                "filter": "hue-rotate(15deg)"
              }
            ]
          },
          {
            "kind": "sourceNote",
            "html": "Cable lateral raises maintain resistance in the bottom half of the rep that dumbbells lose to gravity, keeping the side delt loaded through a longer portion of its strength curve."
          }
        ]
      }
    ]
  },
  {
    "key": "push-b6",
    "number": 6,
    "name": "Triceps: Crossbody Cable Extensions",
    "nameSuffix": {
      "text": "(Lateral/Medial Head)",
      "tone": "muted"
    },
    "tags": [
      {
        "tone": "tri",
        "label": "Triceps — Lateral/Medial"
      }
    ],
    "sets": "3",
    "reps": "10-12",
    "rir": "0-1",
    "pillVariant": null,
    "setDots": [
      {
        "idx": "1",
        "label": "1"
      },
      {
        "idx": "2",
        "label": "2"
      },
      {
        "idx": "3",
        "label": "3"
      }
    ],
    "blocks": [
      {
        "heading": "Execution Cues",
        "items": [
          {
            "kind": "text",
            "html": "Cable set at the high pulley, pull down and across your body in a single-arm arc, finishing with the hand near the opposite hip. The diagonal path hits the lateral and medial heads from a different angle than a straight pushdown, while your elbow stays pinned tight to your ribs."
          },
          {
            "kind": "intensity",
            "level": "rir1",
            "html": "Intensity: 0-1 RIR"
          }
        ]
      },
      {
        "heading": "Muscle Activation",
        "items": [
          {
            "kind": "activation",
            "rows": [
              {
                "label": "Lateral Head",
                "tone": "tri",
                "pct": 85,
                "scale": "0.85",
                "filter": null
              },
              {
                "label": "Medial Head",
                "tone": "tri",
                "pct": 78,
                "scale": "0.78",
                "filter": "hue-rotate(15deg)"
              },
              {
                "label": "Long Head",
                "tone": "tri",
                "pct": 40,
                "scale": "0.4",
                "filter": "hue-rotate(-15deg)"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "key": "push-b7",
    "number": 7,
    "name": "Triceps: Overhead Rope Extensions",
    "nameSuffix": {
      "text": "(Long Head Stretch)",
      "tone": "muted"
    },
    "tags": [
      {
        "tone": "tri",
        "label": "Triceps — Long Head"
      }
    ],
    "sets": "3",
    "reps": "10-12",
    "rir": "0-1",
    "pillVariant": null,
    "setDots": [
      {
        "idx": "1",
        "label": "1"
      },
      {
        "idx": "2",
        "label": "2"
      },
      {
        "idx": "3",
        "label": "3"
      }
    ],
    "blocks": [
      {
        "heading": "Execution Cues",
        "items": [
          {
            "kind": "text",
            "html": "Kneel or stand facing away from a low pulley with a rope attachment, elbows pointed forward overhead. Lower behind your head into a deep stretch, then extend forward and slightly apart at the top for a peak squeeze. Same long-head-stretch principle as Day A's overhead extension, different equipment and angle."
          },
          {
            "kind": "intensity",
            "level": "rir1",
            "html": "Intensity: 0-1 RIR"
          }
        ]
      },
      {
        "heading": "Muscle Activation",
        "items": [
          {
            "kind": "activation",
            "rows": [
              {
                "label": "Long Head",
                "tone": "tri",
                "pct": 90,
                "scale": "0.9",
                "filter": null
              },
              {
                "label": "Medial Head",
                "tone": "tri",
                "pct": 58,
                "scale": "0.58",
                "filter": "hue-rotate(15deg)"
              },
              {
                "label": "Lateral Head",
                "tone": "tri",
                "pct": 50,
                "scale": "0.5",
                "filter": "hue-rotate(-15deg)"
              }
            ]
          },
          {
            "kind": "sourceNote",
            "html": "A 12-week controlled trial found overhead-position triceps training produced 28.5% long-head muscle growth versus 19.6% for the same exercise performed with the arm neutral at the side."
          },
          {
            "kind": "cite",
            "html": "Maeo et al. (2022), Eur J Sport Sci 23(7)"
          }
        ]
      }
    ]
  },
  {
    "key": "push-b8",
    "number": 8,
    "name": "Core: Hanging Leg Raises",
    "nameSuffix": {
      "text": "(Lower Bias)",
      "tone": "muted"
    },
    "tags": [
      {
        "tone": "core",
        "label": "Rectus Abdominis"
      }
    ],
    "sets": "3",
    "reps": "10-20",
    "rir": "1-2",
    "pillVariant": null,
    "setDots": [
      {
        "idx": "1",
        "label": "1"
      },
      {
        "idx": "2",
        "label": "2"
      },
      {
        "idx": "3",
        "label": "3"
      }
    ],
    "blocks": [
      {
        "heading": "Execution Cues",
        "items": [
          {
            "kind": "text",
            "html": "Hang from a bar or straps and curl your pelvis up toward your ribs rather than just swinging your legs — the posterior pelvic tilt at the top is what actually loads the lower abs. Lower under control; don't let momentum do the work on the way down."
          },
          {
            "kind": "intensity",
            "level": "rir2",
            "html": "Intensity: 1-2 RIR"
          }
        ]
      },
      {
        "heading": "Muscle Activation",
        "items": [
          {
            "kind": "activation",
            "rows": [
              {
                "label": "Rectus Abd. (Lower)",
                "tone": "core",
                "pct": 88,
                "scale": "0.88",
                "filter": null
              },
              {
                "label": "Hip Flexors",
                "tone": "core",
                "pct": 45,
                "scale": "0.45",
                "filter": "hue-rotate(-15deg)"
              },
              {
                "label": "Obliques",
                "tone": "core",
                "pct": 30,
                "scale": "0.3",
                "filter": "hue-rotate(15deg)"
              }
            ]
          },
          {
            "kind": "sourceNote",
            "html": "Pairing an upper-bias loaded crunch on Day A with a lower-bias hanging raise on Day B trains the rectus abdominis across both ends of its length in the same week."
          }
        ]
      }
    ]
  },
  {
    "key": "pull-a1",
    "number": 1,
    "name": "Lat Pulldown Superset",
    "nameSuffix": {
      "text": "(Pre-Exhaust & Burnout)",
      "tone": "muted"
    },
    "tags": [
      {
        "tone": "lat",
        "label": "Lats"
      },
      {
        "tone": "bicep",
        "label": "Biceps"
      }
    ],
    "sets": "3+1",
    "reps": "8-10/Fail",
    "rir": "1-2→0",
    "pillVariant": "danger",
    "setDots": [
      {
        "idx": "1",
        "label": "1"
      },
      {
        "idx": "2",
        "label": "2"
      },
      {
        "idx": "3",
        "label": "3"
      },
      {
        "idx": "4",
        "label": "4"
      }
    ],
    "blocks": [
      {
        "heading": "Execution Cues",
        "items": [
          {
            "kind": "subLabel",
            "html": "1A — Wide-Grip Lat Pulldown"
          },
          {
            "kind": "text",
            "html": "Your opening compound. Drive your elbows straight down into your pockets, keep your torso still, and take the full 3-second negative back up to a dead-hang stretch before reversing."
          },
          {
            "kind": "intensity",
            "level": "rir2",
            "html": "Intensity: 1-2 RIR"
          },
          {
            "kind": "divider",
            "html": "No Rest — Drop &amp; Burn"
          },
          {
            "kind": "subLabel",
            "html": "1B — Close-Grip Burnout"
          },
          {
            "kind": "text",
            "html": "Immediately drop the pin and switch to a close, neutral grip. Pull until the bar physically cannot reach your chin with good form — a genuine failure set layered onto pre-fatigued lats."
          },
          {
            "kind": "intensity",
            "level": "failure",
            "html": "Intensity: Absolute Failure — 0 RIR"
          }
        ]
      },
      {
        "heading": "Muscle Activation — 1A Wide-Grip",
        "items": [
          {
            "kind": "activation",
            "rows": [
              {
                "label": "Lats",
                "tone": "lat",
                "pct": 88,
                "scale": "0.88",
                "filter": null
              },
              {
                "label": "Biceps",
                "tone": "bicep",
                "pct": 55,
                "scale": "0.55",
                "filter": null
              },
              {
                "label": "Mid-Back/Traps",
                "tone": "midback",
                "pct": 42,
                "scale": "0.42",
                "filter": null
              }
            ]
          },
          {
            "kind": "sourceNote",
            "html": "On the burnout set (1B), biceps involvement rises to roughly 68% as the close, fatigued grip shifts more of the pull onto the elbow flexors. Values are illustrative % of MVIC, directionally consistent with pulldown EMG literature."
          },
          {
            "kind": "cite",
            "html": "Andersen, Fimland, Wiik, Skoglund &amp; Sæterbakken (2014), J Strength Cond Res 28(4)"
          }
        ]
      }
    ]
  },
  {
    "key": "pull-a2",
    "number": 2,
    "name": "Seated Cable Lat Rows",
    "nameSuffix": {
      "text": "(Horizontal Pull)",
      "tone": "muted"
    },
    "tags": [
      {
        "tone": "midback",
        "label": "Mid-Back"
      },
      {
        "tone": "lat",
        "label": "Lats"
      }
    ],
    "sets": "3",
    "reps": "8-10",
    "rir": "1",
    "pillVariant": null,
    "setDots": [
      {
        "idx": "1",
        "label": "1"
      },
      {
        "idx": "2",
        "label": "2"
      },
      {
        "idx": "3",
        "label": "3"
      }
    ],
    "blocks": [
      {
        "heading": "Execution Cues",
        "items": [
          {
            "kind": "text",
            "html": "Seated, chest tall, cable at a low, straight pull. Drive your elbows back past your torso and squeeze the shoulder blades together at the finish rather than just moving the handle — the horizontal line of pull hits the mid-back hardest of anything in the session."
          },
          {
            "kind": "intensity",
            "level": "rir1",
            "html": "Intensity: 1 RIR"
          }
        ]
      },
      {
        "heading": "Muscle Activation",
        "items": [
          {
            "kind": "activation",
            "rows": [
              {
                "label": "Mid-Back/Rhomboid",
                "tone": "midback",
                "pct": 88,
                "scale": "0.88",
                "filter": null
              },
              {
                "label": "Lats",
                "tone": "lat",
                "pct": 60,
                "scale": "0.6",
                "filter": null
              },
              {
                "label": "Biceps",
                "tone": "bicep",
                "pct": 45,
                "scale": "0.45",
                "filter": null
              }
            ]
          },
          {
            "kind": "sourceNote",
            "html": "A seated, torso-fixed row position removes the lower-back involvement of a bent-over free-weight row, isolating the shoulder-blade retraction that drives mid-back thickness."
          }
        ]
      }
    ]
  },
  {
    "key": "pull-a3",
    "number": 3,
    "name": "Seated Cable Flexion Rows",
    "nameSuffix": {
      "text": "(Mid-Back Focus)",
      "tone": "muted"
    },
    "tags": [
      {
        "tone": "midback",
        "label": "Mid-Back"
      }
    ],
    "sets": "3",
    "reps": "10-12",
    "rir": "1-2",
    "pillVariant": null,
    "setDots": [
      {
        "idx": "1",
        "label": "1"
      },
      {
        "idx": "2",
        "label": "2"
      },
      {
        "idx": "3",
        "label": "3"
      }
    ],
    "blocks": [
      {
        "heading": "Execution Cues",
        "items": [
          {
            "kind": "text",
            "html": "A slightly higher-rep, slightly lighter continuation of the rowing pattern — let the shoulder blades protract fully at the stretch before pulling into a hard scapular squeeze. Think about flexing the mid-back muscles themselves rather than just bending the elbow."
          },
          {
            "kind": "intensity",
            "level": "rir2",
            "html": "Intensity: 1-2 RIR"
          }
        ]
      },
      {
        "heading": "Muscle Activation",
        "items": [
          {
            "kind": "activation",
            "rows": [
              {
                "label": "Mid-Back/Rhomboid",
                "tone": "midback",
                "pct": 90,
                "scale": "0.9",
                "filter": null
              },
              {
                "label": "Lats",
                "tone": "lat",
                "pct": 48,
                "scale": "0.48",
                "filter": null
              }
            ]
          },
          {
            "kind": "sourceNote",
            "html": "Stacking a second rowing angle back-to-back with the first extends mid-back time-under-tension without adding meaningful load to already-fatigued lats."
          }
        ]
      }
    ]
  },
  {
    "key": "pull-a4",
    "number": 4,
    "name": "Unilateral Plate-Loaded Sagittal Row",
    "nameSuffix": {
      "text": "— Peak Intensity",
      "tone": "danger"
    },
    "tags": [
      {
        "tone": "midback",
        "label": "Mid-Back"
      },
      {
        "tone": "lat",
        "label": "Lats"
      }
    ],
    "sets": "1/arm",
    "reps": "To Fail",
    "rir": "FAILURE",
    "pillVariant": "danger",
    "setDots": [
      {
        "idx": "1",
        "label": "L"
      },
      {
        "idx": "2",
        "label": "R"
      }
    ],
    "blocks": [
      {
        "heading": "Execution Cues",
        "items": [
          {
            "kind": "text",
            "html": "<strong>One all-out set per arm — this session's peak-intensity slot.</strong> Brace against the pad, pull straight back along the sagittal plane rather than out to the side, and drive the working-side elbow as far behind your torso as you can. Complete the right arm to failure, rest briefly, then the left. The unilateral load lets you focus 100% of your effort on one side of the back at a time."
          },
          {
            "kind": "intensity",
            "level": "failure",
            "html": "Intensity: Absolute Failure — 0 RIR, each arm"
          }
        ]
      },
      {
        "heading": "Muscle Activation",
        "items": [
          {
            "kind": "activation",
            "rows": [
              {
                "label": "Mid-Back/Rhomboid",
                "tone": "midback",
                "pct": 92,
                "scale": "0.92",
                "filter": null
              },
              {
                "label": "Lats",
                "tone": "lat",
                "pct": 65,
                "scale": "0.65",
                "filter": null
              },
              {
                "label": "Biceps",
                "tone": "bicep",
                "pct": 48,
                "scale": "0.48",
                "filter": null
              }
            ]
          },
          {
            "kind": "sourceNote",
            "html": "Unilateral rowing removes the stronger side's ability to compensate for the weaker one, closing left-right strength and size imbalances faster than any bilateral row can."
          }
        ]
      }
    ]
  },
  {
    "key": "pull-a5",
    "number": 5,
    "name": "Reverse Cable Crossovers",
    "nameSuffix": {
      "text": "(Rear Delts)",
      "tone": "muted"
    },
    "tags": [
      {
        "tone": "reardelt",
        "label": "Rear Delt"
      }
    ],
    "sets": "3",
    "reps": "12-15",
    "rir": "1-2",
    "pillVariant": null,
    "setDots": [
      {
        "idx": "1",
        "label": "1"
      },
      {
        "idx": "2",
        "label": "2"
      },
      {
        "idx": "3",
        "label": "3"
      }
    ],
    "blocks": [
      {
        "heading": "Execution Cues",
        "items": [
          {
            "kind": "text",
            "html": "Cross the cables in front of you at chest height, then pull them apart and back in a wide arc, squeezing the shoulder blades only slightly — this should feel like the rear delts, not another back exercise. Keep a soft bend in the elbows throughout."
          },
          {
            "kind": "intensity",
            "level": "rir2",
            "html": "Intensity: 1-2 RIR"
          }
        ]
      },
      {
        "heading": "Muscle Activation",
        "items": [
          {
            "kind": "activation",
            "rows": [
              {
                "label": "Rear Delt",
                "tone": "reardelt",
                "pct": 91,
                "scale": "0.91",
                "filter": null
              },
              {
                "label": "Mid-Back/Traps",
                "tone": "midback",
                "pct": 32,
                "scale": "0.32",
                "filter": null
              }
            ]
          },
          {
            "kind": "sourceNote",
            "html": "Crossing the cables keeps constant tension on the posterior deltoid across the whole arc, matching its horizontal-abduction strength curve far more closely than a dumbbell rear-delt fly."
          },
          {
            "kind": "cite",
            "html": "Signorile, Zink &amp; Szwed (2002), J Strength Cond Res 16(4)"
          }
        ]
      }
    ]
  },
  {
    "key": "pull-a6",
    "number": 6,
    "name": "Heavy Dumbbell Shrugs",
    "nameSuffix": {
      "text": "(Upper Traps)",
      "tone": "muted"
    },
    "tags": [
      {
        "tone": "trap",
        "label": "Upper Traps"
      }
    ],
    "sets": "3",
    "reps": "10-12",
    "rir": "1-2",
    "pillVariant": null,
    "setDots": [
      {
        "idx": "1",
        "label": "1"
      },
      {
        "idx": "2",
        "label": "2"
      },
      {
        "idx": "3",
        "label": "3"
      }
    ],
    "blocks": [
      {
        "heading": "Execution Cues",
        "items": [
          {
            "kind": "text",
            "html": "Shrugs now live on pull day, right after the rowing block where the traps are already warm. Let the dumbbells pull your shoulders down into a full stretch between reps, then shrug straight up toward your ears — no rolling. Go heavy; traps respond well to load."
          },
          {
            "kind": "intensity",
            "level": "rir2",
            "html": "Intensity: 1-2 RIR"
          }
        ]
      },
      {
        "heading": "Muscle Activation",
        "items": [
          {
            "kind": "activation",
            "rows": [
              {
                "label": "Upper Traps",
                "tone": "trap",
                "pct": 93,
                "scale": "0.93",
                "filter": null
              },
              {
                "label": "Mid-Back",
                "tone": "midback",
                "pct": 25,
                "scale": "0.25",
                "filter": null
              }
            ]
          },
          {
            "kind": "sourceNote",
            "html": "A full stretch-to-shrug range of motion at the top of every rep drives more upper-trap growth than a short, partial-range shrug at heavier loads."
          }
        ]
      }
    ]
  },
  {
    "key": "pull-a7",
    "number": 7,
    "name": "Face-Away Bayesian Cable Curls",
    "nameSuffix": {
      "text": "(S-Tier Stretch)",
      "tone": "muted"
    },
    "tags": [
      {
        "tone": "bicep",
        "label": "Biceps"
      }
    ],
    "sets": "3",
    "reps": "10-12",
    "rir": "1-2",
    "pillVariant": null,
    "setDots": [
      {
        "idx": "1",
        "label": "1"
      },
      {
        "idx": "2",
        "label": "2"
      },
      {
        "idx": "3",
        "label": "3"
      }
    ],
    "blocks": [
      {
        "heading": "Execution Cues",
        "items": [
          {
            "kind": "text",
            "html": "Stand facing away from the low cable pulley. The line of pull drags your arm behind your torso, placing the long head of the biceps under a far deeper stretch than any curl performed in front of your body."
          },
          {
            "kind": "intensity",
            "level": "rir2",
            "html": "Intensity: 1-2 RIR"
          }
        ]
      },
      {
        "heading": "Muscle Activation",
        "items": [
          {
            "kind": "activation",
            "rows": [
              {
                "label": "Biceps (Long Head)",
                "tone": "bicep",
                "pct": 89,
                "scale": "0.89",
                "filter": null
              },
              {
                "label": "Brachialis",
                "tone": "bicep",
                "pct": 42,
                "scale": "0.42",
                "filter": "hue-rotate(15deg)"
              },
              {
                "label": "Forearm Flexors",
                "tone": "forearm",
                "pct": 30,
                "scale": "0.3",
                "filter": null
              }
            ]
          },
          {
            "kind": "sourceNote",
            "html": "A direct EMG comparison of traditional dumbbell curls versus this behind-the-body \"Bayesian\" cable position — the shoulder extension it forces places the long head at a longer muscle length through the entire range."
          },
          {
            "kind": "cite",
            "html": "Exploratory EMG Study, Bayesian vs. Dumbbell Curls (2025); Oliveira et al. (2009), J Sports Sci Med 8(1)"
          }
        ]
      }
    ]
  },
  {
    "key": "pull-a8",
    "number": 8,
    "name": "EZ-Bar Preacher Curls",
    "nameSuffix": {
      "text": "(S-Tier Peak & Isolation)",
      "tone": "muted"
    },
    "tags": [
      {
        "tone": "bicep",
        "label": "Biceps"
      }
    ],
    "sets": "3",
    "reps": "10-12",
    "rir": "0-1",
    "pillVariant": null,
    "setDots": [
      {
        "idx": "1",
        "label": "1"
      },
      {
        "idx": "2",
        "label": "2"
      },
      {
        "idx": "3",
        "label": "3"
      }
    ],
    "blocks": [
      {
        "heading": "Execution Cues",
        "items": [
          {
            "kind": "text",
            "html": "The preacher pad locks your upper arm in place, removing any shoulder swing or cheating. An EZ-bar's angled grip is easier on the wrists than straight bar while still letting you load up for a genuine peak-contraction squeeze at the top of every rep."
          },
          {
            "kind": "intensity",
            "level": "rir1",
            "html": "Intensity: 0-1 RIR"
          }
        ]
      },
      {
        "heading": "Muscle Activation",
        "items": [
          {
            "kind": "activation",
            "rows": [
              {
                "label": "Biceps (Short Head)",
                "tone": "bicep",
                "pct": 90,
                "scale": "0.9",
                "filter": null
              },
              {
                "label": "Brachialis",
                "tone": "forearm",
                "pct": 55,
                "scale": "0.55",
                "filter": null
              },
              {
                "label": "Forearm Flexors",
                "tone": "forearm",
                "pct": 32,
                "scale": "0.32",
                "filter": "hue-rotate(-15deg)"
              }
            ]
          },
          {
            "kind": "sourceNote",
            "html": "The preacher's fixed, forward-flexed shoulder position places the biceps at a shorter length, shifting a larger share of the work onto the short head compared to an incline or behind-body curl."
          }
        ]
      }
    ]
  },
  {
    "key": "pull-b1",
    "number": 1,
    "name": "Wide-Grip Cable Pulldowns",
    "nameSuffix": {
      "text": "(or Assisted Pull-ups)",
      "tone": "muted"
    },
    "tags": [
      {
        "tone": "lat",
        "label": "Lats"
      },
      {
        "tone": "bicep",
        "label": "Biceps"
      }
    ],
    "sets": "3",
    "reps": "8-10",
    "rir": "1-2",
    "pillVariant": null,
    "setDots": [
      {
        "idx": "1",
        "label": "1"
      },
      {
        "idx": "2",
        "label": "2"
      },
      {
        "idx": "3",
        "label": "3"
      }
    ],
    "blocks": [
      {
        "heading": "Execution Cues",
        "items": [
          {
            "kind": "text",
            "html": "No pre-exhaust superset this time — straight into a clean 3-set opener at full rest between sets. A wide, pronated grip biases the lats over the biceps compared to a neutral or close grip. If your gym has an assisted pull-up station, it's a fine bodyweight-pattern substitute at the same intensity."
          },
          {
            "kind": "intensity",
            "level": "rir2",
            "html": "Intensity: 1-2 RIR"
          }
        ]
      },
      {
        "heading": "Muscle Activation",
        "items": [
          {
            "kind": "activation",
            "rows": [
              {
                "label": "Lats",
                "tone": "lat",
                "pct": 90,
                "scale": "0.9",
                "filter": null
              },
              {
                "label": "Biceps",
                "tone": "bicep",
                "pct": 48,
                "scale": "0.48",
                "filter": null
              },
              {
                "label": "Mid-Back/Traps",
                "tone": "midback",
                "pct": 40,
                "scale": "0.4",
                "filter": null
              }
            ]
          },
          {
            "kind": "sourceNote",
            "html": "A wide grip lengthens the moment arm at the shoulder joint, shifting more of the pull onto the lats and less onto the elbow flexors than a close or neutral grip."
          },
          {
            "kind": "cite",
            "html": "Andersen, Fimland, Wiik, Skoglund &amp; Sæterbakken (2014), J Strength Cond Res 28(4)"
          }
        ]
      }
    ]
  },
  {
    "key": "pull-b2",
    "number": 2,
    "name": "Seated Cable Flexion Rows",
    "nameSuffix": {
      "text": "(Mid-Back Builder)",
      "tone": "muted"
    },
    "tags": [
      {
        "tone": "midback",
        "label": "Mid-Back"
      }
    ],
    "sets": "3",
    "reps": "10-12",
    "rir": "1-2",
    "pillVariant": null,
    "setDots": [
      {
        "idx": "1",
        "label": "1"
      },
      {
        "idx": "2",
        "label": "2"
      },
      {
        "idx": "3",
        "label": "3"
      }
    ],
    "blocks": [
      {
        "heading": "Execution Cues",
        "items": [
          {
            "kind": "text",
            "html": "Same pattern as Day A's mid-back row — let the shoulder blades protract fully at the stretch before pulling into a hard scapular squeeze. This is your main mid-back builder for the day, so keep the tempo controlled rather than rushing through reps."
          },
          {
            "kind": "intensity",
            "level": "rir2",
            "html": "Intensity: 1-2 RIR"
          }
        ]
      },
      {
        "heading": "Muscle Activation",
        "items": [
          {
            "kind": "activation",
            "rows": [
              {
                "label": "Mid-Back/Rhomboid",
                "tone": "midback",
                "pct": 90,
                "scale": "0.9",
                "filter": null
              },
              {
                "label": "Lats",
                "tone": "lat",
                "pct": 48,
                "scale": "0.48",
                "filter": null
              }
            ]
          },
          {
            "kind": "sourceNote",
            "html": "A controlled scapular-retraction row builds mid-back thickness through range of motion rather than raw load, so resist the urge to swing the weight."
          }
        ]
      }
    ]
  },
  {
    "key": "pull-b3",
    "number": 3,
    "name": "Seated Close-Grip Cable Rows",
    "nameSuffix": null,
    "tags": [
      {
        "tone": "midback",
        "label": "Mid-Back"
      },
      {
        "tone": "lat",
        "label": "Lats"
      }
    ],
    "sets": "3",
    "reps": "10-12",
    "rir": "1-2",
    "pillVariant": null,
    "setDots": [
      {
        "idx": "1",
        "label": "1"
      },
      {
        "idx": "2",
        "label": "2"
      },
      {
        "idx": "3",
        "label": "3"
      }
    ],
    "blocks": [
      {
        "heading": "Execution Cues",
        "items": [
          {
            "kind": "text",
            "html": "Switch to a close, neutral-grip V-bar handle. The tighter grip lets your elbows travel further back past your torso than a wide handle allows, pulling more of the lats into the finish alongside the mid-back."
          },
          {
            "kind": "intensity",
            "level": "rir2",
            "html": "Intensity: 1-2 RIR"
          }
        ]
      },
      {
        "heading": "Muscle Activation",
        "items": [
          {
            "kind": "activation",
            "rows": [
              {
                "label": "Mid-Back/Rhomboid",
                "tone": "midback",
                "pct": 85,
                "scale": "0.85",
                "filter": null
              },
              {
                "label": "Lats",
                "tone": "lat",
                "pct": 65,
                "scale": "0.65",
                "filter": null
              },
              {
                "label": "Biceps",
                "tone": "bicep",
                "pct": 50,
                "scale": "0.5",
                "filter": null
              }
            ]
          },
          {
            "kind": "sourceNote",
            "html": "Close-grip variations allow a longer elbow path behind the torso than wide-grip handles, adding lat recruitment on top of the mid-back-dominant pull."
          }
        ]
      }
    ]
  },
  {
    "key": "pull-b4",
    "number": 4,
    "name": "Straight-Arm Cable Pullovers",
    "nameSuffix": {
      "text": "(Lat Isolation)",
      "tone": "muted"
    },
    "tags": [
      {
        "tone": "lat",
        "label": "Lats (Isolation)"
      }
    ],
    "sets": "3",
    "reps": "12-15",
    "rir": "1-2",
    "pillVariant": null,
    "setDots": [
      {
        "idx": "1",
        "label": "1"
      },
      {
        "idx": "2",
        "label": "2"
      },
      {
        "idx": "3",
        "label": "3"
      }
    ],
    "blocks": [
      {
        "heading": "Execution Cues",
        "items": [
          {
            "kind": "text",
            "html": "High pulley, straight arms, hinge slightly at the hips. Pull the bar in an arc from overhead down to your thighs using only shoulder extension — keep the elbows locked so the biceps can't sneak into the movement. This is the one pure lat-isolation lift in the whole program."
          },
          {
            "kind": "intensity",
            "level": "rir2",
            "html": "Intensity: 1-2 RIR"
          }
        ]
      },
      {
        "heading": "Muscle Activation",
        "items": [
          {
            "kind": "activation",
            "rows": [
              {
                "label": "Lats",
                "tone": "lat",
                "pct": 88,
                "scale": "0.88",
                "filter": null
              },
              {
                "label": "Chest (Lower)",
                "tone": "chest",
                "pct": 22,
                "scale": "0.22",
                "filter": null
              }
            ]
          },
          {
            "kind": "sourceNote",
            "html": "Keeping the elbow joint fixed removes the biceps almost entirely, isolating shoulder extension — the lats' primary function — without the grip or elbow fatigue every other pulling movement in the program carries."
          }
        ]
      }
    ]
  },
  {
    "key": "pull-b5",
    "number": 5,
    "name": "Reverse Cable Crossovers",
    "nameSuffix": {
      "text": "(Rear Delts)",
      "tone": "muted"
    },
    "tags": [
      {
        "tone": "reardelt",
        "label": "Rear Delt"
      }
    ],
    "sets": "3",
    "reps": "15-20",
    "rir": "1-2",
    "pillVariant": null,
    "setDots": [
      {
        "idx": "1",
        "label": "1"
      },
      {
        "idx": "2",
        "label": "2"
      },
      {
        "idx": "3",
        "label": "3"
      }
    ],
    "blocks": [
      {
        "heading": "Execution Cues",
        "items": [
          {
            "kind": "text",
            "html": "Same crossover pattern as Day A, pushed to a higher 15-20 rep range this time. Go lighter than Day A and focus purely on feeling the rear delts burn out — this is a metabolite-focused finisher for the posterior shoulder, not a strength set."
          },
          {
            "kind": "intensity",
            "level": "rir2",
            "html": "Intensity: 1-2 RIR"
          }
        ]
      },
      {
        "heading": "Muscle Activation",
        "items": [
          {
            "kind": "activation",
            "rows": [
              {
                "label": "Rear Delt",
                "tone": "reardelt",
                "pct": 91,
                "scale": "0.91",
                "filter": null
              },
              {
                "label": "Mid-Back/Traps",
                "tone": "midback",
                "pct": 32,
                "scale": "0.32",
                "filter": null
              }
            ]
          },
          {
            "kind": "sourceNote",
            "html": "Crossing the cables keeps constant tension on the posterior deltoid across the whole arc, matching its horizontal-abduction strength curve far more closely than a dumbbell rear-delt fly."
          },
          {
            "kind": "cite",
            "html": "Signorile, Zink &amp; Szwed (2002), J Strength Cond Res 16(4)"
          }
        ]
      }
    ]
  },
  {
    "key": "pull-b6",
    "number": 6,
    "name": "Heavy Barbell Shrugs",
    "nameSuffix": {
      "text": "(Upper Traps)",
      "tone": "muted"
    },
    "tags": [
      {
        "tone": "trap",
        "label": "Upper Traps"
      }
    ],
    "sets": "3",
    "reps": "10-12",
    "rir": "1-2",
    "pillVariant": null,
    "setDots": [
      {
        "idx": "1",
        "label": "1"
      },
      {
        "idx": "2",
        "label": "2"
      },
      {
        "idx": "3",
        "label": "3"
      }
    ],
    "blocks": [
      {
        "heading": "Execution Cues",
        "items": [
          {
            "kind": "text",
            "html": "The barbell lets you load heavier than dumbbells since you're not limited by grip width against your thighs. Full stretch at the bottom, straight vertical shrug at the top, no rolling the shoulders — rolling adds joint wear without adding trap stimulus."
          },
          {
            "kind": "intensity",
            "level": "rir2",
            "html": "Intensity: 1-2 RIR"
          }
        ]
      },
      {
        "heading": "Muscle Activation",
        "items": [
          {
            "kind": "activation",
            "rows": [
              {
                "label": "Upper Traps",
                "tone": "trap",
                "pct": 95,
                "scale": "0.95",
                "filter": null
              },
              {
                "label": "Forearm Grip",
                "tone": "forearm",
                "pct": 35,
                "scale": "0.35",
                "filter": null
              }
            ]
          },
          {
            "kind": "sourceNote",
            "html": "Training extensors and heavier loading patterns like the barbell shrug directly balance the lighter, higher-rep dumbbell version from Day A — even, matched development of the traps across the week."
          }
        ]
      }
    ]
  },
  {
    "key": "pull-b7",
    "number": 7,
    "name": "Face-Away Bayesian Cable Curls",
    "nameSuffix": {
      "text": "(S-Tier Stretch)",
      "tone": "muted"
    },
    "tags": [
      {
        "tone": "bicep",
        "label": "Biceps"
      }
    ],
    "sets": "3",
    "reps": "10-12",
    "rir": "1-2",
    "pillVariant": null,
    "setDots": [
      {
        "idx": "1",
        "label": "1"
      },
      {
        "idx": "2",
        "label": "2"
      },
      {
        "idx": "3",
        "label": "3"
      }
    ],
    "blocks": [
      {
        "heading": "Execution Cues",
        "items": [
          {
            "kind": "text",
            "html": "Same movement as Day A. Stand facing away from the low cable pulley — the line of pull drags your arm behind your torso, placing the long head of the biceps under a far deeper stretch than any curl performed in front of your body."
          },
          {
            "kind": "intensity",
            "level": "rir2",
            "html": "Intensity: 1-2 RIR"
          }
        ]
      },
      {
        "heading": "Muscle Activation",
        "items": [
          {
            "kind": "activation",
            "rows": [
              {
                "label": "Biceps (Long Head)",
                "tone": "bicep",
                "pct": 89,
                "scale": "0.89",
                "filter": null
              },
              {
                "label": "Brachialis",
                "tone": "bicep",
                "pct": 42,
                "scale": "0.42",
                "filter": "hue-rotate(15deg)"
              },
              {
                "label": "Forearm Flexors",
                "tone": "forearm",
                "pct": 30,
                "scale": "0.3",
                "filter": null
              }
            ]
          },
          {
            "kind": "sourceNote",
            "html": "A direct EMG comparison of traditional dumbbell curls versus this behind-the-body \"Bayesian\" cable position — the shoulder extension it forces places the long head at a longer muscle length through the entire range."
          },
          {
            "kind": "cite",
            "html": "Exploratory EMG Study, Bayesian vs. Dumbbell Curls (2025); Oliveira et al. (2009), J Sports Sci Med 8(1)"
          }
        ]
      }
    ]
  },
  {
    "key": "pull-b8",
    "number": 8,
    "name": "Hammer-Grip Preacher Curls",
    "nameSuffix": {
      "text": "(Brachialis Width)",
      "tone": "muted"
    },
    "tags": [
      {
        "tone": "bicep",
        "label": "Biceps"
      },
      {
        "tone": "forearm",
        "label": "Brachialis"
      }
    ],
    "sets": "3",
    "reps": "10-12",
    "rir": "0-1",
    "pillVariant": null,
    "setDots": [
      {
        "idx": "1",
        "label": "1"
      },
      {
        "idx": "2",
        "label": "2"
      },
      {
        "idx": "3",
        "label": "3"
      }
    ],
    "blocks": [
      {
        "heading": "Execution Cues",
        "items": [
          {
            "kind": "text",
            "html": "The preacher pad locks your upper arm in place, removing any shoulder swing or cheating. A neutral, hammer grip shifts emphasis onto the brachialis — the muscle underneath the biceps that pushes the whole arm wider when it grows."
          },
          {
            "kind": "intensity",
            "level": "rir1",
            "html": "Intensity: 0-1 RIR"
          }
        ]
      },
      {
        "heading": "Muscle Activation",
        "items": [
          {
            "kind": "activation",
            "rows": [
              {
                "label": "Brachialis",
                "tone": "forearm",
                "pct": 87,
                "scale": "0.87",
                "filter": null
              },
              {
                "label": "Biceps (Short Head)",
                "tone": "bicep",
                "pct": 64,
                "scale": "0.64",
                "filter": null
              },
              {
                "label": "Forearm Flexors",
                "tone": "forearm",
                "pct": 35,
                "scale": "0.35",
                "filter": "hue-rotate(-15deg)"
              }
            ]
          },
          {
            "kind": "sourceNote",
            "html": "The preacher's fixed, forward-flexed shoulder position places the biceps at a shorter length and shifts a larger share of the work onto the brachialis and short head compared to an incline or behind-body curl."
          }
        ]
      }
    ]
  },
  {
    "key": "legs-a1",
    "number": 1,
    "name": "Seated Machine Shoulder Press",
    "nameSuffix": null,
    "tags": [
      {
        "tone": "delt",
        "label": "Front Delt"
      }
    ],
    "sets": "3",
    "reps": "8-10",
    "rir": "1-2",
    "pillVariant": null,
    "setDots": [
      {
        "idx": "1",
        "label": "1"
      },
      {
        "idx": "2",
        "label": "2"
      },
      {
        "idx": "3",
        "label": "3"
      }
    ],
    "blocks": [
      {
        "heading": "Execution Cues",
        "items": [
          {
            "kind": "text",
            "html": "A fresh, low-fatigue opener before the legs take over the rest of the session. The fixed path lets you push close to true failure without a spotter — drive through your palms, full 3-second negative, brief pause at the stretch."
          },
          {
            "kind": "intensity",
            "level": "rir2",
            "html": "Intensity: 1-2 RIR"
          }
        ]
      },
      {
        "heading": "Muscle Activation",
        "items": [
          {
            "kind": "activation",
            "rows": [
              {
                "label": "Front Delt",
                "tone": "delt",
                "pct": 85,
                "scale": "0.85",
                "filter": null
              },
              {
                "label": "Upper Chest",
                "tone": "chest",
                "pct": 55,
                "scale": "0.55",
                "filter": null
              },
              {
                "label": "Triceps",
                "tone": "tri",
                "pct": 50,
                "scale": "0.5",
                "filter": null
              }
            ]
          },
          {
            "kind": "sourceNote",
            "html": "Placing a shoulder-press on leg day spreads the week's pressing volume out instead of stacking every set of it onto push day, giving the delts two separate stimuli days apart."
          }
        ]
      }
    ]
  },
  {
    "key": "legs-a2",
    "number": 2,
    "name": "Barbell Back Squats",
    "nameSuffix": null,
    "tags": [
      {
        "tone": "quad",
        "label": "Quads"
      },
      {
        "tone": "glute",
        "label": "Glutes"
      }
    ],
    "sets": "3",
    "reps": "8-10",
    "rir": "1-2",
    "pillVariant": null,
    "setDots": [
      {
        "idx": "1",
        "label": "1"
      },
      {
        "idx": "2",
        "label": "2"
      },
      {
        "idx": "3",
        "label": "3"
      }
    ],
    "blocks": [
      {
        "heading": "Execution Cues",
        "items": [
          {
            "kind": "text",
            "html": "The free-bar squat replaces the machine hack squat as this program's main quad/glute compound. Brace hard, break at the hips and knees together, sit back into a full depth you can control, and drive up through the whole foot. This carries the heaviest loading of the session — treat your warm-up ramp seriously."
          },
          {
            "kind": "intensity",
            "level": "rir2",
            "html": "Intensity: 1-2 RIR"
          }
        ]
      },
      {
        "heading": "Muscle Activation",
        "items": [
          {
            "kind": "activation",
            "rows": [
              {
                "label": "Quads",
                "tone": "quad",
                "pct": 88,
                "scale": "0.88",
                "filter": null
              },
              {
                "label": "Glutes",
                "tone": "glute",
                "pct": 70,
                "scale": "0.7",
                "filter": null
              },
              {
                "label": "Trunk/Core",
                "tone": "core",
                "pct": 45,
                "scale": "0.45",
                "filter": null
              }
            ]
          },
          {
            "kind": "sourceNote",
            "html": "EMG comparisons of the back squat and machine hack squat at matched relative loads find broadly similar quad and glute activation, with the free-bar version demanding meaningfully more trunk stabilization."
          },
          {
            "kind": "cite",
            "html": "Clark, Lambert &amp; Hunter (2019), J Strength Cond Res 33(10)"
          }
        ]
      }
    ]
  },
  {
    "key": "legs-a3",
    "number": 3,
    "name": "Leg Press",
    "nameSuffix": {
      "text": "— The Widowmaker",
      "tone": "danger"
    },
    "tags": [
      {
        "tone": "quad",
        "label": "Quads"
      },
      {
        "tone": "glute",
        "label": "Glutes"
      }
    ],
    "sets": "1",
    "reps": "15-20+",
    "rir": "FAILURE",
    "pillVariant": "danger",
    "setDots": [
      {
        "idx": "1",
        "label": "1"
      }
    ],
    "blocks": [
      {
        "heading": "Execution Cues",
        "items": [
          {
            "kind": "text",
            "html": "<strong>One brutal, all-the-way-to-failure set.</strong> After squats have already fatigued the quads, load the sled to something you can grind through 15-20+ reps, and don't rack it until your legs genuinely refuse to extend. The machine's fixed path makes this safe to take further than a free-weight squat ever could."
          },
          {
            "kind": "intensity",
            "level": "failure",
            "html": "Intensity: Absolute Failure — 0 RIR"
          }
        ]
      },
      {
        "heading": "Muscle Activation",
        "items": [
          {
            "kind": "activation",
            "rows": [
              {
                "label": "Quads",
                "tone": "quad",
                "pct": 90,
                "scale": "0.9",
                "filter": null
              },
              {
                "label": "Glutes",
                "tone": "glute",
                "pct": 62,
                "scale": "0.62",
                "filter": null
              }
            ]
          },
          {
            "kind": "sourceNote",
            "html": "High-rep, machine-supported leg press sets taken to genuine failure let you accumulate metabolite-driven fatigue in the quads without any spinal loading concern."
          }
        ]
      }
    ]
  },
  {
    "key": "legs-a4",
    "number": 4,
    "name": "Barbell Romanian Deadlifts",
    "nameSuffix": {
      "text": "(Hamstring Focus)",
      "tone": "muted"
    },
    "tags": [
      {
        "tone": "ham",
        "label": "Hamstrings"
      },
      {
        "tone": "glute",
        "label": "Glutes"
      }
    ],
    "sets": "4",
    "reps": "8-10",
    "rir": "1-2",
    "pillVariant": null,
    "setDots": [
      {
        "idx": "1",
        "label": "1"
      },
      {
        "idx": "2",
        "label": "2"
      },
      {
        "idx": "3",
        "label": "3"
      },
      {
        "idx": "4",
        "label": "4"
      }
    ],
    "blocks": [
      {
        "heading": "Execution Cues",
        "items": [
          {
            "kind": "text",
            "html": "Now carrying the hamstrings' entire direct stimulus with a 4th set added, since leg curls are out of the program. Push your hips back with a soft knee bend until you feel a deep hamstring stretch, keep the bar tight against your legs, then drive your hips forward to stand — don't round the lower back to chase extra range."
          },
          {
            "kind": "intensity",
            "level": "rir2",
            "html": "Intensity: 1-2 RIR"
          }
        ]
      },
      {
        "heading": "Muscle Activation",
        "items": [
          {
            "kind": "activation",
            "rows": [
              {
                "label": "Hamstrings",
                "tone": "ham",
                "pct": 90,
                "scale": "0.9",
                "filter": null
              },
              {
                "label": "Glutes",
                "tone": "glute",
                "pct": 78,
                "scale": "0.78",
                "filter": null
              },
              {
                "label": "Lower Back",
                "tone": "midback",
                "pct": 50,
                "scale": "0.5",
                "filter": null
              }
            ]
          },
          {
            "kind": "sourceNote",
            "html": "RDLs load the hamstrings at long muscle lengths through hip flexion — a growth-favorable position — but they don't reach the short, knee-flexed length a leg curl does, which is the one stimulus this update trades away."
          }
        ]
      }
    ]
  },
  {
    "key": "legs-a5",
    "number": 5,
    "name": "Leaned-Back Leg Extensions",
    "nameSuffix": null,
    "tags": [
      {
        "tone": "quad",
        "label": "Quads (Rectus Femoris)"
      }
    ],
    "sets": "3",
    "reps": "10-12",
    "rir": "1-2",
    "pillVariant": null,
    "setDots": [
      {
        "idx": "1",
        "label": "1"
      },
      {
        "idx": "2",
        "label": "2"
      },
      {
        "idx": "3",
        "label": "3"
      }
    ],
    "blocks": [
      {
        "heading": "Execution Cues",
        "items": [
          {
            "kind": "text",
            "html": "Lean your torso back against the pad rather than sitting upright — this puts the hip into extension, which stretches the rectus femoris (the only quad head crossing the hip) harder at the bottom of every rep than a standard upright leg extension."
          },
          {
            "kind": "intensity",
            "level": "rir2",
            "html": "Intensity: 1-2 RIR"
          }
        ]
      },
      {
        "heading": "Muscle Activation",
        "items": [
          {
            "kind": "activation",
            "rows": [
              {
                "label": "Quads (Overall)",
                "tone": "quad",
                "pct": 88,
                "scale": "0.88",
                "filter": null
              },
              {
                "label": "Rectus Femoris",
                "tone": "quad",
                "pct": 80,
                "scale": "0.8",
                "filter": "hue-rotate(15deg)"
              }
            ]
          },
          {
            "kind": "sourceNote",
            "html": "Because the rectus femoris crosses both the hip and knee, a hip-extended (leaned-back) leg extension lengthens it more than an upright position, producing a stronger stretch stimulus specific to that head."
          },
          {
            "kind": "cite",
            "html": "Pedrosa et al. (2022), Eur J Sport Sci 22(8)"
          }
        ]
      }
    ]
  },
  {
    "key": "legs-a6",
    "number": 6,
    "name": "Calf Routine",
    "nameSuffix": {
      "text": "(Full Soleus & Gastrocnemius Split)",
      "tone": "muted"
    },
    "tags": [
      {
        "tone": "calf",
        "label": "Calves"
      }
    ],
    "sets": "2+2",
    "reps": "To Fail",
    "rir": "FAILURE",
    "pillVariant": "danger",
    "setDots": [
      {
        "idx": "1",
        "label": "1"
      },
      {
        "idx": "2",
        "label": "2"
      },
      {
        "idx": "3",
        "label": "3"
      },
      {
        "idx": "4",
        "label": "4"
      }
    ],
    "blocks": [
      {
        "heading": "Execution Cues",
        "items": [
          {
            "kind": "subLabel",
            "html": "6A · Standing Calf Raises"
          },
          {
            "kind": "text",
            "html": "Straight-knee position targets the two-joint gastrocnemius. Full stretch at the bottom, pause, then rise as high onto the toes as possible and hold the peak contraction briefly."
          },
          {
            "kind": "intensity",
            "level": "failure",
            "html": "Intensity: Absolute Failure — 0 RIR"
          },
          {
            "kind": "divider",
            "html": "Immediately into 6B"
          },
          {
            "kind": "subLabel",
            "html": "6B · Seated Calf Raises"
          },
          {
            "kind": "text",
            "html": "Bent-knee position takes the gastrocnemius out of play, isolating the soleus underneath. Same principle — full stretch, full contraction, taken to true failure."
          },
          {
            "kind": "intensity",
            "level": "failure",
            "html": "Intensity: Absolute Failure — 0 RIR"
          }
        ]
      },
      {
        "heading": "Muscle Activation",
        "items": [
          {
            "kind": "activation",
            "rows": [
              {
                "label": "Gastrocnemius (6A)",
                "tone": "calf",
                "pct": 90,
                "scale": "0.9",
                "filter": null
              },
              {
                "label": "Soleus (6B)",
                "tone": "calf",
                "pct": 88,
                "scale": "0.88",
                "filter": "hue-rotate(15deg)"
              }
            ]
          },
          {
            "kind": "sourceNote",
            "html": "Lengthened-position partial-range calf training produced roughly double the medial gastrocnemius growth of full-range training over 8 weeks, reinforcing the emphasis on a deep stretch at the bottom of every rep in both variations."
          },
          {
            "kind": "cite",
            "html": "Kassiano et al. (2023), J Strength Cond Res 37(9)"
          }
        ]
      }
    ]
  },
  {
    "key": "legs-a7",
    "number": 7,
    "name": "Forearms: Barbell Wrist Curls",
    "nameSuffix": {
      "text": "(Flexor Focus)",
      "tone": "muted"
    },
    "tags": [
      {
        "tone": "forearm",
        "label": "Forearm Flexors"
      }
    ],
    "sets": "3",
    "reps": "To Fail",
    "rir": "FAILURE",
    "pillVariant": "danger",
    "setDots": [
      {
        "idx": "1",
        "label": "1"
      },
      {
        "idx": "2",
        "label": "2"
      },
      {
        "idx": "3",
        "label": "3"
      }
    ],
    "blocks": [
      {
        "heading": "Execution Cues",
        "items": [
          {
            "kind": "text",
            "html": "Forearms now finish leg day instead of pull day, so your grip is completely fresh for the heavy rowing work earlier in the week. Rest your forearms on your thighs or a bench, let the bar roll down to your fingertips, then curl up hard and squeeze."
          },
          {
            "kind": "intensity",
            "level": "failure",
            "html": "Intensity: Absolute Failure — 0 RIR"
          }
        ]
      },
      {
        "heading": "Muscle Activation",
        "items": [
          {
            "kind": "activation",
            "rows": [
              {
                "label": "Forearm Flexors",
                "tone": "forearm",
                "pct": 92,
                "scale": "0.92",
                "filter": null
              },
              {
                "label": "Grip",
                "tone": "forearm",
                "pct": 70,
                "scale": "0.7",
                "filter": "hue-rotate(15deg)"
              }
            ]
          },
          {
            "kind": "sourceNote",
            "html": "Small, fast-recovering muscles like the forearm flexors respond well to being trained to true failure on the day where they aren't also needed for grip-limited pulling work."
          }
        ]
      }
    ]
  },
  {
    "key": "legs-b1",
    "number": 1,
    "name": "Seated Dumbbell Shoulder Press",
    "nameSuffix": null,
    "tags": [
      {
        "tone": "delt",
        "label": "Front Delt"
      }
    ],
    "sets": "3",
    "reps": "8-10",
    "rir": "1-2",
    "pillVariant": null,
    "setDots": [
      {
        "idx": "1",
        "label": "1"
      },
      {
        "idx": "2",
        "label": "2"
      },
      {
        "idx": "3",
        "label": "3"
      }
    ],
    "blocks": [
      {
        "heading": "Execution Cues",
        "items": [
          {
            "kind": "text",
            "html": "Free dumbbells this time instead of the machine — a slightly greater stabilizer demand, and a path that lets your elbows travel wherever is most comfortable for your shoulders. Press up and slightly in without clacking the weights at the top."
          },
          {
            "kind": "intensity",
            "level": "rir2",
            "html": "Intensity: 1-2 RIR"
          }
        ]
      },
      {
        "heading": "Muscle Activation",
        "items": [
          {
            "kind": "activation",
            "rows": [
              {
                "label": "Front Delt",
                "tone": "delt",
                "pct": 83,
                "scale": "0.83",
                "filter": null
              },
              {
                "label": "Side Delt",
                "tone": "delt",
                "pct": 48,
                "scale": "0.48",
                "filter": "hue-rotate(15deg)"
              },
              {
                "label": "Triceps",
                "tone": "tri",
                "pct": 52,
                "scale": "0.52",
                "filter": null
              }
            ]
          },
          {
            "kind": "sourceNote",
            "html": "Free-weight presses recruit a small amount of side-delt stabilization that a fixed machine path doesn't, giving Day B's version a slightly broader shoulder stimulus than Day A's machine press."
          }
        ]
      }
    ]
  },
  {
    "key": "legs-b2",
    "number": 2,
    "name": "Barbell Back Squats",
    "nameSuffix": null,
    "tags": [
      {
        "tone": "quad",
        "label": "Quads"
      },
      {
        "tone": "glute",
        "label": "Glutes"
      }
    ],
    "sets": "3",
    "reps": "8-10",
    "rir": "1-2",
    "pillVariant": null,
    "setDots": [
      {
        "idx": "1",
        "label": "1"
      },
      {
        "idx": "2",
        "label": "2"
      },
      {
        "idx": "3",
        "label": "3"
      }
    ],
    "blocks": [
      {
        "heading": "Execution Cues",
        "items": [
          {
            "kind": "text",
            "html": "Identical prescription to Day A — same movement, same rep range. Brace hard, break at the hips and knees together, sit back into a full depth you can control, and drive up through the whole foot. Progress this the same way you'd progress any other main compound: chase the top of the rep range before adding weight."
          },
          {
            "kind": "intensity",
            "level": "rir2",
            "html": "Intensity: 1-2 RIR"
          }
        ]
      },
      {
        "heading": "Muscle Activation",
        "items": [
          {
            "kind": "activation",
            "rows": [
              {
                "label": "Quads",
                "tone": "quad",
                "pct": 88,
                "scale": "0.88",
                "filter": null
              },
              {
                "label": "Glutes",
                "tone": "glute",
                "pct": 70,
                "scale": "0.7",
                "filter": null
              },
              {
                "label": "Trunk/Core",
                "tone": "core",
                "pct": 45,
                "scale": "0.45",
                "filter": null
              }
            ]
          },
          {
            "kind": "sourceNote",
            "html": "EMG comparisons of the back squat and machine hack squat at matched relative loads find broadly similar quad and glute activation, with the free-bar version demanding meaningfully more trunk stabilization."
          },
          {
            "kind": "cite",
            "html": "Clark, Lambert &amp; Hunter (2019), J Strength Cond Res 33(10)"
          }
        ]
      }
    ]
  },
  {
    "key": "legs-b3",
    "number": 3,
    "name": "Leg Press",
    "nameSuffix": {
      "text": "— The Widowmaker",
      "tone": "danger"
    },
    "tags": [
      {
        "tone": "quad",
        "label": "Quads"
      },
      {
        "tone": "glute",
        "label": "Glutes"
      }
    ],
    "sets": "1",
    "reps": "15-20+",
    "rir": "FAILURE",
    "pillVariant": "danger",
    "setDots": [
      {
        "idx": "1",
        "label": "1"
      }
    ],
    "blocks": [
      {
        "heading": "Execution Cues",
        "items": [
          {
            "kind": "text",
            "html": "Same brutal single set as Day A. Load the sled to something you can grind through 15-20+ reps, and don't rack it until your legs genuinely refuse to extend. Because it's the same exercise both days, this is a good week-to-week benchmark of how leg recovery is trending."
          },
          {
            "kind": "intensity",
            "level": "failure",
            "html": "Intensity: Absolute Failure — 0 RIR"
          }
        ]
      },
      {
        "heading": "Muscle Activation",
        "items": [
          {
            "kind": "activation",
            "rows": [
              {
                "label": "Quads",
                "tone": "quad",
                "pct": 90,
                "scale": "0.9",
                "filter": null
              },
              {
                "label": "Glutes",
                "tone": "glute",
                "pct": 62,
                "scale": "0.62",
                "filter": null
              }
            ]
          },
          {
            "kind": "sourceNote",
            "html": "High-rep, machine-supported leg press sets taken to genuine failure let you accumulate metabolite-driven fatigue in the quads without any spinal loading concern."
          }
        ]
      }
    ]
  },
  {
    "key": "legs-b4",
    "number": 4,
    "name": "Dumbbell Romanian Deadlifts",
    "nameSuffix": {
      "text": "(Hamstring Focus)",
      "tone": "muted"
    },
    "tags": [
      {
        "tone": "ham",
        "label": "Hamstrings"
      },
      {
        "tone": "glute",
        "label": "Glutes"
      }
    ],
    "sets": "4",
    "reps": "10-12",
    "rir": "1-2",
    "pillVariant": null,
    "setDots": [
      {
        "idx": "1",
        "label": "1"
      },
      {
        "idx": "2",
        "label": "2"
      },
      {
        "idx": "3",
        "label": "3"
      },
      {
        "idx": "4",
        "label": "4"
      }
    ],
    "blocks": [
      {
        "heading": "Execution Cues",
        "items": [
          {
            "kind": "text",
            "html": "Dumbbells let your hands travel along the sides of your legs rather than in front, which some lifters find lets them reach a deeper stretch without the bar scraping the shins. Slightly higher reps than Day A's barbell version — push your hips back until you feel the hamstring stretch, then drive them forward to stand."
          },
          {
            "kind": "intensity",
            "level": "rir2",
            "html": "Intensity: 1-2 RIR"
          }
        ]
      },
      {
        "heading": "Muscle Activation",
        "items": [
          {
            "kind": "activation",
            "rows": [
              {
                "label": "Hamstrings",
                "tone": "ham",
                "pct": 90,
                "scale": "0.9",
                "filter": null
              },
              {
                "label": "Glutes",
                "tone": "glute",
                "pct": 78,
                "scale": "0.78",
                "filter": null
              },
              {
                "label": "Lower Back",
                "tone": "midback",
                "pct": 48,
                "scale": "0.48",
                "filter": null
              }
            ]
          },
          {
            "kind": "sourceNote",
            "html": "RDLs load the hamstrings at long muscle lengths through hip flexion — a growth-favorable position — regardless of whether the load is a barbell or a pair of dumbbells."
          }
        ]
      }
    ]
  },
  {
    "key": "legs-b5",
    "number": 5,
    "name": "Leaned-Back Leg Extensions",
    "nameSuffix": null,
    "tags": [
      {
        "tone": "quad",
        "label": "Quads (Rectus Femoris)"
      }
    ],
    "sets": "3",
    "reps": "10-12",
    "rir": "1-2",
    "pillVariant": null,
    "setDots": [
      {
        "idx": "1",
        "label": "1"
      },
      {
        "idx": "2",
        "label": "2"
      },
      {
        "idx": "3",
        "label": "3"
      }
    ],
    "blocks": [
      {
        "heading": "Execution Cues",
        "items": [
          {
            "kind": "text",
            "html": "Identical to Day A. Lean your torso back against the pad to put the hip into extension, stretching the rectus femoris harder at the bottom of every rep than a standard upright leg extension would."
          },
          {
            "kind": "intensity",
            "level": "rir2",
            "html": "Intensity: 1-2 RIR"
          }
        ]
      },
      {
        "heading": "Muscle Activation",
        "items": [
          {
            "kind": "activation",
            "rows": [
              {
                "label": "Quads (Overall)",
                "tone": "quad",
                "pct": 88,
                "scale": "0.88",
                "filter": null
              },
              {
                "label": "Rectus Femoris",
                "tone": "quad",
                "pct": 80,
                "scale": "0.8",
                "filter": "hue-rotate(15deg)"
              }
            ]
          },
          {
            "kind": "sourceNote",
            "html": "Because the rectus femoris crosses both the hip and knee, a hip-extended (leaned-back) leg extension lengthens it more than an upright position, producing a stronger stretch stimulus specific to that head."
          },
          {
            "kind": "cite",
            "html": "Pedrosa et al. (2022), Eur J Sport Sci 22(8)"
          }
        ]
      }
    ]
  },
  {
    "key": "legs-b6",
    "number": 6,
    "name": "Calf Routine",
    "nameSuffix": {
      "text": "(Identical to Day A)",
      "tone": "muted"
    },
    "tags": [
      {
        "tone": "calf",
        "label": "Calves"
      }
    ],
    "sets": "2+2",
    "reps": "To Fail",
    "rir": "FAILURE",
    "pillVariant": "danger",
    "setDots": [
      {
        "idx": "1",
        "label": "1"
      },
      {
        "idx": "2",
        "label": "2"
      },
      {
        "idx": "3",
        "label": "3"
      },
      {
        "idx": "4",
        "label": "4"
      }
    ],
    "blocks": [
      {
        "heading": "Execution Cues",
        "items": [
          {
            "kind": "subLabel",
            "html": "6A · Standing Calf Raises"
          },
          {
            "kind": "text",
            "html": "Same as Day A. Straight-knee position for the gastrocnemius — full stretch at the bottom, pause, then rise as high onto the toes as possible and hold the peak contraction briefly."
          },
          {
            "kind": "intensity",
            "level": "failure",
            "html": "Intensity: Absolute Failure — 0 RIR"
          },
          {
            "kind": "divider",
            "html": "Immediately into 6B"
          },
          {
            "kind": "subLabel",
            "html": "6B · Seated Calf Raises"
          },
          {
            "kind": "text",
            "html": "Bent-knee position isolates the soleus. Same principle both days — full stretch, full contraction, taken to true failure."
          },
          {
            "kind": "intensity",
            "level": "failure",
            "html": "Intensity: Absolute Failure — 0 RIR"
          }
        ]
      },
      {
        "heading": "Muscle Activation",
        "items": [
          {
            "kind": "activation",
            "rows": [
              {
                "label": "Gastrocnemius (6A)",
                "tone": "calf",
                "pct": 90,
                "scale": "0.9",
                "filter": null
              },
              {
                "label": "Soleus (6B)",
                "tone": "calf",
                "pct": 88,
                "scale": "0.88",
                "filter": "hue-rotate(15deg)"
              }
            ]
          },
          {
            "kind": "sourceNote",
            "html": "Lengthened-position partial-range calf training produced roughly double the medial gastrocnemius growth of full-range training over 8 weeks, reinforcing the emphasis on a deep stretch at the bottom of every rep in both variations."
          },
          {
            "kind": "cite",
            "html": "Kassiano et al. (2023), J Strength Cond Res 37(9)"
          }
        ]
      }
    ]
  },
  {
    "key": "legs-b7",
    "number": 7,
    "name": "Forearms: Reverse Barbell Curls",
    "nameSuffix": {
      "text": "(Extensor Focus)",
      "tone": "muted"
    },
    "tags": [
      {
        "tone": "forearm",
        "label": "Forearm Extensors"
      }
    ],
    "sets": "3",
    "reps": "To Fail",
    "rir": "FAILURE",
    "pillVariant": "danger",
    "setDots": [
      {
        "idx": "1",
        "label": "1"
      },
      {
        "idx": "2",
        "label": "2"
      },
      {
        "idx": "3",
        "label": "3"
      }
    ],
    "blocks": [
      {
        "heading": "Execution Cues",
        "items": [
          {
            "kind": "text",
            "html": "Overhand, pronated grip on the barbell — the opposite muscle group from Day A's flexor-biased wrist curl. Curl using only the wrist, keeping the forearms braced on your thighs or a bench, and take every set to true failure."
          },
          {
            "kind": "intensity",
            "level": "failure",
            "html": "Intensity: Absolute Failure — 0 RIR"
          }
        ]
      },
      {
        "heading": "Muscle Activation",
        "items": [
          {
            "kind": "activation",
            "rows": [
              {
                "label": "Forearm Extensors",
                "tone": "forearm",
                "pct": 90,
                "scale": "0.9",
                "filter": null
              },
              {
                "label": "Grip",
                "tone": "forearm",
                "pct": 55,
                "scale": "0.55",
                "filter": "hue-rotate(-15deg)"
              }
            ]
          },
          {
            "kind": "sourceNote",
            "html": "Training extensors directly balances the flexor-dominant wrist curls from Day A — even, matched development on both sides of the forearm reduces the common grip-strength imbalance lifters develop from flexor-only training."
          }
        ]
      }
    ]
  }
];

export const exerciseByKey: Record<string, Exercise> = Object.fromEntries(
  exercises.map(e => [e.key, e]),
);

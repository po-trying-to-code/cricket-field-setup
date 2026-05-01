import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

type FieldPosition = {
  name: string;
  x: number; // 0..100
  y: number; // 0..100
};

type SelectedPosition = FieldPosition & {
  id: string;
  fielderName: string;
};

type FieldPreset = {
  id: string;
  name: string;
  positions: string[];
};

type SavedFormation = {
  id: string;
  name: string;
  teamName: string;
  players: SelectedPosition[];
  isLeftHander: boolean;
  isEndOverRotated: boolean;
};

type BowlerScenario = {
  id: string;
  name: string;
  action: string;
  notes: string;
  players: SelectedPosition[];
  isLeftHander: boolean;
  isEndOverRotated: boolean;
};

type BowlerPlan = {
  id: string;
  bowlerName: string;
  scenarios: BowlerScenario[];
};

type FieldSuggestion = {
  position: FieldPosition;
  x: number;
  y: number;
};

type PlannerTabId =
  | "overview"
  | "practice"
  | "fitness"
  | "drills"
  | "team"
  | "video-library"
  | "fielding"
  | "match-notes";
type PlannerSectionId = Exclude<PlannerTabId, "overview" | "fielding" | "video-library">;

type ChecklistItem = {
  id: string;
  text: string;
  done: boolean;
};

type ResourceLink = {
  label: string;
  url: string;
  description: string;
};

type OpponentPlayer = {
  id: string;
  name: string;
  role: string;
  strengths: string;
  plan: string;
};

type PlannerSection = {
  id: string;
  sectionId: PlannerTabId;
  workspaceId: string;
  title: string;
  goals: string;
  checklistItems: ChecklistItem[];
  notes: string;
  resourceLinks: ResourceLink[];
  opponentPlayers: OpponentPlayer[];
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
};

type PlannerTab = {
  id: PlannerTabId;
  label: string;
  summary: string;
};

type PlannerGroup = {
  id: string;
  label: string;
  tabs: PlannerTabId[];
};

type PlannerTemplate = {
  id: string;
  sectionId: PlannerSectionId;
  name: string;
  description: string;
  title: string;
  goals: string;
  checklistItems: string[];
  notes: string;
  resourceLinks?: ResourceLink[];
};

type VideoResourceCategory = {
  id: string;
  title: string;
  description: string;
  links: ResourceLink[];
};

const FIELD_POSITIONS: FieldPosition[] = [
  { name: "Bowler", x: 50, y: 31 },
  { name: "Wicket Keeper", x: 50, y: 66 },
  { name: "First Slip", x: 46, y: 72 },
  { name: "Second Slip", x: 39, y: 73 },
  { name: "Third Slip", x: 35, y: 72 },
  { name: "Fourth Slip", x: 31, y: 70 },
  { name: "Fly Slip", x: 24, y: 69 },
  { name: "Leg Slip", x: 57, y: 74 },
  { name: "Gully", x: 39, y: 67 },
  { name: "Silly Point", x: 43, y: 56 },
  { name: "Short Leg", x: 57, y: 57 },
  { name: "Silly Mid-off", x: 45, y: 46 },
  { name: "Silly Mid-on", x: 55, y: 46 },
  { name: "Backward Point", x: 30, y: 62 },
  { name: "Point", x: 26, y: 57 },
  { name: "Deep Point", x: 10, y: 53 },
  { name: "Deep Backward Point", x: 13, y: 63 },
  { name: "Cover Point", x: 29, y: 48 },
  { name: "Cover", x: 31, y: 42 },
  { name: "Extra Cover", x: 39, y: 36 },
  { name: "Deep Cover", x: 17, y: 33 },
  { name: "Deep Extra Cover", x: 25, y: 23 },
  { name: "Sweeper Cover", x: 12, y: 42 },
  { name: "Mid-off", x: 42, y: 28 },
  { name: "Long-off", x: 36, y: 14 },
  { name: "Mid-on", x: 58, y: 28 },
  { name: "Long-on", x: 64, y: 14 },
  { name: "Straight Hit", x: 50, y: 8 },
  { name: "Midwicket", x: 66, y: 42 },
  { name: "Deep Midwicket", x: 83, y: 32 },
  { name: "Cow Corner", x: 77, y: 22 },
  { name: "Square Leg", x: 72, y: 58 },
  { name: "Backward Square Leg", x: 74, y: 61 },
  { name: "Deep Square Leg", x: 90, y: 57 },
  { name: "Fine Leg", x: 63, y: 72 },
  { name: "Short Fine Leg", x: 58, y: 67 },
  { name: "Long Leg", x: 76, y: 82 },
  { name: "Deep Fine Leg", x: 65, y: 90 },
  { name: "Short Third", x: 37, y: 70 },
  { name: "Third Man", x: 25, y: 82 },
  { name: "Deep Third", x: 31, y: 91 },
  { name: "Long Stop", x: 50, y: 94 },
];

const DEFAULT_SELECTION = [
  "Bowler",
  "Wicket Keeper",
  "Point",
  "Cover",
  "Mid-off",
  "Mid-on",
  "Gully",
  "Square Leg",
  "Fine Leg",
  "Third Man",
  "First Slip",
];

const FIELD_PRESETS: FieldPreset[] = [
  {
    id: "fast-powerplay",
    name: "Fast bowling - Powerplay",
    positions: [
      "Bowler",
      "Wicket Keeper",
      "First Slip",
      "Gully",
      "Backward Point",
      "Cover",
      "Mid-off",
      "Mid-on",
      "Square Leg",
      "Third Man",
      "Fine Leg",
    ],
  },
  {
    id: "fast-non-powerplay",
    name: "Fast bowling - Non powerplay",
    positions: [
      "Bowler",
      "Wicket Keeper",
      "Short Third",
      "Point",
      "Cover",
      "Long-off",
      "Fine Leg",
      "Sweeper Cover",
      "Midwicket",
      "Long-on",
      "Deep Square Leg",
    ],
  },
  {
    id: "spin-powerplay",
    name: "Spin bowling - Powerplay",
    positions: [
      "Bowler",
      "Wicket Keeper",
      "First Slip",
      "Short Third",
      "Point",
      "Cover",
      "Mid-off",
      "Short Fine Leg",
      "Midwicket",
      "Long-on",
      "Deep Square Leg",
    ],
  },
  {
    id: "spin-non-powerplay",
    name: "Spin bowling - Non powerplay",
    positions: [
      "Bowler",
      "Wicket Keeper",
      "Point",
      "Short Third",
      "Cover",
      "Square Leg",
      "Short Fine Leg",
      "Sweeper Cover",
      "Long-off",
      "Long-on",
      "Deep Midwicket",
    ],
  },
  {
    id: "death-overs",
    name: "Death overs / T20 non-powerplay - Boundary protection",
    positions: [
      "Bowler",
      "Wicket Keeper",
      "Short Third",
      "Cover",
      "Point",
      "Long-off",
      "Long-on",
      "Deep Midwicket",
      "Deep Square Leg",
      "Short Fine Leg",
      "Sweeper Cover",
    ],
  },
];

const FIELD_DEPTH_GROUPS: Record<string, string[]> = {
  "off side": ["Point", "Deep Point"],
  cover: ["Cover", "Deep Cover", "Sweeper Cover"],
  "extra cover": ["Extra Cover", "Deep Extra Cover"],
  "straight off": ["Mid-off", "Long-off"],
  "straight on": ["Mid-on", "Long-on"],
  midwicket: ["Midwicket", "Deep Midwicket"],
  "square leg": ["Square Leg", "Deep Square Leg"],
  "fine leg": ["Fine Leg", "Short Fine Leg", "Deep Fine Leg"],
  third: ["Short Third", "Third Man", "Deep Third"],
  leg: ["Short Leg", "Long Leg"],
};

const FIELD_LABELS: Record<string, string> = {
  "Wicket Keeper": "WK",
  "First Slip": "1st Slip",
  "Second Slip": "2nd Slip",
  "Third Slip": "3rd Slip",
  "Fourth Slip": "4th Slip",
  "Backward Point": "Bkwd Point",
  "Cover Point": "Cov Point",
  "Deep Point": "Deep Pt",
  "Deep Backward Point": "Deep Bkwd",
  "Extra Cover": "Extra Cov",
  "Deep Cover": "Deep Cov",
  "Deep Extra Cover": "Deep Extra",
  "Sweeper Cover": "Sweeper",
  "Silly Point": "Silly Pt",
  "Silly Mid-off": "Silly M-off",
  "Silly Mid-on": "Silly M-on",
  "Short Third": "Short 3rd",
  "Third Man": "3rd Man",
  "Deep Third": "Deep 3rd",
  "Short Fine Leg": "Short Fine",
  "Deep Fine Leg": "Deep Fine",
  "Backward Square Leg": "Bkwd Sq Leg",
  "Deep Square Leg": "Deep Sq Leg",
  "Deep Midwicket": "Deep Midwk",
  "Straight Hit": "Straight",
};

const STORAGE_KEY = "cricket-field-formation-v2";
const SAVED_FORMATIONS_KEY = "cricket-field-saved-formations-v1";
const BOWLER_PLANS_KEY = "cricket-field-bowler-plans-v1";
const PLANNER_SECTIONS_KEY = "cricket-team-planner-sections-v1";
const LOCAL_WORKSPACE_ID = "local-workspace";
const LOCAL_USER_ID = "local-coach";
const MAX_POSITIONS = 11;
const REQUIRED_POSITIONS = ["Bowler", "Wicket Keeper"];

const PLANNER_TABS: PlannerTab[] = [
  {
    id: "overview",
    label: "Overview",
    summary: "Team planning home with quick access to every coaching area.",
  },
  {
    id: "practice",
    label: "Practice",
    summary: "Session goals, focus points, and practice-day checklist.",
  },
  {
    id: "fitness",
    label: "Fitness",
    summary: "Conditioning, recovery, workloads, and fitness reminders.",
  },
  {
    id: "drills",
    label: "Drills",
    summary: "Training drills, skills focus, and coaching cues.",
  },
  {
    id: "team",
    label: "Team",
    summary: "Squad management, responsibilities, and team communication.",
  },
  {
    id: "video-library",
    label: "Video Library",
    summary: "Open coaching video/resource links grouped by training category.",
  },
  {
    id: "fielding",
    label: "Fielding Setup",
    summary: "Interactive ODI/T20 field formations and bowler scenario plans.",
  },
  {
    id: "match-notes",
    label: "Match Notes",
    summary: "Match plans, observations, and post-game review notes.",
  },
];

const PLANNER_GROUPS: PlannerGroup[] = [
  {
    id: "home",
    label: "Home",
    tabs: ["overview"],
  },
  {
    id: "training",
    label: "Training",
    tabs: ["practice", "fitness", "drills"],
  },
  {
    id: "team",
    label: "Team",
    tabs: ["team"],
  },
  {
    id: "resources",
    label: "Resources",
    tabs: ["video-library"],
  },
  {
    id: "match-planning",
    label: "Match Planning",
    tabs: ["fielding", "match-notes"],
  },
];

const COACHING_RESOURCE_LINKS: Record<"practice" | "fitness" | "drills", ResourceLink[]> = {
  practice: [
    {
      label: "Cricket Victoria Coaching Clips",
      url: "https://www.cricketvictoria.com.au/coaching-clips/",
      description: "Open coaching clip library with batting, bowling, fielding, wicketkeeping, and modified games ideas.",
    },
    {
      label: "PlayCricket Learn",
      url: "https://play.cricket.com.au/learn",
      description: "Cricket Australia learning hub for coaching pathways, drills, and practical coaching support.",
    },
  ],
  fitness: [
    {
      label: "Cricket Victoria Strength and Conditioning Clips",
      url: "https://www.cricketvictoria.com.au/coaching-clips/",
      description: "Open coaching clips page including strength, conditioning, movement, and training activity references.",
    },
    {
      label: "PlayCricket Learn",
      url: "https://play.cricket.com.au/learn",
      description: "General cricket learning hub with coaching support and player development resources.",
    },
  ],
  drills: [
    {
      label: "Cricket Victoria Coaching Clips",
      url: "https://www.cricketvictoria.com.au/coaching-clips/",
      description: "Open drill ideas grouped by batting, wicketkeeping, fast bowling, spin bowling, fielding, and modified games.",
    },
  ],
};

const VIDEO_RESOURCE_CATEGORIES: VideoResourceCategory[] = [
  {
    id: "training-purpose",
    title: "Training with purpose",
    description: "Session design ideas for coaches planning purposeful, adaptable training.",
    links: [
      {
        label: "Cricket Victoria - Coaching Clips",
        url: "https://www.cricketvictoria.com.au/coaching-clips/",
        description: "Open coaching clips library with a Training with Purpose section.",
      },
      {
        label: "PlayCricket Learn",
        url: "https://play.cricket.com.au/learn",
        description: "Cricket Australia learning hub for coaching pathways and practical support.",
      },
    ],
  },
  {
    id: "batting",
    title: "Batting",
    description: "Batting activities, scoring options, rotation, and game-based batting ideas.",
    links: [
      {
        label: "Cricket Victoria - Batting coaching clips",
        url: "https://www.cricketvictoria.com.au/coaching-clips/",
        description: "Use the Batting coaching clips section for visual activity ideas.",
      },
    ],
  },
  {
    id: "pace-bowling",
    title: "Fast bowling",
    description: "Pace bowling rhythm, accuracy, target work, and bowling session ideas.",
    links: [
      {
        label: "Cricket Victoria - Fast bowling coaching clips",
        url: "https://www.cricketvictoria.com.au/coaching-clips/",
        description: "Use the Fast bowling coaching clips section for setup and activity references.",
      },
    ],
  },
  {
    id: "spin-bowling",
    title: "Spin bowling",
    description: "Spin control, pace/flight variation, and pressure-building drill ideas.",
    links: [
      {
        label: "Cricket Victoria - Spin bowling coaching clips",
        url: "https://www.cricketvictoria.com.au/coaching-clips/",
        description: "Use the Spin bowling coaching clips section for activity inspiration.",
      },
    ],
  },
  {
    id: "fielding",
    title: "Fielding",
    description: "Catching, ground fielding, throwing, run-out, and pressure-fielding ideas.",
    links: [
      {
        label: "Cricket Victoria - Fielding coaching clips",
        url: "https://www.cricketvictoria.com.au/coaching-clips/",
        description: "Use the Fielding coaching clips section for practical activity setup.",
      },
    ],
  },
  {
    id: "wicketkeeping",
    title: "Wicketkeeping",
    description: "Keeping movement, glove work, standing up/back, and keeper communication.",
    links: [
      {
        label: "Cricket Victoria - Wicketkeeping coaching clips",
        url: "https://www.cricketvictoria.com.au/coaching-clips/",
        description: "Use the Wicketkeeping coaching clips section for visual drill ideas.",
      },
    ],
  },
  {
    id: "fitness",
    title: "Strength and conditioning",
    description: "Movement prep, strength, conditioning, mobility, and recovery ideas for cricket.",
    links: [
      {
        label: "Cricket Victoria - Strength and conditioning clips",
        url: "https://www.cricketvictoria.com.au/coaching-clips/",
        description: "Use the Strength and conditioning coaching clips section for training ideas.",
      },
      {
        label: "PlayCricket Learn",
        url: "https://play.cricket.com.au/learn",
        description: "General cricket learning hub with coaching and player-development resources.",
      },
    ],
  },
  {
    id: "modified-games",
    title: "Modified games and drills",
    description: "Game-based activities that can be adapted for player age, ability, and space.",
    links: [
      {
        label: "Cricket Victoria - Modified games and drills",
        url: "https://www.cricketvictoria.com.au/coaching-clips/",
        description: "Use the Modified games & drills section for adaptable practice ideas.",
      },
    ],
  },
  {
    id: "coach-role",
    title: "Role of a coach",
    description: "Coach behaviour, session management, safety, communication, and player support.",
    links: [
      {
        label: "Cricket Victoria - Role of a Coach",
        url: "https://www.cricketvictoria.com.au/coaching-clips/",
        description: "Use the Role of a Coach section for coaching-practice references.",
      },
    ],
  },
];

const PLANNER_TEMPLATE_DEFAULTS: Record<PlannerSectionId, Omit<PlannerSection, "id" | "createdAt" | "updatedAt">> = {
  practice: {
    sectionId: "practice",
    workspaceId: LOCAL_WORKSPACE_ID,
    title: "Practice session",
    goals: "Define session focus, skills to sharpen, and match scenario to rehearse.",
    checklistItems: [
      { id: "practice-warmup", text: "Warm-up and mobility complete", done: false },
      { id: "practice-skill", text: "Primary skill block prepared", done: false },
      { id: "practice-review", text: "End-of-session review notes captured", done: false },
    ],
    notes: "",
    resourceLinks: [],
    opponentPlayers: [],
    createdBy: LOCAL_USER_ID,
    updatedBy: LOCAL_USER_ID,
  },
  fitness: {
    sectionId: "fitness",
    workspaceId: LOCAL_WORKSPACE_ID,
    title: "Fitness session",
    goals: "Track conditioning, strength, mobility, recovery, and workload balance.",
    checklistItems: [
      { id: "fitness-readiness", text: "Player readiness checked", done: false },
      { id: "fitness-conditioning", text: "Conditioning or strength block complete", done: false },
      { id: "fitness-recovery", text: "Recovery and hydration reminders shared", done: false },
    ],
    notes: "",
    resourceLinks: [],
    opponentPlayers: [],
    createdBy: LOCAL_USER_ID,
    updatedBy: LOCAL_USER_ID,
  },
  drills: {
    sectionId: "drills",
    workspaceId: LOCAL_WORKSPACE_ID,
    title: "Training drills",
    goals: "Plan skill drills, coaching points, intensity, and progression.",
    checklistItems: [
      { id: "drills-batting", text: "Batting or bowling drill prepared", done: false },
      { id: "drills-fielding", text: "Fielding drill prepared", done: false },
      { id: "drills-constraint", text: "Match-like constraint added", done: false },
    ],
    notes: "",
    resourceLinks: [],
    opponentPlayers: [],
    createdBy: LOCAL_USER_ID,
    updatedBy: LOCAL_USER_ID,
  },
  team: {
    sectionId: "team",
    workspaceId: LOCAL_WORKSPACE_ID,
    title: "Team management",
    goals: "Capture squad roles, communication points, availability, and responsibilities.",
    checklistItems: [
      { id: "team-availability", text: "Availability checked", done: false },
      { id: "team-roles", text: "Roles and responsibilities confirmed", done: false },
      { id: "team-message", text: "Team message or action items shared", done: false },
    ],
    notes: "",
    resourceLinks: [],
    opponentPlayers: [],
    createdBy: LOCAL_USER_ID,
    updatedBy: LOCAL_USER_ID,
  },
  "match-notes": {
    sectionId: "match-notes",
    workspaceId: LOCAL_WORKSPACE_ID,
    title: "Match notes",
    goals: "Prepare match plans, tactical reminders, and post-game review notes.",
    checklistItems: [
      { id: "match-opposition", text: "Opposition strengths noted", done: false },
      { id: "match-plan", text: "Bowling and batting plans reviewed", done: false },
      { id: "match-review", text: "Post-match learnings captured", done: false },
    ],
    notes: "",
    resourceLinks: [],
    opponentPlayers: [],
    createdBy: LOCAL_USER_ID,
    updatedBy: LOCAL_USER_ID,
  },
};

const COACH_TEMPLATES: PlannerTemplate[] = [
  {
    id: "practice-balanced",
    sectionId: "practice",
    name: "Balanced team practice",
    description: "A full-team session balancing skill work, fielding standards, and a short match scenario.",
    title: "Balanced team practice",
    goals: "Give every player touches across batting, bowling, fielding, and decision-making while keeping the session energetic and safe.",
    checklistItems: [
      "Quick warm-up and throwing prep",
      "Batting rotation with calling and running",
      "Bowling accuracy block with targets",
      "Catching and ground fielding standards",
      "10-minute match scenario finish",
    ],
    notes: "Use small groups to reduce waiting time. Finish by asking players what improved and what needs attention next session.",
  },
  {
    id: "practice-batting",
    sectionId: "practice",
    name: "Batting-focused session",
    description: "A batting day built around scoring options, strike rotation, and game awareness.",
    title: "Batting-focused practice",
    goals: "Help batters build repeatable scoring options, rotate strike under pressure, and choose options based on field placement.",
    checklistItems: [
      "Warm-up with movement and reaction catching",
      "Technical batting block by player need",
      "Strike rotation and calling drill",
      "Boundary option practice against set fields",
      "Scenario: chase target with wickets/overs constraint",
    ],
    notes: "Pair each batter with one simple focus. Keep bowlers involved with clear target zones and feedback roles.",
  },
  {
    id: "practice-bowling",
    sectionId: "practice",
    name: "Bowling-focused session",
    description: "A bowling day for line, length, variations, and field-linked plans.",
    title: "Bowling-focused practice",
    goals: "Build bowling consistency and connect each bowler's plan to realistic fields and batter matchups.",
    checklistItems: [
      "Bowling warm-up and run-up rhythm",
      "Line and length target work",
      "Variation practice with clear outcome",
      "Bowler field plan discussion",
      "Scenario: defend runs at start/death overs",
    ],
    notes: "Ask each bowler to name the plan before bowling. Link the plan to a field in Fielding Setup when useful.",
  },
  {
    id: "practice-fielding",
    sectionId: "practice",
    name: "Fielding intensity session",
    description: "A high-energy session for catches, stops, throws, and fielding standards.",
    title: "Fielding intensity practice",
    goals: "Raise fielding intensity, improve repeatable technique, and make fielders comfortable with pressure decisions.",
    checklistItems: [
      "Dynamic warm-up and shoulder prep",
      "Catching circuit: flat, high, and close catches",
      "Ground fielding: attack, gather, release",
      "Throwing to keeper/bowler end",
      "Pressure fielding challenge with scoring",
    ],
    notes: "Keep reps short and sharp. Reward clean technique and communication, not only speed.",
  },
  {
    id: "practice-scenario",
    sectionId: "practice",
    name: "Match scenario practice",
    description: "A practice built around realistic over, score, wicket, and tactical situations.",
    title: "Match scenario practice",
    goals: "Prepare players to make better tactical choices under match-like constraints.",
    checklistItems: [
      "Set scenario: overs, runs, wickets, field restrictions",
      "Confirm batting and bowling plans",
      "Run scenario with live scoring",
      "Pause once for tactical discussion",
      "Review decisions and next actions",
    ],
    notes: "Use one clear situation, not too many. The goal is decision quality and communication under pressure.",
  },
  {
    id: "fitness-warmup",
    sectionId: "fitness",
    name: "Pre-practice warm-up",
    description: "A simple readiness routine before cricket skill work.",
    title: "Pre-practice warm-up",
    goals: "Prepare players physically and mentally for training while reducing avoidable injury risk.",
    checklistItems: [
      "Light pulse raiser",
      "Mobility: hips, ankles, thoracic spine",
      "Activation: glutes, core, shoulders",
      "Progressive running and change of direction",
      "Throwing and catching prep",
    ],
    notes: "Keep it consistent enough that senior players can lead it when needed.",
  },
  {
    id: "fitness-conditioning",
    sectionId: "fitness",
    name: "Conditioning and running",
    description: "Cricket-specific running and repeat-effort conditioning.",
    title: "Conditioning and running",
    goals: "Improve repeat sprint ability, running between wickets, and recovery between high-intensity efforts.",
    checklistItems: [
      "Readiness check before intensity",
      "Running mechanics and acceleration",
      "Shuttle runs with cricket turns",
      "Repeat sprint block with rest control",
      "Cool-down and hydration",
    ],
    notes: "Adjust volume for age, role, and recent workload. Avoid hard conditioning immediately before important matches.",
  },
  {
    id: "fitness-strength",
    sectionId: "fitness",
    name: "Strength and mobility",
    description: "A safe bodyweight/resistance session for cricket movement quality.",
    title: "Strength and mobility",
    goals: "Build general strength, posture, and movement control for batting, bowling, fielding, and wicketkeeping.",
    checklistItems: [
      "Movement quality screen",
      "Lower-body strength pattern",
      "Upper-body push/pull pattern",
      "Core anti-rotation work",
      "Mobility and recovery finish",
    ],
    notes: "Prioritize technique over load. Note players who need modified work.",
  },
  {
    id: "fitness-recovery",
    sectionId: "fitness",
    name: "Recovery session",
    description: "Low-intensity reset for tired players or post-match training.",
    title: "Recovery session",
    goals: "Help players recover, reset movement, and prepare for the next training or match block.",
    checklistItems: [
      "Player soreness and fatigue check",
      "Easy movement and mobility",
      "Light catching or touch work",
      "Breathing and cool-down",
      "Hydration and sleep reminder",
    ],
    notes: "Use this after heavy match loads or when players look flat. Keep intensity deliberately low.",
  },
  {
    id: "fitness-match-readiness",
    sectionId: "fitness",
    name: "Match-day readiness",
    description: "A short readiness checklist before game day.",
    title: "Match-day readiness",
    goals: "Confirm players are physically ready and know their preparation responsibilities.",
    checklistItems: [
      "Availability and injury status checked",
      "Warm-up leaders assigned",
      "Hydration and nutrition reminder",
      "Bowling workload notes reviewed",
      "Match roles confirmed",
    ],
    notes: "Use this the day before or morning of the match. Keep it simple and clear.",
  },
  {
    id: "drills-batting-rotation",
    sectionId: "drills",
    name: "Batting rotation drill set",
    description: "Drills for singles, calling, gaps, and batting tempo.",
    title: "Batting rotation drill set",
    goals: "Improve strike rotation, calling clarity, and batter awareness of field gaps.",
    checklistItems: [
      "Drop-and-run calling drill",
      "Gap hitting with cone targets",
      "Two-run turning technique",
      "Pressure rotation challenge",
      "Review communication standards",
    ],
    notes: "Score the drill by good decisions as well as runs. Make batters call early and loudly.",
  },
  {
    id: "drills-pace-accuracy",
    sectionId: "drills",
    name: "Pace bowling accuracy drill set",
    description: "Target-based pace bowling drills for repeatable line and length.",
    title: "Pace bowling accuracy drill set",
    goals: "Help pace bowlers repeat their best length and understand when to change plan.",
    checklistItems: [
      "Run-up rhythm check",
      "Good length target zone",
      "Channel outside off target",
      "Yorker or slower-ball option",
      "Field plan conversation",
    ],
    notes: "Track simple outcomes: hit target, near target, miss. Keep feedback short between balls.",
  },
  {
    id: "drills-spin-control",
    sectionId: "drills",
    name: "Spin bowling control drill set",
    description: "Spin drills for pace, shape, accuracy, and batter pressure.",
    title: "Spin bowling control drill set",
    goals: "Develop spin control, variation discipline, and fields that support the bowler's method.",
    checklistItems: [
      "Stock ball target",
      "Pace/flight variation with same action",
      "Batter pressure scoring game",
      "Boundary protection scenario",
      "Review field and matchup plan",
    ],
    notes: "Encourage spin bowlers to own a simple plan before adding too many variations.",
  },
  {
    id: "drills-fielding",
    sectionId: "drills",
    name: "Catching and ground fielding drill set",
    description: "Core fielding drills for hands, body position, and release.",
    title: "Catching and ground fielding drill set",
    goals: "Build reliable fielding habits under realistic speed and movement.",
    checklistItems: [
      "Close catching hands drill",
      "High catching movement drill",
      "Long barrier and attack options",
      "Pick-up and throw release",
      "Pressure relay or run-out challenge",
    ],
    notes: "Rotate players through different angles. Reinforce body shape and communication.",
  },
  {
    id: "drills-keeping",
    sectionId: "drills",
    name: "Wicketkeeping basics drill set",
    description: "A simple wicketkeeping block for movement, takes, and standing up.",
    title: "Wicketkeeping basics drill set",
    goals: "Improve keeper movement, glove presentation, and consistency standing back/up.",
    checklistItems: [
      "Stance and balance check",
      "Take outside off and leg side",
      "Footwork to gather throws",
      "Standing up reaction takes",
      "Keeper communication reminders",
    ],
    notes: "Keep reps clean and realistic. Add fatigue only after technique is stable.",
  },
  {
    id: "team-weekly-checkin",
    sectionId: "team",
    name: "Weekly team check-in",
    description: "A short team rhythm for availability, mood, roles, and focus.",
    title: "Weekly team check-in",
    goals: "Align the team on priorities, availability, and standards for the week.",
    checklistItems: [
      "Availability and injuries reviewed",
      "Training focus shared",
      "Match or selection updates noted",
      "Player questions captured",
      "Action items assigned",
    ],
    notes: "Keep the meeting short. Capture decisions clearly so players know what happens next.",
  },
  {
    id: "team-role-assignment",
    sectionId: "team",
    name: "Match role assignment",
    description: "Assign match-day roles and responsibilities.",
    title: "Match role assignment",
    goals: "Make sure every player understands their match role and preparation responsibility.",
    checklistItems: [
      "Captain/vice-captain responsibilities",
      "Opening batting/bowling roles",
      "Middle-over and death-over plans",
      "Fielding leadership roles",
      "Warm-up and equipment responsibilities",
    ],
    notes: "Use clear roles but leave room for match conditions. Note any player development role.",
  },
  {
    id: "team-availability",
    sectionId: "team",
    name: "Player availability review",
    description: "Review squad availability and selection constraints.",
    title: "Player availability review",
    goals: "Understand who is available, limited, injured, or needs workload management.",
    checklistItems: [
      "Available players listed",
      "Unavailable players noted",
      "Injury/workload limits captured",
      "Selection gaps identified",
      "Follow-up messages sent",
    ],
    notes: "Update this before selection discussions. Keep availability separate from performance judgement.",
  },
  {
    id: "team-standards",
    sectionId: "team",
    name: "Team standards discussion",
    description: "A guided conversation on team expectations and behaviours.",
    title: "Team standards discussion",
    goals: "Agree the behaviours, communication, and effort standards expected from the group.",
    checklistItems: [
      "One positive team standard named",
      "One standard to improve named",
      "Players suggest practical actions",
      "Captain confirms message",
      "Coach records follow-up",
    ],
    notes: "Make standards observable. Avoid vague phrases unless they are linked to match/training behaviours.",
  },
  {
    id: "team-feedback",
    sectionId: "team",
    name: "Post-training feedback",
    description: "Collect coach and player feedback after training.",
    title: "Post-training feedback",
    goals: "Capture what worked, what players learned, and what should change next time.",
    checklistItems: [
      "Session goal reviewed",
      "Player feedback captured",
      "Coach observation noted",
      "Next-session adjustment chosen",
      "Individual follow-ups listed",
    ],
    notes: "Write feedback while it is fresh. Keep the next action realistic and specific.",
  },
  {
    id: "match-pre",
    sectionId: "match-notes",
    name: "Pre-match plan",
    description: "A simple match plan covering conditions, roles, and tactical priorities.",
    title: "Pre-match plan",
    goals: "Prepare the team with clear roles, conditions awareness, and simple tactical priorities.",
    checklistItems: [
      "Conditions and pitch notes",
      "Batting plan confirmed",
      "Bowling plan confirmed",
      "Fielding standards highlighted",
      "Captain message agreed",
    ],
    notes: "Keep the match plan short enough to remember. Link detailed fields in Fielding Setup if needed.",
  },
  {
    id: "match-opposition",
    sectionId: "match-notes",
    name: "Opposition analysis",
    description: "Capture opposition strengths, risks, and matchup ideas.",
    title: "Opposition analysis",
    goals: "Identify simple plans against key opposition players and team patterns.",
    checklistItems: [
      "Key batters noted",
      "Key bowlers noted",
      "Scoring areas or weaknesses identified",
      "Matchup ideas listed",
      "Fielding/bowling adjustments considered",
    ],
    notes: "Focus on usable match information, not long scouting notes. Keep plans flexible.",
  },
  {
    id: "match-bowling-innings",
    sectionId: "match-notes",
    name: "Bowling innings plan",
    description: "Plan phases, bowlers, fields, and pressure moments.",
    title: "Bowling innings plan",
    goals: "Set clear bowling-phase options and fielding priorities for powerplay, middle, and death overs.",
    checklistItems: [
      "Opening bowling plan",
      "Middle-over control plan",
      "Death-over options",
      "Boundary riders and saving-one priorities",
      "Bowler-specific scenario fields checked",
    ],
    notes: "Use the Bowler Plans area in Fielding Setup for specific bowler/matchup fields.",
  },
  {
    id: "match-batting-chase",
    sectionId: "match-notes",
    name: "Batting chase plan",
    description: "Prepare chase tempo, partnerships, and risk windows.",
    title: "Batting chase plan",
    goals: "Help batters understand required tempo, risk management, and communication through a chase.",
    checklistItems: [
      "Required rate targets by phase",
      "Powerplay scoring intent",
      "Middle-over rotation plan",
      "Boundary options and risk windows",
      "Finishing roles discussed",
    ],
    notes: "Give batters phase targets, not ball-by-ball instructions. Review after the match.",
  },
  {
    id: "match-review",
    sectionId: "match-notes",
    name: "Post-match review",
    description: "Capture learnings quickly after a match.",
    title: "Post-match review",
    goals: "Record useful learnings while they are fresh and turn them into next-session actions.",
    checklistItems: [
      "What went well",
      "Key turning point",
      "One tactical learning",
      "One skill learning",
      "Next practice action",
    ],
    notes: "Keep review constructive. Separate outcome emotion from repeatable learning.",
  },
];

const createId = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const getFieldPosition = (
  position: FieldPosition,
  isLeftHander: boolean,
  isEndOverRotated: boolean,
): FieldPosition => {
  const batterAdjusted = {
    ...position,
    x: isLeftHander ? position.x : 100 - position.x,
  };

  if (isEndOverRotated) return batterAdjusted;

  return {
    ...batterAdjusted,
    x: 100 - batterAdjusted.x,
    y: 100 - batterAdjusted.y,
  };
};

const getPositionByName = (name: string, isLeftHander: boolean, isEndOverRotated: boolean) => {
  const position = FIELD_POSITIONS.find((item) => item.name === name) ?? { name, x: 50, y: 50 };
  return getFieldPosition(position, isLeftHander, isEndOverRotated);
};

const getNearestFieldPosition = (x: number, y: number, isLeftHander: boolean, isEndOverRotated: boolean) =>
  FIELD_POSITIONS.map((position) => getFieldPosition(position, isLeftHander, isEndOverRotated)).reduce(
    (nearest, position) => {
      const distance = Math.hypot(position.x - x, position.y - y);
      if (distance < nearest.distance) {
        return { position, distance };
      }
      return nearest;
    },
    { position: getPositionByName("Point", isLeftHander, isEndOverRotated), distance: Number.POSITIVE_INFINITY },
  ).position;

const createSelectedPosition = (
  position: FieldPosition,
  isLeftHander: boolean,
  isEndOverRotated: boolean,
): SelectedPosition => ({
  id: createId(position.name),
  fielderName: "",
  ...getFieldPosition(position, isLeftHander, isEndOverRotated),
});

const createSuggestedPlayers = (isLeftHander: boolean, isEndOverRotated: boolean): SelectedPosition[] =>
  DEFAULT_SELECTION.map((name) => ({
    id: createId(name),
    fielderName: "",
    ...getPositionByName(name, isLeftHander, isEndOverRotated),
  }));

const ensureRequiredPositions = (
  selectedPlayers: SelectedPosition[],
  isLeftHander: boolean,
  isEndOverRotated: boolean,
): SelectedPosition[] => {
  const selectedNames = new Set(selectedPlayers.map((player) => player.name));
  const requiredPlayers = REQUIRED_POSITIONS.filter((name) => !selectedNames.has(name)).map((name) => ({
    id: createId(name),
    fielderName: "",
    ...getPositionByName(name, isLeftHander, isEndOverRotated),
  }));

  return [...requiredPlayers, ...selectedPlayers].slice(0, MAX_POSITIONS);
};

const drawWrappedText = (
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) => {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";

  words.forEach((word) => {
    const testLine = line ? `${line} ${word}` : word;
    if (context.measureText(testLine).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = testLine;
    }
  });

  lines.push(line);
  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((lineText, index) => {
    context.fillText(lineText, x, startY + index * lineHeight);
  });
};

const normalizeFielderName = (name: string) => name.trim().toLowerCase();

const isRequiredPosition = (name: string) => REQUIRED_POSITIONS.includes(name);

const getFieldLabel = (player: SelectedPosition) => player.fielderName.trim() || FIELD_LABELS[player.name] || player.name;

const normalizeSavedFormation = (data: unknown): SavedFormation | null => {
  if (!data || typeof data !== "object") return null;
  const formation = data as Partial<SavedFormation>;
  if (!Array.isArray(formation.players) || typeof formation.name !== "string") return null;

  const isLeftHander = typeof formation.isLeftHander === "boolean" ? formation.isLeftHander : false;
  const isEndOverRotated =
    typeof formation.isEndOverRotated === "boolean" ? formation.isEndOverRotated : false;

  return {
    id: typeof formation.id === "string" ? formation.id : `${Date.now()}-${createId(formation.name)}`,
    name: formation.name,
    teamName: typeof formation.teamName === "string" ? formation.teamName : "",
    players: ensureRequiredPositions(
      formation.players.map((player) => ({ ...player, fielderName: player.fielderName ?? "" })),
      isLeftHander,
      isEndOverRotated,
    ),
    isLeftHander,
    isEndOverRotated,
  };
};

const normalizeBowlerScenario = (data: unknown): BowlerScenario | null => {
  if (!data || typeof data !== "object") return null;
  const scenario = data as Partial<BowlerScenario>;
  if (!Array.isArray(scenario.players) || typeof scenario.name !== "string") return null;

  const isLeftHander = typeof scenario.isLeftHander === "boolean" ? scenario.isLeftHander : false;
  const isEndOverRotated =
    typeof scenario.isEndOverRotated === "boolean" ? scenario.isEndOverRotated : false;

  return {
    id: typeof scenario.id === "string" ? scenario.id : `${Date.now()}-${createId(scenario.name)}`,
    name: scenario.name,
    action: typeof scenario.action === "string" ? scenario.action : "",
    notes: typeof scenario.notes === "string" ? scenario.notes : "",
    players: ensureRequiredPositions(
      scenario.players.map((player) => ({ ...player, fielderName: player.fielderName ?? "" })),
      isLeftHander,
      isEndOverRotated,
    ),
    isLeftHander,
    isEndOverRotated,
  };
};

const normalizeBowlerPlan = (data: unknown): BowlerPlan | null => {
  if (!data || typeof data !== "object") return null;
  const plan = data as Partial<BowlerPlan>;
  if (typeof plan.bowlerName !== "string" || !Array.isArray(plan.scenarios)) return null;

  return {
    id: typeof plan.id === "string" ? plan.id : `${Date.now()}-${createId(plan.bowlerName)}`,
    bowlerName: plan.bowlerName,
    scenarios: plan.scenarios
      .map((scenario) => normalizeBowlerScenario(scenario))
      .filter((scenario): scenario is BowlerScenario => Boolean(scenario)),
  };
};

const isPlannerTemplateTab = (
  sectionId: PlannerTabId,
): sectionId is PlannerSectionId =>
  sectionId !== "overview" && sectionId !== "fielding" && sectionId !== "video-library";

const createPlannerSection = (sectionId: PlannerSectionId): PlannerSection => {
  const now = new Date().toISOString();
  const defaults = PLANNER_TEMPLATE_DEFAULTS[sectionId];

  return {
    ...defaults,
    id: `${LOCAL_WORKSPACE_ID}-${sectionId}`,
    checklistItems: defaults.checklistItems.map((item) => ({ ...item })),
    createdAt: now,
    updatedAt: now,
  };
};

const getTemplateResourceLinks = (template: PlannerTemplate): ResourceLink[] => {
  if (template.resourceLinks) return template.resourceLinks;
  if (template.sectionId === "practice" || template.sectionId === "fitness" || template.sectionId === "drills") {
    return COACHING_RESOURCE_LINKS[template.sectionId];
  }
  return [];
};

const normalizePlannerSection = (data: unknown): PlannerSection | null => {
  if (!data || typeof data !== "object") return null;
  const section = data as Partial<PlannerSection>;
  if (typeof section.sectionId !== "string" || !isPlannerTemplateTab(section.sectionId as PlannerTabId)) return null;

  const defaults = createPlannerSection(section.sectionId as PlannerSectionId);
  const checklistItems = Array.isArray(section.checklistItems)
    ? section.checklistItems
        .filter((item) => Boolean(item) && typeof item === "object")
        .map((item, index) => ({
          id: typeof (item as Partial<ChecklistItem>).id === "string" ? (item as Partial<ChecklistItem>).id! : `${defaults.id}-item-${index}`,
          text: typeof (item as Partial<ChecklistItem>).text === "string" ? (item as Partial<ChecklistItem>).text! : "",
          done: typeof (item as Partial<ChecklistItem>).done === "boolean" ? (item as Partial<ChecklistItem>).done! : false,
        }))
        .filter((item) => item.text.trim())
    : defaults.checklistItems;
  const resourceLinks = Array.isArray(section.resourceLinks)
    ? section.resourceLinks
        .filter((item) => Boolean(item) && typeof item === "object")
        .map((item) => ({
          label: typeof (item as Partial<ResourceLink>).label === "string" ? (item as Partial<ResourceLink>).label! : "",
          url: typeof (item as Partial<ResourceLink>).url === "string" ? (item as Partial<ResourceLink>).url! : "",
          description:
            typeof (item as Partial<ResourceLink>).description === "string"
              ? (item as Partial<ResourceLink>).description!
              : "",
        }))
        .filter((item) => item.label.trim() && item.url.trim())
    : defaults.resourceLinks;
  const opponentPlayers = Array.isArray(section.opponentPlayers)
    ? section.opponentPlayers
        .filter((item) => Boolean(item) && typeof item === "object")
        .map((item, index) => ({
          id:
            typeof (item as Partial<OpponentPlayer>).id === "string"
              ? (item as Partial<OpponentPlayer>).id!
              : `${defaults.id}-opponent-${index}`,
          name: typeof (item as Partial<OpponentPlayer>).name === "string" ? (item as Partial<OpponentPlayer>).name! : "",
          role: typeof (item as Partial<OpponentPlayer>).role === "string" ? (item as Partial<OpponentPlayer>).role! : "",
          strengths:
            typeof (item as Partial<OpponentPlayer>).strengths === "string"
              ? (item as Partial<OpponentPlayer>).strengths!
              : "",
          plan: typeof (item as Partial<OpponentPlayer>).plan === "string" ? (item as Partial<OpponentPlayer>).plan! : "",
        }))
    : defaults.opponentPlayers;

  return {
    ...defaults,
    id: typeof section.id === "string" ? section.id : defaults.id,
    workspaceId: typeof section.workspaceId === "string" ? section.workspaceId : LOCAL_WORKSPACE_ID,
    title: typeof section.title === "string" ? section.title : defaults.title,
    goals: typeof section.goals === "string" ? section.goals : defaults.goals,
    checklistItems,
    notes: typeof section.notes === "string" ? section.notes : defaults.notes,
    resourceLinks,
    opponentPlayers,
    createdBy: typeof section.createdBy === "string" ? section.createdBy : LOCAL_USER_ID,
    updatedBy: typeof section.updatedBy === "string" ? section.updatedBy : LOCAL_USER_ID,
    createdAt: typeof section.createdAt === "string" ? section.createdAt : defaults.createdAt,
    updatedAt: typeof section.updatedAt === "string" ? section.updatedAt : defaults.updatedAt,
  };
};

export default function App() {
  const [activeTab, setActiveTab] = useState<PlannerTabId>("overview");
  const [previewTemplateId, setPreviewTemplateId] = useState("");
  const [plannerSections, setPlannerSections] = useState<Record<string, PlannerSection>>(() =>
    Object.fromEntries(
      Object.keys(PLANNER_TEMPLATE_DEFAULTS).map((sectionId) => [
        sectionId,
        createPlannerSection(sectionId as PlannerSectionId),
      ]),
    ),
  );
  const [players, setPlayers] = useState<SelectedPosition[]>(() => ensureRequiredPositions([], false, false));
  const [savedFormations, setSavedFormations] = useState<SavedFormation[]>([]);
  const [bowlerPlans, setBowlerPlans] = useState<BowlerPlan[]>([]);
  const [activeFormationId, setActiveFormationId] = useState("");
  const [formationName, setFormationName] = useState("My Formation");
  const [teamName, setTeamName] = useState("");
  const [activeBowlerId, setActiveBowlerId] = useState("");
  const [bowlerNameDraft, setBowlerNameDraft] = useState("");
  const [activeScenarioId, setActiveScenarioId] = useState("");
  const [scenarioName, setScenarioName] = useState("");
  const [scenarioAction, setScenarioAction] = useState("");
  const [scenarioNotes, setScenarioNotes] = useState("");
  const [bowlerPlanPlayers, setBowlerPlanPlayers] = useState<SelectedPosition[]>(() =>
    ensureRequiredPositions([], false, false),
  );
  const [bowlerPlanIsLeftHander, setBowlerPlanIsLeftHander] = useState(false);
  const [bowlerPlanIsEndOverRotated, setBowlerPlanIsEndOverRotated] = useState(false);
  const [bowlerPlanDraggingId, setBowlerPlanDraggingId] = useState<string | null>(null);
  const [bowlerPlanSuggestion, setBowlerPlanSuggestion] = useState<FieldSuggestion | null>(null);
  const [isLeftHander, setIsLeftHander] = useState(false);
  const [isEndOverRotated, setIsEndOverRotated] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [fieldSuggestion, setFieldSuggestion] = useState<FieldSuggestion | null>(null);
  const fieldRef = useRef<HTMLDivElement | null>(null);
  const bowlerPlanFieldRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const plannerRaw = localStorage.getItem(PLANNER_SECTIONS_KEY);
    if (plannerRaw) {
      try {
        const savedData = JSON.parse(plannerRaw);
        if (Array.isArray(savedData)) {
          const sections = savedData
            .map((item) => normalizePlannerSection(item))
            .filter((item): item is PlannerSection => Boolean(item));
          if (sections.length) {
            setPlannerSections((prev) => ({
              ...prev,
              ...Object.fromEntries(sections.map((section) => [section.sectionId, section])),
            }));
          }
        }
      } catch {
        localStorage.removeItem(PLANNER_SECTIONS_KEY);
      }
    }

    const savedRaw = localStorage.getItem(SAVED_FORMATIONS_KEY);
    if (savedRaw) {
      try {
        const savedData = JSON.parse(savedRaw);
        if (Array.isArray(savedData)) {
          const formations = savedData
            .map((item) => normalizeSavedFormation(item))
            .filter((item): item is SavedFormation => Boolean(item));
          setSavedFormations(formations);
        }
      } catch {
        localStorage.removeItem(SAVED_FORMATIONS_KEY);
      }
    }

    const bowlerPlansRaw = localStorage.getItem(BOWLER_PLANS_KEY);
    if (bowlerPlansRaw) {
      try {
        const savedPlans = JSON.parse(bowlerPlansRaw);
        if (Array.isArray(savedPlans)) {
          const plans = savedPlans
            .map((item) => normalizeBowlerPlan(item))
            .filter((item): item is BowlerPlan => Boolean(item));
          setBowlerPlans(plans);
        }
      } catch {
        localStorage.removeItem(BOWLER_PLANS_KEY);
      }
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      const legacyFormation = normalizeSavedFormation(data);
      if (legacyFormation) {
        setPlayers(legacyFormation.players);
        setFormationName(legacyFormation.name);
        setTeamName(legacyFormation.teamName);
        setIsLeftHander(legacyFormation.isLeftHander);
        setIsEndOverRotated(legacyFormation.isEndOverRotated);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const duplicateFielderNames = useMemo(() => {
    const nameCounts = new Map<string, { displayName: string; count: number }>();

    players.forEach((player) => {
      const normalizedName = normalizeFielderName(player.fielderName);
      if (!normalizedName) return;

      const current = nameCounts.get(normalizedName);
      nameCounts.set(normalizedName, {
        displayName: current?.displayName ?? player.fielderName.trim(),
        count: (current?.count ?? 0) + 1,
      });
    });

    return Array.from(nameCounts.entries())
      .filter(([, value]) => value.count > 1)
      .map(([normalizedName, value]) => ({ normalizedName, displayName: value.displayName }));
  }, [players]);

  const duplicateNameSet = useMemo(
    () => new Set(duplicateFielderNames.map((item) => item.normalizedName)),
    [duplicateFielderNames],
  );

  const duplicateMessage = useMemo(() => {
    if (duplicateFielderNames.length === 0) return "";
    const names = duplicateFielderNames.map((item) => item.displayName).join(", ");
    return `Same player is used in two positions: ${names}`;
  }, [duplicateFielderNames]);

  const depthConflictMessages = useMemo(() => {
    const selectedPositionNames = new Set(players.map((player) => player.name));

    return Object.entries(FIELD_DEPTH_GROUPS)
      .map(([area, positions]) => {
        const selectedInArea = positions.filter((position) => selectedPositionNames.has(position));
        if (selectedInArea.length < 2) return "";
        return `Check ${area}: ${selectedInArea.join(" and ")} are both selected.`;
      })
      .filter(Boolean);
  }, [players]);

  const bowlerPlanDuplicateFielderNames = useMemo(() => {
    const nameCounts = new Map<string, { displayName: string; count: number }>();

    bowlerPlanPlayers.forEach((player) => {
      const normalizedName = normalizeFielderName(player.fielderName);
      if (!normalizedName) return;

      const current = nameCounts.get(normalizedName);
      nameCounts.set(normalizedName, {
        displayName: current?.displayName ?? player.fielderName.trim(),
        count: (current?.count ?? 0) + 1,
      });
    });

    return Array.from(nameCounts.entries())
      .filter(([, value]) => value.count > 1)
      .map(([normalizedName, value]) => ({ normalizedName, displayName: value.displayName }));
  }, [bowlerPlanPlayers]);

  const bowlerPlanDuplicateNameSet = useMemo(
    () => new Set(bowlerPlanDuplicateFielderNames.map((item) => item.normalizedName)),
    [bowlerPlanDuplicateFielderNames],
  );

  const bowlerPlanDuplicateMessage = useMemo(() => {
    if (bowlerPlanDuplicateFielderNames.length === 0) return "";
    const names = bowlerPlanDuplicateFielderNames.map((item) => item.displayName).join(", ");
    return `Same player is used in two positions: ${names}`;
  }, [bowlerPlanDuplicateFielderNames]);

  const bowlerPlanDepthConflictMessages = useMemo(() => {
    const selectedPositionNames = new Set(bowlerPlanPlayers.map((player) => player.name));

    return Object.entries(FIELD_DEPTH_GROUPS)
      .map(([area, positions]) => {
        const selectedInArea = positions.filter((position) => selectedPositionNames.has(position));
        if (selectedInArea.length < 2) return "";
        return `Check ${area}: ${selectedInArea.join(" and ")} are both selected.`;
      })
      .filter(Boolean);
  }, [bowlerPlanPlayers]);

  const activeBowlerPlan = useMemo(
    () => bowlerPlans.find((plan) => plan.id === activeBowlerId),
    [activeBowlerId, bowlerPlans],
  );

  const activeScenario = useMemo(
    () => activeBowlerPlan?.scenarios.find((scenario) => scenario.id === activeScenarioId),
    [activeBowlerPlan, activeScenarioId],
  );

  const persistBowlerPlans = (next: BowlerPlan[]) => {
    localStorage.setItem(BOWLER_PLANS_KEY, JSON.stringify(next));
    setBowlerPlans(next);
  };

  const persistPlannerSections = (next: Record<string, PlannerSection>) => {
    localStorage.setItem(PLANNER_SECTIONS_KEY, JSON.stringify(Object.values(next)));
    setPlannerSections(next);
  };

  const updatePlannerSection = (
    sectionId: PlannerSectionId,
    updates: Partial<
      Pick<PlannerSection, "title" | "goals" | "notes" | "checklistItems" | "resourceLinks" | "opponentPlayers">
    >,
  ) => {
    const current = plannerSections[sectionId] ?? createPlannerSection(sectionId);
    persistPlannerSections({
      ...plannerSections,
      [sectionId]: {
        ...current,
        ...updates,
        updatedBy: LOCAL_USER_ID,
        updatedAt: new Date().toISOString(),
      },
    });
  };

  const addChecklistItem = (sectionId: PlannerSectionId) => {
    const current = plannerSections[sectionId] ?? createPlannerSection(sectionId);
    updatePlannerSection(sectionId, {
      checklistItems: [
        ...current.checklistItems,
        {
          id: `${sectionId}-${Date.now()}`,
          text: "New checklist item",
          done: false,
        },
      ],
    });
  };

  const applyPlannerTemplate = (template: PlannerTemplate) => {
    updatePlannerSection(template.sectionId, {
      title: template.title,
      goals: template.goals,
      checklistItems: template.checklistItems.map((text, index) => ({
        id: `${template.id}-item-${index}`,
        text,
        done: false,
      })),
      notes: template.notes,
      resourceLinks: getTemplateResourceLinks(template),
    });
    setPreviewTemplateId("");
  };

  const updateChecklistItem = (
    sectionId: PlannerSectionId,
    itemId: string,
    updates: Partial<ChecklistItem>,
  ) => {
    const current = plannerSections[sectionId] ?? createPlannerSection(sectionId);
    updatePlannerSection(sectionId, {
      checklistItems: current.checklistItems.map((item) =>
        item.id === itemId ? { ...item, ...updates } : item,
      ),
    });
  };

  const removeChecklistItem = (sectionId: PlannerSectionId, itemId: string) => {
    const current = plannerSections[sectionId] ?? createPlannerSection(sectionId);
    updatePlannerSection(sectionId, {
      checklistItems: current.checklistItems.filter((item) => item.id !== itemId),
    });
  };

  const addOpponentPlayer = () => {
    const current = plannerSections["match-notes"] ?? createPlannerSection("match-notes");
    updatePlannerSection("match-notes", {
      opponentPlayers: [
        ...current.opponentPlayers,
        {
          id: `opponent-${Date.now()}`,
          name: "",
          role: "",
          strengths: "",
          plan: "",
        },
      ],
    });
  };

  const updateOpponentPlayer = (id: string, updates: Partial<Omit<OpponentPlayer, "id">>) => {
    const current = plannerSections["match-notes"] ?? createPlannerSection("match-notes");
    updatePlannerSection("match-notes", {
      opponentPlayers: current.opponentPlayers.map((player) =>
        player.id === id ? { ...player, ...updates } : player,
      ),
    });
  };

  const removeOpponentPlayer = (id: string) => {
    const current = plannerSections["match-notes"] ?? createPlannerSection("match-notes");
    updatePlannerSection("match-notes", {
      opponentPlayers: current.opponentPlayers.filter((player) => player.id !== id),
    });
  };

  const saveFormation = () => {
    if (duplicateMessage) {
      alert(duplicateMessage);
      return;
    }

    const savedFormation: SavedFormation = {
      id: activeFormationId || `${Date.now()}-${createId(formationName || "formation")}`,
      name: formationName.trim() || "Untitled Formation",
      teamName: teamName.trim(),
      players,
      isLeftHander,
      isEndOverRotated,
    };

    setSavedFormations((prev) => {
      const next = activeFormationId
        ? prev.map((formation) => (formation.id === activeFormationId ? savedFormation : formation))
        : [...prev, savedFormation];
      localStorage.setItem(SAVED_FORMATIONS_KEY, JSON.stringify(next));
      return next;
    });
    setActiveFormationId(savedFormation.id);
    alert(activeFormationId ? "Formation updated locally" : "Formation saved locally");
  };

  const saveFormationAsNew = () => {
    if (duplicateMessage) {
      alert(duplicateMessage);
      return;
    }

    const savedFormation: SavedFormation = {
      id: `${Date.now()}-${createId(formationName || "formation")}`,
      name: formationName.trim() || "Untitled Formation",
      teamName: teamName.trim(),
      players,
      isLeftHander,
      isEndOverRotated,
    };

    setSavedFormations((prev) => {
      const next = [...prev, savedFormation];
      localStorage.setItem(SAVED_FORMATIONS_KEY, JSON.stringify(next));
      return next;
    });
    setActiveFormationId(savedFormation.id);
    alert("Formation saved locally");
  };

  const loadFormation = (id: string) => {
    const savedFormation = savedFormations.find((formation) => formation.id === id);
    if (!savedFormation) return;

    setActiveFormationId(savedFormation.id);
    setFormationName(savedFormation.name);
    setTeamName(savedFormation.teamName);
    setPlayers(savedFormation.players);
    setIsLeftHander(savedFormation.isLeftHander);
    setIsEndOverRotated(savedFormation.isEndOverRotated);
  };

  const deleteFormation = () => {
    if (!activeFormationId) return;

    setSavedFormations((prev) => {
      const next = prev.filter((formation) => formation.id !== activeFormationId);
      localStorage.setItem(SAVED_FORMATIONS_KEY, JSON.stringify(next));
      return next;
    });
    setActiveFormationId("");
    alert("Formation deleted locally");
  };

  const selectBowlerPlan = (id: string) => {
    const plan = bowlerPlans.find((item) => item.id === id);
    setActiveBowlerId(id);
    setBowlerNameDraft(plan?.bowlerName ?? "");
    setActiveScenarioId("");
    setScenarioName("");
    setScenarioAction("");
    setScenarioNotes("");
  };

  const saveBowlerPlan = () => {
    const nextBowlerName = bowlerNameDraft.trim();
    if (!nextBowlerName) {
      alert("Enter a bowler name first");
      return;
    }

    if (activeBowlerId) {
      const next = bowlerPlans.map((plan) =>
        plan.id === activeBowlerId ? { ...plan, bowlerName: nextBowlerName } : plan,
      );
      persistBowlerPlans(next);
      alert("Bowler updated locally");
      return;
    }

    const newPlan: BowlerPlan = {
      id: `${Date.now()}-${createId(nextBowlerName || "bowler")}`,
      bowlerName: nextBowlerName,
      scenarios: [],
    };
    persistBowlerPlans([...bowlerPlans, newPlan]);
    setActiveBowlerId(newPlan.id);
    alert("Bowler saved locally");
  };

  const deleteBowlerPlan = () => {
    if (!activeBowlerId) return;
    const next = bowlerPlans.filter((plan) => plan.id !== activeBowlerId);
    persistBowlerPlans(next);
    setActiveBowlerId("");
    setBowlerNameDraft("");
    setActiveScenarioId("");
    setScenarioName("");
    setScenarioAction("");
    setScenarioNotes("");
    alert("Bowler plan deleted locally");
  };

  const selectScenario = (id: string) => {
    const scenario = activeBowlerPlan?.scenarios.find((item) => item.id === id);
    setActiveScenarioId(id);
    setScenarioName(scenario?.name ?? "");
    setScenarioAction(scenario?.action ?? "");
    setScenarioNotes(scenario?.notes ?? "");
  };

  const saveBowlerScenario = () => {
    if (bowlerPlanDuplicateMessage) {
      alert(bowlerPlanDuplicateMessage);
      return;
    }

    const nextBowlerName = bowlerNameDraft.trim();
    const nextScenarioName = scenarioName.trim();

    if (!nextBowlerName) {
      alert("Enter a bowler name first");
      return;
    }

    if (!nextScenarioName) {
      alert("Enter a scenario name first");
      return;
    }

    const scenario: BowlerScenario = {
      id: activeScenarioId || `${Date.now()}-${createId(nextScenarioName || "scenario")}`,
      name: nextScenarioName,
      action: scenarioAction.trim(),
      notes: scenarioNotes.trim(),
      players: bowlerPlanPlayers,
      isLeftHander: bowlerPlanIsLeftHander,
      isEndOverRotated: bowlerPlanIsEndOverRotated,
    };

    let nextActiveBowlerId = activeBowlerId;
    const existingPlan = bowlerPlans.find((plan) => plan.id === activeBowlerId);
    let nextPlans: BowlerPlan[];

    if (existingPlan) {
      nextPlans = bowlerPlans.map((plan) => {
        if (plan.id !== existingPlan.id) return plan;
        const hasScenario = plan.scenarios.some((item) => item.id === scenario.id);
        return {
          ...plan,
          bowlerName: nextBowlerName,
          scenarios: hasScenario
            ? plan.scenarios.map((item) => (item.id === scenario.id ? scenario : item))
            : [...plan.scenarios, scenario],
        };
      });
    } else {
      const newPlan: BowlerPlan = {
        id: `${Date.now()}-${createId(nextBowlerName || "bowler")}`,
        bowlerName: nextBowlerName,
        scenarios: [scenario],
      };
      nextActiveBowlerId = newPlan.id;
      nextPlans = [...bowlerPlans, newPlan];
    }

    persistBowlerPlans(nextPlans);
    setActiveBowlerId(nextActiveBowlerId);
    setActiveScenarioId(scenario.id);
    alert(activeScenarioId ? "Scenario updated locally" : "Scenario saved locally");
  };

  const loadBowlerScenario = () => {
    if (!activeScenario) return;
    setBowlerPlanPlayers(
      ensureRequiredPositions(activeScenario.players, activeScenario.isLeftHander, activeScenario.isEndOverRotated),
    );
    setBowlerPlanIsLeftHander(activeScenario.isLeftHander);
    setBowlerPlanIsEndOverRotated(activeScenario.isEndOverRotated);
    setBowlerPlanSuggestion(null);
  };

  const deleteBowlerScenario = () => {
    if (!activeBowlerPlan || !activeScenarioId) return;

    const next = bowlerPlans.map((plan) =>
      plan.id === activeBowlerPlan.id
        ? { ...plan, scenarios: plan.scenarios.filter((scenario) => scenario.id !== activeScenarioId) }
        : plan,
    );
    persistBowlerPlans(next);
    setActiveScenarioId("");
    setScenarioName("");
    setScenarioAction("");
    setScenarioNotes("");
    alert("Scenario deleted locally");
  };

  const exportFormationImage = async () => {
    const size = 1200;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size + 150;
    const context = canvas.getContext("2d");
    if (!context) return;

    context.fillStyle = "#f4f7fb";
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = "#102a43";
    context.font = "700 42px Inter, Arial, sans-serif";
    context.textAlign = "center";
    context.fillText(teamName || formationName || "Field Formation", size / 2, 58);

    context.fillStyle = "#486581";
    context.font = "500 24px Inter, Arial, sans-serif";
    context.fillText(
      `${teamName ? `${formationName || "Field Formation"} - ` : ""}${isLeftHander ? "Left" : "Right"}-hand batter${
        isEndOverRotated ? " - end of over" : ""
      }`,
      size / 2,
      96,
    );

    const fieldTop = 130;
    const center = size / 2;
    const radius = size * 0.46;
    const gradient = context.createRadialGradient(center, fieldTop + center, 40, center, fieldTop + center, radius);
    gradient.addColorStop(0, "#4caf50");
    gradient.addColorStop(0.7, "#338a3e");
    gradient.addColorStop(1, "#276d31");

    context.beginPath();
    context.arc(center, fieldTop + center, radius, 0, Math.PI * 2);
    context.fillStyle = gradient;
    context.fill();
    context.lineWidth = 18;
    context.strokeStyle = "#f7f7f2";
    context.stroke();
    context.lineWidth = 6;
    context.strokeStyle = "#1d5a26";
    context.stroke();

    context.beginPath();
    context.arc(center, fieldTop + center, radius * 0.44, 0, Math.PI * 2);
    context.setLineDash([16, 16]);
    context.lineWidth = 4;
    context.strokeStyle = "rgba(255, 255, 255, 0.65)";
    context.stroke();
    context.setLineDash([]);

    context.beginPath();
    context.arc(center, fieldTop + center, radius * 0.72, 0, Math.PI * 2);
    context.lineWidth = 4;
    context.strokeStyle = "rgba(255, 255, 255, 0.14)";
    context.stroke();

    const pitchWidth = size * 0.11;
    const pitchHeight = size * 0.27;
    const pitchLeft = center - pitchWidth / 2;
    const pitchTop = fieldTop + center - pitchHeight / 2;
    context.fillStyle = "#c8a06a";
    context.strokeStyle = "#a47e4f";
    context.lineWidth = 4;
    context.beginPath();
    context.roundRect(pitchLeft, pitchTop, pitchWidth, pitchHeight, 16);
    context.fill();
    context.stroke();

    context.strokeStyle = "rgba(255, 255, 255, 0.85)";
    context.lineWidth = 5;
    [pitchTop + pitchHeight * 0.16, pitchTop + pitchHeight * 0.84].forEach((creaseY) => {
      context.beginPath();
      context.moveTo(pitchLeft - pitchWidth * 0.35, creaseY);
      context.lineTo(pitchLeft + pitchWidth * 1.35, creaseY);
      context.stroke();

      context.beginPath();
      context.moveTo(center - pitchWidth * 0.25, creaseY - pitchHeight * 0.08);
      context.lineTo(center - pitchWidth * 0.25, creaseY + pitchHeight * 0.08);
      context.moveTo(center + pitchWidth * 0.25, creaseY - pitchHeight * 0.08);
      context.lineTo(center + pitchWidth * 0.25, creaseY + pitchHeight * 0.08);
      context.stroke();
    });

    context.strokeStyle = "#fff7d6";
    context.lineWidth = 4;
    [pitchTop + pitchHeight * 0.1, pitchTop + pitchHeight * 0.9].forEach((stumpY) => {
      [-0.12, 0, 0.12].forEach((offset) => {
        context.beginPath();
        context.moveTo(center + pitchWidth * offset, stumpY - pitchHeight * 0.035);
        context.lineTo(center + pitchWidth * offset, stumpY + pitchHeight * 0.035);
        context.stroke();
      });
    });

    const drawBatter = (x: number, y: number, direction: 1 | -1) => {
      context.fillStyle = "#f7f7f2";
      context.strokeStyle = "#12355b";
      context.lineWidth = 4;

      context.beginPath();
      context.arc(x, y - 18 * direction, 10, 0, Math.PI * 2);
      context.fill();
      context.stroke();

      context.beginPath();
      context.moveTo(x, y - 8 * direction);
      context.lineTo(x, y + 34 * direction);
      context.lineTo(x - 14, y + 52 * direction);
      context.moveTo(x, y + 34 * direction);
      context.lineTo(x + 14, y + 52 * direction);
      context.moveTo(x, y + 4 * direction);
      context.lineTo(x - 18, y + 20 * direction);
      context.moveTo(x, y + 4 * direction);
      context.lineTo(x + 18, y + 20 * direction);
      context.stroke();

      context.strokeStyle = "#d8a13d";
      context.lineWidth = 5;
      context.beginPath();
      context.moveTo(x + 24, y + 8 * direction);
      context.lineTo(x + 42, y + 46 * direction);
      context.stroke();
    };

    drawBatter(center + pitchWidth * 0.8, pitchTop + pitchHeight * 0.18, 1);
    drawBatter(center - pitchWidth * 0.8, pitchTop + pitchHeight * 0.82, -1);

    players.forEach((player) => {
      const x = (player.x / 100) * size;
      const y = fieldTop + (player.y / 100) * size;
      const markerRadius = 48;
      const label = getFieldLabel(player);

      context.beginPath();
      context.arc(x, y, markerRadius, 0, Math.PI * 2);
      context.fillStyle = "#ffffff";
      context.fill();
      context.lineWidth = 5;
      context.strokeStyle = "#0b3d91";
      context.stroke();

      context.fillStyle = "#0b3d91";
      context.font = "800 18px Inter, Arial, sans-serif";
      context.textAlign = "center";
      context.textBaseline = "middle";
      drawWrappedText(context, label, x, y, markerRadius * 1.45, 20);
    });

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) return;

    const fileName = `${createId(formationName || "field-formation")}.png`;
    const file = new File([blob], fileName, { type: "image/png" });

    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: teamName || formationName || "Field Formation" });
      return;
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const resetFormation = () => {
    setPlayers(createSuggestedPlayers(isLeftHander, isEndOverRotated));
  };

  const applyPreset = (presetId: string) => {
    const preset = FIELD_PRESETS.find((item) => item.id === presetId);
    if (!preset) return;

    const currentNames = new Map(players.map((player) => [player.name, player.fielderName]));
    setPlayers(
      ensureRequiredPositions(
        preset.positions.map((name) => ({
        id: createId(name),
        fielderName: currentNames.get(name) ?? "",
        ...getPositionByName(name, isLeftHander, isEndOverRotated),
        })),
        isLeftHander,
        isEndOverRotated,
      ),
    );
  };

  const addPosition = (position: FieldPosition) => {
    if (players.length >= MAX_POSITIONS || players.some((player) => player.name === position.name)) return;
    setPlayers((prev) => [...prev, createSelectedPosition(position, isLeftHander, isEndOverRotated)]);
  };

  const addSuggestedPosition = () => {
    if (!fieldSuggestion) return;
    const { position } = fieldSuggestion;

    if (players.some((player) => player.name === position.name)) {
      alert(`${position.name} is already selected`);
      setFieldSuggestion(null);
      return;
    }

    if (players.length >= MAX_POSITIONS) {
      alert("11 fielders are there, please remove one to add another");
      setFieldSuggestion(null);
      return;
    }

    setPlayers((prev) => [
      ...prev,
      {
        id: createId(position.name),
        fielderName: "",
        ...position,
      },
    ]);
    setFieldSuggestion(null);
  };

  const togglePosition = (position: FieldPosition) => {
    if (isRequiredPosition(position.name)) return;
    const selectedPlayer = players.find((player) => player.name === position.name);
    if (selectedPlayer) {
      removePosition(selectedPlayer.id);
      return;
    }

    addPosition(position);
  };

  const removePosition = (id: string) => {
    setPlayers((prev) => prev.filter((player) => player.id !== id || isRequiredPosition(player.name)));
  };

  const renameFielder = (id: string, fielderName: string) => {
    setPlayers((prev) => prev.map((player) => (player.id === id ? { ...player, fielderName } : player)));
  };

  const handleFielderChipDragStart = (event: React.DragEvent<HTMLButtonElement>, id: string, fielderName: string) => {
    const sourcePlayer = players.find((player) => player.id === id);
    if (sourcePlayer && isRequiredPosition(sourcePlayer.name)) {
      event.preventDefault();
      return;
    }

    const trimmedName = fielderName.trim();
    if (!trimmedName) return;
    event.dataTransfer.setData("application/x-fielder-id", id);
    event.dataTransfer.setData("text/plain", trimmedName);
    event.dataTransfer.effectAllowed = "move";
  };

  const handleFielderDrop = (event: React.DragEvent<HTMLInputElement>, targetId: string) => {
    event.preventDefault();
    const sourceId = event.dataTransfer.getData("application/x-fielder-id");
    const droppedName = event.dataTransfer.getData("text/plain").trim();
    if (!droppedName || sourceId === targetId) return;

    setPlayers((prev) => {
      const sourcePlayer = prev.find((player) => player.id === sourceId);
      const targetPlayer = prev.find((player) => player.id === targetId);
      if (
        (sourcePlayer && isRequiredPosition(sourcePlayer.name)) ||
        (targetPlayer && isRequiredPosition(targetPlayer.name))
      ) {
        return prev;
      }

      const targetName = targetPlayer?.fielderName ?? "";

      return prev.map((player) => {
        if (player.id === targetId) return { ...player, fielderName: droppedName };
        if (sourceId && player.id === sourceId) return { ...player, fielderName: targetName };
        return player;
      });
    });
  };

  const changeBatterHand = (nextIsLeftHander: boolean) => {
    setFieldSuggestion(null);
    setIsLeftHander(nextIsLeftHander);
    setPlayers((prev) =>
      prev.map((player) => ({
        ...player,
        ...getPositionByName(player.name, nextIsLeftHander, isEndOverRotated),
      })),
    );
  };

  const changeEndOverRotation = (nextIsEndOverRotated: boolean) => {
    setFieldSuggestion(null);
    setIsEndOverRotated(nextIsEndOverRotated);
    setPlayers((prev) =>
      prev.map((player) => ({
        ...player,
        ...getPositionByName(player.name, isLeftHander, nextIsEndOverRotated),
      })),
    );
  };

  const handlePointerMove = (e: React.PointerEvent, id: string) => {
    if (draggingId !== id || !fieldRef.current) return;
    const movingPlayer = players.find((player) => player.id === id);
    if (movingPlayer && isRequiredPosition(movingPlayer.name)) return;

    const rect = fieldRef.current.getBoundingClientRect();
    let x = ((e.clientX - rect.left) / rect.width) * 100;
    let y = ((e.clientY - rect.top) / rect.height) * 100;

    x = Math.max(4, Math.min(96, x));
    y = Math.max(4, Math.min(96, y));

    setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, x, y } : p)));
  };

  const suggestFieldPosition = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!fieldRef.current || draggingId) return;
    const target = event.target as HTMLElement;
    if (target.closest(".player") || target.closest(".assignmentConfirm")) return;

    if (players.length >= MAX_POSITIONS) {
      alert("11 fielders are there, please remove one to add another");
      setFieldSuggestion(null);
      return;
    }

    const rect = fieldRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    const position = getNearestFieldPosition(x, y, isLeftHander, isEndOverRotated);

    setFieldSuggestion({
      position,
      x: Math.max(14, Math.min(86, x)),
      y: Math.max(12, Math.min(88, y)),
    });
  };

  const snapPlayerToNearestPosition = (id: string) => {
    setPlayers((prev) => {
      const draggedPlayer = prev.find((player) => player.id === id);
      if (!draggedPlayer) return prev;
      if (isRequiredPosition(draggedPlayer.name)) return prev;

      const nearestPosition = getNearestFieldPosition(
        draggedPlayer.x,
        draggedPlayer.y,
        isLeftHander,
        isEndOverRotated,
      );
      const draggedOriginalPosition = getPositionByName(draggedPlayer.name, isLeftHander, isEndOverRotated);
      const existingAtNearest = prev.find(
        (player) => player.id !== id && player.name === nearestPosition.name,
      );
      if (isRequiredPosition(nearestPosition.name) || (existingAtNearest && isRequiredPosition(existingAtNearest.name))) {
        return prev.map((player) =>
          player.id === id
            ? {
                ...player,
                x: draggedOriginalPosition.x,
                y: draggedOriginalPosition.y,
              }
            : player,
        );
      }

      return prev.map((player) => {
        if (player.id === id) {
          return {
            ...player,
            id: existingAtNearest ? player.id : createId(nearestPosition.name),
            name: nearestPosition.name,
            x: nearestPosition.x,
            y: nearestPosition.y,
          };
        }

        if (existingAtNearest && player.id === existingAtNearest.id) {
          return {
            ...player,
            name: draggedPlayer.name,
            x: draggedOriginalPosition.x,
            y: draggedOriginalPosition.y,
          };
        }

        return player;
      });
    });
  };

  const resetBowlerPlanFormation = () => {
    setBowlerPlanPlayers(createSuggestedPlayers(bowlerPlanIsLeftHander, bowlerPlanIsEndOverRotated));
    setBowlerPlanSuggestion(null);
  };

  const copyTeamFieldToBowlerPlan = () => {
    setBowlerPlanPlayers(players);
    setBowlerPlanIsLeftHander(isLeftHander);
    setBowlerPlanIsEndOverRotated(isEndOverRotated);
    setBowlerPlanSuggestion(null);
  };

  const applyBowlerPlanPreset = (presetId: string) => {
    if (presetId === "team-field") {
      copyTeamFieldToBowlerPlan();
      return;
    }

    const preset = FIELD_PRESETS.find((item) => item.id === presetId);
    if (!preset) return;

    const currentNames = new Map(bowlerPlanPlayers.map((player) => [player.name, player.fielderName]));
    setBowlerPlanPlayers(
      ensureRequiredPositions(
        preset.positions.map((name) => ({
          id: createId(name),
          fielderName: currentNames.get(name) ?? "",
          ...getPositionByName(name, bowlerPlanIsLeftHander, bowlerPlanIsEndOverRotated),
        })),
        bowlerPlanIsLeftHander,
        bowlerPlanIsEndOverRotated,
      ),
    );
    setBowlerPlanSuggestion(null);
  };

  const addBowlerPlanPosition = (position: FieldPosition) => {
    if (
      bowlerPlanPlayers.length >= MAX_POSITIONS ||
      bowlerPlanPlayers.some((player) => player.name === position.name)
    ) {
      return;
    }
    setBowlerPlanPlayers((prev) => [
      ...prev,
      createSelectedPosition(position, bowlerPlanIsLeftHander, bowlerPlanIsEndOverRotated),
    ]);
  };

  const addBowlerPlanSuggestedPosition = () => {
    if (!bowlerPlanSuggestion) return;
    const { position } = bowlerPlanSuggestion;

    if (bowlerPlanPlayers.some((player) => player.name === position.name)) {
      alert(`${position.name} is already selected`);
      setBowlerPlanSuggestion(null);
      return;
    }

    if (bowlerPlanPlayers.length >= MAX_POSITIONS) {
      alert("11 fielders are there, please remove one to add another");
      setBowlerPlanSuggestion(null);
      return;
    }

    setBowlerPlanPlayers((prev) => [
      ...prev,
      {
        id: createId(position.name),
        fielderName: "",
        ...position,
      },
    ]);
    setBowlerPlanSuggestion(null);
  };

  const toggleBowlerPlanPosition = (position: FieldPosition) => {
    if (isRequiredPosition(position.name)) return;
    const selectedPlayer = bowlerPlanPlayers.find((player) => player.name === position.name);
    if (selectedPlayer) {
      removeBowlerPlanPosition(selectedPlayer.id);
      return;
    }

    addBowlerPlanPosition(position);
  };

  const removeBowlerPlanPosition = (id: string) => {
    setBowlerPlanPlayers((prev) =>
      prev.filter((player) => player.id !== id || isRequiredPosition(player.name)),
    );
  };

  const renameBowlerPlanFielder = (id: string, fielderName: string) => {
    setBowlerPlanPlayers((prev) =>
      prev.map((player) => (player.id === id ? { ...player, fielderName } : player)),
    );
  };

  const handleBowlerPlanFielderChipDragStart = (
    event: React.DragEvent<HTMLButtonElement>,
    id: string,
    fielderName: string,
  ) => {
    const sourcePlayer = bowlerPlanPlayers.find((player) => player.id === id);
    if (sourcePlayer && isRequiredPosition(sourcePlayer.name)) {
      event.preventDefault();
      return;
    }

    const trimmedName = fielderName.trim();
    if (!trimmedName) return;
    event.dataTransfer.setData("application/x-fielder-id", id);
    event.dataTransfer.setData("text/plain", trimmedName);
    event.dataTransfer.effectAllowed = "move";
  };

  const handleBowlerPlanFielderDrop = (event: React.DragEvent<HTMLInputElement>, targetId: string) => {
    event.preventDefault();
    const sourceId = event.dataTransfer.getData("application/x-fielder-id");
    const droppedName = event.dataTransfer.getData("text/plain").trim();
    if (!droppedName || sourceId === targetId) return;

    setBowlerPlanPlayers((prev) => {
      const sourcePlayer = prev.find((player) => player.id === sourceId);
      const targetPlayer = prev.find((player) => player.id === targetId);
      if (
        (sourcePlayer && isRequiredPosition(sourcePlayer.name)) ||
        (targetPlayer && isRequiredPosition(targetPlayer.name))
      ) {
        return prev;
      }

      const targetName = targetPlayer?.fielderName ?? "";

      return prev.map((player) => {
        if (player.id === targetId) return { ...player, fielderName: droppedName };
        if (sourceId && player.id === sourceId) return { ...player, fielderName: targetName };
        return player;
      });
    });
  };

  const changeBowlerPlanBatterHand = (nextIsLeftHander: boolean) => {
    setBowlerPlanSuggestion(null);
    setBowlerPlanIsLeftHander(nextIsLeftHander);
    setBowlerPlanPlayers((prev) =>
      prev.map((player) => ({
        ...player,
        ...getPositionByName(player.name, nextIsLeftHander, bowlerPlanIsEndOverRotated),
      })),
    );
  };

  const changeBowlerPlanEndOverRotation = (nextIsEndOverRotated: boolean) => {
    setBowlerPlanSuggestion(null);
    setBowlerPlanIsEndOverRotated(nextIsEndOverRotated);
    setBowlerPlanPlayers((prev) =>
      prev.map((player) => ({
        ...player,
        ...getPositionByName(player.name, bowlerPlanIsLeftHander, nextIsEndOverRotated),
      })),
    );
  };

  const handleBowlerPlanPointerMove = (e: React.PointerEvent, id: string) => {
    if (bowlerPlanDraggingId !== id || !bowlerPlanFieldRef.current) return;
    const movingPlayer = bowlerPlanPlayers.find((player) => player.id === id);
    if (movingPlayer && isRequiredPosition(movingPlayer.name)) return;

    const rect = bowlerPlanFieldRef.current.getBoundingClientRect();
    let x = ((e.clientX - rect.left) / rect.width) * 100;
    let y = ((e.clientY - rect.top) / rect.height) * 100;

    x = Math.max(4, Math.min(96, x));
    y = Math.max(4, Math.min(96, y));

    setBowlerPlanPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, x, y } : p)));
  };

  const suggestBowlerPlanFieldPosition = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!bowlerPlanFieldRef.current || bowlerPlanDraggingId) return;
    const target = event.target as HTMLElement;
    if (target.closest(".player") || target.closest(".assignmentConfirm")) return;

    if (bowlerPlanPlayers.length >= MAX_POSITIONS) {
      alert("11 fielders are there, please remove one to add another");
      setBowlerPlanSuggestion(null);
      return;
    }

    const rect = bowlerPlanFieldRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    const position = getNearestFieldPosition(x, y, bowlerPlanIsLeftHander, bowlerPlanIsEndOverRotated);

    setBowlerPlanSuggestion({
      position,
      x: Math.max(14, Math.min(86, x)),
      y: Math.max(12, Math.min(88, y)),
    });
  };

  const snapBowlerPlanPlayerToNearestPosition = (id: string) => {
    setBowlerPlanPlayers((prev) => {
      const draggedPlayer = prev.find((player) => player.id === id);
      if (!draggedPlayer) return prev;
      if (isRequiredPosition(draggedPlayer.name)) return prev;

      const nearestPosition = getNearestFieldPosition(
        draggedPlayer.x,
        draggedPlayer.y,
        bowlerPlanIsLeftHander,
        bowlerPlanIsEndOverRotated,
      );
      const draggedOriginalPosition = getPositionByName(
        draggedPlayer.name,
        bowlerPlanIsLeftHander,
        bowlerPlanIsEndOverRotated,
      );
      const existingAtNearest = prev.find(
        (player) => player.id !== id && player.name === nearestPosition.name,
      );
      if (isRequiredPosition(nearestPosition.name) || (existingAtNearest && isRequiredPosition(existingAtNearest.name))) {
        return prev.map((player) =>
          player.id === id
            ? {
                ...player,
                x: draggedOriginalPosition.x,
                y: draggedOriginalPosition.y,
              }
            : player,
        );
      }

      return prev.map((player) => {
        if (player.id === id) {
          return {
            ...player,
            id: existingAtNearest ? player.id : createId(nearestPosition.name),
            name: nearestPosition.name,
            x: nearestPosition.x,
            y: nearestPosition.y,
          };
        }

        if (existingAtNearest && player.id === existingAtNearest.id) {
          return {
            ...player,
            name: draggedPlayer.name,
            x: draggedOriginalPosition.x,
            y: draggedOriginalPosition.y,
          };
        }

        return player;
      });
    });
  };

  const selectedNames = useMemo(() => new Set(players.map((player) => player.name)), [players]);
  const bowlerPlanSelectedNames = useMemo(
    () => new Set(bowlerPlanPlayers.map((player) => player.name)),
    [bowlerPlanPlayers],
  );
  const title = useMemo(
    () =>
      `${formationName} - ${isLeftHander ? "Left" : "Right"}-hand batter${
        isEndOverRotated ? " - End over rotated" : ""
      } - ODI/T20 Field Planner`,
    [formationName, isLeftHander, isEndOverRotated],
  );
  const activePlannerTab = PLANNER_TABS.find((tab) => tab.id === activeTab) ?? PLANNER_TABS[0];
  const templateSectionId = isPlannerTemplateTab(activeTab) ? activeTab : null;
  const templateSection = templateSectionId ? plannerSections[templateSectionId] ?? createPlannerSection(templateSectionId) : null;
  const availableTemplates = templateSectionId
    ? COACH_TEMPLATES.filter((template) => template.sectionId === templateSectionId)
    : [];
  const previewTemplate = availableTemplates.find((template) => template.id === previewTemplateId) ?? null;
  const recentPlannerSections = Object.values(plannerSections)
    .filter((section) => isPlannerTemplateTab(section.sectionId))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 3);
  const activePlannerGroup =
    PLANNER_GROUPS.find((group) => group.tabs.includes(activeTab)) ?? PLANNER_GROUPS[0];
  const activeGroupTabs = activePlannerGroup.tabs
    .map((tabId) => PLANNER_TABS.find((tab) => tab.id === tabId))
    .filter((tab): tab is PlannerTab => Boolean(tab));
  const switchPlannerTab = (tabId: PlannerTabId) => {
    setActiveTab(tabId);
    setPreviewTemplateId("");
  };
  const switchPlannerGroup = (group: PlannerGroup) => {
    if (group.tabs.includes(activeTab)) {
      return;
    }

    switchPlannerTab(group.tabs[0]);
  };

  return (
    <main className="app">
      <header className="plannerHeader">
        <div>
          <p>Cricket Team Planner</p>
          <h1>{activePlannerTab.label}</h1>
        </div>
        <span>Local coach workspace</span>
      </header>

      <nav className="plannerNav" aria-label="Cricket team planner navigation">
        <div className="plannerGroupTabs" role="tablist" aria-label="Planner groups">
          {PLANNER_GROUPS.map((group) => (
            <button
              key={group.id}
              type="button"
              className={activePlannerGroup.id === group.id ? "active" : ""}
              onClick={() => switchPlannerGroup(group)}
            >
              {group.label}
            </button>
          ))}
        </div>

        {activeGroupTabs.length > 1 && (
          <div className="plannerSubTabs" role="tablist" aria-label={`${activePlannerGroup.label} sections`}>
            {activeGroupTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={activeTab === tab.id ? "active" : ""}
                onClick={() => switchPlannerTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </nav>

      {activeTab === "overview" && (
        <section className="plannerOverview">
          <div className="overviewHero">
            <p>Shared workspace ready</p>
            <h2>{teamName || "Team planning hub"}</h2>
            <span>
              Local-only for now, shaped for a future Supabase coach/admin login and shared team workspace.
            </span>
          </div>

          <div className="overviewGrid">
            {PLANNER_TABS.filter((tab) => tab.id !== "overview").map((tab) => (
              <button key={tab.id} className="overviewCard" type="button" onClick={() => switchPlannerTab(tab.id)}>
                <strong>{tab.label}</strong>
                <span>{tab.summary}</span>
              </button>
            ))}
          </div>

          <section className="loginRoadmap" aria-label="Future login plan">
            <h2>Future coach login</h2>
            <p>
              Planned for Supabase later: coach/admin accounts, shared team workspaces, and workspace-owned
              planner data. Player view-only access can stay as a later phase.
            </p>
            <div>
              <span>workspaces</span>
              <span>workspace_members</span>
              <span>planner_sections</span>
              <span>field_formations</span>
              <span>bowler_plans</span>
            </div>
          </section>

          {recentPlannerSections.length > 0 && (
            <section className="recentSections" aria-label="Recently updated planner sections">
              <h2>Recently updated</h2>
              {recentPlannerSections.map((section) => (
                <button
                  key={section.sectionId}
                  type="button"
                  onClick={() => switchPlannerTab(section.sectionId)}
                >
                  <strong>{PLANNER_TABS.find((tab) => tab.id === section.sectionId)?.label}</strong>
                  <span>{section.title}</span>
                </button>
              ))}
            </section>
          )}
        </section>
      )}

      {templateSectionId && templateSection && (
        <section className="plannerTemplate" aria-label={`${activePlannerTab.label} planner`}>
          <div className="templateHeading">
            <div>
              <h2>{activePlannerTab.label}</h2>
              <p>{activePlannerTab.summary}</p>
            </div>
            <span>Saved {new Date(templateSection.updatedAt).toLocaleString()}</span>
          </div>

          <section className="templatePicker" aria-label={`${activePlannerTab.label} coach templates`}>
            <label>
              <span>Coach template</span>
              <select value={previewTemplateId} onChange={(e) => setPreviewTemplateId(e.target.value)}>
                <option value="">Choose a daily template</option>
                {availableTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </label>

            {previewTemplate && (
              <div className="templatePreview" role="dialog" aria-live="polite">
                <div className="templatePreviewHeader">
                  <div>
                    <h3>{previewTemplate.name}</h3>
                    <p>{previewTemplate.description}</p>
                  </div>
                  <button type="button" onClick={() => setPreviewTemplateId("")}>
                    Cancel
                  </button>
                </div>
                <div className="previewBlock">
                  <span>Goals</span>
                  <p>{previewTemplate.goals}</p>
                </div>
                <div className="previewBlock">
                  <span>Checklist</span>
                  <ul>
                    {previewTemplate.checklistItems.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="previewBlock">
                  <span>Notes</span>
                  <p>{previewTemplate.notes}</p>
                </div>
                <button type="button" className="applyTemplate" onClick={() => applyPlannerTemplate(previewTemplate)}>
                  Apply Template
                </button>
              </div>
            )}
          </section>

          <label className="templateField">
            <span>Title</span>
            <input
              value={templateSection.title}
              onChange={(e) => updatePlannerSection(templateSectionId, { title: e.target.value })}
            />
          </label>

          <label className="templateField">
            <span>Goals / focus</span>
            <textarea
              value={templateSection.goals}
              onChange={(e) => updatePlannerSection(templateSectionId, { goals: e.target.value })}
              rows={3}
            />
          </label>

          <section className="checklistPanel" aria-label={`${activePlannerTab.label} checklist`}>
            <div className="checklistHeader">
              <h3>Checklist</h3>
              <button type="button" onClick={() => addChecklistItem(templateSectionId)}>
                Add item
              </button>
            </div>
            {templateSection.checklistItems.map((item) => (
              <div key={item.id} className="checklistItem">
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={(e) => updateChecklistItem(templateSectionId, item.id, { done: e.target.checked })}
                  aria-label={`Complete ${item.text}`}
                />
                <input
                  value={item.text}
                  onChange={(e) => updateChecklistItem(templateSectionId, item.id, { text: e.target.value })}
                  aria-label="Checklist item"
                />
                <button type="button" onClick={() => removeChecklistItem(templateSectionId, item.id)}>
                  x
                </button>
              </div>
            ))}
          </section>

          <label className="templateField">
            <span>Notes</span>
            <textarea
              value={templateSection.notes}
              onChange={(e) => updatePlannerSection(templateSectionId, { notes: e.target.value })}
              rows={6}
              placeholder="Add coaching notes, reminders, player observations, or follow-ups"
            />
          </label>

          {templateSectionId === "match-notes" && (
            <section className="opponentPanel" aria-label="Opponent players">
              <div className="opponentHeader">
                <div>
                  <h3>Opponent players</h3>
                  <p>Add key batters, bowlers, strengths, and the plan for each player.</p>
                </div>
                <button type="button" onClick={addOpponentPlayer}>
                  Add opponent
                </button>
              </div>

              {templateSection.opponentPlayers.length === 0 && (
                <p className="emptyOpponents">No opponent players added yet.</p>
              )}

              <div className="opponentGrid">
                {templateSection.opponentPlayers.map((opponent) => (
                  <article key={opponent.id} className="opponentCard">
                    <div className="opponentCardHeader">
                      <strong>{opponent.name.trim() || "Opponent player"}</strong>
                      <button type="button" onClick={() => removeOpponentPlayer(opponent.id)}>
                        Remove
                      </button>
                    </div>
                    <label>
                      <span>Name</span>
                      <input
                        value={opponent.name}
                        onChange={(e) => updateOpponentPlayer(opponent.id, { name: e.target.value })}
                        placeholder="Player name"
                      />
                    </label>
                    <label>
                      <span>Role</span>
                      <input
                        value={opponent.role}
                        onChange={(e) => updateOpponentPlayer(opponent.id, { role: e.target.value })}
                        placeholder="Opening batter, death bowler, leg spinner"
                      />
                    </label>
                    <label>
                      <span>Strengths</span>
                      <textarea
                        value={opponent.strengths}
                        onChange={(e) => updateOpponentPlayer(opponent.id, { strengths: e.target.value })}
                        placeholder="Scoring areas, bowling strengths, match impact"
                        rows={3}
                      />
                    </label>
                    <label>
                      <span>Plan</span>
                      <textarea
                        value={opponent.plan}
                        onChange={(e) => updateOpponentPlayer(opponent.id, { plan: e.target.value })}
                        placeholder="Bowling plan, field idea, batting approach, pressure option"
                        rows={3}
                      />
                    </label>
                  </article>
                ))}
              </div>
            </section>
          )}
        </section>
      )}

      {activeTab === "video-library" && (
        <section className="videoLibrary" aria-label="Coaching video library">
          <div className="videoLibraryIntro">
            <h2>Coaching video library</h2>
            <p>
              Open coaching resource links grouped by training category. Use these for ideas, then adapt the
              activity to your players, space, equipment, and safety needs.
            </p>
          </div>

          <div className="videoCategoryGrid">
            {VIDEO_RESOURCE_CATEGORIES.map((category) => (
              <article key={category.id} className="videoCategory">
                <div>
                  <h3>{category.title}</h3>
                  <p>{category.description}</p>
                </div>
                <div className="resourceLinks">
                  {category.links.map((link) => (
                    <a key={`${category.id}-${link.url}-${link.label}`} href={link.url} target="_blank" rel="noreferrer">
                      <strong>{link.label}</strong>
                      <small>{link.description}</small>
                    </a>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {activeTab === "fielding" && (
        <>
      <header className="topbar">
        <div className="identityFields">
          <label>
            <span>Team</span>
            <input
              className="nameInput"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Team name"
              aria-label="Team name"
            />
          </label>
          <label>
            <span>Formation</span>
            <input
              className="nameInput"
              value={formationName}
              onChange={(e) => setFormationName(e.target.value)}
              placeholder="Formation name"
              aria-label="Formation name"
            />
          </label>
        </div>
        <div className="saveControls">
          <select
            className="savedSelect"
            value={activeFormationId}
            onChange={(e) => loadFormation(e.target.value)}
            aria-label="Saved formations"
          >
            <option value="">Saved fields</option>
            {savedFormations.map((formation) => (
              <option key={formation.id} value={formation.id}>
                {formation.teamName ? `${formation.teamName} - ${formation.name}` : formation.name}
              </option>
            ))}
          </select>
          <button onClick={saveFormation}>{activeFormationId ? "Update" : "Save"}</button>
          <button onClick={saveFormationAsNew}>Save New</button>
          <button onClick={deleteFormation} disabled={!activeFormationId}>
            Delete
          </button>
        </div>
      </header>

      <section className="controls" aria-label="Batter settings">
        <label className="batterToggle">
          <input
            type="checkbox"
            checked={isLeftHander}
            onChange={(e) => changeBatterHand(e.target.checked)}
          />
          <span>Left-hand batter</span>
        </label>
        <label className="batterToggle">
          <input
            type="checkbox"
            checked={isEndOverRotated}
            onChange={(e) => changeEndOverRotation(e.target.checked)}
          />
          <span>End of over</span>
        </label>
        <label className="presetControl">
          <span>Preset</span>
          <select defaultValue="" onChange={(e) => applyPreset(e.target.value)}>
            <option value="" disabled>
              Choose field
            </option>
            {FIELD_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="fieldWrap">
        <div className="field" ref={fieldRef} onClick={suggestFieldPosition}>
          <div className="boundaryRope" />
          <div className="outerRing" />
          <div className="innerCircle" />
          <div className="pitch">
            <span className="stumps stumpsTop" />
            <span className="stumps stumpsBottom" />
            <span className="crease creaseTop" />
            <span className="crease creaseBottom" />
            <span className="batterIcon batterTop" />
            <span className="batterIcon batterBottom" />
          </div>
          {players.map((p) => (
            <button
              key={p.id}
              className={`player ${draggingId === p.id ? "dragging" : ""} ${
                isRequiredPosition(p.name) ? "fixedPlayer" : ""
              }`}
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
              onPointerDown={(e) => {
                if (isRequiredPosition(p.name)) return;
                e.currentTarget.setPointerCapture(e.pointerId);
                setDraggingId(p.id);
              }}
              onPointerMove={(e) => handlePointerMove(e, p.id)}
              onPointerUp={() => {
                snapPlayerToNearestPosition(p.id);
                setDraggingId(null);
              }}
              onPointerCancel={() => {
                snapPlayerToNearestPosition(p.id);
                setDraggingId(null);
              }}
              title={p.fielderName ? `${p.fielderName} - ${p.name}` : p.name}
            >
              <span>{getFieldLabel(p)}</span>
            </button>
          ))}
          {fieldSuggestion && (
            <div
              className="assignmentConfirm"
              style={{ left: `${fieldSuggestion.x}%`, top: `${fieldSuggestion.y}%` }}
              role="dialog"
              aria-live="polite"
            >
              <p>
                {players.some((player) => player.name === fieldSuggestion.position.name)
                  ? `${fieldSuggestion.position.name} is already selected.`
                  : `Add ${fieldSuggestion.position.name} here?`}
              </p>
              <div>
                <button
                  type="button"
                  onClick={addSuggestedPosition}
                  disabled={players.some((player) => player.name === fieldSuggestion.position.name)}
                >
                  Add
                </button>
                <button type="button" onClick={() => setFieldSuggestion(null)}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="selector" aria-label="Field position selector">
        <div className="selectorHeader">
          <h1>Choose field positions</h1>
          <span>
            {players.length}/{MAX_POSITIONS}
          </span>
        </div>
        <p className="selectorHint">
          Choose a preset, tap the field to add a suggested position, then enter or drag name chips between positions.
        </p>

        <div className="selectedList">
          {players.map((player) => (
            <div
              key={player.id}
              className={`selectedRow ${
                duplicateNameSet.has(normalizeFielderName(player.fielderName)) ? "duplicate" : ""
              }`}
            >
              <label>
                <span>{player.name}</span>
                <div className="nameEntry">
                  <input
                    value={player.fielderName}
                    onChange={(e) => renameFielder(player.id, e.target.value)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleFielderDrop(e, player.id)}
                    placeholder="Fielder name"
                    aria-label={`${player.name} fielder name`}
                    aria-invalid={duplicateNameSet.has(normalizeFielderName(player.fielderName))}
                  />
                  {player.fielderName.trim() && (
                    <div className="nameChips" aria-label="Movable fielder name">
                      <button
                        type="button"
                        draggable={!isRequiredPosition(player.name)}
                        onClick={() => renameFielder(player.id, "")}
                        onDragStart={(e) => handleFielderChipDragStart(e, player.id, player.fielderName)}
                        title={
                          isRequiredPosition(player.name)
                            ? "Fixed position name"
                            : "Drag to another position, or tap to clear"
                        }
                      >
                        {player.fielderName.trim()}
                      </button>
                    </div>
                  )}
                </div>
              </label>
              {isRequiredPosition(player.name) ? (
                <span className="requiredPosition">Fixed</span>
              ) : (
                <button className="removePosition" onClick={() => removePosition(player.id)} aria-label={`Remove ${player.name}`}>
                  x
                </button>
              )}
            </div>
          ))}
        </div>

        {duplicateMessage && (
          <p className="warning" role="alert">
            {duplicateMessage}
          </p>
        )}

        {depthConflictMessages.map((message) => (
          <p key={message} className="warning advisory">
            {message}
          </p>
        ))}

        <details className="customPositions">
          <summary>Add or remove custom position</summary>
          <div className="positionGrid">
            {FIELD_POSITIONS.map((position) => {
              const isSelected = selectedNames.has(position.name);
              return (
                <button
                  key={position.name}
                  className={`positionOption ${isSelected ? "selected" : ""}`}
                  onClick={() => togglePosition(position)}
                  disabled={isRequiredPosition(position.name) || (!isSelected && players.length >= MAX_POSITIONS)}
                >
                  {position.name}
                </button>
              );
            })}
          </div>
        </details>
      </section>

      <details className="bowlerPlans">
        <summary>Bowler plans</summary>
        <div className="bowlerPlanGrid">
          <label className="bowlerPlanField">
            <span>Select bowler</span>
            <select value={activeBowlerId} onChange={(e) => selectBowlerPlan(e.target.value)}>
              <option value="">New bowler</option>
              {bowlerPlans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.bowlerName}
                </option>
              ))}
            </select>
          </label>

          <label className="bowlerPlanField">
            <span>Bowler name</span>
            <input
              value={bowlerNameDraft}
              onChange={(e) => setBowlerNameDraft(e.target.value)}
              placeholder="Bowler name"
            />
          </label>

          <label className="bowlerPlanField">
            <span>Select scenario</span>
            <select
              value={activeScenarioId}
              onChange={(e) => selectScenario(e.target.value)}
              disabled={!activeBowlerPlan}
            >
              <option value="">New scenario</option>
              {activeBowlerPlan?.scenarios.map((scenario) => (
                <option key={scenario.id} value={scenario.id}>
                  {scenario.name}
                </option>
              ))}
            </select>
          </label>

          <label className="bowlerPlanField">
            <span>Scenario</span>
            <input
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              placeholder="Powerplay vs RH batter"
            />
          </label>

          <label className="bowlerPlanField wide">
            <span>Action / plan</span>
            <textarea
              value={scenarioAction}
              onChange={(e) => setScenarioAction(e.target.value)}
              placeholder="Hard length outside off"
              rows={2}
            />
          </label>

          <label className="bowlerPlanField wide">
            <span>Notes</span>
            <textarea
              value={scenarioNotes}
              onChange={(e) => setScenarioNotes(e.target.value)}
              placeholder="Keep point tight, protect cover boundary"
              rows={2}
            />
          </label>
        </div>

        <section className="controls bowlerPlanControls" aria-label="Bowler plan field settings">
          <label className="batterToggle">
            <input
              type="checkbox"
              checked={bowlerPlanIsLeftHander}
              onChange={(e) => changeBowlerPlanBatterHand(e.target.checked)}
            />
            <span>Left-hand batter</span>
          </label>
          <label className="batterToggle">
            <input
              type="checkbox"
              checked={bowlerPlanIsEndOverRotated}
              onChange={(e) => changeBowlerPlanEndOverRotation(e.target.checked)}
            />
            <span>End of over</span>
          </label>
          <label className="presetControl">
            <span>Preset</span>
            <select defaultValue="" onChange={(e) => applyBowlerPlanPreset(e.target.value)}>
              <option value="" disabled>
                Choose field
              </option>
              <option value="team-field">Use Team Field</option>
              {FIELD_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name}
                </option>
              ))}
            </select>
          </label>
        </section>

        <section className="fieldWrap bowlerPlanFieldWrap" aria-label="Bowler plan field">
          <div className="field bowlerPlanBoard" ref={bowlerPlanFieldRef} onClick={suggestBowlerPlanFieldPosition}>
            <div className="boundaryRope" />
            <div className="outerRing" />
            <div className="innerCircle" />
            <div className="pitch">
              <span className="stumps stumpsTop" />
              <span className="stumps stumpsBottom" />
              <span className="crease creaseTop" />
              <span className="crease creaseBottom" />
              <span className="batterIcon batterTop" />
              <span className="batterIcon batterBottom" />
            </div>
            {bowlerPlanPlayers.map((p) => (
              <button
                key={p.id}
                className={`player ${bowlerPlanDraggingId === p.id ? "dragging" : ""} ${
                  isRequiredPosition(p.name) ? "fixedPlayer" : ""
                }`}
                style={{ left: `${p.x}%`, top: `${p.y}%` }}
                onPointerDown={(e) => {
                  if (isRequiredPosition(p.name)) return;
                  e.currentTarget.setPointerCapture(e.pointerId);
                  setBowlerPlanDraggingId(p.id);
                }}
                onPointerMove={(e) => handleBowlerPlanPointerMove(e, p.id)}
                onPointerUp={() => {
                  snapBowlerPlanPlayerToNearestPosition(p.id);
                  setBowlerPlanDraggingId(null);
                }}
                onPointerCancel={() => {
                  snapBowlerPlanPlayerToNearestPosition(p.id);
                  setBowlerPlanDraggingId(null);
                }}
                title={p.fielderName ? `${p.fielderName} - ${p.name}` : p.name}
              >
                <span>{getFieldLabel(p)}</span>
              </button>
            ))}
            {bowlerPlanSuggestion && (
              <div
                className="assignmentConfirm"
                style={{ left: `${bowlerPlanSuggestion.x}%`, top: `${bowlerPlanSuggestion.y}%` }}
                role="dialog"
                aria-live="polite"
              >
                <p>
                  {bowlerPlanPlayers.some((player) => player.name === bowlerPlanSuggestion.position.name)
                    ? `${bowlerPlanSuggestion.position.name} is already selected.`
                    : `Add ${bowlerPlanSuggestion.position.name} here?`}
                </p>
                <div>
                  <button
                    type="button"
                    onClick={addBowlerPlanSuggestedPosition}
                    disabled={bowlerPlanPlayers.some((player) => player.name === bowlerPlanSuggestion.position.name)}
                  >
                    Add
                  </button>
                  <button type="button" onClick={() => setBowlerPlanSuggestion(null)}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="selector bowlerPlanSelector" aria-label="Bowler plan position selector">
          <div className="selectorHeader">
            <h1>Bowler plan positions</h1>
            <span>
              {bowlerPlanPlayers.length}/{MAX_POSITIONS}
            </span>
          </div>
          <p className="selectorHint">
            This field belongs only to the selected bowler scenario. Tap the plan field to add positions.
          </p>

          <div className="selectedList">
            {bowlerPlanPlayers.map((player) => (
              <div
                key={player.id}
                className={`selectedRow ${
                  bowlerPlanDuplicateNameSet.has(normalizeFielderName(player.fielderName)) ? "duplicate" : ""
                }`}
              >
                <label>
                  <span>{player.name}</span>
                  <div className="nameEntry">
                    <input
                      value={player.fielderName}
                      onChange={(e) => renameBowlerPlanFielder(player.id, e.target.value)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleBowlerPlanFielderDrop(e, player.id)}
                      placeholder="Fielder name"
                      aria-label={`${player.name} bowler plan fielder name`}
                      aria-invalid={bowlerPlanDuplicateNameSet.has(normalizeFielderName(player.fielderName))}
                    />
                    {player.fielderName.trim() && (
                      <div className="nameChips" aria-label="Movable bowler plan fielder name">
                        <button
                          type="button"
                          draggable={!isRequiredPosition(player.name)}
                          onClick={() => renameBowlerPlanFielder(player.id, "")}
                          onDragStart={(e) =>
                            handleBowlerPlanFielderChipDragStart(e, player.id, player.fielderName)
                          }
                          title={
                            isRequiredPosition(player.name)
                              ? "Fixed position name"
                              : "Drag to another position, or tap to clear"
                          }
                        >
                          {player.fielderName.trim()}
                        </button>
                      </div>
                    )}
                  </div>
                </label>
                {isRequiredPosition(player.name) ? (
                  <span className="requiredPosition">Fixed</span>
                ) : (
                  <button
                    className="removePosition"
                    onClick={() => removeBowlerPlanPosition(player.id)}
                    aria-label={`Remove ${player.name}`}
                  >
                    x
                  </button>
                )}
              </div>
            ))}
          </div>

          {bowlerPlanDuplicateMessage && (
            <p className="warning" role="alert">
              {bowlerPlanDuplicateMessage}
            </p>
          )}

          {bowlerPlanDepthConflictMessages.map((message) => (
            <p key={message} className="warning advisory">
              {message}
            </p>
          ))}

          <details className="customPositions">
            <summary>Add or remove bowler plan position</summary>
            <div className="positionGrid">
              {FIELD_POSITIONS.map((position) => {
                const isSelected = bowlerPlanSelectedNames.has(position.name);
                return (
                  <button
                    key={position.name}
                    className={`positionOption ${isSelected ? "selected" : ""}`}
                    onClick={() => toggleBowlerPlanPosition(position)}
                    disabled={
                      isRequiredPosition(position.name) ||
                      (!isSelected && bowlerPlanPlayers.length >= MAX_POSITIONS)
                    }
                  >
                    {position.name}
                  </button>
                );
              })}
            </div>
          </details>
        </section>

        <div className="bowlerPlanActions">
          <button onClick={saveBowlerPlan}>Save Bowler</button>
          <button onClick={saveBowlerScenario}>Save Scenario</button>
          <button onClick={loadBowlerScenario} disabled={!activeScenario}>
            Load Plan Field
          </button>
          <button onClick={resetBowlerPlanFormation}>Suggested XI</button>
          <button onClick={deleteBowlerScenario} disabled={!activeScenarioId}>
            Delete Scenario
          </button>
          <button onClick={deleteBowlerPlan} disabled={!activeBowlerId}>
            Delete Bowler
          </button>
        </div>
      </details>

      <footer className="actions">
        <button onClick={resetFormation}>Suggested XI</button>
        <button onClick={exportFormationImage}>Share PNG</button>
        <button onClick={() => setPlayers(ensureRequiredPositions([], isLeftHander, isEndOverRotated))}>Clear</button>
      </footer>

      <p className="hint">{title}</p>
        </>
      )}
    </main>
  );
}

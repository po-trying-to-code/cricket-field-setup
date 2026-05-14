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
  | "match-notes"
  | "scoring"
  | "scheduler";
type PlannerSectionId = Exclude<PlannerTabId, "overview" | "fielding" | "video-library" | "scoring" | "scheduler">;

type SchedulerTeam = { id: string; name: string };

type SchedulerDivision = {
  id: string;
  name: string;
  teams: SchedulerTeam[];
};

type SchedulerConfig = {
  name: string;
  divisions: SchedulerDivision[];
  venues: string[];
  startDate: string;
  endDate: string;
  matchDays: number[];
  publicHolidayDates: string[];
  format: string;
  rounds: "single" | "double";
  blackoutDates: string[];
};

type GeneratedFixture = {
  id: string;
  divisionId: string;
  divisionName: string;
  round: number;
  date: string;
  homeTeam: string;
  awayTeam: string;
  venue: string;
  isBye: boolean;
};

type SchedulerResult = {
  config: SchedulerConfig;
  fixtures: GeneratedFixture[];
  generatedAt: string;
};

type SchedulerViewId = "setup" | "fixtures";

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

type SquadPlayer = {
  id: string;
  name: string;
  role: string;
  battingHand: string;
  bowlingType: string;
  notes: string;
};

type ScoringZone = { x: number; y: number; label: string };

type Delivery = {
  id: string;
  ballInOver: number;
  batsmanName: string;
  bowlerName: string;
  runs: number;
  isBoundary: boolean;
  boundaryType?: "4" | "6";
  scoringZone?: ScoringZone;
  isExtra: boolean;
  extraType?: "wide" | "no-ball" | "bye" | "leg-bye";
  extraRuns: number;
  isWicket: boolean;
  dismissalType?: string;
  fielderName?: string;
};

type MatchOver = {
  id: string;
  overNumber: number;
  bowlerName: string;
  deliveries: Delivery[];
};

type BatsmanStats = {
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  isOut: boolean;
  dismissalType?: string;
  bowlerName?: string;
  scoringZones: ScoringZone[];
  battingOrder: number;
};

type BowlerStats = {
  name: string;
  overs: number;
  partialBalls: number;
  maidens: number;
  runs: number;
  wickets: number;
  scoringZones: ScoringZone[];
};

type MatchInnings = {
  id: string;
  battingTeam: string;
  overs: MatchOver[];
  batsmen: BatsmanStats[];
  bowlers: BowlerStats[];
  currentBatsmen: [string, string];
  currentBowler: string;
  extras: { wides: number; noBalls: number; byes: number; legByes: number };
  isCompleted: boolean;
};

type MatchScore = {
  id: string;
  date: string;
  venue: string;
  format: string;
  maxOvers: number;
  teamA: string;
  teamB: string;
  teamAPlayers: string[];
  teamBPlayers: string[];
  tossWinner: string;
  tossDecision: "bat" | "field";
  innings: MatchInnings[];
  result: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
};

type ScoringViewId = "list" | "setup" | "live" | "scorecard" | "analysis";

type PendingDelivery = {
  runs: number;
  isBoundary: boolean;
  boundaryType?: "4" | "6";
  isExtra: boolean;
  extraType?: "wide" | "no-ball" | "bye" | "leg-bye";
  extraRuns: number;
  isWicket: boolean;
  dismissalType?: string;
  fielderName?: string;
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
const SQUAD_PLAYERS_KEY = "cricket-squad-players-v1";
const MATCH_SCORES_KEY = "cricket-match-scores-v1";
const SCHEDULER_KEY = "cricket-scheduler-v1";
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
  {
    id: "scoring",
    label: "Scoring",
    summary: "Live ball-by-ball scoring with boundary zone capture and analysis.",
  },
  {
    id: "scheduler",
    label: "Scheduler",
    summary: "Generate round-robin match fixtures for all divisions in the league.",
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
    tabs: ["fielding", "match-notes", "scoring"],
  },
  {
    id: "admin",
    label: "Admin",
    tabs: ["scheduler"],
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

let _idSeq = 0;
const genId = (prefix = "id") => `${prefix}-${Date.now()}-${++_idSeq}`;

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

const normalizeSquadPlayer = (data: unknown): SquadPlayer | null => {
  if (!data || typeof data !== "object") return null;
  const player = data as Partial<SquadPlayer>;
  if (typeof player.name !== "string") return null;

  return {
    id: typeof player.id === "string" ? player.id : `squad-${Date.now()}-${createId(player.name || "player")}`,
    name: player.name,
    role: typeof player.role === "string" ? player.role : "",
    battingHand: typeof player.battingHand === "string" ? player.battingHand : "Right",
    bowlingType: typeof player.bowlingType === "string" ? player.bowlingType : "",
    notes: typeof player.notes === "string" ? player.notes : "",
  };
};

const normalizeDelivery = (d: unknown): Delivery | null => {
  if (!d || typeof d !== "object") return null;
  const x = d as Record<string, unknown>;
  if (typeof x.id !== "string") return null;
  return {
    id: x.id,
    ballInOver: typeof x.ballInOver === "number" ? x.ballInOver : 0,
    batsmanName: typeof x.batsmanName === "string" ? x.batsmanName : "",
    bowlerName: typeof x.bowlerName === "string" ? x.bowlerName : "",
    runs: typeof x.runs === "number" ? x.runs : 0,
    isBoundary: x.isBoundary === true,
    boundaryType: x.boundaryType === "4" || x.boundaryType === "6" ? x.boundaryType : undefined,
    scoringZone:
      x.scoringZone && typeof x.scoringZone === "object"
        ? (x.scoringZone as ScoringZone)
        : undefined,
    isExtra: x.isExtra === true,
    extraType:
      x.extraType === "wide" || x.extraType === "no-ball" || x.extraType === "bye" || x.extraType === "leg-bye"
        ? x.extraType
        : undefined,
    extraRuns: typeof x.extraRuns === "number" ? x.extraRuns : 0,
    isWicket: x.isWicket === true,
    dismissalType: typeof x.dismissalType === "string" ? x.dismissalType : undefined,
    fielderName: typeof x.fielderName === "string" ? x.fielderName : undefined,
  };
};

const normalizeMatchOver = (o: unknown): MatchOver | null => {
  if (!o || typeof o !== "object") return null;
  const x = o as Record<string, unknown>;
  if (typeof x.id !== "string") return null;
  return {
    id: x.id,
    overNumber: typeof x.overNumber === "number" ? x.overNumber : 0,
    bowlerName: typeof x.bowlerName === "string" ? x.bowlerName : "",
    deliveries: Array.isArray(x.deliveries)
      ? x.deliveries.map(normalizeDelivery).filter((d): d is Delivery => d !== null)
      : [],
  };
};

const normalizeBatsman = (b: unknown): BatsmanStats | null => {
  if (!b || typeof b !== "object") return null;
  const x = b as Record<string, unknown>;
  if (typeof x.name !== "string") return null;
  return {
    name: x.name,
    runs: typeof x.runs === "number" ? x.runs : 0,
    balls: typeof x.balls === "number" ? x.balls : 0,
    fours: typeof x.fours === "number" ? x.fours : 0,
    sixes: typeof x.sixes === "number" ? x.sixes : 0,
    isOut: x.isOut === true,
    dismissalType: typeof x.dismissalType === "string" ? x.dismissalType : undefined,
    bowlerName: typeof x.bowlerName === "string" ? x.bowlerName : undefined,
    scoringZones: Array.isArray(x.scoringZones) ? (x.scoringZones as ScoringZone[]) : [],
    battingOrder: typeof x.battingOrder === "number" ? x.battingOrder : 0,
  };
};

const normalizeBowler = (b: unknown): BowlerStats | null => {
  if (!b || typeof b !== "object") return null;
  const x = b as Record<string, unknown>;
  if (typeof x.name !== "string") return null;
  return {
    name: x.name,
    overs: typeof x.overs === "number" ? x.overs : 0,
    partialBalls: typeof x.partialBalls === "number" ? x.partialBalls : 0,
    maidens: typeof x.maidens === "number" ? x.maidens : 0,
    runs: typeof x.runs === "number" ? x.runs : 0,
    wickets: typeof x.wickets === "number" ? x.wickets : 0,
    scoringZones: Array.isArray(x.scoringZones) ? (x.scoringZones as ScoringZone[]) : [],
  };
};

const normalizeInnings = (i: unknown): MatchInnings | null => {
  if (!i || typeof i !== "object") return null;
  const x = i as Record<string, unknown>;
  if (typeof x.id !== "string") return null;
  const cb = Array.isArray(x.currentBatsmen) ? x.currentBatsmen : ["", ""];
  return {
    id: x.id,
    battingTeam: typeof x.battingTeam === "string" ? x.battingTeam : "",
    overs: Array.isArray(x.overs)
      ? x.overs.map(normalizeMatchOver).filter((o): o is MatchOver => o !== null)
      : [],
    batsmen: Array.isArray(x.batsmen)
      ? x.batsmen.map(normalizeBatsman).filter((b): b is BatsmanStats => b !== null)
      : [],
    bowlers: Array.isArray(x.bowlers)
      ? x.bowlers.map(normalizeBowler).filter((b): b is BowlerStats => b !== null)
      : [],
    currentBatsmen: [
      typeof cb[0] === "string" ? cb[0] : "",
      typeof cb[1] === "string" ? cb[1] : "",
    ],
    currentBowler: typeof x.currentBowler === "string" ? x.currentBowler : "",
    extras: {
      wides: typeof (x.extras as Record<string, unknown>)?.wides === "number" ? (x.extras as Record<string, unknown>).wides as number : 0,
      noBalls: typeof (x.extras as Record<string, unknown>)?.noBalls === "number" ? (x.extras as Record<string, unknown>).noBalls as number : 0,
      byes: typeof (x.extras as Record<string, unknown>)?.byes === "number" ? (x.extras as Record<string, unknown>).byes as number : 0,
      legByes: typeof (x.extras as Record<string, unknown>)?.legByes === "number" ? (x.extras as Record<string, unknown>).legByes as number : 0,
    },
    isCompleted: x.isCompleted === true,
  };
};

const normalizeMatchScore = (data: unknown): MatchScore | null => {
  if (!data || typeof data !== "object") return null;
  const x = data as Record<string, unknown>;
  if (typeof x.id !== "string" || typeof x.teamA !== "string" || typeof x.teamB !== "string") return null;
  return {
    id: x.id,
    date: typeof x.date === "string" ? x.date : "",
    venue: typeof x.venue === "string" ? x.venue : "",
    format: typeof x.format === "string" ? x.format : "T20",
    maxOvers: typeof x.maxOvers === "number" ? x.maxOvers : 20,
    teamA: x.teamA,
    teamB: x.teamB,
    teamAPlayers: Array.isArray(x.teamAPlayers) ? (x.teamAPlayers as string[]) : [],
    teamBPlayers: Array.isArray(x.teamBPlayers) ? (x.teamBPlayers as string[]) : [],
    tossWinner: typeof x.tossWinner === "string" ? x.tossWinner : "",
    tossDecision: x.tossDecision === "field" ? "field" : "bat",
    innings: Array.isArray(x.innings)
      ? x.innings.map(normalizeInnings).filter((i): i is MatchInnings => i !== null)
      : [],
    result: typeof x.result === "string" ? x.result : "",
    isCompleted: x.isCompleted === true,
    createdAt: typeof x.createdAt === "string" ? x.createdAt : new Date().toISOString(),
    updatedAt: typeof x.updatedAt === "string" ? x.updatedAt : new Date().toISOString(),
  };
};

const isPlannerTemplateTab = (
  sectionId: PlannerTabId,
): sectionId is PlannerSectionId =>
  sectionId !== "overview" && sectionId !== "fielding" && sectionId !== "video-library" && sectionId !== "scoring" && sectionId !== "scheduler";

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

// ── Scheduler helpers ─────────────────────────────────────────────────────────

const getSeasonDefaults = () => {
  const y = new Date().getFullYear();
  return { startDate: `${y}-04-01`, endDate: `${y}-09-01` };
};

const toISODate = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const formatSchedulerDate = (iso: string): string => {
  if (!iso) return "Unscheduled";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "short", year: "numeric" });
};

const getAvailableDates = (
  startDate: string,
  endDate: string,
  matchDays: number[],
  publicHolidayDates: string[],
  blackoutDates: string[],
): string[] => {
  const blackoutSet = new Set(blackoutDates);
  const holidaySet = new Set(
    publicHolidayDates.filter((d) => d >= startDate && d <= endDate),
  );
  const dates: string[] = [];
  const cursor = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");
  while (cursor <= end) {
    const iso = toISODate(cursor);
    if ((matchDays.includes(cursor.getDay()) || holidaySet.has(iso)) && !blackoutSet.has(iso)) {
      dates.push(iso);
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
};

const generateRoundRobin = (
  teams: SchedulerTeam[],
): Array<Array<{ home: SchedulerTeam; away: SchedulerTeam }>> => {
  if (teams.length < 2) return [];
  const list = teams.length % 2 === 1 ? [...teams, { id: "bye", name: "BYE" }] : [...teams];
  const n = list.length;
  const rotating = list.slice(0, n - 1);
  const fixed = list[n - 1];
  const rounds: Array<Array<{ home: SchedulerTeam; away: SchedulerTeam }>> = [];

  for (let r = 0; r < n - 1; r++) {
    const round: Array<{ home: SchedulerTeam; away: SchedulerTeam }> = [];
    const first = rotating[0];
    if (first.id !== "bye" && fixed.id !== "bye") {
      round.push({ home: first, away: fixed });
    }
    for (let i = 1; i <= n / 2 - 1; i++) {
      const home = rotating[i];
      const away = rotating[n - 2 - i];
      if (home.id !== "bye" && away.id !== "bye") {
        round.push({ home, away });
      }
    }
    rounds.push(round);
    // rotate: move last element of rotating to front
    const last = rotating.pop()!;
    rotating.unshift(last);
  }
  return rounds;
};

const buildSchedulerFixtures = (config: SchedulerConfig): GeneratedFixture[] => {
  const availableDates = getAvailableDates(
    config.startDate,
    config.endDate,
    config.matchDays,
    config.publicHolidayDates,
    config.blackoutDates,
  );

  // build per-division round lists
  const divisionRounds = config.divisions.map((div) => {
    const rrRounds = generateRoundRobin(div.teams);
    if (config.rounds === "double") {
      const second = rrRounds.map((round) =>
        round.map((m) => ({ home: m.away, away: m.home })),
      );
      return { div, rounds: [...rrRounds, ...second] };
    }
    return { div, rounds: rrRounds };
  });

  // interleave: div0-r0, div1-r0, div2-r0, div0-r1 …
  const fixtures: GeneratedFixture[] = [];
  const cursors = divisionRounds.map(() => 0);
  let dateIdx = 0;
  let venueIdx = 0;

  while (true) {
    let scheduledAny = false;
    for (let di = 0; di < divisionRounds.length; di++) {
      const { div, rounds } = divisionRounds[di];
      if (cursors[di] >= rounds.length) continue;
      const round = rounds[cursors[di]];
      const date = availableDates[dateIdx] ?? "";
      for (const m of round) {
        fixtures.push({
          id: `${div.id}-r${cursors[di]}-${m.home.id}-${m.away.id}`,
          divisionId: div.id,
          divisionName: div.name,
          round: cursors[di] + 1,
          date,
          homeTeam: m.home.name,
          awayTeam: m.away.name,
          venue: config.venues.length > 0 ? config.venues[venueIdx++ % config.venues.length] : "",
          isBye: false,
        });
      }
      cursors[di]++;
      scheduledAny = true;
    }
    if (!scheduledAny) break;
    if (availableDates[dateIdx]) dateIdx++;
  }

  return fixtures;
};

const normalizeSchedulerResult = (data: unknown): SchedulerResult | null => {
  if (!data || typeof data !== "object") return null;
  const r = data as Partial<SchedulerResult>;
  if (!r.config || typeof r.config !== "object") return null;
  const c = r.config as Partial<SchedulerConfig>;
  return {
    config: {
      name: typeof c.name === "string" ? c.name : "",
      divisions: Array.isArray(c.divisions) ? c.divisions.filter((d): d is SchedulerDivision =>
        !!d && typeof d.id === "string" && typeof d.name === "string" && Array.isArray(d.teams)) : [],
      venues: Array.isArray(c.venues) ? c.venues.filter((v): v is string => typeof v === "string") : [],
      startDate: typeof c.startDate === "string" ? c.startDate : "",
      endDate: typeof c.endDate === "string" ? c.endDate : "",
      matchDays: Array.isArray(c.matchDays) ? c.matchDays.filter((d): d is number => typeof d === "number") : [0, 6],
      publicHolidayDates: Array.isArray(c.publicHolidayDates) ? c.publicHolidayDates.filter((d): d is string => typeof d === "string") : [],
      format: typeof c.format === "string" ? c.format : "T20",
      rounds: c.rounds === "double" ? "double" : "single",
      blackoutDates: Array.isArray(c.blackoutDates) ? c.blackoutDates.filter((d): d is string => typeof d === "string") : [],
    },
    fixtures: Array.isArray(r.fixtures) ? r.fixtures.filter((f): f is GeneratedFixture =>
      !!f && typeof f.id === "string" && typeof f.divisionId === "string") : [],
    generatedAt: typeof r.generatedAt === "string" ? r.generatedAt : new Date().toISOString(),
  };
};

const exportSchedulerText = (result: SchedulerResult): void => {
  const grouped = new Map<string, GeneratedFixture[]>();
  for (const f of result.fixtures) {
    if (!grouped.has(f.date)) grouped.set(f.date, []);
    grouped.get(f.date)!.push(f);
  }
  const lines: string[] = [`=== ${result.config.name || "Season Schedule"} — ${result.config.format} ===`, ""];
  for (const [date, fixtures] of Array.from(grouped.entries()).sort(([a], [b]) => a.localeCompare(b))) {
    lines.push(date ? formatSchedulerDate(date) : "Unscheduled");
    for (const f of fixtures) {
      const venue = f.venue ? ` — ${f.venue}` : "";
      lines.push(`  [${f.divisionName}] ${f.homeTeam} vs ${f.awayTeam}${venue}`);
    }
    lines.push("");
  }
  const text = lines.join("\n");
  if (navigator.share) {
    navigator.share({ title: result.config.name || "Fixtures", text }).catch(() => {});
    return;
  }
  navigator.clipboard?.writeText(text).then(() => alert("Fixtures copied to clipboard.")).catch(() => {
    alert(text);
  });
};

// ── End scheduler helpers ──────────────────────────────────────────────────────

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
  const [squadPlayers, setSquadPlayers] = useState<SquadPlayer[]>([]);
  const [matchScores, setMatchScores] = useState<MatchScore[]>([]);
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [scoringView, setScoringView] = useState<ScoringViewId>("list");
  const [zonePickerOpen, setZonePickerOpen] = useState(false);
  const [pendingDelivery, setPendingDelivery] = useState<PendingDelivery | null>(null);
  const [matchSetupForm, setMatchSetupForm] = useState({
    teamA: "",
    teamB: "",
    format: "T20",
    maxOvers: 20,
    venue: "",
    tossWinner: "A",
    tossDecision: "bat" as "bat" | "field",
    teamAPlayers: "",
    teamBPlayers: "",
  });
  const [rosterPickerOpen, setRosterPickerOpen] = useState(false);
  const [analysisBatsman, setAnalysisBatsman] = useState("");
  const [analysisBowler, setAnalysisBowler] = useState("");
  const [analysisMode, setAnalysisMode] = useState<"batsman" | "bowler">("batsman");
  const [scorecardInningsIdx, setScorecardInningsIdx] = useState(0);
  const [allMatchesAnalysis, setAllMatchesAnalysis] = useState(false);

  const [schedulerResult, setSchedulerResult] = useState<SchedulerResult | null>(null);
  const [schedulerView, setSchedulerView] = useState<SchedulerViewId>("setup");
  const [schedulerDivisionFilter, setSchedulerDivisionFilter] = useState("all");
  const [schedulerForm, setSchedulerForm] = useState(() => {
    const { startDate, endDate } = getSeasonDefaults();
    return {
      name: "",
      startDate,
      endDate,
      matchDays: [0, 6] as number[],
      publicHolidayDates: [] as string[],
      format: "T20",
      rounds: "single" as "single" | "double",
      venues: [] as string[],
      divisions: [] as SchedulerDivision[],
      blackoutDates: [] as string[],
      venueDraft: "",
      blackoutDraft: "",
      publicHolidayDraft: "",
    };
  });
  const [divTeamDrafts, setDivTeamDrafts] = useState<Record<string, string>>({});

  const [showWicketModal, setShowWicketModal] = useState(false);
  const [wicketDismissal, setWicketDismissal] = useState({ type: "bowled", fielder: "" });
  const [showExtrasModal, setShowExtrasModal] = useState<{ type: "wide" | "no-ball" | "bye" | "leg-bye" } | null>(null);
  const [showEndOfOverModal, setShowEndOfOverModal] = useState(false);
  const [nextBowlerInput, setNextBowlerInput] = useState("");
  const [showPlayerPicker, setShowPlayerPicker] = useState<{ for: "striker" | "nonStriker" | "bowler" } | null>(null);
  const [playerPickerInput, setPlayerPickerInput] = useState("");
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

    const squadRaw = localStorage.getItem(SQUAD_PLAYERS_KEY);
    if (squadRaw) {
      try {
        const savedSquad = JSON.parse(squadRaw);
        if (Array.isArray(savedSquad)) {
          const players = savedSquad
            .map((item) => normalizeSquadPlayer(item))
            .filter((item): item is SquadPlayer => Boolean(item));
          setSquadPlayers(players);
        }
      } catch {
        localStorage.removeItem(SQUAD_PLAYERS_KEY);
      }
    }

    const scoresRaw = localStorage.getItem(MATCH_SCORES_KEY);
    if (scoresRaw) {
      try {
        const parsed = JSON.parse(scoresRaw);
        if (Array.isArray(parsed)) {
          const scores = parsed
            .map((item) => normalizeMatchScore(item))
            .filter((item): item is MatchScore => Boolean(item));
          setMatchScores(scores);
        }
      } catch {
        localStorage.removeItem(MATCH_SCORES_KEY);
      }
    }

    const schedulerRaw = localStorage.getItem(SCHEDULER_KEY);
    if (schedulerRaw) {
      try {
        const parsed = JSON.parse(schedulerRaw);
        const result = normalizeSchedulerResult(parsed);
        if (result) {
          setSchedulerResult(result);
          const c = result.config;
          setSchedulerForm({
            name: c.name,
            startDate: c.startDate,
            endDate: c.endDate,
            matchDays: c.matchDays,
            publicHolidayDates: c.publicHolidayDates,
            format: c.format,
            rounds: c.rounds,
            venues: c.venues,
            divisions: c.divisions,
            blackoutDates: c.blackoutDates,
            venueDraft: "",
            blackoutDraft: "",
            publicHolidayDraft: "",
          });
          setSchedulerView("fixtures");
        }
      } catch {
        localStorage.removeItem(SCHEDULER_KEY);
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

  const persistSquadPlayers = (next: SquadPlayer[]) => {
    localStorage.setItem(SQUAD_PLAYERS_KEY, JSON.stringify(next));
    setSquadPlayers(next);
  };

  const addSquadPlayer = () => {
    persistSquadPlayers([
      ...squadPlayers,
      { id: `squad-${Date.now()}`, name: "", role: "", battingHand: "Right", bowlingType: "", notes: "" },
    ]);
  };

  const updateSquadPlayer = (id: string, updates: Partial<Omit<SquadPlayer, "id">>) => {
    persistSquadPlayers(squadPlayers.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const removeSquadPlayer = (id: string) => {
    persistSquadPlayers(squadPlayers.filter((p) => p.id !== id));
  };

  // ── Scoring engine ────────────────────────────────────────────────────────

  const persistMatchScores = (next: MatchScore[]) => {
    localStorage.setItem(MATCH_SCORES_KEY, JSON.stringify(next));
    setMatchScores(next);
  };

  const activeMatch = useMemo(
    () => matchScores.find((m) => m.id === activeMatchId) ?? null,
    [matchScores, activeMatchId],
  );
  const activeInnings = useMemo(
    () => activeMatch?.innings.find((i) => !i.isCompleted) ?? null,
    [activeMatch],
  );
  const activeInningsIdx = useMemo(
    () => activeMatch?.innings.findIndex((i) => !i.isCompleted) ?? -1,
    [activeMatch],
  );
  const currentOver = useMemo(
    () => (activeInnings ? activeInnings.overs[activeInnings.overs.length - 1] ?? null : null),
    [activeInnings],
  );

  const knownOpponentRosters = useMemo(() => {
    const seen = new Map<string, string[]>();
    [...matchScores].reverse().forEach((m) => {
      if (!seen.has(m.teamB)) seen.set(m.teamB, m.teamBPlayers);
    });
    return Array.from(seen.entries()).map(([name, players]) => ({ name, players }));
  }, [matchScores]);

  const inningsTotals = (inn: MatchInnings) => {
    const allDeliveries = inn.overs.flatMap((o) => o.deliveries);
    const runs =
      allDeliveries.reduce((s, d) => s + d.runs + d.extraRuns, 0);
    const wickets = allDeliveries.filter((d) => d.isWicket).length;
    const legalBalls = allDeliveries.filter((d) => !d.isExtra || d.extraType === "bye" || d.extraType === "leg-bye").length;
    const overs = Math.floor(legalBalls / 6);
    const balls = legalBalls % 6;
    return { runs, wickets, oversStr: balls === 0 ? `${overs}` : `${overs}.${balls}` };
  };

  const createMatch = () => {
    const battingFirst =
      matchSetupForm.tossWinner === "A"
        ? matchSetupForm.tossDecision === "bat"
          ? matchSetupForm.teamA
          : matchSetupForm.teamB
        : matchSetupForm.tossDecision === "bat"
          ? matchSetupForm.teamB
          : matchSetupForm.teamA;

    const firstInnings: MatchInnings = {
      id: genId('inn'),
      battingTeam: battingFirst,
      overs: [],
      batsmen: [],
      bowlers: [],
      currentBatsmen: ["", ""],
      currentBowler: "",
      extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0 },
      isCompleted: false,
    };

    const newMatch: MatchScore = {
      id: genId('match'),
      date: new Date().toISOString().slice(0, 10),
      venue: matchSetupForm.venue,
      format: matchSetupForm.format,
      maxOvers: matchSetupForm.maxOvers,
      teamA: matchSetupForm.teamA || "Team A",
      teamB: matchSetupForm.teamB || "Team B",
      teamAPlayers: matchSetupForm.teamAPlayers
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      teamBPlayers: matchSetupForm.teamBPlayers
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      tossWinner: matchSetupForm.tossWinner === "A" ? matchSetupForm.teamA : matchSetupForm.teamB,
      tossDecision: matchSetupForm.tossDecision,
      innings: [firstInnings],
      result: "",
      isCompleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const next = [newMatch, ...matchScores];
    persistMatchScores(next);
    setActiveMatchId(newMatch.id);
    setScoringView("live");
  };

  const deleteMatch = (id: string) => {
    persistMatchScores(matchScores.filter((m) => m.id !== id));
    if (activeMatchId === id) setActiveMatchId(null);
  };

  const updateActiveMatch = (updater: (m: MatchScore) => MatchScore) => {
    if (!activeMatchId) return;
    const next = matchScores.map((m) => (m.id === activeMatchId ? updater(m) : m));
    persistMatchScores(next);
  };

  const commitDelivery = (pd: PendingDelivery, zone?: ScoringZone) => {
    if (!activeMatch || activeInningsIdx < 0) return;

    const isLegalDelivery = !pd.isExtra || pd.extraType === "bye" || pd.extraType === "leg-bye";
    const currentLegalInOver = currentOver?.deliveries.filter(
      (d) => !d.isExtra || d.extraType === "bye" || d.extraType === "leg-bye",
    ).length ?? 0;
    const overWillComplete = isLegalDelivery && currentLegalInOver === 5 && currentOver !== null;

    const inn = activeMatch.innings[activeInningsIdx];
    const delivery: Delivery = {
      id: genId('del'),
      ballInOver: (currentOver?.deliveries.length ?? 0) + 1,
      batsmanName: inn.currentBatsmen[0],
      bowlerName: inn.currentBowler,
      runs: pd.runs,
      isBoundary: pd.isBoundary,
      boundaryType: pd.boundaryType,
      scoringZone: zone,
      isExtra: pd.isExtra,
      extraType: pd.extraType,
      extraRuns: pd.extraRuns,
      isWicket: pd.isWicket,
      dismissalType: pd.dismissalType,
      fielderName: pd.fielderName,
    };

    updateActiveMatch((m) => {
      const innings = m.innings.map((inn, idx) => {
        if (idx !== activeInningsIdx) return inn;

        // Update overs — add to current or create new
        const isLegal = !pd.isExtra || pd.extraType === "bye" || pd.extraType === "leg-bye";
        let overs = [...inn.overs];
        if (overs.length === 0 || (currentOver && currentOver.deliveries.filter((d) => !d.isExtra || d.extraType === "bye" || d.extraType === "leg-bye").length >= 6)) {
          overs = [
            ...overs,
            {
              id: genId('over'),
              overNumber: overs.length + 1,
              bowlerName: inn.currentBowler,
              deliveries: [delivery],
            },
          ];
        } else {
          overs = overs.map((o, i) =>
            i === overs.length - 1 ? { ...o, deliveries: [...o.deliveries, delivery] } : o,
          );
        }

        // Update batsman stats
        let batsmen = [...inn.batsmen];
        const bIdx = batsmen.findIndex((b) => b.name === delivery.batsmanName);
        if (bIdx >= 0) {
          const b = { ...batsmen[bIdx] };
          if (!pd.isExtra) b.balls += 1;
          b.runs += pd.runs;
          if (pd.boundaryType === "4") b.fours += 1;
          if (pd.boundaryType === "6") b.sixes += 1;
          if (zone) b.scoringZones = [...b.scoringZones, zone];
          if (pd.isWicket) {
            b.isOut = true;
            b.dismissalType = pd.dismissalType;
            b.bowlerName = inn.currentBowler;
          }
          batsmen[bIdx] = b;
        } else if (delivery.batsmanName) {
          batsmen = [
            ...batsmen,
            {
              name: delivery.batsmanName,
              runs: pd.runs,
              balls: pd.isExtra ? 0 : 1,
              fours: pd.boundaryType === "4" ? 1 : 0,
              sixes: pd.boundaryType === "6" ? 1 : 0,
              isOut: pd.isWicket,
              dismissalType: pd.isWicket ? pd.dismissalType : undefined,
              bowlerName: pd.isWicket ? inn.currentBowler : undefined,
              scoringZones: zone ? [zone] : [],
              battingOrder: batsmen.length + 1,
            },
          ];
        }

        // Update bowler stats
        let bowlers = [...inn.bowlers];
        const wIdx = bowlers.findIndex((b) => b.name === inn.currentBowler);
        if (wIdx >= 0) {
          const w = { ...bowlers[wIdx] };
          if (isLegal) {
            w.partialBalls = (w.partialBalls + 1) % 6;
            if (w.partialBalls === 0) w.overs += 1;
          }
          w.runs += pd.runs + pd.extraRuns;
          if (pd.isWicket && pd.dismissalType !== "run-out") w.wickets += 1;
          if (zone) w.scoringZones = [...w.scoringZones, zone];
          bowlers[wIdx] = w;
        } else if (inn.currentBowler) {
          bowlers = [
            ...bowlers,
            {
              name: inn.currentBowler,
              overs: isLegal && (overs[overs.length - 1]?.deliveries.filter((d) => !d.isExtra || d.extraType === "bye" || d.extraType === "leg-bye").length ?? 0) % 6 === 0 ? 1 : 0,
              partialBalls: isLegal ? 1 : 0,
              maidens: 0,
              runs: pd.runs + pd.extraRuns,
              wickets: pd.isWicket && pd.dismissalType !== "run-out" ? 1 : 0,
              scoringZones: zone ? [zone] : [],
            },
          ];
        }

        // Update extras
        const extras = { ...inn.extras };
        if (pd.extraType === "wide") extras.wides += pd.extraRuns;
        if (pd.extraType === "no-ball") extras.noBalls += pd.extraRuns;
        if (pd.extraType === "bye") extras.byes += pd.extraRuns;
        if (pd.extraType === "leg-bye") extras.legByes += pd.extraRuns;

        // Rotate strike on odd runs (not on wide)
        let currentBatsmen = [...inn.currentBatsmen] as [string, string];
        if (!pd.isExtra || pd.extraType !== "wide") {
          if (pd.runs % 2 === 1) {
            currentBatsmen = [currentBatsmen[1], currentBatsmen[0]];
          }
        }
        // Rotate at end of over (legal ball count = 6)
        const newLegalCount = overs[overs.length - 1]?.deliveries.filter((d) => !d.isExtra || d.extraType === "bye" || d.extraType === "leg-bye").length ?? 0;
        if (isLegal && newLegalCount === 6) {
          currentBatsmen = [currentBatsmen[1], currentBatsmen[0]];
        }

        // Clear dismissed batsman so the picker appears for next batsman
        if (pd.isWicket) {
          currentBatsmen = currentBatsmen.map((n) => (n === delivery.batsmanName ? "" : n)) as [string, string];
        }

        return { ...inn, overs, batsmen, bowlers, extras, currentBatsmen };
      });

      return { ...m, innings, updatedAt: new Date().toISOString() };
    });

    setPendingDelivery(null);
    setZonePickerOpen(false);
    if (overWillComplete) {
      setShowEndOfOverModal(true);
      setNextBowlerInput("");
    }
  };

  const openZonePicker = (pd: PendingDelivery) => {
    setPendingDelivery(pd);
    setZonePickerOpen(true);
  };

  const confirmZone = (zone: ScoringZone) => {
    if (pendingDelivery) commitDelivery(pendingDelivery, zone);
  };

  const skipZone = () => {
    if (pendingDelivery) commitDelivery(pendingDelivery);
  };

  const rotateStrike = () => {
    if (!activeMatch || activeInningsIdx < 0) return;
    updateActiveMatch((m) => {
      const innings = m.innings.map((inn, idx) => {
        if (idx !== activeInningsIdx) return inn;
        const [a, b] = inn.currentBatsmen;
        return { ...inn, currentBatsmen: [b, a] as [string, string] };
      });
      return { ...m, innings };
    });
  };

  const undoLastDelivery = () => {
    if (!activeMatch || activeInningsIdx < 0 || !activeInnings) return;
    const inn = activeInnings;
    if (inn.overs.length === 0) return;
    const lastOver = inn.overs[inn.overs.length - 1];
    if (lastOver.deliveries.length === 0) return;
    const removed = lastOver.deliveries[lastOver.deliveries.length - 1];

    updateActiveMatch((m) => {
      const innings = m.innings.map((inn, idx) => {
        if (idx !== activeInningsIdx) return inn;
        let overs = inn.overs.map((o, i) =>
          i === inn.overs.length - 1
            ? { ...o, deliveries: o.deliveries.slice(0, -1) }
            : o,
        );
        if (overs[overs.length - 1]?.deliveries.length === 0) {
          overs = overs.slice(0, -1);
        }

        // Reverse batsman stats
        const batsmen = inn.batsmen.map((b) => {
          if (b.name !== removed.batsmanName) return b;
          const updated = { ...b };
          updated.runs -= removed.runs;
          if (!removed.isExtra) updated.balls = Math.max(0, updated.balls - 1);
          if (removed.boundaryType === "4") updated.fours = Math.max(0, updated.fours - 1);
          if (removed.boundaryType === "6") updated.sixes = Math.max(0, updated.sixes - 1);
          if (removed.isWicket) { updated.isOut = false; updated.dismissalType = undefined; updated.bowlerName = undefined; }
          if (removed.scoringZone) updated.scoringZones = updated.scoringZones.slice(0, -1);
          return updated;
        });

        // Reverse bowler stats
        const isLegal = !removed.isExtra || removed.extraType === "bye" || removed.extraType === "leg-bye";
        const bowlers = inn.bowlers.map((w) => {
          if (w.name !== removed.bowlerName) return w;
          const updated = { ...w };
          updated.runs -= removed.runs + removed.extraRuns;
          if (removed.isWicket && removed.dismissalType !== "run-out") updated.wickets = Math.max(0, updated.wickets - 1);
          if (isLegal) {
            if (updated.partialBalls === 0) { updated.overs = Math.max(0, updated.overs - 1); updated.partialBalls = 5; }
            else updated.partialBalls = Math.max(0, updated.partialBalls - 1);
          }
          if (removed.scoringZone) updated.scoringZones = updated.scoringZones.slice(0, -1);
          return updated;
        });

        return { ...inn, overs, batsmen, bowlers };
      });
      return { ...m, innings, updatedAt: new Date().toISOString() };
    });
  };

  const completeInnings = () => {
    if (!activeMatch || activeInningsIdx < 0) return;
    updateActiveMatch((m) => {
      const innings = m.innings.map((inn, idx) =>
        idx === activeInningsIdx ? { ...inn, isCompleted: true } : inn,
      );
      // If this was the first innings, create the second
      if (activeInningsIdx === 0) {
        const battingSecond = m.innings[0].battingTeam === m.teamA ? m.teamB : m.teamA;
        const secondInnings: MatchInnings = {
          id: genId('inn'),
          battingTeam: battingSecond,
          overs: [],
          batsmen: [],
          bowlers: [],
          currentBatsmen: ["", ""],
          currentBowler: "",
          extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0 },
          isCompleted: false,
        };
        return { ...m, innings: [...innings, secondInnings], updatedAt: new Date().toISOString() };
      }
      return { ...m, innings, updatedAt: new Date().toISOString() };
    });
  };

  const confirmEndOfOver = () => {
    if (!nextBowlerInput.trim()) return;
    updateActiveMatch((m) => ({
      ...m,
      innings: m.innings.map((inn, i) =>
        i === activeInningsIdx ? { ...inn, currentBowler: nextBowlerInput.trim() } : inn,
      ),
    }));
    setShowEndOfOverModal(false);
    setNextBowlerInput("");
  };

  const endMatch = (result: string) => {
    if (!activeMatch) return;
    updateActiveMatch((m) => ({
      ...m,
      result,
      isCompleted: true,
      innings: m.innings.map((inn) => ({ ...inn, isCompleted: true })),
      updatedAt: new Date().toISOString(),
    }));
    setScoringView("scorecard");
  };

  // ── end Scoring engine ────────────────────────────────────────────────────

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

  const persistSchedulerResult = (next: SchedulerResult | null) => {
    if (next) {
      localStorage.setItem(SCHEDULER_KEY, JSON.stringify(next));
    } else {
      localStorage.removeItem(SCHEDULER_KEY);
    }
    setSchedulerResult(next);
  };

  const handleGenerateFixtures = () => {
    const config: SchedulerConfig = {
      name: schedulerForm.name || "Season",
      divisions: schedulerForm.divisions,
      venues: schedulerForm.venues,
      startDate: schedulerForm.startDate,
      endDate: schedulerForm.endDate,
      matchDays: schedulerForm.matchDays,
      publicHolidayDates: schedulerForm.publicHolidayDates,
      format: schedulerForm.format,
      rounds: schedulerForm.rounds,
      blackoutDates: schedulerForm.blackoutDates,
    };
    const fixtures = buildSchedulerFixtures(config);
    const result: SchedulerResult = { config, fixtures, generatedAt: new Date().toISOString() };
    persistSchedulerResult(result);
    setSchedulerView("fixtures");
  };

  const canGenerate =
    schedulerForm.startDate &&
    schedulerForm.endDate &&
    schedulerForm.divisions.some((d) => d.teams.length >= 2);

  const schedulerGroupedFixtures = useMemo(() => {
    if (!schedulerResult) return [];
    const filtered =
      schedulerDivisionFilter === "all"
        ? schedulerResult.fixtures
        : schedulerResult.fixtures.filter((f) => f.divisionId === schedulerDivisionFilter);
    const groups = new Map<string, typeof filtered>();
    for (const f of filtered) {
      const key = f.date || "__unscheduled__";
      const existing = groups.get(key);
      if (existing) existing.push(f);
      else groups.set(key, [f]);
    }
    return Array.from(groups.entries())
      .sort(([a], [b]) => {
        if (a === "__unscheduled__") return 1;
        if (b === "__unscheduled__") return -1;
        return a.localeCompare(b);
      })
      .map(([date, fixtures]) => ({ date: date === "__unscheduled__" ? "" : date, fixtures }));
  }, [schedulerResult, schedulerDivisionFilter]);

  const schedulerUnscheduledCount = useMemo(
    () => (schedulerResult ? schedulerResult.fixtures.filter((f) => !f.date).length : 0),
    [schedulerResult],
  );

  const addDivision = () => {
    const id = `div-${Date.now()}`;
    setSchedulerForm((f) => ({ ...f, divisions: [...f.divisions, { id, name: "", teams: [] }] }));
    setDivTeamDrafts((d) => ({ ...d, [id]: "" }));
  };

  const removeDivision = (idx: number) => {
    setSchedulerForm((f) => ({ ...f, divisions: f.divisions.filter((_, i) => i !== idx) }));
  };

  const renameDivision = (idx: number, name: string) => {
    setSchedulerForm((f) => ({
      ...f,
      divisions: f.divisions.map((d, i) => (i === idx ? { ...d, name } : d)),
    }));
  };

  const addTeam = (divIdx: number) => {
    const divId = schedulerForm.divisions[divIdx].id;
    const name = (divTeamDrafts[divId] || "").trim();
    if (!name) return;
    setSchedulerForm((f) => ({
      ...f,
      divisions: f.divisions.map((d, i) =>
        i === divIdx ? { ...d, teams: [...d.teams, { id: `team-${Date.now()}`, name }] } : d,
      ),
    }));
    setDivTeamDrafts((d) => ({ ...d, [divId]: "" }));
  };

  const removeTeam = (divIdx: number, teamIdx: number) => {
    setSchedulerForm((f) => ({
      ...f,
      divisions: f.divisions.map((d, i) =>
        i === divIdx ? { ...d, teams: d.teams.filter((_, ti) => ti !== teamIdx) } : d,
      ),
    }));
  };

  const toggleMatchDay = (day: number) => {
    setSchedulerForm((f) => ({
      ...f,
      matchDays: f.matchDays.includes(day) ? f.matchDays.filter((d) => d !== day) : [...f.matchDays, day],
    }));
  };

  const addVenue = () => {
    const v = schedulerForm.venueDraft.trim();
    if (!v) return;
    setSchedulerForm((f) => ({ ...f, venues: [...f.venues, v], venueDraft: "" }));
  };

  const removeVenue = (idx: number) => {
    setSchedulerForm((f) => ({ ...f, venues: f.venues.filter((_, i) => i !== idx) }));
  };

  const addBlackout = () => {
    const d = schedulerForm.blackoutDraft.trim();
    if (!d || schedulerForm.blackoutDates.includes(d)) return;
    setSchedulerForm((f) => ({
      ...f,
      blackoutDates: [...f.blackoutDates, d].sort(),
      blackoutDraft: "",
    }));
  };

  const removeBlackout = (idx: number) => {
    setSchedulerForm((f) => ({ ...f, blackoutDates: f.blackoutDates.filter((_, i) => i !== idx) }));
  };

  const addPublicHoliday = () => {
    const d = schedulerForm.publicHolidayDraft.trim();
    if (!d || schedulerForm.publicHolidayDates.includes(d)) return;
    setSchedulerForm((f) => ({
      ...f,
      publicHolidayDates: [...f.publicHolidayDates, d].sort(),
      publicHolidayDraft: "",
    }));
  };

  const removePublicHoliday = (idx: number) => {
    setSchedulerForm((f) => ({
      ...f,
      publicHolidayDates: f.publicHolidayDates.filter((_, i) => i !== idx),
    }));
  };

  const addJulyBreak = () => {
    const year = schedulerForm.startDate
      ? parseInt(schedulerForm.startDate.slice(0, 4))
      : new Date().getFullYear();
    // Find first three Saturdays of July (day 6)
    const saturdays: string[] = [];
    const d = new Date(year, 6, 1); // July 1
    while (d.getDay() !== 6) d.setDate(d.getDate() + 1);
    for (let i = 0; i < 3; i++) {
      saturdays.push(toISODate(d));
      d.setDate(d.getDate() + 7);
    }
    setSchedulerForm((f) => ({
      ...f,
      blackoutDates: [...new Set([...f.blackoutDates, ...saturdays])].sort(),
    }));
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

          {templateSectionId === "team" && (
            <section className="squadPanel" aria-label="Squad roster">
              <div className="squadHeader">
                <div>
                  <h3>Squad</h3>
                  <p>Add players, their roles, and coaching notes.</p>
                </div>
                <button type="button" onClick={addSquadPlayer}>Add player</button>
              </div>

              {squadPlayers.length === 0 && (
                <p className="emptySquad">No squad players added yet.</p>
              )}

              <div className="opponentGrid">
                {squadPlayers.map((player) => (
                  <article key={player.id} className="opponentCard">
                    <div className="opponentCardHeader">
                      <strong>{player.name.trim() || "New player"}</strong>
                      <button type="button" onClick={() => removeSquadPlayer(player.id)}>Remove</button>
                    </div>

                    <label>
                      <span>Name</span>
                      <input
                        value={player.name}
                        onChange={(e) => updateSquadPlayer(player.id, { name: e.target.value })}
                        placeholder="Player name"
                      />
                    </label>

                    <label>
                      <span>Role</span>
                      <select
                        value={player.role}
                        onChange={(e) => updateSquadPlayer(player.id, { role: e.target.value })}
                      >
                        <option value="">Select role</option>
                        <option value="Batter">Batter</option>
                        <option value="Bowler">Bowler</option>
                        <option value="All-rounder">All-rounder</option>
                        <option value="Wicket-keeper">Wicket-keeper</option>
                      </select>
                    </label>

                    <label>
                      <span>Batting hand</span>
                      <select
                        value={player.battingHand}
                        onChange={(e) => updateSquadPlayer(player.id, { battingHand: e.target.value })}
                      >
                        <option value="Right">Right</option>
                        <option value="Left">Left</option>
                      </select>
                    </label>

                    <label>
                      <span>Bowling type</span>
                      <select
                        value={player.bowlingType}
                        onChange={(e) => updateSquadPlayer(player.id, { bowlingType: e.target.value })}
                      >
                        <option value="">None / N/A</option>
                        <option value="Right-arm pace">Right-arm pace</option>
                        <option value="Left-arm pace">Left-arm pace</option>
                        <option value="Off-spin">Off-spin</option>
                        <option value="Leg-spin">Leg-spin</option>
                        <option value="Left-arm spin">Left-arm spin</option>
                      </select>
                    </label>

                    <label>
                      <span>Coaching notes</span>
                      <textarea
                        value={player.notes}
                        onChange={(e) => updateSquadPlayer(player.id, { notes: e.target.value })}
                        placeholder="Development focus, technical observations, training priorities"
                        rows={3}
                      />
                    </label>
                  </article>
                ))}
              </div>
            </section>
          )}

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

      {activeTab === "scoring" && (() => {
        // ── Zone coordinates (% from centre, top=away) ──────────────────────
        const ZONES: ScoringZone[] = [
          { x: 50, y: 92, label: "Fine Leg" },
          { x: 22, y: 80, label: "Square Leg" },
          { x: 12, y: 55, label: "Mid-Wicket" },
          { x: 25, y: 22, label: "Mid-On" },
          { x: 75, y: 22, label: "Mid-Off" },
          { x: 88, y: 55, label: "Cover" },
          { x: 80, y: 72, label: "Point" },
          { x: 63, y: 88, label: "Third Man" },
          { x: 38, y: 12, label: "Long-On" },
          { x: 62, y: 12, label: "Long-Off" },
          { x: 8, y: 35, label: "Deep Mid-Wkt" },
          { x: 92, y: 35, label: "Extra Cover" },
        ];

        const dotColor = (d: Delivery) => {
          if (d.boundaryType === "6") return "#fbbf24";
          if (d.boundaryType === "4") return "#22c55e";
          if (d.isWicket) return "#ef4444";
          if (d.isExtra) return "#f59e0b";
          if (d.runs > 0) return "#94a3b8";
          return "#475569";
        };

        const chipLabel = (d: Delivery) => {
          if (d.isWicket) return "W";
          if (d.extraType === "wide") return "Wd";
          if (d.extraType === "no-ball") return "Nb";
          if (d.extraType === "bye") return "B";
          if (d.extraType === "leg-bye") return "Lb";
          if (d.runs === 0) return "•";
          return String(d.runs + d.extraRuns || d.runs);
        };

        const sr = (runs: number, balls: number) =>
          balls === 0 ? "-" : ((runs / balls) * 100).toFixed(0);
        const econ = (runs: number, overs: number, partial: number) => {
          const total = overs + partial / 6;
          return total === 0 ? "-" : (runs / total).toFixed(1);
        };

        const dismissalLabel = (b: BatsmanStats) => {
          if (!b.isOut) return "not out";
          const t = b.dismissalType;
          if (t === "bowled") return `b ${b.bowlerName ?? ""}`;
          if (t === "caught") return `c & b ${b.bowlerName ?? ""}`;
          if (t === "lbw") return `lbw b ${b.bowlerName ?? ""}`;
          if (t === "run-out") return "run out";
          if (t === "stumped") return `st b ${b.bowlerName ?? ""}`;
          return t ?? "out";
        };

        const allMatchBatsmen = (matchId: string | null, bName: string): ScoringZone[] => {
          const source = matchId
            ? matchScores.filter((m) => m.id === matchId)
            : matchScores;
          return source.flatMap((m) =>
            m.innings.flatMap((inn) =>
              inn.batsmen
                .filter((b) => b.name === bName)
                .flatMap((b) => b.scoringZones),
            ),
          );
        };

        const allMatchBowlers = (matchId: string | null, wName: string): ScoringZone[] => {
          const source = matchId
            ? matchScores.filter((m) => m.id === matchId)
            : matchScores;
          return source.flatMap((m) =>
            m.innings.flatMap((inn) =>
              inn.bowlers
                .filter((b) => b.name === wName)
                .flatMap((b) => b.scoringZones),
            ),
          );
        };

        const zoneRunTotals = (zones: ScoringZone[]) => {
          const map = new Map<string, number>();
          zones.forEach((z) => map.set(z.label, (map.get(z.label) ?? 0) + 1));
          return Array.from(map.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);
        };

        // ── Sub-views ────────────────────────────────────────────────────────

        if (scoringView === "list") {
          return (
            <div className="scoringPanel">
              <div className="scoringListHeader">
                <h2>Match Scoring</h2>
                <button type="button" onClick={() => setScoringView("setup")}>
                  New match
                </button>
              </div>
              {matchScores.length === 0 && (
                <p className="scoringEmpty">No matches recorded yet. Start a new match to begin scoring.</p>
              )}
              {matchScores.map((m) => {
                const t = m.innings[0] ? inningsTotals(m.innings[0]) : null;
                const t2 = m.innings[1] ? inningsTotals(m.innings[1]) : null;
                return (
                  <div key={m.id} className="matchCard">
                    <div className="matchCardTop">
                      <span className="matchCardTeams">
                        {m.teamA} vs {m.teamB}
                      </span>
                      <span className="matchCardFormat">{m.format} · {m.date}</span>
                    </div>
                    {t && (
                      <div className="matchCardScores">
                        <span>{m.innings[0].battingTeam}: {t.runs}/{t.wickets} ({t.oversStr} ov)</span>
                        {t2 && <span>{m.innings[1].battingTeam}: {t2.runs}/{t2.wickets} ({t2.oversStr} ov)</span>}
                      </div>
                    )}
                    {m.result && <p className="matchCardResult">{m.result}</p>}
                    <div className="matchCardActions">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveMatchId(m.id);
                          setScoringView(m.isCompleted ? "scorecard" : "live");
                        }}
                      >
                        {m.isCompleted ? "Scorecard" : "Resume"}
                      </button>
                      <button
                        type="button"
                        className="matchCardDelete"
                        onClick={() => deleteMatch(m.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        }

        if (scoringView === "setup") {
          return (
            <div className="scoringPanel">
              <div className="scoringListHeader">
                <h2>New Match</h2>
                <button type="button" onClick={() => setScoringView("list")}>Cancel</button>
              </div>
              <div className="setupGrid">
                <label className="setupField">
                  <span>Team A (your team)</span>
                  <input
                    value={matchSetupForm.teamA}
                    onChange={(e) => setMatchSetupForm((f) => ({ ...f, teamA: e.target.value }))}
                    placeholder="Team name"
                  />
                </label>
                <label className="setupField">
                  <span>Team B (opponent)</span>
                  <input
                    value={matchSetupForm.teamB}
                    onChange={(e) => setMatchSetupForm((f) => ({ ...f, teamB: e.target.value }))}
                    placeholder="Team name"
                  />
                </label>
                <label className="setupField">
                  <span>Format</span>
                  <select
                    value={matchSetupForm.format}
                    onChange={(e) => {
                      const fmt = e.target.value;
                      const overs = fmt === "T20" ? 20 : fmt === "ODI" ? 50 : fmt === "T10" ? 10 : 20;
                      setMatchSetupForm((f) => ({ ...f, format: fmt, maxOvers: overs }));
                    }}
                  >
                    <option value="T20">T20</option>
                    <option value="ODI">ODI</option>
                    <option value="T10">T10</option>
                    <option value="Club">Club</option>
                  </select>
                </label>
                <label className="setupField">
                  <span>Max overs</span>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={matchSetupForm.maxOvers}
                    onChange={(e) => setMatchSetupForm((f) => ({ ...f, maxOvers: Number(e.target.value) }))}
                  />
                </label>
                <label className="setupField setupFieldWide">
                  <span>Venue (optional)</span>
                  <input
                    value={matchSetupForm.venue}
                    onChange={(e) => setMatchSetupForm((f) => ({ ...f, venue: e.target.value }))}
                    placeholder="Ground name"
                  />
                </label>
                <div className="setupField setupFieldWide">
                  <span>Toss</span>
                  <div className="tossRow">
                    <label>
                      <input
                        type="radio"
                        name="tossWinner"
                        value="A"
                        checked={matchSetupForm.tossWinner === "A"}
                        onChange={() => setMatchSetupForm((f) => ({ ...f, tossWinner: "A" }))}
                      />{" "}
                      {matchSetupForm.teamA || "Team A"} won toss
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="tossWinner"
                        value="B"
                        checked={matchSetupForm.tossWinner === "B"}
                        onChange={() => setMatchSetupForm((f) => ({ ...f, tossWinner: "B" }))}
                      />{" "}
                      {matchSetupForm.teamB || "Team B"} won toss
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="tossDecision"
                        value="bat"
                        checked={matchSetupForm.tossDecision === "bat"}
                        onChange={() => setMatchSetupForm((f) => ({ ...f, tossDecision: "bat" }))}
                      />{" "}
                      Elected to bat
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="tossDecision"
                        value="field"
                        checked={matchSetupForm.tossDecision === "field"}
                        onChange={() => setMatchSetupForm((f) => ({ ...f, tossDecision: "field" }))}
                      />{" "}
                      Elected to field
                    </label>
                  </div>
                </div>
                <div className="setupField">
                  <span>Team A players (one per line)</span>
                  <textarea
                    rows={6}
                    value={matchSetupForm.teamAPlayers}
                    onChange={(e) => setMatchSetupForm((f) => ({ ...f, teamAPlayers: e.target.value }))}
                    placeholder={"Player 1\nPlayer 2\n..."}
                  />
                  {squadPlayers.length > 0 && (
                    <button
                      type="button"
                      className="importBtn"
                      onClick={() =>
                        setMatchSetupForm((f) => ({
                          ...f,
                          teamAPlayers: squadPlayers.map((p) => p.name).join("\n"),
                        }))
                      }
                    >
                      Import from squad
                    </button>
                  )}
                </div>
                <div className="setupField">
                  <span>Team B players (one per line)</span>
                  <textarea
                    rows={6}
                    value={matchSetupForm.teamBPlayers}
                    onChange={(e) => setMatchSetupForm((f) => ({ ...f, teamBPlayers: e.target.value }))}
                    placeholder={"Player 1\nPlayer 2\n..."}
                  />
                  {knownOpponentRosters.length > 0 && (
                    <button
                      type="button"
                      className="importBtn"
                      onClick={() => setRosterPickerOpen((o) => !o)}
                    >
                      Import roster
                    </button>
                  )}
                  {rosterPickerOpen && (
                    <div className="rosterPicker">
                      <p className="rosterPickerLabel">Select a previous opponent:</p>
                      {knownOpponentRosters.map((r) => (
                        <button
                          key={r.name}
                          type="button"
                          className="rosterPickerBtn"
                          onClick={() => {
                            setMatchSetupForm((f) => ({
                              ...f,
                              teamB: r.name,
                              teamBPlayers: r.players.join("\n"),
                            }));
                            setRosterPickerOpen(false);
                          }}
                        >
                          {r.name} ({r.players.length} players)
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <button
                type="button"
                className="startMatchBtn"
                onClick={createMatch}
                disabled={!matchSetupForm.teamA || !matchSetupForm.teamB}
              >
                Start match
              </button>
            </div>
          );
        }

        if (scoringView === "live" && activeMatch) {
          const inn = activeInnings ?? activeMatch.innings[activeMatch.innings.length - 1];
          const { runs, wickets, oversStr } = inningsTotals(inn);
          const battingTeam = inn.battingTeam;
          const bowlingTeam = battingTeam === activeMatch.teamA ? activeMatch.teamB : activeMatch.teamA;
          const target =
            activeMatch.innings.length > 1 && !activeMatch.innings[0].isCompleted
              ? null
              : activeMatch.innings[0]?.isCompleted
                ? inningsTotals(activeMatch.innings[0]).runs + 1
                : null;
          const allDeliveries = inn.overs.flatMap((o) => o.deliveries);
          const legalBalls = allDeliveries.filter((d) => !d.isExtra || d.extraType === "bye" || d.extraType === "leg-bye").length;
          const ballsLeft = activeMatch.maxOvers * 6 - legalBalls;
          const rrr = target && ballsLeft > 0
            ? (((target - runs) / ballsLeft) * 6).toFixed(1)
            : null;
          const overDeliveries = currentOver?.deliveries ?? [];
          const striker = inn.currentBatsmen[0];
          const nonStriker = inn.currentBatsmen[1];
          const strikerStats = inn.batsmen.find((b) => b.name === striker);
          const nonStrikerStats = inn.batsmen.find((b) => b.name === nonStriker);
          const bowlerStats = inn.bowlers.find((b) => b.name === inn.currentBowler);

          const recordOutcome = (
            runs: number,
            boundary?: "4" | "6",
            extraType?: "wide" | "no-ball" | "bye" | "leg-bye",
          ) => {
            const extraRuns = extraType === "wide" || extraType === "no-ball" ? 1 : 0;
            const pd: PendingDelivery = {
              runs,
              isBoundary: !!boundary,
              boundaryType: boundary,
              isExtra: !!extraType,
              extraType,
              extraRuns,
              isWicket: false,
            };
            if (boundary) {
              openZonePicker(pd);
            } else {
              commitDelivery(pd);
            }
          };

          return (
            <div className="scoringPanel">
              {/* Score header */}
              <div className="scoreboard">
                <div className="scoreboardMain">
                  <span className="scoreboardTeam">{battingTeam}</span>
                  <span className="scoreboardRuns">{runs}/{wickets}</span>
                  <span className="scoreboardOvers">({oversStr} ov)</span>
                </div>
                {rrr && (
                  <div className="scoreboardTarget">
                    Target: {target} · Need {target! - runs} off {Math.ceil(ballsLeft / 6)}.{ballsLeft % 6 === 0 ? 0 : ballsLeft % 6} overs · RRR: {rrr}
                  </div>
                )}
              </div>

              {/* Batsmen */}
              <div className="batsmenPanel">
                <div className="batsmanRow batsmanRowStriker">
                  <span className="strikeIndicator">*</span>
                  <span className="batsmanName">
                    {striker ? (
                      striker
                    ) : (
                      <button
                        type="button"
                        className="pickPlayerBtn"
                        onClick={() => setShowPlayerPicker({ for: "striker" })}
                      >
                        Choose striker
                      </button>
                    )}
                  </span>
                  {strikerStats && (
                    <span className="batsmanStats">
                      {strikerStats.runs} ({strikerStats.balls}) SR {sr(strikerStats.runs, strikerStats.balls)}
                    </span>
                  )}
                </div>
                <div className="batsmanRow">
                  <span className="strikeIndicator"> </span>
                  <span className="batsmanName">
                    {nonStriker ? (
                      nonStriker
                    ) : (
                      <button
                        type="button"
                        className="pickPlayerBtn"
                        onClick={() => setShowPlayerPicker({ for: "nonStriker" })}
                      >
                        Choose non-striker
                      </button>
                    )}
                  </span>
                  {nonStrikerStats && (
                    <span className="batsmanStats">
                      {nonStrikerStats.runs} ({nonStrikerStats.balls}) SR {sr(nonStrikerStats.runs, nonStrikerStats.balls)}
                    </span>
                  )}
                </div>
                <button type="button" className="swapBtn" onClick={rotateStrike}>⇄ Swap strike</button>
              </div>

              {/* Bowler row */}
              <div className="bowlerPanel">
                <span className="bowlerPanelLabel">Bowling ({bowlingTeam}):</span>
                {inn.currentBowler ? (
                  <span className="bowlerName">{inn.currentBowler}</span>
                ) : (
                  <button
                    type="button"
                    className="pickPlayerBtn"
                    onClick={() => setShowPlayerPicker({ for: "bowler" })}
                  >
                    Choose bowler
                  </button>
                )}
                {bowlerStats && (
                  <span className="bowlerStats">
                    {bowlerStats.overs}-{bowlerStats.maidens}-{bowlerStats.runs}-{bowlerStats.wickets}
                  </span>
                )}
              </div>

              {/* Current over chips */}
              {overDeliveries.length > 0 && (
                <div className="overChips">
                  {overDeliveries.map((d, i) => (
                    <span
                      key={i}
                      className="ballChip"
                      style={{ background: dotColor(d), color: d.runs === 0 && !d.isWicket ? "#e2e8f0" : "#fff" }}
                    >
                      {chipLabel(d)}
                    </span>
                  ))}
                </div>
              )}

              {/* Outcome grid */}
              <div className="outcomeGrid">
                {[0, 1, 2, 3].map((r) => (
                  <button key={r} type="button" className="outcomeBtn" onClick={() => recordOutcome(r)}>
                    {r === 0 ? "•" : r}
                  </button>
                ))}
                <button type="button" className="outcomeBtn boundary" onClick={() => recordOutcome(4, "4")}>4</button>
                <button type="button" className="outcomeBtn boundary six" onClick={() => recordOutcome(6, "6")}>6</button>
                <button
                  type="button"
                  className="outcomeBtn wicket"
                  onClick={() => {
                    setWicketDismissal({ type: "bowled", fielder: "" });
                    setShowWicketModal(true);
                  }}
                >
                  W
                </button>
                <button type="button" className="outcomeBtn extra" onClick={() => setShowExtrasModal({ type: "wide" })}>Wd</button>
                <button type="button" className="outcomeBtn extra" onClick={() => setShowExtrasModal({ type: "no-ball" })}>Nb</button>
                <button type="button" className="outcomeBtn extra" onClick={() => setShowExtrasModal({ type: "bye" })}>B</button>
                <button type="button" className="outcomeBtn extra" onClick={() => setShowExtrasModal({ type: "leg-bye" })}>Lb</button>
                <button type="button" className="outcomeBtn undo" onClick={undoLastDelivery}>Undo</button>
              </div>

              {/* Actions */}
              <div className="liveActions">
                {!activeInnings?.isCompleted && (
                  <button type="button" onClick={completeInnings}>End innings</button>
                )}
                <button type="button" onClick={() => setScoringView("scorecard")}>Scorecard</button>
                {activeMatch.innings.length >= 2 && activeMatch.innings[0].isCompleted && (
                  <button
                    type="button"
                    className="endMatchBtn"
                    onClick={() => endMatch(`${battingTeam} won`)}
                  >
                    End match
                  </button>
                )}
              </div>

              {/* Wicket dismissal modal */}
              {showWicketModal && (
                <div className="modalOverlay">
                  <div className="modalBox">
                    <h3 className="modalTitle">How was the wicket taken?</h3>
                    <div className="dismissalGrid">
                      {(["bowled", "caught", "lbw", "run-out", "stumped", "hit-wicket", "other"] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          className={`dismissalCard${wicketDismissal.type === t ? " selected" : ""}`}
                          onClick={() => setWicketDismissal((d) => ({ ...d, type: t }))}
                        >
                          {t.charAt(0).toUpperCase() + t.slice(1).replace("-", " ")}
                        </button>
                      ))}
                    </div>
                    {(wicketDismissal.type === "caught" || wicketDismissal.type === "stumped" || wicketDismissal.type === "run-out") && (
                      <input
                        className="modalInput"
                        placeholder="Fielder name (optional)"
                        value={wicketDismissal.fielder}
                        onChange={(e) => setWicketDismissal((d) => ({ ...d, fielder: e.target.value }))}
                      />
                    )}
                    <div className="modalActions">
                      <button type="button" className="modalCancel" onClick={() => setShowWicketModal(false)}>Cancel</button>
                      <button
                        type="button"
                        className="modalConfirm wicketConfirm"
                        onClick={() => {
                          const pd: PendingDelivery = {
                            runs: 0, isBoundary: false, isExtra: false, extraRuns: 0,
                            isWicket: true,
                            dismissalType: wicketDismissal.type,
                            fielderName: wicketDismissal.fielder.trim() || undefined,
                          };
                          commitDelivery(pd);
                          setShowWicketModal(false);
                          setWicketDismissal({ type: "bowled", fielder: "" });
                        }}
                      >
                        Record wicket
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Extras run picker modal */}
              {showExtrasModal && (() => {
                const isBasePenalty = showExtrasModal.type === "wide" || showExtrasModal.type === "no-ball";
                const label = showExtrasModal.type === "wide" ? "Wide" : showExtrasModal.type === "no-ball" ? "No Ball" : showExtrasModal.type === "bye" ? "Bye" : "Leg Bye";
                const runOptions = isBasePenalty ? [1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5, 6];
                return (
                  <div className="modalOverlay">
                    <div className="modalBox">
                      <h3 className="modalTitle">{label} — how many runs?</h3>
                      <div className="extrasRunGrid">
                        {runOptions.map((n) => (
                          <button
                            key={n}
                            type="button"
                            className="extrasRunBtn"
                            onClick={() => {
                              const pd: PendingDelivery = {
                                runs: 0, isBoundary: false,
                                isExtra: true, extraType: showExtrasModal.type,
                                extraRuns: n, isWicket: false,
                              };
                              commitDelivery(pd);
                              setShowExtrasModal(null);
                            }}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                      <button type="button" className="modalCancel" onClick={() => setShowExtrasModal(null)}>Cancel</button>
                    </div>
                  </div>
                );
              })()}

              {/* End of over modal */}
              {showEndOfOverModal && (() => {
                const bowlingTeamPlayers = inn.battingTeam === activeMatch.teamA
                  ? activeMatch.teamBPlayers
                  : activeMatch.teamAPlayers;
                return (
                  <div className="modalOverlay">
                    <div className="modalBox">
                      <h3 className="modalTitle">Over complete!</h3>
                      <p className="modalSubtitle">Pick the next bowler</p>
                      {bowlingTeamPlayers.length > 0 && (
                        <div className="playerPickerList">
                          {bowlingTeamPlayers
                            .filter((n) => n !== inn.currentBowler)
                            .map((n) => (
                              <button
                                key={n}
                                type="button"
                                className={`playerPickerItem${nextBowlerInput === n ? " selected" : ""}`}
                                onClick={() => setNextBowlerInput(n)}
                              >
                                {n}
                              </button>
                            ))}
                        </div>
                      )}
                      <input
                        className="modalInput"
                        placeholder="Or type bowler name…"
                        value={nextBowlerInput}
                        onChange={(e) => setNextBowlerInput(e.target.value)}
                      />
                      <div className="modalActions">
                        <button type="button" className="modalCancel" onClick={() => setShowEndOfOverModal(false)}>Later</button>
                        <button
                          type="button"
                          className="modalConfirm"
                          disabled={!nextBowlerInput.trim()}
                          onClick={confirmEndOfOver}
                        >
                          Confirm
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Player picker modal */}
              {showPlayerPicker && (() => {
                const isBowler = showPlayerPicker.for === "bowler";
                const battingTeamPlayers = inn.battingTeam === activeMatch.teamA
                  ? activeMatch.teamAPlayers
                  : activeMatch.teamBPlayers;
                const bowlingTeamPlayers = inn.battingTeam === activeMatch.teamA
                  ? activeMatch.teamBPlayers
                  : activeMatch.teamAPlayers;
                const playerList = isBowler ? bowlingTeamPlayers : battingTeamPlayers;
                const title = isBowler
                  ? `Choose bowler (${bowlingTeam})`
                  : showPlayerPicker.for === "striker"
                  ? "Choose striker"
                  : "Choose non-striker";
                const takenNames = new Set(
                  isBowler ? [inn.currentBowler] : inn.currentBatsmen.filter(Boolean),
                );
                const applyPlayerPick = (n: string) => {
                  if (showPlayerPicker.for === "striker") {
                    updateActiveMatch((m) => ({
                      ...m,
                      innings: m.innings.map((inn, i) =>
                        i === activeInningsIdx
                          ? { ...inn, currentBatsmen: [n, inn.currentBatsmen[1]] }
                          : inn,
                      ),
                    }));
                  } else if (showPlayerPicker.for === "nonStriker") {
                    updateActiveMatch((m) => ({
                      ...m,
                      innings: m.innings.map((inn, i) =>
                        i === activeInningsIdx
                          ? { ...inn, currentBatsmen: [inn.currentBatsmen[0], n] }
                          : inn,
                      ),
                    }));
                  } else {
                    updateActiveMatch((m) => ({
                      ...m,
                      innings: m.innings.map((inn, i) =>
                        i === activeInningsIdx ? { ...inn, currentBowler: n } : inn,
                      ),
                    }));
                  }
                  setPlayerPickerInput("");
                  setShowPlayerPicker(null);
                };
                return (
                  <div className="modalOverlay">
                    <div className="modalBox">
                      <h3 className="modalTitle">{title}</h3>
                      {playerList.length > 0 && (
                        <div className="playerPickerList">
                          {playerList
                            .filter((n) => !takenNames.has(n))
                            .map((n) => (
                              <button
                                key={n}
                                type="button"
                                className="playerPickerItem"
                                onClick={() => applyPlayerPick(n)}
                              >
                                {n}
                              </button>
                            ))}
                        </div>
                      )}
                      <input
                        className="modalInput"
                        placeholder="Or type a name…"
                        value={playerPickerInput}
                        onChange={(e) => setPlayerPickerInput(e.target.value)}
                      />
                      <div className="modalActions">
                        <button type="button" className="modalCancel" onClick={() => { setShowPlayerPicker(null); setPlayerPickerInput(""); }}>Cancel</button>
                        <button
                          type="button"
                          className="modalConfirm"
                          disabled={!playerPickerInput.trim()}
                          onClick={() => applyPlayerPick(playerPickerInput.trim())}
                        >
                          Confirm
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Zone picker overlay */}
              {zonePickerOpen && (
                <div className="zoneOverlay">
                  <div className="zonePickerBox">
                    <h3 className="zonePickerTitle">
                      Where did the {pendingDelivery?.boundaryType} go?
                    </h3>
                    <div className="zoneFieldWrap">
                      <svg viewBox="0 0 100 100" className="zoneFieldSvg">
                        <ellipse cx="50" cy="50" rx="48" ry="48" fill="#2f8438" stroke="#1d5a26" strokeWidth="1" />
                        <ellipse cx="50" cy="50" rx="38" ry="38" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" strokeDasharray="3 2" />
                        <ellipse cx="50" cy="50" rx="20" ry="20" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" strokeDasharray="2 2" />
                        <rect x="47" y="36" width="6" height="28" rx="2" fill="#c8a06a" stroke="#a47e4f" strokeWidth="0.5" />
                        {ZONES.map((z) => (
                          <g key={z.label}>
                            <circle
                              cx={z.x}
                              cy={z.y}
                              r="8"
                              fill="rgba(255,255,255,0.15)"
                              stroke="rgba(255,255,255,0.4)"
                              strokeWidth="0.5"
                              className="zoneCircle"
                              onClick={() => confirmZone(z)}
                              style={{ cursor: "pointer" }}
                            />
                            <text
                              x={z.x}
                              y={z.y + 0.8}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fill="white"
                              fontSize="4"
                              style={{ pointerEvents: "none", userSelect: "none" }}
                            >
                              {z.label.split(" ").map((w, i, arr) => (
                                <tspan key={i} x={z.x} dy={i === 0 ? (arr.length > 1 ? -2 : 0) : 4}>
                                  {w}
                                </tspan>
                              ))}
                            </text>
                          </g>
                        ))}
                      </svg>
                    </div>
                    <button type="button" className="skipZoneBtn" onClick={skipZone}>
                      Skip / don't record zone
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        }

        if (scoringView === "scorecard" && activeMatch) {
          const scorecardInnings = scorecardInningsIdx;
          const setScorecardInnings = setScorecardInningsIdx;
          const inn = activeMatch.innings[scorecardInnings];
          if (!inn) return null;
          const { runs, wickets, oversStr } = inningsTotals(inn);
          const extras = inn.extras.wides + inn.extras.noBalls + inn.extras.byes + inn.extras.legByes;

          return (
            <div className="scoringPanel">
              <div className="scoringListHeader">
                <h2>Scorecard</h2>
                <div style={{ display: "flex", gap: 6 }}>
                  {!activeMatch.isCompleted && (
                    <button type="button" onClick={() => setScoringView("live")}>Live</button>
                  )}
                  <button type="button" onClick={() => setScoringView("list")}>Matches</button>
                </div>
              </div>

              {activeMatch.innings.length > 1 && (
                <div className="inningsTabs">
                  {activeMatch.innings.map((inn, i) => (
                    <button
                      key={inn.id}
                      type="button"
                      className={scorecardInnings === i ? "active" : ""}
                      onClick={() => setScorecardInnings(i)}
                    >
                      {inn.battingTeam} innings
                    </button>
                  ))}
                </div>
              )}

              <p className="inningsTotal">
                {inn.battingTeam}: {runs}/{wickets} ({oversStr} ov)
              </p>

              <div className="scorecardSection">
                <h3>Batting</h3>
                <table className="scorecardTable">
                  <thead>
                    <tr>
                      <th>Batsman</th>
                      <th>R</th>
                      <th>B</th>
                      <th>4s</th>
                      <th>6s</th>
                      <th>SR</th>
                      <th>Dismissal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inn.batsmen
                      .slice()
                      .sort((a, b) => a.battingOrder - b.battingOrder)
                      .map((b) => (
                        <tr key={b.name}>
                          <td>{b.name}</td>
                          <td>{b.runs}</td>
                          <td>{b.balls}</td>
                          <td>{b.fours}</td>
                          <td>{b.sixes}</td>
                          <td>{sr(b.runs, b.balls)}</td>
                          <td className="dismissalCell">{dismissalLabel(b)}</td>
                        </tr>
                      ))}
                    <tr className="extrasRow">
                      <td colSpan={7}>
                        Extras: {extras} (Wd: {inn.extras.wides} Nb: {inn.extras.noBalls} B: {inn.extras.byes} Lb: {inn.extras.legByes})
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="scorecardSection">
                <h3>Bowling</h3>
                <table className="scorecardTable">
                  <thead>
                    <tr>
                      <th>Bowler</th>
                      <th>O</th>
                      <th>M</th>
                      <th>R</th>
                      <th>W</th>
                      <th>Econ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inn.bowlers.map((w) => (
                      <tr key={w.name}>
                        <td>{w.name}</td>
                        <td>{w.partialBalls > 0 ? `${w.overs}.${w.partialBalls}` : w.overs}</td>
                        <td>{w.maidens}</td>
                        <td>{w.runs}</td>
                        <td>{w.wickets}</td>
                        <td>{econ(w.runs, w.overs, w.partialBalls)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button type="button" className="analysisLinkBtn" onClick={() => setScoringView("analysis")}>
                View Analysis
              </button>
            </div>
          );
        }

        if (scoringView === "analysis" && activeMatch) {
          const allMatches = allMatchesAnalysis;
          const setAllMatches = setAllMatchesAnalysis;
          const matchIdFilter = allMatches ? null : activeMatch.id;

          const batsmanNames = Array.from(
            new Set(
              (allMatches ? matchScores : [activeMatch]).flatMap((m) =>
                m.innings.flatMap((inn) => inn.batsmen.map((b) => b.name)),
              ),
            ),
          );
          const bowlerNames = Array.from(
            new Set(
              (allMatches ? matchScores : [activeMatch]).flatMap((m) =>
                m.innings.flatMap((inn) => inn.bowlers.map((b) => b.name)),
              ),
            ),
          );

          const zones =
            analysisMode === "batsman"
              ? allMatchBatsmen(matchIdFilter, analysisBatsman)
              : allMatchBowlers(matchIdFilter, analysisBowler);

          const topZones = zoneRunTotals(zones);

          return (
            <div className="scoringPanel">
              <div className="scoringListHeader">
                <h2>Analysis</h2>
                <div style={{ display: "flex", gap: 6 }}>
                  <button type="button" onClick={() => setScoringView("scorecard")}>Scorecard</button>
                  <button type="button" onClick={() => setScoringView("list")}>Matches</button>
                </div>
              </div>

              {/* Batsman / Bowler toggle */}
              <div className="analysisModeRow">
                <button
                  type="button"
                  className={analysisMode === "batsman" ? "active" : ""}
                  onClick={() => setAnalysisMode("batsman")}
                >
                  Batsman
                </button>
                <button
                  type="button"
                  className={analysisMode === "bowler" ? "active" : ""}
                  onClick={() => setAnalysisMode("bowler")}
                >
                  Bowler
                </button>
              </div>

              {/* Selector */}
              {analysisMode === "batsman" ? (
                <label className="setupField">
                  <span>Select batsman</span>
                  <select value={analysisBatsman} onChange={(e) => setAnalysisBatsman(e.target.value)}>
                    <option value="">— choose —</option>
                    {batsmanNames.map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </label>
              ) : (
                <label className="setupField">
                  <span>Select bowler</span>
                  <select value={analysisBowler} onChange={(e) => setAnalysisBowler(e.target.value)}>
                    <option value="">— choose —</option>
                    {bowlerNames.map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </label>
              )}

              {/* All matches toggle */}
              <label className="allMatchesToggle">
                <input type="checkbox" checked={allMatches} onChange={(e) => setAllMatches(e.target.checked)} />
                {" "}Show all matches
              </label>

              {/* Field diagram with zone dots */}
              {(analysisBatsman || analysisBowler) && (
                <>
                  <div className="analysisField">
                    <svg viewBox="0 0 100 100" className="analysisFieldSvg">
                      <ellipse cx="50" cy="50" rx="48" ry="48" fill="#2f8438" stroke="#1d5a26" strokeWidth="1" />
                      <ellipse cx="50" cy="50" rx="38" ry="38" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" strokeDasharray="3 2" />
                      <ellipse cx="50" cy="50" rx="20" ry="20" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" strokeDasharray="2 2" />
                      <rect x="47" y="36" width="6" height="28" rx="2" fill="#c8a06a" stroke="#a47e4f" strokeWidth="0.5" />
                      {/* Zone labels */}
                      {ZONES.map((z) => (
                        <text
                          key={z.label}
                          x={z.x}
                          y={z.y}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="rgba(255,255,255,0.35)"
                          fontSize="3.2"
                          style={{ userSelect: "none" }}
                        >
                          {z.label}
                        </text>
                      ))}
                      {/* Scored zone dots */}
                      {zones.map((z, i) => (
                        <circle
                          key={i}
                          cx={z.x + ((i * 1.618) % 4) - 2}
                          cy={z.y + ((i * 2.414) % 4) - 2}
                          r="2.5"
                          fill={analysisMode === "batsman" ? "#22c55e" : "#f59e0b"}
                          opacity="0.8"
                          stroke="white"
                          strokeWidth="0.3"
                        />
                      ))}
                    </svg>
                  </div>

                  {topZones.length > 0 && (
                    <div className="analysisZoneSummary">
                      <h4>
                        {analysisMode === "batsman" ? "Scores heavily:" : "Concedes most to:"}
                      </h4>
                      <ul>
                        {topZones.map(([label, count]) => (
                          <li key={label}>{label} ({count} deliveries)</li>
                        ))}
                      </ul>
                      <p className="analysisSuggestion">
                        {analysisMode === "batsman"
                          ? `Consider placing a fielder at ${topZones[0]?.[0]} when ${analysisBatsman} is batting.`
                          : `Consider strengthening ${topZones[0]?.[0]} when ${analysisBowler} is bowling.`}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        }

        return null;
      })()}

      {activeTab === "scheduler" && (() => {
        const divisionColors = ["#16a34a", "#0284c7", "#9333ea", "#dc2626", "#d97706", "#0891b2"];

        if (schedulerView === "setup") {
          return (
            <div className="schedulerPanel">
              <header className="schedulerHeader">
                <div>
                  <h2>Fixture Scheduler</h2>
                  <p>Configure the season and generate fixtures for all divisions.</p>
                </div>
                <button
                  type="button"
                  className="schGenerateBtn"
                  onClick={handleGenerateFixtures}
                  disabled={!canGenerate}
                >
                  Generate Fixtures
                </button>
              </header>

              {/* Card 1: League info */}
              <div className="schedulerCard">
                <label className="schLabel">
                  Season / League name
                  <input
                    className="schInput"
                    type="text"
                    value={schedulerForm.name}
                    onChange={(e) => setSchedulerForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. 2026 Summer Season"
                  />
                </label>
                <div className="schedulerRow2">
                  <label className="schLabel">
                    Format
                    <select
                      className="schInput"
                      value={schedulerForm.format}
                      onChange={(e) => setSchedulerForm((f) => ({ ...f, format: e.target.value }))}
                    >
                      <option value="T20">T20</option>
                      <option value="50 Overs">50 Overs</option>
                      <option value="Club">Club</option>
                      <option value="Friendly">Friendly</option>
                    </select>
                  </label>
                  <label className="schLabel">
                    Rounds
                    <select
                      className="schInput"
                      value={schedulerForm.rounds}
                      onChange={(e) =>
                        setSchedulerForm((f) => ({
                          ...f,
                          rounds: e.target.value as "single" | "double",
                        }))
                      }
                    >
                      <option value="single">Single round-robin</option>
                      <option value="double">Double round-robin</option>
                    </select>
                  </label>
                </div>
              </div>

              {/* Card 2: Season dates + match days */}
              <div className="schedulerCard">
                <div className="schedulerRow2">
                  <label className="schLabel">
                    Start date
                    <input
                      className="schInput"
                      type="date"
                      value={schedulerForm.startDate}
                      onChange={(e) => setSchedulerForm((f) => ({ ...f, startDate: e.target.value }))}
                    />
                  </label>
                  <label className="schLabel">
                    End date
                    <input
                      className="schInput"
                      type="date"
                      value={schedulerForm.endDate}
                      onChange={(e) => setSchedulerForm((f) => ({ ...f, endDate: e.target.value }))}
                    />
                  </label>
                </div>
                <fieldset className="schedulerMatchDays">
                  <legend>Match days</legend>
                  {(["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const).map((day, i) => (
                    <label
                      key={i}
                      className={`schedulerDayChip${schedulerForm.matchDays.includes(i) ? " active" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={schedulerForm.matchDays.includes(i)}
                        onChange={() => toggleMatchDay(i)}
                      />
                      {day}
                    </label>
                  ))}
                </fieldset>
                <div className="schedulerPublicHolidays">
                  <span className="schSubHeading">Public Holiday / Extra Dates</span>
                  <p className="schedulerHint">Add specific dates when matches can also be played.</p>
                  <div className="schedulerTagList">
                    {schedulerForm.publicHolidayDates.map((d, i) => (
                      <span key={d} className="schedulerTag">
                        {formatSchedulerDate(d)}
                        <button type="button" onClick={() => removePublicHoliday(i)}>×</button>
                      </span>
                    ))}
                  </div>
                  <div className="schedulerTeamAdd">
                    <input
                      className="schInput"
                      type="date"
                      value={schedulerForm.publicHolidayDraft}
                      onChange={(e) => setSchedulerForm((f) => ({ ...f, publicHolidayDraft: e.target.value }))}
                    />
                    <button type="button" className="schAddBtn" onClick={addPublicHoliday}>Add</button>
                  </div>
                </div>
              </div>

              {/* Card 3: Divisions */}
              <div className="schedulerCard">
                <div className="schedulerCardHeader">
                  <h3>Divisions &amp; Teams</h3>
                  <button type="button" className="schAddBtn" onClick={addDivision}>+ Add Division</button>
                </div>
                {schedulerForm.divisions.length === 0 && (
                  <p className="schedulerHint">No divisions yet — add one to get started.</p>
                )}
                {schedulerForm.divisions.map((div, di) => {
                  const rounds =
                    div.teams.length < 2
                      ? 0
                      : div.teams.length % 2 === 0
                        ? div.teams.length - 1
                        : div.teams.length;
                  const totalRounds = schedulerForm.rounds === "double" ? rounds * 2 : rounds;
                  return (
                    <div className="schedulerDivision" key={div.id}>
                      <div className="schedulerDivisionHeader">
                        <input
                          className="schInput"
                          value={div.name}
                          onChange={(e) => renameDivision(di, e.target.value)}
                          placeholder="Division name"
                        />
                        <button type="button" className="schRemoveBtn" onClick={() => removeDivision(di)}>
                          Remove
                        </button>
                      </div>
                      <div className="schedulerTeamList">
                        {div.teams.map((team, ti) => (
                          <span key={team.id} className="schedulerTeamChip">
                            {team.name}
                            <button type="button" onClick={() => removeTeam(di, ti)}>×</button>
                          </span>
                        ))}
                      </div>
                      <div className="schedulerTeamAdd">
                        <input
                          className="schInput"
                          placeholder="Team name"
                          value={divTeamDrafts[div.id] || ""}
                          onChange={(e) =>
                            setDivTeamDrafts((d) => ({ ...d, [div.id]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addTeam(di);
                            }
                          }}
                        />
                        <button type="button" className="schAddBtn" onClick={() => addTeam(di)}>Add</button>
                      </div>
                      <p className="schedulerHint">
                        {div.teams.length} team{div.teams.length !== 1 ? "s" : ""}
                        {totalRounds > 0 ? ` · ${totalRounds} rounds` : ""}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Card 4: Venues */}
              <div className="schedulerCard">
                <div className="schedulerCardHeader">
                  <h3>Venues <span className="schOptional">(optional)</span></h3>
                </div>
                <div className="schedulerTagList">
                  {schedulerForm.venues.map((v, i) => (
                    <span key={i} className="schedulerTag">
                      {v}
                      <button type="button" onClick={() => removeVenue(i)}>×</button>
                    </span>
                  ))}
                </div>
                <div className="schedulerTeamAdd">
                  <input
                    className="schInput"
                    placeholder="Ground / Oval name"
                    value={schedulerForm.venueDraft}
                    onChange={(e) => setSchedulerForm((f) => ({ ...f, venueDraft: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addVenue();
                      }
                    }}
                  />
                  <button type="button" className="schAddBtn" onClick={addVenue}>Add</button>
                </div>
              </div>

              {/* Card 5: Blackout dates */}
              <div className="schedulerCard">
                <div className="schedulerCardHeader">
                  <h3>Blackout Dates <span className="schOptional">(optional)</span></h3>
                  <button type="button" className="schChip" onClick={addJulyBreak}>
                    + July break (3 wks)
                  </button>
                </div>
                <div className="schedulerTagList">
                  {schedulerForm.blackoutDates.map((d, i) => (
                    <span key={d} className="schedulerTag">
                      {formatSchedulerDate(d)}
                      <button type="button" onClick={() => removeBlackout(i)}>×</button>
                    </span>
                  ))}
                </div>
                <div className="schedulerTeamAdd">
                  <input
                    className="schInput"
                    type="date"
                    value={schedulerForm.blackoutDraft}
                    onChange={(e) => setSchedulerForm((f) => ({ ...f, blackoutDraft: e.target.value }))}
                  />
                  <button type="button" className="schAddBtn" onClick={addBlackout}>Add</button>
                </div>
              </div>
            </div>
          );
        }

        if (schedulerView === "fixtures" && schedulerResult) {
          const { config, fixtures } = schedulerResult;
          return (
            <div className="schedulerPanel">
              <header className="schedulerHeader">
                <div>
                  <h2>{config.name || "Season Fixtures"}</h2>
                  <p>
                    {fixtures.length} fixture{fixtures.length !== 1 ? "s" : ""}
                    {schedulerUnscheduledCount > 0 && (
                      <span className="schWarnBadge"> · ⚠ {schedulerUnscheduledCount} unscheduled</span>
                    )}
                  </p>
                </div>
                <div className="schedulerHeaderActions">
                  <select
                    className="schInput"
                    value={schedulerDivisionFilter}
                    onChange={(e) => setSchedulerDivisionFilter(e.target.value)}
                  >
                    <option value="all">All divisions</option>
                    {config.divisions.map((d) => (
                      <option key={d.id} value={d.id}>{d.name || "Unnamed"}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="schAddBtn"
                    onClick={() => exportSchedulerText(schedulerResult)}
                  >
                    Export
                  </button>
                  <button
                    type="button"
                    className="schChip"
                    onClick={() => setSchedulerView("setup")}
                  >
                    ← Edit
                  </button>
                </div>
              </header>

              {schedulerUnscheduledCount > 0 && (
                <div className="schedulerWarning">
                  ⚠ {schedulerUnscheduledCount} fixture{schedulerUnscheduledCount !== 1 ? "s" : ""} have no
                  date — extend the season or add more match days.
                </div>
              )}

              {schedulerGroupedFixtures.map(({ date, fixtures: group }) => (
                <div className="schedulerDateGroup" key={date || "__unscheduled__"}>
                  <h3 className="schedulerDateHeading">
                    {date ? formatSchedulerDate(date) : "Unscheduled"}
                  </h3>
                  {group.map((f) => {
                    const divIdx = config.divisions.findIndex((d) => d.id === f.divisionId);
                    const color = divisionColors[divIdx % divisionColors.length] || "#16a34a";
                    return (
                      <div className="schedulerFixtureRow" key={f.id}>
                        <span className="schedulerDivBadge" style={{ background: color }}>
                          {f.divisionName || "Div"}
                        </span>
                        <span className="schedulerTeams">
                          <strong>{f.homeTeam}</strong>
                          <em> vs </em>
                          <strong>{f.awayTeam}</strong>
                        </span>
                        {f.venue && <span className="schedulerVenue">{f.venue}</span>}
                        <span className="schedulerRound">Rd {f.round}</span>
                      </div>
                    );
                  })}
                </div>
              ))}

              {fixtures.length === 0 && (
                <p className="schedulerHint" style={{ textAlign: "center", padding: "24px 0" }}>
                  No fixtures generated.
                </p>
              )}
            </div>
          );
        }

        return null;
      })()}

    </main>
  );
}

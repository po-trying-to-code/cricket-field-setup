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
const MAX_POSITIONS = 11;

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

const getFieldLabel = (player: SelectedPosition) => player.fielderName.trim() || FIELD_LABELS[player.name] || player.name;

const normalizeSavedFormation = (data: unknown): SavedFormation | null => {
  if (!data || typeof data !== "object") return null;
  const formation = data as Partial<SavedFormation>;
  if (!Array.isArray(formation.players) || typeof formation.name !== "string") return null;

  return {
    id: typeof formation.id === "string" ? formation.id : `${Date.now()}-${createId(formation.name)}`,
    name: formation.name,
    teamName: typeof formation.teamName === "string" ? formation.teamName : "",
    players: formation.players.map((player) => ({ ...player, fielderName: player.fielderName ?? "" })),
    isLeftHander: typeof formation.isLeftHander === "boolean" ? formation.isLeftHander : false,
    isEndOverRotated: typeof formation.isEndOverRotated === "boolean" ? formation.isEndOverRotated : false,
  };
};

export default function App() {
  const [players, setPlayers] = useState<SelectedPosition[]>([]);
  const [savedFormations, setSavedFormations] = useState<SavedFormation[]>([]);
  const [activeFormationId, setActiveFormationId] = useState("");
  const [formationName, setFormationName] = useState("My Formation");
  const [teamName, setTeamName] = useState("");
  const [isLeftHander, setIsLeftHander] = useState(false);
  const [isEndOverRotated, setIsEndOverRotated] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const fieldRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
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
      preset.positions.map((name) => ({
        id: createId(name),
        fielderName: currentNames.get(name) ?? "",
        ...getPositionByName(name, isLeftHander, isEndOverRotated),
      })),
    );
  };

  const addPosition = (position: FieldPosition) => {
    if (players.length >= MAX_POSITIONS || players.some((player) => player.name === position.name)) return;
    setPlayers((prev) => [...prev, createSelectedPosition(position, isLeftHander, isEndOverRotated)]);
  };

  const togglePosition = (position: FieldPosition) => {
    const selectedPlayer = players.find((player) => player.name === position.name);
    if (selectedPlayer) {
      removePosition(selectedPlayer.id);
      return;
    }

    addPosition(position);
  };

  const removePosition = (id: string) => {
    setPlayers((prev) => prev.filter((player) => player.id !== id));
  };

  const renameFielder = (id: string, fielderName: string) => {
    setPlayers((prev) => prev.map((player) => (player.id === id ? { ...player, fielderName } : player)));
  };

  const handleFielderChipDragStart = (event: React.DragEvent<HTMLButtonElement>, id: string, fielderName: string) => {
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
      const targetPlayer = prev.find((player) => player.id === targetId);
      const targetName = targetPlayer?.fielderName ?? "";

      return prev.map((player) => {
        if (player.id === targetId) return { ...player, fielderName: droppedName };
        if (sourceId && player.id === sourceId) return { ...player, fielderName: targetName };
        return player;
      });
    });
  };

  const changeBatterHand = (nextIsLeftHander: boolean) => {
    setIsLeftHander(nextIsLeftHander);
    setPlayers((prev) =>
      prev.map((player) => ({
        ...player,
        ...getPositionByName(player.name, nextIsLeftHander, isEndOverRotated),
      })),
    );
  };

  const changeEndOverRotation = (nextIsEndOverRotated: boolean) => {
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
    const rect = fieldRef.current.getBoundingClientRect();
    let x = ((e.clientX - rect.left) / rect.width) * 100;
    let y = ((e.clientY - rect.top) / rect.height) * 100;

    x = Math.max(4, Math.min(96, x));
    y = Math.max(4, Math.min(96, y));

    setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, x, y } : p)));
  };

  const snapPlayerToNearestPosition = (id: string) => {
    setPlayers((prev) => {
      const draggedPlayer = prev.find((player) => player.id === id);
      if (!draggedPlayer) return prev;

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
  const title = useMemo(
    () =>
      `${formationName} - ${isLeftHander ? "Left" : "Right"}-hand batter${
        isEndOverRotated ? " - End over rotated" : ""
      } - ODI/T20 Field Planner`,
    [formationName, isLeftHander, isEndOverRotated],
  );

  return (
    <main className="app">
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
        <div className="field" ref={fieldRef}>
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
              className={`player ${draggingId === p.id ? "dragging" : ""}`}
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
              onPointerDown={(e) => {
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
        </div>
      </section>

      <section className="selector" aria-label="Field position selector">
        <div className="selectorHeader">
          <h1>Choose field positions</h1>
          <span>
            {players.length}/{MAX_POSITIONS}
          </span>
        </div>
        <p className="selectorHint">Choose a preset, enter fielder names, then drag a name chip to move or swap players between positions.</p>

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
                        draggable
                        onClick={() => renameFielder(player.id, "")}
                        onDragStart={(e) => handleFielderChipDragStart(e, player.id, player.fielderName)}
                        title="Drag to another position, or tap to clear"
                      >
                        {player.fielderName.trim()}
                      </button>
                    </div>
                  )}
                </div>
              </label>
              <button className="removePosition" onClick={() => removePosition(player.id)} aria-label={`Remove ${player.name}`}>
                x
              </button>
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
                  disabled={!isSelected && players.length >= MAX_POSITIONS}
                >
                  {position.name}
                </button>
              );
            })}
          </div>
        </details>
      </section>

      <footer className="actions">
        <button onClick={resetFormation}>Suggested XI</button>
        <button onClick={exportFormationImage}>Share PNG</button>
        <button onClick={() => setPlayers([])}>Clear</button>
      </footer>

      <p className="hint">{title}</p>
    </main>
  );
}

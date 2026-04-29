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

type PendingFieldAssignment = {
  fielderName: string;
  position: FieldPosition;
};

type SavedFormation = {
  id: string;
  name: string;
  players: SelectedPosition[];
  teamPlayers: string[];
  isLeftHander: boolean;
  isEndOverRotated: boolean;
};

const FIELD_POSITIONS: FieldPosition[] = [
  { name: "Bowler", x: 50, y: 38 },
  { name: "Wicket Keeper", x: 50, y: 76 },
  { name: "First Slip", x: 43, y: 74 },
  { name: "Second Slip", x: 39, y: 73 },
  { name: "Third Slip", x: 35, y: 72 },
  { name: "Fourth Slip", x: 31, y: 70 },
  { name: "Fly Slip", x: 24, y: 69 },
  { name: "Leg Slip", x: 57, y: 74 },
  { name: "Gully", x: 32, y: 66 },
  { name: "Silly Point", x: 43, y: 56 },
  { name: "Short Leg", x: 57, y: 57 },
  { name: "Silly Mid-off", x: 45, y: 46 },
  { name: "Silly Mid-on", x: 55, y: 46 },
  { name: "Backward Point", x: 22, y: 58 },
  { name: "Point", x: 26, y: 54 },
  { name: "Deep Point", x: 10, y: 53 },
  { name: "Deep Backward Point", x: 13, y: 63 },
  { name: "Cover Point", x: 29, y: 48 },
  { name: "Cover", x: 34, y: 42 },
  { name: "Extra Cover", x: 39, y: 36 },
  { name: "Deep Cover", x: 17, y: 33 },
  { name: "Deep Extra Cover", x: 25, y: 23 },
  { name: "Sweeper Cover", x: 12, y: 42 },
  { name: "Mid-off", x: 45, y: 35 },
  { name: "Long-off", x: 42, y: 12 },
  { name: "Mid-on", x: 55, y: 35 },
  { name: "Long-on", x: 58, y: 12 },
  { name: "Straight Hit", x: 50, y: 8 },
  { name: "Midwicket", x: 66, y: 42 },
  { name: "Deep Midwicket", x: 83, y: 32 },
  { name: "Cow Corner", x: 77, y: 22 },
  { name: "Square Leg", x: 73, y: 54 },
  { name: "Backward Square Leg", x: 74, y: 61 },
  { name: "Deep Square Leg", x: 90, y: 57 },
  { name: "Fine Leg", x: 63, y: 72 },
  { name: "Short Fine Leg", x: 58, y: 67 },
  { name: "Long Leg", x: 76, y: 82 },
  { name: "Deep Fine Leg", x: 65, y: 90 },
  { name: "Short Third", x: 39, y: 67 },
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
  "Midwicket",
  "Square Leg",
  "Fine Leg",
  "Third Man",
  "Long-off",
];

const FIELD_PRESETS: FieldPreset[] = [
  {
    id: "fast-powerplay",
    name: "Fast bowling - Powerplay",
    positions: [
      "Bowler",
      "Wicket Keeper",
      "First Slip",
      "Short Third",
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
      "Mid-off",
      "Fine Leg",
      "Deep Cover",
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
      "Deep Extra Cover",
      "Long-off",
      "Long-on",
      "Deep Midwicket",
    ],
  },
  {
    id: "death-overs",
    name: "Death overs - Boundary protection",
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
      "Deep Point",
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

const STORAGE_KEY = "cricket-field-formation-v2";
const SAVED_FORMATIONS_KEY = "cricket-field-saved-formations-v1";
const MAX_POSITIONS = 11;
const TEAM_PLAYER_COUNT = 12;
const MANDATORY_TEAM_PLAYERS = 11;

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

const createEmptyTeamPlayers = () => Array.from({ length: TEAM_PLAYER_COUNT }, () => "");

const normalizeTeamPlayers = (value: unknown) =>
  Array.from({ length: TEAM_PLAYER_COUNT }, (_, index) =>
    Array.isArray(value) && typeof value[index] === "string" ? value[index] : "",
  );

const normalizeSavedFormation = (data: unknown): SavedFormation | null => {
  if (!data || typeof data !== "object") return null;
  const formation = data as Partial<SavedFormation>;
  if (!Array.isArray(formation.players) || typeof formation.name !== "string") return null;

  return {
    id: typeof formation.id === "string" ? formation.id : `${Date.now()}-${createId(formation.name)}`,
    name: formation.name,
    players: formation.players.map((player) => ({ ...player, fielderName: player.fielderName ?? "" })),
    teamPlayers: normalizeTeamPlayers(formation.teamPlayers),
    isLeftHander: typeof formation.isLeftHander === "boolean" ? formation.isLeftHander : false,
    isEndOverRotated: typeof formation.isEndOverRotated === "boolean" ? formation.isEndOverRotated : false,
  };
};

export default function App() {
  const [players, setPlayers] = useState<SelectedPosition[]>([]);
  const [teamPlayers, setTeamPlayers] = useState<string[]>(createEmptyTeamPlayers);
  const [pendingFieldAssignment, setPendingFieldAssignment] = useState<PendingFieldAssignment | null>(null);
  const [savedFormations, setSavedFormations] = useState<SavedFormation[]>([]);
  const [activeFormationId, setActiveFormationId] = useState("");
  const [formationName, setFormationName] = useState("My Formation");
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
        setTeamPlayers(legacyFormation.teamPlayers);
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

  const missingMandatoryTeamPlayers = useMemo(
    () => teamPlayers.slice(0, MANDATORY_TEAM_PLAYERS).filter((name) => !name.trim()).length,
    [teamPlayers],
  );
  const filledTeamPlayers = useMemo(() => teamPlayers.filter((name) => name.trim()).length, [teamPlayers]);

  const saveFormation = () => {
    if (duplicateMessage) {
      alert(duplicateMessage);
      return;
    }

    const savedFormation: SavedFormation = {
      id: activeFormationId || `${Date.now()}-${createId(formationName || "formation")}`,
      name: formationName.trim() || "Untitled Formation",
      players,
      teamPlayers,
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
      players,
      teamPlayers,
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
    setPlayers(savedFormation.players);
    setTeamPlayers(normalizeTeamPlayers(savedFormation.teamPlayers));
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
    context.fillText(formationName || "Field Formation", size / 2, 58);

    context.fillStyle = "#486581";
    context.font = "500 24px Inter, Arial, sans-serif";
    context.fillText(
      `${isLeftHander ? "Left" : "Right"}-hand batter${isEndOverRotated ? " - end of over" : ""}`,
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
    context.lineWidth = 8;
    context.strokeStyle = "#1d5a26";
    context.stroke();

    context.beginPath();
    context.arc(center, fieldTop + center, radius * 0.44, 0, Math.PI * 2);
    context.setLineDash([16, 16]);
    context.lineWidth = 4;
    context.strokeStyle = "rgba(255, 255, 255, 0.65)";
    context.stroke();
    context.setLineDash([]);

    const pitchWidth = size * 0.14;
    const pitchHeight = size * 0.32;
    context.fillStyle = "#c8a06a";
    context.strokeStyle = "#a47e4f";
    context.lineWidth = 4;
    context.beginPath();
    context.roundRect(center - pitchWidth / 2, fieldTop + center - pitchHeight / 2, pitchWidth, pitchHeight, 16);
    context.fill();
    context.stroke();

    players.forEach((player) => {
      const x = (player.x / 100) * size;
      const y = fieldTop + (player.y / 100) * size;
      const markerRadius = 48;
      const label = player.fielderName || player.name;

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
      await navigator.share({ files: [file], title: formationName || "Field Formation" });
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

  const removePosition = (id: string) => {
    setPlayers((prev) => prev.filter((player) => player.id !== id));
  };

  const renameFielder = (id: string, fielderName: string) => {
    setPlayers((prev) => prev.map((player) => (player.id === id ? { ...player, fielderName } : player)));
  };

  const renameTeamPlayer = (index: number, name: string) => {
    setTeamPlayers((prev) => prev.map((playerName, playerIndex) => (playerIndex === index ? name : playerName)));
  };

  const assignTeamPlayer = (id: string, fielderName: string) => {
    setPlayers((prev) => prev.map((player) => (player.id === id ? { ...player, fielderName } : player)));
  };

  const assignTeamPlayerToNextEmptyPosition = (fielderName: string) => {
    const trimmedName = fielderName.trim();
    if (!trimmedName) return;

    setPlayers((prev) => {
      const nextEmptyPlayer = prev.find((player) => !player.fielderName.trim());
      if (!nextEmptyPlayer) return prev;
      return prev.map((player) =>
        player.id === nextEmptyPlayer.id ? { ...player, fielderName: trimmedName } : player,
      );
    });
  };

  const handleTeamPlayerDragStart = (event: React.DragEvent<HTMLButtonElement>, fielderName: string) => {
    const trimmedName = fielderName.trim();
    if (!trimmedName) return;
    event.dataTransfer.setData("text/plain", trimmedName);
    event.dataTransfer.effectAllowed = "copy";
  };

  const handleFielderNameDrop = (event: React.DragEvent<HTMLInputElement>, id: string) => {
    event.preventDefault();
    const droppedName = event.dataTransfer.getData("text/plain").trim();
    if (!droppedName) return;
    assignTeamPlayer(id, droppedName);
  };

  const getNearestFieldPosition = (x: number, y: number) =>
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

  const handleFieldDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!fieldRef.current) return;

    const droppedName = event.dataTransfer.getData("text/plain").trim();
    if (!droppedName) return;

    const rect = fieldRef.current.getBoundingClientRect();
    const x = Math.max(4, Math.min(96, ((event.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(4, Math.min(96, ((event.clientY - rect.top) / rect.height) * 100));

    setPendingFieldAssignment({
      fielderName: droppedName,
      position: getNearestFieldPosition(x, y),
    });
  };

  const confirmFieldAssignment = () => {
    if (!pendingFieldAssignment) return;

    setPlayers((prev) => {
      const existingPlayer = prev.find((player) => player.name === pendingFieldAssignment.position.name);
      if (existingPlayer) {
        return prev.map((player) =>
          player.id === existingPlayer.id
            ? { ...player, fielderName: pendingFieldAssignment.fielderName }
            : player,
        );
      }

      if (prev.length >= MAX_POSITIONS) return prev;

      return [
        ...prev,
        {
          id: createId(pendingFieldAssignment.position.name),
          fielderName: pendingFieldAssignment.fielderName,
          ...pendingFieldAssignment.position,
        },
      ];
    });
    setPendingFieldAssignment(null);
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
        <input
          className="nameInput"
          value={formationName}
          onChange={(e) => setFormationName(e.target.value)}
          aria-label="Formation name"
        />
        <select
          className="savedSelect"
          value={activeFormationId}
          onChange={(e) => loadFormation(e.target.value)}
          aria-label="Saved formations"
        >
          <option value="">Saved fields</option>
          {savedFormations.map((formation) => (
            <option key={formation.id} value={formation.id}>
              {formation.name}
            </option>
          ))}
        </select>
        <button onClick={saveFormation}>{activeFormationId ? "Update" : "Save"}</button>
        <button onClick={saveFormationAsNew}>Save New</button>
        <button onClick={deleteFormation} disabled={!activeFormationId}>
          Delete
        </button>
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
        <div
          className="field"
          ref={fieldRef}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFieldDrop}
        >
          <div className="innerCircle" />
          <div className="pitch" />
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
              onPointerUp={() => setDraggingId(null)}
              onPointerCancel={() => setDraggingId(null)}
              title={p.fielderName ? `${p.fielderName} - ${p.name}` : p.name}
            >
              <span>{p.fielderName || p.name}</span>
            </button>
          ))}
          {pendingFieldAssignment && (
            <div
              className="assignmentConfirm"
              style={{
                left: `${pendingFieldAssignment.position.x}%`,
                top: `${pendingFieldAssignment.position.y}%`,
              }}
            >
              <p>
                Assign {pendingFieldAssignment.fielderName} to {pendingFieldAssignment.position.name}?
              </p>
              <div>
                <button onClick={confirmFieldAssignment}>Yes</button>
                <button onClick={() => setPendingFieldAssignment(null)}>No</button>
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

        <div className="teamSheet" aria-label="Team player names">
          <div className="teamHeader">
            <h2>Team players</h2>
            <span>{filledTeamPlayers}/{TEAM_PLAYER_COUNT}</span>
          </div>
          <p className="teamHint">Drag a player to the field or a fielder box. On mobile, tap a player to fill the next empty position.</p>
          <div className="teamGrid">
            {teamPlayers.map((teamPlayer, index) => {
              const trimmedName = teamPlayer.trim();
              const isOptional = index >= MANDATORY_TEAM_PLAYERS;
              return (
                <label key={index} className="teamPlayer">
                  <span>{isOptional ? "Optional" : `Player ${index + 1}`}</span>
                  <input
                    value={teamPlayer}
                    onChange={(e) => renameTeamPlayer(index, e.target.value)}
                    placeholder={isOptional ? "Impact sub" : "Player name"}
                    required={!isOptional}
                    aria-label={isOptional ? "Optional player name" : `Player ${index + 1} name`}
                  />
                  <button
                    draggable={Boolean(trimmedName)}
                    disabled={!trimmedName}
                    onClick={() => assignTeamPlayerToNextEmptyPosition(trimmedName)}
                    onDragStart={(e) => handleTeamPlayerDragStart(e, trimmedName)}
                    type="button"
                  >
                    {trimmedName || "Empty"}
                  </button>
                </label>
              );
            })}
          </div>
        </div>

        {missingMandatoryTeamPlayers > 0 && (
          <p className="warning advisory">
            Add {MANDATORY_TEAM_PLAYERS} player names. {missingMandatoryTeamPlayers} mandatory slot
            {missingMandatoryTeamPlayers === 1 ? "" : "s"} left.
          </p>
        )}

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
                <input
                  value={player.fielderName}
                  onChange={(e) => renameFielder(player.id, e.target.value)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleFielderNameDrop(e, player.id)}
                  placeholder="Fielder name"
                  aria-label={`${player.name} fielder name`}
                  aria-invalid={duplicateNameSet.has(normalizeFielderName(player.fielderName))}
                />
              </label>
              <button onClick={() => removePosition(player.id)} aria-label={`Remove ${player.name}`}>
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

        <div className="positionGrid">
          {FIELD_POSITIONS.map((position) => {
            const isSelected = selectedNames.has(position.name);
            return (
              <button
                key={position.name}
                className={`positionOption ${isSelected ? "selected" : ""}`}
                onClick={() => addPosition(position)}
                disabled={isSelected || players.length >= MAX_POSITIONS}
              >
                {position.name}
              </button>
            );
          })}
        </div>
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

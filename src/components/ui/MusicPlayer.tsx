/**
 * MUSIC PLAYER COMPONENT
 *
 * A fixed-position floating music player, restyled to match the Scorp DS
 * "Patterns/MusicPlayer" now-playing pattern while keeping this site's real
 * HTML5 audio engine.
 *
 * FROM THE DS PATTERN (visuals + interaction shell):
 * - Compact now-playing card on the Card plate ring, elevation via a
 *   drop-shadow filter (the plate clip-path slices box shadows off)
 * - Transport controls as icon Buttons on the 40px medium plate; play/pause
 *   emphasized with the primary gold fill
 * - Real slider timeline (click, drag, arrow keys) with a two-stop gradient
 *   fill over theme-scoped custom props
 * - Shuffle/repeat as aria-pressed toggles with an inverted plate fill
 * - Overflowing titles bounce-scroll (static under prefers-reduced-motion)
 * - Polite aria-live announcements on track change
 * - Chevron collapses the card into a ~56px mini bar (thumb, title/artist,
 *   previous/play/next, expand, hairline progress)
 * - Album tile on the plate-ring frame; desktop drag-affordance dot grid
 *
 * FROM THIS SITE (engine + lifecycle):
 * - Real <audio> playback, playlist data, track switching, currentTime and
 *   duration wiring (the DS story's useSimulatedPlayback swapped in reverse)
 * - Fixed positioning (bottom-right default), desktop dragging with viewport
 *   clamping, slide-in on mount and slide-out via the isClosing prop
 * - Public API unchanged: MusicPlayer({ onClose, isClosing })
 */

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Button } from "./Button";
import { Card } from "./Card";
import { TuiIcon } from "./TuiIcon";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Playlist data
// ---------------------------------------------------------------------------

interface Track {
  artist: string;
  title: string;
  /** Album art path; the plate-ring tile falls back to a glyph without it. */
  albumCover?: string;
  /** Audio file URL for this track. */
  audioSrc: string;
  /** Fallback length in seconds, used until the audio metadata loads. */
  duration: number;
}

// Demo playlist. Audio is a reliable public domain source (CC0, no
// attribution required); in production each track gets its own file.
// Three tracks on purpose: with one, shuffle was a no-op, previous was
// permanently disabled, and the queue controls looked broken. The long
// second title also exercises the marquee (it must overflow to scroll).
const PLAYLIST: Track[] = [
  {
    artist: "Sacha Hurley",
    title: "Stinger",
    albumCover: `${import.meta.env.BASE_URL}album-cover-stinger-001.png`,
    audioSrc: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    duration: 120,
  },
  {
    artist: "Sacha Hurley",
    title: "Burrow at Dusk (Extended Desert Session)",
    albumCover: `${import.meta.env.BASE_URL}album-cover-stinger-001.png`,
    audioSrc: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    duration: 425,
  },
  {
    artist: "Sacha Hurley",
    title: "Exoskeleton",
    albumCover: `${import.meta.env.BASE_URL}album-cover-stinger-001.png`,
    audioSrc: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    duration: 320,
  },
];

/** Format seconds as M:SS, e.g. 125 -> "2:05". */
function formatTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Pressed style for the shuffle/repeat toggles, keyed off aria-pressed: an
 * inverted plate fill that reads in both themes. Variant swapping (icon ->
 * secondary) is not a usable pressed indicator: in dark mode both variants
 * resolve to identical resting colors.
 */
const TOGGLE_PRESSED_CLASSES = [
  "aria-pressed:bg-secondary-800 aria-pressed:text-secondary-50 aria-pressed:hover:bg-secondary-700",
  "dark:aria-pressed:bg-secondary-300 dark:aria-pressed:text-secondary-950 dark:aria-pressed:hover:bg-secondary-400",
].join(" ");

/** Elevation recipe shared with the docked Modal: the plate clip-path slices
    box shadows off, so the shadow is a drop-shadow filter on the wrapper. */
const PLATE_SHADOW = "drop-shadow(0 10px 40px rgba(0, 0, 0, 0.35))";

// ---------------------------------------------------------------------------
// Real audio engine: same shape as the DS story's useSimulatedPlayback, but
// an <audio> element drives it (timeupdate feeds elapsed, seek writes
// currentTime). The component renders the element with the returned props.
// ---------------------------------------------------------------------------

function useAudioPlayback(tracks: Track[]) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [trackIndex, setTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [loadedDuration, setLoadedDuration] = useState(0);
  const [isShuffling, setIsShuffling] = useState(false);
  const [isRepeating, setIsRepeating] = useState(false);

  const track = tracks[trackIndex];
  // Real duration once metadata loads, playlist estimate until then.
  const duration = loadedDuration || track.duration;

  // Sync the element with isPlaying; re-run on track change so playback
  // resumes after an auto-advance or a queue jump. Autoplay restrictions
  // reject the play() promise, so state falls back to paused.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  }, [isPlaying, trackIndex]);

  // Any index but the current one, so shuffle never repeats the same track.
  const randomOtherIndex = () =>
    tracks.length < 2
      ? trackIndex
      : (trackIndex + 1 + Math.floor(Math.random() * (tracks.length - 1))) % tracks.length;

  const selectTrack = (index: number) => {
    setTrackIndex(index);
    setElapsed(0);
    // Rewind directly too: when tracks share an audio file (the demo
    // playlist), the src does not change and the element never reloads.
    const audio = audioRef.current;
    if (audio) audio.currentTime = 0;
  };

  // Reset the loaded duration when the track changes so the estimate shows
  // until the new file's metadata arrives.
  useEffect(() => {
    setLoadedDuration(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackIndex]);

  const togglePlay = () => {
    // Restart a finished track instead of instantly re-finishing it.
    if (!isPlaying && elapsed >= duration) {
      setElapsed(0);
      const audio = audioRef.current;
      if (audio) audio.currentTime = 0;
    }
    setIsPlaying(!isPlaying);
  };

  const seek = (seconds: number) => {
    const audio = audioRef.current;
    if (audio) audio.currentTime = seconds;
    setElapsed(seconds);
  };

  // Auto-advance when a track runs out (the ended event, not a tick check):
  // random when shuffling, next in order, wrap when repeating, stop after
  // the last otherwise.
  const handleEnded = () => {
    if (isShuffling) {
      selectTrack(randomOtherIndex());
    } else if (trackIndex < tracks.length - 1) {
      selectTrack(trackIndex + 1);
    } else if (isRepeating) {
      selectTrack(0);
      // Same-file playlists never change src, so restart playback directly.
      audioRef.current?.play().catch(() => setIsPlaying(false));
    } else {
      setIsPlaying(false);
      setElapsed(0);
      const audio = audioRef.current;
      if (audio) audio.currentTime = 0;
    }
  };

  // Props for the <audio> element the component renders.
  const audioProps = {
    ref: audioRef,
    src: track.audioSrc,
    onTimeUpdate: () => {
      const audio = audioRef.current;
      if (audio) setElapsed(audio.currentTime);
    },
    onLoadedMetadata: () => {
      const audio = audioRef.current;
      if (audio && Number.isFinite(audio.duration)) setLoadedDuration(audio.duration);
    },
    onEnded: handleEnded,
    onError: () => {
      // Keep the UI consistent if the file fails to load mid-session.
      setIsPlaying(false);
    },
  };

  return {
    tracks,
    track,
    trackIndex,
    isPlaying,
    elapsed,
    duration,
    isShuffling,
    isRepeating,
    selectTrack,
    togglePlay,
    seek,
    previous: () => trackIndex > 0 && selectTrack(trackIndex - 1),
    next: () =>
      isShuffling
        ? selectTrack(randomOtherIndex())
        : trackIndex < tracks.length - 1
          ? selectTrack(trackIndex + 1)
          : isRepeating && selectTrack(0),
    toggleShuffle: () => setIsShuffling(!isShuffling),
    toggleRepeat: () => setIsRepeating(!isRepeating),
    previousDisabled: trackIndex === 0,
    nextDisabled: !isShuffling && !isRepeating && trackIndex === tracks.length - 1,
    audioProps,
  };
}

type PlaybackState = ReturnType<typeof useAudioPlayback>;

// ---------------------------------------------------------------------------
// Marquee text (copied from the DS pattern)
// ---------------------------------------------------------------------------

/**
 * Single-line text that bounce-scrolls when it overflows its container and
 * stays static when it fits: the line slides left until its end is revealed,
 * holds briefly, then returns the way it came (infinite alternate). Duration
 * derives from each line's own overflow distance, so stacked lines drift out
 * of phase and read as independent. prefers-reduced-motion falls back to
 * static truncation.
 */
function MarqueeText({ text, className }: { text: string; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLSpanElement>(null);
  const copyRef = useRef<HTMLSpanElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const copy = copyRef.current;
    if (!container || !copy) return;
    // offsetWidth needs a layout box, hence inline-block on the copy: inline
    // spans report scrollWidth 0 and overflow would never be detected.
    const measure = () => setIsOverflowing(copy.offsetWidth > container.clientWidth + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, [text]);

  useEffect(() => {
    const container = containerRef.current;
    const track = trackRef.current;
    const copy = copyRef.current;
    if (!isOverflowing || !container || !track || !copy) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Travel only the hidden overflow, at ~30px/s over the moving 80% of the
    // cycle; the 10% holds at each end give a reading pause before the bounce.
    const distance = copy.offsetWidth - container.clientWidth;
    const animation = track.animate(
      [
        { transform: "translateX(0)", offset: 0 },
        { transform: "translateX(0)", offset: 0.1 },
        { transform: `translateX(-${distance}px)`, offset: 0.9 },
        { transform: `translateX(-${distance}px)`, offset: 1 },
      ],
      {
        duration: ((distance / 30) * 1000) / 0.8,
        iterations: Infinity,
        direction: "alternate",
        easing: "linear",
      }
    );
    return () => animation.cancel();
  }, [isOverflowing, text]);

  return (
    <div ref={containerRef} className={cn("overflow-hidden whitespace-nowrap", className)}>
      <span ref={trackRef} className={isOverflowing ? "inline-flex w-max" : "block truncate"}>
        <span ref={copyRef} className="inline-block whitespace-nowrap">
          {text}
        </span>
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Drag affordance (copied from the DS pattern)
// ---------------------------------------------------------------------------

/** Drag affordance: desktop only, visually centered in the left padding
    gutter (the wrapper spans the gutter width and flex-centers the dots, so
    no off-scale pixel offsets are needed). Pointer-only convenience, hence
    aria-hidden; every control stays reachable without it. */
function DragHandle({
  dragHandleProps,
  gutterClassName = "w-4 lg:w-6",
}: {
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
  /** Width classes matching the host layout's left padding gutter. */
  gutterClassName?: string;
}) {
  return (
    <div
      className={cn(
        // left-px: the visual gutter starts inside the 1px plate stroke, so
        // the wrapper must too or the dots sit a step left of center.
        "absolute left-px top-1/2 hidden -translate-y-1/2 cursor-grab touch-none active:cursor-grabbing lg:flex lg:justify-center",
        gutterClassName
      )}
      aria-hidden="true"
      {...dragHandleProps}
    >
      <div className="grid grid-cols-2 gap-0.5">
        {Array.from({ length: 6 }, (_, dot) => (
          <span
            key={dot}
            className="h-0.5 w-0.5 rounded-none bg-secondary-900 dark:bg-secondary-200"
          />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Album art on the plate-ring frame
// ---------------------------------------------------------------------------

/** Plate-ring album fill: cover art when available, glyph fallback. */
function AlbumFill({ track }: { track: Track }) {
  const [failed, setFailed] = useState(false);

  // Retry the image when the track changes.
  useEffect(() => setFailed(false), [track.albumCover]);

  if (track.albumCover && !failed) {
    return (
      <img
        src={track.albumCover}
        alt=""
        className="h-full w-full object-cover"
        onError={() => setFailed(true)}
      />
    );
  }
  return <TuiIcon name="Music2" size="8" className="text-secondary-900 dark:text-secondary-200" />;
}

// ---------------------------------------------------------------------------
// Expanded now-playing card (structure copied from the DS pattern)
// ---------------------------------------------------------------------------

function MusicPlayerCard({
  player,
  onClose,
  onCollapse,
  dragHandleProps,
}: {
  player: PlaybackState;
  onClose?: () => void;
  /** Collapse to the mini bar; renders the chevron affordance when provided. */
  onCollapse?: () => void;
  /** Pointer handlers for the drag handle; the consumer owns the actual move logic. */
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}) {
  const { track } = player;
  const seekPercentage = Math.min(100, (player.elapsed / player.duration) * 100);

  // Album tile sizing: the tile stretches flush with the content box (top of
  // the artist line to the bottom of the transport row) and the observer
  // mirrors that height into the width, so the square hugs its height. CSS
  // aspect-square cannot resolve here: the flex row's height depends on its
  // own items, so the browser falls back to content width.
  const tileRef = useRef<HTMLDivElement>(null);
  const [tileWidth, setTileWidth] = useState<number | undefined>(undefined);
  useEffect(() => {
    const tile = tileRef.current;
    if (!tile) return;
    const observer = new ResizeObserver(() => setTileWidth(tile.offsetHeight));
    observer.observe(tile);
    return () => observer.disconnect();
  }, []);

  return (
    <Card className="relative w-full">
      {/* Screen reader parity with the visual track change. */}
      <span className="sr-only" aria-live="polite">
        {`Now playing: ${track.title}, ${track.artist}`}
      </span>

      <DragHandle dragHandleProps={dragHandleProps} />

      {(onClose || onCollapse) && (
        <div className="absolute right-4 top-4 flex items-center gap-1 lg:right-6 lg:top-6">
          {onCollapse && (
            <Button
              variant="icon"
              size="sm"
              type="button"
              aria-label="Collapse player"
              aria-expanded={true}
              onClick={onCollapse}
            >
              <TuiIcon name="ChevronDown" />
            </Button>
          )}
          {onClose && (
            <Button
              variant="icon"
              size="sm"
              type="button"
              aria-label="Close music player"
              onClick={onClose}
            >
              <TuiIcon name="X" />
            </Button>
          )}
        </div>
      )}

      <div className="flex items-stretch gap-3">
        {/* Album tile: same plate-ring frame as the equipment tiles (stroke
            clipped to the plate, fill re-clipped 1px inset). Flush with the
            content box top and bottom; width hugs the measured height. */}
        <div
          ref={tileRef}
          className="plate-round flex-shrink-0 self-stretch bg-[var(--surface-container-stroke)] p-px"
          // Width 0 until the first measurement: with no width constraint the
          // album image's natural size (1024px) would dictate the row layout
          // for a frame, and the observer would then mirror that runaway
          // height back into the width, locking the tile at full image size.
          style={{ width: tileWidth ?? 0 }}
        >
          <div className="plate-round flex h-full w-full items-center justify-center overflow-hidden bg-secondary-200 dark:bg-secondary-800">
            <AlbumFill track={track} />
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 font-mono">
          <div
            className={cn(
              "min-w-0",
              onClose && onCollapse ? "pr-20" : onClose || onCollapse ? "pr-10" : ""
            )}
          >
            <MarqueeText
              text={track.artist}
              className="text-xs text-secondary-700 dark:text-secondary-500"
            />
            <MarqueeText
              text={track.title}
              className="text-sm font-medium text-[var(--text-primary)]"
            />
          </div>

          <div>
            <div className="mb-0.5 flex items-center justify-between text-xs text-secondary-900 dark:text-secondary-200">
              <span>{formatTime(player.elapsed)}</span>
              <span>{formatTime(player.duration)}</span>
            </div>
            {/* Seekable timeline: native range input, so click/drag/arrow keys
                come free. Fill is a two-stop gradient over theme-scoped custom
                props; the thumb is a sharp text-primary nub. */}
            <input
              type="range"
              min={0}
              max={Math.max(1, Math.round(player.duration))}
              step={1}
              value={Math.round(player.elapsed)}
              onChange={(event) => player.seek(Number(event.target.value))}
              aria-label="Seek"
              aria-valuetext={`${formatTime(player.elapsed)} of ${formatTime(player.duration)}`}
              className="h-2 w-full cursor-pointer appearance-none rounded-none
                [--scrub-fill:var(--color-secondary-600)] [--scrub-track:var(--color-secondary-200)]
                dark:[--scrub-fill:var(--color-secondary-400)] dark:[--scrub-track:var(--color-secondary-800)]
                focus:outline-none focus-visible:[box-shadow:0_0_0_var(--focus-ring-width)_var(--focus-ring-primary)]
                [&::-moz-range-thumb]:h-2 [&::-moz-range-thumb]:w-1 [&::-moz-range-thumb]:rounded-none [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-[var(--text-primary)]
                [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:w-1 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-none [&::-webkit-slider-thumb]:bg-[var(--text-primary)]"
              style={{
                background: `linear-gradient(to right, var(--scrub-fill) ${seekPercentage}%, var(--scrub-track) ${seekPercentage}%)`,
              }}
            />
          </div>

          {/* Transport: uniform 40px medium plates; play carries the
              emphasis through its primary fill alone. Shuffle/repeat are
              pressed toggles whose plate fill changes with state, not
              color alone. */}
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="icon"
              size="md"
              type="button"
              aria-pressed={player.isShuffling}
              aria-label="Shuffle"
              className={TOGGLE_PRESSED_CLASSES}
              onClick={player.toggleShuffle}
            >
              <TuiIcon name="Shuffle" />
            </Button>
            <Button
              variant="icon"
              size="md"
              type="button"
              aria-label="Previous track"
              disabled={player.previousDisabled}
              onClick={player.previous}
            >
              <TuiIcon name="SkipBack" />
            </Button>
            <Button
              variant="primary"
              size="md"
              type="button"
              aria-label={player.isPlaying ? "Pause" : "Play"}
              onClick={player.togglePlay}
            >
              <TuiIcon name={player.isPlaying ? "Pause" : "Play"} />
            </Button>
            <Button
              variant="icon"
              size="md"
              type="button"
              aria-label="Next track"
              disabled={player.nextDisabled}
              onClick={player.next}
            >
              <TuiIcon name="SkipForward" />
            </Button>
            <Button
              variant="icon"
              size="md"
              type="button"
              aria-pressed={player.isRepeating}
              aria-label="Repeat"
              className={TOGGLE_PRESSED_CLASSES}
              onClick={player.toggleRepeat}
            >
              <TuiIcon name="Repeat" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Collapsed mini bar (structure copied from the DS pattern)
// ---------------------------------------------------------------------------

/**
 * Collapsed mini bar: the same playback state at mini-player density (~56px).
 * Core transport only (previous, play/pause, next, expand); shuffle, repeat,
 * close, and seeking live in the expanded card. The hairline progress strip
 * is display-only: a 4px seek target would be an accessibility trap.
 */
function MusicPlayerBar({
  player,
  onExpand,
  dragHandleProps,
}: {
  player: PlaybackState;
  onExpand: () => void;
  /** Pointer handlers for the drag handle; the consumer owns the actual move logic. */
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}) {
  const { track } = player;
  const seekPercentage = Math.min(100, (player.elapsed / player.duration) * 100);

  return (
    // Compact plate ring: Card's recipe at bar density (Card's fixed
    // content padding is too deep for a mini bar).
    <div className="plate-round-lg bg-[var(--surface-container-stroke)] p-px">
      <div className="plate-round-lg relative flex items-center gap-3 bg-[var(--surface-card)] p-2 pl-4 lg:pl-5">
        {/* Screen reader parity with the visual track change. */}
        <span className="sr-only" aria-live="polite">
          {`Now playing: ${track.title}, ${track.artist}`}
        </span>

        <DragHandle dragHandleProps={dragHandleProps} gutterClassName="w-4 lg:w-5" />

        {/* Album thumb: plate ring at thumb scale. */}
        <div className="plate-round h-10 w-10 flex-shrink-0 bg-[var(--surface-container-stroke)] p-px">
          <div className="plate-round flex h-full w-full items-center justify-center overflow-hidden bg-secondary-200 dark:bg-secondary-800">
            <AlbumFill track={track} />
          </div>
        </div>

        {/* Artist eyebrow above title, matching the card's meta-above-title
            house convention. */}
        <div className="min-w-0 flex-1 font-mono">
          <MarqueeText
            text={track.artist}
            className="text-xs text-secondary-700 dark:text-secondary-500"
          />
          <MarqueeText
            text={track.title}
            className="text-xs font-medium text-[var(--text-primary)]"
          />
        </div>

        {/* Transport group sits tight (gap-2); the expand control stands
            apart (root gap + ml-3) so mode switching reads as a separate
            cluster from playback. The whole bar runs the smallest control
            size (32px small, matching the card's collapse control); play
            carries the emphasis through its primary fill alone. */}
        <div className="flex items-center gap-2">
          <Button
            variant="icon"
            size="sm"
            type="button"
            aria-label="Previous track"
            disabled={player.previousDisabled}
            onClick={player.previous}
          >
            <TuiIcon name="SkipBack" />
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="button"
            aria-label={player.isPlaying ? "Pause" : "Play"}
            onClick={player.togglePlay}
          >
            <TuiIcon name={player.isPlaying ? "Pause" : "Play"} />
          </Button>
          <Button
            variant="icon"
            size="sm"
            type="button"
            aria-label="Next track"
            disabled={player.nextDisabled}
            onClick={player.next}
          >
            <TuiIcon name="SkipForward" />
          </Button>
        </div>
        {/* Expand matches the transport cluster at small (32px). */}
        <Button
          variant="icon"
          size="sm"
          type="button"
          aria-label="Expand player"
          aria-expanded={false}
          className="ml-3"
          onClick={onExpand}
        >
          <TuiIcon name="ChevronUp" />
        </Button>

        {/* Hairline progress along the bar's bottom edge (display only). */}
        <div
          className="absolute inset-x-0 bottom-0 h-0.5 bg-secondary-200 dark:bg-secondary-800"
          role="progressbar"
          aria-label="Playback progress"
          aria-valuemin={0}
          aria-valuemax={Math.round(player.duration)}
          aria-valuenow={Math.round(player.elapsed)}
          aria-valuetext={`${formatTime(player.elapsed)} of ${formatTime(player.duration)}`}
        >
          <div
            className="h-full bg-secondary-600 dark:bg-secondary-400"
            style={{ width: `${seekPercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Floating widget shell (this site's positioning, drag, and open/close
// lifecycle, unchanged public API)
// ---------------------------------------------------------------------------

interface MusicPlayerProps {
  onClose: () => void;
  isClosing?: boolean;
}

// Footprint for the default bottom-right placement. The height estimate only
// seeds the initial position; drag/resize clamping measures the rendered
// element, because the collapsed bar is roughly half the card's height and a
// fixed estimate would fence the bar off the bottom of the viewport.
const PLAYER_WIDTH = 380;
const PLAYER_HEIGHT_ESTIMATE = 170;
const EDGE_MARGIN = 24;

/**
 * MusicPlayer: the floating now-playing widget. Rendered by Layout when
 * isMusicPlayerOpen is true; onClose starts the slide-out (Layout flips
 * isClosing, waits out the transition, then unmounts).
 */
export function MusicPlayer({ onClose, isClosing = false }: MusicPlayerProps) {
  const player = useAudioPlayback(PLAYLIST);

  // Collapsed vs expanded layout; playback state lives in the hook above,
  // so the track keeps playing across the transition.
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Position state for desktop dragging; default bottom-right corner.
  const [position, setPosition] = useState({
    x: window.innerWidth - PLAYER_WIDTH - EDGE_MARGIN,
    y: window.innerHeight - PLAYER_HEIGHT_ESTIMATE - EDGE_MARGIN,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [justMounted, setJustMounted] = useState(true);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  // Rendered root, measured for viewport clamping: the collapsed bar and the
  // expanded card have very different heights, so clamp against the real one.
  const rootRef = useRef<HTMLDivElement>(null);
  const measuredHeight = () =>
    rootRef.current?.offsetHeight || PLAYER_HEIGHT_ESTIMATE;

  // Slide-in animation on mount: start off-screen, then release after a
  // frame so the transition runs.
  useEffect(() => {
    const timer = setTimeout(() => setJustMounted(false), 100);
    return () => clearTimeout(timer);
  }, []);

  // Desktop drag: mouse listeners on the document while dragging, with
  // viewport clamping so the player cannot be lost off-screen.
  useEffect(() => {
    if (!isDragging) return;
    const handleDragMove = (e: MouseEvent) => {
      const maxX = window.innerWidth - PLAYER_WIDTH;
      const maxY = window.innerHeight - measuredHeight();
      setPosition({
        x: Math.max(0, Math.min(e.clientX - dragStart.x, maxX)),
        y: Math.max(0, Math.min(e.clientY - dragStart.y, maxY)),
      });
    };
    const handleDragEnd = () => setIsDragging(false);
    document.addEventListener("mousemove", handleDragMove);
    document.addEventListener("mouseup", handleDragEnd);
    document.body.style.cursor = "grabbing";
    return () => {
      document.removeEventListener("mousemove", handleDragMove);
      document.removeEventListener("mouseup", handleDragEnd);
      document.body.style.cursor = "default";
    };
  }, [isDragging, dragStart]);

  // Keep the player visible across window resizes (desktop only, where the
  // draggable inline position applies).
  useEffect(() => {
    const handleResize = () => {
      const desktopView = window.innerWidth >= 1024;
      setIsDesktop(desktopView);
      if (desktopView) {
        setPosition((prev) => ({
          x: Math.min(prev.x, window.innerWidth - PLAYER_WIDTH - EDGE_MARGIN),
          y: Math.min(prev.y, window.innerHeight - measuredHeight() - EDGE_MARGIN),
        }));
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Re-clamp after the collapse/expand toggle re-renders: expanding a bar
  // that was docked at the bottom edge must not push the card off-screen.
  useLayoutEffect(() => {
    if (!isDesktop) return;
    setPosition((prev) => ({
      ...prev,
      y: Math.min(prev.y, Math.max(0, window.innerHeight - measuredHeight())),
    }));
  }, [isCollapsed, isDesktop]);

  const dragHandleProps: React.HTMLAttributes<HTMLDivElement> = {
    onMouseDown: (e) => {
      if (!isDesktop) return;
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    },
  };

  return (
    <>
      {/* Hidden audio element: the real playback engine. The UI above is
          wired to it through useAudioPlayback. */}
      <audio {...player.audioProps} />

      <div
        ref={rootRef}
        className="fixed w-[calc(100%-48px)] lg:w-[380px] left-6 bottom-6 lg:left-auto lg:bottom-auto"
        style={{
          // Popover layer token keeps the player above page content.
          zIndex: "var(--z-index-popover)",
          // Mobile pins to the bottom-left via classes; desktop positions
          // with inline styles so dragging works.
          ...(isDesktop ? { left: `${position.x}px`, top: `${position.y}px` } : {}),
          // Elevation: drop-shadow filter, not box-shadow (the plate
          // clip-path slices box shadows off). Same recipe as the docked
          // Modal in the DS.
          filter: PLATE_SHADOW,
          // Slide-in from the bottom on mount, slide-out on close. No fade,
          // clean slide motion only.
          transform:
            isClosing || justMounted ? "translateY(200px)" : "translateY(0)",
          transition: justMounted ? "none" : "transform 0.5s ease-out",
        }}
      >
        {isCollapsed ? (
          <MusicPlayerBar
            player={player}
            onExpand={() => setIsCollapsed(false)}
            dragHandleProps={dragHandleProps}
          />
        ) : (
          <MusicPlayerCard
            player={player}
            onClose={onClose}
            onCollapse={() => setIsCollapsed(true)}
            dragHandleProps={dragHandleProps}
          />
        )}
      </div>
    </>
  );
}

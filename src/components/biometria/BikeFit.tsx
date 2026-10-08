"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { assessPose, sidePoints, type BikeSide, type PosePoint } from "@/lib/bike-fit";
import styles from "./BikeFit.module.css";
import { cyclingDisciplines } from "@/data/cycling-disciplines";
import { fitExample } from "@/lib/fit-example";
import { bikeFitModule, type FitPosture } from "@/lib/bike-fit-modules";
import { kneeFeedback } from "@/lib/fit-feedback";
import { LiveFitFilter } from "@/lib/fit-live";

type Mode = "idle" | "loading" | "camera" | "photo" | "frozen" | "demo";
const initialMessage = "Acepta el procesamiento local y elige cámara o fotografía.";

export function BikeFit() {
  const [step, setStep] = useState(0);
  const stepHeading = useRef<HTMLHeadingElement>(null);
  function go(next: number) {
    if (next === 2 && activeMode.current !== "demo" && (!hasPreview || activeMode.current === "loading")) return;
    if (next === 2 && activeMode.current === "camera") { freeze(); return; }
    if (next === 0 && activeMode.current === "camera") {
      dispose(); activeMode.current = "frozen"; setMode("frozen"); setBottom(false);
      setMessage("Cámara apagada. Tu última captura sigue disponible para revisar.");
    }
    setStep(next);
    requestAnimationFrame(() => { stepHeading.current?.focus(); stepHeading.current?.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); });
  }
  const [discipline, setDiscipline] = useState("unknown");
  const [posture, setPosture] = useState<"seated" | "standing">("seated");
  const selectedDiscipline = cyclingDisciplines.find(item => item.id === discipline)!;
  const fitModule = bikeFitModule(discipline, posture);
  const illustration = useMemo(() => fitExample(discipline, posture), [discipline, posture]);
  const [consent, setConsent] = useState(false);
  const [framing, setFraming] = useState(false);
  const [bottom, setBottom] = useState(false);
  const [side, setSide] = useState<BikeSide>("left");
  const liveSide = useRef<BikeSide>("left");
  liveSide.current = side;
  const [mode, setMode] = useState<Mode>("idle");
  const [message, setMessage] = useState(initialMessage);
  const [points, setPoints] = useState<PosePoint[]>([]);
  const [hasPreview, setHasPreview] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [readings, setReadings] = useState(0);
  const [liveStable, setLiveStable] = useState(false);
  const liveFilter = useRef(new LiveFitFilter());
  const rawPoints = useRef<PosePoint[]>([]);
  const chooseSide = useRef(true);
  const [dimensions, setDimensions] = useState({ width: 960, height: 540 });
  const video = useRef<HTMLVideoElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const overlay = useRef<HTMLCanvasElement>(null);
  const pendingFrame = useRef<HTMLCanvasElement | null>(null);
  const worker = useRef<Worker | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const watchdog = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelInit = useRef<(() => void) | null>(null);
  const session = useRef(0);
  const activeMode = useRef<Mode>("idle");
  const busy = useRef(false);
  const inFlight = useRef(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  function stopTracks() {
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    if (video.current) video.current.srcObject = null;
    if (timer.current) clearTimeout(timer.current);
  }
  function dispose() {
    liveFilter.current.reset(); setLiveStable(false);
    session.current++;
    cancelInit.current?.();
    cancelInit.current = null;
    stopTracks();
    worker.current?.terminate();
    worker.current = null;
    if (watchdog.current) clearTimeout(watchdog.current);
    busy.current = false;
    inFlight.current = false;
    pendingFrame.current = null;
  }
  function reset() {
    setStep(1);
    dispose();
    rawPoints.current = [];
    activeMode.current = "idle";
    setMode("idle"); setPoints([]); setBottom(false); setFraming(false);
    setHasPreview(false); setCameraReady(false); setReadings(0);
    setMessage(initialMessage);
    for (const canvas of [preview.current, overlay.current]) canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    if (fileInput.current) fileInput.current.value = "";
  }
  function fail(text: string) {
    dispose(); activeMode.current = "idle";
    rawPoints.current = [];
    setMode("idle"); setPoints([]); setBottom(false); setMessage(text);
    setHasPreview(false); setCameraReady(false);
    for (const canvas of [preview.current, overlay.current]) canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
  }

  useEffect(() => {
    // Releasing camera and worker also removes every image from this component's memory.
    const hidden = () => { if (document.hidden && activeMode.current !== "idle") reset(); };
    document.addEventListener("visibilitychange", hidden);
    return () => { document.removeEventListener("visibilitychange", hidden); dispose(); };
    // The handler only uses stable refs and React setters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const assessment = useMemo(() => assessPose(points, side, dimensions.width, dimensions.height), [points, side, dimensions]);
  const demo = mode === "demo";
  const valid = (demo || consent && framing) && assessment.valid;
  const staticCapture = mode === "photo" || mode === "frozen" || mode === "camera";
  const showComparison = posture === "seated" && staticCapture && bottom && valid && assessment.valid && (mode !== "camera" || liveStable);
  const feedback = kneeFeedback((showComparison || demo && posture === "seated") && assessment.valid ? assessment.knee : null);
  useEffect(() => {
    const canvas = overlay.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!points.length) return;
    const [s, e, w, h, k, a, heel, toe] = sidePoints[side];
    const edges = [[s, e], [e, w], [s, h], [h, k], [k, a], [a, heel], [heel, toe]];
    ctx.fillStyle = "#f5f5f2"; ctx.lineWidth = 5;
    for (const [from, to] of edges) {
      if (!points[from] || !points[to] || (points[from].visibility ?? 0) < .75 || (points[to].visibility ?? 0) < .75) continue;
      ctx.strokeStyle = from === h && to === k || from === k && to === a ? feedback.color : "#82bddd";
      ctx.beginPath(); ctx.moveTo(points[from].x * canvas.width, points[from].y * canvas.height);
      ctx.lineTo(points[to].x * canvas.width, points[to].y * canvas.height); ctx.stroke();
    }
    for (const id of sidePoints[side]) {
      if (!points[id] || (points[id].visibility ?? 0) < .75) continue;
      ctx.beginPath(); ctx.arc(points[id].x * canvas.width, points[id].y * canvas.height, 5, 0, Math.PI * 2); ctx.fill();
    }
    if (!valid || !assessment.valid) return;
    ctx.font = "bold 18px sans-serif";
    for (const [id, label] of [[k, `Rodilla ${Math.round(assessment.knee)}°`], [h, `Cadera ${Math.round(assessment.hip)}°`], [e, `Codo ${Math.round(assessment.elbow)}°`]] as const) {
      const x = Math.max(4, Math.min(canvas.width - 160, points[id].x * canvas.width + 10));
      const y = Math.max(24, points[id].y * canvas.height - 12);
      ctx.fillStyle = "#090a0b"; ctx.fillRect(x - 3, y - 20, 158, 27);
      ctx.fillStyle = "#f5f5f2"; ctx.fillText(label, x, y);
    }
  }, [assessment, points, side, valid, dimensions, feedback.color]);

  function armWatchdog() {
    if (watchdog.current) clearTimeout(watchdog.current);
    watchdog.current = setTimeout(() => fail("El detector tardó demasiado. Prueba una foto o un navegador actualizado con WebAssembly y Web Workers."), 45000);
  }
  async function sendFrame(source: CanvasImageSource, width: number, height: number, live: boolean, token: number) {
    if (inFlight.current || token !== session.current || !worker.current) return;
    const canvas = pendingFrame.current ?? (pendingFrame.current = document.createElement("canvas"));
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) throw new Error("canvas");
    const scale = Math.min(1, 960 / Math.max(width, height));
    canvas.width = Math.round(width * scale); canvas.height = Math.round(height * scale);
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
    inFlight.current = true;
    const bitmap = await createImageBitmap(canvas);
    if (token !== session.current || !worker.current) { bitmap.close(); return; }
    armWatchdog();
    worker.current.postMessage({ type: "frame", bitmap, video: live, timestamp: performance.now() }, [bitmap]);
  }
  function scheduleFrame(token: number) {
    timer.current = setTimeout(async () => {
      if (token !== session.current || activeMode.current !== "camera" || !video.current) return;
      try {
        if (video.current.readyState >= 2) await sendFrame(video.current, video.current.videoWidth, video.current.videoHeight, true, token);
        else scheduleFrame(token);
      } catch { fail("No pudimos leer la cámara. Detén el análisis y prueba una fotografía."); }
    }, 200);
  }
  function initDetector(token: number): Promise<void> {
    if (!window.Worker || !window.WebAssembly || !window.createImageBitmap) return Promise.reject(new Error("unsupported"));
    return new Promise((resolve, reject) => {
      cancelInit.current = () => reject(new Error("cancelled"));
      const detector = new Worker("/biometria/pose-worker.js");
      worker.current = detector;
      armWatchdog();
      detector.onerror = () => { reject(new Error("worker")); if (token === session.current) fail("No pudimos cargar el detector local. Revisa tu conexión y prueba Chrome, Edge o Safari actualizado. Este dispositivo podría ser incompatible."); };
      detector.onmessage = ({ data }) => {
        if (token !== session.current) return;
        if (watchdog.current) clearTimeout(watchdog.current);
        if (data.type === "ready") { cancelInit.current = null; resolve(); }
        if (data.type === "error") { reject(new Error("detector")); fail("El detector no pudo procesar la imagen. Prueba otra foto o un navegador actualizado."); }
        if (data.type === "result") {
          inFlight.current = false;
          if (activeMode.current === "photo") { setMode("photo"); busy.current = false; }
          const frame = pendingFrame.current;
          let visibleSide = liveSide.current;
          if (frame && preview.current && overlay.current) {
            preview.current.width = overlay.current.width = frame.width;
            preview.current.height = overlay.current.height = frame.height;
            preview.current.getContext("2d")?.drawImage(frame, 0, 0);
            setDimensions({ width: frame.width, height: frame.height });
            setHasPreview(true);
            if (chooseSide.current && data.points.length) {
              const confidence = (candidate: BikeSide) => Math.min(...sidePoints[candidate].map((id) => data.points[id]?.visibility ?? 0));
              visibleSide = confidence("right") > confidence("left") ? "right" : "left";
              liveSide.current = visibleSide;
              setSide(visibleSide);
              chooseSide.current = false;
            }
          }
          setReadings((count) => count + 1);
          rawPoints.current = data.multiple ? [] : data.points;
          if (activeMode.current === "camera" && frame) {
            const filtered = liveFilter.current.update(rawPoints.current, visibleSide, frame.width, frame.height);
            setPoints(filtered.points); setLiveStable(filtered.stable);
          } else { setPoints(rawPoints.current); setLiveStable(false); }
          setMessage(data.multiple ? "Hay más de una persona. Deja sólo al ciclista en el encuadre." : data.points.length ? "Análisis local activo." : "No detectamos una persona completa. Revisa luz, distancia y encuadre.");
          if (activeMode.current === "camera") scheduleFrame(token);
        }
      };
      detector.postMessage({ type: "init" });
    });
  }
  function begin() {
    setStep(1);
    dispose();
    rawPoints.current = [];
    busy.current = true; activeMode.current = "loading";
    setMode("loading"); setPoints([]); setBottom(false); setFraming(false);
    setHasPreview(false); setCameraReady(false); setReadings(0); chooseSide.current = true;
    setMessage("Preparando el detector local. La primera carga puede tardar unos segundos…");
    return session.current;
  }
  async function startCamera() {
    if (!consent || busy.current) return;
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      fail("La cámara requiere HTTPS (o localhost) y un navegador compatible. Puedes cargar una foto local."); return;
    }
    const token = begin();
    setMessage("Esperando permiso de cámara… Acepta la solicitud que muestra tu navegador.");
    try {
      const camera = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } } });
      if (token !== session.current) { camera.getTracks().forEach((track) => track.stop()); return; }
      stream.current = camera;
      camera.getVideoTracks()[0].onended = () => { if (token === session.current) fail("La cámara se desconectó. Vuelve a activarla o carga una fotografía."); };
      if (!video.current) throw new Error("video");
      video.current.srcObject = camera;
      await video.current.play();
      if (token !== session.current) return;
      setCameraReady(true);
      setMessage("Cámara conectada. Preparando el análisis local…");
      await initDetector(token);
      if (token !== session.current) return;
      activeMode.current = "camera"; setMode("camera"); busy.current = false;
      setMessage("Cámara activa. Encadra al ciclista y confirma la vista lateral.");
      scheduleFrame(token);
    } catch (error) {
      if (token !== session.current) return;
      const name = error instanceof Error ? error.name : "";
      fail(name === "NotAllowedError" ? "Permiso de cámara denegado. Habilítalo en la configuración del navegador o carga una foto." : name === "NotFoundError" ? "No encontramos una cámara. Puedes cargar una foto local." : name === "NotReadableError" ? "La cámara está ocupada o no está disponible. Cierra otras aplicaciones o carga una foto." : "No pudimos iniciar el análisis. Revisa la conexión y la compatibilidad de tu navegador.");
    }
  }
  async function loadPhoto(file?: File) {
    if (!file || !consent || busy.current) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 15 * 1024 * 1024) {
      setMessage("Elige una foto JPG, PNG o WebP de hasta 15 MB. Convierte HEIC antes de cargarlo."); return;
    }
    const token = begin();
    let bitmap: ImageBitmap | undefined;
    try {
      bitmap = await createImageBitmap(file);
      if (token !== session.current) return;
      if (preview.current) {
        const scale = Math.min(1, 960 / Math.max(bitmap.width, bitmap.height));
        preview.current.width = Math.round(bitmap.width * scale); preview.current.height = Math.round(bitmap.height * scale);
        preview.current.getContext("2d")?.drawImage(bitmap, 0, 0, preview.current.width, preview.current.height);
        setDimensions({ width: preview.current.width, height: preview.current.height });
        setHasPreview(true);
      }
      await initDetector(token);
      if (token !== session.current) return;
      activeMode.current = "photo";
      setMessage("Foto cargada. Estamos buscando las articulaciones…");
      await sendFrame(bitmap, bitmap.width, bitmap.height, false, token);
    } catch { if (token === session.current) fail("No pudimos abrir o analizar esta foto. Prueba un JPG más pequeño o un navegador actualizado."); }
    finally { bitmap?.close(); if (fileInput.current) fileInput.current.value = ""; }
  }
  function freeze() {
    // Keep the last analyzed canvas/landmarks together; never take a mismatched frame.
    dispose(); activeMode.current = "frozen"; setMode("frozen"); setBottom(false); setPoints(rawPoints.current);
    go(2);
    setMessage("Captura detenida. La cámara se apagó; revisa el encuadre antes de comparar.");
  }
  async function showExample(selected = discipline, selectedPosture = posture) {
    reset();
    const token = session.current;
    const example = new Image();
    const exampleData = fitExample(selected, selectedPosture);
    example.src = exampleData.image;
    try {
      await example.decode();
      if (token !== session.current || !preview.current || !overlay.current) return;
      preview.current.width = overlay.current.width = 760; preview.current.height = overlay.current.height = 430;
      preview.current.getContext("2d")?.drawImage(example, 0, 0, 760, 430);
      setSide("left"); setDimensions({ width: 760, height: 430 }); setPoints(exampleData.points); setHasPreview(true);
      activeMode.current = "demo"; setMode("demo"); setMessage("Ejemplo ilustrativo: estos ángulos están simulados. No se está usando tu cámara ni analizando una persona.");
      go(2);
    } catch { setMessage("No pudimos abrir el ejemplo. Puedes activar la cámara o elegir una foto."); }
  }
  const nextStep = demo ? "Así se verá el análisis. Ahora prueba con tu cámara o una foto." : mode === "loading" ? message : mode === "idle" ? consent ? "Activa la cámara o elige una foto para comenzar." : "Primero acepta el análisis local, o explora el ejemplo sin cámara." : !points.length ? message : !assessment.valid ? assessment.message : !framing ? "Cuerpo detectado. Confirma abajo que la toma es de perfil para ver los ángulos." : mode === "camera" ? posture === "standing" ? "Encuadre listo. Detén la captura para observar tu postura de pie." : "Encuadre listo para medir. Detén y revisa con el pedal del lado visible abajo." : posture === "standing" ? "Observa los ángulos de esta postura de pie; no se compara con el rango sentado." : !bottom ? "Ángulos listos. Confirma la posición del pedal para comparar la rodilla." : "Comparación lista. Revisa la referencia y sus límites.";

  return <>
    <div id="fit-capture" className={styles.captureAnchor}>
    <nav className={styles.stepNav} aria-label="Pasos del bike fitting">
      {["Prepara", "Tu foto", "Resultados"].map((label, index) => <button key={label} type="button" disabled={mode === "loading" || index === 2 && !hasPreview} aria-current={step === index ? "step" : undefined} onClick={() => go(index)}><span>{index + 1}</span>{label}</button>)}
    </nav>
    <h2 ref={stepHeading} tabIndex={-1} className={styles.stepHeading}>{["Prepara una toma útil", "Captura tu vista lateral", "Comprende tu posición"][step]}</h2>
    <p className={styles.stepIntro}>{["Elige tu disciplina y prepara la toma del módulo que quieres explorar.", "Acepta el análisis local y elige una foto. Verás las líneas del cuerpo sobre tu imagen.", demo ? "Este es un ejemplo del dibujo, no una medición tuya. Puedes probar después con tu foto." : fitModule.kneeReference ? "Comprueba que la imagen sea de perfil. Después podrás ver tus ángulos y comparar la rodilla." : "Comprueba la vista de perfil y observa los ángulos de brazos, tronco y piernas. Este módulo no evalúa el sillín."][step]}</p>

    <section className={styles.modulePicker} hidden={step !== 0} aria-label="Elige tu módulo de bike fitting">
    <div className={styles.disciplineRow}>
      <label className={styles.field} htmlFor="fit-discipline">¿Qué disciplina practicas?
        <select id="fit-discipline" value={discipline} onChange={event => { const next = event.target.value; reset(); setStep(0); setDiscipline(next); setPosture(bikeFitModule(next).posture); }}>{cyclingDisciplines.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select>
      </label>
      <div className={styles.disciplineInfo} aria-live="polite"><b>{fitModule.title} · {fitModule.focus}</b><p>{fitModule.description}</p></div>
    </div>

    <label className={styles.field} htmlFor="fit-posture" hidden={fitModule.postures.length === 1}>Elige qué quieres observar
      <select id="fit-posture" value={posture} onChange={event => { const position = event.target.value as FitPosture; reset(); setStep(0); setPosture(bikeFitModule(discipline, position).posture); }}>{fitModule.postures.map(position => <option key={position} value={position}>{position === "seated" ? "Pedaleo sentado · referencia de rodilla" : "Manejo de pie · observar brazos y tronco"}</option>)}</select>
    </label>
    </section>
    <div className={styles.moduleSummary} hidden={step === 0}><span>{selectedDiscipline.label} · {fitModule.title}</span><button type="button" disabled={mode === "loading"} onClick={() => { reset(); go(0); }}>Cambiar módulo (borra la toma)</button></div>
    <div hidden={step !== 0}>
    <div className={styles.visualGuide}>
      <img src={illustration.image} width="760" height="430" alt={`Postura ilustrativa de ${selectedDiscipline.label}: ${illustration.standing ? "de pie" : "sentado"}, vista lateral.`} />
      <div><span className="tp-kicker">{fitModule.title}</span><h2>Prepara una foto como ésta</h2><ol className={styles.simpleGuide}><li>Deja la bici quieta y bien sostenida.</li><li>Pide que te fotografíen de lado, a la altura de la cadera.</li><li>Incluye cabeza, manos, pies y bicicleta completa.</li></ol><p>{fitModule.preparation}</p><p className={styles.small}>{fitModule.hands}</p><div className={styles.actions}><button type="button" className="tp-btn tp-btn-primary" onClick={() => go(1)}>Ya tengo mi foto →</button><button className="tp-btn tp-btn-outline" onClick={() => void showExample()} disabled={mode === "loading"}>Ver ejemplo de resultados</button></div><p className={styles.small}>¿Todavía no tienes foto? Puedes usar la cámara en el siguiente paso. El ejemplo funciona sin cámara.</p></div>
    </div>
    <details className={styles.exampleAngles}>
      <summary>Más sobre la ilustración y sus ángulos</summary>
      <h3>{selectedDiscipline.label} · Ángulos del ejemplo</h3>
      <p className={styles.small}>Valores de la ilustración, no objetivos que debas copiar.</p>
      <div className={styles.exampleMetrics}>{illustration.angles.valid && [["Rodilla (flexión)", illustration.angles.knee], ["Tronco–muslo", illustration.angles.hip], ["Codo (interno)", illustration.angles.elbow], ["Tronco / horizontal", illustration.angles.torso]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{Math.round(Number(value))}°</strong></div>)}</div>
      <p className={styles.small}>{illustration.standing ? "De pie: no aplicar el rango de rodilla sentado. Para revisar el pedaleo en enduro, toma otra imagen sentado." : "Referencia para revisar sentado, estático y con pedal abajo: rodilla 25–35°. No define objetivos propios de esta disciplina."}</p>
      <details className={styles.details}><summary>¿Por qué no todos tienen un ángulo ideal?</summary><p>La posición depende de tu cuerpo, flexibilidad, bicicleta y apoyo en el manillar. Cadera, codo y tronco se muestran para observar cambios; no hay un rango universal validado aquí por disciplina.</p><a href="https://pubmed.ncbi.nlm.nih.gov/32022807/" target="_blank" rel="noopener noreferrer">Referencia de rodilla estática</a> · <a href="https://pubmed.ncbi.nlm.nih.gov/35782160/" target="_blank" rel="noopener noreferrer">Estudio sobre postura y características del ciclista</a></details>
    </details>
    <details className={`${styles.card} ${styles.preparation}`}>
      <summary>Cómo preparar una toma útil</summary>
        <ol className={styles.guide}>
          <li>Usa una bicicleta fija o rodillo estable. Pide ayuda para colocar la cámara; no uses el teléfono mientras circulas.</li>
          <li>Coloca la cámara de perfil, perpendicular a la bicicleta, aproximadamente a la altura de la cadera. Evita el gran angular y las tomas inclinadas.</li>
          <li>Incluye bicicleta completa, cabeza, manos y pies, dejando margen. Usa buena luz, ropa ajustada y deja sólo a una persona visible.</li>
          <li>{posture === "seated" ? "Usa tu calzado habitual, con el pie apoyado como al pedalear. Permanece sentado, manos en el apoyo que quieres revisar y pedal del lado visible abajo. No fuerces el tobillo ni estires la pierna para alcanzar una cifra." : "Mantén pedales a nivel y la bici bien sostenida. La postura de manejo cambia con el terreno; esta toma de pie solo permite observar ángulos."}</li>
        </ol>
    </details>
    </div>
    <div className={styles.grid} data-step={step} data-empty={!hasPreview}>
      <div className={styles.card} hidden={step === 0}>
        <span className="tp-kicker">Captura</span>
        <h2 className="tp-display">Tu vista lateral</h2>
        <div hidden={step !== 1}>
        <label className={styles.check}><input type="checkbox" checked={consent} onChange={(event) => { setConsent(event.target.checked); if (!event.target.checked) reset(); }} />
          <span>Acepto analizar mi imagen en este dispositivo. No se envía ni guarda.</span>
        </label>
        <label className={`${styles.field} ${styles.photoChoice}`}>1. Elige tu foto de perfil
          <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" disabled={!consent || mode === "loading"} onChange={(event) => loadPhoto(event.target.files?.[0])} />
          <small>JPG, PNG o WebP · hasta 15 MB. Si tu foto es HEIC, conviértela a JPG.</small>
        </label>
        <p className={styles.small}>¿Prefieres hacerlo en vivo? Coloca el dispositivo de lado y usa la cámara.</p>
        <div className={styles.actions}>
          <button id="fit-camera-start" className="tp-btn tp-btn-outline" disabled={!consent || mode === "loading" || mode === "camera"} onClick={startCamera}>{mode === "loading" ? "Preparando análisis…" : mode === "camera" ? "Cámara activa" : "Activar cámara"}</button>
          {mode === "camera" && <button className="tp-btn tp-btn-outline" disabled={!points.length} onClick={freeze}>Detener y revisar</button>}
          {mode !== "idle" && <button className="tp-btn tp-btn-outline" onClick={reset}>Apagar y borrar</button>}
        </div>
        {!consent && <p className={styles.small}>Marca la casilla de consentimiento para habilitar la cámara y la foto. El ejemplo funciona sin ella.</p>}
        </div>
        <div ref={stage} className={styles.stage}>
          {!hasPreview && !cameraReady && <div className={styles.placeholder}><span className={styles.cameraSymbol} aria-hidden="true">◎</span><span>{mode === "loading" ? "Preparando tu análisis…" : "Aquí aparecerá tu cámara o fotografía"}</span><small>Usa la guía de arriba para preparar el encuadre</small></div>}
          <video ref={video} muted playsInline aria-label="Vista de cámara mientras se prepara el análisis" style={{ display: cameraReady && !hasPreview ? "block" : "none" }} />
          {/* Canvas sizing is imperative alongside drawing. Changing width/height
              through React after drawing would erase the captured image. */}
          <canvas ref={preview} width={960} height={540} aria-label={demo ? "Ejemplo ilustrativo con ángulos simulados" : "Vista local del ciclista"} style={{ display: hasPreview ? "block" : "none" }} />
          <canvas ref={overlay} width={960} height={540} className={styles.overlay} aria-hidden="true" />
          {mode === "loading" && <span className={styles.liveBadge}><i className={styles.spinner} />Preparando análisis local</span>}
          {mode === "camera" && <span className={styles.liveBadge}><i className={styles.pulse} />En vivo · {readings} lecturas</span>}
          {demo && <span className={styles.liveBadge}>Ejemplo · datos simulados</span>}
        </div>
        <div className={styles.status} role="status" aria-live="polite">{!demo && points.length ? !assessment.valid ? assessment.message : `${message} ${!framing ? "Cuerpo detectado: confirma la vista de perfil para ver los ángulos." : "Puntos visibles: revisa que las líneas sigan tus articulaciones."}` : message}</div>
        {hasPreview && <div className={styles.colorGuide} aria-label="Significado de las líneas"><span style={{ color: "#79dfb5" }}>● Dentro</span><span style={{ color: "#ffd166" }}>● Cerca</span><span style={{ color: "#ff8282" }}>● Más alejada</span><span style={{ color: "#82bddd" }}>● Sin comparación</span><p>El color de la pierna compara la rodilla con 25–35°, sólo sentado, quieto y con pedal abajo. Azul muestra articulaciones sin evaluar si están bien o mal. Amarillo significa proximidad, no una mejora comprobada.</p></div>}
        {step === 1 && mode === "camera" && <div className={styles.reference}>
          <strong>Ver la referencia mientras estás quieto</strong>
          <label className={styles.check}><input type="checkbox" checked={framing} onChange={event => { setFraming(event.target.checked); setBottom(false); }} /><span>Estoy de perfil, completo en la imagen, y las líneas coinciden con mis articulaciones.</span></label>
          {posture === "seated" && <label className={styles.check}><input type="checkbox" checked={bottom} disabled={!valid} onChange={event => setBottom(event.target.checked)} /><span>Estoy sentado, sin pedalear, y mantengo el pedal visible en su punto más bajo. Desmarcaré esto antes de moverme.</span></label>}
          <p style={{ color: feedback.color }}>{posture === "standing" ? "De pie: las líneas azules permiten observar; no hay un rango ideal universal para colorear esta postura." : feedback.title}</p>
          {bottom && valid && !liveStable && <p>Mantén la posición: esperamos tres lecturas consistentes antes de mostrar el color.</p>}
          {showComparison && assessment.valid && <><strong>{Math.round(assessment.knee)}° · referencia 25–35°</strong><p>{feedback.action}</p></>}
          <p className={styles.small}>Líneas suavizadas para reducir el temblor. La cámara no detecta la posición del pedal. Para pedalear, desmarca la confirmación. Apaga la cámara y bájate de la bici antes de ajustar componentes.</p>
        </div>}
        <p className={styles.small}>Al cambiar de pestaña se apaga la cámara y se borra la sesión. No hay grabación, historial ni identificación de personas.</p>
      </div>
      <div className={styles.card} hidden={step === 0 || step === 1 && !hasPreview}>
        <div hidden={step !== 1} className={styles.nextStep}><strong>2. Revisa esta imagen</strong><p>{points.length && !assessment.valid ? assessment.message : mode === "camera" ? "Cuando estés listo, detén la cámara para revisar una imagen fija." : "La foto ya está cargada. Continúa para confirmar el perfil y ver tus resultados."}</p><button type="button" className="tp-btn tp-btn-primary" disabled={!hasPreview || mode === "loading"} onClick={() => mode === "camera" ? freeze() : go(2)}>{mode === "camera" ? "Detener y ver resultados →" : "Continuar con esta foto →"}</button></div>
        <div hidden={step !== 2}>
        <span className="tp-kicker">Resultados</span>
        <h2 className="tp-display">Tu posición, en ángulos</h2>
        <div className={styles.nextStep} data-ready={assessment.valid && !demo}><strong>{demo ? "Estás viendo un ejemplo" : assessment.valid ? "✓ Cuerpo detectado" : mode === "loading" ? "Preparando el detector" : "Vamos paso a paso"}</strong><p>{nextStep}</p></div>
        <details className={styles.metricHelp}><summary>Ver comprobaciones de la toma</summary><ul className={styles.checklist} aria-label="Estado de la toma">
          <li data-done={hasPreview}> {hasPreview ? "✓" : "○"} {demo ? "Ilustración de ejemplo" : "Cámara o foto visible"}</li>
          <li data-done={assessment.valid}>{assessment.valid ? "✓" : "○"} {demo ? "Puntos simulados" : "Articulaciones visibles"}</li>
          <li data-done={framing && !demo}>{framing && !demo ? "✓" : "○"} Perfil confirmado por ti</li>
        </ul></details>
        <div hidden={demo}>
        <details className={styles.metricHelp}><summary>¿Las líneas no coinciden? Cambia el lado del cuerpo</summary>
        <p className={styles.small}>Elegimos el lado más visible automáticamente. Izquierdo y derecho se refieren a tu cuerpo, no a la pantalla.</p>
        <label className={styles.field}>Lado del cuerpo cercano a la cámara
          <select id="fit-side" value={side} disabled={demo} onChange={(event) => { chooseSide.current = false; setSide(event.target.value as BikeSide); setBottom(false); }}><option value="left">Izquierdo del ciclista</option><option value="right">Derecho del ciclista</option></select>
        </label>
        </details>
        <label className={styles.check}><input type="checkbox" checked={framing} disabled={demo || !hasPreview} onChange={(event) => { setFraming(event.target.checked); setBottom(false); }} />
          <span>La foto es de lado, se ven mi cuerpo y la bici completos, y la cámara está horizontal.</span>
        </label>
        <p className={styles.small}>Esta confirmación es tuya: el detector no comprueba la bicicleta ni la perspectiva.</p>
        </div>
        <p className={styles.small}>{demo ? "Valores simulados para conocer la herramienta. No describen tu posición." : points.length && assessment.valid ? "Las líneas muestran los puntos detectados. Comprueba que coincidan con tus articulaciones." : "Si no aparecen líneas, mejora la luz, aléjate del borde o prueba el otro lado del cuerpo."}</p>
        <dl className={styles.metrics} hidden={!valid}>
          {fitModule.metrics.map((metric, index) => <div key={metric} className={styles.metric} data-primary={index === 0}><dt>{({ knee: "Flexión de rodilla", hip: "Tronco–muslo (cadera)", elbow: "Ángulo interno de codo", torso: "Tronco respecto a horizontal" })[metric]}</dt><dd style={{ color: metric === "knee" ? feedback.color : "#82bddd" }}>{valid && assessment.valid ? `${Math.round(assessment[metric])}°` : "—"}</dd><small>{metric === "knee" && (showComparison || demo && posture === "seated") ? feedback.title : "Observación · sin objetivo personalizado"}</small></div>)}
        </dl>
        <p hidden={!valid}>{fitModule.interpretation}</p>
        <details className={styles.metricHelp}><summary>Cómo leer estos ángulos</summary><p className={styles.small}>Rodilla: flexión de cadera–rodilla–tobillo; 0° es pierna recta. Tronco–muslo: hombro–cadera–rodilla, no flexión clínica de cadera ni movilidad de la pelvis. Codo: ángulo interno hombro–codo–muñeca; 180° es brazo recto. Tronco: línea cadera–hombro respecto a horizontal, no curvatura de la espalda. Son estimaciones 2D.</p></details>
        <div hidden={demo || !valid}>
        <h3 className={styles.comparisonTitle}>{fitModule.kneeReference ? "¿Cómo se compara mi rodilla?" : "Qué observar en este módulo"}</h3>
        <label className={styles.check} hidden={!fitModule.kneeReference}><input type="checkbox" checked={bottom} disabled={!fitModule.kneeReference || !staticCapture || !valid} onChange={(event) => setBottom(event.target.checked)} />
          <span>En esta captura estática estoy sentado y el pedal del lado elegido está en su punto más bajo.</span>
        </label>
        <div className={styles.reference} data-fit={feedback.state}>
          {showComparison && <><span className={styles.verdict} style={{ color: feedback.color }}>{feedback.title}</span><div className={styles.range} aria-label={`Flexión de rodilla ${Math.round(assessment.knee)} grados; referencia de 25 a 35 grados`}><span className={styles.rangeBand} /><i style={{ left: `${Math.max(0, Math.min(90, assessment.knee)) / 90 * 100}%` }} /></div><div className={styles.rangeLabels}><span>0°</span><span>25–35°</span><span>90°</span></div><p>{feedback.action}</p><p className={styles.small}>Cambia una sola cosa, anota tu configuración anterior y repite la misma toma. No se calculan milímetros ni se interpreta el pedaleo en movimiento.</p></>}
          <strong>{posture === "standing" ? "De pie: sin comparación de altura de sillín" : "Referencia estática de rodilla: 25–35°"}</strong>
          <p>{posture === "standing" ? "Observa los ángulos y cómo cambia tu postura. El rango sentado no permite evaluar tu posición de ataque." : showComparison ? assessment.knee >= 25 && assessment.knee <= 35 ? "La estimación está dentro de esta referencia publicada. Esto no confirma un ajuste correcto de la bicicleta." : "La estimación está fuera de esta referencia publicada. Repite la toma y revisa la posición del pedal antes de interpretarla; no determina cuánto modificar el sillín." : "Detén la cámara o carga una foto, confirma el encuadre y la posición del pedal para comparar. No se interpreta el rango durante el pedaleo."}</p>
          <a hidden={!fitModule.kneeReference} href="https://pubmed.ncbi.nlm.nih.gov/32022807/" target="_blank" rel="noopener noreferrer">Fuente: Millour y colaboradores, 2019</a>
        </div>
        </div>
        <div hidden={!valid} className={styles.postureGuide}>
          <h3>Guía visual · {selectedDiscipline.label}</h3>
          <img src={illustration.image} width="760" height="430" alt={`Guía lateral de ${selectedDiscipline.label}, ${posture === "standing" ? "de pie" : "sentado"}`} />
          <p>{illustration.note}</p>
          <p className={styles.small}>Úsala para entender el apoyo de manos, la posición del pedal y el recorrido elegido. Tu cuerpo no tiene que coincidir exactamente con el dibujo.</p>
        </div>
        <details className={styles.details}><summary>¿Qué hago con estos resultados?</summary><p>Primero repite la toma para comprobar que el encuadre, el apoyo de las manos y la posición del pedal sean iguales. Diferencias pequeñas pueden deberse a la toma: no ajustes la bici por un grado aislado. Observa también cómo te sientes al pedalear: un ángulo aislado no describe toda tu postura.</p><p>Guarda una nota de tu configuración actual. Si realizas un ajuste, cambia una sola cosa, respeta las marcas y el apriete del fabricante y repite la toma. Esta herramienta no calcula cuánto subir el sillín ni qué potencia necesitas.</p></details>
        <button type="button" className="tp-btn tp-btn-primary" onClick={() => { if (demo) reset(); go(1); }}>{demo ? "Ahora probar con mi foto →" : "Elegir otra foto o repetir la toma"}</button>
        </div>
        <p className={styles.small} style={{ marginTop: 16 }}>Estimación orientativa, sin validación clínica en ciclistas. Si tienes dolor o adormecimiento, busca una evaluación profesional; esta imagen no identifica su causa.</p>
      </div>
    </div>
    <details className={`${styles.card} ${styles.details}`} hidden={step !== 2}>
      <summary>Cómo funciona y qué límites tiene</summary>
      <p>MediaPipe Pose Landmarker Lite estima articulaciones con un modelo de propósito general, no validado aquí para ciclistas. El análisis corre localmente en un Web Worker. El motor y el modelo se descargan desde Tropicleta; ninguna foto o fotograma se sube al servidor.</p>
      <p>Mostramos ángulos sólo cuando las articulaciones necesarias tienen visibilidad de al menos 0,75 y están dentro del encuadre. La detección y presencia de la persona usan un umbral de 0,65. Estos filtros no son porcentajes de precisión. La bicicleta, ropa, sombras y la pierna del lado opuesto pueden ocultar o confundir puntos. Verifica que las líneas sigan las articulaciones reales.</p>
      <p>Una cámara oblicua, inclinada o con distorsión altera los ángulos. No hay calibración de lente, escala ni reconstrucción 3D fiable, por lo que no estimamos centímetros, altura de sillín o retroceso. La confirmación de perfil es manual y no garantiza una perspectiva correcta.</p>
      <p>Durante el pedaleo influyen la carga, cadencia y posición del tobillo. Esta versión procesa como máximo unas cinco tomas por segundo y no detecta bielas, punto muerto inferior, ciclos o mínimos dinámicos. La comparación publicada es estática; los rangos dinámicos son diferentes. No damos referencias universales de cadera, codo o tronco.</p>
      <p>La cámara requiere HTTPS o localhost y permiso del navegador. El modelo necesita WebAssembly, Web Workers y decodificación de imágenes; el rendimiento varía según el dispositivo. No se conserva nada al salir o borrar la sesión.</p>
      <p><a href="https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker/web_js" target="_blank" rel="noopener noreferrer">Documentación del detector</a> · <a href="https://pubmed.ncbi.nlm.nih.gov/24499342/" target="_blank" rel="noopener noreferrer">Limitaciones de medición estática y dinámica (Bini y colaboradores, 2014)</a></p>
    </details>
    </div>
  </>;
}

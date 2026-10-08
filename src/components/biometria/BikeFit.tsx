"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { assessSaddlePose as assessPose, sidePoints, saddlePoints, type BikeSide, type PosePoint } from "@/lib/bike-fit";
import styles from "./BikeFit.module.css";
import { fitExample } from "@/lib/fit-example";
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
      dispose(); activeMode.current = "frozen"; setMode("frozen"); setBottom(false); setPoints(rawPoints.current);
      setMessage("Cámara apagada. Tu última captura sigue disponible para revisar.");
    }
    setStep(next);
    requestAnimationFrame(() => { stepHeading.current?.focus(); stepHeading.current?.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); });
  }
  const [captureChoice, setCaptureChoice] = useState<"photo" | "camera">("photo");
  const illustration = useMemo(() => fitExample("unknown", "seated"), []);
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
  const showComparison = staticCapture && bottom && valid && assessment.valid && (mode !== "camera" || liveStable);
  const feedback = kneeFeedback((showComparison || demo) && assessment.valid ? assessment.knee : null);
  useEffect(() => {
    const canvas = overlay.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!points.length) return;
    const [, , , h, k, a, heel, toe] = sidePoints[side];
    const edges = [[h, k], [k, a], [a, heel], [heel, toe]];
    ctx.fillStyle = "#f5f5f2"; ctx.lineWidth = 5;
    for (const [from, to] of edges) {
      if (!points[from] || !points[to] || (points[from].visibility ?? 0) < .75 || (points[to].visibility ?? 0) < .75) continue;
      ctx.strokeStyle = from === h && to === k || from === k && to === a ? feedback.color : "#82bddd";
      ctx.beginPath(); ctx.moveTo(points[from].x * canvas.width, points[from].y * canvas.height);
      ctx.lineTo(points[to].x * canvas.width, points[to].y * canvas.height); ctx.stroke();
    }
    for (const id of [h, k, a, heel, toe]) {
      if (!points[id] || (points[id].visibility ?? 0) < .75) continue;
      ctx.beginPath(); ctx.arc(points[id].x * canvas.width, points[id].y * canvas.height, 5, 0, Math.PI * 2); ctx.fill();
    }
    if (!valid || !assessment.valid) return;
    ctx.font = "bold 18px sans-serif";
    for (const [id, label] of [[k, `Rodilla ${Math.round(assessment.knee)}°`]] as const) {
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
              const confidence = (candidate: BikeSide) => Math.min(...saddlePoints[candidate].map((id) => data.points[id]?.visibility ?? 0));
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
  async function showExample() {
    reset();
    const token = session.current;
    const example = new Image();
    const exampleData = fitExample("unknown", "seated");
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
  const nextStep = demo ? "Ejemplo simulado: así se verá la referencia de rodilla." : !assessment.valid ? assessment.message : !framing ? "Confirma el perfil y revisa que las líneas coincidan con la pierna." : !bottom ? "Confirma que estás sentado, quieto y con el pedal visible abajo." : mode === "camera" && !liveStable ? "Mantén la posición: esperamos tres lecturas consistentes." : "Ya puedes comparar la rodilla y revisar el siguiente paso.";

  function chooseCapture(next: "photo" | "camera") { reset(); setCaptureChoice(next); go(0); }

  return <div id="fit-capture" className={styles.captureAnchor}>
    <nav className={styles.stepNav} aria-label="Pasos para revisar el sillín">
      {["Prepara", captureChoice === "photo" ? "Tu foto" : "En vivo", "Resultado"].map((label, index) => <button key={index} type="button" disabled={mode === "loading" || index === 2 && !hasPreview} aria-current={step === index ? "step" : undefined} onClick={() => go(index)}><span>{index + 1}</span>{label}</button>)}
    </nav>
    <h2 ref={stepHeading} tabIndex={-1} className={styles.stepHeading}>{["¿Cómo vas a hacer la revisión?", captureChoice === "photo" ? "Toma y carga tu foto" : "Pide ayuda para mirar la cámara", "Revisa la altura de tu sillín"][step]}</h2>
    <p className={styles.stepIntro}>{step === 0 ? "Elige tu situación. Te guiaremos para comparar la flexión de rodilla con una referencia estática." : step === 1 ? captureChoice === "photo" ? "Deja el celular apoyado, usa el temporizador y toma la foto. Después vuelve aquí y elígela desde tu galería." : "Tu acompañante sostiene el celular de lado y lee las indicaciones mientras tú permaneces sentado y quieto." : "Verás tu medición, la referencia y qué conviene revisar antes de cambiar el sillín."}</p>

    <div hidden={step !== 0}>
      <div className={styles.captureChoices} aria-label="Elige según tu situación">
        <button type="button" aria-pressed={captureChoice === "photo"} onClick={() => chooseCapture("photo")}><strong>Estoy solo · usar una foto</strong><span>Apoya el celular, usa el temporizador y revisa la imagen después. Opción recomendada para hacerlo en casa.</span></button>
        <button type="button" aria-pressed={captureChoice === "camera"} onClick={() => chooseCapture("camera")}><strong>Estoy con alguien · en vivo</strong><span>Pide que mire el celular y te lea la indicación. Tú mantienes la postura sin girarte hacia la pantalla.</span></button>
      </div>
      <div className={styles.visualGuide}>
        <img src={illustration.image} width="760" height="430" alt="Guía de encuadre: ciclista sentado de perfil y pedal cercano en su punto más bajo" />
        <div><span className="tp-kicker">Altura de sillín · revisión orientativa</span><h3>Prepara una toma como ésta</h3><ol className={styles.simpleGuide}>
          <li>Deja la bici estable en un rodillo o soporte. Siéntate con tu calzado y apoyo del pie habituales.</li>
          <li>Coloca el celular de lado, perpendicular a la bici y a la altura de la cadera. Incluye cuerpo y bici completos.</li>
          <li>Mantén el pedal cercano abajo, sin pedalear ni estirar el tobillo para alcanzar una cifra.</li>
        </ol><p>{captureChoice === "photo" ? "Usa el temporizador para volver a la postura sin tocar el teléfono. Si no puedes mantener la bici estable, pide ayuda." : "Pide a tu acompañante que mantenga el teléfono horizontal, compruebe el perfil y confirme el pedal abajo."}</p>
        <div className={styles.actions}><button type="button" className="tp-btn tp-btn-primary" onClick={() => go(1)}>{captureChoice === "photo" ? "Continuar con mi foto →" : "Preparar la cámara →"}</button><button type="button" className="tp-btn tp-btn-outline" onClick={() => void showExample()}>Ver un ejemplo</button></div></div>
      </div>
      <p className={styles.purpose}>Esta herramienta ayuda a revisar la altura del sillín mediante la rodilla. La referencia es la misma para el pedaleo sentado: no hace falta elegir disciplina. No mide centímetros ni evalúa manillar, potencia, manetas o retroceso.</p>
    </div>

    <div hidden={step === 0} className={styles.moduleSummary}><span>{captureChoice === "photo" ? "Foto · puedes hacerlo solo" : "Cámara · con ayuda de otra persona"}</span><button type="button" disabled={mode === "loading"} onClick={() => go(0)}>Volver a la preparación</button></div>
    <div className={styles.grid} data-step={step} data-empty={!hasPreview}>
      <section className={styles.card} hidden={step === 0} aria-label="Captura de la rodilla">
        <h3>{captureChoice === "photo" ? "Tu fotografía de perfil" : "Tu cámara de perfil"}</h3>
        <div hidden={step !== 1}>
          <label className={styles.check}><input type="checkbox" checked={consent} onChange={event => { setConsent(event.target.checked); if (!event.target.checked) reset(); }} /><span>Acepto analizar mi imagen en este dispositivo. No se envía ni guarda.</span></label>
          {captureChoice === "photo" ? <label className={`${styles.field} ${styles.photoChoice}`}>Elige la foto que tomaste<input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" disabled={!consent || mode === "loading"} onChange={event => void loadPhoto(event.target.files?.[0])} /><small>JPG, PNG o WebP · hasta 15 MB. Convierte HEIC a JPG si hace falta.</small></label> : <div className={styles.actions}><button id="fit-camera-start" type="button" className="tp-btn tp-btn-primary" disabled={!consent || mode === "loading" || mode === "camera"} onClick={() => void startCamera()}>{mode === "loading" ? "Preparando análisis…" : mode === "camera" ? "Cámara activa" : "Activar cámara con mi acompañante"}</button>{mode === "camera" && <button type="button" className="tp-btn tp-btn-outline" disabled={!points.length} onClick={freeze}>Detener y revisar esta imagen</button>}</div>}
          {!consent && <p className={styles.small}>Marca la casilla para habilitar {captureChoice === "photo" ? "la foto" : "la cámara"}. El ejemplo funciona sin ella.</p>}
          {mode !== "idle" && <button type="button" className="tp-btn tp-btn-outline" onClick={reset}>Apagar y borrar la toma</button>}
        </div>
        <div ref={stage} className={styles.stage}>
          {!hasPreview && !cameraReady && <div className={styles.placeholder}><span className={styles.cameraSymbol} aria-hidden="true">◎</span><span>{mode === "loading" ? "Preparando el análisis…" : "Aquí aparecerá tu imagen"}</span></div>}
          <video ref={video} muted playsInline aria-label="Cámara mientras se prepara el análisis" style={{ display: cameraReady && !hasPreview ? "block" : "none" }} />
          <canvas ref={preview} width={960} height={540} aria-label={demo ? "Ejemplo simulado de revisión del sillín" : "Imagen local del ciclista"} style={{ display: hasPreview ? "block" : "none" }} />
          <canvas ref={overlay} width={960} height={540} className={styles.overlay} aria-hidden="true" />
          {mode === "loading" && <span className={styles.liveBadge}><i className={styles.spinner} />Preparando análisis local</span>}
          {mode === "camera" && <span className={styles.liveBadge}><i className={styles.pulse} />En vivo · {readings} lecturas</span>}
          {demo && <span className={styles.liveBadge}>Ejemplo · datos simulados</span>}
        </div>
        <p className={styles.status} role="status" aria-live="polite">{message}</p>
        {hasPreview && <div className={styles.colorGuide} aria-label="Significado del color de la pierna"><span style={{ color: "#79dfb5" }}>● Dentro de referencia</span><span style={{ color: "#ffd166" }}>● Cerca</span><span style={{ color: "#ff8282" }}>● Más alejada</span><span style={{ color: "#82bddd" }}>● Falta confirmar</span></div>}
        <p className={styles.small}>Cambiar de pestaña apaga la cámara y borra la sesión. Las fotos y los fotogramas permanecen sólo en memoria durante esta revisión.</p>
      </section>

      <section className={styles.card} hidden={step === 0 || step === 1 && !hasPreview} aria-label="Comparación de rodilla y siguiente paso">
        {step === 1 && mode !== "camera" ? <div className={styles.nextStep}><h3>Tu foto ya está cargada</h3><p>{assessment.valid ? "Continúa para comprobar el perfil y el pedal antes de comparar." : assessment.message}</p><button type="button" className="tp-btn tp-btn-primary" disabled={mode === "loading"} onClick={() => go(2)}>Revisar esta foto →</button></div> : <>
          <h3>{mode === "camera" ? "Para quien mira el celular" : "Tu resultado de rodilla"}</h3>
          <div className={styles.nextStep}><strong>{demo ? "Estás viendo un ejemplo" : "Primero confirma la toma"}</strong><p>{nextStep}</p></div>
          {!demo && <>
            <label className={styles.check}><input type="checkbox" checked={framing} disabled={!hasPreview} onChange={event => { setFraming(event.target.checked); setBottom(false); }} /><span>{mode === "camera" ? "Veo al ciclista y la bici de perfil, completos, y las líneas siguen la pierna cercana." : "La foto es de perfil, incluye cuerpo y bici completos, y las líneas siguen la pierna cercana."}</span></label>
            <label className={styles.check}><input type="checkbox" checked={bottom} disabled={!valid} onChange={event => setBottom(event.target.checked)} /><span>{mode === "camera" ? "El ciclista está sentado, quieto y mantiene el pedal cercano abajo. Desmarcaré esto si se mueve." : "En esta imagen estoy sentado, sin pedalear y con el pedal cercano en su punto más bajo."}</span></label>
            <details className={styles.metricHelp}><summary>¿Las líneas siguen la otra pierna?</summary><label className={styles.field}>Lado del cuerpo cercano a la cámara<select id="fit-side" value={side} onChange={event => { chooseSide.current = false; setSide(event.target.value as BikeSide); setBottom(false); }}><option value="left">Izquierdo del ciclista</option><option value="right">Derecho del ciclista</option></select></label></details>
          </>}
          {valid && assessment.valid && <div className={styles.saddleResult}>
            <div className={styles.angleComparison}><div><span>{demo ? "Rodilla del ejemplo" : "Tu flexión de rodilla"}</span><strong style={{ color: feedback.color }}>{Math.round(assessment.knee)}°</strong></div><div><span>Referencia estática</span><strong>25–35°</strong></div></div>
            <p className={styles.small}>0° significa pierna recta. La referencia se compara sólo sentado, quieto y con el pedal abajo.</p>
            <div className={styles.reference} data-fit={feedback.state}><strong style={{ color: feedback.color }}>{feedback.title}</strong><p>{demo ? "Este ejemplo está dentro de la referencia. Ahora prueba con tu foto o con ayuda en cámara." : showComparison ? feedback.action : nextStep}</p></div>
            {showComparison && <><div className={styles.range} aria-label={`Rodilla ${Math.round(assessment.knee)} grados; referencia de 25 a 35 grados`}><span className={styles.rangeBand} /><i style={{ left: `${Math.max(0, Math.min(90, assessment.knee)) / 90 * 100}%` }} /></div><div className={styles.rangeLabels}><span>0°</span><span>25–35°</span><span>90°</span></div></>}
          </div>}
          <details className={styles.details}><summary>Cómo probar un ajuste y volver a medir</summary><ol className={styles.guide}><li>Repite primero la toma con el mismo pedal, calzado y apoyo del pie.</li><li>Si se confirma la diferencia, apaga la cámara, bájate de la bici y anota la altura actual.</li><li>Prueba un cambio pequeño en una sola dirección. Respeta la inserción mínima y el apriete del fabricante.</li><li>Repite la misma toma y comprueba también cómo te sientes al pedalear.</li></ol><p>No se calculan milímetros. El color verde describe esta referencia de rodilla y no garantiza por sí solo un ajuste adecuado.</p></details>
          <div className={styles.actions}>{mode === "camera" ? <button type="button" className="tp-btn tp-btn-outline" onClick={freeze}>Apagar cámara y revisar la captura</button> : <button type="button" className="tp-btn tp-btn-primary" onClick={() => { reset(); go(1); }}>{demo ? "Probar con mi toma →" : "Repetir con otra toma"}</button>}</div>
          <p className={styles.small} style={{ marginTop: 16 }}>Si tienes dolor o adormecimiento, busca una evaluación profesional. Esta imagen no identifica su causa.</p>
        </>}
      </section>
    </div>
    <details className={`${styles.card} ${styles.details}`} hidden={step === 0}>
      <summary>Referencia y límites de la revisión</summary><p>MediaPipe estima articulaciones en este dispositivo. La referencia estática de 25–35° no se interpreta durante el pedaleo. La cámara no detecta el pedal: el perfil y su posición se confirman manualmente. En vivo se suavizan las líneas y se esperan tres lecturas consistentes; una captura detenida usa los puntos sin suavizado.</p><p>La cámara, la ropa y el tobillo pueden alterar la estimación. El modelo no está validado aquí para ciclistas; la visibilidad de los puntos no equivale a precisión. La revisión no calcula una altura exacta, retroceso del sillín ni ajustes del manillar.</p><a href="https://pubmed.ncbi.nlm.nih.gov/32022807/" target="_blank" rel="noopener noreferrer">Referencia de rodilla estática: Millour y colaboradores</a>
    </details>
  </div>;
}

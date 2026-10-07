"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { assessPose, sidePoints, type BikeSide, type PosePoint } from "@/lib/bike-fit";
import styles from "./BikeFit.module.css";

type Mode = "idle" | "loading" | "camera" | "photo" | "frozen";
const initialMessage = "Acepta el procesamiento local y elige cámara o fotografía.";

export function BikeFit() {
  const [consent, setConsent] = useState(false);
  const [framing, setFraming] = useState(false);
  const [bottom, setBottom] = useState(false);
  const [side, setSide] = useState<BikeSide>("left");
  const [mode, setMode] = useState<Mode>("idle");
  const [message, setMessage] = useState(initialMessage);
  const [points, setPoints] = useState<PosePoint[]>([]);
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

  function stopTracks() {
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    if (video.current) video.current.srcObject = null;
    if (timer.current) clearTimeout(timer.current);
  }
  function dispose() {
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
    dispose();
    activeMode.current = "idle";
    setMode("idle"); setPoints([]); setBottom(false); setFraming(false);
    setMessage(initialMessage);
    for (const canvas of [preview.current, overlay.current]) canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    if (fileInput.current) fileInput.current.value = "";
  }
  function fail(text: string) {
    dispose(); activeMode.current = "idle";
    setMode("idle"); setPoints([]); setBottom(false); setMessage(text);
    for (const canvas of [preview.current, overlay.current]) canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
  }

  useEffect(() => {
    // Releasing camera and worker also removes every image from this component's memory.
    const hidden = () => { if (document.hidden) reset(); };
    document.addEventListener("visibilitychange", hidden);
    return () => { document.removeEventListener("visibilitychange", hidden); dispose(); };
    // The handler only uses stable refs and React setters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const assessment = useMemo(() => assessPose(points, side, dimensions.width, dimensions.height), [points, side, dimensions]);
  const valid = consent && framing && assessment.valid;
  useEffect(() => {
    const canvas = overlay.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!valid || !assessment.valid) return;
    const [s, e, w, h, k, a, heel, toe] = sidePoints[side];
    const edges = [[s, e], [e, w], [s, h], [h, k], [k, a], [a, heel], [heel, toe]];
    ctx.strokeStyle = "#f28a17"; ctx.fillStyle = "#f5f5f2"; ctx.lineWidth = 4;
    for (const [from, to] of edges) {
      ctx.beginPath(); ctx.moveTo(points[from].x * canvas.width, points[from].y * canvas.height);
      ctx.lineTo(points[to].x * canvas.width, points[to].y * canvas.height); ctx.stroke();
    }
    for (const id of sidePoints[side]) {
      ctx.beginPath(); ctx.arc(points[id].x * canvas.width, points[id].y * canvas.height, 5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.font = "bold 18px sans-serif";
    for (const [id, label] of [[k, `Rodilla ${Math.round(assessment.knee)}°`], [h, `Cadera ${Math.round(assessment.hip)}°`], [e, `Codo ${Math.round(assessment.elbow)}°`]] as const) {
      const x = Math.max(4, Math.min(canvas.width - 160, points[id].x * canvas.width + 10));
      const y = Math.max(24, points[id].y * canvas.height - 12);
      ctx.fillStyle = "#090a0b"; ctx.fillRect(x - 3, y - 20, 158, 27);
      ctx.fillStyle = "#f5f5f2"; ctx.fillText(label, x, y);
    }
  }, [assessment, points, side, valid, dimensions]);

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
          const frame = pendingFrame.current;
          if (frame && preview.current && overlay.current) {
            preview.current.width = overlay.current.width = frame.width;
            preview.current.height = overlay.current.height = frame.height;
            preview.current.getContext("2d")?.drawImage(frame, 0, 0);
            setDimensions({ width: frame.width, height: frame.height });
          }
          setPoints(data.points);
          setMessage(data.multiple ? "Hay más de una persona. Deja sólo al ciclista en el encuadre." : data.points.length ? "Análisis local activo." : "No detectamos una persona completa. Revisa luz, distancia y encuadre.");
          if (activeMode.current === "camera") scheduleFrame(token);
        }
      };
      detector.postMessage({ type: "init" });
    });
  }
  function begin() {
    dispose();
    busy.current = true; activeMode.current = "loading";
    setMode("loading"); setPoints([]); setBottom(false); setFraming(false);
    setMessage("Preparando el detector local. La primera carga puede tardar unos segundos…");
    return session.current;
  }
  async function startCamera() {
    if (!consent || busy.current) return;
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      fail("La cámara requiere HTTPS (o localhost) y un navegador compatible. Puedes cargar una foto local."); return;
    }
    const token = begin();
    try {
      const camera = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } } });
      if (token !== session.current) { camera.getTracks().forEach((track) => track.stop()); return; }
      stream.current = camera;
      camera.getVideoTracks()[0].onended = () => { if (token === session.current) fail("La cámara se desconectó. Vuelve a activarla o carga una fotografía."); };
      if (!video.current) throw new Error("video");
      video.current.srcObject = camera;
      await video.current.play();
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
      await initDetector(token);
      if (token !== session.current) return;
      activeMode.current = "photo"; setMode("photo"); busy.current = false;
      await sendFrame(bitmap, bitmap.width, bitmap.height, false, token);
    } catch { if (token === session.current) fail("No pudimos abrir o analizar esta foto. Prueba un JPG más pequeño o un navegador actualizado."); }
    finally { bitmap?.close(); if (fileInput.current) fileInput.current.value = ""; }
  }
  function freeze() {
    // Keep the last analyzed canvas/landmarks together; never take a mismatched frame.
    dispose(); activeMode.current = "frozen"; setMode("frozen"); setBottom(false);
    setMessage("Captura detenida. La cámara se apagó; revisa el encuadre antes de comparar.");
  }
  const still = mode === "photo" || mode === "frozen";
  const showComparison = still && bottom && valid && assessment.valid;

  return <>
    <div className={styles.workflow} aria-label="Pasos del análisis">
      <div><b>01 · Prepara</b><span>Bicicleta estable y cámara de perfil.</span></div>
      <div><b>02 · Captura</b><span>Activa la cámara o elige una foto.</span></div>
      <div><b>03 · Revisa</b><span>Confirma el encuadre y lee los ángulos.</span></div>
    </div>
    <details className={`${styles.card} ${styles.preparation}`}>
      <summary>Cómo preparar una toma útil</summary>
        <ol className={styles.guide}>
          <li>Usa una bicicleta fija o rodillo estable. Pide ayuda para colocar la cámara; no uses el teléfono mientras circulas.</li>
          <li>Coloca la cámara de perfil, perpendicular a la bicicleta, aproximadamente a la altura de la cadera. Evita el gran angular y las tomas inclinadas.</li>
          <li>Incluye bicicleta completa, cabeza, manos y pies, dejando margen. Usa buena luz, ropa ajustada y deja sólo a una persona visible.</li>
          <li>Para comparar la rodilla, permanece sentado, con las manos en el manillar y el pedal del lado visible en su punto más bajo. Detén la captura.</li>
        </ol>
    </details>
    <div className={styles.grid}>
      <div className={styles.card}>
        <span className="tp-kicker">Captura</span>
        <h2 className="tp-display">Tu vista lateral</h2>
        <label className={styles.check}><input type="checkbox" checked={consent} onChange={(event) => { setConsent(event.target.checked); if (!event.target.checked) reset(); }} />
          <span>Acepto el análisis en este dispositivo. Las imágenes no se envían ni guardan. Tú decides cuándo activar la cámara y borrar la sesión.</span>
        </label>
        <div className={styles.actions}>
          <button className="tp-btn tp-btn-primary" disabled={!consent || mode === "loading" || mode === "camera"} onClick={startCamera}>Activar cámara</button>
          {mode === "camera" && <button className="tp-btn tp-btn-outline" disabled={!points.length} onClick={freeze}>Detener y revisar</button>}
          {mode !== "idle" && <button className="tp-btn tp-btn-outline" onClick={reset}>Apagar y borrar</button>}
        </div>
        <label className={styles.field}>O elige una foto lateral (JPG, PNG o WebP; máximo 15 MB)
          <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" disabled={!consent || mode === "loading"} onChange={(event) => loadPhoto(event.target.files?.[0])} />
        </label>
        <video ref={video} muted playsInline aria-hidden="true" style={{ display: "none" }} />
        <div className={styles.stage}>
          {mode === "idle" || mode === "loading" ? <div className={styles.placeholder}>Vista lateral<br />Cuerpo y bicicleta completos dentro del encuadre</div> : null}
          <canvas ref={preview} width={dimensions.width} height={dimensions.height} hidden={mode === "idle" || mode === "loading"} aria-label="Vista local del ciclista" style={{ display: mode === "idle" || mode === "loading" ? "none" : "block" }} />
          <canvas ref={overlay} width={dimensions.width} height={dimensions.height} className={styles.overlay} aria-hidden="true" />
        </div>
        <div className={styles.status} role="status" aria-live="polite">{message}</div>
        <p className={styles.small}>Al cambiar de pestaña se apaga la cámara y se borra la sesión. No hay grabación, historial ni identificación de personas.</p>
      </div>
      <div className={styles.card}>
        <span className="tp-kicker">Resultados</span>
        <h2 className="tp-display">Tu posición, en ángulos</h2>
        <label className={styles.field}>Lado del cuerpo cercano a la cámara
          <select value={side} onChange={(event) => { setSide(event.target.value as BikeSide); setBottom(false); }}><option value="left">Izquierdo del ciclista</option><option value="right">Derecho del ciclista</option></select>
        </label>
        <label className={styles.check}><input type="checkbox" checked={framing} onChange={(event) => { setFraming(event.target.checked); setBottom(false); }} />
          <span>Confirmo una vista de perfil con cuerpo y bicicleta completos, sin inclinación de cámara. El detector no puede comprobar la bicicleta ni la perspectiva.</span>
        </label>
        <p>{!points.length ? "Esperando una toma. Los resultados aparecerán si las articulaciones son visibles." : !framing ? "Confirma el encuadre para ver los ángulos." : assessment.message}</p>
        <dl className={styles.metrics}>
          {[["Flexión de rodilla", assessment.valid ? assessment.knee : null], ["Ángulo de cadera", assessment.valid ? assessment.hip : null], ["Ángulo de codo", assessment.valid ? assessment.elbow : null], ["Tronco respecto a horizontal", assessment.valid ? assessment.torso : null]].map(([label, value]) => <div key={label} className={styles.metric}><dt>{label}</dt><dd>{valid && typeof value === "number" ? `${Math.round(value)}°` : "—"}</dd></div>)}
        </dl>
        <details className={styles.metricHelp}><summary>Cómo leer estos ángulos</summary><p className={styles.small}>Rodilla: 0° corresponde a una pierna recta. Cadera: hombro–cadera–rodilla. Codo: hombro–codo–muñeca. Son proyecciones 2D, sin calibración de distancias.</p></details>
        <h3 className={styles.comparisonTitle}>Compara una captura estática</h3>
        <label className={styles.check}><input type="checkbox" checked={bottom} disabled={!still || !valid} onChange={(event) => setBottom(event.target.checked)} />
          <span>En esta captura estática estoy sentado y el pedal del lado elegido está en su punto más bajo.</span>
        </label>
        <div className={styles.reference}>
          <strong>Referencia estática de rodilla: 25–35°</strong>
          <p>{showComparison ? assessment.knee >= 25 && assessment.knee <= 35 ? "La estimación está dentro de esta referencia publicada. Esto no confirma un ajuste correcto de la bicicleta." : "La estimación está fuera de esta referencia publicada. Repite la toma y revisa la posición del pedal antes de interpretarla; no determina cuánto modificar el sillín." : "Detén la cámara o carga una foto, confirma el encuadre y la posición del pedal para comparar. No se interpreta el rango durante el pedaleo."}</p>
          <a href="https://pubmed.ncbi.nlm.nih.gov/32022807/" target="_blank" rel="noopener noreferrer">Fuente: Millour y colaboradores, 2020</a>
        </div>
        <p className={styles.small} style={{ marginTop: 16 }}>Herramienta experimental y orientativa. No mide dimensiones corporales, no diagnostica lesiones ni sustituye un bike fitting profesional. Si tienes dolor, consulta a un profesional antes de cambiar tu posición.</p>
      </div>
    </div>
    <details className={`${styles.card} ${styles.details}`}>
      <summary>Cómo funciona y qué límites tiene</summary>
      <p>MediaPipe Pose Landmarker Lite estima articulaciones con un modelo de propósito general, no validado aquí para ciclistas. El análisis corre localmente en un Web Worker. El motor y el modelo se descargan desde Tropicleta; ninguna foto o fotograma se sube al servidor.</p>
      <p>Mostramos ángulos sólo cuando las articulaciones necesarias tienen visibilidad de al menos 0,75 y están dentro del encuadre. La detección y presencia de la persona usan un umbral de 0,65. Estos filtros no son porcentajes de precisión. La bicicleta, ropa, sombras y la pierna del lado opuesto pueden ocultar o confundir puntos. Verifica que las líneas sigan las articulaciones reales.</p>
      <p>Una cámara oblicua, inclinada o con distorsión altera los ángulos. No hay calibración de lente, escala ni reconstrucción 3D fiable, por lo que no estimamos centímetros, altura de sillín o retroceso. La confirmación de perfil es manual y no garantiza una perspectiva correcta.</p>
      <p>Durante el pedaleo influyen la carga, cadencia y posición del tobillo. Esta versión procesa como máximo unas cinco tomas por segundo y no detecta bielas, punto muerto inferior, ciclos o mínimos dinámicos. La comparación publicada es estática; los rangos dinámicos son diferentes. No damos referencias universales de cadera, codo o tronco.</p>
      <p>La cámara requiere HTTPS o localhost y permiso del navegador. El modelo necesita WebAssembly, Web Workers y decodificación de imágenes; el rendimiento varía según el dispositivo. No se conserva nada al salir o borrar la sesión.</p>
      <p><a href="https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker/web_js" target="_blank" rel="noopener noreferrer">Documentación del detector</a> · <a href="https://pubmed.ncbi.nlm.nih.gov/24499342/" target="_blank" rel="noopener noreferrer">Limitaciones de medición estática y dinámica (Bini y colaboradores, 2014)</a></p>
    </details>
  </>;
}

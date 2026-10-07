// All runtime/model assets and inference stay on this origin/device.
let detector;
let runningMode = "IMAGE";
self.onmessage = async ({ data }) => {
  try {
    if (data.type === "init") {
      // The WASM loader needs importScripts(), which requires a classic worker.
      const { FilesetResolver, PoseLandmarker } = await import("/biometria/vendor/vision_bundle.mjs");
      const files = await FilesetResolver.forVisionTasks("/biometria/vendor/wasm");
      detector = await PoseLandmarker.createFromOptions(files, {
        baseOptions: { modelAssetPath: "/biometria/vendor/pose_landmarker_lite.task", delegate: "CPU" },
        runningMode, numPoses: 2, minPoseDetectionConfidence: .65,
        minPosePresenceConfidence: .65, minTrackingConfidence: .65,
      });
      self.postMessage({ type: "ready" });
    } else if (data.type === "frame" && detector) {
      const mode = data.video ? "VIDEO" : "IMAGE";
      if (mode !== runningMode) {
        await detector.setOptions({ runningMode: mode });
        runningMode = mode;
      }
      const result = data.video ? detector.detectForVideo(data.bitmap, data.timestamp) : detector.detect(data.bitmap);
      self.postMessage({ type: "result", points: result.landmarks.length === 1 ? result.landmarks[0] : [], multiple: result.landmarks.length > 1 });
    }
  } catch {
    self.postMessage({ type: "error" });
  } finally {
    data.bitmap?.close();
  }
};

# Local pose assets

Google MediaPipe Tasks Vision **0.10.32** (Apache-2.0; see LICENSE).

Source archive: https://registry.npmjs.org/@mediapipe/tasks-vision/-/tasks-vision-0.10.32.tgz

Files: vision_bundle.mjs; wasm/vision_wasm_internal.{js,wasm}; wasm/vision_wasm_nosimd_internal.{js,wasm}.

Pose Landmarker Lite, float16, model revision **1**:
https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task

Official model documentation: https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker

SHA-256:

- vision_bundle.mjs: DE83C48FF329717A27AEB528D5EF5F47F077C628A5302DC483ACA5B513E7464B
- pose_landmarker_lite.task: 59929E1D1EE95287735DDD833B19CF4AC46D29BC7AFDDBBF6753C459690D574A

Served by Tropicleta; no remote runtime, model requests or image uploads are needed. Keep runtime JS and both WASM variants on the same pinned release when updating. No modifications to vendor code.

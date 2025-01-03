import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'; // Correct import for GLTFLoader
import { Hands } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 1;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 5, 5);
scene.add(light);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// Load watch model
const loader = new GLTFLoader();
let watch;
loader.load('/watch.glb', (gltf) => {
  watch = gltf.scene;
  watch.scale.set(0.04, 0.04, 0.04); // Scale the watch
  watch.visible = false; // Hide initially
  scene.add(watch);
});

// MediaPipe Hands setup
const videoElement = document.createElement('video');
videoElement.style.display = 'none';
document.body.appendChild(videoElement);

const hands = new Hands({
  locateFile: (file) => `node_modules/@mediapipe/hands/${file}`,
});

hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
});

hands.onResults((results) => {
  if (results.multiHandLandmarks.length > 0 && watch) {
    const landmarks = results.multiHandLandmarks[0];

    // Get wrist landmark (landmark 0)
    const wrist = landmarks[0];
    const wrist3D = new THREE.Vector3(wrist.x - 0.5, -(wrist.y - 0.5), -wrist.z).multiplyScalar(2);

    // Position the watch on the wrist
    watch.position.set(wrist3D.x, wrist3D.y, wrist3D.z);
    watch.visible = true;

    // Adjust rotation if needed (assumes right-hand)
    watch.rotation.set(0, 0, Math.PI / 2);
  }
});

// Camera feed setup
const cameraFeed = new Camera(videoElement, {
  onFrame: async () => {
    await hands.send({ image: videoElement });
  },
  width: 640,
  height: 480,
});
cameraFeed.start();

// Animation loop
const animate = () => {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
};

animate();

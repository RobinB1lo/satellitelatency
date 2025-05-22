import * as THREE from "three";
import { OrbitControls } from "jsm/controls/OrbitControls.js";
import getStarfield from "./earthvis/getStarfield.js";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 1000);
camera.position.set(0, 0, 3.5);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

const orbitCtrl = new OrbitControls(camera, renderer.domElement);
orbitCtrl.enableDamping = true;

const textureLoader = new THREE.TextureLoader();
const starSprite = textureLoader.load("./earthvis/circle.png");
const colorMap = textureLoader.load("./earthvis/green.png");
const elevMap = textureLoader.load("./earthvis/01_earthbump1k.jpg");
const alphaMap = textureLoader.load("./earthvis/02_earthspec1k.jpg");

const globeGroup = new THREE.Group();
scene.add(globeGroup);

const geo = new THREE.IcosahedronGeometry(1, 10);
const mat = new THREE.MeshBasicMaterial({ 
  color: 0x2986cc,
  wireframe: true,
 });
const globe = new THREE.Mesh(geo, mat);
globeGroup.add(globe);

const satTexture = textureLoader.load('./earthvis/pngimg.com - satellite_PNG28.png');

const satSpriteMat = new THREE.SpriteMaterial({
  map: satTexture,
  transparent: true,      
  depthWrite: false,      
});

// 3. Instead of SphereGeometry, make sprites
const satGroup = new THREE.Group();
scene.add(satGroup);

const orbitRadius = 1.3;
for (let i = 0; i < 198; i++) {
  const satSprite = new THREE.Sprite(satSpriteMat);

  // size in world-units: tweak so it looks reasonable
  const spriteSize = 0.05;
  satSprite.scale.set(spriteSize, spriteSize, 1);

  // same Fibonacci lattice positioning as before
  const phi   = Math.acos(1 - 2 * (i + 0.5) / 198);
  const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);
  satSprite.position.set(
    orbitRadius * Math.sin(phi) * Math.cos(theta),
    orbitRadius * Math.sin(phi) * Math.sin(theta),
    orbitRadius * Math.cos(phi)
  );

  satGroup.add(satSprite);
}
const detail = 120;
const pointsGeo = new THREE.IcosahedronGeometry(1, detail);

const vertexShader = `
  uniform float size;
  uniform sampler2D elevTexture;

  varying vec2 vUv;
  varying float vVisible;

  void main() {
    vUv = uv;
    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
    float elv = texture2D(elevTexture, vUv).r;
    vec3 vNormal = normalMatrix * normal;
    vVisible = step(0.0, dot( -normalize(mvPosition.xyz), normalize(vNormal)));
    mvPosition.z += 0.35 * elv;
    gl_PointSize = size;
    gl_Position = projectionMatrix * mvPosition;
  }
`;
const fragmentShader = `
  uniform sampler2D colorTexture;
  uniform sampler2D alphaTexture;

  varying vec2 vUv;
  varying float vVisible;

  void main() {
    if (floor(vVisible + 0.1) == 0.0) discard;
    float alpha = 1.0 - texture2D(alphaTexture, vUv).r;
    vec3 color = texture2D(colorTexture, vUv).rgb;
    gl_FragColor = vec4(color, alpha);
  }
`;
const uniforms = {
  size: { type: "f", value: 4.0 },
  colorTexture: { type: "t", value: colorMap },
  elevTexture: { type: "t", value: elevMap },
  alphaTexture: { type: "t", value: alphaMap }
};
const pointsMat = new THREE.ShaderMaterial({
  uniforms: uniforms,
  vertexShader,
  fragmentShader,
  transparent: true
});

const points = new THREE.Points(pointsGeo, pointsMat);
globeGroup.add(points);

const hemiLight = new THREE.HemisphereLight(0xffffff, 0x080820, 3);
scene.add(hemiLight);

const stars = getStarfield({ numStars:4500, sprite: starSprite });
scene.add(stars);

function animate() {
  renderer.render(scene, camera);
  globeGroup.rotation.y += 0.0005;
  satGroup.rotation.y += 0.005;

  requestAnimationFrame(animate);
  orbitCtrl.update();
};
animate();

window.addEventListener('resize', function () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}, false);

// https://discourse.threejs.org/t/earth-point-vertex-elevation/62689
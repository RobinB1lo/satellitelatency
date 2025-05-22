import * as THREE from "three";
import { OrbitControls } from "jsm/controls/OrbitControls.js";
import getStarfield from "earthvis/getStarfield.js";

let scene, camera, renderer, orbitCtrl;
let globeGroup, satGroup, clickGlobe;
let raycaster, mouse, redSpriteMat;
let textureLoader;

init();
animate();

async function init() {
    // Scene setup
    scene = new THREE.Scene();
    
    // Camera setup
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 3.5);

    // Renderer setup with depth buffer enabled
    renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        depthBuffer: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);
    renderer.domElement.style.position = 'fixed';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';

    // Controls setup
    orbitCtrl = new OrbitControls(camera, renderer.domElement);
    orbitCtrl.enableDamping = true;

    // Interaction setup
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // Initialize texture loader
    textureLoader = new THREE.TextureLoader();
    textureLoader.crossOrigin = "";

    // Main globe group
    globeGroup = new THREE.Group();
    scene.add(globeGroup);

    try {
        // Load Earth textures
        const [colorMap, bumpMap, specMap] = await Promise.all([
            loadTexture("./earthvis/00_earthmap1k.jpg"),
            loadTexture("./earthvis/01_earthbump1k.jpg"),
            loadTexture("./earthvis/02_earthspec1k.jpg")
        ]);

        // Earth material with depth writing enabled
        const earthMaterial = new THREE.MeshPhongMaterial({
            map: colorMap,
            bumpMap: bumpMap,
            bumpScale: 0.15,
            specularMap: specMap,
            specular: new THREE.Color(0x333333),
            shininess: 25,
            transparent: false,
            depthWrite: true,
            depthTest: true
        });

        // Create Earth mesh
        const earthGeometry = new THREE.SphereGeometry(1, 128, 128);
        const earth = new THREE.Mesh(earthGeometry, earthMaterial);
        globeGroup.add(earth);

        // Lighting setup
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 2.0);
        directionalLight.position.set(5, 3, 5);
        scene.add(directionalLight);

    } catch (error) {
        console.error("Earth material error:", error);
        const geo = new THREE.SphereGeometry(1, 32, 32);
        const mat = new THREE.MeshBasicMaterial({ 
            color: 0x2986cc,
            wireframe: false,
            transparent: false
        });
        globeGroup.add(new THREE.Mesh(geo, mat));
    }

    // Click detection sphere
    const clickGeo = new THREE.SphereGeometry(1.02, 32, 32);
    const clickMat = new THREE.MeshBasicMaterial({ visible: false });
    clickGlobe = new THREE.Mesh(clickGeo, clickMat);
    globeGroup.add(clickGlobe);

    // Red marker material with depth testing
    const redTexture = await loadTexture("./earthvis/red.png");
    redSpriteMat = new THREE.SpriteMaterial({
        map: redTexture,
        transparent: true,
        depthWrite: false,
        depthTest: true  // Changed to true
    });

    // Satellites setup with depth testing
    const satTexture = await loadTexture("./earthvis/pngimg.com - satellite_PNG28.png");
    const satMaterial = new THREE.SpriteMaterial({
        map: satTexture,
        transparent: true,
        depthTest: true  // Added depth test
    });
    
    satGroup = new THREE.Group();
    scene.add(satGroup);

    // Satellite positions
    const satCount = 198;
    const orbitRadius = 1.3;
    for(let i = 0; i < satCount; i++) {
        const sat = new THREE.Sprite(satMaterial);
        sat.scale.set(0.05, 0.05, 1);
        
        const phi = Math.acos(1 - 2 * (i + 0.5) / satCount);
        const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);
        
        sat.position.set(
            orbitRadius * Math.sin(phi) * Math.cos(theta),
            orbitRadius * Math.sin(phi) * Math.sin(theta),
            orbitRadius * Math.cos(phi)
        );
        satGroup.add(sat);
    }

    // Stars background
    const starTexture = await loadTexture("./earthvis/circle.png");
    const stars = getStarfield({ numStars: 4500, sprite: starTexture });
    scene.add(stars);

    // Event listeners
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('resize', onWindowResize);
}

function loadTexture(path) {
    return new Promise((resolve, reject) => {
        textureLoader.load(path, resolve, undefined, reject);
    });
}

function onPointerDown(event) {
    const canvas = renderer.domElement;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    mouse.x = (x / canvas.clientWidth) * 2 - 1;
    mouse.y = -(y / canvas.clientHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(clickGlobe);

    if(intersects.length > 0) {
        const hitPoint = intersects[0].point;
        const marker = new THREE.Sprite(redSpriteMat);
        
        // Increased offset to prevent z-fighting
        const localPos = globeGroup.worldToLocal(hitPoint.clone());
        marker.position.copy(localPos.multiplyScalar(0.989)); // Changed from 1.001
        marker.scale.set(0.03, 0.03, 0.05);
        
        globeGroup.add(marker);
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    
    globeGroup.rotation.y += 0.0005;
    satGroup.rotation.y += 0.005;
    
    orbitCtrl.update();
    renderer.render(scene, camera);
}
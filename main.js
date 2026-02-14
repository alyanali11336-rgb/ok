import * as THREE from 'three';

// --- GAME STATE & CONSTANTS ---
let scene, camera, renderer, clock;
let player = { height: 1.6, speed: 0.15, jumpStrength: 0.1, velocity: 0, isJumping: false };
let bullets = [], enemies = [], trees = [];
const mouse = new THREE.Vector2();
let isGameStarted = false;

// --- INITIALIZATION ---
function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020505);
    scene.fog = new THREE.FogExp2(0x020505, 0.08); // Thick forest atmosphere

    clock = new THREE.Clock();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    // Renderer Setup
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true; // AAA Shadow quality
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);

    // AAA Lighting
    const sun = new THREE.DirectionalLight(0x00ffcc, 0.8);
    sun.position.set(10, 20, 10);
    sun.castShadow = true;
    scene.add(sun);
    scene.add(new THREE.AmbientLight(0x404040, 0.5));

    // Create World
    createForestFloor();
    spawnForest(100);
    spawnHouse(0, 0, -15); // Tactical house in the distance

    // Input Listeners
    window.addEventListener('click', handleInput);
    window.addEventListener('keydown', handleKeyDown);
    
    animate();
}

// --- WORLD BUILDING ---
function createForestFloor() {
    const floorGeo = new THREE.PlaneGeometry(200, 200);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x0a110a, roughness: 0.9 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
}

function spawnForest(count) {
    for(let i = 0; i < count; i++) {
        const x = Math.random() * 100 - 50;
        const z = Math.random() * 100 - 80;
        if (Math.abs(x) < 5 && Math.abs(z) < 5) continue; // Clear spawn area
        
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.4, 6), new THREE.MeshStandardMaterial({color: 0x1a0d00}));
        trunk.position.set(x, 3, z);
        trunk.castShadow = true;
        scene.add(trunk);
        trees.push(trunk);
    }
}

function spawnHouse(x, y, z) {
    const house = new THREE.Group();
    const walls = new THREE.Mesh(new THREE.BoxGeometry(6, 4, 6), new THREE.MeshStandardMaterial({color: 0x333333}));
    const roof = new THREE.Mesh(new THREE.ConeGeometry(5, 3, 4), new THREE.MeshStandardMaterial({color: 0x111111}));
    walls.position.y = 2;
    roof.position.y = 5.5;
    roof.rotation.y = Math.PI / 4;
    house.add(walls, roof);
    house.position.set(x, y, z);
    scene.add(house);
}

// --- COMBAT MECHANICS ---
function handleInput() {
    if(!isGameStarted) {
        document.getElementById('ui-layer').style.display = 'none';
        renderer.domElement.requestPointerLock();
        isGameStarted = true;
        return;
    }
    shoot();
}

function shoot() {
    const bullet = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0x00ffcc })
    );
    bullet.position.copy(camera.position);
    
    // Direction vector
    const vector = new THREE.Vector3(0, 0, -1);
    vector.applyQuaternion(camera.quaternion);
    
    bullets.push({ mesh: bullet, velocity: vector.multiplyScalar(1.2) });
    scene.add(bullet);

    // Simple Camera Recoil
    camera.rotation.x += 0.02;
}

// --- PLAYER MOVEMENT & PHYSICS ---
const keys = {};
function handleKeyDown(e) { keys[e.code] = true; }
window.addEventListener('keyup', (e) => keys[e.code] = false);

function updateMovement() {
    if(!isGameStarted) return;

    // Movement Logic
    const dir = new THREE.Vector3();
    if(keys['KeyW']) dir.z -= player.speed;
    if(keys['KeyS']) dir.z += player.speed;
    if(keys['KeyA']) dir.x -= player.speed;
    if(keys['KeyD']) dir.x += player.speed;

    dir.applyQuaternion(camera.quaternion);
    dir.y = 0; // Keep on ground
    camera.position.add(dir);

    // Jump Logic
    if(keys['Space'] && !player.isJumping) {
        player.velocity = player.jumpStrength;
        player.isJumping = true;
    }

    if(player.isJumping) {
        camera.position.y += player.velocity;
        player.velocity -= 0.005; // Gravity
        if(camera.position.y <= player.height) {
            camera.position.y = player.height;
            player.isJumping = false;
        }
    }
}

// --- ANIMATION LOOP ---
function animate() {
    requestAnimationFrame(animate);
    
    updateMovement();

    // Bullet Physics
    bullets.forEach((b, index) => {
        b.mesh.position.add(b.velocity);
        // Despawn bullets
        if(b.mesh.position.length() > 100) {
            scene.remove(b.mesh);
            bullets.splice(index, 1);
        }
    });

    // AAA Mouse Look (simplified for this script)
    document.addEventListener('mousemove', (e) => {
        if (document.pointerLockElement === renderer.domElement) {
            camera.rotation.y -= e.movementX * 0.002;
            camera.rotation.x -= e.movementY * 0.002;
            camera.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, camera.rotation.x));
        }
    });

    renderer.render(scene, camera);
}

init();

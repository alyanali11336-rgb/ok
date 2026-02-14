import * as THREE from 'three';

// --- CONFIGURATION ---
const CONFIG = {
    PLAYER_SPEED: 0.12,
    JUMP_FORCE: 0.15,
    GRAVITY: 0.006,
    MOUSE_SENSITIVITY: 0.002,
    ENEMY_COUNT: 10,
    BULLET_SPEED: 2.0
};

// --- CORE VARIABLES ---
let scene, camera, renderer, clock;
let player = { 
    velocity: new THREE.Vector3(), 
    onGround: true, 
    height: 1.7,
    weapon: null,
    isShooting: false
};
let enemies = [];
let bullets = [];
let trees = [];
let canPlay = false;

// --- INITIALIZE ENGINE ---
function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x010505);
    scene.fog = new THREE.FogExp2(0x010505, 0.1); // Deep forest fog

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.rotation.order = 'YXZ'; // Critical for FPS controls

    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);

    clock = new THREE.Clock();

    setupLights();
    createEnvironment();
    createPlayerWeapon();
    spawnEnemies();
    createCrosshair();

    window.addEventListener('resize', onWindowResize);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mousedown', () => { if(canPlay) shoot(); });
    document.addEventListener('keydown', (e) => { if(e.code === 'Enter') lockPointer(); });

    animate();
}

// --- AAA LIGHTING ---
function setupLights() {
    const ambient = new THREE.AmbientLight(0x404040, 0.3);
    scene.add(ambient);

    const moon = new THREE.DirectionalLight(0x5588ff, 1.2);
    moon.position.set(50, 100, 50);
    moon.castShadow = true;
    moon.shadow.camera.left = -50;
    moon.shadow.camera.right = 50;
    moon.shadow.camera.top = 50;
    moon.shadow.camera.bottom = -50;
    scene.add(moon);
}

// --- WORLD DESIGN ---
function createEnvironment() {
    // Floor
    const floorGeo = new THREE.PlaneGeometry(200, 200);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x0a110a, roughness: 0.9 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Forest Generation
    for (let i = 0; i < 80; i++) {
        const x = Math.random() * 140 - 70;
        const z = Math.random() * 140 - 70;
        if (Math.sqrt(x*x + z*z) < 10) continue; // Keep spawn clear

        const tree = new THREE.Group();
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.4, 8), new THREE.MeshStandardMaterial({color: 0x1a0d00}));
        const leaves = new THREE.Mesh(new THREE.ConeGeometry(2, 6, 8), new THREE.MeshStandardMaterial({color: 0x0a220a}));
        leaves.position.y = 5;
        tree.add(trunk, leaves);
        tree.position.set(x, 4, z);
        scene.add(tree);
        trees.push(tree);
    }
}

// --- WEAPON SYSTEM ---
function createPlayerWeapon() {
    const gunGroup = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.15, 0.5), new THREE.MeshStandardMaterial({color: 0x111111}));
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.4), new THREE.MeshStandardMaterial({color: 0x000000}));
    barrel.rotation.x = Math.PI / 2;
    barrel.position.z = -0.3;
    gunGroup.add(body, barrel);
    
    player.weapon = gunGroup;
    camera.add(gunGroup);
    scene.add(camera); // Camera is in scene, gun is attached to camera
    
    // Position gun in bottom right
    gunGroup.position.set(0.3, -0.2, -0.5);
}

function shoot() {
    // Muzzle Flash
    const flash = new THREE.PointLight(0x00ffcc, 5, 2);
    flash.position.set(0.3, -0.2, -0.8);
    camera.add(flash);
    setTimeout(() => camera.remove(flash), 50);

    // Bullet Entity
    const bGeo = new THREE.SphereGeometry(0.04, 8, 8);
    const bMat = new THREE.MeshBasicMaterial({ color: 0x00ffcc });
    const bullet = new THREE.Mesh(bGeo, bMat);
    
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    
    bullet.position.copy(camera.position);
    bullets.push({ mesh: bullet, dir: direction });
    scene.add(bullet);

    // Recoil
    player.weapon.position.z += 0.05;
}

// --- AI SYSTEM ---
function spawnEnemies() {
    for(let i=0; i<CONFIG.ENEMY_COUNT; i++) {
        const enemy = new THREE.Mesh(
            new THREE.CapsuleGeometry(0.4, 1, 4, 8),
            new THREE.MeshStandardMaterial({ color: 0xff0033, emissive: 0x330000 })
        );
        enemy.position.set(Math.random()*60-30, 1, Math.random()*60-30);
        scene.add(enemy);
        enemies.push({ mesh: enemy, health: 100 });
    }
}

// --- GAME LOOP & LOGIC ---
const keys = {};
window.onkeydown = (e) => keys[e.code] = true;
window.onkeyup = (e) => keys[e.code] = false;

function lockPointer() {
    document.body.requestPointerLock();
    canPlay = true;
    document.getElementById('ui-layer').style.display = 'none';
}

function onMouseMove(e) {
    if (document.pointerLockElement) {
        camera.rotation.y -= e.movementX * CONFIG.MOUSE_SENSITIVITY;
        camera.rotation.x -= e.movementY * CONFIG.MOUSE_SENSITIVITY;
        camera.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, camera.rotation.x));
    }
}

function update() {
    if (!canPlay) return;

    const delta = clock.getDelta();
    
    // Movement with Momentum
    let inputX = (keys['KeyD'] ? 1 : 0) - (keys['KeyA'] ? 1 : 0);
    let inputZ = (keys['KeyS'] ? 1 : 0) - (keys['KeyW'] ? 1 : 0);
    
    let moveDir = new THREE.Vector3(inputX, 0, inputZ).normalize();
    moveDir.applyQuaternion(camera.quaternion);
    moveDir.y = 0;
    
    player.velocity.x += moveDir.x * CONFIG.PLAYER_SPEED;
    player.velocity.z += moveDir.z * CONFIG.PLAYER_SPEED;
    
    // Friction
    player.velocity.x *= 0.85;
    player.velocity.z *= 0.85;

    camera.position.add(player.velocity);

    // Jump/Gravity
    if(keys['Space'] && player.onGround) {
        player.velocity.y = CONFIG.JUMP_FORCE;
        player.onGround = false;
    }
    
    if(!player.onGround) {
        player.velocity.y -= CONFIG.GRAVITY;
        camera.position.y += player.velocity.y;
        if(camera.position.y <= player.height) {
            camera.position.y = player.height;
            player.onGround = true;
        }
    }

    // Weapon Sway/Idle
    player.weapon.position.z += ((-0.5) - player.weapon.position.z) * 0.1;
    player.weapon.position.y = -0.2 + Math.sin(Date.now() * 0.005) * 0.005;

    // Bullet Logic & Collision
    bullets.forEach((b, i) => {
        b.mesh.position.add(b.dir.clone().multiplyScalar(CONFIG.BULLET_SPEED));
        
        // Enemy Hit Detection
        enemies.forEach((en, ei) => {
            if(b.mesh.position.distanceTo(en.mesh.position) < 1) {
                scene.remove(en.mesh);
                enemies.splice(ei, 1);
                scene.remove(b.mesh);
                bullets.splice(i, 1);
            }
        });
    });
}

function animate() {
    requestAnimationFrame(animate);
    update();
    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function createCrosshair() {
    const dot = document.createElement('div');
    dot.style.position = 'absolute';
    dot.style.top = '50%';
    dot.style.left = '50%';
    dot.style.width = '6px';
    dot.style.height = '6px';
    dot.style.background = '#00ffcc';
    dot.style.borderRadius = '50%';
    dot.style.transform = 'translate(-50%, -50%)';
    dot.style.boxShadow = '0 0 10px #00ffcc';
    document.body.appendChild(dot);
}

init();
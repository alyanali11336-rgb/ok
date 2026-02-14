import * as THREE from 'three';

let scene, camera, renderer, clock;
let player = { velocity: new THREE.Vector3(), onGround: true, height: 1.7 };
let bullets = [], enemies = [], trees = [];
let isPlaying = false;

function init() {
    scene = new THREE.Scene();
    // AAA Daylight Sky
    scene.background = new THREE.Color(0x87CEEB); 
    scene.fog = new THREE.Fog(0x87CEEB, 1, 100);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.y = player.height;
    camera.rotation.order = 'YXZ';

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);

    clock = new THREE.Clock();

    // --- DAYLIGHT LIGHTING ---
    const sun = new THREE.DirectionalLight(0xffffff, 1.5);
    sun.position.set(50, 100, 50);
    sun.castShadow = true;
    scene.add(sun);
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));

    createWorld();
    spawnEnemies();

    // --- UI EVENT ---
    document.getElementById('play-button').onclick = () => {
        document.body.requestPointerLock();
    };

    document.addEventListener('pointerlockchange', () => {
        if (document.pointerLockElement) {
            isPlaying = true;
            document.getElementById('ui-layer').style.opacity = '0';
            setTimeout(() => document.getElementById('ui-layer').style.display = 'none', 500);
            document.getElementById('crosshair').style.display = 'block';
        } else {
            isPlaying = false;
            document.getElementById('ui-layer').style.display = 'flex';
            document.getElementById('ui-layer').style.opacity = '1';
            document.getElementById('crosshair').style.display = 'none';
        }
    });

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mousedown', () => { if(isPlaying) shoot(); });

    animate();
}

function createWorld() {
    // Green Forest Grass
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(200, 200),
        new THREE.MeshStandardMaterial({ color: 0x2d5a27 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Pine Trees
    for (let i = 0; i < 60; i++) {
        const tree = new THREE.Group();
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 4), new THREE.MeshStandardMaterial({color: 0x4b3621}));
        const leaves = new THREE.Mesh(new THREE.ConeGeometry(1.5, 5, 8), new THREE.MeshStandardMaterial({color: 0x1b3022}));
        leaves.position.y = 3;
        tree.add(trunk, leaves);
        tree.position.set(Math.random()*100-50, 2, Math.random()*100-50);
        scene.add(tree);
    }
}

function spawnEnemies() {
    for(let i=0; i<8; i++) {
        const enemy = new THREE.Mesh(
            new THREE.BoxGeometry(1, 2, 1),
            new THREE.MeshStandardMaterial({ color: 0xff4400 })
        );
        enemy.position.set(Math.random()*40-20, 1, Math.random()*40-20);
        scene.add(enemy);
        enemies.push(enemy);
    }
}

function shoot() {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.1), new THREE.MeshBasicMaterial({color: 0xffff00}));
    b.position.copy(camera.position);
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    bullets.push({ mesh: b, dir: dir });
    scene.add(b);
}

const keys = {};
window.onkeydown = (e) => keys[e.code] = true;
window.onkeyup = (e) => keys[e.code] = false;

function onMouseMove(e) {
    if (isPlaying) {
        camera.rotation.y -= e.movementX * 0.002;
        camera.rotation.x -= e.movementY * 0.002;
        camera.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, camera.rotation.x));
    }
}

function animate() {
    requestAnimationFrame(animate);
    if (isPlaying) {
        // Simple Movement
        if(keys['KeyW']) camera.translateZ(-0.1);
        if(keys['KeyS']) camera.translateZ(0.1);
        if(keys['KeyA']) camera.translateX(-0.1);
        if(keys['KeyD']) camera.translateX(0.1);
        camera.position.y = player.height; // Lock to ground

        bullets.forEach((b, i) => {
            b.mesh.position.add(b.dir.clone().multiplyScalar(1.5));
            enemies.forEach((en, ei) => {
                if(b.mesh.position.distanceTo(en.position) < 1.5) {
                    scene.remove(en);
                    enemies.splice(ei, 1);
                }
            });
        });
    }
    renderer.render(scene, camera);
}

init();

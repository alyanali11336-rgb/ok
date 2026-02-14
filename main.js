let scene, camera, renderer, clock;
let player = { height: 1.8 };
let isPlaying = false;
let bullets = [], enemies = [];
const keys = {};

function init() {
    // 1. Scene & Camera
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 1, 100);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.rotation.order = 'YXZ';

    // 2. Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);

    // 3. Lighting (Bright Daylight)
    const sun = new THREE.DirectionalLight(0xffffff, 1.2);
    sun.position.set(10, 20, 10);
    sun.castShadow = true;
    scene.add(sun);
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));

    // 4. World Geometry
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(200, 200),
        new THREE.MeshStandardMaterial({ color: 0x348C31 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Forest
    for (let i = 0; i < 50; i++) {
        const tree = new THREE.Group();
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 4), new THREE.MeshStandardMaterial({color: 0x4b3621}));
        const leaves = new THREE.Mesh(new THREE.ConeGeometry(1.5, 4, 8), new THREE.MeshStandardMaterial({color: 0x1b3022}));
        leaves.position.y = 3;
        tree.add(trunk, leaves);
        tree.position.set(Math.random()*80-40, 2, Math.random()*80-40);
        scene.add(tree);
    }

    // 5. Deploy Button Logic
    const playBtn = document.getElementById('play-button');
    playBtn.addEventListener('click', () => {
        // This is the AAA way to start: Request Pointer Lock
        document.body.requestPointerLock();
    });

    // 6. Listen for Lock State Change
    document.addEventListener('pointerlockchange', () => {
        if (document.pointerLockElement) {
            isPlaying = true;
            document.getElementById('ui-layer').style.display = 'none';
            document.getElementById('crosshair').style.display = 'block';
        } else {
            isPlaying = false;
            document.getElementById('ui-layer').style.display = 'flex';
            document.getElementById('crosshair').style.display = 'none';
        }
    });

    // Controls
    window.addEventListener('keydown', (e) => keys[e.code] = true);
    window.addEventListener('keyup', (e) => keys[e.code] = false);
    window.addEventListener('mousemove', (e) => {
        if (isPlaying) {
            camera.rotation.y -= e.movementX * 0.002;
            camera.rotation.x -= e.movementY * 0.002;
            camera.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, camera.rotation.x));
        }
    });
    window.addEventListener('mousedown', () => { if(isPlaying) shoot(); });

    animate();
}

function shoot() {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.1), new THREE.MeshBasicMaterial({color: 0xffff00}));
    b.position.copy(camera.position);
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    bullets.push({ mesh: b, dir: dir });
    scene.add(b);
}

function animate() {
    requestAnimationFrame(animate);
    
    if (isPlaying) {
        if(keys['KeyW']) camera.translateZ(-0.15);
        if(keys['KeyS']) camera.translateZ(0.15);
        if(keys['KeyA']) camera.translateX(-0.15);
        if(keys['KeyD']) camera.translateX(0.15);
        camera.position.y = player.height;

        bullets.forEach((b, i) => {
            b.mesh.position.add(b.dir.clone().multiplyScalar(1.2));
        });
    }
    
    renderer.render(scene, camera);
}

// Start everything
init();

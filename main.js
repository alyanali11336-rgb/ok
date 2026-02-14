import * as THREE from 'three';

let scene, camera, renderer, trees = [];

function init() {
    scene = new THREE.Scene();
    // AAA Fog for depth
    scene.fog = new THREE.FogExp2(0x050808, 0.05);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.5, 5);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    // AAA Lighting Model
    renderer.toneMapping = THREE.ReinhardToneMapping;
    document.body.appendChild(renderer.domElement);

    // Dynamic Lighting
    const ambient = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambient);

    const moonlight = new THREE.DirectionalLight(0x00ffcc, 1);
    moonlight.position.set(5, 10, 5);
    scene.add(moonlight);

    // Create a Ground (Forest Floor)
    const floorGeo = new THREE.PlaneGeometry(100, 100);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x050a05, roughness: 0.8 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Procedural Forest Generation
    for(let i = 0; i < 60; i++) {
        createTree(
            Math.random() * 40 - 20, 
            Math.random() * -30 - 5
        );
    }

    animate();
}

function createTree(x, z) {
    const trunkGeo = new THREE.CylinderGeometry(0.2, 0.3, 4);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x1a0f00 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    
    const leavesGeo = new THREE.ConeGeometry(1.5, 4, 6);
    const leavesMat = new THREE.MeshStandardMaterial({ color: 0x0a220a });
    const leaves = new THREE.Mesh(leavesGeo, leavesMat);
    
    leaves.position.y = 3;
    trunk.add(leaves);
    trunk.position.set(x, 2, z);
    
    scene.add(trunk);
    trees.push(trunk);
}

function animate() {
    requestAnimationFrame(animate);

    // Subtle Camera Sway (Cinematic)
    const time = Date.now() * 0.001;
    camera.position.x = Math.sin(time * 0.5) * 0.2;
    camera.position.y = 1.5 + Math.cos(time * 0.5) * 0.1;

    // Wind effect on trees
    trees.forEach((t, i) => {
        t.rotation.z = Math.sin(time + i) * 0.02;
    });

    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

init();

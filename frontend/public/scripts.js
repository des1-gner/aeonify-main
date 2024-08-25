 import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene, camera, renderer, particles;
const particlesData = [];
const particleCount = 50000;
const text = 'aeonify.net';
const speedFactor = 0.1;
let dispersing = false;
let reemerging = false;
let dispersalTime = 3000;
let reemergeTime = 6000;
let fadeDuration = 2000;
let fadeStartTime;

let originalPositions = [];
let dispersedPositions = [];

init();
animate();

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / 300, 0.1, 1000);
    camera.position.z = 150;

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, 300);
    document.getElementById('header').appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 4192;
    canvas.height = 2028;
    ctx.font = 'Bold 768px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 100);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < particleCount; i++) {
        let x, y;
        do {
            x = Math.random() * canvas.width;
            y = Math.random() * canvas.height;
        } while (!data[(Math.floor(y) * canvas.width + Math.floor(x)) * 4 + 3]);

        const initialX = (x - canvas.width / 2) * 0.15;
        const initialY = (canvas.height / 2 - y) * 0.15;
        positions[i * 3] = initialX;
        positions[i * 3 + 1] = initialY;
        positions[i * 3 + 2] = 0;

        originalPositions.push({ x: initialX, y: initialY, z: 0 });

        dispersedPositions.push({
            x: initialX + (Math.random() - 0.5) * 100,
            y: initialY + (Math.random() - 0.5) * 100,
            z: (Math.random() - 0.5) * 100
        });

        const t = i / particleCount;
        if (t < 0.5) {
            colors[i * 3] = 0.5 + t;
            colors[i * 3 + 1] = 0;
            colors[i * 3 + 2] = 1 - t;
        } else {
            colors[i * 3] = 1 - (t - 0.5) * 2;
            colors[i * 3 + 1] = 0;
            colors[i * 3 + 2] = 0.5 + (t - 0.5) * 2;
        }

        particlesData.push({
            velocity: new THREE.Vector3(
                (-1 + Math.random() * 2) * speedFactor,
                (-1 + Math.random() * 2) * speedFactor,
                (-1 + Math.random() * 2) * speedFactor
            ),
            numConnections: 0
        });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 0.5,
        vertexColors: true,
        transparent: true,
        opacity: 0.8
    });

    particles = new THREE.Points(geometry, material);
    scene.add(particles);

    setTimeout(() => {
        dispersing = true;
        fadeStartTime = Date.now();
    }, dispersalTime);

    setTimeout(() => {
        dispersing = false;
        reemerging = true;
        fadeStartTime = Date.now();
    }, reemergeTime);

    window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / 300;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, 300);
}

function animate() {
    requestAnimationFrame(animate);

    const positions = particles.geometry.attributes.position.array;
    const currentTime = Date.now();

    for (let i = 0; i < particleCount; i++) {
        const particleData = particlesData[i];

        if (dispersing && !reemerging) {
            const progress = Math.min((currentTime - fadeStartTime) / fadeDuration, 1);
            positions[i * 3] = THREE.MathUtils.lerp(originalPositions[i].x, dispersedPositions[i].x, progress);
            positions[i * 3 + 1] = THREE.MathUtils.lerp(originalPositions[i].y, dispersedPositions[i].y, progress);
            positions[i * 3 + 2] = THREE.MathUtils.lerp(originalPositions[i].z, dispersedPositions[i].z, progress);
        }

        if (reemerging) {
            const progress = Math.min((currentTime - fadeStartTime) / fadeDuration, 1);
            positions[i * 3] = THREE.MathUtils.lerp(dispersedPositions[i].x, originalPositions[i].x, progress);
            positions[i * 3 + 1] = THREE.MathUtils.lerp(dispersedPositions[i].y, originalPositions[i].y, progress);
            positions[i * 3 + 2] = THREE.MathUtils.lerp(dispersedPositions[i].z, originalPositions[i].z, progress);

            if (progress === 1) {
                reemerging = false;
            }
        }

        if (!dispersing && !reemerging) {
            positions[i * 3] += particleData.velocity.x;
            positions[i * 3 + 1] += particleData.velocity.y;
            positions[i * 3 + 2] += particleData.velocity.z;

            if (positions[i * 3 + 1] < -30 || positions[i * 3 + 1] > 30) {
                particleData.velocity.y = -particleData.velocity.y;
            }
            if (positions[i * 3] < -50 || positions[i * 3] > 50) {
                particleData.velocity.x = -particleData.velocity.x;
            }
            if (positions[i * 3 + 2] < -30 || positions[i * 3 + 2] > 30) {
                particleData.velocity.z = -particleData.velocity.z;
            }
        }
    }

    particles.geometry.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
}

// Menu toggle function
function toggleMenu() {
    const menu = document.getElementById('menu');
    menu.classList.toggle('hidden');
}


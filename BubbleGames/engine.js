import * as THREE from 'three';
import { TransformControls } from 'three/addons/controls/TransformControls.js';

// --- CONFIG & SETUP ---
const SUPABASE_URL = 'https://sideqpofgknyfagrjnke.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ULjlm97u7-dg8ekTPU84aA_rA1CtUnH';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = "Guest_" + Math.floor(Math.random() * 999);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a0c);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 1.2));
const grid = new THREE.GridHelper(100, 100, 0x00d4ff, 0x222222);
scene.add(grid);

// --- ASSET GENERATION ---
const createGridTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#111111'; ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = '#00d4ff'; ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, 256, 256);
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
};
const gridTexture = createGridTexture();

const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshBasicMaterial({ visible: false }));
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

const objects = [floor]; 
const blockGeo = new THREE.BoxGeometry(1, 1, 1);
const spawnGeo = new THREE.BoxGeometry(0.8, 0.2, 0.8);
const spawnMat = new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 2 });

// --- SYSTEMS ---
const raycaster = new THREE.Raycaster();
const downRay = new THREE.Raycaster();
const sideRay = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const gizmo = new TransformControls(camera, renderer.domElement);
scene.add(gizmo);

let isPlayMode = false;
let moveSpeed = 0.12;
let worldGravity = 0.015;
let velocityY = 0;
let isGrounded = false;
let spawnPoint = null;
const playerHeight = 1.4;
const playerRadius = 0.45;

// --- THE .BUB LOADER ---
async function loadMainBub() {
    try {
        const response = await fetch('main.bub');
        if (!response.ok) throw new Error("No main.bub found");
        
        const bubData = await response.json();
        console.log("🚀 Project_Bubbler_Plus: Loading main.bub...");
        
        // Clear old blocks before loading local
        for(let i = objects.length - 1; i >= 0; i--) {
            if(objects[i] !== floor) {
                scene.remove(objects[i]);
                objects.splice(i, 1);
            }
        }

        bubData.blocks.forEach(d => {
            const isSpawn = d.type === 'spawn';
            const mat = isSpawn ? spawnMat : new THREE.MeshStandardMaterial({ 
                color: 0xcccccc, 
                map: document.getElementById('grid-toggle')?.checked ? gridTexture : null 
            });
            const mesh = new THREE.Mesh(isSpawn ? spawnGeo : blockGeo, mat);
            mesh.position.set(d.x, d.y, d.z); 
            if (d.s) mesh.scale.set(d.s, d.s, d.s);
            scene.add(mesh);
            objects.push(mesh);
            if (isSpawn) spawnPoint = mesh;
        });
        return true;
    } catch (err) {
        console.warn("Using Supabase fallback:", err.message);
        return false;
    }
}

// --- INITIALIZATION ---
async function init() {
    const id = localStorage.getItem('currentGameId');
    const isEditMode = localStorage.getItem('editMode') === 'true';

    if (isEditMode) {
        isPlayMode = false;
        ['publishBtn', 'dragModeBtn', 'deleteModeBtn', 'item-selector', 'settings-panel'].forEach(el => {
            const node = document.getElementById(el);
            if(node) node.style.display = 'flex';
        });
    } else {
        isPlayMode = true;
        const cx = document.getElementById('crosshair');
        if(cx) cx.style.display = 'block';
    }

    // Attempt to load the .bub file first
    const bubLoaded = await loadMainBub();

    // Only fetch Supabase if .bub didn't load a spawn point
    if (!bubLoaded && id) {
        const { data: game } = await supabaseClient.from('games').select('*').eq('id', id).single();
        if (game && game.blocks) {
            game.blocks.forEach(d => {
                const isSpawn = d.type === 'spawn';
                const mat = isSpawn ? spawnMat : new THREE.MeshStandardMaterial({ color: 0xcccccc });
                const mesh = new THREE.Mesh(isSpawn ? spawnGeo : blockGeo, mat);
                mesh.position.set(d.x, d.y, d.z);
                if (d.s) mesh.scale.set(d.s, d.s, d.s);
                scene.add(mesh);
                objects.push(mesh);
                if (isSpawn) spawnPoint = mesh;
            });
        }
    }

    if(spawnPoint) camera.position.set(spawnPoint.position.x, spawnPoint.position.y + playerHeight, spawnPoint.position.z);
    else camera.position.set(0, playerHeight, 5);
    
    const loader = document.getElementById('loading-overlay');
    if(loader) setTimeout(() => loader.style.display = 'none', 500);
}

// --- GAME LOOP ---
function animate() {
    requestAnimationFrame(animate);
    
    if (isPlayMode) {
        // Simple Gravity
        downRay.set(camera.position, new THREE.Vector3(0, -1, 0));
        const groundHits = downRay.intersectObjects(objects);
        if (groundHits.length > 0 && groundHits[0].distance <= playerHeight) {
            if (velocityY < 0) { velocityY = 0; isGrounded = true; camera.position.y = groundHits[0].point.y + playerHeight; }
        } else {
            isGrounded = false;
            velocityY -= worldGravity;
        }
        camera.position.y += velocityY;
    }

    renderer.render(scene, camera);
}

init();
animate();

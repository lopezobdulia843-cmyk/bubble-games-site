async function loadMainBub() {
    // Instead of fetching a file, we put the data right here
    const bubData = {
        "blocks": [
            { "x": 0, "y": 0.1, "z": 0, "type": "spawn", "s": 1 },
            { "x": 0, "y": 0.5, "z": -5, "type": "block", "s": 1 },
            { "x": 2, "y": 0.5, "z": -5, "type": "block", "s": 1 },
            { "x": -2, "y": 0.5, "z": -5, "type": "block", "s": 1 },
            { "x": 0, "y": 1.5, "z": -8, "type": "block", "s": 2 }
        ]
    };

    console.log("🚀 Project_Bubbler_Plus: Loading Internal Data...");
    
    bubData.blocks.forEach(d => {
        const isSpawn = d.type === 'spawn';
        const mat = isSpawn ? spawnMat : new THREE.MeshStandardMaterial({ color: 0xcccccc });
        const mesh = new THREE.Mesh(isSpawn ? spawnGeo : blockGeo, mat);
        mesh.position.set(d.x, d.y, d.z); 
        if (d.s) mesh.scale.set(d.s, d.s, d.s);
        scene.add(mesh);
        objects.push(mesh);
        if (isSpawn) spawnPoint = mesh;
    });
    return true;
}

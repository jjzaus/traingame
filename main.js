let scene, camera, renderer, train, track, carriages = [];
let trees = [];
const TRACK_LENGTH = 1000;
const TRAIN_SPEED = 0.125;
let trainPosition = 0;
let cameraAngleHorizontal = 0;
let cameraAngleVertical = 0;
let CAMERA_DISTANCE = 10; // Will be updated to 5 at end of intro
let isFirstPerson = false;
let isMouseDown = false;
let lastMouseX = 0;
let lastMouseY = 0;
let introAnimationComplete = false;
let introStartTime = 0;
let finalIntroPosition = new THREE.Vector3();
let finalIntroTarget = new THREE.Vector3();
const INTRO_DURATION = 10000; // 5 seconds for the intro animation

// Initialize the scene
function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Light blue sky
    
    // Add ground plane
    const groundGeometry = new THREE.PlaneGeometry(TRACK_LENGTH * 4, TRACK_LENGTH * 4); // Made ground bigger for mountains
    const groundMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x3f7f3f,  // Forest green
        side: THREE.DoubleSide 
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    scene.add(ground);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 10, 0);
    scene.add(directionalLight);

    // Create train
    createTrain();
    
    // Create track
    createTrack();
    
    // Create forest
    createForest();

    // Add mountains after creating forest
    createMountains();

    // Initialize animation timestamp
    introStartTime = Date.now();
    
    // Start with camera far out
    camera.position.set(100, 20, 100);
    camera.lookAt(train.position);

    // Initialize mouse controls
    initMouseControls();
    initCameraSwitch();
}

function createWheel() {
    const wheelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16);
    const wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 }); // Dark gray
    const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel.rotateX(Math.PI / 2); // Changed from rotateZ to rotateX for correct orientation
    return wheel;
}

function createTrain() {
    const trainGeometry = new THREE.BoxGeometry(5, 1, 1);
    const trainMaterial = new THREE.MeshPhongMaterial({ color: 0x3366ff });
    train = new THREE.Mesh(trainGeometry, trainMaterial);
    train.position.y = 0.8;

    // Add wheels to train
    const wheelPositions = [
        // Front wheels
        [1, -0.43, 0.4],
        [1, -0.43, -0.4],
        [1.7, -0.43, 0.4],
        [1.7, -0.43, -0.4],
        // Back wheels
        [-1, -0.43, 0.4],
        [-1, -0.43, -0.4],
        [-1.7, -0.43, 0.4],
        [-1.7, -0.43, -0.4]
    ];

    wheelPositions.forEach(pos => {
        const wheel = createWheel();
        wheel.position.set(...pos);
        train.add(wheel);
    });

    scene.add(train);

    // Add carriages
    const carriageGeometry = new THREE.BoxGeometry(5, 1, 1);
    const carriageMaterial = new THREE.MeshPhongMaterial({ color: 0x808080 });
    
    for (let i = 0; i < 6; i++) {
        const carriage = new THREE.Mesh(carriageGeometry, carriageMaterial);
        carriage.position.y = 0.8;
        carriage.position.x = train.position.x - (i + 1) * 5;

        // Add wheels to carriage using same positions
        wheelPositions.forEach(pos => {
            const wheel = createWheel();
            wheel.position.set(...pos);
            carriage.add(wheel);
        });

        carriages.push(carriage);
        scene.add(carriage);
    }
}

function createTrack() {
    const curve = generateTrackCurve();
    
    // Create two parallel tracks
    const railGeometry = new THREE.TubeGeometry(curve, 100, 0.1, 8, false); // Reduced radius to 0.1
    const railMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
    
    // Create first rail
    const rail1 = new THREE.Mesh(railGeometry, railMaterial);
    scene.add(rail1);
    
    // Create second rail by cloning and offsetting
    const rail2 = rail1.clone();
    
    // Offset the rails to run parallel
    rail1.position.z = 0.5;  // Move first rail to one side
    rail2.position.z = -0.5; // Move second rail to other side
    
    scene.add(rail2);
    
    // Store both rails in track object for reference
    track = new THREE.Group();
    track.add(rail1);
    track.add(rail2);
    
    // Add railroad ties
    const tieGeometry = new THREE.BoxGeometry(0.2, 0.05, 1.4);
    const tieMaterial = new THREE.MeshPhongMaterial({ color: 0x4d3319 }); // Brown color for wooden ties
    
    // Add ties along the track
    const numTies = 2000;
    for (let i = 0; i < numTies; i++) {
        const progress = i / numTies;
        const point = curve.getPointAt(progress);
        const tangent = curve.getTangentAt(progress);
        
        const tie = new THREE.Mesh(tieGeometry, tieMaterial);
        tie.position.copy(point);
        tie.position.y = 0.05; // Position slightly above ground
        
        // Orient tie perpendicular to track direction
        tie.lookAt(point.clone().add(tangent));
        tie.rotateY(Math.PI / 2);
        
        track.add(tie);
    }
    
    scene.add(track);
}

function createForest() {
    // Create first set of trees (height 5)
    for (let i = 0; i < 2000; i++) {
        const treeGeometry = new THREE.ConeGeometry(1, 5, 8);
        const treeMaterial = new THREE.MeshPhongMaterial({ color: 0x228B22 });
        const tree = new THREE.Mesh(treeGeometry, treeMaterial);
        
        // Random position on either side of the track
        const side = Math.random() > 0.5 ? 1 : -1;
        const x = (Math.random() - 0.5) * TRACK_LENGTH;
        
        // Get the z-position of the track at this x coordinate
        const trackProgress = (x + TRACK_LENGTH/2) / TRACK_LENGTH;
        const trackPoint = new THREE.CatmullRomCurve3(trackPoints).getPointAt(Math.max(0, Math.min(1, trackProgress)));
        
        // Place trees at a minimum distance from the track (between 5 and 15 units)
        const minDistance = 5;
        const randomExtra = Math.random() * 100;
        const z = trackPoint.z + (minDistance + randomExtra) * side;
        
        tree.position.set(x, 1.5, z);
        
        trees.push(tree);
        scene.add(tree);
    }

    // Create second set of taller trees (height 7)
    for (let i = 0; i < 2000; i++) {
        const treeGeometry = new THREE.ConeGeometry(1.2, 7, 8);
        const treeMaterial = new THREE.MeshPhongMaterial({ color: 0x228B22 }); // Slightly darker green
        const tree = new THREE.Mesh(treeGeometry, treeMaterial);
        
        // Random position on either side of the track
        const side = Math.random() > 0.5 ? 1 : -1;
        const x = (Math.random() - 0.5) * TRACK_LENGTH;
        
        // Get the z-position of the track at this x coordinate
        const trackProgress = (x + TRACK_LENGTH/2) / TRACK_LENGTH;
        const trackPoint = new THREE.CatmullRomCurve3(trackPoints).getPointAt(Math.max(0, Math.min(1, trackProgress)));
        
        // Place trees at a minimum distance from the track (between 5 and 15 units)
        const minDistance = 10;
        const randomExtra = Math.random() * 100;
        const z = trackPoint.z + (minDistance + randomExtra) * side;
        
        tree.position.set(x, 2, z); // Slightly higher base position
        
        trees.push(tree);
        scene.add(tree);
    }
}

function createMountains() {
    const NUM_MOUNTAINS = 30;
    const MOUNTAIN_DISTANCE = TRACK_LENGTH;
    
    for (let i = 0; i < NUM_MOUNTAINS; i++) {
        // Random mountain size
        const height = 50 + Math.random() * 100;
        const radius = height * 0.8 + Math.random() * 20;
        
        const mountainGeometry = new THREE.ConeGeometry(radius, height, 8);
        const mountainMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x4a5568,  // Slate gray
            flatShading: true 
        });
        
        const mountain = new THREE.Mesh(mountainGeometry, mountainMaterial);
        
        // Position mountains in a circle around the track
        const angle = (i / NUM_MOUNTAINS) * Math.PI * 2 + Math.random() * 0.5;
        const distance = MOUNTAIN_DISTANCE * (0.8 + Math.random() * 0.4);
        
        mountain.position.x = Math.cos(angle) * distance;
        mountain.position.z = Math.sin(angle) * distance;
        mountain.position.y = height / 2;
        
        // Slightly random rotation for variety
        mountain.rotation.y = Math.random() * Math.PI;
        
        scene.add(mountain);
    }
}

function initMouseControls() {
    const canvas = renderer.domElement;
    
    canvas.addEventListener('mousedown', (e) => {
        if (!introAnimationComplete) return; // Prevent camera control during intro
        isMouseDown = true;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
    });

    canvas.addEventListener('mousemove', (e) => {
        if (!isMouseDown || isFirstPerson) return;

        const deltaX = e.clientX - lastMouseX;
        const deltaY = e.clientY - lastMouseY;

        // Update camera angles
        cameraAngleHorizontal += deltaX * 0.005;
        
        // Limit vertical movement
        const verticalSensitivity = 0.002;
        const minVerticalAngle = 0;
        const maxVerticalAngle = 0.2;
        
        cameraAngleVertical = Math.max(minVerticalAngle, 
            Math.min(maxVerticalAngle, 
                cameraAngleVertical - deltaY * verticalSensitivity
            )
        );

        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
    });

    window.addEventListener('mouseup', () => {
        isMouseDown = false;
    });
}

function initCameraSwitch() {
    const button = document.getElementById('cameraSwitch');
    button.style.display = 'none'; // Hide button during intro
    
    const showButton = () => {
        if (introAnimationComplete) {
            button.style.display = 'block';
            document.removeEventListener('click', showButton);
        }
    };
    
    document.addEventListener('click', showButton);
    
    button.addEventListener('click', () => {
        if (!introAnimationComplete) return;
        isFirstPerson = !isFirstPerson;
        button.textContent = isFirstPerson ? 'Third Person' : 'First Person';
    });
}

function updateIntroAnimation() {
    const elapsed = Date.now() - introStartTime;
    const progress = Math.min(elapsed / INTRO_DURATION, 1);
    
    // Use powered sine easing for more dramatic acceleration
    const eased = Math.pow((1 - Math.cos(progress * Math.PI)) / 2, 1.5); // Added power of 1.5
    
    // Start from a wide angle view
    const startRadius = 20;
    const endRadius = 4.5;
    const radius = startRadius + (endRadius - startRadius) * eased;
    
    // Rotate around and zoom in
    const angle = Math.PI * 1.75 * eased;
    const heightProgress = Math.sin(progress * Math.PI/2);
    
    camera.position.set(
        train.position.x + Math.cos(angle) * radius,
        10 - (heightProgress * 9.1),
        train.position.z + Math.sin(angle) * radius
    );
    
    camera.lookAt(train.position);
    
    if (progress >= 1) {
        introAnimationComplete = true;
        // Store the final position and target
        finalIntroPosition.copy(camera.position);
        finalIntroTarget.copy(train.position);
        
        // Calculate the camera angles based on final position
        const offset = finalIntroPosition.clone().sub(finalIntroTarget);
        cameraAngleHorizontal = Math.atan2(offset.z, offset.x);
        cameraAngleVertical = Math.asin(offset.y / offset.length());
        
        // Adjust CAMERA_DISTANCE to match final intro radius
        CAMERA_DISTANCE = offset.length();
    }
}

function updateCamera() {
    if (!introAnimationComplete) {
        updateIntroAnimation();
        return;
    }

    if (isFirstPerson) {
        // First-person camera logic remains unchanged
        const frontOffset = new THREE.Vector3(2.5, 1.2, 0);
        camera.position.copy(train.position).add(frontOffset);
        
        const matrix = new THREE.Matrix4();
        train.updateMatrix();
        matrix.copy(train.matrix);
        
        const lookAtPoint = new THREE.Vector3(0, 5, 0);
        lookAtPoint.applyMatrix4(matrix);
        lookAtPoint.add(camera.position);
        
        camera.lookAt(lookAtPoint);
    } else {
        // Third-person camera using stored values
        const horizontalDistance = CAMERA_DISTANCE * Math.cos(cameraAngleVertical);
        const verticalDistance = CAMERA_DISTANCE * Math.sin(cameraAngleVertical);
        
        const cameraOffset = new THREE.Vector3(
            horizontalDistance * Math.cos(cameraAngleHorizontal),
            verticalDistance,
            horizontalDistance * Math.sin(cameraAngleHorizontal)
        );
        
        camera.position.copy(train.position).add(cameraOffset);
        camera.lookAt(train.position);
    }
}

function animate() {
    requestAnimationFrame(animate);
    
    // Move train forward
    trainPosition += TRAIN_SPEED;
    if (trainPosition > TRACK_LENGTH / 2) {
        trainPosition = -TRACK_LENGTH / 2;
    }
    
    // Calculate position and rotation along curve
    const progress = (trainPosition + TRACK_LENGTH/2) / TRACK_LENGTH;
    const curve = new THREE.CatmullRomCurve3(trackPoints);
    const point = curve.getPointAt(progress);
    const tangent = curve.getTangentAt(progress);
    
    // Update train position and rotation
    train.position.copy(point);
    train.position.y = 0.8;
    
    // Create a proper orientation matrix for the train
    const up = new THREE.Vector3(0, 1, 0);
    const forward = tangent.normalize();
    const right = new THREE.Vector3().crossVectors(up, forward).normalize();
    up.crossVectors(forward, right);
    
    const rotationMatrix = new THREE.Matrix4().makeBasis(right, up, forward);
    train.setRotationFromMatrix(rotationMatrix);
    train.rotateY(Math.PI / 2); // Rotate 90 degrees to align with track
    
    // Update carriages with the same orientation logic
    carriages.forEach((carriage, index) => {
        const carriageProgress = Math.max(0, progress - (0.0053 * (index + 1)));
        const carriagePoint = curve.getPointAt(carriageProgress);
        const carriageTangent = curve.getTangentAt(carriageProgress);
        
        carriage.position.copy(carriagePoint);
        carriage.position.y = 0.8;
        
        // Apply same orientation to carriages
        const carriageForward = carriageTangent.normalize();
        const carriageRight = new THREE.Vector3().crossVectors(up, carriageForward).normalize();
        up.crossVectors(carriageForward, carriageRight);
        
        const carriageRotationMatrix = new THREE.Matrix4().makeBasis(carriageRight, up, carriageForward);
        carriage.setRotationFromMatrix(carriageRotationMatrix);
        carriage.rotateY(Math.PI / 2);
    });
    
    // Replace the existing camera update code with this:
    updateCamera();
    
    renderer.render(scene, camera);
}

// Handle window resizing
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Add track curve generation
const trackPoints = [];
function generateTrackCurve() {
    trackPoints.push(new THREE.Vector3(-TRACK_LENGTH/2, 0, 0));
    
    // Generate curve control points
    const segments = 20;
    const segmentLength = TRACK_LENGTH / segments;
    
    for (let i = 1; i < segments; i++) {
        const x = -TRACK_LENGTH/2 + (i * segmentLength);
        const z = Math.sin(i * 0.2) * 10; // Creates gradual curves
        trackPoints.push(new THREE.Vector3(x, 0, z));
    }
    
    trackPoints.push(new THREE.Vector3(TRACK_LENGTH/2, 0, 0));
    return new THREE.CatmullRomCurve3(trackPoints);
}

// Initialize and start animation
init();
animate(); 
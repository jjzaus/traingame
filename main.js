let scene, camera, renderer, train, track, carriages = [];
let trees = [];
const TRACK_LENGTH = 1000;
const TRAIN_SPEED = 0.125;
let trainPosition = 0;
let cameraAngleHorizontal = 0;
let cameraAngleVertical = 0;
let CAMERA_DISTANCE = 5; // Will be updated to 5 at end of intro
let isFirstPerson = false;
let isMouseDown = false;
let lastMouseX = 0;
let lastMouseY = 0;
let introAnimationComplete = false;
let introStartTime = 0;
let finalIntroPosition = new THREE.Vector3();
let finalIntroTarget = new THREE.Vector3();
const INTRO_DURATION = 10000; // 5 seconds for the intro animation
let touchVelocityX = 0;
let touchVelocityY = 0;
let lastTouchX = 0;
let lastTouchY = 0;
let lastTouchTime = 0;
const MOMENTUM_DECAY = 0.95;

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
    // Create main train body
    const trainGroup = new THREE.Group();
    
    // Main body (medium grey #686868)
    const bodyGeometry = new THREE.BoxGeometry(5, 1, 1);
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x686868 });
    const trainBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
    trainGroup.add(trainBody);

    // Add headlight
    const headlightGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.12, 16);
    const headlightMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xFFFFCC
    });
    const headlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
    headlight.rotation.z = Math.PI / 2;
    headlight.position.set(2.45, 0, 0);
    trainGroup.add(headlight);

    // Add wheels using existing wheel positions
    const wheelPositions = [
        [1, -0.47, 0.4],
        [1, -0.47, -0.4],
        [1.7, -0.47, 0.4],
        [1.7, -0.47, -0.4],
        [-1, -0.47, 0.4],
        [-1, -0.47, -0.4],
        [-1.7, -0.47, 0.4],
        [-1.7, -0.47, -0.4]
    ];

    wheelPositions.forEach(pos => {
        const wheel = createWheel();
        wheel.position.set(...pos);
        trainGroup.add(wheel);
    });

    trainGroup.position.y = 0.8;
    train = trainGroup;
    scene.add(train);

    // Create carriages
    const carriageGeometry = new THREE.BoxGeometry(5, 1, 1);
    const carriageMaterial = new THREE.MeshPhongMaterial({ color: 0x1a472a }); // Dark green
    
    // Create white stripe geometry
    const stripeGeometry = new THREE.BoxGeometry(5, 0.1, 0.02);
    const stripeMaterial = new THREE.MeshPhongMaterial({ color: 0xFFFFFF });

    for (let i = 0; i < 6; i++) {
        const carriageGroup = new THREE.Group();
        
        // Main carriage body
        const carriageBody = new THREE.Mesh(carriageGeometry, carriageMaterial);
        carriageGroup.add(carriageBody);

        // Add white stripes on both sides
        const leftStripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
        leftStripe.position.set(0, -0.4, 0.51); // Left side
        carriageGroup.add(leftStripe);

        const rightStripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
        rightStripe.position.set(0, -0.4, -0.51); // Right side
        carriageGroup.add(rightStripe);

        // Add wheels
        wheelPositions.forEach(pos => {
            const wheel = createWheel();
            wheel.position.set(...pos);
            carriageGroup.add(wheel);
        });

        carriageGroup.position.set(train.position.x - (i + 1) * 5, 0.8, 0);
        carriages.push(carriageGroup);
        scene.add(carriageGroup);
    }
}

function createTrack() {
    const curve = generateTrackCurve();
    
    // Create two parallel tracks
    const railGeometry = new THREE.TubeGeometry(curve, 50, 0.05, 6, false); // Reduced radius to 0.1
    const railMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
    
    // Create first rail
    const rail1 = new THREE.Mesh(railGeometry, railMaterial);
    scene.add(rail1);
    
    // Create second rail by cloning and offsetting
    const rail2 = rail1.clone();
    
    // Offset the rails to run parallel
    rail1.position.z = 0.43;  // Move first rail to one side
    rail2.position.z = -0.43; // Move second rail to other side
    
    scene.add(rail2);
    
    // Store both rails in track object for reference
    track = new THREE.Group();
    track.add(rail1);
    track.add(rail2);
    
    // Add railroad ties
    const tieGeometry = new THREE.BoxGeometry(0.2, 0.05, 1.4);
    const tieMaterial = new THREE.MeshPhongMaterial({ color: 0x4d3319 }); // Brown color for wooden ties
    
    // Add ties along the track
    const numTies = 1000;
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
        const treeGroup = new THREE.Group();
        
        // Create cone (tree top)
        const coneHeight = 5;
        const coneRadius = 1;
        const coneGeometry = new THREE.ConeGeometry(coneRadius, coneHeight, 8);
        const coneMaterial = new THREE.MeshPhongMaterial({ color: 0x228B22 });
        const cone = new THREE.Mesh(coneGeometry, coneMaterial);
        cone.position.y = 1.5;
        treeGroup.add(cone);
        
        // Create trunk with new color
        const trunkRadius = coneRadius/4;
        const trunkHeight = coneHeight/5;
        const trunkGeometry = new THREE.CylinderGeometry(trunkRadius, trunkRadius, trunkHeight, 8);
        const trunkMaterial = new THREE.MeshPhongMaterial({ color: 0x964B00 }); // Changed from 0x4d3319 to 0x964B00
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = -1;
        treeGroup.add(trunk);
        
        // Position the tree group
        const side = Math.random() > 0.5 ? 1 : -1;
        const x = (Math.random() - 0.5) * TRACK_LENGTH;
        
        const trackProgress = (x + TRACK_LENGTH/2) / TRACK_LENGTH;
        const trackPoint = new THREE.CatmullRomCurve3(trackPoints).getPointAt(Math.max(0, Math.min(1, trackProgress)));
        
        const minDistance = 5;
        const randomExtra = Math.random() * 100;
        const z = trackPoint.z + (minDistance + randomExtra) * side;
        
        treeGroup.position.set(x, 1.5, z);
        
        trees.push(treeGroup);
        scene.add(treeGroup);
    }

    // Create second set of taller trees (height 7)
    for (let i = 0; i < 2000; i++) {
        const treeGroup = new THREE.Group();
        
        // Create cone (tree top)
        const coneHeight = 7;
        const coneRadius = 1.2;
        const coneGeometry = new THREE.ConeGeometry(coneRadius, coneHeight, 8);
        const coneMaterial = new THREE.MeshPhongMaterial({ color: 0x228B22 });
        const cone = new THREE.Mesh(coneGeometry, coneMaterial);
        cone.position.y = 2.5;
        treeGroup.add(cone);
        
        // Create trunk with new color
        const trunkRadius = coneRadius/3;
        const trunkHeight = coneHeight/3;
        const trunkGeometry = new THREE.CylinderGeometry(trunkRadius, trunkRadius, trunkHeight, 8);
        const trunkMaterial = new THREE.MeshPhongMaterial({ color: 0x964B00 }); // Changed from 0x4d3319 to 0x964B00
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = -2;
        treeGroup.add(trunk);
        
        // Position the tree group
        const side = Math.random() > 0.5 ? 1 : -1;
        const x = (Math.random() - 0.5) * TRACK_LENGTH;
        
        const trackProgress = (x + TRACK_LENGTH/2) / TRACK_LENGTH;
        const trackPoint = new THREE.CatmullRomCurve3(trackPoints).getPointAt(Math.max(0, Math.min(1, trackProgress)));
        
        const minDistance = 10;
        const randomExtra = Math.random() * 100;
        const z = trackPoint.z + (minDistance + randomExtra) * side;
        
        treeGroup.position.set(x, 2, z);
        
        trees.push(treeGroup);
        scene.add(treeGroup);
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
        if (!introAnimationComplete) {
            skipIntroAnimation();
            return;
        }
        isMouseDown = true;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
    });

    // Touch controls
    canvas.addEventListener('touchstart', (e) => {
        if (!introAnimationComplete) {
            skipIntroAnimation();
            return;
        }
        isMouseDown = true;
        lastTouchX = e.touches[0].clientX;
        lastTouchY = e.touches[0].clientY;
        lastTouchTime = Date.now();
        touchVelocityX = 0;
        touchVelocityY = 0;
    });

    canvas.addEventListener('touchmove', (e) => {
        if (!isMouseDown || isFirstPerson) return;
        e.preventDefault();

        const currentTime = Date.now();
        const deltaTime = currentTime - lastTouchTime;
        const touchX = e.touches[0].clientX;
        const touchY = e.touches[0].clientY;

        // Calculate velocity
        if (deltaTime > 0) {
            touchVelocityX = (touchX - lastTouchX) / deltaTime;
            touchVelocityY = (touchY - lastTouchY) / deltaTime;
        }

        // Update camera angles
        cameraAngleHorizontal += (touchX - lastTouchX) * 0.005;
        
        const verticalSensitivity = 0.002;
        const minVerticalAngle = 0;
        const maxVerticalAngle = 0.2;
        
        cameraAngleVertical = Math.max(minVerticalAngle, 
            Math.min(maxVerticalAngle, 
                cameraAngleVertical - (touchY - lastTouchY) * verticalSensitivity
            )
        );

        lastTouchX = touchX;
        lastTouchY = touchY;
        lastTouchTime = currentTime;
    });

    canvas.addEventListener('touchend', () => {
        isMouseDown = false;
    });

    window.addEventListener('mousemove', (e) => {
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
    
    // Apply touch momentum when not being touched
    if (!isMouseDown && !isFirstPerson && introAnimationComplete) {
        if (Math.abs(touchVelocityX) > 0.001 || Math.abs(touchVelocityY) > 0.001) {
            cameraAngleHorizontal += touchVelocityX * 0.1;
            
            const verticalDelta = -touchVelocityY * 0.05;
            cameraAngleVertical = Math.max(0, Math.min(0.2, 
                cameraAngleVertical + verticalDelta
            ));

            // Apply decay to velocities
            touchVelocityX *= MOMENTUM_DECAY;
            touchVelocityY *= MOMENTUM_DECAY;
        }
    }

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
    train.rotateY(-Math.PI / 2); // Changed from PI/2 to -PI/2 to reverse orientation
    
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
        carriage.rotateY(-Math.PI / 2); // Changed from PI/2 to -PI/2 to match train
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

// Add this function to handle skipping the intro
function skipIntroAnimation() {
    if (!introAnimationComplete) {
        introAnimationComplete = true;
        
        // Set camera to final position
        camera.position.set(
            train.position.x + Math.cos(Math.PI * 1.75) * 4.5,
            2,
            train.position.z + Math.sin(Math.PI * 1.75) * 4.5
        );
        camera.lookAt(train.position);
        
        // Store the final position and target
        finalIntroPosition.copy(camera.position);
        finalIntroTarget.copy(train.position);
        
        // Calculate the camera angles based on final position
        const offset = finalIntroPosition.clone().sub(finalIntroTarget);
        cameraAngleHorizontal = Math.atan2(offset.z, offset.x);
        cameraAngleVertical = Math.asin(offset.y / offset.length());
        
        // Adjust CAMERA_DISTANCE to match final intro radius
        CAMERA_DISTANCE = offset.length();
        
        // Show the camera switch button
        document.getElementById('cameraSwitch').style.display = 'block';
    }
}

// Initialize and start animation
init();
animate(); 
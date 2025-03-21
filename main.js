let scene, camera, renderer, train, track, carriages = [];
let trees = [];
const TRACK_LENGTH = 1000;
const TRAIN_SPEED = 0.1;
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
let barkTexture;
let smokeParticles;
const NUM_PARTICLES = 1000;
let particleSystem;

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

    // Load bark texture
    const textureLoader = new THREE.TextureLoader();
    barkTexture = textureLoader.load('bark.jpg');
    barkTexture.wrapS = THREE.RepeatWrapping;
    barkTexture.wrapT = THREE.RepeatWrapping;
    barkTexture.repeat.set(1, 1);
    barkTexture.minFilter = THREE.LinearMipMapLinearFilter;
    barkTexture.generateMipmaps = true;

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
    createSmokeParticles();
}

function createWheel(radius) {
    const wheelGeometry = new THREE.CylinderGeometry(radius, radius, 0.1, 16);
    const wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 }); // Dark gray
    const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel.rotateX(Math.PI / 2);
    return wheel;
}

function createTrain() {
    const trainGroup = new THREE.Group();
    
    // Main body - adjust y from 0.38 to 0.50
    const bodyGeometry = new THREE.CylinderGeometry(.5, .5, 2.5, 16);
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x686868 });
    const trainBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
    trainBody.position.set(.6, .50, 0); // Changed from 0.38 to 0.50
    trainBody.rotateZ(Math.PI / 2);
    trainGroup.add(trainBody);

    // Add smokestack (two parts)
    const stackBaseMaterial = new THREE.MeshPhongMaterial({ color: 0x686868 });
    
    // Skinny base cylinder
    const stackBaseGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.3, 16);
    const stackBase = new THREE.Mesh(stackBaseGeometry, stackBaseMaterial);
    stackBase.position.set(1.5, 0.92, 0); // Changed from 0.8 to 0.92
    trainGroup.add(stackBase);
    
    // Wider top cylinder
    const stackTopGeometry = new THREE.CylinderGeometry(0.15, 0.12, 0.2, 16);
    const stackTop = new THREE.Mesh(stackTopGeometry, stackBaseMaterial);
    stackTop.position.set(1.5, 1.17, 0); // Changed from 1.05 to 1.17
    trainGroup.add(stackTop);

    // Add step ladders at the rear of the cockpit
    const stepLadderGeometry = new THREE.BoxGeometry(0.4, 0.05, 0.15);
    const stepLadderMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 }); // Dark gray like wheels

    // Left ladder
    const leftLadderGroup = new THREE.Group();
    for (let i = 0; i < 3; i++) {
        const step = new THREE.Mesh(stepLadderGeometry, stepLadderMaterial);
        step.position.set(-1.85, 0.1 + (i * 0.2), 0.4); // Increasing height for each step
        leftLadderGroup.add(step);

        // Add vertical supports
        if (i === 0) {
            const supportGeometry = new THREE.BoxGeometry(0.05, 0.6, 0.05);
            const frontSupport = new THREE.Mesh(supportGeometry, stepLadderMaterial);
            const backSupport = new THREE.Mesh(supportGeometry, stepLadderMaterial);
            
            frontSupport.position.set(-1.7, 0.3, 0.4);
            backSupport.position.set(-2.0, 0.3, 0.4);
            
            leftLadderGroup.add(frontSupport);
            leftLadderGroup.add(backSupport);
        }
    }
    trainGroup.add(leftLadderGroup);

    // Right ladder (mirror of left)
    const rightLadderGroup = new THREE.Group();
    for (let i = 0; i < 3; i++) {
        const step = new THREE.Mesh(stepLadderGeometry, stepLadderMaterial);
        step.position.set(-1.85, 0.1 + (i * 0.2), -0.4); // Mirror position on z-axis
        rightLadderGroup.add(step);

        // Add vertical supports
        if (i === 0) {
            const supportGeometry = new THREE.BoxGeometry(0.05, 0.6, 0.05);
            const frontSupport = new THREE.Mesh(supportGeometry, stepLadderMaterial);
            const backSupport = new THREE.Mesh(supportGeometry, stepLadderMaterial);
            
            frontSupport.position.set(-1.7, 0.3, -0.4);
            backSupport.position.set(-2.0, 0.3, -0.4);
            
            rightLadderGroup.add(frontSupport);
            rightLadderGroup.add(backSupport);
        }
    }
    trainGroup.add(rightLadderGroup);

    // Add train cockpit
    const cockpitGeometry = new THREE.BoxGeometry(1.2, 1.2, 1.5, 16);
    const cockpitMaterial = new THREE.MeshPhongMaterial({ color: 0x686868 });
    const trainCockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
    trainCockpit.rotateY(Math.PI / 2);
    trainCockpit.position.set(-1.25, 0.75, 0);
    trainGroup.add(trainCockpit);

    // Add rear door to cockpit
    const doorGeometry = new THREE.PlaneGeometry(0.5, 0.8);
    const doorMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x111111,  // Very dark grey/black
        side: THREE.DoubleSide
    });
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(-2.01, 0.75, 0);
    door.rotateY(Math.PI / 2);
    trainGroup.add(door);

    // Add windows to cockpit
    const windowMaterial = new THREE.MeshPhongMaterial({
        color: 0x88CCFF,
        transparent: true,
        opacity: 0.6,
        shininess: 100
    });

    // Front window
    const frontWindowGeometry = new THREE.PlaneGeometry(0.6, 0.8);
    const frontWindow = new THREE.Mesh(frontWindowGeometry, windowMaterial);
    frontWindow.position.set(-1.65, 0.85, 0);
    frontWindow.rotateY(Math.PI / 2);
    trainGroup.add(frontWindow);

    // Left window
    const leftWindowGeometry = new THREE.PlaneGeometry(0.8, 0.4);
    const leftWindow = new THREE.Mesh(leftWindowGeometry, windowMaterial);
    leftWindow.position.set(-1.25, 0.85, 0.61);
    trainGroup.add(leftWindow);

    // Right window
    const rightWindowGeometry = new THREE.PlaneGeometry(0.8, 0.4);
    const rightWindow = new THREE.Mesh(rightWindowGeometry, windowMaterial);
    rightWindow.position.set(-1.25, 0.85, -0.61);
    rightWindow.rotateY(Math.PI);
    trainGroup.add(rightWindow);

    // Add train frame
    const frameGeometry = new THREE.BoxGeometry(1, .2, 2, 16);
    const frameMaterial = new THREE.MeshPhongMaterial({ color: 0x686868 });
    const trainFrame = new THREE.Mesh(frameGeometry, frameMaterial);
    trainFrame.rotateY(Math.PI / 2);
    trainFrame.position.set(1, -.1, 0);
    trainGroup.add(trainFrame);

    // Add train underframe
    const underframeGeometry = new THREE.BoxGeometry(.7, .5, 3.7, 16);
    const underframeMaterial = new THREE.MeshPhongMaterial({ color: 0x686868 });
    const trainUnderframe = new THREE.Mesh(underframeGeometry, underframeMaterial);
    trainUnderframe.rotateY(Math.PI / 2);
    trainUnderframe.position.set(0, -.1, 0);
    trainGroup.add(trainUnderframe);

    // Add headlight - adjust y from 0.38 to 0.50
    const headlightGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.12, 16);
    const headlightMaterial = new THREE.MeshPhongMaterial({ color: 0xFFFFCC});
    const headlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
    headlight.rotation.z = Math.PI / 2;
    headlight.position.set(1.83, 0.50, 0); // Changed from 0.38 to 0.50
    trainGroup.add(headlight);

    // Add snow plow / shovel
    const shovelGeometry = new THREE.BufferGeometry();
    const vertices = new Float32Array([
        // Left triangle
        0, -0.3, 0.5,     // Bottom left (at rail)
        0, 0.3, 0.5,      // Top left
        .7, 0.43, 0,       // Top point
        
        // Right triangle
        0, -0.3, -0.5,    // Bottom right (at rail)
        0, 0.3, -0.5,     // Top right
        .7, 0.43, 0,       // Top point
        
        // Bottom triangle
        0, -0.3, 0.5,     // Bottom left
        0, -0.3, -0.5,    // Bottom right
        .7, 0.43, 0        // Top point
    ]);
    
    shovelGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    shovelGeometry.computeVertexNormals();
    
    const shovelMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x8B8B8B,   // Slightly lighter than train body
        side: THREE.DoubleSide
    });
    
    const shovel = new THREE.Mesh(shovelGeometry, shovelMaterial);
    shovel.position.set(1.99, -.3, 0); // Position at front of train
    shovel.rotateX(Math.PI);
    trainGroup.add(shovel);

    // Add wheels using different sizes for front and rear
    const frontWheelPositions = [
        [1, -0.47, 0.4],
        [1, -0.47, -0.4],
        [1.7, -0.47, 0.4],
        [1.7, -0.47, -0.4]
    ];

    const rearWheelPositions = [
        [-.5, -0.32, 0.4],
        [-.5, -0.32, -0.4],
        [-1.4, -0.32, 0.4],
        [-1.4, -0.32, -0.4]
    ];

    // Add front wheels (normal size)
    frontWheelPositions.forEach(pos => {
        const wheel = createWheel(0.3); // Original size
        wheel.position.set(...pos);
        trainGroup.add(wheel);
    });

    // Add rear wheels (50% larger)
    rearWheelPositions.forEach(pos => {
        const wheel = createWheel(0.45); // 50% larger
        wheel.position.set(...pos);
        trainGroup.add(wheel);
    });

    trainGroup.position.y = 0.8;
    train = trainGroup;
    scene.add(train);

    // Create carriages
    const carriageGeometry = new THREE.BoxGeometry(5, 1.5, 1);
    const carriageMaterial = new THREE.MeshPhongMaterial({ color: 0x1a472a }); // Dark green
    
    // Create white stripe geometry
    const stripeGeometry = new THREE.BoxGeometry(5, 0.1, 0.02);
    const stripeMaterial = new THREE.MeshPhongMaterial({ color: 0xFFFFFF });

    for (let i = 0; i < 6; i++) {
        const carriageGroup = new THREE.Group();
        
        // Main carriage body
        const carriageBody = new THREE.Mesh(carriageGeometry, carriageMaterial);
        carriageGroup.add(carriageBody);
        carriageBody.position.set(0, 0.5, 0);

        // Add white stripes on both sides
        const leftStripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
        leftStripe.position.set(0, 0.9, 0.51); // Left side
        carriageGroup.add(leftStripe);

        const rightStripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
        rightStripe.position.set(0, .9, -0.51); // Right side
        carriageGroup.add(rightStripe);

        // Add wheels
        frontWheelPositions.forEach(pos => {
            const wheel = createWheel(0.3);
            wheel.position.set(...pos);
            carriageGroup.add(wheel);
        });

        rearWheelPositions.forEach(pos => {
            const wheel = createWheel(0.45);
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
    // Instead of creating new geometries/materials for each object
    const sharedGeometry = new THREE.CylinderGeometry(5, 5, 1, 16);
    const sharedMaterial = new THREE.MeshStandardMaterial({ map: barkTexture });

    // First set of trees
    for (let i = 0; i < 2000; i++) {
        const treeGroup = new THREE.Group();
        
        // Create cone (tree top)
        const coneHeight = 3;
        const coneRadius = .5;
        const coneGeometry = new THREE.ConeGeometry(coneRadius, coneHeight, 8);
        const coneMaterial = new THREE.MeshPhongMaterial({ color: 0x228B22 });
        const cone = new THREE.Mesh(coneGeometry, coneMaterial);
        cone.position.y = .5;
        treeGroup.add(cone);
        
        // Create trunk with bark texture only (no color tint)
        const trunkRadius = coneRadius/4;
        const trunkHeight = coneHeight/5;
        const trunkGeometry = new THREE.CylinderGeometry(trunkRadius, trunkRadius, trunkHeight, 8);
        const trunkMaterial = new THREE.MeshPhongMaterial({ 
            map: barkTexture
        }); // Removed color property
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = -1;
        treeGroup.add(trunk);
        
        // Position the tree group
        const side = Math.random() > 0.5 ? 1 : -1;
        const x = (Math.random() - 0.5) * TRACK_LENGTH;
        
        const trackProgress = (x + TRACK_LENGTH/2) / TRACK_LENGTH;
        const trackPoint = new THREE.CatmullRomCurve3(trackPoints).getPointAt(Math.max(0, Math.min(1, trackProgress)));
        
        const minDistance = 5;
        const maxDistance = 12;
        const randomExtra = Math.random() * 100;
        const z = trackPoint.z + (minDistance + randomExtra) * side;
        
        treeGroup.position.set(x, 1.5, z);
        
        trees.push(treeGroup);
        scene.add(treeGroup);
    }

    // Second set of taller trees
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
        
        // Create trunk with bark texture only (no color tint)
        const trunkRadius = coneRadius/3;
        const trunkHeight = coneHeight/3;
        const trunkGeometry = new THREE.CylinderGeometry(trunkRadius, trunkRadius, trunkHeight, 8);
        const trunkMaterial = new THREE.MeshPhongMaterial({ 
            map: barkTexture
        }); // Removed color property
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = -2;
        treeGroup.add(trunk);
        
        // Position the tree group
        const side = Math.random() > 0.5 ? 1 : -1;
        const x = (Math.random() - 0.5) * TRACK_LENGTH;
        
        const trackProgress = (x + TRACK_LENGTH/2) / TRACK_LENGTH;
        const trackPoint = new THREE.CatmullRomCurve3(trackPoints).getPointAt(Math.max(0, Math.min(1, trackProgress)));
        
        const minDistance = 10;
        const maxDistance = 15;
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
    const leftWindowBtn = document.getElementById('leftWindow');
    const rightWindowBtn = document.getElementById('rightWindow');
    
    button.style.display = 'none';
    leftWindowBtn.style.display = 'none';
    rightWindowBtn.style.display = 'none';
    
    const showButtons = () => {
        if (introAnimationComplete) {
            button.style.display = 'block';
            leftWindowBtn.style.display = 'block';
            rightWindowBtn.style.display = 'block';
            document.removeEventListener('click', showButtons);
        }
    };
    
    document.addEventListener('click', showButtons);
    
    // Existing camera switch button logic
    button.addEventListener('click', () => {
        if (!introAnimationComplete) return;
        isFirstPerson = !isFirstPerson;
        button.textContent = isFirstPerson ? 'Third Person' : 'First Person';
    });

    // Add window view handlers
    leftWindowBtn.addEventListener('click', () => {
        if (!introAnimationComplete) return;
        isFirstPerson = true;
        const sideOffset = new THREE.Vector3(-1.25, 0.85, 0.61); // Match left window position
        camera.position.copy(train.position).add(sideOffset);
        
        // Create a matrix to get train's current orientation
        const trainMatrix = new THREE.Matrix4();
        train.updateMatrix();
        trainMatrix.copy(train.matrix);
        
        // Create a point 10 units to the left of the train in world space
        const lookDirection = new THREE.Vector3(0, 0, 1); // Point perpendicular to train
        lookDirection.applyMatrix4(trainMatrix); // Transform to world space
        
        const lookAtPoint = camera.position.clone().add(lookDirection.multiplyScalar(10));
        camera.lookAt(lookAtPoint);
        
        button.textContent = 'Third Person';
    });

    rightWindowBtn.addEventListener('click', () => {
        if (!introAnimationComplete) return;
        isFirstPerson = true;
        const sideOffset = new THREE.Vector3(-1.25, 0.85, -0.61); // Match right window position
        camera.position.copy(train.position).add(sideOffset);
        
        // Create a matrix to get train's current orientation
        const trainMatrix = new THREE.Matrix4();
        train.updateMatrix();
        trainMatrix.copy(train.matrix);
        
        // Create a point 10 units to the right of the train in world space
        const lookDirection = new THREE.Vector3(0, 0, -1); // Point perpendicular to train
        lookDirection.applyMatrix4(trainMatrix); // Transform to world space
        
        const lookAtPoint = camera.position.clone().add(lookDirection.multiplyScalar(10));
        camera.lookAt(lookAtPoint);
        
        button.textContent = 'Third Person';
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

function createSmokeParticles() {
    // Create geometry first
    const particles = new Float32Array(NUM_PARTICLES * 3);
    const velocities = new Float32Array(NUM_PARTICLES * 3);
    const opacities = new Float32Array(NUM_PARTICLES);
    const sizes = new Float32Array(NUM_PARTICLES);

    // Initialize particles with higher Y position and spread them out
    const stackLocalPos = new THREE.Vector3(1.5, 1.37, 0);
    for (let i = 0; i < NUM_PARTICLES; i++) {
        // Spread particles along the trail initially
        const spreadDistance = Math.random() * 60; // Doubled from 30 to 60 for longer initial trail
        const heightSpread = Math.random() * 0.2;
        const sideSpread = (Math.random() - 0.5) * 0.5;

        particles[i * 3] = stackLocalPos.x - spreadDistance; // Spread backwards twice as far
        particles[i * 3 + 1] = stackLocalPos.y + heightSpread;
        particles[i * 3 + 2] = stackLocalPos.z + sideSpread;

        // Set initial velocities
        velocities[i * 3] = -0.1;
        velocities[i * 3 + 1] = (0.05 + Math.random() * 0.02) * 0.5;
        velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.01 * 0.5;

        // Set initial opacity based on distance (adjusted for longer trail)
        opacities[i] = Math.max(0.1, 1 - (spreadDistance / 60)); // Adjusted denominator to match new length

        // Set initial size based on distance (adjusted for longer trail)
        sizes[i] = 0.2 + (spreadDistance / 60) * 0.6; // Adjusted denominator to match new length
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(particles, 3));
    geometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Create a simple circular texture if loading fails
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);
    const defaultTexture = new THREE.CanvasTexture(canvas);

    // Try to load the smoke texture
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
        'smoke-particle.png',
        (texture) => {
            console.log('Smoke texture loaded successfully');
            material.map = texture;
            material.needsUpdate = true;
        },
        undefined,
        (error) => {
            console.warn('Failed to load smoke texture, using default:', error);
            material.map = defaultTexture;
            material.needsUpdate = true;
        }
    );

    // Create material with default texture and size attenuation
    const material = new THREE.PointsMaterial({
        size: 0.5,          // Initial size
        map: defaultTexture,
        transparent: true,
        opacity: 0.2,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: false,
        sizeAttenuation: true
    });

    // Create and add particle system
    particleSystem = new THREE.Points(geometry, material);
    train.add(particleSystem);

    // Store particle data
    smokeParticles = {
        positions: particles,
        velocities: velocities,
        opacities: opacities,
        sizes: sizes,        // Add sizes to stored attributes
        geometry: geometry
    };
}

function updateSmoke() {
    if (!smokeParticles) return;

    const positions = smokeParticles.positions;
    const velocities = smokeParticles.velocities;
    const opacities = smokeParticles.opacities;
    const sizes = smokeParticles.sizes;      // Get sizes array
    const stackLocalPos = new THREE.Vector3(1.5, 1.37, 0);

    for (let i = 0; i < NUM_PARTICLES; i++) {
        // Update positions with halved velocities
        positions[i * 3] += velocities[i * 3] * 0.5;         // X movement (50% slower)
        positions[i * 3 + 1] += velocities[i * 3 + 1] * 0.5; // Y movement (50% slower)
        positions[i * 3 + 2] += velocities[i * 3 + 2] * 0.5; // Z movement (50% slower)

        // Add more turbulence for wider spread
        positions[i * 3 + 2] += (Math.random() - 0.5) * 0.01;  // Doubled Z variation

        // After rising 0.1 units, start moving horizontally
        if (positions[i * 3 + 1] > stackLocalPos.y + 0.1) {
            velocities[i * 3] = -0.1;                // Base horizontal velocity
            velocities[i * 3 + 1] *= 0.95;          // Gradual vertical slowdown
            // Add random horizontal spread
            positions[i * 3] += (Math.random() - 0.5) * 0.01;  // Wider X spread
        }

        // Decrease opacity more slowly for longer trail
        opacities[i] *= 0.99;  // Changed from 0.98 to 0.99

        // Gradually increase size
        sizes[i] *= 1.5;  // Increase size by 1% each frame

        // Reset if too far left/up or too faint (doubled distance)
        if (positions[i * 3] < stackLocalPos.x - 30 ||  
            positions[i * 3 + 1] > stackLocalPos.y + 6 || 
            opacities[i] < 0.05) {  
            
            // Reset position
            positions[i * 3] = stackLocalPos.x;
            positions[i * 3 + 1] = stackLocalPos.y;
            positions[i * 3 + 2] = stackLocalPos.z;

            // Reset velocities
            velocities[i * 3] = 0;
            velocities[i * 3 + 1] = (0.05 + Math.random() * 0.02) * 0.5;
            velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.01 * 0.5;

            // Reset size and opacity
            sizes[i] = 0.2 + Math.random() * 0.3;  // Reset to initial size range
            opacities[i] = Math.random();
        }
    }

    // Update geometry attributes
    smokeParticles.geometry.attributes.position.needsUpdate = true;
    smokeParticles.geometry.attributes.opacity.needsUpdate = true;
    smokeParticles.geometry.attributes.size.needsUpdate = true;  // Update sizes
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
    
    // Update smoke particles
    updateSmoke();
    
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

function cleanup() {
    // Dispose geometries
    geometry.dispose();
    
    // Dispose materials
    material.dispose();
    
    // Dispose textures
    texture.dispose();
    
    // Remove from scene
    scene.remove(mesh);
} 
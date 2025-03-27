let scene, camera, renderer, train, track, carriages = [];
let trees = [];
const TRACK_SEGMENT_LENGTH = 2000; // Doubled from 1000 to 2000
const TRAIN_SPEED = .2;
let trainPosition = 400; // Doubled from 200 to 400
let cameraAngleHorizontal = 0;
let cameraAngleVertical = 0;
let CAMERA_DISTANCE = 5; // Will be updated to 5 at end of intro
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
let trainWheels = [];
let carriageWheels = [];
const WHEEL_RPM = 2000;
const WHEEL_ROTATION_SPEED = (WHEEL_RPM * 2 * Math.PI) / 60; // Convert RPM to radians per second
let isInCockpit = false;
const COCKPIT_OFFSET = new THREE.Vector3(-.8, .8, -.99); // Position in middle of cockpit
const TREE_RENDER_DISTANCE = 500;  // How far ahead/behind to show trees
let mountains = [];
const NUM_MOUNTAINS = 50;
let deer = [];
const DEER_SPACING = 5 + Math.random() * 1.5; // Fixed spacing of 100 units
const NUM_DEER = Math.floor(TRACK_SEGMENT_LENGTH / DEER_SPACING); // Number of deer based on track length
let isWhistling = false;
let isHeadlightBright = false;  // Track if headlight is in bright mode
let headlightBeam;  // Reference to the spotlight
let headlightMesh;  // Reference to the physical headlight
let hornSound;
let whistleTimeout;
const INITIAL_TRAIN_VOLUME = 0.06; // 20% of 0.3
const FINAL_TRAIN_VOLUME = 0.3;
let trainSound;
let deerThudSound;
let bigfootSound;
let deerCollisionCount = 0;
const INITIAL_BIGFOOT_VOLUME = 0.03;
const BIGFOOT_VOLUME_INCREMENT = 0.01;
let deerThudSoundVolume = 1.0;
const WHISTLE_DURATION = 1000; // 1 second in milliseconds
let ambientSound;
let hasStarted = false; // Add flag to track if experience has started
let gameEnded = false;
let fallenTree = null; // Reference to store fallen tree object
let sunGroup;
const INITIAL_SUN_HEIGHT = 200;
const FINAL_SUN_HEIGHT = -100;
const SUN_DROP_SPEED = 0.1;
let isSunSetting = false;
let sunScale = 1.0;  // Add sun scale tracking
const SUN_SCALE_INCREASE = 0.1; // 10% increase for collisions
let targetSunScale = 1.0;  // The scale we're animating towards
const SUN_SCALE_SPEED = 0.1; // How fast to animate the scale change
let isShaking = false;
let shakeStartTime = 0;
const SHAKE_DURATION = 100; // 1 second in milliseconds
const SHAKE_INTENSITY = 0.01;
let isTransitioningToCockpit = false;
let transitionStartTime = 0;
const COCKPIT_TRANSITION_DURATION = 2000; // 1 second in milliseconds
let isSunShaking = false;
let sunShakeStartTime = 0;
const SUN_SHAKE_DURATION = 3000; // 4 seconds to match bigfoot sound
const SUN_SHAKE_INTENSITY = 5; // Intensity of the shake
const sunOriginalPosition = new THREE.Vector3();


// Initialize the scene
function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x2a3b4d); // Darker blue-gray sky
    
    // Add fog with darker color - modified to start further back
    const fogColor = 0x1a1a1a; // Matching dark grey
    const fogNear = 0;  // Start at train position
    const fogFar = 20;  // Extend far behind train
    scene.fog = new THREE.Fog(fogColor, fogNear, fogFar);
    
    // Add stars to the night sky
    createStars();
    
    // Add the sun
    createSun();
    
    // Initialize ambient sound but don't play yet
    ambientSound = document.getElementById('ambientSound');
    ambientSound.volume = 0.1;
    ambientSound.loop = true;
    
    // Start train sound
    trainSound = document.getElementById('trainSound');
    trainSound.volume = INITIAL_TRAIN_VOLUME;
    trainSound.play().catch(error => {
        console.log("Audio play failed:", error);
    });
    
    // Initialize horn sound
    hornSound = document.getElementById('hornSound');
    hornSound.volume = 0.4;

    // Initialize deer thud sound
    deerThudSound = document.getElementById('deerThudSound');
    if (deerThudSound) {
        deerThudSound.volume = 1.0;
        deerThudSound.preload = 'auto';
        deerThudSound.load();
    }

    // Initialize bigfoot sound
    bigfootSound = document.getElementById('bigfootSound');
    if (bigfootSound) {
        bigfootSound.volume = INITIAL_BIGFOOT_VOLUME;
        bigfootSound.preload = 'auto';
        bigfootSound.load();
    }
    
    // Add ground plane
    const groundGeometry = new THREE.PlaneGeometry(TRACK_SEGMENT_LENGTH * 40, TRACK_SEGMENT_LENGTH * 4);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x2d4a1d,
        side: THREE.DoubleSide,
        metalness: 0,
        roughness: 1
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    scene.add(ground);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);  // Increased far plane
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, .01);
    scene.add(ambientLight);
    
    // Add hemisphere light for sky gradient
    const hemisphereLight = new THREE.HemisphereLight(
        0x8B0000,  // Sky color (matching sun)
        0x000000,  // Ground color (black)
        0.3        // Intensity
    );
    hemisphereLight.position.set(TRACK_SEGMENT_LENGTH / 2, 200, 500); // Match sun position
    scene.add(hemisphereLight);
    
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
    
    // Add fallen tree obstacle
    createFallenTree();
    
    // Don't create deer yet - will be created on first click

    // Initialize animation timestamp
    introStartTime = Date.now();
    
    // Start with camera far out
    camera.position.set(300, 20, 100);
    camera.lookAt(train.position);

    // Initialize mouse controls with start functionality
    initMouseControls();
    createSmokeParticles();
}

function createWheel(radius, isRightSide) {
    const wheelGroup = new THREE.Group();

    // Create the wheel
    const wheelGeometry = new THREE.CylinderGeometry(radius, radius, 0.1, 16);
    const wheelMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x1a1a1a, // Very dark gray
        metalness: 0,
        roughness: 1
    });
    const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel.rotateX(Math.PI / 2);
    wheelGroup.add(wheel);

    // Create the axle only for right-side wheels
    if (isRightSide) {
        const axleGeometry = new THREE.CylinderGeometry(radius * 0.2, radius * 0.2, 0.9, 8);
        const axleMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x1a1a1a,
            metalness: 0,
            roughness: 1
        });
        const axle = new THREE.Mesh(axleGeometry, axleMaterial);
        axle.rotateX(Math.PI / 2);
        axle.position.set(0, 0, .4);
        wheelGroup.add(axle);
    }

    trainWheels.push(wheel);
    return wheelGroup;
}

function createTrain() {
    const trainGroup = new THREE.Group();
    
    // Main body - adjust y from 0.38 to 0.50
    const bodyGeometry = new THREE.CylinderGeometry(.5, .5, 2.5, 32);
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x3d3d3d, // Darker gray
        metalness: 0,
        roughness: 1
    });
    const trainBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
    trainBody.position.set(.6, .50, 0); // Changed from 0.38 to 0.50
    trainBody.rotateZ(Math.PI / 2);
    trainGroup.add(trainBody);

    // Add three decorative cylinders along the main body
    const ringGeometry = new THREE.CylinderGeometry(0.525, 0.525, 0.1, 32); // Radius is 1.05 * main body radius
    const ringMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x4d4d4d, // Slightly lighter than body
        metalness: 0,
        roughness: 1
    });

    // Create and position three rings along the body
    const ringPositions = [-0.7, 0, 0.7]; // Evenly spaced along the 2.5 length
    ringPositions.forEach(xOffset => {
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.set(.6 + xOffset, .50, 0); // Match body position but offset along length
        ring.rotateZ(Math.PI / 2); // Match body rotation
        trainGroup.add(ring);
    });

    // Add smokestack (two parts)
    const stackBaseMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x2d2d2d, // Even darker gray
        metalness: 0,
        roughness: 1
    });
    
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
    const stepLadderMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 }); // Dark gray like wheels

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
    const cockpitMaterial = new THREE.MeshStandardMaterial({ color: 0x686868 });
    const trainCockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
    trainCockpit.rotateY(Math.PI / 2);
    trainCockpit.position.set(-1.25, 0.75, 0);
    trainGroup.add(trainCockpit);

    // Add rear door to cockpit
    const doorGeometry = new THREE.PlaneGeometry(0.5, 0.8);
    const doorMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x111111,  // Very dark grey/black
        side: THREE.DoubleSide
    });
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(-2.01, 0.75, 0);
    door.rotateY(Math.PI / 2);
    trainGroup.add(door);

    // Add windows to cockpit
    const windowMaterial = new THREE.MeshStandardMaterial({
        color: 0x557788, // Muted blue-gray
        transparent: true,
        opacity: 0.4,
        metalness: 0,
        roughness: 0.5,
        emissive: 0x557788, // Match base color
        emissiveIntensity: 10
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
    const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x686868 });
    const trainFrame = new THREE.Mesh(frameGeometry, frameMaterial);
    trainFrame.rotateY(Math.PI / 2);
    trainFrame.position.set(1, -.1, 0);
    trainGroup.add(trainFrame);

    // Add train underframe
    const underframeGeometry = new THREE.BoxGeometry(.7, .5, 3.7, 16);
    const underframeMaterial = new THREE.MeshStandardMaterial({ color: 0x686868 });
    const trainUnderframe = new THREE.Mesh(underframeGeometry, underframeMaterial);
    trainUnderframe.rotateY(Math.PI / 2);
    trainUnderframe.position.set(0, -.1, 0);
    trainGroup.add(trainUnderframe);

    // Add headlight - adjust y from 0.38 to 0.50
    const headlightGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.12, 16);
    const headlightMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xFFFFCC,
        emissive: 0xFFFFCC,
        emissiveIntensity: 1
    });
    headlightMesh = new THREE.Mesh(headlightGeometry, headlightMaterial);
    headlightMesh.rotation.z = Math.PI / 2;
    headlightMesh.position.set(1.83, 0.50, 0);
    
    // Add spotlight for headlight beam
    headlightBeam = new THREE.SpotLight(0xFFFFCC, 5);
    headlightBeam.position.copy(headlightMesh.position);
    headlightBeam.angle = Math.PI / 10; // 22.5 degree cone
    headlightBeam.penumbra = 0.4;
    headlightBeam.decay = .5;
    headlightBeam.distance = 50;
    headlightBeam.target.position.set(headlightMesh.position.x + 1, headlightMesh.position.y, headlightMesh.position.z);
    
    trainGroup.add(headlightMesh);
    trainGroup.add(headlightBeam);
    trainGroup.add(headlightBeam.target);

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
    
    const shovelMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x8B8B8B,   // Slightly lighter than train body
        side: THREE.DoubleSide
    });
    
    const shovel = new THREE.Mesh(shovelGeometry, shovelMaterial);
    shovel.position.set(1.99, -.3, 0); // Position at front of train
    shovel.rotateX(Math.PI);
    trainGroup.add(shovel);

    // Add wheels using different sizes for front and rear
    const frontWheelPositions = [
        [1, -0.37, 0.4],
        [1, -0.37, -0.4],
        [1.7, -0.37, 0.4],
        [1.7, -0.37, -0.4]
    ];

    const rearWheelPositions = [
        [-.5, -0.22, 0.4],
        [-.5, -0.22, -0.4],
        [-1.4, -0.22, 0.4],
        [-1.4, -0.22, -0.4]
    ];

    // Add front wheels with paired axles
    for (let i = 0; i < frontWheelPositions.length; i += 2) {
        const wheelGroup1 = createWheel(0.3, false);  // Left wheel, no axle
        const wheelGroup2 = createWheel(0.3, true);   // Right wheel with axle
        wheelGroup1.position.set(...frontWheelPositions[i]);
        wheelGroup2.position.set(...frontWheelPositions[i + 1]);
        trainGroup.add(wheelGroup1);
        trainGroup.add(wheelGroup2);
    }

    // Add rear wheels with paired axles
    for (let i = 0; i < rearWheelPositions.length; i += 2) {
        const wheelGroup1 = createWheel(0.45, false);  // Left wheel, no axle
        const wheelGroup2 = createWheel(0.45, true);   // Right wheel with axle
        wheelGroup1.position.set(...rearWheelPositions[i]);
        wheelGroup2.position.set(...rearWheelPositions[i + 1]);
        trainGroup.add(wheelGroup1);
        trainGroup.add(wheelGroup2);
    }

    trainGroup.position.y = 0.8;
    train = trainGroup;
    scene.add(train);

    // Create carriages
    const carriageGeometry = new THREE.BoxGeometry(5, 1.5, 1);
    const carriageMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x1d3326, // Dark forest green
        metalness: 0,
        roughness: 1
    });
    
    // Create white stripe geometry
    const stripeGeometry = new THREE.BoxGeometry(5, 0.1, 0.02);
    const stripeMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });

    for (let i = 0; i < 4; i++) {
        const carriageGroup = new THREE.Group();
        const carriageWheelGroup = [];
        
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

        // Add front wheels with paired axles
        for (let j = 0; j < frontWheelPositions.length; j += 2) {
            const wheelGroup1 = createWheel(0.3, false);  // Left wheel, no axle
            const wheelGroup2 = createWheel(0.3, true);   // Right wheel with axle
            wheelGroup1.position.set(...frontWheelPositions[j]);
            wheelGroup2.position.set(...frontWheelPositions[j + 1]);
            carriageGroup.add(wheelGroup1);
            carriageGroup.add(wheelGroup2);
            carriageWheelGroup.push(wheelGroup1.children[0]);
            carriageWheelGroup.push(wheelGroup2.children[0]);
        }

        // Add rear wheels with paired axles
        for (let j = 0; j < rearWheelPositions.length; j += 2) {
            const wheelGroup1 = createWheel(0.45, false);  // Left wheel, no axle
            const wheelGroup2 = createWheel(0.45, true);   // Right wheel with axle
            wheelGroup1.position.set(...rearWheelPositions[j]);
            wheelGroup2.position.set(...rearWheelPositions[j + 1]);
            carriageGroup.add(wheelGroup1);
            carriageGroup.add(wheelGroup2);
            carriageWheelGroup.push(wheelGroup1.children[0]);
            carriageWheelGroup.push(wheelGroup2.children[0]);
        }

        carriageGroup.position.set(train.position.x - (i + 1) * 5, 0.8, 0);
        carriages.push(carriageGroup);
        scene.add(carriageGroup);
        carriageWheels.push(carriageWheelGroup);
    }
}

function createTrack() {
    const curve = generateTrackCurve();
    
    // Create two parallel tracks
    const railGeometry = new THREE.TubeGeometry(curve, 50, 0.05, 6, false); // Reduced radius to 0.1
    const railMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
    
    // Create first rail
    const rail1 = new THREE.Mesh(railGeometry, railMaterial);
    rail1.position.y = +.12;
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
    const tieMaterial = new THREE.MeshStandardMaterial({ color: 0x4d3319 }); // Brown color for wooden ties
    
    // Add ties along the track
    const numTies = 2000;
    for (let i = 0; i < numTies; i++) {
        const progress = i / numTies;
        const point = curve.getPointAt(progress);
        const tangent = curve.getTangentAt(progress);
        
        const tie = new THREE.Mesh(tieGeometry, tieMaterial);
        tie.position.copy(point);
        tie.position.y = 0.1; // Position slightly above ground
        
        // Create a horizontal tangent by zeroing out the Y component
        const horizontalTangent = new THREE.Vector3(tangent.x, 0, tangent.z).normalize();
        const target = point.clone().add(horizontalTangent);
        
        // Orient tie perpendicular to track direction while keeping it parallel to ground
        tie.lookAt(target);
        tie.rotateY(Math.PI / 2);
        
        track.add(tie);
    }
    
    scene.add(track);
}

function createForest() {
    const sharedTrunkGeometry = new THREE.CylinderGeometry(
        0.2,    // top radius
        0.2,    // bottom radius
        2,      // height
        8,      // radial segments
        1,      // height segments
        false   // open ended
    );
    
    const sharedTrunkMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x2b1810, // Dark brown
        metalness: 0,
        roughness: 1
    });

    trees = [];
    for (let i = 0; i < 3000; i++) {
        const treeGroup = new THREE.Group();
        
        // Create cone (tree top)
        const coneHeight = 1 ; // Random height between 5 and 9
        const coneRadius = .4;
        const coneGeometry = new THREE.ConeGeometry(coneRadius, coneHeight, 8);
        const coneMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x1d3b1d, // Dark pine green
            metalness: 0,
            roughness: 1
        });
        const cone = new THREE.Mesh(coneGeometry, coneMaterial);
        cone.position.y = -.5;
        treeGroup.add(cone);
        
        // Create trunk with bark texture only
        const trunkRadius = coneRadius/6;
        const trunkHeight = .5;
        const trunkGeometry = new THREE.CylinderGeometry(trunkRadius, trunkRadius, trunkHeight, 8);
        const trunkMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x2b1810, // Dark brown
            metalness: 0,
            roughness: 1
        });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = -1;
        treeGroup.add(trunk);
        
        // Position relative to track
        const x = Math.random() * TRACK_SEGMENT_LENGTH;
        const progress = x / TRACK_SEGMENT_LENGTH;
        const trackPoint = generateTrackCurve().getPointAt(progress);
        
        const side = Math.random() > 0.5 ? 1 : -1;
        const minDistance = 4;
        const randomExtra = Math.random() * 30;
        const z = trackPoint.z + (minDistance + randomExtra) * side;
        
        treeGroup.position.set(x, 1.5, z);

        trees.push(treeGroup);
        scene.add(treeGroup);
    }

    // Second set of taller trees
    for (let i = 0; i < 2000; i++) {
        const treeGroup = new THREE.Group();
        
        // Create cone (tree top)
        const coneHeight = 5; // Random height between 5 and 9
        const coneRadius = 1.2;
        const coneGeometry = new THREE.ConeGeometry(coneRadius, coneHeight, 8);
        const coneMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x1d3b1d, // Dark pine green
            metalness: 0,
            roughness: 1
        });
        const cone = new THREE.Mesh(coneGeometry, coneMaterial);
        cone.position.y = 1;
        treeGroup.add(cone);
        
        // Create trunk with bark texture
        const trunkRadius = coneRadius/3;
        const trunkHeight = 2;
        const trunkGeometry = new THREE.CylinderGeometry(trunkRadius, trunkRadius, trunkHeight, 5);
        const trunkMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x2b1810, // Dark brown
            metalness: 0,
            roughness: 1
        });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = -.8;
        treeGroup.add(trunk);
        
        // Position relative to track
        const x = Math.random() * TRACK_SEGMENT_LENGTH;
        const progress = x / TRACK_SEGMENT_LENGTH;
        const trackPoint = generateTrackCurve().getPointAt(progress);
        
        const side = Math.random() > 0.5 ? 1 : -1;
        const minDistance = 9;
        const randomExtra = Math.random() * 100;
        const z = trackPoint.z + (minDistance + randomExtra) * side;
        
        treeGroup.position.set(x, 2, z);

        trees.push(treeGroup);
        scene.add(treeGroup);
    }

    // Third set of taller trees
    for (let i = 0; i < 2000; i++) {
        const treeGroup = new THREE.Group();
        
        // Create cone (tree top)
        const coneHeight = 3; // Random height between 5 and 9
        const coneRadius = 1;
        const coneGeometry = new THREE.ConeGeometry(coneRadius, coneHeight, 8);
        const coneMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x1d3b1d, // Dark pine green
            metalness: 0,
            roughness: 1
        });
        const cone = new THREE.Mesh(coneGeometry, coneMaterial);
        cone.position.y = 1;
        treeGroup.add(cone);
        
        // Create trunk with bark texture
        const trunkRadius = coneRadius/3;
        const trunkHeight = 2;
        const trunkGeometry = new THREE.CylinderGeometry(trunkRadius, trunkRadius, trunkHeight, 5);
        const trunkMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x2b1810, // Dark brown
            metalness: 0,
            roughness: 1
        });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = -.8;
        treeGroup.add(trunk);
        
        // Position relative to track
        const x = Math.random() * TRACK_SEGMENT_LENGTH;
        const progress = x / TRACK_SEGMENT_LENGTH;
        const trackPoint = generateTrackCurve().getPointAt(progress);
        
        const side = Math.random() > 0.5 ? 1 : -1;
        const minDistance = 9;
        const randomExtra = Math.random() * 100;
        const z = trackPoint.z + (minDistance + randomExtra) * side;
        
        treeGroup.position.set(x, 2, z);

        trees.push(treeGroup);
        scene.add(treeGroup);
    }
}

function createMountains() {
    const mountainGeometry = new THREE.ConeGeometry(200, 70, 6);
    const mountainMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x3d2213, // Dark mountain green
        metalness: 0,
        roughness: 1
    });

    // Create initial set of large mountains
    for (let i = 0; i < NUM_MOUNTAINS; i++) {
        const x = Math.random() * TRACK_SEGMENT_LENGTH;
        const side = Math.random() > 0.5 ? 1 : -1;
        const z = side * (450 + Math.random() * 150);
        
        const mountain = new THREE.Mesh(mountainGeometry, mountainMaterial);
        mountain.position.set(x, 0, z);
        
        // Random rotation around Y axis
        mountain.rotation.y = Math.random() * Math.PI * 2;
        
        // Random scale variation for large mountains
        const scale = 1.5 + Math.random() * 1;
        mountain.scale.set(scale, scale, scale);
        
        scene.add(mountain);
        mountains.push(mountain);
    }

    // Create set of smaller mountains
    for (let i = 0; i < NUM_MOUNTAINS; i++) {
        const x = Math.random() * TRACK_SEGMENT_LENGTH;
        const y = Math.random() * TRACK_SEGMENT_LENGTH;
        const side = Math.random() > 0.5 ? 1 : -1;
        // Position closer to the track
        const z = side * (100 + Math.random() * 50);
        const mountain = new THREE.Mesh(mountainGeometry, mountainMaterial);
        mountain.position.set(x, 0, z);
        
        // Random rotation around Y axis
        mountain.rotation.y = Math.random() * Math.PI * 2;
        
        // Smaller scale variation for small mountains
        const scale = 0.1 + Math.random() * 0.2;
        mountain.scale.set(scale, scale, scale);
        
        scene.add(mountain);
        mountains.push(mountain);
    }
}

function createDeer() {
    const deerMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x3d2213,
        transparent: true,
        opacity: 0,
        metalness: 0,
        roughness: 1
    });
    
    const startTime = Date.now();
    const FADE_DURATION = 2000;
    
    for (let i = 0; i < NUM_DEER; i++) {
        const deerGroup = new THREE.Group();
        
        // Create body - 50% smaller
        const bodyGeometry = new THREE.BoxGeometry(0.6, 0.3, 0.2);
        const body = new THREE.Mesh(bodyGeometry, deerMaterial.clone());
        body.position.set(0, 0.55, 0);
        deerGroup.add(body);
        
        // Create neck
        const neckGeometry = new THREE.BoxGeometry(0.3, 0.1, 0.1);
        const neck = new THREE.Mesh(neckGeometry, deerMaterial.clone());
        neck.position.set(0.39, 0.4, 0);
        neck.rotateZ(Math.PI / .15);
        deerGroup.add(neck);

        // Create head - 50% smaller
        const headGeometry = new THREE.BoxGeometry(0.15, 0.3, 0.1);
        const head = new THREE.Mesh(headGeometry, deerMaterial.clone());
        head.position.set(0.45, 0.3, 0);
        deerGroup.add(head);
        
        // Create legs - 50% smaller
        const legGeometry = new THREE.BoxGeometry(0.075, 0.4, 0.075);
        const legPositions = [
            [0.2, 0.2, 0.075],   // Front right leg
            [0.2, 0.2, -0.075],  // Front left leg
            [-0.2, 0.2, 0.075],  // Back right leg
            [-0.2, 0.2, -0.075]  // Back left leg
        ];
        
        legPositions.forEach(pos => {
            const leg = new THREE.Mesh(legGeometry, deerMaterial.clone());
            leg.position.set(...pos);
            deerGroup.add(leg);
        });
        
        const x = i * DEER_SPACING;
        const progress = x / TRACK_SEGMENT_LENGTH;
        const curve = generateTrackCurve();
        const trackPoint = curve.getPointAt(progress);
        
        const side = Math.random() > 0.5 ? 1 : -1;
        const offset = Math.random() * 10;
        
        deerGroup.position.set(
            trackPoint.x,
            0,
            trackPoint.z + (side * offset)
        );
        
        deerGroup.rotateY(Math.random() * Math.PI * 2);
        
        // Add movement properties to deer
        deerGroup.userData = {
            originalX: trackPoint.x,
            originalZ: trackPoint.z + (side * offset),
            movementSpeed: 0.005 + Math.random() * 0.02,
            normalSpeed: 0.005 + Math.random() * 0.02,
            movementRange: 30,
            movementDirection: 1,
            side: side,
            isFleeing: false,
            startTime: startTime,
            fadeDuration: FADE_DURATION,
            hasCollided: false,  // Initialize collision tracking
            hasAlerted: false  // Initialize alert tracking
        };
        
        deer.push(deerGroup);
        scene.add(deerGroup);
    }
}

function initMouseControls() {
    const canvas = renderer.domElement;
    
    canvas.addEventListener('mousedown', (e) => {
        if (isInCockpit) return;
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
        if (isInCockpit) return;
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
        if (!isMouseDown) return;
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
        if (!isMouseDown) return;

        const deltaX = e.clientX - lastMouseX;
        const deltaY = e.clientY - lastMouseY;

        // Update camera angles
        cameraAngleHorizontal += deltaX * 0.005;
        
        // Limit vertical movement
        const verticalSensitivity = 0.002;
        const minVerticalAngle = 0;
        const maxVerticalAngle = 0.4;

        // Limit horizontal movement
        const horizontalSensitivity = 0.002;
        const minHorizontalAngle = -2.8;
        const maxHorizontalAngle = 2.8;
        
        cameraAngleHorizontal = Math.max(minHorizontalAngle, 
            Math.min(maxHorizontalAngle, 
                cameraAngleHorizontal - deltaX * horizontalSensitivity
            )
        );
        
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

function updateIntroAnimation() {
    const elapsed = Date.now() - introStartTime;
    const progress = Math.min(elapsed / INTRO_DURATION, 1);
    
    // Use powered sine easing for more dramatic acceleration
    const eased = Math.pow((1 - Math.cos(progress * Math.PI)) / 2, 1.5);
    
    // Show menu items when animation is 75% complete
    if (progress >= 0.75) {
        // Make top menu and its item visible
        const topMenu = document.querySelector('.top-menu');
        const topMenuItem = document.querySelector('.top-menu .menu-item');
        if (topMenu && !topMenu.classList.contains('visible')) {
            topMenu.classList.add('visible');
        }
        if (topMenuItem && !topMenuItem.classList.contains('visible')) {
            topMenuItem.classList.add('visible');
            topMenuItem.style.opacity = '1';  // Force opacity
            topMenuItem.style.transition = 'opacity 0.5s ease';  // Add transition
            topMenuItem.style.pointerEvents = 'auto';  // Ensure clickable
        }
    }
    
    // Start from a wide angle view
    const startRadius = 20;
    const endRadius = 4.5;
    const radius = startRadius + (endRadius - startRadius) * eased;
    
    // Rotate around and zoom in
    const angle = Math.PI * 1.75 * eased;
    const heightProgress = Math.sin(progress * Math.PI/2);
    
    camera.position.set(
        train.position.x + Math.cos(angle) * radius,
        8.3 - (heightProgress * 7.4),
        train.position.z + Math.sin(angle) * radius
    );
    
    camera.lookAt(train.position);
    
    if (progress >= 1) {
        introAnimationComplete = true;
        finalIntroPosition.copy(camera.position);
        finalIntroTarget.copy(train.position);
        
        const offset = finalIntroPosition.clone().sub(finalIntroTarget);
        cameraAngleHorizontal = Math.atan2(offset.z, offset.x);
        cameraAngleVertical = Math.asin(offset.y / offset.length());
        
        CAMERA_DISTANCE = offset.length();
    }
}

function updateCamera() {
    if (!introAnimationComplete) {
        updateIntroAnimation();
        return;
    }

    let finalPosition = new THREE.Vector3();
    let finalTarget = new THREE.Vector3();

    // Calculate both third-person and cockpit positions
    const cockpitPosition = train.position.clone().add(COCKPIT_OFFSET);
    const forward = new THREE.Vector3(1, 0, 0);
    forward.applyQuaternion(train.quaternion);
    const cockpitTarget = cockpitPosition.clone().add(forward.multiplyScalar(10));

    const horizontalDistance = CAMERA_DISTANCE * Math.cos(cameraAngleVertical);
    const verticalDistance = CAMERA_DISTANCE * Math.sin(cameraAngleVertical);
    const cameraOffset = new THREE.Vector3(
        horizontalDistance * Math.cos(cameraAngleHorizontal),
        verticalDistance,
        horizontalDistance * Math.sin(cameraAngleHorizontal)
    );
    const thirdPersonPosition = train.position.clone().add(cameraOffset);
    const thirdPersonTarget = train.position.clone();

    if (isTransitioningToCockpit) {
        const elapsed = Date.now() - transitionStartTime;
        const progress = Math.min(elapsed / COCKPIT_TRANSITION_DURATION, 1);
        
        // Use smooth step function for easing
        const t = progress * progress * (3 - 2 * progress);
        
        // Determine start and end positions based on transition direction
        const startPos = isInCockpit ? thirdPersonPosition : cockpitPosition;
        const endPos = isInCockpit ? cockpitPosition : thirdPersonPosition;
        const startTarget = isInCockpit ? thirdPersonTarget : cockpitTarget;
        const endTarget = isInCockpit ? cockpitTarget : thirdPersonTarget;
        
        // Interpolate between positions
        finalPosition.lerpVectors(startPos, endPos, t);
        finalTarget.lerpVectors(startTarget, endTarget, t);
        
        if (progress >= 1) {
            isTransitioningToCockpit = false;
        }
    } else {
        if (isInCockpit) {
            finalPosition.copy(cockpitPosition);
            finalTarget.copy(cockpitTarget);
        } else {
            finalPosition.copy(thirdPersonPosition);
            finalTarget.copy(thirdPersonTarget);
        }
    }

    // Apply camera shake if active
    if (isShaking) {
        const elapsedShakeTime = Date.now() - shakeStartTime;
        if (elapsedShakeTime < SHAKE_DURATION) {
            const progress = 1 - (elapsedShakeTime / SHAKE_DURATION);
            const intensity = SHAKE_INTENSITY * progress;
            
            const shakeOffset = new THREE.Vector3(
                (Math.random() - 0.5) * intensity,
                (Math.random() - 0.5) * intensity,
                (Math.random() - 0.5) * intensity
            );
            
            finalPosition.add(shakeOffset);
            finalTarget.add(shakeOffset);
        } else {
            isShaking = false;
        }
    }

    // Apply final camera position and target
    camera.position.copy(finalPosition);
    camera.lookAt(finalTarget);
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
    gradient.addColorStop(0, 'rgba(173, 169, 169,1)');
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
        blending: THREE.NormalBlending,  // Changed from AdditiveBlending to NormalBlending
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
    const sizes = smokeParticles.sizes;
    const stackLocalPos = new THREE.Vector3(1.5, 1.37, 0);

    for (let i = 0; i < NUM_PARTICLES; i++) {
        // Update positions with halved velocities
        positions[i * 3] += velocities[i * 3] * 0.5;         // X movement
        positions[i * 3 + 1] += velocities[i * 3 + 1] * (isWhistling ? 3 : 1); // Y movement (3x when whistling)
        positions[i * 3 + 2] += velocities[i * 3 + 2] * 0.5; // Z movement

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
    
    if (!gameEnded) {
        // Check for collision
        if (checkCollision()) {
            endGame();
            return;
        }
        
        // Update fog position to follow train
        if (scene.fog) {
            scene.fog.near = trainPosition - 100; // Start fog 100 units behind train
            scene.fog.far = trainPosition - 2000;  // Extend 2000 units back from fog start
        }
        
        // Update wheel rotations
        const deltaTime = 1/60; // Assuming 60fps
        const rotationAmount = WHEEL_ROTATION_SPEED * deltaTime;
        
        // Rotate train wheels
        trainWheels.forEach(wheel => {
            wheel.rotateY(rotationAmount);
        });
        
        // Rotate carriage wheels
        carriageWheels.forEach(wheelGroup => {
            wheelGroup.forEach(wheel => {
                wheel.rotateY(rotationAmount);
            });
        });

        // Apply touch momentum when not being touched
        if (!isMouseDown && introAnimationComplete) {
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
        
        // Calculate position and rotation along curve
        const progress = (trainPosition % TRACK_SEGMENT_LENGTH) / TRACK_SEGMENT_LENGTH;
        const curve = generateTrackCurve();
        const point = curve.getPointAt(progress);
        
        // Adjust point.x to match actual train position
        point.x += Math.floor(trainPosition / TRACK_SEGMENT_LENGTH) * TRACK_SEGMENT_LENGTH;
        
        // Update train position and rotation
        train.position.copy(point);
        train.position.y = 0.8;
        
        // Create a proper orientation matrix for the train
        const up = new THREE.Vector3(0, 1, 0);
        const forward = curve.getTangentAt(progress).normalize();
        const right = new THREE.Vector3().crossVectors(up, forward).normalize();
        up.crossVectors(forward, right);
        
        const rotationMatrix = new THREE.Matrix4().makeBasis(right, up, forward);
        train.setRotationFromMatrix(rotationMatrix);
        train.rotateY(-Math.PI / 2); // Changed from PI/2 to -PI/2 to reverse orientation
        
        // Update carriages with the same orientation logic
        carriages.forEach((carriage, index) => {
            const carriagePosition = trainPosition - ((index + 1) * 5.4) + .7  ; // Added -2 to bring all carriages closer to train
            const progress = (carriagePosition / TRACK_SEGMENT_LENGTH) % 1;
            
            const curve = generateTrackCurve();
            const point = curve.getPointAt(progress);
            
            carriage.position.copy(point);
            carriage.position.y = 0.8;
            
            // Apply same orientation to carriages
            const carriageForward = curve.getTangentAt(progress).normalize();
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
        
        // Update tree positions
        updateTrees();
        
        // Update mountain positions
        updateMountains();
        
        // Update deer positions
        updateDeer();
        
        // Update train sound volume during intro
        if (!introAnimationComplete) {
            const elapsed = Date.now() - introStartTime;
            const progress = Math.min(elapsed / INTRO_DURATION, 1);
            trainSound.volume = INITIAL_TRAIN_VOLUME + 
                (FINAL_TRAIN_VOLUME - INITIAL_TRAIN_VOLUME) * progress;
        }

        // Add sun animation
        if (isSunSetting && sunGroup) {
            if (sunGroup.position.y > FINAL_SUN_HEIGHT) {
                sunGroup.position.y -= SUN_DROP_SPEED;
                
                // Gradually decrease emissive intensity and light intensity
                const progress = (sunGroup.position.y - FINAL_SUN_HEIGHT) / (INITIAL_SUN_HEIGHT - FINAL_SUN_HEIGHT);
                const sunMesh = sunGroup.children[0];
                const sunLight = sunGroup.children[1];
                
                sunMesh.material.emissiveIntensity = 2 * progress;
                sunLight.intensity = progress;
                
                // Make sky darker as sun sets
               
            }
        }

        // Add sun scale animation
        if (sunGroup && sunScale !== targetSunScale) {
            // Smoothly interpolate current scale to target scale
            sunScale += (targetSunScale - sunScale) * SUN_SCALE_SPEED;
            sunGroup.scale.set(sunScale, sunScale, sunScale);
        }

        // Add sun shake animation
        if (isSunShaking && sunGroup) {
            const elapsedShakeTime = Date.now() - sunShakeStartTime;
            if (elapsedShakeTime < SUN_SHAKE_DURATION) {
                const progress = 1 - (elapsedShakeTime / SUN_SHAKE_DURATION);
                const intensity = SUN_SHAKE_INTENSITY * progress;
                
                // Apply random offset to sun position
                sunGroup.position.x = sunOriginalPosition.x + (Math.random() - 0.5) * intensity;
                sunGroup.position.y = sunOriginalPosition.y + (Math.random() - 0.5) * intensity;
                sunGroup.position.z = sunOriginalPosition.z + (Math.random() - 0.5) * intensity;
            } else {
                // Reset sun position and stop shaking
                isSunShaking = false;
                sunGroup.position.copy(sunOriginalPosition);
            }
        }
    }
    
    renderer.render(scene, camera);
}

// Handle window resizing
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Add track curve generation
function generateTrackCurve() {
    // Generate one segment of track that can seamlessly repeat
    const segmentPoints = [];
    segmentPoints.push(new THREE.Vector3(0, 0, 0));
    
    // Generate curve control points that end where they started (in Z)
    const segments = 10;
    const segmentLength = TRACK_SEGMENT_LENGTH / segments;
    
    for (let i = 1; i < segments; i++) {
        const x = i * segmentLength;
        const z = Math.sin(i * 2) * 8;
        segmentPoints.push(new THREE.Vector3(x, 0, z));
    }
    
    // Make sure last point matches Z of first point for seamless loop
    segmentPoints.push(new THREE.Vector3(TRACK_SEGMENT_LENGTH, 0, 0));
    return new THREE.CatmullRomCurve3(segmentPoints);
}

// Add this function to handle skipping the intro
function skipIntroAnimation() {
    if (!introAnimationComplete) {
        introAnimationComplete = true;
        
        // Set train sound to full volume immediately
        trainSound.volume = FINAL_TRAIN_VOLUME;
        
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
        
        // Fade in menu items when animation is skipped
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            item.classList.add('visible');
        });
    }
}

// Add a keyboard listener for switching views
document.addEventListener('keydown', (e) => {
    if (e.key === 'c' || e.key === 'C') {
        isInCockpit = !isInCockpit;  // Toggle the target view
        isTransitioningToCockpit = true;  // Start transition
        transitionStartTime = Date.now();  // Record start time
    }
    if (e.code === 'Space' && !isWhistling) {
        isWhistling = true;
        // Play horn sound
        hornSound.currentTime = 0;
        hornSound.play().catch(error => {
            console.log("Horn play failed:", error);
        });
        
        // Set timeout to stop whistle after 1 second
        whistleTimeout = setTimeout(() => {
            isWhistling = false;
            hornSound.pause();
        }, WHISTLE_DURATION);
    }
    if (e.key === 'z' || e.key === 'Z') {
        isHeadlightBright = !isHeadlightBright;
        // Toggle headlight intensity
        headlightMesh.material.emissiveIntensity = isHeadlightBright ? 2 : 1;
        headlightBeam.intensity = isHeadlightBright ? 10 : 5;
    }
});

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

// Empty function since we don't want to update trees anymore
function updateTrees() {}

// Empty function since we don't want to update mountains anymore
function updateMountains() {}

// Empty function since we don't want to update deer anymore
function updateDeer() {
    if (!hasStarted) return;
    
    const currentTime = Date.now();
    
    deer.forEach((deerGroup, index) => {
        // Check for collision with train first
        const distanceToTrain = Math.sqrt(
            Math.pow(deerGroup.position.x - train.position.x, 2) +
            Math.pow(deerGroup.position.z - train.position.z, 2)
        );
        
        // If deer is close enough to train and hasn't collided yet
        if (distanceToTrain < 2 && !deerGroup.userData.hasCollided) {
            deerGroup.userData.hasCollided = true;
            targetSunScale += SUN_SCALE_INCREASE;
            // Start camera shake
            isShaking = true;
            shakeStartTime = Date.now();
            
            // Play deer thud sound
            if (deerThudSound) {
                try {
                    deerThudSound.currentTime = 0;
                    deerThudSound.volume = 1.0;
                    deerThudSound.play().catch(error => {
                        console.log("Deer thud sound play failed:", error);
                    });
                    
                    // Increment collision count and play bigfoot sound after 1 second
                    deerCollisionCount++;
                    const bigfootVolume = Math.min(1.0, INITIAL_BIGFOOT_VOLUME + (BIGFOOT_VOLUME_INCREMENT * (deerCollisionCount - 1)));
                    
                    setTimeout(() => {
                        if (bigfootSound) {
                            bigfootSound.currentTime = 0;
                            bigfootSound.volume = bigfootVolume;
                            bigfootSound.play().catch(error => {
                                console.log("Bigfoot sound play failed:", error);
                            });
                            
                            // Start sun shaking when bigfoot sound plays
                            if (sunGroup) {
                                isSunShaking = true;
                                sunShakeStartTime = Date.now();
                                sunOriginalPosition.copy(sunGroup.position);
                            }
                        }
                    }, 3000);
                } catch (error) {
                    console.log("Error playing sounds:", error);
                }
            }

            // Start fade out animation for the deer
            deerGroup.children.forEach(mesh => {
                if (mesh.material) {
                    mesh.material.transparent = true;
                    // Animate opacity from current value to 0 over 1 second
                    const startOpacity = mesh.material.opacity;
                    const startTime = Date.now();
                    const fadeOutDuration = 1000; // 1 second

                    function fadeOut() {
                        const elapsed = Date.now() - startTime;
                        const progress = Math.min(elapsed / fadeOutDuration, 1);
                        
                        mesh.material.opacity = startOpacity * (1 - progress);
                        
                        if (progress < 1) {
                            requestAnimationFrame(fadeOut);
                        } else {
                            // Remove the deer from the scene and array when fully faded
                            scene.remove(deerGroup);
                            deer.splice(index, 1);
                        }
                    }
                    
                    fadeOut();
                }
            });
        }
        
        // Handle fade-in animation
        if (currentTime - deerGroup.userData.startTime <= deerGroup.userData.fadeDuration) {
            const progress = (currentTime - deerGroup.userData.startTime) / deerGroup.userData.fadeDuration;
            const opacity = Math.min(progress, 1);
            
            deerGroup.children.forEach(mesh => {
                if (mesh.material) {
                    mesh.material.opacity = opacity;
                }
            });
        }
        
        // Update neck and head positions based on whistle and distance
        const neck = deerGroup.children[1];  // Neck is the second child
        const head = deerGroup.children[2];  // Head is the third child
        
        // Only react to whistle if within range (40 units) and not already alerted
        if (isWhistling && !deerGroup.userData.hasAlerted && distanceToTrain <= 40) {
            // Alert position - head up looking around
            neck.position.set(0.29, 0.8, 0);
            neck.rotation.set(0, 0, Math.PI / 3);
            head.position.set(0.45, 0.9, 0);
            head.rotation.set(0, 0, Math.PI / 2);
            deerGroup.userData.hasAlerted = true;  // Mark that this deer has been alerted
            
            // Set a timeout to start fleeing after 1 second
            setTimeout(() => {
                deerGroup.userData.isFleeing = true;
            }, 1000);
        }
        
        if (deerGroup.userData.isFleeing) {
            const fleeSpeed = 0.2;
            // Use the deer's current forward direction based on its rotation
            const direction = new THREE.Vector3(1, 0, 0);
            direction.applyQuaternion(deerGroup.quaternion);
            
            const distanceFled = Math.abs(deerGroup.position.z - deerGroup.userData.originalZ);
            
            if (distanceFled < deerGroup.userData.movementRange) {
                // Move in the direction the deer is facing
                deerGroup.position.x += direction.x * fleeSpeed;
                deerGroup.position.z += direction.z * fleeSpeed;
            }
        }
    });
}

function createFallenTree() {
    // Create main trunk
    const trunkGeometry = new THREE.CylinderGeometry(.5, 1, 15, 12);
    const trunkMaterial = new THREE.MeshStandardMaterial({
        color: 0x2b1810, // Dark brown
        metalness: 0,
        roughness: 1
    });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    
    // Rotate to lay horizontally across track
    trunk.rotation.z = Math.PI / 2;
    trunk.rotation.y = Math.PI / 2;
    
    // Position at end of track
    const endPosition = generateTrackCurve().getPointAt(.95); // Place near end of track
    trunk.position.set(
        endPosition.x,
        .5, // Raise slightly above track
        endPosition.z
    );
    
    // Add some broken branches
    const numBranches = 6;
    for (let i = 0; i < numBranches; i++) {
        const branchLength = 2 + Math.random() * 3;
        const branchGeometry = new THREE.CylinderGeometry(0.3, 0.5, branchLength, 6);
        const branch = new THREE.Mesh(branchGeometry, trunkMaterial);
        
        // Position along trunk
        const offset = (Math.random() - 0.5) * 10;
        branch.position.set(0, offset, 0);
        
        // Random rotation
        branch.rotation.x = Math.random() * Math.PI;
        branch.rotation.z = (Math.random() - 0.5) * Math.PI / 2;
        
        trunk.add(branch);
    }
    
    // Add some foliage/broken leaves
    const foliageGeometry = new THREE.ConeGeometry(1, 2, 6);
    const foliageMaterial = new THREE.MeshStandardMaterial({
        color: 0x1d3b1d, // Dark pine green
        metalness: 0,
        roughness: 1
    });
    
    for (let i = 0; i < 8; i++) {
        const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
        const offset = (Math.random() - 0.5) * 12;
        foliage.position.set(
            (Math.random() - 0.5) * 2,
            offset,
            (Math.random() - 0.5) * 2
        );
        foliage.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );
        trunk.add(foliage);
    }
    
    scene.add(trunk);
    fallenTree = trunk; // Store reference to fallen tree
}

function checkCollision() {
    if (!fallenTree || gameEnded) return false;
    
    // Get train and tree positions
    const trainPos = train.position.clone();
    const treePos = fallenTree.position.clone();
    
    // Calculate distance between train and tree
    const distance = trainPos.distanceTo(treePos);
    
    // If distance is less than 3 units (approximate combined size of train and tree), collision occurred
    return distance < 3;
}

function endGame() {
    gameEnded = true;
    
    // Stop train movement
    TRAIN_SPEED = 0;
    
    // Stop and reset all audio elements
    const audioElements = [trainSound, ambientSound, hornSound];
    audioElements.forEach(audio => {
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
            audio.volume = 0;
        }
    });
    
    // Clear any pending whistle timeout
    if (whistleTimeout) {
        clearTimeout(whistleTimeout);
        isWhistling = false;
    }
    
    // Display game over message
    const gameOverDiv = document.createElement('div');
    gameOverDiv.style.position = 'fixed';
    gameOverDiv.style.top = '50%';
    gameOverDiv.style.left = '50%';
    gameOverDiv.style.transform = 'translate(-50%, -50%)';
    gameOverDiv.style.color = 'white';
    gameOverDiv.style.fontSize = '48px';
    gameOverDiv.style.fontFamily = 'Arial, sans-serif';
    gameOverDiv.style.textAlign = 'center';
    gameOverDiv.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
    gameOverDiv.innerHTML = 'Game Over<br>Train Crashed';
    document.body.appendChild(gameOverDiv);
}

// Add new function for creating the sun
function createSun() {
    const sunGeometry = new THREE.SphereGeometry(100, 32, 32);
    const sunMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B0000, // Dark red
        emissive: 0x8B0000,
        emissiveIntensity: 1,
        metalness: 0,
        roughness: 1
    });
    
    // Create sun group to keep sun and light together
    sunGroup = new THREE.Group();  // Changed to use global variable
    
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sunGroup.add(sun);
    
    // Add a point light at the exact center of the sun
    const sunLight = new THREE.PointLight(0x8B0000, 1, 200);
    sunLight.position.set(0, 0, 0);
    sunGroup.add(sunLight);
    
    // Position the entire sun group
    sunGroup.position.set(trainPosition / 0.1, INITIAL_SUN_HEIGHT, -1000);
    
    scene.add(sunGroup);
}

// Add function to start sun setting
function startSunset() {
    isSunSetting = true;
}

// Add function to start the train ride experience
function startTrainRide() {
    if (!hasStarted) {
        hasStarted = true;
        createDeer(); // Create deer when Train Ride is clicked
        // Start ambient sound
        ambientSound.play().catch(error => {
            console.log("Ambient sound play failed:", error);
        });
        // Start transition to cockpit view
        isInCockpit = true;
        isTransitioningToCockpit = true;
        transitionStartTime = Date.now();

        // Handle top menu item fade out
        const topMenuItem = document.querySelector('.top-menu .menu-item');
        if (topMenuItem) {
            // Set transition before changing classes to ensure smooth animation
            topMenuItem.style.transition = 'opacity 4s ease';
            // Force a reflow
            topMenuItem.offsetHeight;
            topMenuItem.classList.remove('visible');
            topMenuItem.classList.add('fade-out');
            // Ensure opacity change happens after class changes
            requestAnimationFrame(() => {
                topMenuItem.style.opacity = '0';
            });
        }

        // Show bottom menu items first
        const bottomMenuItems = document.querySelectorAll('.bottom-menu .menu-item');
        bottomMenuItems.forEach(item => {
            item.classList.add('visible');
        });

        // Then fade out all menu items after a short delay
        setTimeout(() => {
            const menuItems = document.querySelectorAll('.menu-item');
            menuItems.forEach(item => {
                if (!item.classList.contains('fade-out')) {  // Don't affect top menu item
                    item.style.transition = 'opacity 0.5s ease';
                    item.style.opacity = '0.1';  // Set to 10% opacity
                }
            });
        }, 500); // Wait 500ms before fading out
    }
}

// Add click handler to make top menu visible
document.addEventListener('click', () => {
    if (!introAnimationComplete) return;  // Only show after intro animation
    const topMenu = document.querySelector('.top-menu');
    const topMenuItem = document.querySelector('.top-menu .menu-item');
    if (topMenu && !topMenu.classList.contains('visible')) {
        topMenu.classList.add('visible');
    }
    if (topMenuItem && !topMenuItem.classList.contains('visible')) {
        topMenuItem.classList.add('visible');
        topMenuItem.style.opacity = '1';
        topMenuItem.style.pointerEvents = 'auto';
    }
});

function createStars() {
    const starsGeometry = new THREE.BufferGeometry();
    const starCount = 1000;
    const positions = new Float32Array(starCount * 3);
    
    for (let i = 0; i < starCount; i++) {
        // Create stars in a large hemisphere above the scene
        const theta = Math.random() * 2 * Math.PI;
        const phi = Math.acos(Math.random() * 2 - 1);
        const radius = 4000 + Math.random() * 1000; // Random distance between 2000 and 3000
        
        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = Math.abs(radius * Math.cos(phi)); // Keep stars above horizon
        positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    }
    
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const starsMaterial = new THREE.PointsMaterial({
        color: 0xFFFFFF,
        size: 1,
        sizeAttenuation: false,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });
    
    const starField = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(starField);
}
let scene, camera, renderer;
let controls = {};
let lights = {};
let screen;

function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);

    // Setup camera
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2.5, 2);
    camera.lookAt(0, 0.5, 0);

    // Setup renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x333333);
    scene.add(ambientLight);

    const mainLight = new THREE.SpotLight(0xffffff, 1);
    mainLight.position.set(0, 2, 1);
    mainLight.castShadow = true;
    scene.add(mainLight);

    createControlPanel();
    createInteractions();
    animate();
}

function createControlPanel() {
    // Create main panel
    const panelGeometry = new THREE.BoxGeometry(2, 2.4, 0.1);
    const panelMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x333333,
        roughness: 0.8
    });
    const panel = new THREE.Mesh(panelGeometry, panelMaterial);
    panel.rotation.x = -Math.PI / 4;
    scene.add(panel);

    // Create main screen
    const mainScreen = createScreen(0.8, 0.3);
    mainScreen.position.set(-0.4, 0.9, 0.05);
    panel.add(mainScreen);
    
    // Create launch button
    const launchButton = createButton(0.2, 0.1, 0xff0000);
    launchButton.position.set(0.6, 0.9, 0.05);
    panel.add(launchButton);
    controls.launch = launchButton;
    
    // Create row of buttons (b1-b4 and switch)
    const buttonRow = [-0.7, -0.35, 0, 0.35, 0.7];
    const buttonLabels = ['b1', 'b2', 'b3', 'b4', 'switch'];
    buttonRow.forEach((x, i) => {
        const button = createButton(0.15, 0.08);
        button.position.set(x, 0.5, 0.05);
        panel.add(button);
        controls[buttonLabels[i]] = button;
    });

    // Create vertical sliders
    const sliderPositions = [-0.6, -0.2, 0.2, 0.6];
    sliderPositions.forEach((x, i) => {
        const slider = createVerticalSlider();
        slider.position.set(x, 0, 0.05);
        panel.add(slider);
        controls[`slide${i + 1}`] = slider;
    });
    
    // Create bottom display areas
    const leftDisplay = createDisplayArea();
    leftDisplay.position.set(-0.4, -0.8, 0.05);
    panel.add(leftDisplay);
    
    const rightDisplay = createDisplayArea();
    rightDisplay.position.set(0.4, -0.8, 0.05);
    panel.add(rightDisplay);
}

function createButton(width = 0.15, height = 0.08) {
    const buttonGeometry = new THREE.BoxGeometry(width, height, 0.02);
    const buttonMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
    return new THREE.Mesh(buttonGeometry, buttonMaterial);
}

function createVerticalSlider() {
    const sliderGroup = new THREE.Group();

    // Slider track
    const trackGeometry = new THREE.BoxGeometry(0.02, 0.6, 0.02);
    const trackMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
    const track = new THREE.Mesh(trackGeometry, trackMaterial);
    sliderGroup.add(track);

    // Slider handle
    const handleGeometry = new THREE.BoxGeometry(0.06, 0.04, 0.03);
    const handleMaterial = new THREE.MeshPhongMaterial({ color: 0xcccccc });
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    sliderGroup.add(handle);

    return sliderGroup;
}

function createScreen(width = 0.4, height = 0.15) {
    const screenGeometry = new THREE.PlaneGeometry(width, height);
    const screenMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x00ff00,
        emissive: 0x003300
    });
    return new THREE.Mesh(screenGeometry, screenMaterial);
}

function createDisplayArea() {
    const displayGroup = new THREE.Group();
    
    // Create border
    const borderGeometry = new THREE.BoxGeometry(0.4, 0.3, 0.02);
    const borderMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
    const border = new THREE.Mesh(borderGeometry, borderMaterial);
    displayGroup.add(border);
    
    // Create inner display
    const displayGeometry = new THREE.PlaneGeometry(0.38, 0.28);
    const displayMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x222222,
        emissive: 0x111111
    });
    const display = new THREE.Mesh(displayGeometry, displayMaterial);
    display.position.z = 0.011;
    displayGroup.add(display);
    
    return displayGroup;
}

function createInteractions() {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    window.addEventListener('click', (event) => {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(scene.children, true);

        if (intersects.length > 0) {
            const object = intersects[0].object;
            // Handle interactions here
        }
    });
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

// Handle window resizing
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

init(); 
import bpy
import math
import bmesh
from mathutils import Vector

# Clear existing mesh objects
def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)

clear_scene()

# Create materials
def create_material(name, color, metallic=0, roughness=1):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    # Handle both RGB and RGBA color inputs
    if len(color) == 3:
        nodes["Principled BSDF"].inputs["Base Color"].default_value = (color[0], color[1], color[2], 1)
    else:
        nodes["Principled BSDF"].inputs["Base Color"].default_value = color
    nodes["Principled BSDF"].inputs["Metallic"].default_value = metallic
    nodes["Principled BSDF"].inputs["Roughness"].default_value = roughness
    return mat

# Create materials
body_material = create_material("BodyMaterial", (0.24, 0.24, 0.24))  # Dark gray
wheel_material = create_material("WheelMaterial", (0.1, 0.1, 0.1))   # Very dark gray
window_material = create_material("WindowMaterial", (0.33, 0.47, 0.53, 0.4))  # Blue-gray with transparency
accent_material = create_material("AccentMaterial", (0.3, 0.3, 0.3))  # Lighter gray

# Create the main body cylinder
bpy.ops.mesh.primitive_cylinder_add(radius=0.5, depth=2.5, location=(0.6, 0, 0.5))
body = bpy.context.active_object
body.rotation_euler[2] = math.radians(90)
body.data.materials.append(body_material)

# Create decorative rings
ring_positions = [-0.7, 0, 0.7]
for x_offset in ring_positions:
    bpy.ops.mesh.primitive_cylinder_add(radius=0.525, depth=0.1, location=(0.6 + x_offset, 0, 0.5))
    ring = bpy.context.active_object
    ring.rotation_euler[2] = math.radians(90)
    ring.data.materials.append(accent_material)

# Create smokestack (two parts)
# Base cylinder
bpy.ops.mesh.primitive_cylinder_add(radius=0.08, depth=0.3, location=(1.5, 0, 0.92))
stack_base = bpy.context.active_object
stack_base.data.materials.append(body_material)

# Top cylinder
bpy.ops.mesh.primitive_cylinder_add(radius=0.15, depth=0.2, location=(1.5, 0, 1.17))
stack_top = bpy.context.active_object
stack_top.scale = (1, 1, 1)
stack_top.data.materials.append(body_material)

# Create train cockpit
bpy.ops.mesh.primitive_cube_add(size=1, location=(-1.25, 0, 0.75))
cockpit = bpy.context.active_object
cockpit.scale = (1.2, 1.5, 1.2)
cockpit.rotation_euler[1] = math.radians(90)
cockpit.data.materials.append(body_material)

# Add windows to cockpit
# Front window
bpy.ops.mesh.primitive_plane_add(size=1, location=(-1.65, 0, 0.85))
front_window = bpy.context.active_object
front_window.scale = (0.6, 0.8, 1)
front_window.rotation_euler[1] = math.radians(90)
front_window.data.materials.append(window_material)

# Side windows
for z in [0.61, -0.61]:
    bpy.ops.mesh.primitive_plane_add(size=1, location=(-1.25, 0, z))
    side_window = bpy.context.active_object
    side_window.scale = (0.8, 0.4, 1)
    if z < 0:
        side_window.rotation_euler[1] = math.radians(180)
    side_window.data.materials.append(window_material)

# Create headlight
bpy.ops.mesh.primitive_cylinder_add(radius=0.2, depth=0.12, location=(1.83, 0, 0.5))
headlight = bpy.context.active_object
headlight.rotation_euler[2] = math.radians(90)
headlight_material = create_material("HeadlightMaterial", (1, 1, 0.8, 1), metallic=0.5, roughness=0.3)
headlight.data.materials.append(headlight_material)

# Create wheels
front_wheel_positions = [
    (1, 0.4, -0.37),
    (1, -0.4, -0.37),
    (1.7, 0.4, -0.37),
    (1.7, -0.4, -0.37)
]

rear_wheel_positions = [
    (-0.5, 0.4, -0.22),
    (-0.5, -0.4, -0.22),
    (-1.4, 0.4, -0.22),
    (-1.4, -0.4, -0.22)
]

# Create front wheels
for pos in front_wheel_positions:
    bpy.ops.mesh.primitive_cylinder_add(radius=0.3, depth=0.1, location=pos)
    wheel = bpy.context.active_object
    wheel.rotation_euler[0] = math.radians(90)
    wheel.data.materials.append(wheel_material)
    
    # Add axle if on right side
    if pos[1] < 0:
        bpy.ops.mesh.primitive_cylinder_add(radius=0.06, depth=0.9, location=pos)
        axle = bpy.context.active_object
        axle.rotation_euler[0] = math.radians(90)
        axle.data.materials.append(wheel_material)

# Create rear wheels (larger)
for pos in rear_wheel_positions:
    bpy.ops.mesh.primitive_cylinder_add(radius=0.45, depth=0.1, location=pos)
    wheel = bpy.context.active_object
    wheel.rotation_euler[0] = math.radians(90)
    wheel.data.materials.append(wheel_material)
    
    # Add axle if on right side
    if pos[1] < 0:
        bpy.ops.mesh.primitive_cylinder_add(radius=0.09, depth=0.9, location=pos)
        axle = bpy.context.active_object
        axle.rotation_euler[0] = math.radians(90)
        axle.data.materials.append(wheel_material)

# Create snow plow / shovel
def create_shovel():
    verts = [
        Vector((0, -0.3, 0.5)),    # Bottom left
        Vector((0, 0.3, 0.5)),     # Top left
        Vector((0.7, 0.43, 0)),    # Top point
        Vector((0, -0.3, -0.5)),   # Bottom right
        Vector((0, 0.3, -0.5)),    # Top right
    ]
    
    faces = [
        (0, 1, 2),    # Left triangle
        (3, 4, 2),    # Right triangle
        (0, 3, 2),    # Bottom triangle
    ]
    
    mesh = bpy.data.meshes.new("shovel")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    
    obj = bpy.data.objects.new("shovel", mesh)
    bpy.context.collection.objects.link(obj)
    obj.location = (1.99, 0, -0.3)
    obj.rotation_euler[0] = math.radians(180)
    
    shovel_material = create_material("ShovelMaterial", (0.545, 0.545, 0.545, 1))
    obj.data.materials.append(shovel_material)
    return obj

create_shovel()

# Optional: join all parts
bpy.ops.object.select_all(action='SELECT')
bpy.context.view_layer.objects.active = body
bpy.ops.object.join()

# Adjust final position
bpy.context.active_object.location.y = 0.8  # Raise to match Three.js model 
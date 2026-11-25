
import bpy, math, os, random
from mathutils import Vector

CAP = 0.72

def hexc(h, a=1.0):
    h = h.lstrip("#")
    return (int(h[0:2],16)/255.0, int(h[2:4],16)/255.0, int(h[4:6],16)/255.0, a)

def rgb(h):
    c = hexc(h)
    return (c[0], c[1], c[2])

def purge():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def find_font(names):
    roots = ["/tmp/vidgen/fonts", "/usr/share/fonts", "/usr/local/share/fonts", "/opt/conda/fonts"]
    for root in roots:
        if not os.path.isdir(root):
            continue
        for dp, dn, fn in os.walk(root):
            for f in fn:
                if f in names:
                    return os.path.join(dp, f)
    return None

def load_font(names):
    p = find_font(names)
    if not p:
        return None, "<none>"
    return bpy.data.fonts.load(p), p

def mat_emit(name, h, strength=1.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    em = nt.nodes.new("ShaderNodeEmission")
    em.inputs["Color"].default_value = hexc(h)
    em.inputs["Strength"].default_value = strength
    nt.links.new(em.outputs["Emission"], out.inputs["Surface"])
    return m

def mat_diff(name, h, rough=0.85, spec=0.15):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes.get("Principled BSDF")
    b.inputs["Base Color"].default_value = hexc(h)
    b.inputs["Roughness"].default_value = rough
    if "Specular IOR Level" in b.inputs:
        b.inputs["Specular IOR Level"].default_value = spec
    elif "Specular" in b.inputs:
        b.inputs["Specular"].default_value = spec
    return m

def mat_backdrop(name, stops, z0=0.0, z1=150.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    mix = nt.nodes.new("ShaderNodeMixShader")
    lp = nt.nodes.new("ShaderNodeLightPath")
    tr = nt.nodes.new("ShaderNodeBsdfTransparent")
    em = nt.nodes.new("ShaderNodeEmission")
    geo = nt.nodes.new("ShaderNodeNewGeometry")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    mr = nt.nodes.new("ShaderNodeMapRange")
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    mr.inputs["From Min"].default_value = z0
    mr.inputs["From Max"].default_value = z1
    nt.links.new(geo.outputs["Position"], sep.inputs["Vector"])
    nt.links.new(sep.outputs["Z"], mr.inputs["Value"])
    nt.links.new(mr.outputs["Result"], ramp.inputs["Fac"])
    els = ramp.color_ramp.elements
    els[0].position = stops[0][0]
    els[0].color = hexc(stops[0][1])
    els[1].position = stops[-1][0]
    els[1].color = hexc(stops[-1][1])
    for pos, h in stops[1:-1]:
        e = els.new(pos)
        e.color = hexc(h)
    nt.links.new(ramp.outputs["Color"], em.inputs["Color"])
    em.inputs["Strength"].default_value = 1.0
    nt.links.new(lp.outputs["Is Camera Ray"], mix.inputs["Fac"])
    nt.links.new(tr.outputs["BSDF"], mix.inputs[1])
    nt.links.new(em.outputs["Emission"], mix.inputs[2])
    nt.links.new(mix.outputs["Shader"], out.inputs["Surface"])
    return m

def add_backdrop(stops, y=250.0, size=900.0, z0=0.0, z1=150.0):
    m = mat_backdrop("backdrop", stops, z0, z1)
    bpy.ops.mesh.primitive_plane_add(size=1.0, location=(0, y, 0))
    o = bpy.context.object
    o.name = "Backdrop"
    o.scale = (size, size, 1.0)
    o.rotation_euler = (math.pi/2, 0, 0)
    o.data.materials.append(m)
    return o

def add_box(name, loc, dims, mat, rot=(0,0,0), bev=0.02):
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=loc, rotation=rot)
    o = bpy.context.object
    o.name = name
    o.scale = dims
    o.data.materials.append(mat)
    if bev and bev > 0:
        md = o.modifiers.new("bev", "BEVEL")
        md.width = bev
        md.segments = 2
        md.limit_method = "ANGLE"
    return o

def add_cyl(name, loc, r, depth, mat, verts=16, rot=(0,0,0)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=depth, location=loc, rotation=rot)
    o = bpy.context.object
    o.name = name
    o.data.materials.append(mat)
    return o

def add_pyr(name, loc, r, depth, mat, rot_z=0.0, sy=1.0):
    bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=r, radius2=0.0, depth=depth, location=loc, rotation=(0,0,rot_z))
    o = bpy.context.object
    o.name = name
    o.scale = (1.0, sy, 1.0)
    o.data.materials.append(mat)
    return o

def add_text(name, body, font, size, mat, loc=(0,0,0), align_x="CENTER", align_y="CENTER", sp=1.0, rot=(0,0,0)):
    cu = bpy.data.curves.new(name, type="FONT")
    cu.body = body
    if font:
        cu.font = font
    cu.size = size
    cu.align_x = align_x
    cu.align_y = align_y
    cu.space_character = sp
    cu.resolution_u = 6
    cu.extrude = 0.0
    o = bpy.data.objects.new(name, cu)
    bpy.context.collection.objects.link(o)
    o.location = loc
    o.rotation_euler = rot
    o.data.materials.append(mat)
    return o

def add_cam(loc, target, lens=50.0, sensor=36.0):
    cd = bpy.data.cameras.new("Cam")
    cd.lens = lens
    cd.sensor_width = sensor
    cd.sensor_height = sensor
    cd.sensor_fit = "VERTICAL"
    cd.clip_start = 0.05
    cd.clip_end = 1500.0
    cam = bpy.data.objects.new("Cam", cd)
    bpy.context.collection.objects.link(cam)
    cam.location = loc
    d = Vector(target) - Vector(loc)
    cam.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
    bpy.context.scene.camera = cam
    return cam

def frame_h(cam, d):
    return d * cam.data.sensor_height / cam.data.lens

def cam_text(cam, name, body, font, px, xf, yf, mat, d=1.2, sp=1.0, align="CENTER"):
    fh = frame_h(cam, d)
    fw = fh * 9.0 / 16.0
    size = (px / 1920.0) * fh / CAP
    o = add_text(name, body, font, size, mat, loc=(0,0,0), align_x=align, sp=sp)
    o.parent = cam
    o.matrix_parent_inverse.identity()
    o.location = (xf * fw, yf * fh, -d)
    return o

def world_text(name, body, font, px, x, z, mat, cam, dist, align="CENTER", sp=1.0, y=-0.02):
    # Kamera menghadap +Y, jadi teks harus diputar 90 derajat pada X
    # supaya normalnya (local +Z) menunjuk -Y, ke arah kamera.
    fh = frame_h(cam, dist)
    size = (px / 1920.0) * fh / CAP
    return add_text(name, body, font, size, mat, loc=(x, y, z), align_x=align, sp=sp,
                    rot=(math.pi / 2.0, 0.0, 0.0))

def fit(o, cam, d, max_frac=0.9):
    bpy.context.view_layer.update()
    fh = frame_h(cam, d)
    fw = fh * 9.0 / 16.0
    w = o.dimensions.x
    if w > 0 and w > max_frac * fw:
        s = (max_frac * fw) / w
        o.scale = (s, s, s)
    bpy.context.view_layer.update()
    return o

def add_world(color, strength=0.35):
    w = bpy.data.worlds.new("W")
    bpy.context.scene.world = w
    w.use_nodes = True
    bg = w.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = hexc(color)
    bg.inputs["Strength"].default_value = strength
    return w

def add_sun(origin, target, energy=4.0, color="#FFE2BC", angle_deg=5.0):
    ld = bpy.data.lights.new("Sun", type="SUN")
    ld.energy = energy
    ld.color = rgb(color)
    ld.angle = math.radians(angle_deg)
    o = bpy.data.objects.new("Sun", ld)
    bpy.context.collection.objects.link(o)
    o.location = origin
    dd = Vector(target) - Vector(origin)
    o.rotation_euler = dd.to_track_quat("-Z", "Y").to_euler()
    return o

def add_disc(name, loc, r, mat, cam):
    bpy.ops.mesh.primitive_circle_add(vertices=64, radius=r, fill_type="NGON", location=loc)
    o = bpy.context.object
    o.name = name
    o.data.materials.append(mat)
    dd = Vector(cam.location) - Vector(loc)
    o.rotation_euler = dd.to_track_quat("Z", "Y").to_euler()
    return o

def add_ground(mat, size=900.0, z=0.0):
    bpy.ops.mesh.primitive_plane_add(size=size, location=(0,0,z))
    o = bpy.context.object
    o.name = "Ground"
    o.data.materials.append(mat)
    return o

def city_row(prefix, y, x0, x1, hmin, hmax, wmin, wmax, mat, seed, depth=3.0, bev=0.03):
    rng = random.Random(seed)
    x = x0
    i = 0
    while x < x1:
        w = rng.uniform(wmin, wmax)
        h = rng.uniform(hmin, hmax)
        dy = rng.uniform(-0.6, 0.6)
        add_box(prefix + str(i), (x + w*0.5, y + dy, h*0.5), (w*0.92, depth, h), mat, bev=bev)
        x += w + rng.uniform(0.4, 1.6)
        i += 1

def setup(w=1080, h=1920, fps=30, spp=32):
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    sc.cycles.device = "GPU"
    sc.cycles.samples = spp
    sc.cycles.use_adaptive_sampling = True
    sc.cycles.adaptive_threshold = 0.01
    sc.cycles.use_denoising = True
    sc.cycles.denoiser = "OPENIMAGEDENOISE"
    sc.cycles.denoising_use_gpu = True
    sc.cycles.max_bounces = 4
    sc.cycles.diffuse_bounces = 2
    sc.cycles.glossy_bounces = 2
    sc.cycles.transmission_bounces = 2
    sc.cycles.transparent_max_bounces = 4
    sc.render.use_persistent_data = True
    sc.render.resolution_x = w
    sc.render.resolution_y = h
    sc.render.resolution_percentage = 100
    sc.render.fps = fps
    sc.render.fps_base = 1.0
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_mode = "RGB"
    sc.render.image_settings.color_depth = "8"
    sc.render.image_settings.compression = 15
    sc.render.film_transparent = False
    sc.view_settings.view_transform = "Standard"
    try:
        sc.view_settings.look = "None"
    except Exception:
        pass
    sc.view_settings.exposure = 0.0
    sc.view_settings.gamma = 1.0
    p = bpy.context.preferences.addons["cycles"].preferences
    p.compute_device_type = "CUDA"
    p.get_devices()
    for d in p.devices:
        d.use = (d.type == "CUDA")
    print("SETUP spp", sc.cycles.samples, "dn_gpu", sc.cycles.denoising_use_gpu,
          "res", sc.render.resolution_x, sc.render.resolution_y, flush=True)


SANS_FONTS = ["LiberationSans-Bold.ttf", "DejaVuSans-Bold.ttf",
              "NotoSans-Bold.ttf", "FreeSansBold.ttf"]
SERIF_FONTS = ["DejaVuSerif-Italic.ttf", "LiberationSerif-Italic.ttf",
               "NotoSerif-Italic.ttf"]


def fonts():
    a, pa = load_font(SANS_FONTS)
    b, pb = load_font(SERIF_FONTS)
    print("FONT sans", pa, flush=True)
    print("FONT serif", pb, flush=True)
    return a, b

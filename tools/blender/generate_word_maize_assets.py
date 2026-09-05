"""Blender 4.x starter-asset generator for Word Maize.

Run: blender --background --python tools/blender/generate_word_maize_assets.py
Outputs a review .blend, modular GLBs, and an alignment manifest.
"""
from __future__ import annotations
import json, math
from pathlib import Path
import bpy

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "assets/word-maize/models"
ROWS, COLS = 7, 10
COB_H, R_BOTTOM, R_TOP, PLAY_H = 5.4, 1.20, .94, 3.95
KW, KH, KD, SOCKET_D, LETTER_D = .64, .58, .26, .15, .145

def mat(name, rgba, rough):
    m=bpy.data.materials.new(name); m.diffuse_color=rgba; m.use_nodes=True
    b=m.node_tree.nodes.get("Principled BSDF"); b.inputs["Base Color"].default_value=rgba
    b.inputs["Roughness"].default_value=rough; b.inputs["Specular IOR Level"].default_value=.38
    return m

def smooth(o):
    if o.type=="MESH":
        for p in o.data.polygons: p.use_smooth=True

def box(name, dims, bevel, material):
    bpy.ops.mesh.primitive_cube_add(); o=bpy.context.object; o.name=name; o.dimensions=dims
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    mod=o.modifiers.new("SoftBevel","BEVEL"); mod.width=bevel; mod.segments=5
    bpy.context.view_layer.objects.active=o; bpy.ops.object.modifier_apply(modifier=mod.name)
    smooth(o); o.data.materials.append(material); return o

def kernel(gold):
    # Local -Y is the visible/front direction. Rear mounting face is near Y=0.
    o=box("Kernel",(KW,KD,KH),.13,gold); o.location.y=-KD/2
    for v in o.data.vertices:
        if v.co.z>KH*.25: v.co.x*=.92
    a=bpy.data.objects.new("LetterAnchor",None); bpy.context.collection.objects.link(a)
    a.empty_display_size=.08; a.location=(0,-(KD+LETTER_D),0); a.parent=o
    return o

def socket(rim_mat, cavity_mat):
    root=bpy.data.objects.new("Socket",None); bpy.context.collection.objects.link(root)
    rim=box("SocketRim",(KW*.98,.09,KH*.98),.125,rim_mat); rim.location.y=-.035; rim.parent=root
    cavity=box("SocketCavity",(KW*.73,SOCKET_D,KH*.73),.105,cavity_mat)
    cavity.location.y=-(SOCKET_D/2+.055); cavity.parent=root; return root

def clone(src,name):
    o=src.copy(); o.data=src.data.copy() if src.data else None; o.name=name
    bpy.context.collection.objects.link(o)
    for child in src.children:
        c=clone(child,f"{name}_{child.name}"); c.parent=o; c.matrix_local=child.matrix_local.copy()
    return o

def radius(z):
    t=(z+PLAY_H/2)/PLAY_H
    return R_BOTTOM+(R_TOP-R_BOTTOM)*t+.10*math.sin(math.pi*t)

def place(o,row,col):
    theta=2*math.pi*col/COLS; z=-PLAY_H/2+row*PLAY_H/(ROWS-1); r=radius(z)
    o.location=(r*math.sin(theta),-r*math.cos(theta),z); o.rotation_euler=(0,0,-theta)
    o["wordMaizeRow"]=row; o["wordMaizeColumn"]=col

def hierarchy(o):
    result=[o]
    for c in o.children: result+=hierarchy(c)
    return result

def export(objects,name):
    bpy.ops.object.select_all(action="DESELECT")
    for o in objects: o.hide_set(False); o.select_set(True)
    bpy.context.view_layer.objects.active=objects[0]
    bpy.ops.export_scene.gltf(filepath=str(OUT/name),export_format="GLB",use_selection=True,
        export_apply=True,export_yup=True,export_extras=True)

def main():
    OUT.mkdir(parents=True,exist_ok=True)
    bpy.ops.object.select_all(action="SELECT"); bpy.ops.object.delete(use_global=False)
    gold=mat("Kernel_Golden",(1,.47,.025,1),.24); rim=mat("Socket_Rim",(.78,.27,.018,1),.34)
    dark=mat("Socket_Cavity",(.12,.025,.008,1),.58); core=mat("Cob_Core",(.34,.095,.018,1),.70)
    green=mat("Husk_Green",(.10,.31,.025,1),.48); silkmat=mat("Silk_Gold",(.72,.44,.10,1),.50)
    root=bpy.data.objects.new("WordMaizeCob",None); bpy.context.collection.objects.link(root)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=48,ring_count=24); body=bpy.context.object; body.name="CobBody"
    body.scale=(R_BOTTOM*.92,R_BOTTOM*.92,COB_H/2); bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    smooth(body); body.data.materials.append(core); body.parent=root
    husks=bpy.data.objects.new("Husks",None); bpy.context.collection.objects.link(husks); husks.parent=root
    for i,ang in enumerate((-58,-29,29,58)):
        bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=12); leaf=bpy.context.object; leaf.name=f"Husk_{i+1:02d}"
        leaf.scale=(.24,.10,1.55); leaf.location=(math.sin(math.radians(ang))*.86,.16,-2.45)
        leaf.rotation_euler=(math.radians(-8),math.radians(ang),math.radians(-ang*.35))
        bpy.ops.object.transform_apply(location=False,rotation=False,scale=True); smooth(leaf); leaf.data.materials.append(green); leaf.parent=husks
    silk=bpy.data.objects.new("Silk",None); bpy.context.collection.objects.link(silk); silk.parent=root
    for i in range(12):
        t=2*math.pi*i/12; curve=bpy.data.curves.new(f"SilkCurve_{i:02d}","CURVE")
        curve.dimensions="3D"; curve.bevel_depth=.018; curve.bevel_resolution=3; sp=curve.splines.new("BEZIER"); sp.bezier_points.add(2)
        coords=((.16*math.sin(t),-.16*math.cos(t),2.62),(.4*math.sin(t),-.4*math.cos(t),2.96),(.72*math.sin(t+.25),-.72*math.cos(t+.25),3.13))
        for p,co in zip(sp.bezier_points,coords): p.co=co; p.handle_left_type="AUTO"; p.handle_right_type="AUTO"
        ob=bpy.data.objects.new(f"Silk_{i+1:02d}",curve); bpy.context.collection.objects.link(ob); curve.materials.append(silkmat); ob.parent=silk
    ks=kernel(gold); ks.name="Kernel_Source"; ss=socket(rim,dark); ss.name="Socket_Source"
    grid=bpy.data.objects.new("PlayableGridPreview",None); bpy.context.collection.objects.link(grid); grid.parent=root
    for row in range(ROWS):
        for col in range(COLS):
            for src,prefix in ((ss,"Socket"),(ks,"Kernel")):
                o=clone(src,f"{prefix}_r{row:02d}_c{col:02d}"); o.parent=grid; place(o,row,col)
    # Camera/light exist only in review .blend and are not exported.
    bpy.ops.object.camera_add(location=(0,-10.8,.1),rotation=(math.radians(90),0,0)); cam=bpy.context.object
    cam.name="ReviewCamera"; cam.data.type="ORTHO"; cam.data.ortho_scale=7.25; bpy.context.scene.camera=cam
    for name,loc,energy,color,size in (("Warm_Key",(-4,-5,6),950,(1,.72,.42),5),("Soft_Fill",(4,-3,1.5),500,(.55,.7,1),4)):
        bpy.ops.object.light_add(type="AREA",location=loc); l=bpy.context.object; l.name=name; l.data.energy=energy; l.data.color=color; l.data.shape="DISK"; l.data.size=size
    scene=bpy.context.scene; scene.render.engine="BLENDER_EEVEE"; scene.render.resolution_x=900; scene.render.resolution_y=1400
    scene.render.image_settings.file_format="PNG"; scene.render.image_settings.color_mode="RGBA"; scene.render.film_transparent=True
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/"word-maize-cob-review.blend"))
    export(hierarchy(ks),"kernel.glb"); export(hierarchy(ss),"socket.glb"); export([body],"cob-body.glb"); export(hierarchy(husks)+hierarchy(silk),"cob-decoration.glb")
    manifest={"schemaVersion":1,"units":"meters","coordinateSystem":{"up":"+Z","kernelFront":"-Y","cobRotationAxis":"+Z"},
      "referenceGrid":{"rows":ROWS,"columns":COLS},"supportedLevelColumns":[8,9,10],
      "kernel":{"width":KW,"height":KH,"depth":KD,"node":"Kernel_Source","letterAnchorNode":"LetterAnchor"},
      "socket":{"depth":SOCKET_D,"node":"Socket_Source"},"cob":{"height":COB_H,"baseRadius":R_BOTTOM,"topRadius":R_TOP,"playableHeight":PLAY_H},
      "placement":{"theta":"2 * PI * column / columns","z":"-playableHeight/2 + row * playableHeight/(rows-1)","appRotationUnits":"columns","degreesPerColumn":"360 / columns"},
      "files":{"kernel":"kernel.glb","socket":"socket.glb","cobBody":"cob-body.glb","decoration":"cob-decoration.glb"}}
    (OUT/"word-maize-models.json").write_text(json.dumps(manifest,indent=2)+"\n")
    print(f"Word Maize assets written to {OUT}")

if __name__=="__main__": main()

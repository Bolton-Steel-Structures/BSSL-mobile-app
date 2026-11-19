/* iCONSTRUCTE Site: 3D model viewer (roadmap 5.8, test version).
 * Built into vendor/model-viewer.js with esbuild (see viewer/build.sh). three.js (MIT) draws, web-ifc (MPL-2.0) reads the IFC.
 * window.ICModel.open(el, { url, name, key, canMark, user, onStatus }) shows the model in el and returns a controller.
 * Status per part (GlobalId): "erected" or "checked", kept by the caller (demo: on this phone only).
 */
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as WebIFC from "web-ifc";

const COL = { none: 0xa7adb5, erected: 0xf5a623, checked: 0x2e9e44, selected: 0x1e88e5, bolt: 0x555555 };
const HEAVY_KG = 5000; // one part heavier than this is flagged: usually a reference / placeholder object in the model

let api = null;
async function ifcApi(wasmPath) {
  if (api) return api;
  api = new WebIFC.IfcAPI();
  api.SetWasmPath(wasmPath, true);
  await api.Init();
  return api;
}

function val(p) { return p && p.value !== undefined ? p.value : p; }

async function readParts(ifc, modelID) {
  const parts = new Map();
  const want = [WebIFC.IFCBEAM, WebIFC.IFCCOLUMN, WebIFC.IFCPLATE, WebIFC.IFCMEMBER, WebIFC.IFCMECHANICALFASTENER, WebIFC.IFCELEMENTASSEMBLY, WebIFC.IFCDISCRETEACCESSORY];
  const kind = { [WebIFC.IFCBEAM]: "Beam", [WebIFC.IFCCOLUMN]: "Column", [WebIFC.IFCPLATE]: "Plate", [WebIFC.IFCMEMBER]: "Member", [WebIFC.IFCMECHANICALFASTENER]: "Bolts", [WebIFC.IFCELEMENTASSEMBLY]: "Assembly", [WebIFC.IFCDISCRETEACCESSORY]: "Fitting" };
  for (const t of want) {
    const ids = ifc.GetLineIDsWithType(modelID, t);
    for (let i = 0; i < ids.size(); i++) {
      const id = ids.get(i), line = ifc.GetLine(modelID, id);
      parts.set(id, { id, guid: val(line.GlobalId), kind: kind[t], name: val(line.Name) || "", profile: val(line.ObjectType) || val(line.Description) || "", tag: val(line.Tag) || "", props: {}, material: "" });
    }
  }
  // property sets (Tekla Common / Tekla Quantity / Tekla Bolt / Tekla Assembly …)
  for (const p of parts.values()) {
    try {
      const sets = await ifc.properties.getPropertySets(modelID, p.id, true);
      for (const s of sets || []) for (const h of s.HasProperties || []) {
        const n = val(h.Name), v = val(h.NominalValue);
        if (n && v !== undefined && v !== null && v !== "") p.props[n] = v;
      }
    } catch (e) { /* no properties: keep the part */ }
    try {
      const mats = await ifc.properties.getMaterialsProperties(modelID, p.id, true);
      if (mats && mats[0]) p.material = val(mats[0].Name) || "";
    } catch (e) { /* none */ }
    p.weight = Number(p.props.Weight || 0);
    p.length = Number(p.props.Length || 0);
    p.mark = p.props["Assembly mark"] || p.props["ASSEMBLY_POS"] || p.props["Assembly position"] || p.props["Part mark"] || p.props["PART_POS"] || p.props["Preliminary mark"] || "";
    p.phase = p.props.Phase !== undefined ? String(p.props.Phase) : "";
    p.heavy = p.kind !== "Bolts" && p.weight > HEAVY_KG;
  }
  return parts;
}

export async function open(el, opts) {
  el.innerHTML = '<div class="mv-load">Reading the model …</div>';
  const ifc = await ifcApi(opts.wasmPath || "vendor/");
  const buf = new Uint8Array(await (await fetch(opts.url)).arrayBuffer());
  const t0 = performance.now();
  const modelID = ifc.OpenModel(buf, { COORDINATE_TO_ORIGIN: true });
  const parts = await readParts(ifc, modelID);

  // scene
  el.innerHTML = "";
  const wrap = document.createElement("div"); wrap.className = "mv-canvas"; el.appendChild(wrap);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  wrap.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8899aa, 1.1));
  const sun = new THREE.DirectionalLight(0xffffff, 1.2); sun.position.set(30, 60, 40); scene.add(sun);
  const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 5000);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  const meshes = new Map(); // expressID -> THREE.Mesh
  ifc.StreamAllMeshes(modelID, (fm) => {
    const p = parts.get(fm.expressID);
    if (!p) return;
    const geoms = [];
    for (let i = 0; i < fm.geometries.size(); i++) {
      const pg = fm.geometries.get(i), g = ifc.GetGeometry(modelID, pg.geometryExpressID);
      const v = ifc.GetVertexArray(g.GetVertexData(), g.GetVertexDataSize()), ix = ifc.GetIndexArray(g.GetIndexData(), g.GetIndexDataSize());
      const pos = new Float32Array(v.length / 2), nor = new Float32Array(v.length / 2);
      for (let k = 0, j = 0; k < v.length; k += 6, j += 3) { pos[j] = v[k]; pos[j + 1] = v[k + 1]; pos[j + 2] = v[k + 2]; nor[j] = v[k + 3]; nor[j + 1] = v[k + 4]; nor[j + 2] = v[k + 5]; }
      const bg = new THREE.BufferGeometry();
      bg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      bg.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
      bg.setIndex(new THREE.BufferAttribute(ix, 1));
      bg.applyMatrix4(new THREE.Matrix4().fromArray(pg.flatTransformation));
      geoms.push(bg);
      g.delete && g.delete();
    }
    if (!geoms.length) return;
    const merged = geoms.length === 1 ? geoms[0] : mergeGeometries(geoms);
    const mesh = new THREE.Mesh(merged, new THREE.MeshLambertMaterial({ color: COL.none }));
    mesh.userData.id = fm.expressID;
    scene.add(mesh); meshes.set(fm.expressID, mesh);
  });
  const loadMs = Math.round(performance.now() - t0);
  ifc.CloseModel(modelID);

  // fit (to the steel, leaving out the heavy reference parts)
  const box = new THREE.Box3();
  for (const [id, m] of meshes) if (!parts.get(id).heavy) box.expandByObject(m);
  if (box.isEmpty()) for (const m of meshes.values()) box.expandByObject(m);
  function fit(b) {
    const c = b.getCenter(new THREE.Vector3()), s = b.getSize(new THREE.Vector3()).length() || 1;
    const vf = THREE.MathUtils.degToRad(camera.fov), hf = 2 * Math.atan(Math.tan(vf / 2) * camera.aspect);
    const dist = (s / 2) / Math.sin(Math.min(vf, hf) / 2) * 1.05; // whole model in view, portrait or landscape
    controls.target.copy(c);
    camera.position.copy(c).add(new THREE.Vector3(0.7, 0.5, 0.9).normalize().multiplyScalar(dist));
    camera.near = s / 1000; camera.far = s * 20; camera.updateProjectionMatrix(); controls.update();
  }

  // state
  const status = opts.status || {}; // guid -> {s, by, at}
  const sel = new Set();
  let showBolts = true;
  const hidden = new Set();
  let showHeavy = false; // parts over HEAVY_KG (reference slabs / placeholders) are hidden until asked for
  function colourOf(p) {
    if (sel.has(p.id)) return COL.selected;
    if (p.kind === "Bolts") return COL.bolt;
    const s = status[p.guid];
    return s ? COL[s.s] : COL.none;
  }
  function paint() {
    for (const [id, m] of meshes) {
      const p = parts.get(id);
      m.material.color.setHex(colourOf(p));
      m.visible = !hidden.has(id) && (showBolts || p.kind !== "Bolts") && (showHeavy || !p.heavy);
    }
  }
  paint();

  // tap to select (a drag rotates)
  const ray = new THREE.Raycaster(), pt = new THREE.Vector2();
  let down = null;
  renderer.domElement.addEventListener("pointerdown", (e) => { down = { x: e.clientX, y: e.clientY }; });
  renderer.domElement.addEventListener("pointerup", (e) => {
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) return;
    const r = renderer.domElement.getBoundingClientRect();
    pt.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(pt, camera);
    const hit = ray.intersectObjects([...meshes.values()].filter((m) => m.visible), false)[0];
    if (!hit) { if (!opts.keepOnMiss) { sel.clear(); paint(); ctl.onChange && ctl.onChange(); } return; }
    const id = hit.object.userData.id;
    if (sel.has(id)) sel.delete(id); else sel.add(id);
    ctl.last = parts.get(id);
    paint(); ctl.onChange && ctl.onChange();
  });

  // size + loop
  function size() {
    const w = wrap.clientWidth, h = wrap.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(size); ro.observe(wrap); size();
  fit(box);
  let alive = true;
  (function loop() { if (!alive) return; controls.update(); renderer.render(scene, camera); requestAnimationFrame(loop); })();

  const ctl = {
    parts, status, sel, loadMs, last: null, onChange: null,
    list() { return [...parts.values()].filter((p) => meshes.has(p.id)); },
    select(ids, add) { if (!add) sel.clear(); ids.forEach((i) => sel.add(i)); paint(); this.onChange && this.onChange(); },
    clear() { sel.clear(); paint(); this.onChange && this.onChange(); },
    zoomTo(id) { const m = meshes.get(id); if (m) fit(new THREE.Box3().setFromObject(m).expandByScalar(0.5)); },
    fit() { const b = new THREE.Box3(); for (const m of meshes.values()) if (m.visible) b.expandByObject(m); fit(b.isEmpty() ? box : b); },
    bolts(on) { showBolts = on; paint(); },
    hideSelected() { sel.forEach((i) => hidden.add(i)); sel.clear(); paint(); this.onChange && this.onChange(); },
    showAll() { hidden.clear(); paint(); this.onChange && this.onChange(); },
    hiddenCount() { return hidden.size; },
    heavy(on) { showHeavy = on; paint(); },
    heavyCount() { return [...parts.values()].filter((p) => p.heavy && meshes.has(p.id)).length; },
    mark(s) {
      const at = new Date().toISOString();
      sel.forEach((id) => { const p = parts.get(id); if (p.kind === "Bolts") return; if (s) status[p.guid] = { s, by: opts.user || "", at }; else delete status[p.guid]; });
      sel.clear(); paint(); opts.onStatus && opts.onStatus(status); this.onChange && this.onChange();
    },
    destroy() { alive = false; ro.disconnect(); renderer.dispose(); for (const m of meshes.values()) { m.geometry.dispose(); m.material.dispose(); } el.innerHTML = ""; }
  };
  return ctl;
}

function mergeGeometries(list) {
  let vn = 0, inN = 0;
  for (const g of list) { vn += g.attributes.position.count; inN += g.index.count; }
  const pos = new Float32Array(vn * 3), nor = new Float32Array(vn * 3), idx = new Uint32Array(inN);
  let vo = 0, io = 0;
  for (const g of list) {
    pos.set(g.attributes.position.array, vo * 3); nor.set(g.attributes.normal.array, vo * 3);
    const gi = g.index.array; for (let k = 0; k < gi.length; k++) idx[io + k] = gi[k] + vo;
    vo += g.attributes.position.count; io += gi.length; g.dispose();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  out.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
  out.setIndex(new THREE.BufferAttribute(idx, 1));
  return out;
}

window.ICModel = { open, HEAVY_KG };

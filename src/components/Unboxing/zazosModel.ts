import * as THREE from "three";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { MTLLoader } from "three/addons/loaders/MTLLoader.js";

/**
 * Cena 3D da Zazos (docs/Zazos - cena 3D do unboxing). Os objetos vêm com geometria em coordenadas
 * de mundo; aqui cada um é recentrado no seu pivô (zazos_cena.json) para poder se mover/girar.
 */
export const ZAZOS_MODEL_URL = "/leads/zazos/zazos_cena";

/** pivôs em relação à bandeja (que fica em 0,0,-1.2); os blocos seguem a ordem das ferramentas do lead */
const PIVOT = {
  caixa: new THREE.Vector3(0, 0.55, -1.2),
  tampa: new THREE.Vector3(0, 1.275, -1.2),
  bandeja: new THREE.Vector3(0, 0, -1.2),
  blocos: [
    new THREE.Vector3(-0.56, 0.21, -1.76),
    new THREE.Vector3(0.56, 0.21, -1.76),
    new THREE.Vector3(-0.56, 0.21, -0.64),
    new THREE.Vector3(0.56, 0.21, -0.64),
  ],
};
const BLOCO_NOMES = ["planilha", "ponto", "calendario", "pasta"];

export interface ZazosParts {
  caixa: THREE.Group;
  tampa: THREE.Group;
  bandeja: THREE.Group;
  blocos: THREE.Group[];
  /** materiais da tampa (para o fade ao abrir) */
  lidMats: THREE.MeshPhysicalMaterial[];
  /** material do corpo de cada bloco (para o brilho ao encaixar) */
  blocoMats: THREE.MeshPhysicalMaterial[];
}

/** material físico a partir do .mtl (que só guarda cor) + brilho/rugosidade do .json */
function physical(src: THREE.Material, name: string): THREE.MeshPhysicalMaterial {
  const color = (src as THREE.MeshPhongMaterial).color ?? new THREE.Color("#fff");
  const p: THREE.MeshPhysicalMaterialParameters = { color: color.clone(), roughness: 0.6 };
  if (name === "caixa_kraft") Object.assign(p, { roughness: 0.85, sheen: 0.6, sheenColor: new THREE.Color("#f2d3a4") });
  else if (name === "tampa_kraft") Object.assign(p, { roughness: 0.8, sheen: 0.6, sheenColor: new THREE.Color("#f2d3a4") });
  else if (name === "bandeja") Object.assign(p, { roughness: 0.55, clearcoat: 0.25, clearcoatRoughness: 0.4 });
  else if (/^bloco_(?!icone)/.test(name)) Object.assign(p, { roughness: 0.32, clearcoat: 0.85, clearcoatRoughness: 0.22 });
  const m = new THREE.MeshPhysicalMaterial(p);
  m.name = name;
  return m;
}

function prepare(obj: THREE.Object3D, pivot: THREE.Vector3, mats: Record<string, THREE.Material>, out: THREE.MeshPhysicalMaterial[]) {
  const g = new THREE.Group();
  obj.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.geometry.translate(-pivot.x, -pivot.y, -pivot.z);
    const list = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const made = list.map((m) => {
      const pm = physical(mats[m.name] ?? m, m.name);
      out.push(pm);
      return pm;
    });
    mesh.material = Array.isArray(mesh.material) ? made : made[0];
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    g.add(mesh.clone());
  });
  return g;
}

export async function loadZazosParts(url = ZAZOS_MODEL_URL): Promise<ZazosParts> {
  const mtl = await new MTLLoader().loadAsync(`${url}.mtl`);
  mtl.preload();
  const root = await new OBJLoader().setMaterials(mtl).loadAsync(`${url}.obj`);
  const base = mtl.materials as Record<string, THREE.Material>;
  const find = (n: string) => {
    const o = root.getObjectByName(n);
    if (!o) throw new Error(`zazos_cena.obj: objeto "${n}" não encontrado`);
    return o;
  };
  const none: THREE.MeshPhysicalMaterial[] = [];
  const lidMats: THREE.MeshPhysicalMaterial[] = [];
  const blocoMats: THREE.MeshPhysicalMaterial[] = [];
  const blocos = BLOCO_NOMES.map((n, i) => {
    const mine: THREE.MeshPhysicalMaterial[] = [];
    const g = prepare(find(`bloco_${n}`), PIVOT.blocos[i], base, mine);
    blocoMats.push(mine.find((m) => m.name === `bloco_${n}`)!);
    return g;
  });
  return {
    caixa: prepare(find("caixa"), PIVOT.caixa, base, none),
    tampa: prepare(find("tampa"), PIVOT.tampa, base, lidMats),
    bandeja: prepare(find("bandeja"), PIVOT.bandeja, base, none),
    blocos,
    lidMats,
    blocoMats,
  };
}

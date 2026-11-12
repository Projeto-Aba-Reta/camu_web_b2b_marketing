import sys, json, numpy as np, trimesh
G = "g/"
NOMES = ["planilha", "ponto", "calendario", "pasta"]
COR = ["#D9593D", "#E9B23A", "#2F8F83", "#5B4B9A"]
TRAY, TINTA = "#E3CFA4", "#140A04"
def rgb(h): return np.array([int(h[i:i+2], 16) for i in (1, 3, 5)]) / 255
def mix(b, c, a): return b * (1 - a) + c * a            # c com opacidade a sobre b
pk = [(-.56, -.56), (.56, -.56), (-.56, .56), (.56, .56)]

# material -> (Kd, Ns, Ks)
mats = {
 "caixa_kraft": (rgb("#B98B5A"), 12, .05), "tampa_kraft": (rgb("#C49A68"), 14, .05),
 "creme": (rgb("#F6EBD3"), 20, .1), "raio": (rgb("#FFD25A"), 40, .2), "bandeja": (rgb(TRAY), 60, .25)}
for i, n in enumerate(NOMES):
    mats[f"bloco_{n}"] = (rgb(COR[i]), 120, .6)
    mats[f"bloco_icone_{n}"] = (mix(rgb(COR[i]), rgb(TINTA), .6), 20, .05)
    mats[f"encaixe_fundo_{n}"] = (mix(rgb(TRAY), rgb(COR[i]), .2), 40, .1)
    mats[f"encaixe_linha_{n}"] = (mix(rgb(TRAY), rgb(COR[i]), .9), 40, .1)
    mats[f"encaixe_icone_{n}"] = (mix(rgb(TRAY), rgb(COR[i]), .6), 40, .1)

# objeto -> [(grupo stl, material)]
objs = {"caixa": [("caixa", "caixa_kraft")],
        "tampa": [("tampa", "tampa_kraft"), ("tampa_texto", "creme"), ("tampa_raio", "raio")],
        "bandeja": [("bandeja", "bandeja")]}
for i, n in enumerate(NOMES):
    for p, k in (("fundo", "fundo"), ("tracejado", "linha"), ("icone", "icone")):
        objs["bandeja"].append((f"slot{i}_{p}", f"encaixe_{k}_{n}"))
for i, n in enumerate(NOMES):
    objs[f"bloco_{n}"] = [(f"bloco{i}_corpo", f"bloco_{n}"), (f"bloco{i}_icone", f"bloco_icone_{n}"),
                          (f"bloco{i}_logo_texto", "creme"), (f"bloco{i}_logo_raio", "raio")]

M = np.array([[1, 0, 0], [0, 0, 1], [0, -1, 0]], float)     # (x,y,z)_scad -> (x, z, -y): Z-up -> Y-up, mantém o sentido das faces
assert np.linalg.det(M) > 0

def normais_suaves(v, f, ang=35):
    fn = np.cross(v[f[:, 1]] - v[f[:, 0]], v[f[:, 2]] - v[f[:, 0]]); area = np.linalg.norm(fn, axis=1) + 1e-30
    un = fn / area[:, None]
    key = {}; vid = np.empty(len(v), int)
    for i, p in enumerate(np.round(v, 5)): vid[i] = key.setdefault(tuple(p), len(key))
    adj = [[] for _ in key]
    for fi, tri in enumerate(f):
        for c in tri: adj[vid[c]].append(fi)
    cs = np.cos(np.radians(ang)); out = np.zeros((len(f), 3, 3))
    for fi, tri in enumerate(f):
        for k, c in enumerate(tri):
            s = sum(area[j] * un[j] for j in adj[vid[c]] if un[j] @ un[fi] > cs)
            out[fi, k] = s / (np.linalg.norm(s) + 1e-30)
    return out

V, VN, lines = [], [], []
base = 0; resumo = {}
for nome, grupos in objs.items():
    lines.append(f"o {nome}")
    for gname, mat in grupos:
        m = trimesh.load(f"{G}{gname}.stl", process=True)
        m.merge_vertices()
        v = np.asarray(m.vertices) @ M.T; f = np.asarray(m.faces)
        nrm = normais_suaves(v, f)
        lines.append(f"usemtl {mat}")
        vi = base + 1
        for p in v: V.append("v %.5f %.5f %.5f" % tuple(p))
        for tri in nrm:
            for n in tri: VN.append("vn %.4f %.4f %.4f" % tuple(n))
        # cada canto de face tem seu vn: índices sequenciais
        for fi, tri in enumerate(f):
            lines.append("f " + " ".join(f"{vi+c}//{len(VN)-3*len(f)+3*fi+k+1}" for k, c in enumerate(tri)))
        base += len(v)
        resumo.setdefault(nome, 0); resumo[nome] += len(f)
with open("zazos_cena.obj", "w") as fo:
    fo.write("# Zazos - cena do unboxing (replica das medidas e cores do site). Y para cima, unidades da cena do site.\n")
    fo.write("mtllib zazos_cena.mtl\n"); fo.write("\n".join(V) + "\n"); fo.write("\n".join(VN) + "\n"); fo.write("\n".join(lines) + "\n")
with open("zazos_cena.mtl", "w") as fm:
    for n, (kd, ns, ks) in mats.items():
        fm.write(f"newmtl {n}\nKd {kd[0]:.4f} {kd[1]:.4f} {kd[2]:.4f}\nKa 0 0 0\nKs {ks} {ks} {ks}\nNs {ns}\nd 1\nillum 2\n\n")

# pivôs no quadro do site (Y para cima), para animar cada objeto como o código do site faz
pB = [0, 0, -1.2]
piv = {"caixa": [0, .55, pB[2]], "tampa": [0, 1.275, pB[2]], "bandeja": pB}
for i, n in enumerate(NOMES): piv[f"bloco_{n}"] = [pB[0] + pk[i][0], .21, pB[2] + pk[i][1]]
rough = {"caixa_kraft": dict(roughness=.85, sheen=.6, sheenColor="#f2d3a4"), "tampa_kraft": dict(roughness=.8, sheen=.6, sheenColor="#f2d3a4"),
         "bandeja": dict(roughness=.55, clearcoat=.25, clearcoatRoughness=.4)}
for n in NOMES: rough[f"bloco_{n}"] = dict(roughness=.32, clearcoat=.85, clearcoatRoughness=.22)
json.dump({"unidade": "unidades da cena do site (1 un = 30 mm se imprimir)", "eixos": "Y para cima, frente = +Z",
           "estado_do_obj": "fechado: caixa+tampa fechadas, bandeja dentro, blocos assentados e VIRADOS (logo para cima)",
           "pivos": piv,
           "blocos_virados": "os blocos estão com rotation.x = PI (como no estado 'done'); gire PI em x em volta do pivô para deixar o ícone para cima",
           "tampa_aberta": "no site a tampa sobe 1.5, recua 1.3 em z e gira -0.5 rad em x; a caixa desce 1.6",
           "posicoes_soltas_dos_blocos": {n: dict(x=x, z=z, rotY=r) for n, (x, z, r) in zip(NOMES, [(-.8, 1.8, .4), (.85, 1.75, -.3), (-.7, 3, -.5), (.8, 2.95, .35)])},
           "materiais_fisicos": rough}, open("zazos_cena.json", "w"), indent=1, ensure_ascii=False)
print(json.dumps(resumo)); print("vertices", len(V), "normais", len(VN))

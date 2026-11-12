// Zazos — cena 3D do site b2b.camu3d.com.br/p/zazos (unboxing)
// Réplica das medidas e cores lidas do código do próprio site (unidades da cena: 1 un = 30 mm se for imprimir).
//   caixa 2,9 x 1,1 x 2,9 | tampa 3,05 x 0,35 x 3,05 | bandeja 2,32 com 4 encaixes de 0,94
//   blocos 1 x 0,26 x 1 (raio 0,07) com ícone em cima e 1/4 da logo embaixo
// Quadro de coordenadas deste arquivo: Z para cima, "frente" do site = -Y. Na exportação vira Y para cima (three.js).
// Uso: openscad -D 'grupo="cena"' ... | -D 'grupo="bloco0_corpo"' para exportar cada peça.

/* [Exibição] */
estado = "fechado";   // [fechado, jogo, montado]
grupo  = "cena";      // "cena" ou o nome de uma peça (ver g("..."))

/* [Logo] */
logo_svg  = "zazos_logo.svg";
logo_h_px = 267;      // altura do raio num quadro de 512 px (1,2 un na tampa)

/* [Cores do tema do site] */
c_caixa = "#B98B5A"; c_tampa = "#C49A68"; c_bandeja = "#E3CFA4";
c_creme = "#F6EBD3"; c_raio  = "#FFD25A"; c_tinta   = "#140A04";
cores_bloco = ["#D9593D", "#E9B23A", "#2F8F83", "#5B4B9A"];
nomes_bloco = ["planilha", "ponto", "calendario", "pasta"];
icones_bloco = ["sheet", "clock", "calendar", "folder"];

/* [Medidas (unidades do site)] */
caixa_l = 2.9;  caixa_h = 1.1;  caixa_r = 0.06; parede = 0.12;
tampa_l = 3.05; tampa_h = 0.35; tampa_r = 0.07;
bandeja_l = 2.32; piso = 0.08; muro_h = 0.2; muro = 0.08; r_bandeja = 0.02;
bloco_l = 1;    bloco_h = 0.26; bloco_r = 0.07;
Y0 = 1.2;       // a caixa e a bandeja ficam em site z = -1.2  ->  y = +1.2 aqui

// posições dos encaixes (site x,z) e dos blocos soltos no estado "jogo" (x, z, giro em rad)
pk = [[-.56,-.56],[.56,-.56],[-.56,.56],[.56,.56]];
pV = [[-.8,1.8,.4],[.85,1.75,-.3],[-.7,3,-.5],[.8,2.95,.35]];

$fn = 24;

// ---------------- cores: hex -> rgb e mistura (o site pinta os encaixes com 20% / 90% / 60% de opacidade) ----------------
function hd(c) = search(c, "0123456789ABCDEF")[0];
function rgb(h) = [for (i=[1,3,5]) (16*hd(h[i]) + hd(h[i+1]))/255];
function mix(base, cor, a) = base*(1-a) + cor*a;       // a = opacidade de "cor" sobre "base"

// ---------------- utilidades 3D ----------------
module rbox(sx, sy, sz, r) {          // caixa de cantos arredondados, centrada
    hull() for (x=[-1,1], y=[-1,1], z=[-1,1])
        translate([x*(sx/2-r), y*(sy/2-r), z*(sz/2-r)]) sphere(r=r, $fn=14);
}

module g(nome) { if (grupo == "cena" || grupo == nome) children(); }

// ---------------- utilidades 2D (coordenadas de canvas 256 px, y para baixo) ----------------
module px2uv() { translate([-128, 128]) scale([1, -1]) children(); }       // canvas -> (u,v) centrado, v para cima
module linha(p, q, w) hull() { translate(p) circle(d=w, $fn=12); translate(q) circle(d=w, $fn=12); }
module rrfill(x, y, w, h, r) translate([x+r, y+r]) offset(r=r, $fn=24) square([w-2*r, h-2*r]);
module rrstroke(x, y, w, h, r, sw) difference() {
    offset(r=sw/2, $fn=16) rrfill(x, y, w, h, r);
    offset(delta=-sw/2) rrfill(x, y, w, h, r);
}
module anel(c, r, sw) translate(c) difference() { circle(r=r+sw/2, $fn=64); circle(r=r-sw/2, $fn=64); }
module polistroke(pts, sw) difference() {
    offset(r=sw/2, $fn=16) polygon(pts);
    offset(delta=-sw/2) polygon(pts);
}

// ícones copiados do código do site (pO), traço sw em px de um canvas 256
module icone2d(nome, sw) {
    if (nome == "sheet") {
        rrstroke(48, 48, 160, 160, 14, sw);
        for (x=[101,155]) linha([x,48], [x,208], sw);
        for (y=[101,155]) linha([48,y], [208,y], sw);
    } else if (nome == "clock") {
        anel([128,128], 84, sw);
        linha([128,128], [128,76], sw);
        linha([128,128], [168,150], sw);
    } else if (nome == "calendar") {
        rrstroke(44, 60, 168, 152, 14, sw);
        linha([44,108], [212,108], sw);
        linha([90,40], [90,78], sw);
        linha([166,40], [166,78], sw);
        for (p=[[88,142],[128,142],[168,142],[88,180],[128,180]]) translate(p) circle(d=sw, $fn=12);
    } else if (nome == "folder") {
        polistroke([[44,84],[100,84],[120,108],[212,108],[212,204],[44,204]], sw);
    }
}

// borda tracejada do encaixe (roundRect 8,8,240,240,26; traço 6; pontilhado 14/12)
function rr_pos(s, a=120, r=26) =           // ponto e ângulo ao longo do contorno, centrado em 0
    let(L = 2*a - 2*r, A = PI*r/2, P = 4*L + 4*A, t = s % P,
        seg = t < L ? 0 : t < L+A ? 1 : t < 2*L+A ? 2 : t < 2*L+2*A ? 3 : t < 3*L+2*A ? 4 : t < 3*L+3*A ? 5 : t < 4*L+3*A ? 6 : 7)
    seg == 0 ? [[-a+r+t, a], 0] :
    seg == 1 ? let(q=(t-L)/r)         [[ a-r+r*sin(q*180/PI), a-r+r*cos(q*180/PI)], -q*180/PI] :
    seg == 2 ? [[a, a-r-(t-L-A)], -90] :
    seg == 3 ? let(q=(t-2*L-A)/r)     [[ a-r+r*cos(q*180/PI), -a+r-r*sin(q*180/PI)], -90-q*180/PI] :
    seg == 4 ? [[a-r-(t-2*L-2*A), -a], -180] :
    seg == 5 ? let(q=(t-3*L-2*A)/r)   [[-a+r-r*sin(q*180/PI), -a+r-r*cos(q*180/PI)], -180-q*180/PI] :
    seg == 6 ? [[-a, -a+r+(t-3*L-3*A)], -270] :
               let(q=(t-4*L-3*A)/r)   [[-a+r-r*cos(q*180/PI), a-r+r*sin(q*180/PI)], -270-q*180/PI];

module tracejado(sw=6, dash=14, gap=12, a=120, r=26) {
    P = 4*(2*a-2*r) + 2*PI*r;
    for (i=[0:floor(P/(dash+gap))-1], k=[0:4]) {
        s0 = i*(dash+gap) + k*dash/5;  s1 = s0 + dash/5;
        p0 = rr_pos(s0, a, r); p1 = rr_pos(s1, a, r);
        hull() {
            translate(p0[0]) rotate(p0[1]) square([0.05, sw], center=true);
            translate(p1[0]) rotate(p1[1]) square([0.05, sw], center=true);
        }
    }
}

// ---------------- logo da tampa (canvas 512 px, centro = origem, v para cima) ----------------
// texto calibrado à fonte do site (Bricolage Grotesque 800) usando a Liberation Sans Bold daqui:
// ZAZ ocupa 413 x 150 px com linha de base em v=41; OS ocupa 301 x 159 px com base em v=-203.
module texto_px() {
    translate([-206.7, 41]) scale([16.054, 15.699]) translate([-0.414, 0])
        text("ZAZ", size=10, font="Liberation Sans:style=Bold", halign="left", valign="baseline", $fn=24);
    translate([-149, -203]) scale([16.085, 16.170]) translate([-0.570, 0.136])
        text("OS", size=10, font="Liberation Sans:style=Bold", halign="left", valign="baseline", $fn=24);
}
module raio_px() resize([0, logo_h_px], auto=true) import(logo_svg, center=true);

module quadrante(q, parte) {      // 1/4 da logo (usado na face de baixo de cada bloco)
    cx = (q % 2 == 0) ? -128 : 128;  cy = (floor(q/2) == 0) ? 128 : -128;
    translate([-cx, -cy]) intersection() {
        translate([cx, cy]) square(256, center=true);
        if (parte == "texto") texto_px(); else raio_px();
    }
}

// ---------------- peças ----------------
// luva oca, aberta em cima e embaixo: a bandeja entra por baixo e a tampa fecha por cima
module caixa_oca() translate([0, Y0, 0]) difference() {
    translate([0, 0, caixa_h/2]) rbox(caixa_l, caixa_l, caixa_h, caixa_r);
    translate([0, 0, caixa_h/2]) cube([caixa_l-2*parede, caixa_l-2*parede, caixa_h+1], center=true);
}

module tampa() translate([0, Y0, caixa_h + tampa_h/2]) rbox(tampa_l, tampa_l, tampa_h, tampa_r);
module tampa_texto() translate([0, Y0, caixa_h + tampa_h - 0.001]) linear_extrude(0.021) scale(2.3/512) texto_px();
module tampa_raio()  translate([0, Y0, caixa_h + tampa_h - 0.001]) linear_extrude(0.031) scale(2.3/512) raio_px();

module bandeja() translate([0, Y0, 0]) {
    h = bandeja_l; w = h - 2*muro;
    translate([0, 0, piso/2]) rbox(h, h, piso, r_bandeja);
    for (s=[-1,1]) {
        translate([0, s*(h/2-muro/2), muro_h/2]) rbox(h, muro, muro_h, r_bandeja);
        translate([s*(h/2-muro/2), 0, muro_h/2]) rbox(muro, h, muro_h, r_bandeja);
    }
    translate([0, 0, muro_h/2]) rbox(muro, 2.16, muro_h, r_bandeja);
    translate([0, 0, muro_h/2]) rbox(2.16, muro, muro_h, r_bandeja);
}

module slot(i, parte) translate([pk[i][0], Y0 - pk[i][1], piso - 0.001]) {
    k = 0.94/256;
    if (parte == "fundo")      linear_extrude(0.005) scale(k) px2uv() rrfill(8, 8, 240, 240, 26);
    if (parte == "tracejado")  linear_extrude(0.007) scale(k) px2uv() translate([128,128]) tracejado();
    if (parte == "icone")      linear_extrude(0.007) scale(k) px2uv() icone2d(icones_bloco[i], 12);
}

module bloco_local(i, parte) {    // origem no centro do bloco, ícone em cima, 1/4 da logo embaixo
    if (parte == "corpo")  rbox(bloco_l, bloco_l, bloco_h, bloco_r);
    if (parte == "icone")  translate([0, 0, bloco_h/2 - 0.001]) linear_extrude(0.013) scale(0.8/256) px2uv() icone2d(icones_bloco[i], 14);
    if (parte == "logo_texto") translate([0, 0, -bloco_h/2 - 0.012]) linear_extrude(0.013) scale([0.96/256, -0.96/256]) quadrante(i, "texto");
    if (parte == "logo_raio")  translate([0, 0, -bloco_h/2 - 0.016]) linear_extrude(0.017) scale([0.96/256, -0.96/256]) quadrante(i, "raio");
}

module bloco(i, parte) {
    if (estado == "jogo")
        translate([pV[i][0], Y0 - pV[i][1], bloco_h/2]) rotate([0, 0, pV[i][2]*180/PI]) bloco_local(i, parte);
    else
        translate([pk[i][0], Y0 - pk[i][1], 0.21]) rotate([180, 0, 0]) bloco_local(i, parte);   // assentado, logo para cima
}

// ---------------- cena ----------------
if (estado == "fechado" || grupo != "cena") {   // nos outros estados a caixa e a tampa saem de cena
    g("caixa")        color(c_caixa)  caixa_oca();
    g("tampa")        color(c_tampa)  tampa();
    g("tampa_texto")  color(c_creme)  tampa_texto();
    g("tampa_raio")   color(c_raio)   tampa_raio();
}

g("bandeja") color(c_bandeja) bandeja();
for (i=[0:3]) {
    g(str("slot", i, "_fundo"))     color(mix(rgb(c_bandeja), rgb(cores_bloco[i]), 0.2)) slot(i, "fundo");
    g(str("slot", i, "_tracejado")) color(mix(rgb(c_bandeja), rgb(cores_bloco[i]), 0.9)) slot(i, "tracejado");
    g(str("slot", i, "_icone"))     color(mix(rgb(c_bandeja), rgb(cores_bloco[i]), 0.6)) slot(i, "icone");
    g(str("bloco", i, "_corpo"))      color(cores_bloco[i]) bloco(i, "corpo");
    g(str("bloco", i, "_icone"))      color(mix(rgb(cores_bloco[i]), rgb(c_tinta), 0.6)) bloco(i, "icone");
    g(str("bloco", i, "_logo_texto")) color(c_creme)        bloco(i, "logo_texto");
    g(str("bloco", i, "_logo_raio"))  color(c_raio)         bloco(i, "logo_raio");
}

// ---- contas de conferência (aparecem a cada renderização) ----
echo(str("Caixa ", caixa_l, " x ", caixa_h, " (oca, parede ", parede, ") envolve a bandeja de ", bandeja_l, ": folga ", (caixa_l-2*parede-bandeja_l)/2, " por lado"));
echo(str("Bloco ", bloco_l, " cabe no encaixe de ", (bandeja_l-3*muro)/2, ": folga ", ((bandeja_l-3*muro)/2 - bloco_l)/2, " por lado"));
echo(str("Topo do bloco assentado: ", 0.21 + bloco_h/2, " | topo dos muros: ", muro_h, " | fundo da tampa: ", caixa_h));

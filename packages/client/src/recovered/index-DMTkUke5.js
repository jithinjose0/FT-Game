import {WaterScene as dt} from '../scene/WaterScene';
import {TouchControls as ut} from '../ui/TouchControls';
import {LocalControls as ft} from '../ui/LocalControls';
import {NetworkManager as mt} from '../core/NetworkManager';
import {serverURL} from '../core/NetworkManager';
import {FartAudio} from '../core/FartAudio';
const __vite__mapDeps = (i, m = __vite__mapDeps, d = (m.f || (m.f = ["assets/web-CwqxwgSo.js", "assets/babylon-Cc7_0afu.js", "assets/network-CtBm-6sI.js"]))) => i.map(i => d[i]);
var Ye = Object.defineProperty;
var _e = (i, e, s) => e in i ? Ye(i, e, { enumerable: !0, configurable: !0, writable: !0, value: s }) : i[e] = s;
var m = (i, e, s) => _e(i, typeof e != "symbol" ? e + "" : e, s);
import { T as ie, M, E as qe, S as Ce, C as ke, a as H, A as Ve, V as f, H as Je, D as Ze, b as Qe, c as le, d as Ee, e as Xe, f as Se, g as et, Q as tt, h as st, _ as Re } from "./babylon-Cc7_0afu.js";
import { C as it } from "./network-CtBm-6sI.js";
(function () { const e = document.createElement("link").relList; if (e && e.supports && e.supports("modulepreload"))
    return; for (const a of document.querySelectorAll('link[rel="modulepreload"]'))
    n(a); new MutationObserver(a => { for (const t of a)
    if (t.type === "childList")
        for (const o of t.addedNodes)
            o.tagName === "LINK" && o.rel === "modulepreload" && n(o); }).observe(document, { childList: !0, subtree: !0 }); function s(a) { const t = {}; return a.integrity && (t.integrity = a.integrity), a.referrerPolicy && (t.referrerPolicy = a.referrerPolicy), a.crossOrigin === "use-credentials" ? t.credentials = "include" : a.crossOrigin === "anonymous" ? t.credentials = "omit" : t.credentials = "same-origin", t; } function n(a) { if (a.ep)
    return; a.ep = !0; const t = s(a); fetch(a.href, t); } })();
const V = [{ x: -1, z: 1 }, { x: 1, z: 1 }, { x: -1, z: -1 }, { x: 1, z: -1 }, { x: -1, z: 2.2 }, { x: 1, z: 2.2 }, { x: -1, z: -2.2 }, { x: 1, z: -2.2 }], at = 178, I = { hippo: { name: "Bubbles", species: "Hippo", color: "#9471ed", emoji: "🦛" }, croc: { name: "Chomps", species: "Crocodile", color: "#73ce53", emoji: "🐊" }, frog: { name: "Sprout", species: "Frog", color: "#36cdb1", emoji: "🐸" }, penguin: { name: "Waddles", species: "Penguin", color: "#4774c8", emoji: "🐧" }, capybara: { name: "Biscuit", species: "Capybara", color: "#e5a552", emoji: "🦫" }, bear: { name: "Mochi", species: "Bear", color: "#ed779d", emoji: "🐻" } }, nt = i => typeof i == "string" && Object.hasOwn(I, i), J = { lagoon: { name: "Canyon Splash", subtitle: "Coral cliffs & splashy slides", current: .65, color: "#18cbe3", obstacles: [{ x: -3, z: 27, radius: 2, kind: "rock" }, { x: 4, z: 62, radius: 2, kind: "rock" }, { x: 0, z: 77, radius: 3.4, kind: "spinner" }, { x: -4, z: 93, radius: 2, kind: "rock" }, { x: 0, z: 122, radius: 2.3, kind: "gate" }, { x: -2, z: 142, radius: 3, kind: "spinner" }, { x: 5, z: 161, radius: 2, kind: "rock" }] }, rapids: { name: "Jungle Rush", subtitle: "Boost, leap & dodge the jungle", current: .85, color: "#24cbd0", obstacles: [{ x: 2, z: 22, radius: 2, kind: "rock" }, { x: -3, z: 65, radius: 2, kind: "rock" }, { x: 2, z: 78, radius: 3.4, kind: "spinner" }, { x: 0, z: 94, radius: 2.2, kind: "gate" }, { x: 3, z: 123, radius: 3, kind: "spinner" }, { x: -2, z: 140, radius: 2.5, kind: "rock" }, { x: 3, z: 162, radius: 3, kind: "spinner" }] }, moonlight: { name: "Neon Grotto", subtitle: "Glow caves & midnight mayhem", current: .7, color: "#4556c5", obstacles: [{ x: -2, z: 26, radius: 2, kind: "rock" }, { x: 3, z: 64, radius: 3, kind: "spinner" }, { x: 0, z: 80, radius: 2.4, kind: "gate" }, { x: 2, z: 94, radius: 3, kind: "spinner" }, { x: -3, z: 124, radius: 2.3, kind: "rock" }, { x: 3, z: 141, radius: 3.6, kind: "spinner" }, { x: -2, z: 163, radius: 2, kind: "rock" }] } }, Pe = [{ start: 35, lip: 46, end: 56, height: 2.5 }, { start: 101, lip: 112, end: 120, height: 2 }], ot = [17, 33, 98, 150];
function rt(i) { for (const e of Pe) {
    if (i >= e.start && i <= e.lip)
        return (i - e.start) / (e.lip - e.start) * e.height;
    if (i > e.lip && i < e.lip + 5)
        return null;
    if (i >= e.lip + 5 && i < e.end)
        return e.height * (e.end - i) / (e.end - e.lip - 5);
} return 0; }
const ct = { lagoon: [{ z: -15, x: 0, width: 19, height: 0 }, { z: 12, x: 0, width: 19, height: 0 }, { z: 33, x: 5, width: 16, height: 0 }, { z: 58, x: 7, width: 15, height: 0 }, { z: 80, x: -1, width: 9, height: 6 }, { z: 103, x: -7, width: 8.5, height: 6 }, { z: 128, x: -3, width: 14, height: 0 }, { z: 153, x: 6, width: 15, height: 0 }, { z: 190, x: 1, width: 18, height: 0 }], rapids: [{ z: -15, x: 0, width: 18, height: 0 }, { z: 15, x: 0, width: 18, height: 0 }, { z: 37, x: -6, width: 15, height: 0 }, { z: 58, x: -5, width: 14, height: 0 }, { z: 80, x: 6, width: 9, height: 8 }, { z: 103, x: 9, width: 8.5, height: 8 }, { z: 127, x: 0, width: 13, height: 0 }, { z: 151, x: -8, width: 12, height: 0 }, { z: 190, x: 0, width: 18, height: 0 }], moonlight: [{ z: -15, x: 0, width: 18, height: 0 }, { z: 15, x: 0, width: 18, height: 0 }, { z: 35, x: 6, width: 15, height: 0 }, { z: 58, x: 5, width: 14, height: 0 }, { z: 80, x: -5, width: 9.5, height: 5 }, { z: 103, x: -8, width: 9, height: 5 }, { z: 127, x: 0, width: 14, height: 0 }, { z: 151, x: 7, width: 13, height: 0 }, { z: 190, x: 0, width: 18, height: 0 }] };
function b(i, e) { const s = ct[i]; let n = s[0], a = s[1]; for (let h = 0; h < s.length - 1 && (n = s[h], a = s[h + 1], !(e <= a.z)); h++)
    ; const t = Math.max(0, Math.min(1, (e - n.z) / (a.z - n.z))), o = t * t * (3 - 2 * t), l = (a.x - n.x) * 6 * t * (1 - t) / (a.z - n.z), r = Math.hypot(l, 1); return { x: n.x + (a.x - n.x) * o, z: e, width: n.width + (a.width - n.width) * o, height: n.height + (a.height - n.height) * o, tx: l / r, tz: 1 / r, nx: 1 / r, nz: -l / r, angle: Math.atan2(l, 1) }; }
function j(i, e) { const s = rt(e); return s === null ? null : b(i, e).height + s; }
function W(i, e, s = 0) { const n = b(i, e); return { x: n.x + n.nx * s, z: e + n.nz * s, y: n.height }; }
function ze(i, e, s) { const n = s ? b(s, i.z) : { x: 0, width: 22, nx: 1, nz: 0, angle: 0 }, a = Math.max(.3, Math.min(5.5, n.width / 2 - i.radius - 1)), t = i.x + (i.kind === "gate" ? Math.sin(e * 1.1 + i.z) * a : 0); return { x: n.x + n.nx * t, z: i.z + n.nz * t, angle: n.angle + (i.kind === "spinner" ? e * .65 + i.z : 0) }; }
function lt(i) { return Array.from({ length: 9 }, (e, s) => { const n = -Math.PI * .75 + s / 8 * Math.PI * 1.4; return { x: Math.sin(n) * i * .75, z: (1 - Math.cos(n)) * i * .6 }; }); }
const ue = i => `${Math.floor(i / 60).toString().padStart(2, "0")}:${(i % 60).toFixed(2).padStart(5, "0")}`;
function ht(i, e, s) { const n = new ie(`animal-${e}`, i), a = I[e].color, t = (r, h, d, u, p, C, w, S) => { const g = M.CreateSphere(r, { diameter: 1, segments: 12 }, i); return g.position.set(h, d, u), g.scaling.set(p, C, w), g.material = s(S), g.parent = n, g; }, o = "#26344c", l = e === "penguin" ? "#fff9e1" : "#ffdaa3"; if (t("round tummy", 0, .5, 0, .92, 1.02, .72, a), t("soft belly", 0, .47, .3, .62, .65, .25, e === "penguin" ? "#fff9e1" : a), t("big head", 0, 1.15, .08, e === "croc" ? .8 : 1, e === "frog" ? .68 : .92, .83, a), e === "hippo" || e === "capybara" || e === "croc" || e === "bear") {
    t("snout", 0, 1.05, .53, e === "croc" ? .72 : .86, .43, e === "croc" ? .95 : .56, e === "bear" ? l : a);
    for (const r of [-.23, .23])
        t("nostril", r, 1.21, e === "croc" ? 1 : .75, .095, .055, .09, o);
    if (e === "hippo" || e === "croc") {
        t("smile", 0, .89, .72, .55, .14, .12, o);
        for (const r of [-.18, .18])
            t("tooth", r, .91, .79, .1, .15, .08, "#fff9e1");
    }
} if (e === "penguin") {
    for (const r of [-.2, .2])
        t("face patch", r, 1.19, .39, .39, .48, .16, l);
    t("beak", 0, 1.04, .57, .34, .18, .3, "#ffb639");
} for (const r of [-1, 1]) {
    const h = r * (e === "frog" ? .34 : .25), d = e === "frog" ? 1.51 : 1.34;
    e === "frog" && t("eye mound", h, d, .18, .37, .38, .4, a), t("eye white", h, d, .43, .25, .29, .15, "#fffdf2"), t("pupil", h, d, .515, .115, .17, .075, o), t("eye shine", h - .025, d + .045, .55, .035, .045, .03, "#ffffff"), e !== "frog" && e !== "penguin" && (t("ear", r * .4, 1.55, -.02, .28, .32, .23, a), t("inner ear", r * .4, 1.55, .08, .13, .17, .04, "#f9aeac"));
    const u = t("arm", r * .53, .57, .12, .32, .65, .35, a);
    u.rotation.z = r * .4, t("foot", r * .3, .08, .3, .4, .24, .52, e === "penguin" ? "#ffb639" : a);
} if (e === "croc")
    for (let r = 0; r < 4; r++)
        t("back spike", 0, .75 - r * .14, -.37 - r * .08, .19, .23, .2, "#d8ee65"); return e === "frog" && t("happy mouth", 0, 1.04, .5, .46, .075, .09, o), n.metadata = { kind: e }, n; }
const ae = [{ name: "Keyboard · WASD + Space", left: "KeyA", right: "KeyD", up: "KeyW", down: "KeyS", fire: "Space" }, { name: "Keyboard · Arrows + Enter", left: "ArrowLeft", right: "ArrowRight", up: "ArrowUp", down: "ArrowDown", fire: "Enter" }, { name: "Keyboard · IJKL + U", left: "KeyJ", right: "KeyL", up: "KeyI", down: "KeyK", fire: "KeyU" }, { name: "Keyboard · TFGH + R", left: "KeyF", right: "KeyH", up: "KeyT", down: "KeyG", fire: "KeyR" }], pt = [...ae.map((i, e) => ({ id: `keyboard${e}`, name: i.name })), ...Array.from({ length: 8 }, (i, e) => ({ id: `gamepad${e}`, name: `Gamepad ${e + 1} · left stick + RT / A` }))];
function He() { return `${location.protocol === "https:" ? "wss:" : "ws:"}//${location.hostname}:${location.port === "5173" ? "2567" : location.port || (location.protocol === "https:" ? "443" : "80")}`; }
var Z;
(function (i) { i.Unimplemented = "UNIMPLEMENTED", i.Unavailable = "UNAVAILABLE"; })(Z || (Z = {}));
class he extends Error {
    constructor(e, s, n) { super(e), this.message = e, this.code = s, this.data = n; }
}
const gt = i => { var e, s; return i != null && i.androidBridge ? "android" : !((s = (e = i == null ? void 0 : i.webkit) === null || e === void 0 ? void 0 : e.messageHandlers) === null || s === void 0) && s.bridge ? "ios" : "web"; }, wt = i => { const e = i.CapacitorCustomPlatform || null, s = i.Capacitor || {}, n = s.Plugins = s.Plugins || {}, a = () => e !== null ? e.name : gt(i), t = () => a() !== "web", o = u => { const p = h.get(u); return !!(p != null && p.platforms.has(a()) || l(u)); }, l = u => { var p; return (p = s.PluginHeaders) === null || p === void 0 ? void 0 : p.find(C => C.name === u); }, r = u => i.console.error(u), h = new Map, d = (u, p = {}) => { const C = h.get(u); if (C)
    return console.warn(`Capacitor plugin "${u}" already registered. Cannot register plugins twice.`), C.proxy; const w = a(), S = l(u); let g; const v = async () => (!g && w in p ? g = typeof p[w] == "function" ? g = await p[w]() : g = p[w] : e !== null && !g && "web" in p && (g = typeof p.web == "function" ? g = await p.web() : g = p.web), g), O = (z, $) => { var D, F; if (S) {
    const G = S == null ? void 0 : S.methods.find(P => $ === P.name);
    if (G)
        return G.rtype === "promise" ? P => s.nativePromise(u, $.toString(), P) : (P, te) => s.nativeCallback(u, $.toString(), P, te);
    if (z)
        return (D = z[$]) === null || D === void 0 ? void 0 : D.bind(z);
}
else {
    if (z)
        return (F = z[$]) === null || F === void 0 ? void 0 : F.bind(z);
    throw new he(`"${u}" plugin is not implemented on ${w}`, Z.Unimplemented);
} }, R = z => { let $; const D = (...F) => { const G = v().then(P => { const te = O(P, z); if (te) {
    const se = te(...F);
    return $ = se == null ? void 0 : se.remove, se;
}
else
    throw new he(`"${u}.${z}()" is not implemented on ${w}`, Z.Unimplemented); }); return z === "addListener" && (G.remove = async () => $()), G; }; return D.toString = () => `${z.toString()}() { [capacitor code] }`, Object.defineProperty(D, "name", { value: z, writable: !1, configurable: !1 }), D; }, A = R("addListener"), L = R("removeListener"), Ge = (z, $) => { const D = A({ eventName: z }, $), F = async () => { const P = await D; L({ eventName: z, callbackId: P }, $); }, G = new Promise(P => D.then(() => P({ remove: F }))); return G.remove = async () => { console.warn("Using addListener() without 'await' is deprecated."), await F(); }, G; }, ce = new Proxy({}, { get(z, $) { switch ($) {
        case "$$typeof": return;
        case "toJSON": return () => ({});
        case "addListener": return S ? Ge : A;
        case "removeListener": return L;
        default: return R($);
    } } }); return n[u] = ce, h.set(u, { name: u, proxy: ce, platforms: new Set([...Object.keys(p), ...S ? [w] : []]) }), ce; }; return s.convertFileSrc || (s.convertFileSrc = u => u), s.getPlatform = a, s.handleError = r, s.isNativePlatform = t, s.isPluginAvailable = o, s.registerPlugin = d, s.Exception = he, s.DEBUG = !!s.DEBUG, s.isLoggingEnabled = !!s.isLoggingEnabled, s; }, bt = i => i.Capacitor = wt(i), pe = bt(typeof globalThis < "u" ? globalThis : typeof self < "u" ? self : typeof window < "u" ? window : typeof global < "u" ? global : {}), ye = pe.registerPlugin;
class je {
    constructor() { this.listeners = {}, this.retainedEventArguments = {}, this.windowListeners = {}; }
    addListener(e, s) { let n = !1; this.listeners[e] || (this.listeners[e] = [], n = !0), this.listeners[e].push(s); const t = this.windowListeners[e]; t && !t.registered && this.addWindowListener(t), n && this.sendRetainedArgumentsForEvent(e); const o = async () => this.removeListener(e, s); return Promise.resolve({ remove: o }); }
    async removeAllListeners() { this.listeners = {}; for (const e in this.windowListeners)
        this.removeWindowListener(this.windowListeners[e]); this.windowListeners = {}; }
    notifyListeners(e, s, n) { const a = this.listeners[e]; if (!a) {
        if (n) {
            let t = this.retainedEventArguments[e];
            t || (t = []), t.push(s), this.retainedEventArguments[e] = t;
        }
        return;
    } a.forEach(t => t(s)); }
    hasListeners(e) { var s; return !!(!((s = this.listeners[e]) === null || s === void 0) && s.length); }
    registerWindowListener(e, s) { this.windowListeners[s] = { registered: !1, windowEventName: e, pluginEventName: s, handler: n => { this.notifyListeners(s, n); } }; }
    unimplemented(e = "not implemented") { return new pe.Exception(e, Z.Unimplemented); }
    unavailable(e = "not available") { return new pe.Exception(e, Z.Unavailable); }
    async removeListener(e, s) { const n = this.listeners[e]; if (!n)
        return; const a = n.indexOf(s); this.listeners[e].splice(a, 1), this.listeners[e].length || this.removeWindowListener(this.windowListeners[e]); }
    addWindowListener(e) { window.addEventListener(e.windowEventName, e.handler), e.registered = !0; }
    removeWindowListener(e) { e && (window.removeEventListener(e.windowEventName, e.handler), e.registered = !1); }
    sendRetainedArgumentsForEvent(e) { const s = this.retainedEventArguments[e]; s && (delete this.retainedEventArguments[e], s.forEach(n => { this.notifyListeners(e, n); })); }
}
const Ae = i => encodeURIComponent(i).replace(/%(2[346B]|5E|60|7C)/g, decodeURIComponent).replace(/[()]/g, escape), Me = i => i.replace(/(%[\dA-F]{2})+/gi, decodeURIComponent);
class yt extends je {
    async getCookies() { const e = document.cookie, s = {}; return e.split(";").forEach(n => { if (n.length <= 0)
        return; let [a, t] = n.replace(/=/, "CAP_COOKIE").split("CAP_COOKIE"); a = Me(a).trim(), t = Me(t).trim(), s[a] = t; }), s; }
    async setCookie(e) { try {
        const s = Ae(e.key), n = Ae(e.value), a = e.expires ? `; expires=${e.expires.replace("expires=", "")}` : "", t = (e.path || "/").replace("path=", ""), o = e.url != null && e.url.length > 0 ? `domain=${e.url}` : "";
        document.cookie = `${s}=${n || ""}${a}; path=${t}; ${o};`;
    }
    catch (s) {
        return Promise.reject(s);
    } }
    async deleteCookie(e) { try {
        document.cookie = `${e.key}=; Max-Age=0`;
    }
    catch (s) {
        return Promise.reject(s);
    } }
    async clearCookies() { try {
        const e = document.cookie.split(";") || [];
        for (const s of e)
            document.cookie = s.replace(/^ +/, "").replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
    }
    catch (e) {
        return Promise.reject(e);
    } }
    async clearAllCookies() { try {
        await this.clearCookies();
    }
    catch (e) {
        return Promise.reject(e);
    } }
}
ye("CapacitorCookies", { web: () => new yt });
const vt = async (i) => new Promise((e, s) => { const n = new FileReader; n.onload = () => { const a = n.result; e(a.indexOf(",") >= 0 ? a.split(",")[1] : a); }, n.onerror = a => s(a), n.readAsDataURL(i); }), xt = (i = {}) => { const e = Object.keys(i); return Object.keys(i).map(a => a.toLocaleLowerCase()).reduce((a, t, o) => (a[t] = i[e[o]], a), {}); }, Ct = (i, e = !0) => i ? Object.entries(i).reduce((n, a) => { const [t, o] = a; let l, r; return Array.isArray(o) ? (r = "", o.forEach(h => { l = e ? encodeURIComponent(h) : h, r += `${t}=${l}&`; }), r.slice(0, -1)) : (l = e ? encodeURIComponent(o) : o, r = `${t}=${l}`), `${n}&${r}`; }, "").substr(1) : null, kt = (i, e = {}) => { const s = Object.assign({ method: i.method || "GET", headers: i.headers }, e), a = xt(i.headers)["content-type"] || ""; if (typeof i.data == "string")
    s.body = i.data;
else if (a.includes("application/x-www-form-urlencoded")) {
    const t = new URLSearchParams;
    for (const [o, l] of Object.entries(i.data || {}))
        t.set(o, l);
    s.body = t.toString();
}
else if (a.includes("multipart/form-data") || i.data instanceof FormData) {
    const t = new FormData;
    if (i.data instanceof FormData)
        i.data.forEach((l, r) => { t.append(r, l); });
    else
        for (const l of Object.keys(i.data))
            t.append(l, i.data[l]);
    s.body = t;
    const o = new Headers(s.headers);
    o.delete("content-type"), s.headers = o;
}
else
    (a.includes("application/json") || typeof i.data == "object") && (s.body = JSON.stringify(i.data)); return s; };
class Et extends je {
    async request(e) { const s = kt(e, e.webFetchExtra), n = Ct(e.params, e.shouldEncodeUrlParams), a = n ? `${e.url}?${n}` : e.url, t = await fetch(a, s), o = t.headers.get("content-type") || ""; let { responseType: l = "text" } = t.ok ? e : {}; o.includes("application/json") && (l = "json"); let r, h; switch (l) {
        case "arraybuffer":
        case "blob":
            h = await t.blob(), r = await vt(h);
            break;
        case "json":
            r = await t.json();
            break;
        case "document":
        case "text":
        default: r = await t.text();
    } const d = {}; return t.headers.forEach((u, p) => { d[p] = u; }), { data: r, headers: d, status: t.status, url: t.url }; }
    async get(e) { return this.request(Object.assign(Object.assign({}, e), { method: "GET" })); }
    async post(e) { return this.request(Object.assign(Object.assign({}, e), { method: "POST" })); }
    async put(e) { return this.request(Object.assign(Object.assign({}, e), { method: "PUT" })); }
    async patch(e) { return this.request(Object.assign(Object.assign({}, e), { method: "PATCH" })); }
    async delete(e) { return this.request(Object.assign(Object.assign({}, e), { method: "DELETE" })); }
}
ye("CapacitorHttp", { web: () => new Et });
var fe;
(function (i) { i.Heavy = "HEAVY", i.Medium = "MEDIUM", i.Light = "LIGHT"; })(fe || (fe = {}));
var Te;
(function (i) { i.Success = "SUCCESS", i.Warning = "WARNING", i.Error = "ERROR"; })(Te || (Te = {}));
const St = ye("Haptics", { web: () => Re(() => import("./web-CwqxwgSo.js"), __vite__mapDeps([0, 1, 2])).then(i => new i.HapticsWeb) }), re = document.querySelector("#app");
re.innerHTML = `
<canvas id="world" aria-label="Cooperative boat obstacle course"></canvas>
<div class="menu-shade"></div>
<header id="menu-header"><span class="game-brand"><img src="/brand/icon-192.png" alt=""> FC <small>FART CREW</small></span><nav><button id="how" aria-label="How to play">?</button><button id="records" aria-label="Journey records">⚑</button><button id="settings" aria-label="Settings">⚙</button></nav></header>
<main id="menu"><section class="launch-panel"><span class="overline">A COOPERATIVE PHYSICS ADVENTURE</span><h1>FART<span>CREW</span></h1><p class="tagline">One boat. One crew.<br>Find your direction. Make some wind.</p><button id="choose-animal" class="character-choice"></button><div class="launch-options"><label>CREW SIZE<select id="crew-size"><option value="4">Up to 4 players</option><option value="8">Up to 8 · large boat</option></select></label><label>PLAY TOGETHER<select id="play-style"><option value="online">Online / LAN</option><option value="local">Local / shared screen</option></select></label></div><button id="local-setup" class="quiet-button" hidden>Configure local players ↗</button><div class="launch-actions"><button id="play" class="game-button">ASSEMBLE CREW <span>→</span></button><button id="join" class="outline-button">JOIN A BOAT</button></div><div class="co-op-note"><i></i> EVERY PLAYER STEERS THE SAME RAFT</div></section><section class="course-picker"><div class="picker-title"><span>CHOOSE YOUR JOURNEY</span><small id="course-description"></small></div><div id="courses"></div></section></main>
<section id="game-ui" hidden>
<div class="journey-progress" aria-label="Journey progress"><i id="progress-fill"></i><b style="left:30.9%">⚑</b><b style="left:61.8%">⚑</b><b style="left:87.1%">⚑</b><span>⚑</span></div>
<div class="fuel-hud"><button id="crew-details" aria-label="Crew details"><span id="hud-avatar">🦛</span></button><div><span id="hud-name">Captain</span><div class="fuel-meter"><i id="gas-fill"></i></div><small id="gas-number">100% GAS</small></div></div>
<div class="timer-hud"><span>◷</span><strong id="timer">00:00.00</strong><small id="route-name"></small></div>
<div class="reset-hud"><button id="rescue" aria-label="Vote to reset boat">⟳</button><strong id="resets">0</strong><span>COINS <b id="coins">0</b> | RAFT <b id="health">100</b>%</span><button id="camera-mode" aria-label="Change camera view">▧</button></div>
<div id="name-tags" aria-hidden="true"></div>
<div id="lobby" class="game-panel"><span class="overline">ALL ABOARD THE SAME BOAT</span><h2>Bring the crew together.</h2><p id="lobby-description">Share your room code. Pick a seat. Everyone’s thrust moves the same raft.</p><button id="copy-code" class="room-code" title="Copy invite link"></button><div id="lobby-crew"></div><button id="start" class="game-button">START JOURNEY <span>→</span></button><small id="host-note"></small></div>
<div id="countdown" hidden></div>
<div class="session-footer"><button id="session-menu"><kbd>ESC</kbd> MENU</button><span id="keyboard-hint">SPACE · GAS &nbsp; Q/E · MOVE &nbsp; COORDINATE TO TURN</span><button id="control-help" aria-label="Show controls">?</button></div>
<div id="controls" hidden><div class="aim-control"><div id="joystick" aria-label="Drag to aim thrust"><span>+</span><div id="knob"></div></div><small>AIM THRUST</small><div class="shuffle-controls"><button id="shuffle-left" aria-label="Move sideways left">◀</button><span>MOVE ON RAFT</span><button id="shuffle-right" aria-label="Move sideways right">▶</button></div></div><div class="gas-control"><label>POWER <input id="power" aria-label="Thrust power" type="range" min="20" max="100" value="80"></label><button id="thrust" aria-label="Hold to thrust"><span>≋</span><b>GAS</b></button><small>HOLD TO THRUST</small><button id="balance" aria-label="Hold to lean toward aim">LEAN</button></div></div>
<div id="finish" class="game-panel" hidden><span class="overline">THE WHOLE CREW MADE IT</span><h2>Better together.</h2><p>Your crew guided one boat through the entire course.</p><strong id="finish-time"></strong><p id="finish-detail"></p><button id="again" class="game-button">ANOTHER JOURNEY →</button><button id="finish-home" class="quiet-button">BACK TO SHORE</button></div>
<div id="failed" class="game-panel failure-panel" hidden><span class="overline">TEAM FAILED</span><h2>POP! Raft burst.</h2><p id="failure-reason"></p><p>One spike ends the journey for the whole crew.</p><button id="retry" class="game-button">TRY AGAIN →</button><small id="retry-note">Waiting for the host to restart.</small><button id="failed-home" class="quiet-button">BACK TO SHORE</button></div></section><div id="toast" role="status"></div><dialog id="modal"><button id="close-modal" aria-label="Close dialog">×</button><div id="modal-content"></div></dialog>`;
const c = i => document.getElementById(i);
function Ie(i, e) { try {
    return JSON.parse(localStorage.getItem(i) || "null") ?? e;
}
catch {
    return e;
} }
function ve(i, e) { try {
    localStorage.setItem(i, JSON.stringify(e));
}
catch { } }
function X(i) { return i.replace(/[&<>"']/g, e => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[e]); }
const y = Ie("ft-profile", { name: "Captain", character: "hippo", wins: 0 });
nt(y.character) || (y.character = "hippo");
const K = Ie("ft-settings", { sound: !0, haptics: !0, reduced: !1 });
const fartAudio = new FartAudio(()=>K.sound);
let Y = "lagoon", ne = 4, ee = "online", k, de = !1, me = !1, ge = "", we = 0, T = [{ name: y.name, character: y.character, binding: "keyboard0" }, { name: "Player 2", character: "croc", binding: "keyboard1" }];
const E = new mt;
let x;
try {
    x = new dt(c("world")), x.reduced = K.reduced, x.setPreview(y.character);
}
catch (i) {
    console.error(i), c("play").setAttribute("disabled", "true"), re.insertAdjacentHTML("beforeend", '<div class="renderer-error">WebGL could not start. Enable browser hardware acceleration and reload.</div>');
}
const U = new ut(c("joystick"), c("thrust"), c("knob"), c("balance")), Q = new ft;
let N;
function oe(i, e = .15) { if (K.sound)
    try {
        N ?? (N = new AudioContext), N.resume();
        const s = N.createOscillator(), n = N.createGain();
        s.type = "sine", s.frequency.setValueAtTime(i, N.currentTime), s.frequency.exponentialRampToValueAtTime(Math.max(25, i * .4), N.currentTime + e), n.gain.setValueAtTime(.055, N.currentTime), n.gain.exponentialRampToValueAtTime(.001, N.currentTime + e), s.connect(n), n.connect(N.destination), s.start(), s.stop(N.currentTime + e);
    }
    catch { } }
let Le;
function B(i) { c("toast").textContent = i, c("toast").classList.add("show"), clearTimeout(Le), Le = window.setTimeout(() => c("toast").classList.remove("show"), 3500); }
function _(i) { U.keys.clear(), U.firing = !1, U.move=0, U.leaning=false, Q.keys.clear(), c("modal-content").innerHTML = i, c("modal").open || c("modal").showModal(); }
function q() { c("modal").close(); }
c("close-modal").onclick = q;
c("modal").addEventListener("click", i => { i.target === c("modal") && q(); });
function Ue() { const i = I[y.character]; c("choose-animal").innerHTML = `<span class="animal-icon" style="--animal:${i.color}">${i.emoji}</span><span>${X(y.name)}<small>${i.name} · ${i.species}</small></span><b>CHANGE ↗</b>`, x == null || x.setPreview(y.character); }
function zt() { _(`<span class="overline">YOUR SEAT ON THE BOAT</span><h2>Choose your character.</h2><label>PLAYER NAME<input id="player-name" maxlength="18" value="${X(y.name)}"></label><div class="animal-grid">${Object.entries(I).map(([i, e]) => `<button data-animal="${i}" class="animal-card ${i === y.character ? "selected" : ""}" aria-pressed="${i === y.character}" style="--animal:${e.color}"><span>${e.emoji}</span><strong>${e.name}</strong><small>${e.species}</small></button>`).join("")}</div><p>All characters share the same physics. Character changes apply before the journey starts.</p>`), document.querySelectorAll("[data-animal]").forEach(i => i.onclick = () => { y.name = c("player-name").value.trim() || "Captain", y.character = i.dataset.animal, T[0].name = y.name, T[0].character = y.character, ve("ft-profile", y), Ue(), E.action("character", { character: y.character }), q(); }), c("cloud-profile") && (c("cloud-profile").onclick = async () => { try {
    const { createClient: i } = await Re(async () => { const { createClient: o } = await import("./cloud-D5pNigs1.js"); return { createClient: o }; }, []), e = i(void 0, void 0), { data: s } = await e.auth.getSession(), { data: n, error: a } = s.session ? { data: { user: s.session.user }, error: null } : await e.auth.signInAnonymously();
    if (a)
        throw a;
    const t = await e.from("profiles").upsert({ id: n.user.id, name: y.name, character: y.character, skin: "classic" });
    if (t.error)
        throw t.error;
    B("Cloud profile connected.");
}
catch {
    B("Cloud profile unavailable. Check Supabase settings and migrations.");
} }); }
c("choose-animal").onclick = zt;
Ue();
function De() { c("courses").innerHTML = Object.entries(J).map(([i, e], s) => `<button class="course-card ${i === Y ? "selected" : ""} ${i}" data-course="${i}" aria-pressed="${i === Y}"><svg viewBox="0 0 200 85" aria-hidden="true"><path class="river-bank" d="M-15 68 C50 100 50 -10 104 24 S140 110 215 6"/><path class="river-line" d="M-15 68 C50 100 50 -10 104 24 S140 110 215 6"/><path class="river-flow" d="M-15 68 C50 100 50 -10 104 24 S140 110 215 6"/></svg><span class="course-number">0${s + 1}</span><span class="course-title">${e.name}<small>${i === "lagoon" ? "CANYON / WINDING CHANNELS" : i === "rapids" ? "JUNGLE / HIGH BRIDGES" : "GROTTO / ROCKY PASSAGES"}</small></span><b>${i === Y ? "✓" : "↗"}</b></button>`).join(""), c("course-description").textContent = J[Y].subtitle, document.querySelectorAll("[data-course]").forEach(i => i.onclick = () => { Y = i.dataset.course, x == null || x.setCourse(Y), De(); }); }
De();
function Ne() { const i = () => T.forEach((s, n) => { c(`local-name-${n}`) && (s.name = c(`local-name-${n}`).value.trim() || `Player ${n + 1}`, s.character = c(`local-animal-${n}`).value, s.binding = c(`local-bind-${n}`).value); }), e = () => { c("modal-content").innerHTML = `<span class="overline">ONE SCREEN. ONE SHARED RAFT.</span><h2>Assemble your local crew.</h2><label>LOCAL PLAYERS<select id="local-count">${Array.from({ length: ne }, (s, n) => `<option value="${n + 1}" ${n + 1 === T.length ? "selected" : ""}>${n + 1} players</option>`).join("")}</select></label><div class="local-roster">${T.map((s, n) => `<div class="local-player"><b>P${n + 1}</b><input id="local-name-${n}" aria-label="Player ${n + 1} name" value="${X(s.name)}" maxlength="18"><select id="local-animal-${n}" aria-label="Player ${n + 1} character">${Object.entries(I).map(([a, t]) => `<option value="${a}" ${s.character === a ? "selected" : ""}>${t.name} · ${t.species}</option>`).join("")}</select><select id="local-bind-${n}" aria-label="Player ${n + 1} controls">${pt.map(a => `<option value="${a.id}" ${s.binding === a.id ? "selected" : ""}>${a.name}</option>`).join("")}</select></div>`).join("")}</div><p>Keyboard 1: WASD + Space. Keyboard 2: arrows + Enter. Additional keyboard layouts and gamepads are available. Press a controller button after connecting it.</p><button id="save-local" class="game-button">CREW READY →</button>`, c("local-count").onchange = () => { i(); const s = Number(c("local-count").value); T = Array.from({ length: s }, (n, a) => T[a] || { name: `Player ${a + 1}`, character: Object.keys(I)[a % 6], binding: a < 2 ? `keyboard${a}` : `gamepad${a - 2}` }), e(); }, c("save-local").onclick = () => { if (i(), new Set(T.map(s => s.binding)).size !== T.length) {
    B("Assign a distinct keyboard layout or gamepad to each person.");
    return;
} c("local-setup").textContent = `${T.length} local players · Configure ↗`, q(); }; }; _(""), e(); }
c("local-setup").onclick = Ne;
c("crew-size").onchange = () => { ne = Number(c("crew-size").value), T = T.slice(0, ne); };
c("play-style").onchange = () => { ee = c("play-style").value, c("local-setup").hidden = ee !== "local", ee === "local" && Ne(); };
function At() { const i = k; i && (_(`<span class="overline">EVERYONE SHARES ONE BOAT</span><h2>Your crew.</h2><div class="crew-list">${i.players.map(e => `<div><span style="background:${I[e.character || "hippo"].color}">${I[e.character || "hippo"].emoji}</span><strong>${X(e.name)}<small>Grip ${e.seat + 1} · ${Math.round(e.gas)}% gas · shift ${Math.round((e.grip||0)*100)}%</small></strong></div>`).join("")}</div><p>Room code: <b>${i.room}</b> · ${i.players.length}/${i.crewSize || 4} aboard</p><button id="invite-copy" class="outline-button">COPY INVITE LINK</button>`), c("invite-copy").onclick = xe); }
c("crew-details").onclick = At;
function Mt(i) { var l; c("failed").hidden=i.phase!=="failed";c("failure-reason").textContent=i.failure||"";c("retry").hidden=i.host!==E.room?.sessionId;c("retry-note").hidden=i.host===E.room?.sessionId;c("rescue").disabled=i.phase!=="playing"; c("coins").textContent=String(i.coins||0),c("health").textContent=String(Math.ceil(i.boats[0].health??100)),k = i, x == null || x.update(i); const e = i.players.find(r => { var h; return r.id === ((h = E.room) == null ? void 0 : h.sessionId); }), s = i.boats[0], n = i.players.filter(r => { var h; return (r.owner || r.id) === ((h = E.room) == null ? void 0 : h.sessionId); }); c("timer").textContent = ue(s.finishTime ?? i.time + i.penalties), c("route-name").textContent = J[i.course].name, c("progress-fill").style.width = `${Math.max(0, Math.min(100, (i.z - 5) / (at - 5) * 100))}%`, c("resets").textContent = String(i.penalties / 5), c("hud-name").textContent = (e == null ? void 0 : e.name) || "Crew", c("hud-avatar").textContent = I[(e == null ? void 0 : e.character) || "hippo"].emoji; const a = (e == null ? void 0 : e.gas) ?? 100; c("gas-fill").style.width = `${a}%`, c("gas-fill").classList.toggle("low", a < 20), c("gas-number").textContent = `${Math.round(a)}% GAS`, c("copy-code").textContent = i.room + " ⧉", c("lobby-crew").innerHTML = i.players.map(r => `<div style="--player:${I[r.character || "hippo"].color}"><span>${I[r.character || "hippo"].emoji}</span><small>${X(r.name)}</small></div>`).join(""); const t = i.host === ((l = E.room) == null ? void 0 : l.sessionId); c("start").hidden = !t, c("host-note").textContent = t ? `${i.players.length}/${i.crewSize || 4} aboard · Start when your crew is ready. Solo practice is available.` : "Waiting for the host to begin the journey.", c("lobby").hidden = i.phase !== "lobby", c("finish").hidden = i.phase !== "finished", c("controls").hidden = i.phase !== "playing", c("again").hidden = !t, U.active = i.phase === "playing" && i.countdown <= 0, U.splitKeyboard = n.length > 1, Q.active = U.active, c("countdown").hidden = i.countdown <= 0 || i.phase !== "playing", c("countdown").textContent = Math.ceil(i.countdown).toString(), i.countdown > 0 && Math.ceil(i.countdown) !== we && (we = Math.ceil(i.countdown), oe(400, .12)); const o = new Set(i.players.map(r => r.id)); for (const r of c("name-tags").querySelectorAll("[data-player]"))
    o.has(r.dataset.player) || r.remove(); for (const r of i.players) {
    let h = Array.from(c("name-tags").children).find(d => d.dataset.player === r.id);
    h || (h = document.createElement("div"), h.className = "name-tag", h.dataset.player = r.id, h.textContent = r.name, c("name-tags").appendChild(h)), h.classList.toggle("thrusting", r.thrust > 0);
} c("name-tags").hidden = i.phase === "lobby" || i.phase === "finished", i.phase === "finished" && ge !== "finished" && (y.wins++, ve("ft-profile", y), c("finish-time").textContent = ue(s.finishTime ?? i.time + i.penalties), c("finish-detail").textContent = `${i.players.length} crewmates · ${i.penalties / 5} resets · ${y.wins} journeys completed`, oe(550, .5), K.haptics && St.impact({ style: fe.Medium }).catch(() => { })), ge = i.phase; }
x && (x.onNames = i => { for (const e of i) {
    const s = Array.from(c("name-tags").children).find(n => n.dataset.player === e.id);
    s && (s.style.transform = `translate(${e.x}px,${e.y}px) translate(-50%,-100%)`, s.hidden = !e.visible);
} });
async function be(i, e = "") { if (!de) {
    de = !0, c("play").textContent = "ASSEMBLING…";
    try {
        me = !1, ge = "", we = 0, await E.connect(i, y.name, Y, "classic", e, Mt, B, () => { me || (E.room = void 0, B("Crew connection closed. You can rejoin while others remain aboard."), We()); }, { crewSize: ne, character: y.character, ...ee === "local" ? { localPlayers: T } : {} }), q(), c("menu").hidden = !0, c("menu-header").hidden = !0, c("game-ui").hidden = !1, re.classList.add("in-game"), x.playing = !0;
        const s = new URL(location.href);
        s.searchParams.set("room", E.room.roomId), history.replaceState(null, "", s), oe(240, .2);
    }
    catch (s) {
        console.error(s), B(i === "join" ? "Could not join that boat. Check the code and available seats." : "Could not reach the crew server. Check the server address in Settings and make sure the server is running.");
    }
    finally {
        de = !1, c("play").innerHTML = "ASSEMBLE CREW <span>→</span>";
    }
} }
function We() { k = void 0, U.active = !1, U.keys.clear(), U.firing = !1, Q.active = !1, Q.keys.clear(), x.playing = !1, x.state = void 0, c("menu").hidden = !1, c("menu-header").hidden = !1, c("game-ui").hidden = !0, c("name-tags").innerHTML = "", re.classList.remove("in-game"); const i = new URL(location.href); i.searchParams.delete("room"), history.replaceState(null, "", i); }
async function Ke() { me = !0, await E.leave(), q(), We(); }
async function xe() { const i = new URL(serverURL().replace(/^ws/,"http")); k && i.searchParams.set("room", k.room); try {
    await navigator.clipboard.writeText(i.toString()), B("Crew invite copied.");
}
catch {
    B(`Share room code: ${k == null ? void 0 : k.room}`);
} }
c("play").onclick = () => be("create");
c("join").onclick = () => { _('<span class="overline">YOUR CREW IS WAITING</span><h2>Join their boat.</h2><form id="join-form"><label>ROOM CODE<input id="room-code" maxlength="6" placeholder="ABC123" pattern="[a-zA-Z0-9]{6}" required autocomplete="off"></label><button class="game-button">JOIN CREW →</button></form><button id="quick" class="quiet-button">Find an open co-op crew</button>'), c("join-form").onsubmit = i => { i.preventDefault(), be("join", c("room-code").value); }, c("quick").onclick = () => be("quick"), c("room-code").focus(); };
c("start").onclick = () => E.action("start");
c("again").onclick = () => E.action("restart");c("retry").onclick=()=>E.action("restart");c("failed-home").onclick=Ke;
c("finish-home").onclick = Ke;
c("copy-code").onclick = xe;
c("rescue").onclick = () => { for (const i of (k == null ? void 0 : k.players.filter(e => { var s; return (e.owner || e.id) === ((s = E.room) == null ? void 0 : s.sessionId); })) || [])
    E.action("rescue", { id: i.id }); };
c("camera-mode").onclick = () => { x.cameraMode = x.cameraMode === "bird" ? "isometric" : "bird", B(x.cameraMode === "bird" ? "Bird view" : "Follow camera"); };
c("power").oninput = i => U.strength = Number(i.target.value) / 100;
function Be() { _('<span class="overline">COORDINATE. STEER. STAY TOGETHER.</span><h2>One crew. One raft.</h2><div class="instructions"><b>01 · DIRECTION</b><p>Gas leaves the butt of your animal and pushes the raft in the direction the animal faces. Opposite seats can cancel each other. Coordinate which crew members fire; the rear pair can push forward.</p><b>02 · TIMING & POWER</b><p>Hold Space or the gas button to thrust. Adjust the power slider. Release to refill gas. Players at different seats create different turning forces. Use the two MOVE ON RAFT buttons or Q/E to shuffle sideways. Use Shift plus a direction on keyboard to counterbalance.</p><b>03 · FOLLOW THE CHANNEL</b><p>Steer through bends and narrow elevated canals. Avoid the spiked banks, curled sweepers and sliding barriers. Build speed using coordinated gas before jumping a gap. Touching any spike instantly pops the raft and fails the entire crew.</p><b>04 · FINISH TOGETHER</b><p>Checkpoints save the whole crew. The reset button needs half the crew’s votes and adds five seconds. Reach the final flags together. There are no opposing boats or race standings.</p></div><p>Local keyboard layouts and gamepad assignments are configured before joining. Every local and online player steers this same boat.</p>'); }
c("how").onclick = Be;
c("control-help").onclick = Be;
function Fe() { _(`<span class="overline">STILL ABOARD</span><h2>${k ? J[k.course].name : "Your journey"}</h2><p>The boat continues moving while this menu is open. Room code: <b>${k == null ? void 0 : k.room}</b></p><button id="resume" class="game-button">RETURN TO THE RAFT →</button><button id="invite-session" class="outline-button">COPY CREW INVITE</button><button id="leave-session" class="quiet-button">LEAVE CREW</button>`), c("resume").onclick = q, c("invite-session").onclick = xe, c("leave-session").onclick = Ke; }
c("session-menu").onclick = Fe;
window.addEventListener("keydown", i => { i.code !== "Escape" || !E.room || (i.preventDefault(), c("modal").open ? q() : Fe()); });
c("settings").onclick = () => { _(`<span class="overline">MAKE YOURSELF AT HOME</span><h2>Settings.</h2><label class="setting">Sound effects<input id="sound-toggle" type="checkbox" ${K.sound ? "checked" : ""}></label><label class="setting">Haptics on supported devices<input id="haptic-toggle" type="checkbox" ${K.haptics ? "checked" : ""}></label><label class="setting">Reduce motion<input id="motion-toggle" type="checkbox" ${K.reduced ? "checked" : ""}></label>`); for (const [i, e] of [["sound-toggle", "sound"], ["haptic-toggle", "haptics"], ["motion-toggle", "reduced"]])
    c(i).onchange = s => { K[e] = s.target.checked, ve("ft-settings", K), x.reduced = K.reduced; }; };
c("records").onclick = async () => { _(`<span class="overline">JOURNEYS COMPLETED TOGETHER</span><h2>Crew logbook.</h2><label>COURSE<select id="record-course">${Object.entries(J).map(([i, e]) => `<option value="${i}">${e.name}</option>`).join("")}</select></label><div id="record-list">Opening the logbook…</div><p>Completion records include checkpoint reset penalties. These are co-op journeys, not race standings.</p>`); try {
    const i = await fetch(He().replace(/^ws/, "http") + "/api/leaderboard");
    if (!i.ok)
        throw new Error;
    const e = await i.json();
    if (!c("record-course"))
        return;
    const s = () => { const n = e.filter(a => (!a.mode || a.mode === "coop") && a.course === c("record-course").value).slice(0, 12); c("record-list").innerHTML = n.length ? n.map(a => `<div class="record"><span>${X(a.name)}<small>${new Date(a.date).toLocaleDateString()}</small></span><strong>${ue(a.time)}</strong></div>`).join("") : '<div class="empty-state">Your crew can be the first to complete this journey.</div>'; };
    c("record-course").value = Y, c("record-course").onchange = s, s();
}
catch {
    c("record-list") && (c("record-list").textContent = "The logbook is unavailable. Check the game server.");
} };

setInterval(() => { if (!E.room) { fartAudio.stop(); return; } const i = c("modal").open, e = i ? { x: 0, z: 0, power: 0 } : U.read(), s = (k == null ? void 0 : k.players.filter(a => { var t; return (a.owner || a.id) === ((t = E.room) == null ? void 0 : t.sessionId); })) || []; ee === "local" ? (Q.active = !i && U.active, E.localInputs(s.map((a, t) => ({ id: a.id, input: Q.read(t, T[t] || T[0], e) })))) : E.input(e), x.setAim(e.x, e.z, e.power), fartAudio.update(k?.players || [], K.sound && k?.phase === "playing" && k.countdown <= 0 && !i); }, 50);
const Oe = new URL(location.href).searchParams.get("room");
Oe && (c("join").click(), c("room-code").value = Oe.toUpperCase());
export { fe as I, Te as N, je as W };

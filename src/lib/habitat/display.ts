import { createMatch, pointScore, decidingPoint, type Match } from "./match";
import type { Usage } from "./usage";
type Provider = { source?: string; usage?: Usage };
type Report = Provider & { tennis?: Provider };
let report: Report = {}, shots = 0;
let match = createMatch();
const history: string[] = [];
let current = "";
const pt = () => document.documentElement.lang.toLowerCase().startsWith("pt");
const word = (en: string, br: string) => pt() ? br : en;
const num = (n: number) => n.toLocaleString(pt() ? "pt-BR" : "en-US");
const set = (id: string, value: string) => { const el = document.getElementById(id); if (el) el.textContent = value; };
const labels: Record<string, [string, string]> = {
  rally: ["A rally", "Uma troca de bolas"], lob: ["Lob", "Lob"], drop: ["Drop shot", "Deixadinha"], drive: ["Drive", "Drive"],
  break: ["Taking a breather", "Uma pausa"], gull: ["Inviting a gull", "Convidando uma gaivota"], crab: ["Inviting a crab", "Convidando um caranguejo"],
  balanced: ["balanced", "em equilíbrio"], stretched: ["recovering position", "recuperando a posição"], tired: ["tired", "cansado(a)"],
};
const label = (key: string) => labels[key]?.[pt() ? 1 : 0] ?? key;
function render() {
  renderScore();
  set("habitat-latest", current || word("Waiting for the first point", "Esperando o primeiro ponto"));
  set("habitat-shots", num(shots));
  const providers = [report, report.tennis ?? {}];
  const active = providers.filter(p => p.source && p.source !== "local");
  const complete = active.length > 0 && active.every(p => p.usage?.input != null && p.usage?.output != null);
  set("habitat-tokens", complete ? num(active.reduce((n, p) => n + p.usage!.input! + p.usage!.output!, 0)) : "—");
  const lite = matchMedia("(prefers-reduced-motion: reduce)").matches;
  set("habitat-mode", lite ? word("A quiet beach. The AI stays quiet here.", "Praia tranquila. A IA fica quieta por aqui.") : active.length ? word("The AI calls the shots. The plans stick around for the whole game.", "A IA dita as jogadas. Os planos valem pelo jogo inteiro.") : word("The beach plays by feel. No AI today.", "A praia joga no instinto. Sem IA hoje."));
  const container = document.getElementById("habitat-providers");
  if (container) {
    container.replaceChildren(...providers.map((p, i) => {
      const row = document.createElement("p"), title = document.createElement("strong");
      title.textContent = i ? word("Tennis coach · TypeSafe", "Treinador · TypeSafe") : word("Beach director · OpenRouter", "Diretor da praia · OpenRouter");
      row.append(title);
      const u = p.usage;
      if (!p.source || p.source === "local") row.append(word("Playing it by ear", "Jogando no instinto"));
      else {
        row.append(`${u?.model ?? p.source} · `);
        row.append(u?.input != null && u?.output != null ? `${num(u.input)} ${word("in", "entrada")} / ${num(u.output)} ${word("out", "saída")}` : word("no token count", "sem contagem de tokens"));
        if (u?.generatedAt && Number.isFinite(Date.parse(u.generatedAt))) {
          row.append(document.createElement("br"), `${word("Called in at", "Chamado às")} ${new Date(u.generatedAt).toLocaleTimeString(pt() ? "pt-BR" : "en-US", { hour: "2-digit", minute: "2-digit" })} · ${word("good for the whole game", "vale pelo jogo inteiro")}`);
        }
      }
      return row;
    }));
  }
  const log = document.getElementById("habitat-decisions");
  if (log && history.length) log.replaceChildren(...history.map(text => { const li = document.createElement("li"); li.textContent = text; return li; }));
}
const playerName = (player: number) => player === 0 ? "Donald" : word("Wife", "Esposa");
const reasons: Record<string, [string, string]> = {
  in: ["Ball on the sand", "Bola na areia"], out: ["Out", "Fora"], net: ["Into the net", "Bola na rede"],
  "net-touch": ["Net contact", "Toque na rede"], "double-hit": ["Second contact", "Segundo toque"], "serve-fault": ["Service fault", "Falta de saque"],
};
function renderScore() {
  const points = pointScore(match);
  const games = `${match.games[0]} × ${match.games[1]}`;
  const finished = match.winner !== null;
  set("habitat-sign-status", finished ? games : `${points[0]} × ${points[1]}`);
  set("habitat-sign-games", finished ? word("Final · AI ↗", "Final · IA ↗") : `${word("Games", "Games")} ${games} · ${word("AI", "IA")} ↗`);
  const status = finished ? `${playerName(match.winner!)} ${word("wins", "venceu")}` : decidingPoint(match) ? word("Deciding point", "Ponto decisivo") : `${match.tieBreak ? "TB · " : ""}${playerName(match.server)} ${word("serves", "saca")}`;
  set("habitat-sign-hint", status);
  set("habitat-match-score", `${word("Games", "Games")} ${games} · ${match.tieBreak ? "Tie-break" : word("Points", "Pontos")} ${points[0]} × ${points[1]}`);
  set("habitat-match-status", decidingPoint(match) ? `${status} · ${playerName(match.server)} ${word("serves", "saca")}` : status);
  const serveDot = document.getElementById("habitat-serve-dot");
  if (serveDot) { serveDot.setAttribute("cx", match.server === 0 ? "19" : "145"); serveDot.setAttribute("opacity", finished ? "0" : "1"); }
  document.getElementById("habitat-sign")?.setAttribute("aria-label", word(
    `Donald vs Wife. Games ${match.games[0]} to ${match.games[1]}. Points ${points[0]} to ${points[1]}. ${status}. Open the match notebook`,
    `Donald contra Esposa. Games ${match.games[0]} a ${match.games[1]}. Pontos ${points[0]} a ${points[1]}. ${status}. Abrir o caderno da partida`,
  ));
}
export function reportMatch(value: Match, announce = false) {
  match = value;
  if (announce && match.lastPoint) {
    const point = match.lastPoint;
    const reason = reasons[point.reason];
    current = `${playerName(point.winner)} · ${reason[pt() ? 1 : 0]}`;
    if (match.winner !== null) current = `${playerName(match.winner)} ${word("wins the match", "venceu a partida")} · ${match.games[0]} × ${match.games[1]}`;
    else if (point.game) current += ` · ${word("game", "game")}`;
    if (point.changeEnds) current += ` · ${word("changing ends", "troca de lados")}`;
    history.unshift(current); history.splice(6);
    set("habitat-latest", current);
  }
  renderScore();
  if ((document.getElementById("habitat-notes") as HTMLDialogElement | null)?.open) render();
}
export function reportHabitat(value: Report) { report = value; render(); }
export function recordHabitat(action: string, situation?: string, player?: number, serve = false) {
  if (situation) {
    shots++;
    const who = player === 0 ? "Donald" : word("His wife", "Sua esposa");
    current = `${label(action)} · ${shots}`;
    history.unshift(`${who}: ${label(action)} · ${serve ? word("serve, set by code", "saque, definido pelo código") : `${label(situation)} · ${report.tennis?.source === "typesafe" ? word("AI policy", "política de IA") : word("local rules", "regras locais")}`}`);
  } else { current = label(action); history.unshift(`${label(action)} · ${word("beach intention", "intenção da praia")}`); }
  history.splice(6);
  // Keep per-shot work small while the notebook is closed.
  set("habitat-latest", current);
  if ((document.getElementById("habitat-notes") as HTMLDialogElement | null)?.open) render();
}
export function initHabitatBoard() {
  const sign = document.getElementById("habitat-sign"), dialog = document.getElementById("habitat-notes") as HTMLDialogElement | null;
  if (!sign || !dialog) return;
  sign.addEventListener("click", () => { render(); dialog.showModal(); });
  document.getElementById("habitat-close")?.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
  render();
}

import type { Usage } from "./usage";
type Provider = { source?: string; usage?: Usage };
type Report = Provider & { tennis?: Provider };
let report: Report = {}, shots = 0;
const score = [0, 0];
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
  set("habitat-mode", lite ? word("A quiet beach. AI calls are paused in this view.", "Praia tranquila. Chamadas de IA pausadas nesta visualização.") : active.length ? word("AI-guided plans, reused as the beach plays.", "Planos guiados por IA, reutilizados durante o jogo.") : word("Local beach rhythm. No AI plan in use.", "Ritmo local da praia. Nenhum plano de IA em uso."));
  const container = document.getElementById("habitat-providers");
  if (container) {
    container.replaceChildren(...providers.map((p, i) => {
      const row = document.createElement("p"), title = document.createElement("strong");
      title.textContent = i ? word("Tennis coach · TypeSafe", "Treinador · TypeSafe") : word("Beach director · OpenRouter", "Diretor da praia · OpenRouter");
      row.append(title);
      const u = p.usage;
      if (!p.source || p.source === "local") row.append(word("Local rules in use", "Regras locais em uso"));
      else {
        row.append(`${u?.model ?? p.source} · `);
        row.append(u?.input != null && u?.output != null ? `${num(u.input)} ${word("in", "entrada")} / ${num(u.output)} ${word("out", "saída")}` : word("token count unavailable", "contagem de tokens indisponível"));
        if (u?.generatedAt && Number.isFinite(Date.parse(u.generatedAt))) {
          row.append(document.createElement("br"), `${word("Prepared", "Preparado")} ${new Date(u.generatedAt).toLocaleTimeString(pt() ? "pt-BR" : "en-US", { hour: "2-digit", minute: "2-digit" })} · ${word("reusable plan", "plano reutilizável")}`);
        }
      }
      return row;
    }));
  }
  const log = document.getElementById("habitat-decisions");
  if (log && history.length) log.replaceChildren(...history.map(text => { const li = document.createElement("li"); li.textContent = text; return li; }));
}
function renderScore() {
  set("habitat-sign-status", `${score[0]} × ${score[1]}`);
  document.getElementById("habitat-sign")?.setAttribute("aria-label", word(
    `Donald ${score[0]}, Wife ${score[1]} points. Open the AI match notebook`,
    `Donald ${score[0]}, Esposa ${score[1]} pontos. Abrir o caderno de IA da partida`,
  ));
}
export function awardHabitatPoint(winner: number) {
  if (winner !== 0 && winner !== 1) return;
  score[winner]++;
  current = `${word("Point", "Ponto")}: ${winner === 0 ? "Donald" : word("Wife", "Esposa")}`;
  history.unshift(`${current} · ${score[0]} × ${score[1]}`);
  history.splice(6);
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

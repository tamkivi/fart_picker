import Link from "next/link";
import { AuthPanel } from "@/components/auth-panel";
import { LanguageSwitch } from "@/components/language-switch";
import { Masthead } from "@/components/masthead";
import { ThemeToggle } from "@/components/theme-toggle";
import { getRequestLanguage } from "@/lib/server/lang";

export default async function FaqPage() {
  const lang = await getRequestLanguage();

  const faqs =
    lang === "et"
      ? [
          {
            q: "Mis on VRAM ja miks see AI jaoks oluline on?",
            a: "VRAM on mälu sinu GPU-l. Suurem osa mudeli kaaludest peab mahtuma VRAM-i kiireks inferentsiks. Lihtne reegel: 4-bitine kvantiseeritud mudel vajab umbes 0,5 GB miljardit parameetri kohta. Näiteks 7B mudel vajab ~4 GB, 13B mudel ~8 GB ja 70B mudel ~40 GB. Kui VRAM otsa saab, lähevad kihid CPU RAM-i — mis on 5–10× aeglasem.",
          },
          {
            q: "Milline ehitusprofiil sobib mulle?",
            a: "Kohalik LLM Inferents: igapäevane 7B–70B mudelite kasutus, parim VRAM hinna kohta. LLM Peenhäälestuse Starter: LoRA adapterite ja kohandatud treeningute jaoks, vajab rohkem RAM-i ja stabiilset jahutust. Hübriid AI + Mäng: AI arendus päeval, mängimine õhtul. Kui pole kindel, alusta Kohaliku LLM Inferentsiga.",
          },
          {
            q: "Kuidas tellimine toimib?",
            a: "Teed eeltellimuse. Seejärel otsime Eesti turult sinu ehituse jaoks hetkel odavaimad komponendid, tellin need ära, komplekteerime arvuti ning paigaldame vajaliku tarkvara kohalike mudelite käitamiseks (Ollama, Open WebUI vms). Hinnad uuenevad iga päev päristest kuulutustest.",
          },
          {
            q: "Kas kontot on vaja?",
            a: "Mitte sirvimiseks. Ehitused ja kataloog on kõigile avalikud. Kontot on vaja ainult eeltellimuse tegemiseks.",
          },
          {
            q: "NVIDIA vs AMD — kumba valida AI jaoks?",
            a: "NVIDIA on turvalisem valik: CUDA on tööstusstandard ja enamus AI tarkvara töötab sellega ilma probleemideta. AMD kaardid on sageli odavamad sama VRAM-i eest, kuid ROCm tugi on vähemküps ja mõned tööriistad vajavad lisaseadistust. Kui tahad, et kõik lihtsalt töötaks, vali NVIDIA. Kui oled valmis natuke nokitsema ja tahad rohkem VRAM-i oma rahaga, AMD väärib kaalumist.",
          },
          {
            q: "Kas tavaline mänguriarvuti sobib AI jaoks?",
            a: "Osaliselt. Mänguriarvutid on optimeeritud kõrge kaadrisageduse jaoks, kuid AI vajab palju VRAM-i suurte mudelite jaoks. Enamik mängurikaarte on 8–12 GB VRAM-iga, mis piirab käitatavaid mudelisuurusi. Siinsed AI-spetsiifilised ehitused valivad kaardid maksimaalse VRAM-i ja AI-jõudluse järgi, mitte mänguskooride järgi.",
          },
          {
            q: "Kui palju kiirem on kohalik AI võrreldes ChatGPT-ga?",
            a: "See sõltub riistvarast. Hea GPU-ga (nt RTX 4090) võid saavutada 50–100 tokenit sekundis 7B mudelitega — mis on kiirem kui enamik inimesi lugeda suudab. Suuremad mudelid on aeglasemad. Peamine eelis ei ole kiirus, vaid privaatsus, kulud ja offline-kasutus: peale esialgset riistavara kulu on iga päring tasuta.",
          },
          {
            q: "Millist tarkvara on vaja alustamiseks?",
            a: "Ollama on lihtsaim alguspunkt — installeeri, tõmba mudel käsuga 'ollama pull llama3' ja juba saad vestlema. Open WebUI annab sulle ChatGPT-sarnase veebiliidese selle peale. Kõik see on eelinstalleeritud kõikidele fart_picker ehitustele.",
          },
        ]
      : [
          {
            q: "What is VRAM and why does it matter for AI?",
            a: "VRAM is memory on your GPU. Most of a model's weights need to fit in VRAM for fast inference. A rough rule: a 4-bit quantized model needs about 0.5 GB per billion parameters — so a 7B model needs ~4 GB, a 13B needs ~8 GB, and a 70B model needs ~40 GB. When VRAM runs out, layers spill to CPU RAM, which is 5–10× slower.",
          },
          {
            q: "Which build profile is right for me?",
            a: "Local LLM Inference: daily 7B–70B model use, best VRAM per dollar. LLM Fine-Tune Starter: LoRA adapters and custom training runs, needs more system RAM and stable long-session cooling. Hybrid AI + Gaming: AI development during the day, gaming at night. When in doubt, start with Local LLM Inference.",
          },
          {
            q: "How does ordering work?",
            a: "You place a preorder. We source the cheapest available parts in Estonia for your selected build, assemble the PC, and install the software stack for running models locally — Ollama, Open WebUI, or equivalent. Prices update daily from real listings.",
          },
          {
            q: "Do I need an account to browse?",
            a: "No. Browsing builds and the catalog is fully public. You only need an account to place a preorder.",
          },
          {
            q: "NVIDIA vs AMD — which is better for AI?",
            a: "NVIDIA is the safer choice: CUDA is the industry standard and almost all AI software works with it out of the box. AMD cards often offer more VRAM for the money, but ROCm support is less mature and some tools need extra setup. If you want everything to just work, pick NVIDIA. If you're comfortable tinkering and want more VRAM per euro, AMD is worth considering.",
          },
          {
            q: "Can I use a regular gaming PC for local AI?",
            a: "Partly. Gaming PCs are tuned for high frame rates, but AI needs a lot of VRAM to hold large models. Most gaming cards top out at 8–12 GB VRAM, which limits which model sizes you can run. The AI-specific builds here pick cards based on maximum VRAM and AI throughput, not gaming benchmark scores.",
          },
          {
            q: "How fast is local AI compared to ChatGPT?",
            a: "It depends on your hardware. A good GPU (e.g. RTX 4090) can hit 50–100 tokens per second on 7B models — faster than most people read. Larger models are slower. The main advantage isn't raw speed, it's privacy, cost, and offline access: after the upfront hardware cost, every query is free.",
          },
          {
            q: "What software do I need to get started?",
            a: "Ollama is the easiest starting point — install it, pull a model with 'ollama pull llama3', and you're chatting. Open WebUI gives you a ChatGPT-style web interface on top. Both come pre-installed on all fart_picker builds so you're ready to go the moment you power on.",
          },
        ];

  return (
    <main className="min-h-screen px-6 py-16 md:px-12">
      <section className="mx-auto max-w-6xl">
        <Masthead />
        <header className="mb-14 stagger-in" style={{ animationDelay: "80ms" }}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/" className="label-pill inline-block">
                Home
              </Link>
              <Link href="/about" className="label-pill inline-block">
                About
              </Link>
              <LanguageSwitch lang={lang} />
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <AuthPanel />
            </div>
          </div>
          <h1 className="font-display mt-6 text-4xl font-semibold tracking-tight md:text-6xl">
            {lang === "et" ? "Korduma Kippuvad Küsimused" : "Frequently Asked Questions"}
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-[color:var(--muted)]">
            {lang === "et"
              ? "Kõik mida pead teadma kohalike AI ehituste kohta — algajatele."
              : "Everything you need to know about local AI builds — written for newcomers."}
          </p>
        </header>

        <div className="space-y-6 stagger-in" style={{ animationDelay: "200ms" }}>
          {/* Featured section */}
          <section
            className="wireframe-panel border-2 border-[color:var(--accent)] p-8 md:p-10"
            style={{
              boxShadow:
                "0 0 0 1px color-mix(in srgb, var(--accent) 30%, transparent), 0 0 32px color-mix(in srgb, var(--accent) 18%, transparent)",
            }}
          >
            <p className="label-pill inline-block mb-4">
              {lang === "et" ? "Miks see oluline on" : "Why this matters"}
            </p>
            <h2 className="font-display text-3xl font-semibold">
              {lang === "et" ? "Miks AI ehitused?" : "Why AI-ready builds?"}
            </h2>
            <div className="mt-5 max-w-3xl space-y-4 text-[color:var(--muted)]">
              {lang === "et" ? (
                <>
                  <p>
                    Kohalikus AI-s tähendab, et sinu andmed ei lahku sinu masinast — pole API võtmeid, pole
                    kasutustasusid, pole piiranguid. Arendajatele ja teadlastele, kes kasutavad mudeleid regulaarselt,
                    tasub riistvara kulu end kuude jooksul ära võrreldes API-kasutusega.
                  </p>
                  <p>
                    Samas on konks: mudeli kaalud peavad VRAM-i mahtuma kiireks inferentsiks. Ebasobiva riistvaraga
                    arvuti on kas liiga aeglane igapäevaseks kasutuseks või ei suuda suuremaid mudeleid üldse käivitada.
                    Siinsed ehitused on koostatud nii, et VRAM, mälu, ladustus ja jahutus vastaksid sinu tegelikule
                    töökoormusele.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    Running AI locally means your data never leaves your machine — no API keys, no usage bills, no rate
                    limits. For developers and researchers who run models regularly, the upfront hardware cost pays for
                    itself within months compared to API usage at scale. You also get low-latency inference and the
                    ability to work completely offline.
                  </p>
                  <p>
                    The catch is that model weights need to fit in VRAM for fast inference. A machine built for gaming
                    will often bottleneck badly on AI workloads. The builds here are chosen so that VRAM, system memory,
                    storage speed, and cooling are matched to your intended workload — not just the cheapest part that
                    fits.
                  </p>
                </>
              )}
            </div>
          </section>

          {/* Regular FAQ items */}
          {faqs.map((item, index) => (
            <section
              key={item.q}
              className="wireframe-panel p-8 stagger-in"
              style={{ animationDelay: `${300 + index * 80}ms` }}
            >
              <div className="faq-item">
                <h2 className="font-display text-2xl font-semibold">{item.q}</h2>
                <p className="mt-4 text-[color:var(--muted)]">{item.a}</p>
              </div>
            </section>
          ))}

          {/* Which One Should I Pick? */}
          <section
            id="which-one"
            className="wireframe-panel border-2 border-[color:var(--accent)] p-8 md:p-10 stagger-in"
            style={{
              animationDelay: `${300 + faqs.length * 80}ms`,
              scrollMarginTop: "5rem",
              boxShadow:
                "0 0 0 1px color-mix(in srgb, var(--accent) 30%, transparent), 0 0 32px color-mix(in srgb, var(--accent) 18%, transparent)",
            }}
          >
            <p className="label-pill inline-block mb-4">
              {lang === "et" ? "Abi valimisel" : "Decision guide"}
            </p>
            <h2 className="font-display text-3xl font-semibold">
              {lang === "et" ? "Milline ehitusprofiil sobib mulle?" : "Which one should I pick?"}
            </h2>
            <p className="mt-4 max-w-2xl text-[color:var(--muted)]">
              {lang === "et"
                ? "Lühike ülevaade igast profiilist — eelised, puudused ja kellele see sobib."
                : "A quick breakdown of each build category — benefits, drawbacks, and who it's actually for."}
            </p>

            <div className="mt-8 grid gap-5 md:grid-cols-2">
              {lang === "et" ? (
                <>
                  <div className="inner-card rounded-xl border border-[color:var(--panel-border)] p-6">
                    <p className="label-pill inline-block mb-3">Kõige populaarsem</p>
                    <h3 className="font-display text-xl font-semibold">Kohalik LLM Inferents</h3>
                    <p className="mt-2 text-sm text-[color:var(--muted)]">Parim igapäevaseks mudeli kasutamiseks, kodeerimisel, dokumendi Q&A jaoks.</p>
                    <ul className="arrow-list mt-4 space-y-1.5 text-sm text-[color:var(--muted)]">
                      <li>Parim VRAM hinna kohta</li>
                      <li>Käitab 7B–70B mudeleid hea kiirusega</li>
                      <li>Töötab CUDA ja ROCm-iga</li>
                    </ul>
                    <p className="mt-4 text-sm font-semibold text-[color:var(--muted)]">Piirangud:</p>
                    <ul className="arrow-list mt-2 space-y-1.5 text-sm text-[color:var(--muted)]">
                      <li>Ei ole peenhäälestusele optimeeritud</li>
                      <li>Väiksem VRAM piirab 70B+ mudeleid</li>
                    </ul>
                  </div>
                  <div className="inner-card rounded-xl border border-[color:var(--panel-border)] p-6">
                    <p className="label-pill inline-block mb-3">Treenimiseks</p>
                    <h3 className="font-display text-xl font-semibold">LLM Peenhäälestuse Starter</h3>
                    <p className="mt-2 text-sm text-[color:var(--muted)]">ML inseneridele, kes soovivad LoRA adaptereid treenida või kohandatud mudeleid luua.</p>
                    <ul className="arrow-list mt-4 space-y-1.5 text-sm text-[color:var(--muted)]">
                      <li>Rohkem süsteemi RAM-i pikaks treeninguks</li>
                      <li>Stabiilne jahutus pikematele seansidele</li>
                      <li>LoRA ja QLoRA tugi karbist välja</li>
                    </ul>
                    <p className="mt-4 text-sm font-semibold text-[color:var(--muted)]">Piirangud:</p>
                    <ul className="arrow-list mt-2 space-y-1.5 text-sm text-[color:var(--muted)]">
                      <li>Kallim kui pelgalt vestlemiseks</li>
                      <li>Liigne võimsus, kui tahad ainult mudeleid kasutada</li>
                    </ul>
                  </div>
                  <div className="inner-card rounded-xl border border-[color:var(--panel-border)] p-6">
                    <p className="label-pill inline-block mb-3">Kaks-ühes</p>
                    <h3 className="font-display text-xl font-semibold">Hübriid AI + Mäng</h3>
                    <p className="mt-2 text-sm text-[color:var(--muted)]">Neile, kes soovivad ühe arvutiga nii AI arendada kui ka mängida.</p>
                    <ul className="arrow-list mt-4 space-y-1.5 text-sm text-[color:var(--muted)]">
                      <li>Kõrge sagedusega mängimine + kohalik inferents</li>
                      <li>Üks masin kõike tegema</li>
                      <li>Hea tasakaal hinna ja jõudluse vahel</li>
                    </ul>
                    <p className="mt-4 text-sm font-semibold text-[color:var(--muted)]">Piirangud:</p>
                    <ul className="arrow-list mt-2 space-y-1.5 text-sm text-[color:var(--muted)]">
                      <li>GPU on kompromiss — vähem VRAM-i kui puhtal AI-ehitusel</li>
                      <li>Kõrgem tippvõimsus</li>
                    </ul>
                  </div>
                  <div className="inner-card rounded-xl border border-[color:var(--panel-border)] p-6">
                    <p className="label-pill inline-block mb-3">Suured töökoormused</p>
                    <h3 className="font-display text-xl font-semibold">AI Tööjaam</h3>
                    <p className="mt-2 text-sm text-[color:var(--muted)]">Teadlastele, laboridele, mitmekasutajalise serveri jaoks või 70B+ mudelitele.</p>
                    <ul className="arrow-list mt-4 space-y-1.5 text-sm text-[color:var(--muted)]">
                      <li>Threadripper/Xeon + 256–512 GB RAM</li>
                      <li>ECC mälu töökindluseks</li>
                      <li>Võimeline käitama mitut seanssi korraga</li>
                    </ul>
                    <p className="mt-4 text-sm font-semibold text-[color:var(--muted)]">Piirangud:</p>
                    <ul className="arrow-list mt-2 space-y-1.5 text-sm text-[color:var(--muted)]">
                      <li>Kallis (€5000–8000+)</li>
                      <li>Vajab tõsist jahutust ja kõrget voolutarvet</li>
                    </ul>
                  </div>
                  <div className="inner-card rounded-xl border border-[color:var(--panel-border)] p-6 md:col-span-2">
                    <p className="label-pill inline-block mb-3">Lihtsaim algus</p>
                    <h3 className="font-display text-xl font-semibold">MacOS Põhised Süsteemid</h3>
                    <p className="mt-2 text-sm text-[color:var(--muted)]">Algajatele, macOS kasutajatele ja neile, kes soovivad nullseadistusega valmis minna.</p>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <ul className="arrow-list space-y-1.5 text-sm text-[color:var(--muted)]">
                        <li>Plug-and-play, eelinstalleeritud tarkvara</li>
                        <li>Ühtne mälu toimib kui VRAM</li>
                        <li>Vaikne, energiasäästlik, kompaktne</li>
                      </ul>
                      <div>
                        <p className="text-sm font-semibold text-[color:var(--muted)]">Piirangud:</p>
                        <ul className="arrow-list mt-2 space-y-1.5 text-sm text-[color:var(--muted)]">
                          <li>Piiratud mudelitega, mis mahuvad 16–96 GB-sse</li>
                          <li>CUDA puudub, ROCm ei kehti</li>
                          <li>Ei saa GPU-d uuendada</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="inner-card rounded-xl border border-[color:var(--panel-border)] p-6">
                    <p className="label-pill inline-block mb-3">Most popular</p>
                    <h3 className="font-display text-xl font-semibold">Local LLM Inference</h3>
                    <p className="mt-2 text-sm text-[color:var(--muted)]">Best for daily AI use, coding assistants, document Q&A, and general model experimentation.</p>
                    <ul className="arrow-list mt-4 space-y-1.5 text-sm text-[color:var(--muted)]">
                      <li>Best VRAM per euro of any category</li>
                      <li>Runs 7B–70B models at usable speed</li>
                      <li>Works with CUDA and ROCm ecosystems</li>
                    </ul>
                    <p className="mt-4 text-sm font-semibold text-[color:var(--muted)]">Drawbacks:</p>
                    <ul className="arrow-list mt-2 space-y-1.5 text-sm text-[color:var(--muted)]">
                      <li>Not optimised for fine-tuning runs</li>
                      <li>Smaller VRAM limits 70B+ models</li>
                    </ul>
                  </div>
                  <div className="inner-card rounded-xl border border-[color:var(--panel-border)] p-6">
                    <p className="label-pill inline-block mb-3">For training</p>
                    <h3 className="font-display text-xl font-semibold">LLM Fine-Tune Starter</h3>
                    <p className="mt-2 text-sm text-[color:var(--muted)]">For ML engineers who want to train LoRA adapters or build custom models on top of open-source bases.</p>
                    <ul className="arrow-list mt-4 space-y-1.5 text-sm text-[color:var(--muted)]">
                      <li>More system RAM for long training sessions</li>
                      <li>Stable cooling for extended workloads</li>
                      <li>LoRA and QLoRA support out of the box</li>
                    </ul>
                    <p className="mt-4 text-sm font-semibold text-[color:var(--muted)]">Drawbacks:</p>
                    <ul className="arrow-list mt-2 space-y-1.5 text-sm text-[color:var(--muted)]">
                      <li>More expensive than inference-only builds</li>
                      <li>Overkill if you only want to chat with models</li>
                    </ul>
                  </div>
                  <div className="inner-card rounded-xl border border-[color:var(--panel-border)] p-6">
                    <p className="label-pill inline-block mb-3">Two in one</p>
                    <h3 className="font-display text-xl font-semibold">Hybrid AI + Gaming</h3>
                    <p className="mt-2 text-sm text-[color:var(--muted)]">For people who want a single machine that handles both AI development and high-refresh gaming.</p>
                    <ul className="arrow-list mt-4 space-y-1.5 text-sm text-[color:var(--muted)]">
                      <li>High-refresh gaming + local inference</li>
                      <li>One machine for everything</li>
                      <li>Good price-to-performance balance</li>
                    </ul>
                    <p className="mt-4 text-sm font-semibold text-[color:var(--muted)]">Drawbacks:</p>
                    <ul className="arrow-list mt-2 space-y-1.5 text-sm text-[color:var(--muted)]">
                      <li>GPU is a compromise — less VRAM than a pure AI build</li>
                      <li>Higher peak power draw</li>
                    </ul>
                  </div>
                  <div className="inner-card rounded-xl border border-[color:var(--panel-border)] p-6">
                    <p className="label-pill inline-block mb-3">Heavy workloads</p>
                    <h3 className="font-display text-xl font-semibold">AI Workstation</h3>
                    <p className="mt-2 text-sm text-[color:var(--muted)]">For researchers, labs, multi-user inference serving, or anyone needing to run 70B+ models reliably.</p>
                    <ul className="arrow-list mt-4 space-y-1.5 text-sm text-[color:var(--muted)]">
                      <li>Threadripper or Xeon + 256–512 GB system RAM</li>
                      <li>ECC memory for reliability in always-on setups</li>
                      <li>Can run multiple concurrent sessions</li>
                    </ul>
                    <p className="mt-4 text-sm font-semibold text-[color:var(--muted)]">Drawbacks:</p>
                    <ul className="arrow-list mt-2 space-y-1.5 text-sm text-[color:var(--muted)]">
                      <li>Expensive — €5,000–8,000+</li>
                      <li>Needs serious cooling and high wattage PSU</li>
                    </ul>
                  </div>
                  <div className="inner-card rounded-xl border border-[color:var(--panel-border)] p-6 md:col-span-2">
                    <p className="label-pill inline-block mb-3">Easiest start</p>
                    <h3 className="font-display text-xl font-semibold">MacOS Based Systems</h3>
                    <p className="mt-2 text-sm text-[color:var(--muted)]">For beginners, macOS users, and anyone who wants a zero-setup AI machine that just works.</p>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <ul className="arrow-list space-y-1.5 text-sm text-[color:var(--muted)]">
                        <li>Plug and play — pre-installed software stack</li>
                        <li>Unified memory acts as VRAM (no separate GPU needed)</li>
                        <li>Silent, power-efficient, compact</li>
                      </ul>
                      <div>
                        <p className="text-sm font-semibold text-[color:var(--muted)]">Drawbacks:</p>
                        <ul className="arrow-list mt-2 space-y-1.5 text-sm text-[color:var(--muted)]">
                          <li>Limited to models that fit in 16–96 GB unified memory</li>
                          <li>No CUDA; ROCm doesn&apos;t apply</li>
                          <li>GPU is not upgradeable</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>
        </div>

        <div className="mt-12 stagger-in" style={{ animationDelay: "700ms" }}>
          <p className="text-sm text-[color:var(--muted)]">
            {lang === "et" ? "Rohkem küsimusi? " : "More questions? "}
            <Link href="/about" className="text-[color:var(--accent)] underline underline-offset-2">
              {lang === "et" ? "Loe lähemalt." : "Read about how it works."}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}

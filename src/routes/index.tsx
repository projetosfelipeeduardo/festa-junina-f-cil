import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Check,
  Download,
  Printer,
  Scissors,
  Gift,
  PiggyBank,
  Trophy,
  CalendarDays,
  FolderCheck,
  Heart,
  ShieldCheck,
  Lock,
  Star,
  MessageCircle,
  ChevronRight,
  Sparkles,
} from "lucide-react";

import heroImg from "@/assets/hero-junina.jpg";
import cardTotens from "@/assets/card-totens.png";
import cardBamboles from "@/assets/card-bamboles.png";
import cardBandeirinhas from "@/assets/card-bandeirinhas.png";
import cardTopo from "@/assets/card-topo.png";
import cardPlaquinhas from "@/assets/card-plaquinhas.png";
import cardCaixinhas from "@/assets/card-caixinhas.png";
import sunflowers from "@/assets/sunflowers.png";
import bonfire from "@/assets/bonfire.png";
import festa1 from "@/assets/festa-1.jpg";
import festa2 from "@/assets/festa-2.jpg";
import festa3 from "@/assets/festa-3.jpg";

export const Route = createFileRoute("/")({
  component: Index,
});

const flagColors = [
  "var(--junina-red)",
  "var(--junina-yellow)",
  "var(--junina-green)",
  "var(--junina-blue)",
  "var(--junina-orange)",
];

function FlagBunting({ count = 24 }: { count?: number }) {
  return (
    <div className="relative w-full h-10 overflow-hidden" aria-hidden>
      <div className="absolute inset-x-0 top-2 h-px bg-junina-wood/40" />
      <div className="flex justify-around items-start pt-1">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="animate-wave"
            style={{
              width: 0,
              height: 0,
              borderLeft: "10px solid transparent",
              borderRight: "10px solid transparent",
              borderTop: `18px solid ${flagColors[i % flagColors.length]}`,
              animationDelay: `${(i % 6) * 0.15}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-center mb-10">
      <div className="ribbon-banner px-12 py-3 text-white font-display text-2xl md:text-3xl tracking-wide uppercase">
        {children}
      </div>
    </div>
  );
}

function CtaButton({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <button
      type="button"
      className={`group relative inline-flex items-center justify-center gap-2 rounded-2xl px-8 py-5 text-lg md:text-xl font-display uppercase tracking-wide text-primary-foreground shadow-cta-junina transition-transform hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none ${className}`}
      style={{ background: "var(--gradient-cta)" }}
    >
      <Sparkles className="size-5" />
      {children}
      <ChevronRight className="size-6 transition-transform group-hover:translate-x-1" />
    </button>
  );
}

const deliverables = [
  { img: cardTotens, title: "Totens Gigantes", desc: "Menino e menina juninos, espantalhos, casal caipira e personagens em tamanho grande." },
  { img: cardBamboles, title: "Bambolês para Fotos", desc: "Molduras divertidas como “Trem Bão” para um cantinho de fotos incrível." },
  { img: cardBandeirinhas, title: "Bandeirinhas", desc: "Vários modelos coloridos prontos para imprimir e enfeitar tudo." },
  { img: cardTopo, title: "Topo de Bolo", desc: "Topos temáticos com fogueira, chapéu, casal caipira e milho." },
  { img: cardPlaquinhas, title: "Plaquinhas Divertidas", desc: "“Êta Trem Bão!”, “Arraiá dos Bão”, “Olha a Chuva!” e muito mais." },
  { img: cardCaixinhas, title: "Caixinhas e Lembrancinhas", desc: "Modelos para doces, pipoca, paçoca e brindes lindos." },
];

const steps = [
  { n: 1, icon: Download, title: "Baixe", desc: "Receba os arquivos imediatamente após a compra." },
  { n: 2, icon: Printer, title: "Imprima", desc: "Imprima em casa ou na gráfica mais próxima." },
  { n: 3, icon: Scissors, title: "Recorte", desc: "Use tesoura ou estilete com calma." },
  { n: 4, icon: Gift, title: "Monte", desc: "Pronto! Sua festa estará incrível." },
];

const benefits = [
  { icon: PiggyBank, title: "Economize Muito", desc: "Decoração pronta custa caro. Imprima quantas vezes quiser!" },
  { icon: Trophy, title: "Festa Profissional", desc: "Tudo criado para deixar sua festa com aparência de decoradora." },
  { icon: CalendarDays, title: "Use Todos os Anos", desc: "Os arquivos são seus para sempre. Aproveite sempre que quiser." },
  { icon: FolderCheck, title: "Tudo Pronto", desc: "Nada de perder tempo criando do zero. É só imprimir e montar." },
  { icon: Heart, title: "Ideal Para", desc: "Escolas, professoras, mães, festas infantis e arraiás escolares." },
];

const testimonials = [
  { img: festa1, name: "Juliana M.", text: "Minha festa ficou linda e gastei muito pouco! Os totens são gigantes e fizeram toda a diferença." },
  { img: festa2, name: "Camila R.", text: "As crianças amaram o cantinho das fotos! Muito fácil de montar e os arquivos são lindos e de alta qualidade." },
  { img: festa3, name: "Patrícia L.", text: "Foi só imprimir, recortar e montar. Prático, rápido e deixou nossa festa maravilhosa!" },
];

const quickBenefits = [
  "Arquivos em Alta Resolução",
  "Imprima Quantas Vezes Quiser",
  "Monte em Casa ou na Gráfica",
  "Acesso Imediato Após a Compra",
];

const youReceive = [
  "Totens Gigantes",
  "Bambolês Divertidos",
  "Bandeirinhas",
  "Plaquinhas Temáticas",
  "Topos de Bolo",
  "Caixinhas e Lembrancinhas",
  "Moldes Extras",
  "Atualizações Futuras",
];

function Index() {
  const [pay, setPay] = useState("pix");
  return (
    <main className="min-h-screen bg-paper text-foreground overflow-x-hidden">
      {/* HERO */}
      <section className="relative pt-4 pb-12">
        <FlagBunting count={28} />

        <div className="mx-auto max-w-6xl px-4 mt-6">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 ribbon-banner px-8 py-2 text-sm md:text-base font-display uppercase tracking-widest">
              <Sparkles className="size-4" /> Arquivos Digitais para Festa Junina <Sparkles className="size-4" />
            </div>
          </div>

          <div className="grid md:grid-cols-[1fr_auto] gap-8 items-center mt-8">
            <div className="text-center md:text-left">
              <h1 className="font-display uppercase leading-[0.95]">
                <span className="block text-3xl md:text-4xl text-junina-wood">Transforme sua</span>
                <span className="block text-5xl md:text-7xl my-2">
                  <span className="text-junina-blue text-stroke-wood">FESTA </span>
                  <span className="text-junina-red text-stroke-wood">JUNINA</span>
                </span>
                <span className="block text-2xl md:text-4xl text-junina-wood">em um Arraiá Lindo</span>
                <span className="block text-3xl md:text-5xl text-junina-orange text-stroke-wood mt-1">
                  Gastando Pouco!
                </span>
              </h1>
              <p className="mt-6 text-lg md:text-xl text-junina-wood max-w-xl mx-auto md:mx-0">
                Receba agora <strong>dezenas de arquivos prontos</strong> para imprimir e montar: totens, bambolês,
                plaquinhas, bandeirinhas, topos de bolo e muito mais!
              </p>

              <ul className="mt-6 grid sm:grid-cols-2 gap-2 max-w-xl mx-auto md:mx-0">
                {quickBenefits.map((b) => (
                  <li key={b} className="flex items-center gap-2 text-junina-wood font-semibold">
                    <span className="grid place-items-center size-6 rounded-full bg-junina-green text-white">
                      <Check className="size-4" />
                    </span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>

            {/* Price badge */}
            <div className="relative mx-auto">
              <div
                className="grid place-items-center size-56 md:size-64 rounded-full text-center text-primary-foreground shadow-card-junina border-4 border-junina-wood-dark"
                style={{ background: "var(--gradient-price)" }}
              >
                <div>
                  <div className="text-sm font-display uppercase tracking-wider opacity-90">De R$97,00</div>
                  <div className="text-xs font-display uppercase tracking-widest mt-1">Apenas</div>
                  <div className="font-display text-5xl md:text-6xl leading-none">R$19,90</div>
                  <div className="text-xs font-display uppercase tracking-widest mt-2">Pagamento Único</div>
                </div>
              </div>
            </div>
          </div>

          {/* Hero image */}
          <div className="relative mt-10">
            <div className="rounded-3xl overflow-hidden border-4 border-junina-wood-dark shadow-card-junina bg-card">
              <img
                src={heroImg}
                alt="Kit Festa Junina com totens, bambolês, bandeirinhas e personagens caipiras"
                width={1280}
                height={1280}
                className="w-full h-auto object-cover"
              />
            </div>
            <img
              src={bonfire}
              alt=""
              aria-hidden
              className="absolute -bottom-6 -left-6 w-24 md:w-32 animate-flicker pointer-events-none"
            />
            <img
              src={sunflowers}
              alt=""
              aria-hidden
              className="absolute -top-6 -right-6 w-24 md:w-32 animate-float pointer-events-none"
            />
          </div>

          <div className="mt-10 flex flex-col items-center gap-3">
            <CtaButton>Quero meu kit junino agora!</CtaButton>
            <p className="flex items-center gap-2 text-sm text-junina-wood font-semibold">
              <Lock className="size-4" /> Acesso imediato após a compra
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 2 - DELIVERABLES */}
      <section className="py-16 relative">
        <SectionTitle>Tudo Que Você Vai Receber 🎁</SectionTitle>
        <div className="mx-auto max-w-6xl px-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {deliverables.map((d) => (
            <article
              key={d.title}
              className="group rounded-2xl bg-card border-2 border-border shadow-card-junina p-5 text-center hover:-translate-y-1 transition-transform"
            >
              <div className="aspect-square rounded-xl bg-junina-cream grid place-items-center overflow-hidden mb-4 border border-border">
                <img
                  src={d.img}
                  alt={d.title}
                  loading="lazy"
                  width={640}
                  height={640}
                  className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform"
                />
              </div>
              <h3 className="font-display text-xl uppercase text-junina-red">{d.title}</h3>
              <p className="mt-2 text-sm text-junina-wood">{d.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* SECTION 3 - GALLERY */}
      <section className="py-16 bg-junina-cream/60 border-y-4 border-dashed border-junina-wood/30">
        <SectionTitle>Sua Festa Vai Ficar Linda ✨</SectionTitle>
        <div className="mx-auto max-w-5xl px-4 text-center">
          <p className="text-lg text-junina-wood max-w-2xl mx-auto">
            Mesmo gastando pouco, você consegue montar uma decoração incrível, divertida e encantadora usando apenas
            impressões simples.
          </p>
          <div className="mt-10 grid md:grid-cols-3 gap-5">
            {[festa1, festa2, festa3].map((src, i) => (
              <div key={i} className="rounded-2xl overflow-hidden border-4 border-junina-wood-dark shadow-card-junina rotate-[-1deg] even:rotate-[1.5deg]">
                <img src={src} alt={`Festa junina decorada ${i + 1}`} loading="lazy" width={800} height={800} className="w-full h-64 object-cover" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4 - STEPS */}
      <section className="py-16">
        <SectionTitle>Monte Sua Festa em Minutos 🚀</SectionTitle>
        <div className="mx-auto max-w-5xl px-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s) => (
            <div key={s.n} className="relative rounded-2xl bg-card border-2 border-border shadow-card-junina p-6 text-center">
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 size-10 rounded-full bg-junina-red text-white font-display text-xl grid place-items-center shadow-card-junina">
                {s.n}
              </div>
              <s.icon className="size-12 mx-auto mt-3 text-junina-green" />
              <h3 className="mt-3 font-display text-2xl uppercase text-junina-wood">{s.title}</h3>
              <p className="mt-2 text-sm text-junina-wood/80">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 5 - BENEFITS */}
      <section className="py-16 bg-junina-cream/60 border-y-4 border-dashed border-junina-wood/30">
        <SectionTitle>Por Que Vale Muito Mais Que R$19,90?</SectionTitle>
        <div className="mx-auto max-w-6xl px-4 grid sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {benefits.map((b) => (
            <div key={b.title} className="rounded-2xl bg-card border-2 border-border shadow-card-junina p-5 text-center">
              <b.icon className="size-10 mx-auto text-junina-red" />
              <h3 className="mt-3 font-display text-lg uppercase text-junina-wood">{b.title}</h3>
              <p className="mt-2 text-sm text-junina-wood/80">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 6 - TESTIMONIALS */}
      <section className="py-16">
        <SectionTitle>Quem Comprou, Aprovou ❤️</SectionTitle>
        <div className="mx-auto max-w-6xl px-4 grid md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <figure key={t.name} className="rounded-2xl bg-card border-2 border-border shadow-card-junina p-5">
              <div className="flex gap-4 items-start">
                <div className="relative shrink-0">
                  <img src={t.img} alt="" loading="lazy" width={120} height={120} className="size-20 object-cover rounded-xl border-2 border-border" />
                  <span className="absolute -bottom-2 -right-2 grid place-items-center size-8 rounded-full bg-junina-green text-white shadow-card-junina">
                    <MessageCircle className="size-4" />
                  </span>
                </div>
                <div>
                  <blockquote className="text-sm text-junina-wood italic">“{t.text}”</blockquote>
                  <figcaption className="mt-2 font-display text-junina-red">— {t.name}</figcaption>
                  <div className="flex gap-0.5 text-junina-yellow mt-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="size-4 fill-current" />
                    ))}
                  </div>
                </div>
              </div>
            </figure>
          ))}
        </div>
      </section>

      {/* SECTION 7 - OFFER */}
      <section className="py-16 bg-junina-cream/60 border-y-4 border-dashed border-junina-wood/30">
        <SectionTitle>Oferta Especial de Festa Junina 🎉</SectionTitle>
        <div className="mx-auto max-w-6xl px-4 grid lg:grid-cols-3 gap-6">
          {/* Price column */}
          <div className="rounded-3xl border-4 border-junina-wood-dark bg-card p-8 text-center shadow-card-junina relative overflow-hidden">
            <FlagBunting count={10} />
            <div className="font-display uppercase text-junina-red text-xl mt-4">Oferta Especial</div>
            <div className="text-junina-wood line-through opacity-70 mt-2">De R$97,00</div>
            <div className="font-display uppercase text-junina-wood text-sm">Por Apenas</div>
            <div className="font-display text-junina-red text-6xl my-2">R$19,90</div>
            <div className="text-sm text-junina-wood font-semibold">Pagamento Único</div>
            <div className="mt-6">
              <a href="#checkout">
                <CtaButton>Quero garantir agora</CtaButton>
              </a>
            </div>
            <p className="text-xs text-junina-wood mt-3">Acesso imediato após a compra</p>
          </div>

          {/* What you receive */}
          <div className="rounded-3xl border-2 border-border bg-card p-8 shadow-card-junina">
            <h3 className="font-display text-2xl uppercase text-junina-red mb-4">Você Recebe:</h3>
            <ul className="space-y-2">
              {youReceive.map((i) => (
                <li key={i} className="flex items-center gap-3 text-junina-wood font-semibold">
                  <span className="grid place-items-center size-6 rounded-md bg-junina-green text-white">
                    <Check className="size-4" />
                  </span>
                  {i}
                </li>
              ))}
            </ul>
          </div>

          {/* Bonus + guarantee */}
          <div className="space-y-6">
            <div className="rounded-3xl border-2 border-border bg-card p-6 shadow-card-junina">
              <h3 className="font-display text-xl uppercase text-junina-red mb-3">Bônus Exclusivos</h3>
              <ul className="space-y-3 text-sm text-junina-wood">
                <li className="flex gap-3"><Gift className="size-5 text-junina-orange shrink-0" /><span><strong>+100 Plaquinhas Extras</strong> — frases prontas para animar sua festa.</span></li>
                <li className="flex gap-3"><Gift className="size-5 text-junina-orange shrink-0" /><span><strong>Moldes Surpresa</strong> — elementos extras para deixar tudo ainda mais completo.</span></li>
                <li className="flex gap-3"><Gift className="size-5 text-junina-orange shrink-0" /><span><strong>Elementos Bônus</strong> — arquivos decorativos para um arraiá perfeito.</span></li>
              </ul>
            </div>
            <div className="rounded-3xl border-4 border-junina-wood-dark p-6 text-center shadow-card-junina" style={{ background: "var(--gradient-price)" }}>
              <ShieldCheck className="size-10 mx-auto text-junina-yellow" />
              <div className="font-display uppercase text-junina-yellow mt-2">Garantia</div>
              <div className="font-display text-white text-5xl">7 DIAS</div>
              <p className="text-sm text-white/90 mt-2">Não gostou? Devolvemos 100% do seu dinheiro.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CHECKOUT */}
      <section id="checkout" className="py-16">
        <SectionTitle>Finalize Sua Compra</SectionTitle>
        <div className="mx-auto max-w-4xl px-4">
          <form
            onSubmit={(e) => e.preventDefault()}
            className="rounded-3xl bg-card border-2 border-border shadow-card-junina p-6 md:p-8 grid md:grid-cols-2 gap-6"
          >
            <div className="space-y-4">
              <Field label="Nome completo" placeholder="Seu nome" type="text" />
              <Field label="E-mail" placeholder="voce@email.com" type="email" />
              <Field label="Confirmar e-mail" placeholder="voce@email.com" type="email" />
              <Field label="CPF" placeholder="000.000.000-00" type="text" />
              <p className="flex items-center gap-2 text-xs text-junina-wood"><Lock className="size-3" /> Seus dados estão seguros conosco.</p>
            </div>

            <div>
              <div className="font-display uppercase text-junina-red mb-3">Forma de Pagamento</div>
              <div className="space-y-3">
                <PaymentOption checked={pay === "pix"} onChange={() => setPay("pix")} label="PIX (Aprovação imediata)" hint="Mais rápido" />
                <PaymentOption checked={pay === "card"} onChange={() => setPay("card")} label="Cartão de Crédito" hint="Visa, Master, Elo, Hiper" />
              </div>

              <div className="mt-6 rounded-2xl border-2 border-dashed border-junina-wood/30 p-4 text-center">
                <div className="text-xs text-junina-wood">Total</div>
                <div className="font-display text-3xl text-junina-red">R$19,90</div>
              </div>

              <div className="mt-6 text-center">
                <CtaButton>Quero decorar minha festa agora!</CtaButton>
                <p className="text-xs text-junina-wood mt-3 flex items-center justify-center gap-2"><ShieldCheck className="size-4" /> Ambiente 100% seguro — arquivos liberados na hora</p>
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-junina-wood-dark text-white/90 mt-8">
        <FlagBunting count={28} />
        <div className="mx-auto max-w-5xl px-4 py-8 text-center text-sm">
          <p>© 2024 Kit Festa Junina para Imprimir — Todos os direitos reservados.</p>
          <nav className="mt-3 flex flex-wrap justify-center gap-x-6 gap-y-2">
            <a href="#" className="hover:text-junina-yellow">Termos de Uso</a>
            <a href="#" className="hover:text-junina-yellow">Política de Privacidade</a>
            <a href="#" className="hover:text-junina-yellow">Suporte</a>
          </nav>
        </div>
      </footer>
    </main>
  );
}

function Field({ label, ...rest }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-junina-wood mb-1">{label}</span>
      <input
        {...rest}
        className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-junina-wood placeholder:text-junina-wood/50 focus:outline-none focus:border-junina-green transition-colors"
      />
    </label>
  );
}

function PaymentOption({
  checked,
  onChange,
  label,
  hint,
}: { checked: boolean; onChange: () => void; label: string; hint?: string }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`w-full flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-colors ${
        checked ? "border-junina-green bg-junina-green/10" : "border-border bg-background"
      }`}
    >
      <span className={`size-5 rounded-full border-2 grid place-items-center ${checked ? "border-junina-green" : "border-junina-wood/40"}`}>
        {checked && <span className="size-2.5 rounded-full bg-junina-green" />}
      </span>
      <span className="flex-1">
        <span className="block font-semibold text-junina-wood">{label}</span>
        {hint && <span className="block text-xs text-junina-wood/70">{hint}</span>}
      </span>
    </button>
  );
}

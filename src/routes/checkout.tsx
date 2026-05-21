import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  ShieldCheck,
  Check,
  Copy,
  Loader2,
  ArrowLeft,
  Sparkles,
  QrCode,
} from "lucide-react";

import { createKiwifyPixCharge } from "@/lib/kiwify.functions";
import heroMockup from "@/assets/hero-mockup.png";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Kit Festa Junina para Imprimir" },
      { name: "description", content: "Finalize sua compra do Kit Festa Junina e receba acesso imediato após o pagamento via PIX." },
      { property: "og:title", content: "Checkout — Kit Festa Junina" },
      { property: "og:description", content: "Pagamento via PIX com liberação imediata." },
    ],
  }),
  component: CheckoutPage,
});

const PRICE_CENTS = 2490;

const flagColors = [
  "var(--junina-red)",
  "var(--junina-yellow)",
  "var(--junina-green)",
  "var(--junina-blue)",
  "var(--junina-orange)",
];

function FlagBunting({ count = 20 }: { count?: number }) {
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

function onlyDigits(s: string) {
  return s.replace(/\D+/g, "");
}

function formatCpfCnpj(v: string) {
  const d = onlyDigits(v).slice(0, 14);
  if (d.length <= 11) {
    return d
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

type ChargeState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; copyPaste: string; qrCodeBase64: string; id: string }
  | { status: "error"; message: string };

function CheckoutPage() {
  const createCharge = useServerFn(createKiwifyPixCharge);

  const [name, setName] = useState("");
  const [doc, setDoc] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<ChargeState>({ status: "idle" });
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const docDigits = onlyDigits(doc);
    if (name.trim().length < 2) {
      setState({ status: "error", message: "Informe seu nome completo." });
      return;
    }
    if (docDigits.length !== 11 && docDigits.length !== 14) {
      setState({ status: "error", message: "Informe um CPF ou CNPJ válido." });
      return;
    }

    setState({ status: "loading" });
    try {
      const res = await createCharge({
        data: {
          amount_in_cents: PRICE_CENTS,
          name: name.trim(),
          document_number: doc.trim(),
          email: email.trim() || undefined,
        },
      });
      if (!res.ok) {
        setState({ status: "error", message: res.error });
        return;
      }
      setState({
        status: "success",
        copyPaste: res.copyPaste,
        qrCodeBase64: res.qrCodeBase64,
        id: res.id,
      });
    } catch (err) {
      console.error(err);
      setState({
        status: "error",
        message: "Erro inesperado ao gerar o PIX. Tente novamente.",
      });
    }
  };

  const copyPix = async () => {
    if (state.status !== "success") return;
    try {
      await navigator.clipboard.writeText(state.copyPaste);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // ignore
    }
  };

  return (
    <main className="min-h-screen bg-paper text-foreground overflow-x-hidden">
      <FlagBunting count={24} />

      <div className="mx-auto max-w-6xl px-4 pt-6 pb-16">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-junina-wood font-semibold hover:text-junina-red transition-colors"
        >
          <ArrowLeft className="size-4" /> Voltar
        </Link>

        <div className="flex justify-center mt-4 mb-8">
          <div className="ribbon-banner px-10 py-3 text-white font-display text-xl md:text-2xl tracking-wide uppercase">
            Finalize seu Arraiá 🎉
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_420px] gap-8 items-start">
          {/* LEFT — form / pix */}
          <section className="rounded-3xl border-4 border-junina-wood-dark bg-card p-6 md:p-8 shadow-card-junina">
            {state.status !== "success" ? (
              <>
                <h1 className="font-display uppercase text-2xl md:text-3xl text-junina-red">
                  Seus Dados para Pagamento
                </h1>
                <p className="mt-2 text-sm text-junina-wood">
                  Pague via <strong>PIX</strong> e receba o acesso imediatamente após a confirmação.
                </p>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-junina-wood mb-1">
                      Nome completo
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={120}
                      required
                      placeholder="Maria da Silva"
                      className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-junina-wood focus:outline-none focus:border-junina-red"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-junina-wood mb-1">
                      CPF ou CNPJ
                    </label>
                    <input
                      type="text"
                      value={doc}
                      onChange={(e) => setDoc(formatCpfCnpj(e.target.value))}
                      inputMode="numeric"
                      required
                      placeholder="000.000.000-00"
                      className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-junina-wood focus:outline-none focus:border-junina-red"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-junina-wood mb-1">
                      E-mail (para receber o acesso)
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      maxLength={180}
                      placeholder="seu@email.com"
                      className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-junina-wood focus:outline-none focus:border-junina-red"
                    />
                  </div>

                  {state.status === "error" && (
                    <div className="rounded-xl bg-junina-red/10 border border-junina-red/40 text-junina-red text-sm p-3">
                      {state.message}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={state.status === "loading"}
                    className="group relative w-full inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-5 text-base md:text-lg font-display uppercase tracking-wide text-primary-foreground shadow-cta-junina transition-transform hover:-translate-y-0.5 active:translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
                    style={{ background: "var(--gradient-cta)" }}
                  >
                    {state.status === "loading" ? (
                      <>
                        <Loader2 className="size-5 animate-spin" /> Gerando PIX...
                      </>
                    ) : (
                      <>
                        <Sparkles className="size-5" /> Gerar PIX de R$24,90
                      </>
                    )}
                  </button>

                  <p className="flex items-center justify-center gap-2 text-xs text-junina-wood/80 mt-2">
                    <ShieldCheck className="size-4 text-junina-green" />
                    Pagamento processado com segurança pela Kiwify
                  </p>
                </form>
              </>
            ) : (
              <div className="text-center">
                <h2 className="font-display uppercase text-2xl md:text-3xl text-junina-red">
                  Seu PIX está pronto! 🎊
                </h2>
                <p className="mt-2 text-sm text-junina-wood">
                  Abra o app do seu banco, escolha pagar com PIX e escaneie o QR Code abaixo:
                </p>

                <div className="mt-6 inline-block rounded-2xl border-4 border-junina-wood-dark bg-white p-4 shadow-card-junina">
                  <img
                    src={`data:image/png;base64,${state.qrCodeBase64}`}
                    alt="QR Code PIX"
                    width={280}
                    height={280}
                    className="w-64 h-64 md:w-72 md:h-72"
                  />
                </div>

                <div className="mt-6">
                  <label className="block text-xs uppercase tracking-wide font-semibold text-junina-wood mb-2">
                    Ou copie o código PIX
                  </label>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={state.copyPaste}
                      className="flex-1 rounded-xl border-2 border-border bg-background px-3 py-2 text-xs text-junina-wood/80 truncate"
                    />
                    <button
                      type="button"
                      onClick={copyPix}
                      className="inline-flex items-center gap-1 rounded-xl bg-junina-green text-white font-semibold px-4 py-2 text-sm hover:opacity-90"
                    >
                      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                      {copied ? "Copiado" : "Copiar"}
                    </button>
                  </div>
                </div>

                <p className="mt-6 text-xs text-junina-wood/70">
                  Após o pagamento, o acesso é liberado automaticamente no e-mail informado.
                </p>
              </div>
            )}
          </section>

          {/* RIGHT — summary */}
          <aside className="rounded-3xl border-2 border-border bg-card p-6 shadow-card-junina lg:sticky lg:top-4">
            <div className="flex items-center gap-3 mb-4">
              <QrCode className="size-6 text-junina-red" />
              <h3 className="font-display text-xl uppercase text-junina-red">Resumo do Pedido</h3>
            </div>

            <div className="rounded-2xl bg-junina-cream border border-border p-4 flex gap-4 items-center">
              <img
                src={heroMockup}
                alt="Kit Festa Junina"
                width={120}
                height={120}
                className="w-20 h-20 object-contain"
              />
              <div className="text-left">
                <div className="font-display text-junina-wood text-base leading-tight">
                  Kit Festa Junina para Imprimir
                </div>
                <div className="text-xs text-junina-wood/80 mt-1">
                  Acesso digital imediato
                </div>
              </div>
            </div>

            <ul className="mt-4 space-y-2 text-sm text-junina-wood">
              {[
                "Totens, bambolês e bandeirinhas",
                "Topos de bolo e plaquinhas",
                "+10 Plaquinhas Extras (bônus)",
                "Atualizações futuras",
              ].map((i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="grid place-items-center size-5 rounded-md bg-junina-green text-white">
                    <Check className="size-3" />
                  </span>
                  {i}
                </li>
              ))}
            </ul>

            <div className="mt-5 border-t border-dashed border-junina-wood/30 pt-4">
              <div className="flex justify-between text-sm text-junina-wood">
                <span>De</span>
                <span className="line-through opacity-70">R$ 97,00</span>
              </div>
              <div className="flex justify-between items-end mt-1">
                <span className="font-display uppercase text-junina-wood">Total</span>
                <span className="font-display text-junina-red text-3xl">R$ 24,90</span>
              </div>
              <div className="text-xs text-junina-wood/70 text-right">Pagamento único via PIX</div>
            </div>

            <div className="mt-4 rounded-xl border border-border bg-junina-cream/60 p-3 text-xs text-junina-wood flex gap-2 items-start">
              <ShieldCheck className="size-4 text-junina-green shrink-0 mt-0.5" />
              <span>Garantia de 7 dias. Se não gostar, devolvemos 100% do valor.</span>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

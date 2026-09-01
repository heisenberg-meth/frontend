function PlanSelectionSection1({ handleTrialClick, handleProClick }) {
  return (
    <main className="pt-28 pb-12 px-6 max-w-6xl mx-auto flex flex-col items-center">
      {/* Header Section */}
      <div className="text-center mb-10 animate-in fade-in slide-in-from-top-4 transition-transform duration-700">
        <span className="text-[10px] font-bold text-primary uppercase tracking-[0.3em] mb-3 block">
          Foundation Authorization
        </span>
        <h1 className="text-4xl md:text-5xl font-extrabold text-on-surface mb-3 tracking-tight">
          Select Your Intelligence Tier
        </h1>
        <p className="text-base text-on-surface-variant max-w-xl mx-auto opacity-80">
          Choose the operational scale for your clinical facility. You can
          upgrade or transition at any time.
        </p>
      </div>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full max-w-6xl">
        {/* Trial Card */}
        <div className="bg-(--surface-container)/50 backdrop-blur-sm border border-(--surface) rounded-2xl p-7 flex flex-col transition-shadow hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/5 group relative overflow-hidden">
          <div className="mb-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-(--surface) rounded-xl border border-(--surface)">
                <span className="material-symbols-outlined text-primary text-2xl">
                  biotech
                </span>
              </div>
              <span className="bg-(--surface) px-3 py-1 rounded-full text-[9px] font-bold text-on-surface-variant tracking-widest uppercase">
                EVALUATION
              </span>
            </div>
            <h3 className="text-xl font-bold text-on-surface mb-1">
              Free Trial
            </h3>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Full access to all features for 28 days. No payment required.
            </p>
          </div>

          <div className="space-y-3 mb-8 grow">
            {[
              "Full Clinical Analytics",
              "Unlimited Pharmacy SKUs",
              "Audit Logs",
              "Community Intelligence",
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-lg">
                  check_circle
                </span>
                <span className="text-sm text-on-surface/80">{feature}</span>
              </div>
            ))}
          </div>

          <div className="mt-auto pt-6 border-t border-(--surface)">
            <div className="mb-5">
              <span className="text-3xl font-extrabold text-on-surface">
                ₹0
              </span>
              <span className="text-on-surface-variant text-xs ml-2">
                / 28 Days
              </span>
            </div>
            <button
              onClick={handleTrialClick}
              className="w-full bg-(--surface) border border-(--surface) text-on-surface py-4 rounded-xl font-bold hover:bg-(--surface) hover:border-primary/50 transition-colors active:scale-[0.98] shadow-lg"
            >
              Start Free Trial
            </button>
          </div>
        </div>

        {/* Basic Card */}
        <div className="bg-(--surface-container)/50 backdrop-blur-sm border border-(--surface) rounded-2xl p-7 flex flex-col transition-shadow hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/5 group relative overflow-hidden">
          <div className="mb-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-(--surface) rounded-xl border border-(--surface)">
                <span className="material-symbols-outlined text-primary text-2xl">
                  inventory_2
                </span>
              </div>
              <span className="bg-(--surface) px-3 py-1 rounded-full text-[9px] font-bold text-on-surface-variant tracking-widest uppercase">
                ESSENTIAL
              </span>
            </div>
            <h3 className="text-xl font-bold text-on-surface mb-1">
              MedAssist Basic
            </h3>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Core clinical management for growing single-doctor clinics.
            </p>
          </div>

          <div className="space-y-3 mb-8 grow">
            {[
              "Unlimited Medicines",
              "Basic Analytics",
              "Up to 3 Users",
              "Standard Support",
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-lg">
                  check_circle
                </span>
                <span className="text-sm text-on-surface/80">{feature}</span>
              </div>
            ))}
          </div>

          <div className="mt-auto pt-6 border-t border-(--surface)">
            <div className="mb-5">
              <span className="text-3xl font-extrabold text-on-surface">
                ₹499
              </span>
              <span className="text-on-surface-variant text-xs ml-2">
                / month
              </span>
            </div>
            <button
              onClick={handleProClick}
              className="w-full bg-(--surface) border border-(--surface) text-on-surface py-4 rounded-xl font-bold hover:bg-(--surface) hover:border-primary/50 transition-colors active:scale-[0.98] shadow-lg"
            >
              Get Started
            </button>
          </div>
        </div>

        {/* Pro Card */}
        <div className="bg-(--surface-container)/80 backdrop-blur-sm border-2 border-primary rounded-2xl p-7 flex flex-col transition-shadow relative overflow-hidden shadow-2xl shadow-primary/10 group">
          {/* Premium Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[60px] pointer-events-none"></div>

          <div className="mb-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-primary/20 rounded-xl border border-primary/30">
                <span
                  className="material-symbols-outlined text-primary text-2xl"
                  style={{
                    fontVariationSettings: "'FILL' 1",
                  }}
                >
                  rocket_launch
                </span>
              </div>
              <span className="bg-primary text-(--bg-dark) px-3 py-1 rounded-full text-[9px] font-bold tracking-widest uppercase shadow-lg shadow-primary/20">
                RECOMMENDED
              </span>
            </div>
            <h3 className="text-xl font-bold text-on-surface mb-1">
              MedAssist Pro
            </h3>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Enterprise-grade automation for high-volume clinical operations.
            </p>
          </div>

          <div className="space-y-3 mb-8 grow">
            {[
              "Full Intelligence Hub",
              "Unlimited Inventory SKUs",
              "24/7 Priority Support",
              "Advanced Bulk Import",
              "Personnel Multi-Tenancy",
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <span
                  className="material-symbols-outlined text-primary text-lg"
                  style={{
                    fontVariationSettings: "'FILL' 1",
                  }}
                >
                  verified
                </span>
                <span className="text-sm font-semibold text-on-surface">
                  {feature}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-auto pt-6 border-t border-primary/20">
            <div className="mb-5">
              <span className="text-3xl font-extrabold text-on-surface">
                ₹999
              </span>
              <span className="text-on-surface-variant text-xs ml-2">
                / month
              </span>
            </div>
            <button
              onClick={handleProClick}
              className="w-full bg-primary text-(--bg-dark) py-4 rounded-xl font-extrabold shadow-xl shadow-primary/20 hover:brightness-110 hover:scale-[1.02] transition-[filter] active:scale-[0.98]"
            >
              Activate Pro License
            </button>
          </div>
        </div>
      </div>

      {/* Security Footer */}
      <div className="mt-12 flex items-center justify-center gap-8 opacity-40 grayscale hover:opacity-70 transition-opacity">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-xs">shield</span>
          <span className="text-[9px] font-bold tracking-widest uppercase">
            HIPAA SECURE
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-xs">lock</span>
          <span className="text-[9px] font-bold tracking-widest uppercase">
            SSL ENCRYPTED
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-xs">payments</span>
          <span className="text-[9px] font-bold tracking-widest uppercase">
            RAZORPAY VERIFIED
          </span>
        </div>
      </div>
    </main>
  );
}
export default function PlanSelection({ onSelectTrial, onSelectPro }) {
  const handleTrialClick = () => {
    if (onSelectTrial) onSelectTrial();
  };
  const handleProClick = () => {
    if (onSelectPro) onSelectPro();
  };
  return (
    <div className="dark bg-(--bg-dark) h-screen text-on-surface font-['Manrope'] antialiased overflow-y-auto">
      {/* TopAppBar Segment */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 py-3 bg-(--bg-dark)/90 backdrop-blur-md border-b border-(--surface) shadow-xl">
        <div className="flex items-center gap-3">
          <img
            src="/viyan_logo.webp"
            alt="Viyan MedAssist"
            className="h-10 w-auto"
          />
        </div>
        <div className="hidden md:flex items-center space-x-8">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-widest cursor-default">
            Onboarding Mode
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
            System Live
          </span>
        </div>
      </header>

      {/* Main Content */}
      <PlanSelectionSection1
        handleTrialClick={handleTrialClick}
        handleProClick={handleProClick}
      />

      {/* Background Decor */}
      <div className="fixed bottom-0 left-0 w-full h-1/2 bg-linear-to-t from-primary/5 to-transparent -z-10 pointer-events-none"></div>
    </div>
  );
}

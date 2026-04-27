import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, Target, Zap, Shield, ChevronRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#05050f] text-white overflow-hidden selection:bg-brand-500/30">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-brand-500 opacity-20 blur-[100px]"></div>
      </div>

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
            <BarChart3 size={16} className="text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">The Segmentation Knight</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
            Sign In
          </Link>
          <Link to="/signup" className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-black font-semibold hover:bg-slate-200 transition-colors">
            Get Started
            <ChevronRight size={16} />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center pt-32 pb-20 px-6 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-brand-300 mb-8 animate-fade-in delay-100">
          <Zap size={14} className="text-accent-400" />
          <span>New: AI-Powered Customer Clustering</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60 animate-fade-in delay-200">
          Understand Your Customers <br className="hidden md:block" /> Like Never Before.
        </h1>
        
        <p className="text-lg md:text-xl text-slate-400 max-w-3xl mb-10 animate-fade-in delay-300">
          Unlock hidden patterns in your retail data. The Segmentation Knight uses advanced machine learning pipelines to automatically group customers based on purchasing behavior.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 animate-fade-in delay-300">
          <Link to="/signup" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold flex items-center justify-center gap-2 transition-all shadow-[0_0_40px_rgba(37,99,235,0.3)]">
            Start Free Trial
            <ArrowRight size={18} />
          </Link>
          <Link to="/login" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold flex items-center justify-center transition-all">
            View Live Demo
          </Link>
        </div>

        {/* Dashboard Preview */}
        <div className="mt-20 w-full relative animate-fade-in delay-500">
          <div className="absolute -inset-1 bg-gradient-to-r from-brand-500 to-accent-500 rounded-2xl blur opacity-20"></div>
          <div className="relative rounded-xl border border-white/10 bg-[#0a0a14] shadow-2xl p-2 overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=2000" 
              alt="Dashboard Preview" 
              className="w-full rounded-lg opacity-80"
            />
          </div>
        </div>
      </main>

      {/* Feature Section */}
      <section id="features" className="relative z-10 py-24 px-6 max-w-7xl mx-auto border-t border-white/10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful Analytics at your Fingertips</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">Upload your raw transaction data and we instantly parse, clean, and model it using K-Means clustering.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: <Target size={24} className="text-brand-400" />,
              title: "RFM Analysis",
              desc: "Automatically calculates Recency, Frequency, and Monetary metrics from raw transactional data."
            },
            {
              icon: <BarChart3 size={24} className="text-accent-400" />,
              title: "PCA Dimensionality",
              desc: "Visualizes complex high-dimensional purchasing patterns in an easy-to-read 2D scatter plot."
            },
            {
              icon: <Shield size={24} className="text-emerald-400" />,
              title: "Actionable Segments",
              desc: "Groups customers into VIP, Regular, and At-Risk segments so you can target them effectively."
            }
          ].map((feat, i) => (
            <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-6">
                {feat.icon}
              </div>
              <h3 className="text-xl font-semibold mb-3">{feat.title}</h3>
              <p className="text-slate-400 leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

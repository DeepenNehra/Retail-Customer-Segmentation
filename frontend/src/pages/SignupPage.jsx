import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BarChart3, Mail, Lock, User, ArrowRight, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function SignupPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({ 
    username: "", 
    email: "", 
    password: "", 
    password2: "",
    first_name: "",
    last_name: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    if (formData.password !== formData.password2) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }
    
    try {
      await register(formData);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.username?.[0] || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const calculateStrength = (pass) => {
    if (pass.length === 0) return 0;
    if (pass.length < 5) return 1;
    if (pass.length < 8) return 2;
    return 3;
  };

  const pStrength = calculateStrength(formData.password);

  return (
    <div className="min-h-screen bg-[#05050f] text-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden text-sm">
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-brand-600/20 blur-[120px]"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-accent-600/20 blur-[120px]"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Link to="/" className="flex items-center justify-center gap-2 mb-6 hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-lg shadow-brand-500/20">
            <BarChart3 size={20} className="text-white" />
          </div>
          <span className="text-3xl font-bold tracking-tight">The Segmentation Knight</span>
        </Link>
        <h2 className="text-center text-2xl font-bold tracking-tight text-white mb-2">
          Create your account
        </h2>
        <p className="text-center text-slate-400">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-brand-400 hover:text-brand-300">
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 animate-fade-in">
        <div className="glass-card-dark py-8 px-4 shadow sm:rounded-2xl sm:px-10 border border-white/10">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            <div>
              <label className="block font-medium text-slate-300">Username</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="block w-full pl-10 px-3 py-2.5 border border-white/10 rounded-lg bg-white/5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all sm:text-sm"
                  placeholder="johndoe"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-slate-300">First Name</label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="mt-1 block w-full px-3 py-2.5 border border-white/10 rounded-lg bg-white/5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all sm:text-sm"
                  placeholder="John"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-300">Last Name</label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="mt-1 block w-full px-3 py-2.5 border border-white/10 rounded-lg bg-white/5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all sm:text-sm"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-300">Email Address</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="block w-full pl-10 px-3 py-2.5 border border-white/10 rounded-lg bg-white/5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all sm:text-sm"
                  placeholder="you@company.com"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-300">Password</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="block w-full pl-10 px-3 py-2.5 border border-white/10 rounded-lg bg-white/5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all sm:text-sm"
                  placeholder="Create a strong password"
                />
              </div>
              
              {/* Password strength */}
              {formData.password && (
                <div className="mt-3 flex gap-1 h-1.5">
                  <div className={`flex-1 rounded-full ${pStrength >= 1 ? 'bg-rose-500' : 'bg-white/10'}`}></div>
                  <div className={`flex-1 rounded-full ${pStrength >= 2 ? 'bg-amber-500' : 'bg-white/10'}`}></div>
                  <div className={`flex-1 rounded-full ${pStrength >= 3 ? 'bg-emerald-500' : 'bg-white/10'}`}></div>
                </div>
              )}
            </div>

            <div>
              <label className="block font-medium text-slate-300">Confirm Password</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="password"
                  required
                  value={formData.password2}
                  onChange={(e) => setFormData({ ...formData, password2: e.target.value })}
                  className="block w-full pl-10 px-3 py-2.5 border border-white/10 rounded-lg bg-white/5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all sm:text-sm"
                  placeholder="Confirm your password"
                />
              </div>
            </div>

            <div className="flex items-start mt-4">
              <div className="flex items-center h-5">
                <input
                  required
                  id="terms"
                  type="checkbox"
                  className="h-4 w-4 text-brand-500 focus:ring-brand-500 border-white/10 rounded bg-white/5"
                />
              </div>
              <div className="ml-2 text-xs">
                <label htmlFor="terms" className="text-slate-400">
                  I agree to the <a href="#" className="font-medium text-brand-400">Terms of Service</a> and <a href="#" className="font-medium text-brand-400">Privacy Policy</a>.
                </label>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 mt-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-brand-600 hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 focus:ring-offset-[#05050f] transition-all disabled:opacity-70"
              >
                {loading ? "Creating Account..." : "Create Account"}
                {!loading && <ArrowRight size={16} />}
              </button>
            </div>
          </form>
        </div>

        {/* Features bullet points */}
        <div className="mt-8 grid grid-cols-2 gap-4 text-xs text-slate-400 px-2">
          <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500"/> Unlimited uploads</div>
          <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500"/> Real-time modeling</div>
          <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500"/> Data exports</div>
          <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500"/> API access</div>
        </div>
      </div>
    </div>
  );
}

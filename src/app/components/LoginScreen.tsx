import { useState } from "react";
import { Eye, EyeOff, Shield } from "lucide-react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import heuristicLabsLogo from "../../assets/heuristic-labs-logo.png";

export function LoginScreen() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) { setError("Email is required."); return; }
    if (!password) { setError("Password is required."); return; }
    setLoading(true);
    try {
      await login(email.trim(), password, rememberMe);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Left Panel */}
      <div
        className="relative flex flex-col overflow-hidden"
        style={{ width: "42%", minWidth: 420, backgroundColor: "#B8946A" }}
      >
        {/* Logo top-left */}
        <div className="flex items-center gap-3 px-8 pt-8">
          <img
            src={heuristicLabsLogo}
            alt="Heuristic Labs"
            style={{
              width: 44,
              height: 44,
              objectFit: "contain",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 700,
              fontSize: 18,
              color: "#FFFFFF",
              letterSpacing: "-0.02em",
            }}
          >
            Heuristic Labs
          </span>
        </div>

        {/* Center content */}
        <div className="flex flex-1 flex-col justify-center px-12 pb-20 relative z-10">
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 600,
              fontSize: 15,
              color: "rgba(255, 255, 255, 0.85)",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              marginBottom: 8,
            }}
          >
            Welcome to
          </p>
          <h1
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontStyle: "italic",
              fontWeight: 700,
              fontSize: 76,
              color: "#FFFFFF",
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
              margin: "0 0 16px",
              textShadow: "0px 4px 24px rgba(0,0,0,0.12)",
            }}
          >
            Voicera
          </h1>
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 500,
              fontSize: 18,
              color: "rgba(255, 255, 255, 0.95)",
              maxWidth: 260,
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            AI Voice Platform for Smarter Conversations
          </p>
        </div>

        {/* Decorative wave */}
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
          <svg
            viewBox="0 0 600 900"
            preserveAspectRatio="xMidYMid slice"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ width: "100%", height: "100%", display: "block" }}
          >
            <circle cx="68"  cy="74"  r="1.4" fill="#FFFFFF" fillOpacity="0.15" />
            <circle cx="448" cy="58"  r="1.0" fill="#FFFFFF" fillOpacity="0.10" />
            <circle cx="522" cy="148" r="1.6" fill="#FFFFFF" fillOpacity="0.12" />
            <circle cx="182" cy="218" r="1.1" fill="#FFFFFF" fillOpacity="0.15" />
            <circle cx="376" cy="305" r="1.2" fill="#FFFFFF" fillOpacity="0.10" />
            <circle cx="58"  cy="428" r="1.3" fill="#FFFFFF" fillOpacity="0.12" />
            <circle cx="487" cy="386" r="1.0" fill="#FFFFFF" fillOpacity="0.10" />
            <circle cx="268" cy="516" r="1.5" fill="#FFFFFF" fillOpacity="0.12" />
            <circle cx="138" cy="604" r="1.0" fill="#FFFFFF" fillOpacity="0.15" />
            <circle cx="558" cy="572" r="1.2" fill="#FFFFFF" fillOpacity="0.10" />
            <circle cx="334" cy="648" r="0.9" fill="#FFFFFF" fillOpacity="0.12" />

            <path d="M-20 786 C 110 756, 225 660, 308 672 C 396 685, 506 758, 640 788" stroke="#FFFFFF" strokeWidth="0.7" strokeOpacity="0.08" fill="none" strokeLinecap="round" />
            <path d="M-20 793 C 110 763, 225 667, 308 679 C 396 692, 506 765, 640 795" stroke="#FFFFFF" strokeWidth="0.8" strokeOpacity="0.10" fill="none" strokeLinecap="round" />
            <path d="M-20 800 C 110 770, 225 674, 308 686 C 396 699, 506 772, 640 802" stroke="#FFFFFF" strokeWidth="0.9" strokeOpacity="0.12" fill="none" strokeLinecap="round" />
            <path d="M-20 807 C 110 777, 225 681, 308 693 C 396 706, 506 779, 640 809" stroke="#FFFFFF" strokeWidth="1.0" strokeOpacity="0.14" fill="none" strokeLinecap="round" />
            <path d="M-20 813 C 110 783, 225 687, 308 699 C 396 712, 506 785, 640 815" stroke="#FFFFFF" strokeWidth="1.0" strokeOpacity="0.14" fill="none" strokeLinecap="round" />
            <path d="M-20 819 C 110 789, 225 693, 308 705 C 396 718, 506 791, 640 821" stroke="#FFFFFF" strokeWidth="1.1" strokeOpacity="0.16" fill="none" strokeLinecap="round" />
            <path d="M-20 825 C 110 795, 225 699, 308 711 C 396 724, 506 797, 640 827" stroke="#FFFFFF" strokeWidth="1.1" strokeOpacity="0.16" fill="none" strokeLinecap="round" />
            <path d="M-20 831 C 110 801, 225 705, 308 717 C 396 730, 506 803, 640 833" stroke="#FFFFFF" strokeWidth="1.0" strokeOpacity="0.14" fill="none" strokeLinecap="round" />
            <path d="M-20 838 C 110 808, 225 712, 308 724 C 396 737, 506 810, 640 840" stroke="#FFFFFF" strokeWidth="1.0" strokeOpacity="0.14" fill="none" strokeLinecap="round" />
            <path d="M-20 845 C 110 815, 225 719, 308 731 C 396 744, 506 817, 640 847" stroke="#FFFFFF" strokeWidth="0.9" strokeOpacity="0.12" fill="none" strokeLinecap="round" />
            <path d="M-20 852 C 110 822, 225 726, 308 738 C 396 751, 506 824, 640 854" stroke="#FFFFFF" strokeWidth="0.8" strokeOpacity="0.10" fill="none" strokeLinecap="round" />
            <path d="M-20 859 C 110 829, 225 733, 308 745 C 396 758, 506 831, 640 861" stroke="#FFFFFF" strokeWidth="0.7" strokeOpacity="0.08" fill="none" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex flex-1 items-center justify-center bg-white">
        <div style={{ width: "100%", maxWidth: 380, padding: "0 32px" }}>
          <h2
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontWeight: 700,
              fontSize: 26,
              color: "#1E1A14",
              margin: "0 0 6px",
            }}
          >
            Login to your account
          </h2>
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 400,
              fontSize: 13,
              color: "#7A746C",
              margin: "0 0 28px",
            }}
          >
            Enter your credentials to access the platform
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Error banner */}
            {error && (
              <div
                role="alert"
                style={{
                  backgroundColor: "#FEE2E2",
                  border: "1px solid #FECACA",
                  borderRadius: 8,
                  padding: "10px 14px",
                  fontSize: 13,
                  color: "#DC2626",
                }}
              >
                {error}
              </div>
            )}

            {/* Email field */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label
                htmlFor="email"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 500,
                  fontSize: 13,
                  color: "#1E1A14",
                }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                autoComplete="email"
                disabled={loading}
                style={{
                  height: 40,
                  border: "1.5px solid #E2DDD5",
                  borderRadius: 8,
                  padding: "0 12px",
                  fontFamily: "Inter, sans-serif",
                  fontSize: 13,
                  color: "#1E1A14",
                  outline: "none",
                  width: "100%",
                  boxSizing: "border-box",
                  backgroundColor: "#fff",
                  transition: "border-color 0.15s",
                  opacity: loading ? 0.6 : 1,
                }}
                onFocus={(e) => (e.target.style.borderColor = "#C8872A")}
                onBlur={(e) => (e.target.style.borderColor = "#E2DDD5")}
              />
            </div>

            {/* Password field */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label
                htmlFor="password"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 500,
                  fontSize: 13,
                  color: "#1E1A14",
                }}
              >
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={loading}
                  style={{
                    height: 40,
                    border: "1.5px solid #E2DDD5",
                    borderRadius: 8,
                    padding: "0 40px 0 12px",
                    fontFamily: "Inter, sans-serif",
                    fontSize: 13,
                    color: "#1E1A14",
                    outline: "none",
                    width: "100%",
                    boxSizing: "border-box",
                    backgroundColor: "#fff",
                    transition: "border-color 0.15s",
                    opacity: loading ? 0.6 : 1,
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#C8872A")}
                  onBlur={(e) => (e.target.style.borderColor = "#E2DDD5")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#9E9890",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Remember me + Forgot password */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{
                    width: 14,
                    height: 14,
                    accentColor: "#C8872A",
                    cursor: "pointer",
                  }}
                />
                <span
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: 13,
                    color: "#1E1A14",
                  }}
                >
                  Remember me
                </span>
              </label>
              <button
                type="button"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 500,
                  fontSize: 13,
                  color: "#C8872A",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                Forgot password?
              </button>
            </div>

            {/* Login button */}
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                height: 44,
                backgroundColor: loading ? "#D9A05A" : "#C8872A",
                borderRadius: 8,
                border: "none",
                color: "#fff",
                fontFamily: "Inter, sans-serif",
                fontWeight: 600,
                fontSize: 15,
                cursor: loading ? "not-allowed" : "pointer",
                transition: "background-color 0.15s",
                marginTop: 2,
              }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.backgroundColor = "#B57622"; }}
              onMouseLeave={(e) => { if (!loading) e.currentTarget.style.backgroundColor = "#C8872A"; }}
            >
              {loading ? "Signing in…" : "Login"}
            </button>
          </form>

          {/* Footer note */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              marginTop: 20,
            }}
          >
            <Shield size={13} style={{ color: "#9E9890" }} />
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 12,
                color: "#9E9890",
              }}
            >
              Secure login with JWT authentication
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

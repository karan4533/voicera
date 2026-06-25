import { Ban, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router";

export function SuspendedAccountScreen() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#F7F4EF] p-6 font-[Inter,sans-serif]">
      <div className="w-full max-w-md rounded-2xl border border-[#E7DFC8] bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#D9534F22]">
          <Ban size={28} className="text-[#D9534F]" />
        </div>
        <h1 className="m-0 mb-2 text-[20px] font-bold text-[#1E1A16]">Account Suspended</h1>
        <p className="m-0 mb-6 text-[13px] leading-relaxed text-[#6B645B]">
          Your organisation&apos;s access has been suspended by the platform administrator.
          Please contact support to reactivate your account.
        </p>
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border-none bg-[#50381F] px-5 text-[13px] font-bold text-white cursor-pointer hover:bg-[#3D2914] transition-colors"
        >
          <LogOut size={14} /> Return to Login
        </button>
      </div>
    </div>
  );
}

"use client";

import { Refrigerator } from "lucide-react";
import { useThatFridgeCtx } from "../ThatFridgeContext";

const fieldStyle: React.CSSProperties = {
  width: "100%",
  border: "none",
  outline: "none",
  background: "#f6f8fa",
  borderRadius: 14,
  padding: "13px 16px",
  fontSize: 14,
  color: "#16325c",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: 0.3,
  color: "rgba(22,50,92,0.5)",
  marginBottom: 6,
};

export default function AuthScreen() {
  const { state, actions } = useThatFridgeCtx();
  const isLogin = state.authMode === "login";

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    actions.submitAuth();
  };

  const tabs = (
    <div style={{ display: "flex", background: "#f6f8fa", borderRadius: 14, padding: 4, gap: 4, marginBottom: 20, width: "fit-content" }}>
      <div
        onClick={() => actions.setAuthMode("login")}
        style={{
          textAlign: "center",
          padding: "9px 22px",
          borderRadius: 11,
          fontSize: 13,
          fontWeight: 700,
          cursor: "pointer",
          background: isLogin ? "#16325c" : "transparent",
          color: isLogin ? "#fff" : "rgba(22,50,92,0.55)",
        }}
      >
        Log in
      </div>
      <div
        onClick={() => actions.setAuthMode("signup")}
        style={{
          textAlign: "center",
          padding: "9px 22px",
          borderRadius: 11,
          fontSize: 13,
          fontWeight: 700,
          cursor: "pointer",
          background: !isLogin ? "#16325c" : "transparent",
          color: !isLogin ? "#fff" : "rgba(22,50,92,0.55)",
        }}
      >
        Sign up
      </div>
    </div>
  );

  const formFields = (
    <>
      {!isLogin && (
        <div>
          <div style={labelStyle}>NAME</div>
          <input
            value={state.authName}
            onChange={(e) => actions.onAuthNameChange(e.target.value)}
            placeholder="Jordan Diaz"
            style={fieldStyle}
          />
        </div>
      )}
      <div>
        <div style={labelStyle}>EMAIL</div>
        <input
          type="email"
          value={state.authEmail}
          onChange={(e) => actions.onAuthEmailChange(e.target.value)}
          placeholder="you@example.com"
          style={fieldStyle}
        />
      </div>
      <div>
        <div style={labelStyle}>PASSWORD</div>
        <input
          type="password"
          value={state.authPassword}
          onChange={(e) => actions.onAuthPasswordChange(e.target.value)}
          placeholder="••••••••"
          style={fieldStyle}
        />
      </div>
      {!isLogin && (
        <div>
          <div style={labelStyle}>CONFIRM PASSWORD</div>
          <input
            type="password"
            value={state.authConfirmPassword}
            onChange={(e) => actions.onAuthConfirmPasswordChange(e.target.value)}
            placeholder="••••••••"
            style={fieldStyle}
          />
        </div>
      )}

      {state.authError && (
        <div style={{ fontSize: 12.5, fontWeight: 600, color: "#c1452e" }}>{state.authError}</div>
      )}

      <button
        type="submit"
        style={{
          marginTop: 4,
          textAlign: "center",
          padding: 14,
          borderRadius: 14,
          background: "#16325c",
          color: "#fff",
          fontSize: 14,
          fontWeight: 700,
          cursor: "pointer",
          border: "none",
        }}
      >
        {isLogin ? "Log in" : "Create account"}
      </button>
    </>
  );

  const switchLine = (
    <div style={{ textAlign: "center", fontSize: 12.5, color: "rgba(22,50,92,0.55)", marginTop: 18 }}>
      {isLogin ? (
        <>
          New here?{" "}
          <span onClick={() => actions.setAuthMode("signup")} style={{ color: "#16325c", fontWeight: 700, cursor: "pointer" }}>
            Create an account
          </span>
        </>
      ) : (
        <>
          Already have an account?{" "}
          <span onClick={() => actions.setAuthMode("login")} style={{ color: "#16325c", fontWeight: 700, cursor: "pointer" }}>
            Log in
          </span>
        </>
      )}
    </div>
  );

  return (
    <>
      <div
        className="thatfridge-auth-mobile"
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg,#eaf6ff,#cfe8fb 55%,#eaf6ff)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          overflowY: "auto",
          padding: "56px 24px 40px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 18,
              background: "#16325c",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 14px",
            }}
          >
            <Refrigerator size={26} color="#fff" strokeWidth={1.8} />
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.3, marginBottom: 4 }}>ThatFridge</div>
          <div style={{ fontSize: 13, color: "rgba(22,50,92,0.55)" }}>Know what&apos;s inside before you open the door.</div>
        </div>

        <div style={{ background: "#fff", borderRadius: 22, padding: 20, boxShadow: "0 10px 24px rgba(22,50,92,0.1)" }}>
          {tabs}
          <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {formFields}
          </form>
        </div>

        {switchLine}
      </div>

      <div className="thatfridge-auth-wide" style={{ position: "absolute", inset: 0 }}>
        <div
          className="thatfridge-auth-brand-panel"
          style={{
            background: "radial-gradient(circle at 20% 15%, rgba(255,255,255,0.10) 0, transparent 45%), linear-gradient(160deg, #1e4576 0%, #16325c 45%, #0a1a30 100%)",
            color: "#fff",
            padding: "48px 44px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flex: "none",
              }}
            >
              <Refrigerator size={18} color="#fff" strokeWidth={1.8} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: -0.2 }}>ThatFridge</div>
          </div>

          <div style={{ position: "relative", maxWidth: 340 }}>
            <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: -0.6, lineHeight: 1.18, marginBottom: 14 }}>
              Know what&apos;s inside before you open the door.
            </div>
            <div style={{ fontSize: 14.5, lineHeight: 1.6, color: "rgba(255,255,255,0.72)" }}>
              Scan it, track it, and let your crew of AI helpers tell you what&apos;s about to go bad — before it does.
            </div>
          </div>

          <div style={{ position: "relative", fontSize: 11.5, color: "rgba(255,255,255,0.4)" }}>© {new Date().getFullYear()} ThatFridge</div>
        </div>

        <div style={{ padding: "56px 64px", display: "flex", flexDirection: "column", justifyContent: "center", overflowY: "auto", background: "#fff" }}>
          <div style={{ maxWidth: 340, width: "100%", margin: "0 auto" }}>
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.4, marginBottom: 6 }}>
              {isLogin ? "Welcome back" : "Create your account"}
            </div>
            <div style={{ fontSize: 13.5, color: "rgba(22,50,92,0.55)", marginBottom: 28 }}>
              {isLogin ? "Log in to see what's in your fridge." : "Start tracking what's in your fridge."}
            </div>
            {tabs}
            <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {formFields}
            </form>
            {switchLine}
          </div>
        </div>
      </div>
    </>
  );
}

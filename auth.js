// Shared auth utilities — loaded by every page except login.html.
// Requires: Supabase CDN and supabase-config.js loaded before this file.

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Injects a user pill + sign-out button (or sign-in link) into .site-nav.
async function setupNav() {
  const navEl = document.querySelector(".site-nav");
  if (!navEl) return;

  const { data: { session } } = await sb.auth.getSession();

  const wrap = document.createElement("div");
  wrap.style.cssText = "margin-left:auto;display:flex;align-items:center;gap:8px;padding:0 4px;flex-shrink:0;";

  if (session) {
    const name = session.user.user_metadata?.name || session.user.email.split("@")[0];
    wrap.innerHTML = `
      <span style="font-size:12px;color:#9fd4b7;font-weight:600;white-space:nowrap;">${name}</span>
      <button id="_signOutBtn" style="background:rgba(255,255,255,0.12);border:none;border-radius:6px;color:#b3cec2;font-size:12px;font-weight:600;padding:5px 10px;cursor:pointer;white-space:nowrap;">Sign out</button>
    `;
    navEl.appendChild(wrap);
    document.getElementById("_signOutBtn").addEventListener("click", async () => {
      await sb.auth.signOut();
      location.href = "login.html";
    });
  } else {
    wrap.innerHTML = `<a href="login.html" style="font-size:12px;color:#9fd4b7;font-weight:600;text-decoration:none;background:rgba(255,255,255,0.1);padding:5px 10px;border-radius:6px;white-space:nowrap;">Sign in</a>`;
    navEl.appendChild(wrap);
  }
}

// Redirects to login.html if no session; returns session object if authenticated.
async function requireAuth() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) {
    const next = encodeURIComponent(location.pathname.split("/").pop() + location.search);
    location.href = `login.html?next=${next}`;
    return null;
  }
  return session;
}

// ─────────────────────────────────────────────
// SUPABASE CONFIG
// Replace with your actual values from:
// supabase.com → your project → Settings → API
// ─────────────────────────────────────────────
const SUPABASE_URL     = 'sb_publishable_pbU69QiHv3E2VPv8tQD69g_3l557GAr';
const SUPABASE_ANON_KEY = 'https://emglbnpoecnwkwzxqlpt.supabase.co';

// ─────────────────────────────────────────────
// TOGGLE — switch between developer / recruiter
// ─────────────────────────────────────────────
const toggleOpts = document.querySelectorAll('.toggle-opt');
const devForm    = document.getElementById('devForm');
const hrForm     = document.getElementById('hrForm');

toggleOpts.forEach(btn => {
  btn.addEventListener('click', () => {
    toggleOpts.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    if (btn.dataset.role === 'developer') {
      devForm.style.display = 'flex';
      hrForm.style.display  = 'none';
    } else {
      devForm.style.display = 'none';
      hrForm.style.display  = 'flex';
    }
  });
});

// ─────────────────────────────────────────────
// SUPABASE INSERT
// ─────────────────────────────────────────────
async function insertRow(data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/waitlist`, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'apikey':         SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Prefer':         'return=minimal'
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(await res.text());
}

// ─────────────────────────────────────────────
// FORM HANDLER — reusable for both forms
// ─────────────────────────────────────────────
function handleForm(form, role, getData) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const btn        = form.querySelector('.submit-btn');
    const btnText    = form.querySelector('.submit-text');
    const btnLoading = form.querySelector('.submit-loading');
    const success    = form.querySelector('.msg-success');
    const error      = form.querySelector('.msg-error');

    success.style.display = 'none';
    error.style.display   = 'none';
    btn.disabled          = true;
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline';

    try {
      await insertRow({ ...getData(), role, created_at: new Date().toISOString() });
      form.reset();
      success.style.display = 'block';
      fetchCounts();
    } catch (err) {
      console.error(err);
      error.style.display = 'block';
    } finally {
      btn.disabled             = false;
      btnText.style.display    = 'inline';
      btnLoading.style.display = 'none';
    }
  });
}

// developer
handleForm(devForm, 'developer', () => ({
  name:       devForm.querySelector('[name="name"]').value.trim(),
  email:      devForm.querySelector('[name="email"]').value.trim(),
  tech_stack: devForm.querySelector('[name="tech_stack"]').value,
  job_status: devForm.querySelector('[name="job_status"]').value,
}));

// recruiter
handleForm(hrForm, 'recruiter', () => ({
  name:            hrForm.querySelector('[name="name"]').value.trim(),
  email:           hrForm.querySelector('[name="email"]').value.trim(),
  company:         hrForm.querySelector('[name="company"]').value.trim(),
  hires_per_month: hrForm.querySelector('[name="hires_per_month"]').value,
}));

// ─────────────────────────────────────────────
// LIVE COUNTS — fetches from Supabase
// ─────────────────────────────────────────────
async function fetchCounts() {
  try {
    const headers = {
      'apikey':         SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Prefer':         'count=exact',
      'Range':          '0-0'
    };

    const [devRes, hrRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/waitlist?role=eq.developer&select=id`, { headers }),
      fetch(`${SUPABASE_URL}/rest/v1/waitlist?role=eq.recruiter&select=id`, { headers })
    ]);

    const devCount = parseInt(devRes.headers.get('Content-Range')?.split('/')[1] || '0');
    const hrCount  = parseInt(hrRes.headers.get('Content-Range')?.split('/')[1] || '0');

    animateTo('devCount', devCount);
    animateTo('hrCount',  hrCount);

  } catch {
    // silently fail — counts stay at 0 until Supabase is connected
  }
}

// ─────────────────────────────────────────────
// ANIMATED COUNTER
// ─────────────────────────────────────────────
function animateTo(id, target) {
  const el = document.getElementById(id);
  if (!el) return;

  const start    = parseInt(el.textContent) || 0;
  const duration = 900;
  const t0       = performance.now();

  function tick(now) {
    const p = Math.min((now - t0) / duration, 1);
    const e = 1 - Math.pow(1 - p, 4); // ease out quart
    el.textContent = Math.round(start + (target - start) * e);
    if (p < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', fetchCounts);
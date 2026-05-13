import { useState, useEffect, useRef } from 'react';
import { searchByToken, getTokenTracking } from '../../services/api';

// Inline user reader (mirrors api.js helper — no circular import)
const _getMe = () => {
  try {
    const id = localStorage.getItem('wasteo_token');
    if (!id) return null;
    const users = JSON.parse(localStorage.getItem('wasteo_users') || '[]');
    return users.find(u => u._id === id) || null;
  } catch { return null; }
};

/* ── helpers ── */
const STATUS_COLOR = {
  pending:          '#f59e0b',
  'in-progress':    '#60a5fa',
  completed:        '#22c55e',
  rejected:         '#ef4444',
  approved:         '#a78bfa',
  ready_for_pickup: '#f97316',
  delivered:        '#22c55e',
};

const STATUS_ICON = {
  pending:          '⏳',
  'in-progress':    '🔄',
  completed:        '✅',
  rejected:         '❌',
  approved:         '👍',
  ready_for_pickup: '🎁',
  delivered:        '📦',
};

const TYPE_ICON = { complaint: '📋', order: '🛒' };

const fmtTime = (ts) => ts ? new Date(ts).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

/* ── Complaint timeline steps ── */
const COMPLAINT_STEPS = ['pending', 'in-progress', 'completed'];
const ORDER_STEPS = ['pending', 'approved', 'ready_for_pickup', 'delivered'];

function Timeline({ steps, currentStatus, history }) {
  const currentIdx = steps.indexOf(currentStatus);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, margin: '1rem 0', flexWrap: 'wrap' }}>
      {steps.map((s, i) => {
        const done = i < currentIdx || currentStatus === 'delivered' || currentStatus === 'completed';
        const active = s === currentStatus;
        const isRejected = currentStatus === 'rejected';
        const color = active ? STATUS_COLOR[s] || '#60a5fa' : done ? '#22c55e' : 'rgba(255,255,255,.12)';
        const histEntry = history?.find(h => h.status === s);
        return (
          <div key={s} style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: color,
                display: 'grid', placeItems: 'center',
                fontSize: '.85rem', fontWeight: 800,
                border: active ? `3px solid var(--bg-card)` : 'none',
                boxShadow: active ? `0 0 0 3px ${color}44` : 'none',
                color: 'var(--txt-on-dark)', flexShrink: 0,
                transition: 'all 0.3s',
              }}>
                {done ? '✓' : isRejected && active ? '✗' : i + 1}
              </div>
              <div style={{ fontSize: '.62rem', color: active ? color : 'var(--txt-muted)', fontWeight: active ? 800 : 500, marginTop: '.3rem', textAlign: 'center', textTransform: 'capitalize' }}>
                {s.replace(/_/g, ' ')}
              </div>
              {histEntry && (
                <div style={{ fontSize: '.55rem', color: 'var(--txt-muted)', textAlign: 'center' }}>
                  {fmtTime(histEntry.timestamp)}
                </div>
              )}
            </div>
            {i < steps.length - 1 && (
              <div style={{ height: 2, flex: 1, background: i < currentIdx ? '#22c55e' : 'var(--border)', transition: 'background 0.3s', maxWidth: 40 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ResultCard({ result }) {
  if (!result) return null;
  const isComplaint = result.type === 'complaint';
  const statusColor = STATUS_COLOR[result.status] || '#94a3b8';
  const statusIcon = STATUS_ICON[result.status] || '❓';
  const steps = isComplaint ? COMPLAINT_STEPS : ORDER_STEPS;

  return (
    <div style={{ marginTop: '.8rem' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '.7rem .9rem', borderRadius: '10px',
        background: `linear-gradient(135deg, ${statusColor}22, ${statusColor}11)`,
        border: `1px solid ${statusColor}44`, marginBottom: '.8rem',
      }}>
        <div>
          <div style={{ fontSize: '.68rem', color: 'var(--txt-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.2rem' }}>
            {isComplaint ? '📋 Complaint ID' : '🛒 Order ID'}
          </div>
          <div style={{ fontWeight: 800, fontSize: '.95rem', color: 'var(--txt-primary)', fontFamily: 'monospace' }}>{result.id}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '.72rem', fontWeight: 800, color: statusColor, background: `${statusColor}22`, padding: '.3rem .6rem', borderRadius: '20px', border: `1px solid ${statusColor}44` }}>
            {statusIcon} {result.status.replace(/_/g, ' ').toUpperCase()}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <Timeline steps={steps} currentStatus={result.status} history={result.history || result.statusHistory || []} />

      {/* Rejection reason */}
      {result.rejectionReason && (
        <div style={{ padding: '.6rem .8rem', borderRadius: '8px', background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.25)', marginBottom: '.7rem' }}>
          <div style={{ fontSize: '.65rem', fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', marginBottom: '.2rem' }}>❌ Rejection Reason</div>
          <div style={{ fontSize: '.78rem', color: 'var(--txt-primary)' }}>{result.rejectionReason}</div>
        </div>
      )}

      {/* Details grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem' }}>
        {isComplaint ? (
          <>
            {result.filedBy && <InfoCell label="👤 Filed By" value={result.filedBy} span />}
            {result.location && <InfoCell label="📍 Location" value={result.location} />}
            {result.block && <InfoCell label="🏢 Block" value={`Block ${result.block}`} />}
            {result.wasteType && <InfoCell label="🗑️ Waste Type" value={result.wasteType} />}
            {result.createdAt && <InfoCell label="📅 Filed On" value={fmtTime(result.createdAt)} />}
            {result.assignedTo && <InfoCell label="👷 Assigned" value={result.assignedTo?.name || 'Assigned'} span />}
            {result.description && <InfoCell label="📝 Description" value={result.description} span />}
          </>
        ) : (
          <>
            {result.orderedBy && <InfoCell label="👤 Ordered By" value={result.orderedBy} span />}
            {result.itemName && <InfoCell label="📦 Item" value={result.itemName} span />}
            {result.pointsUsed && <InfoCell label="⭐ Points Used" value={`${result.pointsUsed} pts`} />}
            {result.pickupLocation && <InfoCell label="📍 Pickup Location" value={result.pickupLocation} />}
            {result.pickupTime && <InfoCell label="🕒 Pickup Time" value={result.pickupTime} />}
            {result.pickupCode && result.status !== 'delivered' && (
              <InfoCell label="🔐 Pickup Code" value={result.pickupCode} highlight span />
            )}
            {result.createdAt && <InfoCell label="📅 Ordered On" value={fmtTime(result.createdAt)} />}
            {result.deliveredAt && <InfoCell label="✅ Delivered" value={fmtTime(result.deliveredAt)} span />}
          </>
        )}
      </div>
    </div>
  );
}

function InfoCell({ label, value, span, highlight }) {
  return (
    <div style={{ gridColumn: span ? '1/-1' : undefined }}>
      <div style={{ fontSize: '.6rem', color: 'var(--txt-muted)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '.15rem' }}>{label}</div>
      <div style={{
        fontSize: '.76rem', fontWeight: 600,
        color: highlight ? '#fbbf24' : 'var(--txt-primary)',
        fontFamily: highlight ? 'monospace' : undefined,
        letterSpacing: highlight ? '2px' : undefined,
      }}>{value}</div>
    </div>
  );
}

/* ── Recent activity log ── */
const ACTIVITY_ICON = {
  complaint:    '📋',
  status_update:'🔄',
  order:        '🛒',
  order_status: '📦',
  reward:       '⭐',
  login:        '🔑',
  register:     '🆕',
};

/* ── Main Component ── */
export default function TokenTracker({ embedded = false, defaultOpen = false, onUserClick = null }) {
  const me = _getMe();
  const isAdmin = me?.role === 'admin';
  const theme = embedded
    ? {
        shellBg: 'var(--bg-card)',
        shellText: 'var(--txt-primary)',
        shellMuted: 'var(--txt-muted)',
        shellBorder: 'var(--border)',
        softBg: 'var(--bg-input)',
        softBorder: 'var(--border)',
        cardBg: 'color-mix(in srgb, var(--bg-card) 94%, var(--clr-green) 6%)',
        cardBorder: 'var(--border)',
        faintText: 'var(--txt-secondary)',
      }
    : {
        shellBg: '#0f172a',
        shellText: '#f1f5f9',
        shellMuted: 'rgba(255,255,255,.3)',
        shellBorder: 'rgba(255,255,255,.08)',
        softBg: 'rgba(255,255,255,.07)',
        softBorder: 'rgba(255,255,255,.12)',
        cardBg: 'rgba(255,255,255,.03)',
        cardBorder: 'rgba(255,255,255,.05)',
        faintText: 'rgba(255,255,255,.25)',
      };

  const [isOpen, setIsOpen] = useState(defaultOpen || embedded);
  const [tab, setTab] = useState(embedded ? 'log' : 'search'); // 'search' | 'log'
  const [query, setQuery] = useState('');
  const [activityQuery, setActivityQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [notFoundMsg, setNotFoundMsg] = useState('');
  // Load initial log: admin sees all, others see only own entries
  const [log, setLog] = useState(() => getTokenTracking(embedded && isAdmin).slice(0, 30));
  const [newEntry, setNewEntry] = useState(null);
  const inputRef = useRef(null);

  // Listen for live token events — filter to current user only (admin sees all)
  useEffect(() => {
    const handler = (e) => {
      const entry = e.detail;
      // Only show event in this user's log if it's theirs (or if admin)
      if (!isAdmin && me && entry.userId && entry.userId !== me._id) return;
      setLog(prev => [entry, ...prev].slice(0, 30));
      setNewEntry(entry.id);
      setTimeout(() => setNewEntry(null), 2500);
    };
    window.addEventListener('wasteo:token', handler);
    return () => window.removeEventListener('wasteo:token', handler);
  }, [isAdmin, me?._id]);

  const handleSearch = async (e) => {
    e?.preventDefault();
    const q = query.trim().toUpperCase();
    if (!q) return;
    setLoading(true);
    setResult(null);
    setNotFound(false);
    setNotFoundMsg('');
    try {
      const res = await searchByToken(q);
      if (res.data) {
        setResult(res.data);
      } else {
        setNotFound(true);
      }
    } catch (err) {
      setNotFound(true);
      setNotFoundMsg(err?.response?.data?.message || 'Token not found.');
    } finally {
      setLoading(false);
    }
  };

  const logEntries = log.filter((entry) => {
    if (!activityQuery.trim()) return true;
    const q = activityQuery.trim().toLowerCase();
    const details = [
      entry.type,
      entry.id,
      entry.userId,
      entry.userRole,
      entry.timestamp,
      ...(entry.meta ? Object.values(entry.meta) : []),
    ];
    return details.some((value) => String(value ?? '').toLowerCase().includes(q));
  });
  const logBadge = logEntries.length;

  const handleActivityClick = (entry) => {
    const isUserActivity = ['login', 'register'].includes(entry.type);
    if (embedded && isAdmin && isUserActivity && entry.userId && onUserClick) {
      onUserClick(entry.userId);
      return;
    }
    setTab('search');
    setQuery(entry.id);
    setTimeout(() => handleSearch(), 100);
  };

  const panel = (
    <div id="token-tracker-panel" style={{
      width: embedded ? '100%' : 340,
      maxHeight: embedded ? 'none' : '80vh',
      display: 'flex',
      flexDirection: 'column',
      background: theme.shellBg,
      border: `1px solid ${theme.shellBorder}`,
      borderRadius: embedded ? '20px' : '18px',
      boxShadow: embedded ? 'none' : '0 24px 64px rgba(0,0,0,.5)',
      color: theme.shellText,
      overflow: 'hidden',
    }}>

      {/* Header */}
      <div style={{ padding: '.9rem 1rem', borderBottom: `1px solid ${theme.shellBorder}`, flexShrink: 0, background: theme.shellBg, borderRadius: '18px 18px 0 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.4rem', gap: '.75rem' }}>
          <div style={{ fontWeight: 800, fontSize: '.95rem', display: 'flex', alignItems: 'center', gap: '.4rem', flexWrap: 'wrap' }}>
            🔍 Token ID Tracker
            {isAdmin && (
              <span style={{ fontSize: '.62rem', background: embedded ? 'rgba(235,76,76,.12)' : 'rgba(239,68,68,.2)', color: embedded ? 'var(--clr-red)' : '#f87171', border: `1px solid ${embedded ? 'rgba(235,76,76,.2)' : 'rgba(239,68,68,.3)'}`, borderRadius: '20px', padding: '.15rem .5rem', fontWeight: 700 }}>
                🛡️ ADMIN • All Users
              </span>
            )}
          </div>
          {!embedded && (
            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.shellMuted, fontSize: '1rem', padding: '.1rem .3rem' }}>✕</button>
          )}
        </div>
        {embedded && (
          <div style={{ fontSize: '.72rem', color: theme.shellMuted, lineHeight: 1.5 }}>
            Full activity view for complaints, orders, logins, registrations, rewards, and system updates.
          </div>
        )}
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '.4rem', marginTop: '.55rem' }}>
          {[{ id: 'search', label: '🔍 Search' }, { id: 'log', label: '📜 Activity Log' }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, padding: '.38rem .6rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '.75rem', fontWeight: 700,
              background: tab === t.id ? '#22c55e' : 'var(--bg-badge)',
              color: tab === t.id ? '#fff' : theme.shellMuted,
              transition: 'all 0.2s',
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      {/* Scrollable body */}
      <div style={{ overflowY: 'auto', flex: 1, padding: '.85rem' }}>
        {tab === 'search' && (
          <>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '.4rem', marginBottom: '.75rem' }}>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => { setQuery(e.target.value.toUpperCase()); setResult(null); setNotFound(false); }}
                placeholder="COMP-001 or ORD-0001…"
                style={{
                  flex: 1, padding: '.55rem .75rem', borderRadius: '10px',
                  background: theme.softBg, border: `1px solid ${theme.softBorder}`,
                  color: theme.shellText, fontSize: '.8rem', outline: 'none', fontFamily: 'monospace',
                }}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
              <button type="submit" style={{
                padding: '.55rem .95rem', borderRadius: '10px',
                background: '#22c55e', color: '#fff', border: 'none', cursor: 'pointer',
                fontWeight: 800, fontSize: '.8rem',
              }}>Search</button>
            </form>
            <div style={{ fontSize: '.65rem', color: theme.shellMuted, marginBottom: '.6rem' }}>
              {isAdmin
                ? '🛡️ Admin mode: search any COMP or ORD ID from all users'
                : 'Enter your Complaint ID (COMP-XXXX) or Order ID (ORD-XXXX) to see live status'}
            </div>

            {loading && (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: theme.faintText, fontSize: '.85rem' }}>
                ⌛ Searching…
              </div>
            )}

            {notFound && !loading && (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: '#ef4444', fontSize: '.82rem' }}>
                ❌ {notFoundMsg || 'No record found.'}<br />
                <span style={{ fontSize: '.72rem', color: theme.shellMuted, marginTop: '.3rem', display: 'block' }}>
                  {isAdmin ? 'Check the ID format and try again.' : 'You can only search your own IDs.'}
                </span>
              </div>
            )}

            {result && !loading && <ResultCard result={result} />}

            {!result && !notFound && !loading && (
              <div style={{ textAlign: 'center', padding: '1rem 0', color: theme.faintText, fontSize: '.78rem' }}>
                🔎 Search by Complaint or Order ID above to see full status details and timeline.
              </div>
            )}
          </>
        )}

        {tab === 'log' && (
          <>
            <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', marginBottom: '.75rem', flexWrap: 'wrap' }}>
              <div style={{ fontSize: '.65rem', color: theme.shellMuted }}>
                {isAdmin ? '🛡️ Admin view — showing all users\' activities' : 'Your recent token activities (live)'}
              </div>
              <div style={{ marginLeft: 'auto', fontSize: '.65rem', color: theme.shellMuted }}>
                {logBadge} shown
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '.75rem' }}>
              <input
                className="form-input"
                type="text"
                value={activityQuery}
                onChange={(e) => setActivityQuery(e.target.value)}
                placeholder="Search activity by token, user id, role, or any detail"
                style={{ background: theme.softBg, borderColor: theme.softBorder, color: theme.shellText }}
              />
            </div>

            {logEntries.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: theme.shellMuted, fontSize: '.8rem' }}>
                No activity yet. File a complaint or place an order to see live token tracking here.
              </div>
            ) : logEntries.map((entry, i) => {
              const metaEntries = entry.meta ? Object.entries(entry.meta) : [];
              return (
                <button
                  key={`${entry.id}-${i}`}
                  onClick={() => handleActivityClick(entry)}
                  style={{
                    width: '100%', textAlign: 'left', display: 'flex', gap: '.6rem', alignItems: 'flex-start',
                    padding: '.65rem .7rem', borderRadius: '10px', marginBottom: '.35rem',
                    background: entry.id === newEntry ? 'rgba(34,197,94,.1)' : theme.cardBg,
                    border: `1px solid ${entry.id === newEntry ? 'rgba(34,197,94,.3)' : theme.cardBorder}`,
                    transition: 'background 0.3s',
                    color: theme.shellText,
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ fontSize: '1rem', flexShrink: 0 }}>{ACTIVITY_ICON[entry.type] || '🔖'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '.5rem' }}>
                      <span style={{ fontSize: '.68rem', fontWeight: 700, color: '#22c55e', textTransform: 'uppercase' }}>{entry.type.replace(/_/g, ' ')}</span>
                      <span style={{ fontSize: '.62rem', color: theme.shellMuted }}>
                        {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {embedded && isAdmin && ['login', 'register'].includes(entry.type) && entry.meta?.email && (
                      <div style={{ fontSize: '.6rem', color: theme.shellMuted, marginTop: '.12rem' }}>
                        {entry.meta.email}
                      </div>
                    )}
                    <div style={{ fontSize: '.75rem', fontFamily: 'monospace', fontWeight: 700, color: 'var(--clr-blue)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {entry.id}
                    </div>
                    {isAdmin && entry.userId && (
                      <div style={{ fontSize: '.6rem', color: theme.shellMuted, marginTop: '.15rem' }}>
                        👤 User {entry.userId} • {entry.userRole || 'user'}
                      </div>
                    )}
                    {metaEntries.length > 0 && (
                      <div style={{ marginTop: '.3rem', display: 'grid', gap: '.2rem' }}>
                        {metaEntries.slice(0, 3).map(([key, value]) => (
                          <div key={key} style={{ fontSize: '.6rem', color: theme.shellMuted, wordBreak: 'break-word' }}>
                            <strong style={{ color: theme.shellText }}>{key}:</strong> {String(value)}
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{ marginTop: '.3rem', fontSize: '.6rem', color: '#22c55e', textDecoration: 'underline' }}>
                      Click to open full details
                    </div>
                  </div>
                </button>
              );
            })}
          </>
        )}
      </div>
    </div>
  );

  return (
    <>
      {embedded ? panel : (
        <>
          {/* Floating Button */}
          <button
            id="token-tracker-btn"
            onClick={() => { setIsOpen(o => !o); setTimeout(() => inputRef.current?.focus(), 200); }}
            title="Token & ID Tracker — Search complaint or order status"
            aria-label="Token ID Tracker"
            style={{
              position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 9999,
              width: 54, height: 54, borderRadius: '50%',
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              color: '#fff', border: 'none', cursor: 'pointer',
              boxShadow: newEntry ? '0 0 0 8px rgba(34,197,94,.3)' : '0 4px 16px rgba(0,0,0,.3)',
              fontSize: '1.3rem', display: 'grid', placeItems: 'center',
              transition: 'box-shadow 0.3s ease, transform 0.2s ease',
              transform: newEntry ? 'scale(1.12)' : 'scale(1)',
            }}
          >
            🔍
            {logEntries.length > 0 && (
              <span style={{
                position: 'absolute', top: 2, right: 2,
                background: '#ef4444', color: '#fff', borderRadius: '50%',
                width: 18, height: 18, display: 'grid', placeItems: 'center',
                fontSize: '.62rem', fontWeight: 800,
              }}>{logEntries.length > 9 ? '9+' : logEntries.length}</span>
            )}
          </button>

          {/* Panel */}
          {isOpen && (
            <div style={{
              position: 'fixed', bottom: '5.5rem', right: '1.5rem', zIndex: 9998,
              width: 340, maxHeight: '80vh', display: 'flex', flexDirection: 'column',
              background: theme.shellBg,
              border: `1px solid ${theme.shellBorder}`,
              borderRadius: '18px',
              boxShadow: '0 24px 64px rgba(0,0,0,.5)',
              color: theme.shellText,
              overflow: 'hidden',
            }}>
              {panel}
            </div>
          )}
        </>
      )}
    </>
  );
}

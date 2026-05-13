import { useState, useEffect } from 'react';
import Modal from './Modal';
import StatusBadge from './StatusBadge';
import { fmtDate } from '../../utils/helpers';


/* ── helpers ── */
const STATUS_STEPS_COMPLAINT = ['pending', 'in-progress', 'completed'];

function StatusTimeline({ history = [], currentStatus }) {
  const steps = currentStatus === 'rejected'
    ? ['pending', 'in-progress', 'rejected']
    : STATUS_STEPS_COMPLAINT;

  return (
    <div style={{ margin: '1rem 0' }}>
      <div style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--txt-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.6rem' }}>
        Status Timeline
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
        {steps.map((s, i) => {
          const currentIdx = steps.indexOf(currentStatus);
          const done = i < currentIdx || currentStatus === 'completed';
          const active = s === currentStatus;
          const isError = s === 'rejected';
          const color = active ? (isError ? 'var(--clr-red)' : 'var(--clr-green)') : done ? 'var(--clr-green)' : 'var(--border)';
          const histEntry = history.find(h => h.status === s);
          return (
            <div key={s} style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: done || active ? color : 'rgba(0,0,0,.06)',
                  display: 'grid', placeItems: 'center',
                  fontSize: '.75rem', fontWeight: 800,
                  border: active ? `3px solid ${color}` : 'none',
                  boxShadow: active ? `0 0 0 4px ${color}22` : 'none',
                  color: done || active ? '#fff' : 'var(--txt-muted)',
                  flexShrink: 0,
                  transition: 'all 0.3s',
                }}>
                  {done ? '✓' : active && isError ? '✕' : i + 1}
                </div>
                <div style={{
                  fontSize: '.62rem', marginTop: '.3rem', textAlign: 'center',
                  fontWeight: active ? 800 : 500,
                  color: active ? color : done ? 'var(--clr-green)' : 'var(--txt-muted)',
                  textTransform: 'capitalize',
                }}>{s.replace(/-/g, ' ')}</div>
                {histEntry && (
                  <div style={{ fontSize: '.55rem', color: 'var(--txt-muted)', textAlign: 'center' }}>
                    {new Date(histEntry.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>
              {i < steps.length - 1 && (
                <div style={{ height: 2, flex: 1, background: i < steps.indexOf(currentStatus) ? 'var(--clr-green)' : 'var(--border)', maxWidth: 50, transition: 'background 0.3s' }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InfoRow({ label, value, wide }) {
  if (!value && value !== 0) return null;
  return (
    <div style={{ gridColumn: wide ? '1/-1' : undefined }}>
      <div style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--txt-muted)', marginBottom: '.15rem' }}>{label}</div>
      <div style={{ fontWeight: 600, fontSize: '.88rem', color: 'var(--txt-primary)', lineHeight: 1.5 }}>{value}</div>
    </div>
  );
}

/**
 * ComplaintDetailModal
 *
 * Props:
 *   isOpen           bool
 *   onClose          fn
 *   complaint        object  (the complaint to show)
 *   role             'student' | 'collector' | 'admin'
 *
 *   // collector / admin action props (all optional):
 *   onUpdateStatus   fn(complaintId, { status, note, rejectionReason, file })
 *   isUpdating       bool
 */
export default function ComplaintDetailModal({ isOpen, onClose, complaint, role = 'student', onUpdateStatus, isUpdating }) {
  const [modalStatus, setModalStatus] = useState('in-progress');
  const [note, setNote] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [completionFile, setCompletionFile] = useState(null);
  const [completionPreview, setCompletionPreview] = useState(null);

  // Reset form when complaint changes
  useEffect(() => {
    setModalStatus('in-progress');
    setNote('');
    setRejectionReason('');
    setCompletionFile(null);
    setCompletionPreview(null);
  }, [complaint?.complaintId]);

  if (!complaint) return null;
  const canUpdate = (role === 'collector' || role === 'admin') && !['completed', 'rejected'].includes(complaint.status);

  const handleFileChange = (e) => {

    const file = e.target.files[0];
    if (file) {
      setCompletionFile(file);
      setCompletionPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = () => {
    if (!onUpdateStatus) return;
    onUpdateStatus(complaint.complaintId, {
      status: modalStatus,
      note: note || `Status updated to ${modalStatus}`,
      rejectionReason: modalStatus === 'rejected' ? rejectionReason : undefined,
      file: modalStatus === 'completed' ? completionFile : undefined,
    });
  };

  return (
    <Modal
      id="complaint-detail-modal"
      isOpen={isOpen}
      onClose={onClose}
      title={`📋 ${complaint.complaintId || 'Complaint Details'}`}
    >
      {/* ── Status & timeline ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.5rem' }}>
        <StatusBadge status={complaint.status} />
        <span style={{ fontSize: '.72rem', color: 'var(--txt-muted)' }}>Filed: {fmtDate(complaint.createdAt)}</span>
      </div>

      <StatusTimeline history={complaint.statusHistory || []} currentStatus={complaint.status} />

      {/* ── Rejection reason ── */}
      {complaint.status === 'rejected' && (
        <div style={{ padding: '.7rem 1rem', borderRadius: '8px', background: 'rgba(235,76,76,.08)', border: '1px solid rgba(235,76,76,.2)', marginBottom: '.8rem' }}>
          <div style={{ fontSize: '.68rem', fontWeight: 800, color: 'var(--clr-red)', textTransform: 'uppercase', marginBottom: '.2rem' }}>❌ Rejection Reason</div>
          <div style={{ fontSize: '.85rem' }}>{complaint.rejectionReason || 'No reason provided.'}</div>
        </div>
      )}

      {/* ── Images ── */}
      {(complaint.image || complaint.completionImage) && (
        <div style={{ display: 'grid', gridTemplateColumns: complaint.image && complaint.completionImage ? '1fr 1fr' : '1fr', gap: '.8rem', marginBottom: '1rem' }}>
          {complaint.image && (
            <div>
              <div style={{ fontSize: '.65rem', fontWeight: 700, color: 'var(--txt-muted)', textTransform: 'uppercase', marginBottom: '.3rem' }}>📸 Complaint Photo</div>
              <img src={complaint.image} alt="Complaint" style={{ width: '100%', borderRadius: '8px', objectFit: 'cover', maxHeight: 160, border: '1px solid var(--border)' }} onError={e => e.target.style.display = 'none'} />
            </div>
          )}
          {complaint.completionImage && (
            <div>
              <div style={{ fontSize: '.65rem', fontWeight: 700, color: 'var(--clr-green)', textTransform: 'uppercase', marginBottom: '.3rem' }}>✅ Completion Proof</div>
              <img src={complaint.completionImage} alt="Proof" style={{ width: '100%', borderRadius: '8px', objectFit: 'cover', maxHeight: 160, border: '2px solid var(--clr-green)' }} onError={e => e.target.style.display = 'none'} />
            </div>
          )}
        </div>
      )}

      {/* ── Details grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.7rem', marginBottom: '1rem' }}>
        <InfoRow label="📍 Location" value={complaint.location} />
        <InfoRow label="🏢 Block" value={complaint.block ? `Block ${complaint.block}` : null} />
        <InfoRow label="🗑️ Waste Type" value={complaint.wasteType} />
        <InfoRow label="📅 Filed On" value={fmtDate(complaint.createdAt)} />
        <InfoRow label="📝 Description" value={complaint.description} wide />
        {complaint.assignedTo && <InfoRow label="👷 Assigned Collector" value={complaint.assignedTo?.name || complaint.assignedTo} wide />}
      </div>

      {/* ── Status history log ── */}
      {complaint.statusHistory && complaint.statusHistory.length > 0 && (
        <div style={{ background: 'var(--bg-muted, rgba(0,0,0,.03))', padding: '.8rem 1rem', borderRadius: '10px', marginBottom: '1rem', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--txt-muted)', marginBottom: '.5rem' }}>Activity Log</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
            {complaint.statusHistory.map((h, i) => (
              <div key={i} style={{ display: 'flex', gap: '.7rem', alignItems: 'flex-start', fontSize: '.78rem' }}>
                <StatusBadge status={h.status} />
                <div style={{ flex: 1, color: 'var(--txt-secondary)' }}>{h.note}</div>
                <div style={{ flexShrink: 0, color: 'var(--txt-muted)', fontSize: '.68rem' }}>
                  {h.timestamp ? new Date(h.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Action form (collector / admin only) ── */}
      {canUpdate && onUpdateStatus && (
        <>
          <div style={{ borderTop: '2px dashed var(--border)', margin: '.8rem 0' }} />
          <div style={{ fontSize: '.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--txt-muted)', marginBottom: '.6rem' }}>
            ✏️ Update Status
          </div>

          <div className="form-group" style={{ marginBottom: '.7rem' }}>
            <label className="form-label">New Status</label>
            <select className="form-select" value={modalStatus} onChange={e => setModalStatus(e.target.value)}>
              <option value="in-progress">🔄 In Progress</option>
              <option value="completed">✅ Completed</option>
              <option value="rejected">❌ Rejected</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: '.7rem' }}>
            <label className="form-label">Note (optional)</label>
            <input
              className="form-input"
              type="text"
              placeholder="e.g. Assigned collector arrived on site…"
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>

          {modalStatus === 'rejected' && (
            <div className="form-group" style={{ marginBottom: '.7rem' }}>
              <label className="form-label">Rejection Reason <span style={{ color: 'var(--clr-red)' }}>*</span></label>
              <textarea
                className="form-input"
                rows="2"
                placeholder="e.g. Duplicate complaint, area already cleaned…"
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                style={{ resize: 'vertical', minHeight: 64 }}
              />
            </div>
          )}

          {modalStatus === 'completed' && (
            <div className="form-group" style={{ marginBottom: '.7rem' }}>
              <label className="form-label">Upload Proof of Completion <span style={{ color: 'var(--clr-red)' }}>*</span></label>
              <input type="file" className="form-input" accept="image/*" onChange={handleFileChange} />
              {completionPreview && (
                <img src={completionPreview} alt="Preview" style={{ width: '100%', maxHeight: 160, objectFit: 'contain', borderRadius: '8px', border: '1px solid var(--border)', marginTop: '.5rem' }} />
              )}
            </div>
          )}

          <button
            className={`btn btn-full ${modalStatus === 'rejected' ? 'btn-red' : 'btn-primary'}`}
            onClick={handleSubmit}
            disabled={isUpdating || (modalStatus === 'completed' && !completionFile) || (modalStatus === 'rejected' && !rejectionReason.trim())}
            style={{ marginTop: '.3rem' }}
          >
            {isUpdating ? '⌛ Saving…' : modalStatus === 'rejected' ? '❌ Reject Complaint' : '✅ Save Status Update'}
          </button>
        </>
      )}

      {/* Close button for view-only roles */}
      {!canUpdate && (
        <button className="btn btn-ghost btn-full" onClick={onClose} style={{ marginTop: '.5rem' }}>
          Close
        </button>
      )}
    </Modal>
  );
}

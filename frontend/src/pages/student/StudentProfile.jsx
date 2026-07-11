import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Spinner, Alert, Modal } from '../../components/UI';
import api from '../../utils/api';

export default function StudentProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwdError, setPwdError] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState(false);

  useEffect(() => {
    api.get('/student/profile').then(r => setProfile(r.data.data)).finally(() => setLoading(false));
  }, []);

  const handlePasswordChange = async () => {
    setPwdError('');
    if (pwdForm.newPassword !== pwdForm.confirm) { setPwdError('Passwords do not match'); return; }
    if (pwdForm.newPassword.length < 8) { setPwdError('Password must be at least 8 characters'); return; }
    setPwdLoading(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: pwdForm.currentPassword,
        newPassword: pwdForm.newPassword,
      });
      setPwdSuccess(true);
      setPwdForm({ currentPassword: '', newPassword: '', confirm: '' });
      setTimeout(() => { setShowPasswordModal(false); setPwdSuccess(false); }, 1500);
    } catch (err) {
      setPwdError(err.response?.data?.message || 'Failed to change password');
    } finally { setPwdLoading(false); }
  };

  if (loading) return <Layout title="Profile"><Spinner /></Layout>;

  return (
    <Layout title="My Profile">
      <div className="page-header">
        <div><h2 className="page-title">My Profile</h2></div>
        <button className="btn btn-outline" onClick={() => setShowPasswordModal(true)}>🔑 Reset Password</button>
      </div>
      {profile && (
        <div style={{ maxWidth: 500 }}>
          <div className="card">
            <div className="card-body">
              <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 18 }}>
                <div className="user-avatar" style={{ width: 48, height: 48, fontSize: 18, background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>
                  {profile.name?.split(' ').map(n=>n[0]).join('').slice(0,2)}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{profile.name}</div>
                  <div className="text-muted text-sm">{profile.email}</div>
                </div>
              </div>
              <table style={{ fontSize: 13 }}>
                <tbody>
                  {[
                    ['Enrollment No', profile.enrollment_no],
                    ['Course', profile.course],
                    ['Semester', profile.semester],
                    ['Year', profile.year],
                    ['Mobile', profile.mobile],
                    ['Address', profile.address],
                  ].map(([k, v]) => v ? (
                    <tr key={k}>
                      <td style={{ padding: '5px 0', color: 'var(--text-muted)', width: 140 }}>{k}</td>
                      <td style={{ padding: '5px 0', fontWeight: 500 }}>{v}</td>
                    </tr>
                  ) : null)}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <Modal title="Reset Password" onClose={() => setShowPasswordModal(false)}
          footer={<>
            <button className="btn btn-outline" onClick={() => setShowPasswordModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handlePasswordChange} disabled={pwdLoading}>
              {pwdLoading ? 'Updating...' : 'Update Password'}
            </button>
          </>}>
          {pwdError && <Alert type="error">{pwdError}</Alert>}
          {pwdSuccess && <Alert type="success">Password changed successfully!</Alert>}
          <div className="form-group">
            <label>Current Password</label>
            <input type="password" value={pwdForm.currentPassword} onChange={e => setPwdForm(f => ({...f, currentPassword: e.target.value}))} />
          </div>
          <div className="form-group">
            <label>New Password</label>
            <input type="password" value={pwdForm.newPassword} onChange={e => setPwdForm(f => ({...f, newPassword: e.target.value}))} placeholder="Min 8 characters" />
          </div>
          <div className="form-group">
            <label>Confirm New Password</label>
            <input type="password" value={pwdForm.confirm} onChange={e => setPwdForm(f => ({...f, confirm: e.target.value}))} />
          </div>
        </Modal>
      )}
    </Layout>
  );
}

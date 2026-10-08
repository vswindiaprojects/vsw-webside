import { api } from '../../01-FRONTEND/services/api'

export default function AdminUsers({ users, token, onUpdate, onError }) {
  if (!users.length) return <p className="admin-empty">No registered users yet.</p>
  const setStatus = async (id, status) => {
    try { await api.updateUserStatus(token, id, status); await onUpdate() } catch (error) { onError(error.message) }
  }
  return <div className="admin-table-wrap"><table><thead><tr><th>User ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Registration date</th><th>Status</th></tr></thead><tbody>{users.map((user) => <tr key={user.id}><td>{user.id}</td><td>{user.name}</td><td>{user.email}</td><td>{user.phone}</td><td>{new Date(user.createdAt).toLocaleDateString()}</td><td><select className="admin-status-select" aria-label={`${user.name} account status`} value={user.status} onChange={(event) => setStatus(user.id, event.target.value)}><option value="active">Active</option><option value="disabled">Disabled</option></select></td></tr>)}</tbody></table></div>
}

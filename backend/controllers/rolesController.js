const pool = require('../config/db');

// GET /roles - get all roles with users
const getRolesWithUsers = async (req, res) => {
  try {
    const rolesResult = await pool.query('SELECT * FROM roles ORDER BY id');
    const roles = rolesResult.rows;

    const usersResult = await pool.query(
      `SELECT u.id, u.username, u.email, u.full_name, r.name as role_name, r.id as role_id
       FROM users u JOIN roles r ON u.role_id = r.id WHERE u.is_active = true`
    );

    const roleMap = {};
    roles.forEach(role => { roleMap[role.name] = { ...role, users: [] }; });
    usersResult.rows.forEach(user => {
      if (roleMap[user.role_name]) roleMap[user.role_name].users.push(user);
    });

    return res.json({ success: true, roles: Object.values(roleMap) });
  } catch (err) {
    console.error('GetRoles error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// POST /roles/assign
const assignRole = async (req, res) => {
  const { username, role } = req.body;
  if (!username || !role) {
    return res.status(400).json({ success: false, message: 'Username and role are required.' });
  }
  try {
    const roleResult = await pool.query('SELECT id FROM roles WHERE name = $1', [role]);
    if (roleResult.rows.length === 0) return res.status(404).json({ success: false, message: 'Role not found.' });

    const userResult = await pool.query('SELECT id FROM users WHERE username = $1 OR email = $1', [username]);
    if (userResult.rows.length === 0) return res.status(404).json({ success: false, message: 'User not found.' });

    const roleId = roleResult.rows[0].id;
    const userId = userResult.rows[0].id;

    // Prevent demoting owner unless requester is owner
    if (role === 'owner' && req.user.role_name !== 'owner') {
      return res.status(403).json({ success: false, message: 'Only an Owner can assign Owner role.' });
    }

    await pool.query('UPDATE users SET role_id = $1, updated_at = NOW() WHERE id = $2', [roleId, userId]);

    await pool.query(
      'INSERT INTO audit_logs (user_id, action, table_name, record_id) VALUES ($1, $2, $3, $4)',
      [req.user.id, `ASSIGN_ROLE:${role}`, 'users', userId]
    );

    const updated = await pool.query(
      'SELECT u.id, u.username, u.email, u.full_name, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1',
      [userId]
    );

    return res.json({ success: true, message: `Role '${role}' assigned to ${username}.`, user: updated.rows[0] });
  } catch (err) {
    console.error('AssignRole error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// PUT /roles/remove
const removeFromRole = async (req, res) => {
  const { userId } = req.body;
  try {
    const employeeRoleResult = await pool.query("SELECT id FROM roles WHERE name = 'employee'");
    const employeeRoleId = employeeRoleResult.rows[0].id;

    await pool.query('UPDATE users SET role_id = $1 WHERE id = $2', [employeeRoleId, userId]);
    return res.json({ success: true, message: 'User moved to Employee role.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getRolesWithUsers, assignRole, removeFromRole };

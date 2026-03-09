const pool = require('../config/db');

// GET /leave/types
const getLeaveTypes = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM leave_types ORDER BY id');
    return res.json({ success: true, leaveTypes: result.rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /leave/requests
const getLeaveRequests = async (req, res) => {
  try {
    const { employee_id, status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let conditions = [];
    let params = [];
    let idx = 1;

    // Employees can only see their own leaves
    if (req.user.role_name === 'employee') {
      const empResult = await pool.query('SELECT id FROM employees WHERE user_id = $1', [req.user.id]);
      if (empResult.rows.length > 0) {
        conditions.push(`lr.employee_id = $${idx++}`);
        params.push(empResult.rows[0].id);
      }
    } else if (employee_id) {
      conditions.push(`lr.employee_id = $${idx++}`);
      params.push(employee_id);
    }

    if (status) { conditions.push(`lr.status = $${idx++}`); params.push(status); }

    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    params.push(limit, offset);

    const result = await pool.query(
      `SELECT lr.*, e.full_name, e.employee_id as emp_code, lt.name as leave_type_name, lt.code
       FROM leave_requests lr
       JOIN employees e ON lr.employee_id = e.id
       JOIN leave_types lt ON lr.leave_type_id = lt.id
       ${where} ORDER BY lr.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      params
    );

    const countRes = await pool.query(`SELECT COUNT(*) FROM leave_requests lr ${where}`, params.slice(0, -2));
    return res.json({
      success: true,
      requests: result.rows,
      pagination: { total: parseInt(countRes.rows[0].count), page: parseInt(page), limit: parseInt(limit) }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// POST /leave/request
const createLeaveRequest = async (req, res) => {
  try {
    const { employee_id, leave_type_id, start_date, end_date, reason } = req.body;
    if (!employee_id || !leave_type_id || !start_date || !end_date) {
      return res.status(400).json({ success: false, message: 'Required fields missing.' });
    }

    const start = new Date(start_date);
    const end = new Date(end_date);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    const result = await pool.query(
      `INSERT INTO leave_requests (employee_id, leave_type_id, start_date, end_date, days_requested, reason)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [employee_id, leave_type_id, start_date, end_date, days, reason]
    );

    return res.status(201).json({ success: true, message: 'Leave request submitted.', request: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// PUT /leave/requests/:id/approve
const approveLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body; // approved or rejected

    const empResult = await pool.query('SELECT id FROM employees WHERE user_id = $1', [req.user.id]);
    const approverId = empResult.rows[0]?.id;

    await pool.query(
      `UPDATE leave_requests SET status = $1, approval_notes = $2, approved_by = $3, approved_at = NOW(), updated_at = NOW()
       WHERE id = $4`,
      [status, notes, approverId, id]
    );

    // If approved, update leave balance
    if (status === 'approved') {
      const lr = await pool.query('SELECT * FROM leave_requests WHERE id = $1', [id]);
      const { employee_id, leave_type_id, days_requested } = lr.rows[0];
      const year = new Date().getFullYear();
      await pool.query(
        `UPDATE leave_balances SET used = used + $1 WHERE employee_id = $2 AND leave_type_id = $3 AND year = $4`,
        [days_requested, employee_id, leave_type_id, year]
      );
    }

    return res.json({ success: true, message: `Leave request ${status}.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /leave/balance/:employeeId
const getLeaveBalance = async (req, res) => {
  try {
    const year = new Date().getFullYear();
    const result = await pool.query(
      `SELECT lb.*, lt.name, lt.code FROM leave_balances lb
       JOIN leave_types lt ON lb.leave_type_id = lt.id
       WHERE lb.employee_id = $1 AND lb.year = $2`,
      [req.params.employeeId, year]
    );
    return res.json({ success: true, balances: result.rows, year });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getLeaveTypes, getLeaveRequests, createLeaveRequest, approveLeave, getLeaveBalance };

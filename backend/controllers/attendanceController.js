const pool = require('../config/db');

// GET /attendance
const getAttendance = async (req, res) => {
  try {
    const { employee_id, start_date, end_date, page = 1, limit = 30 } = req.query;
    const offset = (page - 1) * limit;
    let conditions = [];
    let params = [];
    let idx = 1;

    if (employee_id) { conditions.push(`a.employee_id = $${idx++}`); params.push(employee_id); }
    if (start_date) { conditions.push(`a.date >= $${idx++}`); params.push(start_date); }
    if (end_date) { conditions.push(`a.date <= $${idx++}`); params.push(end_date); }

    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    params.push(limit, offset);

    const result = await pool.query(
      `SELECT a.*, e.full_name, e.employee_id as emp_code
       FROM attendance a JOIN employees e ON a.employee_id = e.id
       ${where} ORDER BY a.date DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      params
    );

    const countResult = await pool.query(`SELECT COUNT(*) FROM attendance a ${where}`, params.slice(0, -2));
    return res.json({
      success: true,
      attendance: result.rows,
      pagination: { total: parseInt(countResult.rows[0].count), page: parseInt(page), limit: parseInt(limit) }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// POST /attendance/punch-in
const punchIn = async (req, res) => {
  try {
    const { employee_id, wfh = false, notes = '' } = req.body;
    const today = new Date().toISOString().split('T')[0];

    const existing = await pool.query('SELECT id, punch_in FROM attendance WHERE employee_id = $1 AND date = $2', [employee_id, today]);
    if (existing.rows.length > 0 && existing.rows[0].punch_in) {
      return res.status(409).json({ success: false, message: 'Already punched in today.' });
    }

    const now = new Date();
    const punchInTime = now;
    const nineAM = new Date(now); nineAM.setHours(9, 30, 0, 0);
    const isLate = now > nineAM;

    if (existing.rows.length > 0) {
      await pool.query('UPDATE attendance SET punch_in = $1, status = $2, wfh = $3, updated_at = NOW() WHERE id = $4',
        [punchInTime, isLate ? 'late' : 'present', wfh, existing.rows[0].id]);
    } else {
      await pool.query(
        'INSERT INTO attendance (employee_id, date, punch_in, status, wfh, notes) VALUES ($1, $2, $3, $4, $5, $6)',
        [employee_id, today, punchInTime, isLate ? 'late' : 'present', wfh, notes]
      );
    }

    return res.json({ success: true, message: 'Punched in successfully.', time: punchInTime, late: isLate });
  } catch (err) {
    console.error('PunchIn error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// POST /attendance/punch-out
const punchOut = async (req, res) => {
  try {
    const { employee_id } = req.body;
    const today = new Date().toISOString().split('T')[0];

    const record = await pool.query('SELECT * FROM attendance WHERE employee_id = $1 AND date = $2', [employee_id, today]);
    if (record.rows.length === 0 || !record.rows[0].punch_in) {
      return res.status(400).json({ success: false, message: 'No punch-in found for today.' });
    }
    if (record.rows[0].punch_out) {
      return res.status(409).json({ success: false, message: 'Already punched out today.' });
    }

    const punchOut = new Date();
    const punchIn = new Date(record.rows[0].punch_in);
    const workHours = ((punchOut - punchIn) / (1000 * 60 * 60)).toFixed(2);
    const overtimeHours = Math.max(0, workHours - 9).toFixed(2);
    const status = workHours < 4 ? 'half_day' : record.rows[0].status;

    await pool.query(
      'UPDATE attendance SET punch_out = $1, work_hours = $2, overtime_hours = $3, status = $4, updated_at = NOW() WHERE id = $5',
      [punchOut, workHours, overtimeHours, status, record.rows[0].id]
    );

    return res.json({ success: true, message: 'Punched out successfully.', workHours, overtimeHours });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// POST /attendance/manual
const manualEntry = async (req, res) => {
  try {
    const { employee_id, date, status, punch_in, punch_out, wfh, notes } = req.body;
    await pool.query(
      `INSERT INTO attendance (employee_id, date, punch_in, punch_out, status, wfh, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (employee_id, date) DO UPDATE SET 
         punch_in = EXCLUDED.punch_in, punch_out = EXCLUDED.punch_out,
         status = EXCLUDED.status, wfh = EXCLUDED.wfh, notes = EXCLUDED.notes, updated_at = NOW()`,
      [employee_id, date, punch_in, punch_out, status || 'present', wfh || false, notes || '']
    );
    return res.json({ success: true, message: 'Attendance recorded.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getAttendance, punchIn, punchOut, manualEntry };

const pool = require('../config/db');

// GET /exit
const getExitRecords = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT er.*, e.full_name, e.employee_id as emp_code, d.name as department_name
       FROM exit_records er
       JOIN employees e ON er.employee_id = e.id
       LEFT JOIN departments d ON e.department_id = d.id
       ORDER BY er.created_at DESC`
    );
    return res.json({ success: true, records: result.rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// POST /exit/resign
const submitResignation = async (req, res) => {
  try {
    const { employee_id, resignation_date, reason_category, resignation_letter, notice_period_days } = req.body;

    // Check if already resigned
    const existing = await pool.query('SELECT id FROM exit_records WHERE employee_id = $1 AND status != $2', [employee_id, 'completed']);
    if (existing.rows.length > 0) return res.status(409).json({ success: false, message: 'Resignation already in progress.' });

    const noticeDays = notice_period_days || 30;
    const lastWorkingDate = new Date(resignation_date);
    lastWorkingDate.setDate(lastWorkingDate.getDate() + noticeDays);

    const result = await pool.query(
      `INSERT INTO exit_records (employee_id, resignation_date, last_working_date, notice_period_days, reason_category, resignation_letter, status, initiated_by)
       VALUES ($1,$2,$3,$4,$5,$6,'pending',$7) RETURNING *`,
      [employee_id, resignation_date, lastWorkingDate.toISOString().split('T')[0], noticeDays, reason_category, resignation_letter, req.user.id]
    );

    // Update employee status
    await pool.query("UPDATE employees SET status='inactive' WHERE id=$1", [employee_id]);

    return res.status(201).json({ success: true, message: 'Resignation submitted.', record: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// PUT /exit/:id/clearance
const updateClearance = async (req, res) => {
  try {
    const { clearance_hr, clearance_finance, clearance_it, clearance_manager, assets_returned, it_access_revoked, exit_interview_done, exit_interview_notes } = req.body;
    const result = await pool.query(
      `UPDATE exit_records SET
        clearance_hr = COALESCE($1, clearance_hr),
        clearance_finance = COALESCE($2, clearance_finance),
        clearance_it = COALESCE($3, clearance_it),
        clearance_manager = COALESCE($4, clearance_manager),
        assets_returned = COALESCE($5, assets_returned),
        it_access_revoked = COALESCE($6, it_access_revoked),
        exit_interview_done = COALESCE($7, exit_interview_done),
        exit_interview_notes = COALESCE($8, exit_interview_notes),
        updated_at = NOW()
       WHERE id = $9 RETURNING *`,
      [clearance_hr, clearance_finance, clearance_it, clearance_manager, assets_returned, it_access_revoked, exit_interview_done, exit_interview_notes, req.params.id]
    );

    const record = result.rows[0];
    // Auto-complete if all clearances done
    if (record.clearance_hr && record.clearance_finance && record.clearance_it && record.clearance_manager && record.assets_returned && record.it_access_revoked) {
      await pool.query("UPDATE exit_records SET status='completed' WHERE id=$1", [req.params.id]);
      await pool.query("UPDATE employees SET status='exited', exit_date=NOW() WHERE id=$1", [record.employee_id]);
    }

    return res.json({ success: true, message: 'Clearance updated.', record });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// PUT /exit/:id/settlement
const updateSettlement = async (req, res) => {
  try {
    const { final_settlement_amount, final_settlement_date, settlement_status } = req.body;
    await pool.query(
      'UPDATE exit_records SET final_settlement_amount=$1, final_settlement_date=$2, settlement_status=$3, updated_at=NOW() WHERE id=$4',
      [final_settlement_amount, final_settlement_date, settlement_status, req.params.id]
    );
    return res.json({ success: true, message: 'Settlement updated.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getExitRecords, submitResignation, updateClearance, updateSettlement };

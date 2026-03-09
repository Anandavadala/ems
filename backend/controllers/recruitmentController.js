const pool = require('../config/db');

// GET /recruitment/jobs
const getJobs = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT jo.*, d.name as department_name, COUNT(c.id) as candidate_count
       FROM job_openings jo LEFT JOIN departments d ON jo.department_id = d.id
       LEFT JOIN candidates c ON c.job_opening_id = jo.id
       GROUP BY jo.id, d.name ORDER BY jo.created_at DESC`
    );
    return res.json({ success: true, jobs: result.rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// POST /recruitment/jobs
const createJob = async (req, res) => {
  try {
    const { title, department_id, location, employment_type, positions, description, requirements, closing_date } = req.body;
    const result = await pool.query(
      `INSERT INTO job_openings (title, department_id, location, employment_type, positions, description, requirements, closing_date, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [title, department_id, location, employment_type, positions || 1, description, requirements, closing_date, req.user.id]
    );
    return res.status(201).json({ success: true, job: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /recruitment/candidates
const getCandidates = async (req, res) => {
  try {
    const { job_id, stage } = req.query;
    let conditions = [];
    let params = [];
    let idx = 1;

    if (job_id) { conditions.push(`c.job_opening_id = $${idx++}`); params.push(job_id); }
    if (stage) { conditions.push(`c.stage = $${idx++}`); params.push(stage); }

    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    const result = await pool.query(
      `SELECT c.*, jo.title as job_title FROM candidates c LEFT JOIN job_openings jo ON c.job_opening_id = jo.id ${where} ORDER BY c.created_at DESC`,
      params
    );
    return res.json({ success: true, candidates: result.rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// POST /recruitment/candidates
const createCandidate = async (req, res) => {
  try {
    const { job_opening_id, full_name, email, phone, source, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO candidates (job_opening_id, full_name, email, phone, source, notes) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [job_opening_id, full_name, email, phone, source, notes]
    );
    return res.status(201).json({ success: true, candidate: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// PUT /recruitment/candidates/:id/stage
const updateCandidateStage = async (req, res) => {
  try {
    const { stage, notes } = req.body;
    await pool.query('UPDATE candidates SET stage=$1, notes=$2, updated_at=NOW() WHERE id=$3', [stage, notes, req.params.id]);
    return res.json({ success: true, message: 'Candidate stage updated.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// POST /recruitment/candidates/:id/hire - convert to employee
const hireCandidateAsEmployee = async (req, res) => {
  try {
    const candidate = await pool.query('SELECT * FROM candidates WHERE id = $1', [req.params.id]);
    if (candidate.rows.length === 0) return res.status(404).json({ success: false, message: 'Candidate not found.' });

    const c = candidate.rows[0];
    const countRes = await pool.query('SELECT COUNT(*) FROM employees');
    const empId = 'EMP' + String(parseInt(countRes.rows[0].count) + 1).padStart(4, '0');

    const empRoleRes = await pool.query("SELECT id FROM roles WHERE name = 'employee'");
    const empResult = await pool.query(
      `INSERT INTO employees (employee_id, full_name, email, phone, role_id, date_of_joining) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [empId, c.full_name, c.email, c.phone, empRoleRes.rows[0].id, new Date().toISOString().split('T')[0]]
    );

    await pool.query("UPDATE candidates SET stage='hired', updated_at=NOW() WHERE id=$1", [req.params.id]);
    return res.status(201).json({ success: true, message: 'Candidate hired as employee.', employee: empResult.rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getJobs, createJob, getCandidates, createCandidate, updateCandidateStage, hireCandidateAsEmployee };

const pool = require('../config/db');

// GET /departments
const getDepartments = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT d.*, p.name as parent_name, COUNT(e.id) as employee_count
       FROM departments d LEFT JOIN departments p ON d.parent_id = p.id
       LEFT JOIN employees e ON e.department_id = d.id AND e.status = 'active'
       GROUP BY d.id, p.name ORDER BY d.name`
    );
    return res.json({ success: true, departments: result.rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// POST /departments
const createDepartment = async (req, res) => {
  try {
    const { name, parent_id, description } = req.body;
    const result = await pool.query(
      'INSERT INTO departments (name, parent_id, description) VALUES ($1,$2,$3) RETURNING *',
      [name, parent_id || null, description]
    );
    return res.status(201).json({ success: true, department: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ success: false, message: 'Department already exists.' });
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /departments/org-chart
const getOrgChart = async (req, res) => {
  try {
    const employees = await pool.query(
      `SELECT e.id, e.full_name, e.designation, e.manager_id, e.employee_id,
              d.name as department, r.name as role
       FROM employees e
       LEFT JOIN departments d ON e.department_id = d.id
       LEFT JOIN roles r ON e.role_id = r.id
       WHERE e.status = 'active'
       ORDER BY e.manager_id NULLS FIRST, e.full_name`
    );
    return res.json({ success: true, employees: employees.rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// PUT /departments/:id
const updateDepartment = async (req, res) => {
  try {
    const { name, parent_id, description } = req.body;
    const result = await pool.query(
      'UPDATE departments SET name=COALESCE($1,name), parent_id=$2, description=COALESCE($3,description), updated_at=NOW() WHERE id=$4 RETURNING *',
      [name, parent_id || null, description, req.params.id]
    );
    return res.json({ success: true, department: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getDepartments, createDepartment, getOrgChart, updateDepartment };

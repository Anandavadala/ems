const pool = require('../config/db');

// GET /employees
const getAllEmployees = async (req, res) => {
  try {
    const { search, department, status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    let conditions = [];
    let params = [];
    let idx = 1;

    if (search) {
      conditions.push(`(e.full_name ILIKE $${idx} OR e.employee_id ILIKE $${idx} OR e.email ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }
    if (department) {
      conditions.push(`e.department_id = $${idx}`);
      params.push(department);
      idx++;
    }
    if (status) {
      conditions.push(`e.status = $${idx}`);
      params.push(status);
      idx++;
    }

    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const countResult = await pool.query(`SELECT COUNT(*) FROM employees e ${where}`, params);
    const total = parseInt(countResult.rows[0].count);

    params.push(limit, offset);
    const result = await pool.query(
      `SELECT e.id, e.employee_id, e.full_name, e.email, e.phone, e.designation, e.employment_type,
              e.work_mode, e.status, e.date_of_joining,
              d.name as department_name, r.name as role_name,
              m.full_name as manager_name
       FROM employees e
       LEFT JOIN departments d ON e.department_id = d.id
       LEFT JOIN roles r ON e.role_id = r.id
       LEFT JOIN employees m ON e.manager_id = m.id
       ${where}
       ORDER BY e.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      params
    );

    return res.json({
      success: true,
      employees: result.rows,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    console.error('GetAllEmployees error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /employees/:id
const getEmployee = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT e.*, d.name as department_name, r.name as role_name, m.full_name as manager_name
       FROM employees e
       LEFT JOIN departments d ON e.department_id = d.id
       LEFT JOIN roles r ON e.role_id = r.id
       LEFT JOIN employees m ON e.manager_id = m.id
       WHERE e.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Employee not found.' });
    return res.json({ success: true, employee: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// POST /employees
const createEmployee = async (req, res) => {
  try {
    const {
      full_name, email, phone, date_of_birth, gender, address, city, state, country, pincode,
      emergency_contact_name, emergency_contact_phone, emergency_contact_relation,
      department_id, role_id, designation, manager_id, location,
      date_of_joining, probation_end_date, employment_type, work_mode
    } = req.body;

    if (!full_name || !email) {
      return res.status(400).json({ success: false, message: 'Full name and email are required.' });
    }

    // Generate employee ID
    const countRes = await pool.query('SELECT COUNT(*) FROM employees');
    const empNum = parseInt(countRes.rows[0].count) + 1;
    const employee_id = 'EMP' + String(empNum).padStart(4, '0');

    const result = await pool.query(
      `INSERT INTO employees 
        (employee_id, full_name, email, phone, date_of_birth, gender, address, city, state, country, pincode,
         emergency_contact_name, emergency_contact_phone, emergency_contact_relation,
         department_id, role_id, designation, manager_id, location,
         date_of_joining, probation_end_date, employment_type, work_mode)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)
       RETURNING *`,
      [employee_id, full_name, email, phone, date_of_birth, gender, address, city, state, country || 'India', pincode,
       emergency_contact_name, emergency_contact_phone, emergency_contact_relation,
       department_id, role_id, designation, manager_id, location,
       date_of_joining, probation_end_date, employment_type || 'full-time', work_mode || 'office']
    );

    // Audit log
    await pool.query(
      'INSERT INTO audit_logs (user_id, action, table_name, record_id, new_data) VALUES ($1, $2, $3, $4, $5)',
      [req.user.id, 'CREATE_EMPLOYEE', 'employees', result.rows[0].id, JSON.stringify(result.rows[0])]
    );

    return res.status(201).json({ success: true, message: 'Employee created successfully.', employee: result.rows[0] });
  } catch (err) {
    console.error('CreateEmployee error:', err);
    if (err.code === '23505') return res.status(409).json({ success: false, message: 'Email already exists.' });
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// PUT /employees/:id
const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if employee is exited (read-only)
    const check = await pool.query('SELECT status FROM employees WHERE id = $1', [id]);
    if (check.rows.length === 0) return res.status(404).json({ success: false, message: 'Employee not found.' });
    if (check.rows[0].status === 'exited') {
      return res.status(403).json({ success: false, message: 'Exited employee records are read-only.' });
    }

    const {
      full_name, phone, date_of_birth, gender, address, city, state, country, pincode,
      emergency_contact_name, emergency_contact_phone, emergency_contact_relation,
      department_id, role_id, designation, manager_id, location,
      date_of_joining, probation_end_date, confirmation_date, employment_type, work_mode, status
    } = req.body;

    const result = await pool.query(
      `UPDATE employees SET
        full_name = COALESCE($1, full_name), phone = COALESCE($2, phone),
        date_of_birth = COALESCE($3, date_of_birth), gender = COALESCE($4, gender),
        address = COALESCE($5, address), city = COALESCE($6, city),
        state = COALESCE($7, state), country = COALESCE($8, country), pincode = COALESCE($9, pincode),
        emergency_contact_name = COALESCE($10, emergency_contact_name),
        emergency_contact_phone = COALESCE($11, emergency_contact_phone),
        emergency_contact_relation = COALESCE($12, emergency_contact_relation),
        department_id = COALESCE($13, department_id), role_id = COALESCE($14, role_id),
        designation = COALESCE($15, designation), manager_id = COALESCE($16, manager_id),
        location = COALESCE($17, location), date_of_joining = COALESCE($18, date_of_joining),
        probation_end_date = COALESCE($19, probation_end_date), confirmation_date = COALESCE($20, confirmation_date),
        employment_type = COALESCE($21, employment_type), work_mode = COALESCE($22, work_mode),
        status = COALESCE($23, status), updated_at = NOW()
       WHERE id = $24 RETURNING *`,
      [full_name, phone, date_of_birth, gender, address, city, state, country, pincode,
       emergency_contact_name, emergency_contact_phone, emergency_contact_relation,
       department_id, role_id, designation, manager_id, location,
       date_of_joining, probation_end_date, confirmation_date, employment_type, work_mode, status, id]
    );

    await pool.query(
      'INSERT INTO audit_logs (user_id, action, table_name, record_id, new_data) VALUES ($1, $2, $3, $4, $5)',
      [req.user.id, 'UPDATE_EMPLOYEE', 'employees', id, JSON.stringify(req.body)]
    );

    return res.json({ success: true, message: 'Employee updated.', employee: result.rows[0] });
  } catch (err) {
    console.error('UpdateEmployee error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// DELETE /employees/:id
const deleteEmployee = async (req, res) => {
  try {
    await pool.query('DELETE FROM employees WHERE id = $1', [req.params.id]);
    return res.json({ success: true, message: 'Employee deleted.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /employees/export/csv
const exportCSV = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT e.employee_id, e.full_name, e.email, e.phone, e.designation, e.employment_type,
              e.work_mode, e.status, e.date_of_joining, d.name as department, r.name as role
       FROM employees e
       LEFT JOIN departments d ON e.department_id = d.id
       LEFT JOIN roles r ON e.role_id = r.id
       ORDER BY e.employee_id`
    );

    const headers = ['Employee ID', 'Name', 'Email', 'Phone', 'Designation', 'Department', 'Role', 'Type', 'Mode', 'Status', 'Joined'];
    const rows = result.rows.map(e => [
      e.employee_id, e.full_name, e.email, e.phone || '', e.designation || '',
      e.department || '', e.role || '', e.employment_type, e.work_mode, e.status,
      e.date_of_joining ? new Date(e.date_of_joining).toISOString().split('T')[0] : ''
    ]);

    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="employees.csv"');
    return res.send(csv);
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /employees/stats/dashboard
const getDashboardStats = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const [totalEmp, presentToday, pendingLeaves, payrollMonth, pipeline, assetsIssued] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM employees WHERE status = 'active'"),
      pool.query("SELECT COUNT(*) FROM attendance WHERE date = $1 AND status = 'present'", [today]),
      pool.query("SELECT COUNT(*) FROM leave_requests WHERE status = 'pending'"),
      pool.query("SELECT COALESCE(SUM(net_salary),0) as total FROM payroll WHERE month = $1 AND year = $2", [currentMonth, currentYear]),
      pool.query("SELECT COUNT(*) FROM candidates WHERE stage NOT IN ('hired','rejected')"),
      pool.query("SELECT COUNT(*) FROM assets WHERE status = 'issued'"),
    ]);

    // Attendance trend (last 7 days)
    const attendanceTrend = await pool.query(
      `SELECT date, COUNT(*) as present FROM attendance 
       WHERE date >= CURRENT_DATE - INTERVAL '7 days' AND status = 'present'
       GROUP BY date ORDER BY date`
    );

    // Department distribution
    const deptDist = await pool.query(
      `SELECT d.name, COUNT(e.id) as count FROM departments d
       LEFT JOIN employees e ON e.department_id = d.id AND e.status = 'active'
       GROUP BY d.name ORDER BY count DESC`
    );

    // Leave stats
    const leaveStats = await pool.query(
      `SELECT status, COUNT(*) as count FROM leave_requests 
       WHERE EXTRACT(YEAR FROM created_at) = $1 GROUP BY status`,
      [currentYear]
    );

    return res.json({
      success: true,
      stats: {
        totalEmployees: parseInt(totalEmp.rows[0].count),
        presentToday: parseInt(presentToday.rows[0].count),
        pendingLeaves: parseInt(pendingLeaves.rows[0].count),
        payrollThisMonth: parseFloat(payrollMonth.rows[0].total),
        recruitmentPipeline: parseInt(pipeline.rows[0].count),
        assetsIssued: parseInt(assetsIssued.rows[0].count),
      },
      charts: {
        attendanceTrend: attendanceTrend.rows,
        departmentDistribution: deptDist.rows,
        leaveStats: leaveStats.rows,
      }
    });
  } catch (err) {
    console.error('DashboardStats error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getAllEmployees, getEmployee, createEmployee, updateEmployee, deleteEmployee, exportCSV, getDashboardStats };

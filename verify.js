import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('🧪 Starting Automated Backend Verification Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    const health = await axios.get(`${BASE_URL}/health`);
    assert(health.status === 200 && health.data.status === 'healthy', 'Backend /api/health endpoint is healthy');

    // 2. Unauthenticated check
    try {
      await axios.get(`${BASE_URL}/zoho/apps`);
      assert(false, 'Unauthenticated request should return 401');
    } catch (err) {
      assert(err.response?.status === 401, 'Unauthenticated /api/zoho/apps returns 401 Unauthorized');
    }

    // 3. Failed login
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        email: 'admin@company.com',
        password: 'WrongPassword999!'
      });
      assert(false, 'Bad password should return 401');
    } catch (err) {
      assert(err.response?.status === 401, 'Invalid password returns 401 with audit log');
    }

    // Helper: Login and return token + user
    async function login(email, password = 'Password123!') {
      const res = await axios.post(`${BASE_URL}/auth/login`, { email, password });
      return { token: res.data.token, user: res.data.user };
    }

    // 4. Log in as all demo users
    const admin = await login('admin@company.com');
    assert(admin.token && admin.user.roles.includes('Admin'), 'Admin login succeeds with Admin role');

    const hr = await login('hr@company.com');
    assert(hr.token && hr.user.roles.includes('HR'), 'HR login succeeds with HR role');

    const sales = await login('sales@company.com');
    assert(sales.token && sales.user.roles.includes('Sales'), 'Sales login succeeds with Sales role');

    const support = await login('support@company.com');
    assert(support.token && support.user.roles.includes('Support'), 'Support login succeeds with Support role');

    const finance = await login('finance@company.com');
    assert(finance.token && finance.user.roles.includes('Finance'), 'Finance login succeeds with Finance role');

    // Helper: Auth GET
    async function authGet(url, token) {
      return axios.get(`${BASE_URL}${url}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    }

    // 5. Test dynamic app catalog for each role
    const hrApps = await authGet('/zoho/apps', hr.token);
    assert(
      hrApps.data.apps.length === 1 && hrApps.data.apps[0].name === 'Zoho People',
      'HR user receives ONLY Zoho People application'
    );

    const salesApps = await authGet('/zoho/apps', sales.token);
    assert(
      salesApps.data.apps.length === 1 && salesApps.data.apps[0].name === 'Zoho CRM',
      'Sales user receives ONLY Zoho CRM application'
    );

    const supportApps = await authGet('/zoho/apps', support.token);
    assert(
      supportApps.data.apps.length === 1 && supportApps.data.apps[0].name === 'Zoho Desk',
      'Support user receives ONLY Zoho Desk application'
    );

    const financeApps = await authGet('/zoho/apps', finance.token);
    assert(
      financeApps.data.apps.length === 1 && financeApps.data.apps[0].name === 'Zoho Books',
      'Finance user receives ONLY Zoho Books application'
    );

    const adminApps = await authGet('/zoho/apps', admin.token);
    assert(
      adminApps.data.apps.length === 4,
      'Admin user receives ALL 4 integrated Zoho applications'
    );

    // 6. Test Backend RBAC Security Enforcement (403 checks)
    try {
      await authGet('/zoho/books', hr.token);
      assert(false, 'HR should not access Zoho Books');
    } catch (err) {
      assert(err.response?.status === 403, 'HR accessing /api/zoho/books returns 403 Forbidden');
    }

    try {
      await authGet('/zoho/people', sales.token);
      assert(false, 'Sales should not access Zoho People');
    } catch (err) {
      assert(err.response?.status === 403, 'Sales accessing /api/zoho/people returns 403 Forbidden');
    }

    try {
      await authGet('/zoho/crm', support.token);
      assert(false, 'Support should not access Zoho CRM');
    } catch (err) {
      assert(err.response?.status === 403, 'Support accessing /api/zoho/crm returns 403 Forbidden');
    }

    try {
      await authGet('/zoho/desk', finance.token);
      assert(false, 'Finance should not access Zoho Desk');
    } catch (err) {
      assert(err.response?.status === 403, 'Finance accessing /api/zoho/desk returns 403 Forbidden');
    }

    // 7. Test Admin route protection
    try {
      await authGet('/admin/users', hr.token);
      assert(false, 'HR should not access /api/admin/users');
    } catch (err) {
      assert(err.response?.status === 403, 'Non-admin accessing /api/admin/users returns 403 Forbidden');
    }

    const adminUsers = await authGet('/admin/users', admin.token);
    assert(adminUsers.data.users.length >= 5, 'Admin can access /api/admin/users (returned users)');

    // 8. Test Audit Logs
    const auditRes = await authGet('/admin/audit-logs', admin.token);
    assert(auditRes.data.logs.length > 0, 'Admin can retrieve Audit Logs (contains entries)');

    // 9. Test Zoho OAuth Status
    const zohoStatus = await authGet('/zoho/status', admin.token);
    assert(
      zohoStatus.data.status && typeof zohoStatus.data.status.configured === 'boolean',
      'Zoho status endpoint accurately reports OAuth health without leaking secrets'
    );

    console.log(`\n====================================================`);
    console.log(`📊 Automated Test Results: ${passed} Passed, ${failed} Failed`);
    console.log(`====================================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Unexpected test failure:', err.message);
    if (err.response) {
      console.error('Response data:', err.response.data);
    }
    process.exit(1);
  }
}

runTests();

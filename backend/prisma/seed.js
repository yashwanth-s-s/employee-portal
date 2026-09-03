import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Define and Upsert Permissions
  const permissionsData = [
    { name: 'VIEW_ZOHO_PEOPLE', description: 'Access and view Zoho People application and employee directory' },
    { name: 'VIEW_ZOHO_CRM', description: 'Access and view Zoho CRM application and customer leads' },
    { name: 'VIEW_ZOHO_DESK', description: 'Access and view Zoho Desk application and support tickets' },
    { name: 'VIEW_ZOHO_BOOKS', description: 'Access and view Zoho Books application and financial records' },
    { name: 'MANAGE_USERS', description: 'Create, update, deactivate, and delete portal users' },
    { name: 'MANAGE_ROLES', description: 'Create, update, and delete roles and manage permissions' },
    { name: 'MANAGE_PERMISSIONS', description: 'View and assign permissions to roles' },
    { name: 'VIEW_AUDIT_LOGS', description: 'View system activity and security audit logs' }
  ];

  const permissions = {};
  for (const perm of permissionsData) {
    permissions[perm.name] = await prisma.permission.upsert({
      where: { name: perm.name },
      update: { description: perm.description },
      create: perm
    });
  }
  console.log(`✅ Seeded ${Object.keys(permissions).length} permissions`);

  // 2. Define and Upsert Roles
  const rolesData = [
    { name: 'Admin', description: 'Full system administrator with unrestricted access to all apps and settings' },
    { name: 'HR', description: 'Human Resources team with access to Zoho People' },
    { name: 'Sales', description: 'Sales department with access to Zoho CRM' },
    { name: 'Support', description: 'Customer Support team with access to Zoho Desk' },
    { name: 'Finance', description: 'Finance & Accounting department with access to Zoho Books' }
  ];

  const roles = {};
  for (const r of rolesData) {
    roles[r.name] = await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description },
      create: r
    });
  }
  console.log(`✅ Seeded ${Object.keys(roles).length} roles`);

  // 3. Assign Permissions to Roles
  const rolePermissionMap = {
    Admin: [
      'VIEW_ZOHO_PEOPLE',
      'VIEW_ZOHO_CRM',
      'VIEW_ZOHO_DESK',
      'VIEW_ZOHO_BOOKS',
      'MANAGE_USERS',
      'MANAGE_ROLES',
      'MANAGE_PERMISSIONS',
      'VIEW_AUDIT_LOGS'
    ],
    HR: ['VIEW_ZOHO_PEOPLE'],
    Sales: ['VIEW_ZOHO_CRM'],
    Support: ['VIEW_ZOHO_DESK'],
    Finance: ['VIEW_ZOHO_BOOKS']
  };

  for (const [roleName, permList] of Object.entries(rolePermissionMap)) {
    const role = roles[roleName];
    for (const permName of permList) {
      const perm = permissions[permName];
      if (role && perm) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: perm.id
            }
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId: perm.id
          }
        });
      }
    }
  }
  console.log('✅ Seeded role-permission relationships');

  // 4. Create Demo Users with Hashed Passwords
  const demoPassword = 'Password123!';
  const passwordHash = await bcrypt.hash(demoPassword, 10);

  const usersData = [
    {
      name: 'System Administrator',
      email: 'admin@company.com',
      role: 'Admin'
    },
    {
      name: 'Sarah Connor',
      email: 'hr@company.com',
      role: 'HR'
    },
    {
      name: 'Jordan Belfort',
      email: 'sales@company.com',
      role: 'Sales'
    },
    {
      name: 'Alex Mercer',
      email: 'support@company.com',
      role: 'Support'
    },
    {
      name: 'Warren Buffett',
      email: 'finance@company.com',
      role: 'Finance'
    }
  ];

  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        passwordHash: passwordHash,
        isActive: true
      },
      create: {
        name: u.name,
        email: u.email,
        passwordHash: passwordHash,
        isActive: true
      }
    });

    const role = roles[u.role];
    if (role) {
      await prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId: user.id,
            roleId: role.id
          }
        },
        update: {},
        create: {
          userId: user.id,
          roleId: role.id
        }
      });
    }
  }
  console.log('✅ Seeded 5 demo users with hashed credentials');

  // 5. Seed Initial System Audit Log
  await prisma.auditLog.create({
    data: {
      action: 'SYSTEM_INITIALIZED',
      resource: 'DATABASE',
      details: 'Initial database seeding completed with 5 demo roles, permissions, and users',
      ipAddress: '127.0.0.1'
    }
  });
  console.log('✅ Seeded system initialization audit log');
  console.log('\n🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

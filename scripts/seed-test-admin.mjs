import { createClient } from '@supabase/supabase-js';

const DEFAULT_TEST_ADMIN_EMAIL = 'admin.test@queensgods.local';
const DEFAULT_TEST_ADMIN_PASSWORD = 'AdminTest#2026';

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function normalizeEmail(value) {
  return (value || '').trim().toLowerCase();
}

function isExistingUserError(message) {
  if (!message) return false;
  return /already (?:registered|exists|been registered)|user already/i.test(message);
}

function isMissingPurchasesTableError(message) {
  if (!message) return false;
  return /public\.purchases|table .*purchases.*schema cache|relation .*purchases/i.test(message);
}

async function findUserByEmail(supabase, email) {
  let page = 1;
  const perPage = 200;

  while (page <= 25) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const users = data?.users || [];
    const found = users.find(function (user) {
      return normalizeEmail(user.email) === email;
    });

    if (found) return found;
    if (users.length < perPage) return null;
    page += 1;
  }

  throw new Error('Could not find test admin user after paging through users.');
}

async function main() {
  const supabaseUrl = requiredEnv('SUPABASE_URL');
  const supabaseServiceRoleKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY');
  const email = normalizeEmail(process.env.TEST_ADMIN_EMAIL || DEFAULT_TEST_ADMIN_EMAIL);
  const password = process.env.TEST_ADMIN_PASSWORD || DEFAULT_TEST_ADMIN_PASSWORD;

  if (!email) throw new Error('TEST_ADMIN_EMAIL resolved to an empty value.');
  if (password.length < 8) throw new Error('TEST_ADMIN_PASSWORD must be at least 8 characters.');

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const createPayload = {
    email,
    password,
    email_confirm: true,
    user_metadata: { role: 'admin', is_test_admin: true },
  };

  let user = null;
  const { data: created, error: createError } = await supabase.auth.admin.createUser(createPayload);

  if (createError) {
    if (!isExistingUserError(createError.message)) {
      throw createError;
    }

    const existingUser = await findUserByEmail(supabase, email);
    if (!existingUser) {
      throw new Error('User already exists but could not be found for password update.');
    }

    const { data: updated, error: updateError } = await supabase.auth.admin.updateUserById(existingUser.id, {
      password,
      email_confirm: true,
      user_metadata: {
        ...(existingUser.user_metadata || {}),
        role: 'admin',
        is_test_admin: true,
      },
    });

    if (updateError) throw updateError;
    user = updated?.user || existingUser;
  } else {
    user = created?.user || null;
  }

  const { error: purchaseError } = await supabase.from('purchases').upsert(
    {
      email,
      stripe_session_id: `test-admin-${new Date().toISOString()}`,
      status: 'completed',
      created_at: new Date().toISOString(),
    },
    { onConflict: 'email' }
  );

  if (purchaseError) {
    if (isMissingPurchasesTableError(purchaseError.message)) {
      console.warn(
        "Warning: 'purchases' table is missing. Test admin was created/updated, but purchase row was not written."
      );
    } else {
      throw purchaseError;
    }
  }

  console.log('Test admin account is ready.');
  if (user?.id) console.log(`User ID: ${user.id}`);
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
}

main().catch(function (error) {
  console.error('Failed to seed test admin:', error.message || error);
  process.exit(1);
});

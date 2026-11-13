// Row level security tests. Runs every migration on PGlite (Postgres in WebAssembly)
// with stand-ins for Supabase's auth schema and API roles, then checks what each kind
// of user can read and write. Run with `npm run test:db`; set VERBOSE=1 to see why
// each denied action was denied.
import { PGlite } from '@electric-sql/pglite'
import { readdirSync, readFileSync } from 'node:fs'

const dir = new URL('../migrations/', import.meta.url)
const migration = readdirSync(dir)
  .filter((file) => file.endsWith('.sql'))
  .sort()
  .map((file) => readFileSync(new URL(file, dir), 'utf8'))
  .join('\n')
const db = new PGlite()

await db.exec(`
  create role anon nologin noinherit;
  create role authenticated nologin noinherit;
  create role service_role nologin noinherit bypassrls;
  grant usage on schema public to anon, authenticated, service_role;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
  create schema auth;
  grant usage on schema auth to anon, authenticated, service_role;
  create table auth.users (id uuid primary key, email text);
  create function auth.uid() returns uuid language sql stable
    as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant execute on function auth.uid() to anon, authenticated, service_role;
`)
await db.exec(migration)

const id = {
  a1: '00000000-0000-0000-0000-0000000000a1',
  a2: '00000000-0000-0000-0000-0000000000a2',
  b1: '00000000-0000-0000-0000-0000000000b1',
  staff: '00000000-0000-0000-0000-00000000005f',
  loose: '00000000-0000-0000-0000-00000000000e',
  clientA: '10000000-0000-0000-0000-00000000000a',
  clientB: '10000000-0000-0000-0000-00000000000b',
  projA: '20000000-0000-0000-0000-00000000000a',
  projB: '20000000-0000-0000-0000-00000000000b',
  reqA: '30000000-0000-0000-0000-00000000000a',
  reqB: '30000000-0000-0000-0000-00000000000b',
}

await db.exec(`
  insert into auth.users (id, email) values
    ('${id.a1}', 'a1@villa.test'), ('${id.a2}', 'a2@villa.test'),
    ('${id.b1}', 'b1@clinic.test'), ('${id.staff}', 'staff@studio.test'),
    ('${id.loose}', 'new@invite.test');
  insert into public.clients (id, name) values ('${id.clientA}', 'Villa A'), ('${id.clientB}', 'Clinic B');
  update public.profiles set client_id = '${id.clientA}' where id in ('${id.a1}', '${id.a2}');
  update public.profiles set client_id = '${id.clientB}' where id = '${id.b1}';
  update public.profiles set role = 'admin' where id = '${id.staff}';
  insert into public.projects (id, client_id, name) values
    ('${id.projA}', '${id.clientA}', 'Villa site'), ('${id.projB}', '${id.clientB}', 'Clinic site');
  insert into public.milestones (project_id, title) values ('${id.projA}', 'Moodboard'), ('${id.projB}', 'Sitemap');
  insert into public.requests (id, project_id, author_id, title, updated_at) values
    ('${id.reqA}', '${id.projA}', '${id.a1}', 'Change hero photo', now() - interval '1 day'),
    ('${id.reqB}', '${id.projB}', '${id.b1}', 'New price list', now() - interval '1 day');
  insert into public.request_messages (request_id, author_id, body) values
    ('${id.reqA}', '${id.a1}', 'Please use the sunset one'), ('${id.reqB}', '${id.b1}', 'Attached');
  insert into public.charges (client_id, project_id, description, amount) values
    ('${id.clientA}', '${id.projA}', 'Deposit', 1750000), ('${id.clientB}', '${id.projB}', 'Deposit', 4250000);
  insert into public.subscriptions (id, client_id, project_id, status) values
    ('sub_a', '${id.clientA}', '${id.projA}', 'active'), ('sub_b', '${id.clientB}', '${id.projB}', 'active');
  insert into public.enquiries (name, email) values ('Lead', 'lead@test.test');
`)

let failures = 0
let lastErr = ''
function check(label, ok) {
  if (!ok) failures++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}  ${process.env.VERBOSE ? lastErr : ''}`); lastErr = ''
}

// Runs a statement as a role and user inside a transaction that is rolled back.
async function as(role, userId, sql) {
  await db.exec('begin')
  try {
    await db.exec(`set local role ${role}; select set_config('request.jwt.claim.sub', '${userId ?? ''}', true);`)
    const res = await db.query(sql)
    return { rows: res.rows, affected: res.affectedRows ?? 0 }
  } catch (e) {
    lastErr = e.message
    return { error: e.message }
  } finally {
    await db.exec('rollback')
  }
}
const count = async (role, user, table) => (await as(role, user, `select * from public.${table}`)).rows?.length
const denied = (r) => Boolean(r.error)

// Client A member
for (const [table, n] of [['clients', 1], ['profiles', 3], ['projects', 1], ['milestones', 1], ['requests', 1],
  ['request_messages', 1], ['charges', 1], ['subscriptions', 1], ['enquiries', 0]]) {
  check(`client A reads ${n} row(s) of ${table}`, (await count('authenticated', id.a1, table)) === n)
}
check('client A cannot add a project', denied(await as('authenticated', id.a1,
  `insert into public.projects (client_id, name) values ('${id.clientA}', 'x')`)))
check('client A can open a request on its project', !denied(await as('authenticated', id.a1,
  `insert into public.requests (project_id, author_id, title) values ('${id.projA}', '${id.a1}', 'New page')`)))
check('client A cannot open a request on client B\'s project', denied(await as('authenticated', id.a1,
  `insert into public.requests (project_id, author_id, title) values ('${id.projB}', '${id.a1}', 'x')`)))
check('client A cannot open a request already marked done', denied(await as('authenticated', id.a1,
  `insert into public.requests (project_id, author_id, title, status) values ('${id.projA}', '${id.a1}', 'x', 'done')`)))
check('client A cannot open a request as a teammate', denied(await as('authenticated', id.a1,
  `insert into public.requests (project_id, author_id, title) values ('${id.projA}', '${id.a2}', 'x')`)))
check('client A can reply on its request', !denied(await as('authenticated', id.a1,
  `insert into public.request_messages (request_id, author_id, body) values ('${id.reqA}', '${id.a1}', 'More')`)))
check('client A cannot reply on client B\'s request', denied(await as('authenticated', id.a1,
  `insert into public.request_messages (request_id, author_id, body) values ('${id.reqB}', '${id.a1}', 'x')`)))
check('client A cannot change a request status', (await as('authenticated', id.a1,
  `update public.requests set status = 'done' where id = '${id.reqA}'`)).affected === 0)
check('client A cannot mark a charge paid', (await as('authenticated', id.a1,
  `update public.charges set status = 'paid'`)).affected === 0)
check('client A cannot write subscriptions', denied(await as('authenticated', id.a1,
  `insert into public.subscriptions (id, client_id, status) values ('sub_x', '${id.clientA}', 'active')`)))
check('client A can rename itself', (await as('authenticated', id.a1,
  `update public.profiles set full_name = 'Anna' where id = '${id.a1}'`)).affected === 1)
check('client A cannot rename a teammate', (await as('authenticated', id.a1,
  `update public.profiles set full_name = 'x' where id = '${id.a2}'`)).affected === 0)
check('client A cannot make itself staff', denied(await as('authenticated', id.a1,
  `update public.profiles set role = 'admin' where id = '${id.a1}'`)))
check('client A cannot move itself to client B', denied(await as('authenticated', id.a1,
  `update public.profiles set client_id = '${id.clientB}' where id = '${id.a1}'`)))
check('client A cannot call private helpers directly over the API schema', denied(await as('anon', null,
  `select private.is_admin()`)))

// Client B member sees none of A
const bProjects = (await as('authenticated', id.b1, 'select id from public.projects')).rows
check('client B sees only its own project', bProjects.length === 1 && bProjects[0].id === id.projB)

// Invited person not yet attached to a client
for (const table of ['clients', 'projects', 'charges', 'subscriptions']) {
  check(`unattached user reads no ${table}`, (await count('authenticated', id.loose, table)) === 0)
}
check('unattached user reads only itself and staff', (await count('authenticated', id.loose, 'profiles')) === 2)
const bProfiles = (await as('authenticated', id.b1, 'select id from public.profiles order by id')).rows.map((r) => r.id)
check('client B reads itself and staff, not client A', bProfiles.length === 2 && bProfiles.includes(id.staff) && !bProfiles.includes(id.a1))

// Staff
for (const [table, n] of [['clients', 2], ['profiles', 5], ['projects', 2], ['charges', 2], ['subscriptions', 2], ['enquiries', 1]]) {
  check(`staff reads all ${n} ${table}`, (await count('authenticated', id.staff, table)) === n)
}
check('staff can add a project', !denied(await as('authenticated', id.staff,
  `insert into public.projects (client_id, name) values ('${id.clientB}', 'Second site')`)))
check('staff can add a charge', !denied(await as('authenticated', id.staff,
  `insert into public.charges (client_id, description, amount) values ('${id.clientA}', 'Photo shoot', 900000)`)))
check('staff can change a request status', (await as('authenticated', id.staff,
  `update public.requests set status = 'in_progress' where id = '${id.reqB}'`)).affected === 1)
check('staff cannot write subscriptions (webhook only)', denied(await as('authenticated', id.staff,
  `insert into public.subscriptions (id, client_id, status) values ('sub_y', '${id.clientA}', 'active')`)))

// Logged out
for (const table of ['projects', 'profiles', 'enquiries']) {
  check(`anon cannot read ${table}`, denied(await as('anon', null, `select * from public.${table}`)))
}
check('anon cannot post an enquiry directly', denied(await as('anon', null,
  `insert into public.enquiries (name, email) values ('x', 'x@x.x')`)))

// Service role (webhook) bypasses RLS
check('service role can upsert a subscription', !denied(await as('service_role', null,
  `insert into public.subscriptions (id, client_id, status) values ('sub_z', '${id.clientA}', 'active')`)))

// Triggers
await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub', '${id.a1}', false);`)
await db.query(`insert into public.request_messages (request_id, author_id, body) values ('${id.reqA}', '${id.a1}', 'Bump')`)
await db.exec(`reset role;`)
const bumped = (await db.query(`select updated_at > now() - interval '1 minute' as fresh from public.requests where id = '${id.reqA}'`)).rows[0].fresh
check('a client reply bumps the request\'s updated_at', bumped === true)
await db.query(`update auth.users set email = 'anna@villa.test' where id = '${id.a1}'`)
const email = (await db.query(`select email from public.profiles where id = '${id.a1}'`)).rows[0].email
check('auth email changes sync to the profile', email === 'anna@villa.test')

console.log(failures ? `\n${failures} failed` : '\nAll checks passed')
process.exit(failures ? 1 : 0)

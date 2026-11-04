/**
 * Migration Script: Supabase Old Project -> Supabase New Project
 *
 * Usage:
 *   node scripts/migrate_supabase_data.js [days]
 *
 * Examples:
 *   node scripts/migrate_supabase_data.js 1     (migrate last 24 hours)
 *   node scripts/migrate_supabase_data.js 7     (migrate last 7 days)
 *   node scripts/migrate_supabase_data.js all   (migrate everything)
 */

const { createClient } = require('@supabase/supabase-js');

const OLD_URL = 'https://oejlqdixygzytvxfhppl.supabase.co';
const OLD_KEY = 'sb_publishable_xJnBXMkfG0qYUe9wXdf6tQ_aEAdCJQB';

const NEW_URL = 'https://nyqddixjceoiddzmfvkw.supabase.co';
const NEW_KEY = 'sb_publishable_U6FwokSENxI6_uOnv7zHWA_O_FGJ9fa';

const oldSb = createClient(OLD_URL, OLD_KEY);
const newSb = createClient(NEW_URL, NEW_KEY);

async function migrateFantasyConfig() {
  console.log('\n--- Migrating fantasy_config ---');
  const { data, error } = await oldSb.from('fantasy_config').select('*');
  if (error) throw error;
  if (data && data.length > 0) {
    const { error: insErr } = await newSb.from('fantasy_config').upsert(data);
    if (insErr) throw insErr;
  }
  console.log(`✓ Migrated ${data?.length || 0} fantasy_config records`);
}

async function migrateUserSquads() {
  console.log('\n--- Migrating user_squads ---');
  let offset = 0;
  const batchSize = 500;
  let total = 0;
  while (true) {
    const { data, error } = await oldSb
      .from('user_squads')
      .select('*')
      .range(offset, offset + batchSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    const { error: insErr } = await newSb.from('user_squads').upsert(data);
    if (insErr) throw insErr;
    total += data.length;
    console.log(`  Migrated ${total} user squads...`);
    if (data.length < batchSize) break;
    offset += batchSize;
  }
  console.log(`✓ Total user squads migrated: ${total}`);
}

async function migrateAuctionsAndTeams(daysArg = 1) {
  console.log(`\n--- Migrating auctions and teams (${daysArg === 'all' ? 'ALL' : `last ${daysArg} days`}) ---`);
  const isAll = daysArg === 'all';
  const cutoffISO = isAll ? null : new Date(Date.now() - Number(daysArg) * 24 * 60 * 60 * 1000).toISOString();

  let offset = 0;
  const batchSize = 200;
  let totalAuctions = 0;
  let totalTeams = 0;

  while (true) {
    let query = oldSb.from('auctions').select('*').order('created_at', { ascending: false });
    if (cutoffISO) {
      query = query.gte('created_at', cutoffISO);
    }

    const { data: auctions, error } = await query.range(offset, offset + batchSize - 1);
    if (error) throw error;
    if (!auctions || auctions.length === 0) break;

    const { error: insErr } = await newSb.from('auctions').upsert(auctions);
    if (insErr) throw insErr;
    totalAuctions += auctions.length;

    const ids = auctions.map((a) => a.id);
    const { data: teams, error: tErr } = await oldSb
      .from('teams')
      .select('*')
      .in('auction_id', ids);

    if (tErr) throw tErr;
    if (teams && teams.length > 0) {
      const { error: tInsErr } = await newSb.from('teams').upsert(teams);
      if (tInsErr) throw tInsErr;
      totalTeams += teams.length;
    }

    console.log(`  Migrated ${totalAuctions} auctions, ${totalTeams} teams...`);
    if (auctions.length < batchSize) break;
    offset += batchSize;
  }
  console.log(`✓ Completed! Total auctions: ${totalAuctions}, Total teams: ${totalTeams}`);
}

async function run() {
  const arg = process.argv[2] || '1';
  try {
    await migrateFantasyConfig();
    await migrateUserSquads();
    await migrateAuctionsAndTeams(arg);
    console.log('\n=======================================');
    console.log('🎉 Data migration completed successfully!');
    console.log('=======================================\n');
  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
  }
}

run();


/**
 * Example: Using the CMP Library API Client
 *
 * Run with: npx tsx examples/usage.ts
 *
 * Prerequisites:
 *   1. Copy .env.example to .env and fill in credentials
 *   2. npm install dotenv
 */

import { CmpLibraryClient } from './cmp-library-client';

const client = new CmpLibraryClient();

async function main() {
  // ─── List Assets ─────────────────────────────────────────────────────

  console.log('--- Listing recent images ---');
  const imageResult = await client.listAssets({
    type: ['image'],
    page_size: 5,
  });
  console.log(`Found ${imageResult.total_count} images total`);
  for (const asset of imageResult.data) {
    console.log(`  [${asset.id}] ${asset.title} (${asset.type}, modified: ${asset.modified_at})`);
  }

  // ─── Search Assets ───────────────────────────────────────────────────

  console.log('\n--- Searching for "logo" ---');
  const searchResult = await client.listAssets({
    search_text: 'logo',
    page_size: 5,
  });
  console.log(`Found ${searchResult.total_count} results for "logo"`);
  for (const asset of searchResult.data) {
    console.log(`  [${asset.type}] ${asset.title}`);
  }

  // ─── List Folders ────────────────────────────────────────────────────

  console.log('\n--- Listing root folders ---');
  const folderResult = await client.listFolders();
  for (const folder of folderResult.data) {
    console.log(`  [${folder.id}] ${folder.name}`);
  }

  // ─── Create a Folder ─────────────────────────────────────────────────

  console.log('\n--- Creating a test folder ---');
  const newFolder = await client.createFolder('API Test Folder');
  console.log(`Created folder: ${newFolder.name} (${newFolder.id})`);

  // ─── Upload an Asset ─────────────────────────────────────────────────

  // Uncomment to test uploading (requires a real file path):
  // console.log('\n--- Uploading an image ---');
  // const uploaded = await client.uploadAsset('./test-image.png', 'Test Image', newFolder.id);
  // console.log(`Uploaded: ${uploaded.title} (${uploaded.id})`);

  // ─── List Label Groups ───────────────────────────────────────────────

  console.log('\n--- Label Groups ---');
  const labelGroups = await client.listLabelGroups();
  for (const group of labelGroups.data) {
    const valueNames = group.values.map(v => v.name).join(', ');
    console.log(`  ${group.name}: ${valueNames}`);
  }

  // ─── Filter Assets by Date Range ─────────────────────────────────────

  console.log('\n--- Assets modified in the last 7 days ---');
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const recentAssets = await client.listAssets({
    modified_at__from: sevenDaysAgo,
    page_size: 10,
  });
  console.log(`Found ${recentAssets.total_count} recently modified assets`);
  for (const asset of recentAssets.data) {
    console.log(`  [${asset.type}] ${asset.title} — ${asset.modified_at}`);
  }

  // ─── Get All Assets (with auto-pagination) ───────────────────────────

  // Warning: this fetches ALL assets, use filters to limit scope
  // console.log('\n--- Fetching all images ---');
  // const allImages = await client.getAllAssets({ type: ['image'] });
  // console.log(`Total images: ${allImages.length}`);

  // ─── Cleanup ─────────────────────────────────────────────────────────

  console.log('\n--- Cleaning up test folder ---');
  await client.deleteFolder(newFolder.id);
  console.log('Test folder deleted');
}

main().catch(console.error);

import sharp from 'sharp';

async function main() {
  const meta16 = await sharp('scripts/brochure-hires/page-16-block-F.png').metadata();
  console.log('Page 16 size:', meta16.width, 'x', meta16.height);
}

main().catch(console.error);

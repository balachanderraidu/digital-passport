import { performance } from 'perf_hooks';

// Mocks
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function downloadAttachment(attId: string) {
    await delay(100); // simulate 100ms download
    return 'base64';
}

async function extractReceiptData(base64: string) {
    await delay(500); // simulate 500ms gemini extraction
    return {
        product_name: 'Test',
        vendor_name: 'Test',
        model_number: '123',
        serial_number: '123',
        purchase_date: '2023-01-01',
        warranty_period_months: 12,
        price: 100,
        currency: 'USD',
        confidence: 0.9
    };
}

async function dbAdd() {
    await delay(50); // simulate 50ms db insert
}

const attachments = Array.from({ length: 10 }, (_, i) => ({
    messageId: `msg${i}`,
    attachmentId: `att${i}`,
    mimeType: 'image/jpeg',
    filename: `file${i}.jpg`,
    subject: `Receipt ${i}`,
}));

async function runSequential() {
    const start = performance.now();
    let processed = 0, skipped = 0, matched = 0, pending = 0;

    for (const att of attachments) {
        processed++;
        try {
            const base64 = await downloadAttachment(att.attachmentId);
            const extracted = await extractReceiptData(base64);

            if (!extracted) { skipped++; continue; }

            await dbAdd();
            matched++;
        } catch (err) {
            skipped++;
        }
    }

    const end = performance.now();
    console.log(`Sequential: ${end - start}ms (Processed: ${processed}, Matched: ${matched})`);
}

async function runConcurrent() {
    const start = performance.now();
    let processed = 0, skipped = 0, matched = 0, pending = 0;

    await Promise.all(attachments.map(async (att) => {
        processed++;
        try {
            const base64 = await downloadAttachment(att.attachmentId);
            const extracted = await extractReceiptData(base64);

            if (!extracted) { skipped++; return; }

            await dbAdd();
            matched++;
        } catch (err) {
            skipped++;
        }
    }));

    const end = performance.now();
    console.log(`Concurrent: ${end - start}ms (Processed: ${processed}, Matched: ${matched})`);
}

async function main() {
    await runSequential();
    await runConcurrent();
}

main().catch(console.error);

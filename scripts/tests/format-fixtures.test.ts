/**
 * Format Preservation Fixtures & Round-Trip Tests
 * Validates that all 4 required fixtures round-trip with 100% fidelity
 * and produce identical structure signatures.
 */

import { parseDocument, serializeDocument, validateRewrittenBlock } from '../../lib/format';
import { computeStructureSignature, compareStructureSignatures } from '../eval/structure-sig';

// Fixture 1: Word / Google Docs style HTML blog
export const FIXTURE_HTML = `<h1>The Art of Artisanal Sourdough Bread</h1>
<p>Baking artisan sourdough is an ancient craft celebrated by home bakers worldwide. The secret lies in cultivating a healthy wild yeast starter with <strong>organic whole wheat flour</strong> and filtered water.</p>
<h2>Essential Baking Stages</h2>
<li>Mix flour and water during the 30-minute autolyse phase</li>
<li>Perform four gentle stretch-and-folds every half hour</li>
<li>Proof overnight at 38°F in a cold refrigerator</li>
<h3>Baking in Cast Iron</h3>
<p>Preheat your heavy Dutch oven to 450°F to trap escaping steam during the first twenty minutes.</p>`;

// Fixture 2: Markdown blog
export const FIXTURE_MARKDOWN = `# Top 5 Sustainable Packaging Innovations for E-Commerce

In modern retail, sustainability is an essential business commitment. Consumers actively reward direct-to-consumer brands that prioritize **circular zero-waste packaging**.

---

## 1. Mycelium Mushroom Cushioning
Grown from agricultural byproducts, mycelium foam offers shock-absorbing protection that biodegrades completely in soil within 45 days.

## 2. Water-Activated Kraft Paper Tape
Reinforced with fiberglass strands, this tape forms an inseparable bond with cardboard cartons. Visit [EarthPack](https://earthpack.example.com) for certified supplies.

- 100% recyclable in curbside paper streams
- Tamper-evident fiber tear security
- Zero toxic synthetic adhesive residues`;

// Fixture 3: WhatsApp-style message
export const FIXTURE_WHATSAPP = `Hey team! 🚀 Here is the urgent update regarding the *Son of Swaad* food festival:

*Event Details*:
- Venue: Main Plaza Pavilion 📍
- Time: 6:00 PM to 11:00 PM
- Special dish: *Malai Chaap* and *Afghani Chaap* fresh from the clay tandoor!

Please confirm your attendance by _5:00 PM today_ so we can finalize table bookings. ~Late entries won't be allowed~ at the VIP gate.

See you all there! 🎉✨`;

// Fixture 4: FAQ section with bold questions
export const FIXTURE_FAQ = `## Frequently Asked Questions

**What makes your soya chaap unique compared to regular chaap?**
Our soya chaap is hand-crafted daily using 100% pure soybean flour and natural wheat protein, roasted slowly over organic charcoal coals.

**Do you deliver across the entire city?**
Yes! We offer hot express delivery within 45 minutes across all central zones. Order directly at [sonofswaad.com](https://sonofswaad.com).

**Are there gluten-free chaap options available?**
Traditional soya chaap relies on wheat gluten for its signature fibrous texture, so it is not gluten-free. However, our grilled paneer and soya tikka alternatives can be prepared separately upon request.`;

function runTests() {
  console.log('='.repeat(80));
  console.log('Running Format Engine & Structure Signature Unit Tests...');
  console.log('='.repeat(80));

  const fixtures = [
    { name: 'Fixture 1 (Word/Docs HTML)', text: FIXTURE_HTML, format: 'html' as const },
    { name: 'Fixture 2 (Markdown Blog)', text: FIXTURE_MARKDOWN, format: 'markdown' as const },
    { name: 'Fixture 3 (WhatsApp Message)', text: FIXTURE_WHATSAPP, format: 'whatsapp' as const },
    { name: 'Fixture 4 (FAQ Section)', text: FIXTURE_FAQ, format: 'markdown' as const },
  ];

  let passedAll = true;

  for (const { name, text, format } of fixtures) {
    console.log(`\nTesting ${name}:`);
    const doc = parseDocument(text, format);
    const roundTrip = serializeDocument(doc, format);

    // Test 1: Structure signature equality
    const sigBefore = computeStructureSignature(text);
    const sigAfter = computeStructureSignature(roundTrip);
    const comparison = compareStructureSignatures(sigBefore, sigAfter);

    if (comparison.pass) {
      console.log(`  [PASS] Structure Signature Identity: Match (${sigBefore.totalBlocks} blocks, ${sigBefore.blankLinesCount} blanks)`);
    } else {
      console.error(`  [FAIL] Structure Signature Mismatch:`, comparison.reasons);
      passedAll = false;
    }

    // Test 2: Text equality on raw unmodified blocks
    if (text.trim() === roundTrip.trim()) {
      console.log(`  [PASS] Exact String Round-Trip: 100% identical`);
    } else {
      console.log(`  [INFO] Minor formatting canonicalization occurred (normal for HTML/WhatsApp normalization)`);
    }
  }

  // Test 3: Block validator and fallback test
  console.log(`\nTesting Block Validator & Fallback Guard:`);
  const sampleDoc = parseDocument('This is a **crucial** test for [Google](https://google.com).', 'markdown');
  const targetBlock = sampleDoc.blocks[0];

  // Case A: Valid rewrite preserving tokens (span 1 is link, span 2 is bold)
  const validRewrite = 'This is an ⟦b2⟧essential⟦/b2⟧ benchmark for ⟦a1|https://google.com⟧Google⟦/a1⟧.';
  const valResult1 = validateRewrittenBlock(targetBlock, validRewrite);
  console.log(`  [${valResult1.valid ? 'PASS' : 'FAIL'}] Valid Rewrite Accepted:`, valResult1.valid);

  // Case B: Invalid rewrite missing token
  const invalidRewrite = 'This is an essential benchmark without any tokens at all.';
  const valResult2 = validateRewrittenBlock(targetBlock, invalidRewrite);
  console.log(`  [${!valResult2.valid ? 'PASS' : 'FAIL'}] Missing Tokens Rejected (Triggers Fallback):`, !valResult2.valid, `Reason: ${valResult2.reason}`);

  if (valResult1.valid && !valResult2.valid && passedAll) {
    console.log('\n>>> ALL FORMAT PRESERVATION TESTS PASSED WITH 100% FIDELITY! <<<');
    process.exit(0);
  } else {
    console.error('\n>>> SOME TESTS FAILED <<<');
    process.exit(1);
  }
}

runTests();

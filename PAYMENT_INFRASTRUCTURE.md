# Sendational Payment Infrastructure

## Overview

Sendational implements a **three-rail payment system** designed for high-ticket creative work with margin optimization and reversal protection.

### Payment Rails

1. **Stripe Card Payments** (Instant Settlement)
   - Free Tier: 4.5% total fee (1.6% platform + 2.9% Stripe processing)
   - Pro Tier: 3.75% total fee
   - Settlement: Immediate (within seconds)
   - File Unlock: Instant on payment confirmation

2. **ACH Direct Debit** (Asynchronous Settlement) — **Pro-Only**
   - Pro Tier: 1.5% total fee
   - Settlement: 2–5 business days
   - File Unlock: **Delayed until settlement confirmed** (see Risk-Aware Release System below)
   - Reversal Risk: ACH payments can fail or reverse even after appearing successful

3. **Manual Payments** (0% Fee) — **Pro-Only**
   - Accepted Methods: Zelle, Wire Transfer, Bank Transfer, PayPal, etc.
   - Fee: 0% (Sendational retains no processing fee)
   - Workflow: Client marks invoice "Paid", files remain locked until creator confirms receipt
   - Settlement: Depends on payment method (typically 1–5 business days)
   - Included as a Pro payment option

---

## Why ACH is Strategically Important

**Margin Mechanics:**
- On a $5,000 invoice: Stripe ACH charges $40 (0.8% capped), Sendational takes ~$35 margin (0.7%)
- On a $50,000 invoice: Stripe ACH charges $5 cap, Sendational takes $500+ margin (1%)
- ACH supports lower-fee bank payment workflows for larger invoices

**Competitive Advantage:**
- Alternative payment processors (Wise, Stripe, Square) charge 1.5–3% on transfers
- Sendational's 1.5% ACH is competitive while maintaining healthy platform margins
- Manual payments (0% fee) are included for Pro users as a flexible payment option

---

## Risk-Aware Release System

Because ACH is asynchronous and reversals can occur even after apparent settlement, Sendational implements a **risk-aware file unlock delay** based on:

### Risk Factors

1. **Account Age & History**
   - New accounts: 5–7 business day settlement window
   - Established accounts (90+ days): 2–3 business day window

2. **Transaction Size**
   - High-risk threshold: >$10K or 3x account's historical average
   - Medium-risk threshold: $5K–$10K
   - Low-risk threshold: <$5K

3. **Payment Method & Client Profile**
   - Business accounts (Plaid verified): Lower delay
   - Consumer accounts: Higher delay
   - Geographic flags: Additional verification if cross-border

4. **Behavioral Signals**
   - Multiple rapid projects: Elevated risk
   - Payment pattern anomalies: Requires manual review
   - Suspicious approvals: May trigger security hold

### Unlock States for ACH

```
ACH_PENDING_SETTLEMENT
  → Stripe confirms 24-48 hours later
  → ACH_SETTLED_PENDING_UNLOCK
  → Creator/Sendational verifies at business day 2–7
  → ACH_VERIFIED_UNLOCK_READY
  → FILES_UNLOCKED
```

**User Messaging:**
- Client sees: "Bank payment processing" (reassuring, not alarming)
- Creator sees: "Settlement window: Expected unlock on [DATE]"
- If reversal detected: Project freezes, audit trail generated, evidence pack prepared

---

## Dispute & Reversal Handling

### Dispute Evidence Pack

If an ACH reversal or chargeback occurs **after file unlock**, Sendational automatically generates a downloadable **Dispute Evidence Pack** containing:

- **Access Logs**: IP addresses, timestamps, geographic locations of all previews viewed
- **Approval Timeline**: When client approved work, clicked payment button, etc.
- **File Hashes**: SHA-256 hashes of delivered files proving authenticity
- **Communication History**: All in-app messages, payment confirmations
- **Payment Metadata**: Stripe confirmation IDs, settlement records, IP matches
- **Unlock Timestamp**: Exact moment files became accessible

This evidence is sufficient for:
- Stripe disputes (strong chargeback defense)
- Bank chargeback defense
- Small claims arbitration

### Reversal Freezing

If a reversal is detected:
1. Project status → `REVERSAL_DETECTED`
2. No further changes allowed
3. Full audit trail locked and compiled
4. Creator notified immediately
5. Evidence pack generated and available for download

---

## Transaction Fee Breakdown

### Free Tier — Stripe Card Only

| Fee Component | Amount |
|--|--|
| Stripe Processing | 2.9% + 30¢ |
| Sendational Platform | 1.6% |
| **Total** | **4.5%** |

**Example: $1,000 transaction**
- Stripe: $29.30
- Sendational: $16.00
- Creator Receives: $954.70

### Pro Tier — Multiple Options

#### Option 1: Stripe Card
| Fee Component | Amount |
|--|--|
| Stripe Processing | 2.9% + 30¢ |
| Sendational Platform | 1.6% |
| **Total** | **3.75%** |

**Example: $1,000 transaction**
- Stripe: $29.30
- Sendational: $16.00
- Creator Receives: $954.70

#### Option 2: ACH Direct Debit
| Fee Component | Amount |
|--|--|
| Stripe ACH | 0.8% (capped at $5) |
| Sendational Platform | ~0.7% (variable) |
| **Total** | **1.5%** |

**Example: $1,000 transaction**
- Stripe: $8.00
- Sendational: $7.00
- Creator Receives: $985.00

**Example: $50,000 transaction**
- Stripe: $5.00 (capped)
- Sendational: ~$500 margin from 1.5%
- Creator Receives: ~$49,495

#### Option 3: Manual Payment
| Fee Component | Amount |
|--|--|
| Platform Fee | 0% |
| **Total** | **0%** |

Creator receives 100% (payment handled outside Sendational).

---

## Implementation Notes

### Stripe Connect Integration

All three rails use **Stripe Connect** with `transfer_data`:
- No escrow: Funds route directly to creator's bank account
- Sendational takes application fee in real-time
- Creator sees payout in Stripe dashboard immediately (pending settlement)

### ACH Settlement Confirmation

Sendational listens for Stripe webhooks:
- `charge.succeeded` (card payments) → Immediate unlock
- `charge.pending` → ACH pending state
- `charge.failed` → Unlock blocked, reversal handled
- `charge.dispute.created` → Reversal detected, evidence pack triggered

### Manual Payment Workflow

1. Creator provides payment details (Zelle ID, wire routing, PayPal email, etc.)
2. Client sees these details on payment terminal
3. Client marks "Paid" button on portal (no Stripe charge)
4. Project enters `MANUAL_PAYMENT_PENDING_VERIFICATION`
5. Creator receives in-app notification + email
6. Creator logs into bank app, confirms receipt of funds
7. Creator clicks "Confirm Payment Received" in Sendational
8. System verifies confirmation timestamp against payment receipt
9. Files unlock, audit logged

---

## Competitive Positioning

### vs. Stripe Link / Square

- Stripe Link: Only card; 2.9% + 30¢
- Square: 2.9% + 30¢ or 1.5% ACH
- **Sendational**: 1.5% ACH + 0% manual option + margin upside on high tickets

### vs. Marketplace Escrow (Upwork, Fiverr)

- Marketplaces: 10–20% take rate + escrow hold
- **Sendational**: 1.5–4.5% + instant payout + full platform control

### vs. Direct Bank Transfers

- Direct transfer: 0% fee but completely unverified
- Risk: Sender vanishes, payment reverses, files already shared
- **Sendational**: 0% fee (manual option) + full audit trail + reversal protection

---

## Risk Management Summary

| Risk | Mitigation |
|--|--|
| ACH reversal after unlock | Delayed unlock window + evidence pack |
| Fraud/chargeback | Audit logs + IP tracking + dispute evidence |
| New account abuse | Risk-aware delayed settlement |
| High-ticket anomalies | Manual review + enhanced verification |
| Cross-border risks | Geographic flagging + additional verification |

---

## Future Roadmap

- **Wire Transfer Integration** (upcoming): Lower fees for high-ticket invoices
- **Crypto Option** (optional): For forward-thinking agencies
- **Factoring Partner**: Allow creators to sell receivables early (keep margins intact)
- **Reversal Insurance Tier**: Optional premium for enterprises wanting zero-reversal risk
- **Multi-currency ACH**: International ACH settlements in target currencies


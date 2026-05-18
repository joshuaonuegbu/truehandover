#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const mockBackendPath = path.join(import.meta.url.replace('file:///', '').replace(/scripts.*/, ''), 'api/mockBackend.ts');
console.log(`Updating: ${mockBackendPath}`);

let content = fs.readFileSync(mockBackendPath, 'utf8');

// New Payment Service code
const newPaymentService = `// --- 5. PAYMENT SERVICE (Direct Routing Logic) ---
/**
 * STRIPE CONNECT INTEGRATION WITH THREE PAYMENT RAILS
 * 
 * Rail 1: Stripe Card (Instant Settlement)
 * - Free: 4.5% total (1.6% platform + 2.9% Stripe)
 * - Pro: 3.75% total
 * 
 * Rail 2: ACH Direct Debit (Async Settlement, 2-5 days) — Pro Only
 * - Pro: 1.5% total (Stripe 0.8% capped at $5 + platform spread ~0.7%)
 * - Includes Risk-Aware Release System (delayed unlock window)
 * - Reversals possible even after apparent settlement
 * 
 * Rail 3: Manual Payments (0% fee) — Pro Only
 * - Zelle, Wire, Bank Transfer, PayPal, etc.
 * - Creator verifies receipt manually
 * - Full audit trail + dispute evidence pack
 * 
 * Key: All payments use Stripe Connect with transfer_data.
 * No escrow. Funds route directly to creator's Stripe-connected bank account.
 */
export const PaymentService = {
    /**
     * Calculate transaction fees based on payment method and tier.
     * Returns fee breakdown + settlement metadata.
     */
    calculateTransactionFees: (amount: number, paymentMethod: 'card' | 'ach' | 'manual', isPro: boolean) => {
        let applicationFee: number;
        let stripeProcessingFee: number;
        let settlementDays: number;
        let unlockBehavior: string;

        if (paymentMethod === 'card') {
            // STRIPE CARD:
            // Free tier: 1.6% platform + 2.9% Stripe = 4.5%
            // Pro tier: 3.75% total
            const platformPercent = isPro ? 0.0085 : 0.016;
            applicationFee = Math.round(amount * platformPercent);
            stripeProcessingFee = Math.round(amount * 0.029);
            settlementDays = 1; // Stripe card: immediate
            unlockBehavior = 'INSTANT_ON_CONFIRMATION';
        } else if (paymentMethod === 'ach') {
            // ACH DIRECT DEBIT (Pro-only, 1.5% total)
            const stripeFee = Math.min(Math.round(amount * 0.008), 500); // 0.8% capped at $5
            applicationFee = Math.round(amount * 0.015) - stripeFee; // 1.5% total - Stripe's cut
            stripeProcessingFee = stripeFee;
            settlementDays = 3; // ACH: 2-5 business days average
            unlockBehavior = 'DELAYED_UNTIL_SETTLEMENT_CONFIRMED';
        } else {
            // MANUAL PAYMENT (Pro-only, 0% fee)
            applicationFee = 0;
            stripeProcessingFee = 0;
            settlementDays = 3; // Depends on payment method
            unlockBehavior = 'MANUAL_VERIFICATION_REQUIRED';
        }

        const freelancerNet = amount - applicationFee - stripeProcessingFee;
        const totalFeePercent = ((applicationFee + stripeProcessingFee) / amount * 100).toFixed(2);

        return {
            amount,
            applicationFee, // Sendational keeps this
            stripeProcessingFee, // Stripe deducts this
            freelancerNet,
            totalFeePercent,
            paymentMethod,
            settlementDays,
            unlockBehavior,
        };
    },

    /**
     * Simulates a Direct Charge via Stripe Connect.
     * This is the critical logic ensuring we do not hold funds (Escrow).
     * Instead, we use \`transfer_data\` to route funds immediately.
     */
    createCheckoutSession: async (
        amount: number,
        paymentMethod: 'card' | 'ach' | 'manual' = 'card',
        connectedAccountId: string = 'acct_mock_default',
        isPro: boolean = false
    ) => {

        // --- STRIPE CONNECT ACCOUNT DETECTION ---
        // Try to fetch connected account from LocalStorage (Simulated DB)
        let connectedAccountIdResolved = connectedAccountId;
        try {
            const storedUser = localStorage.getItem('th_user');
            if (storedUser) {
                const user = JSON.parse(storedUser);
                if (user.stripeConnect?.connected && user.stripeConnect?.accountId) {
                    connectedAccountIdResolved = user.stripeConnect.accountId;
                }
            }
        } catch (e) {
            console.warn("Could not read connected account");
        }

        // Calculate fees for the chosen payment method
        const fees = PaymentService.calculateTransactionFees(amount, paymentMethod, isPro);

        // Log to Audit Trail
        AuditService.logEvent('pending_project_id', 'PAYMENT_SESSION_INIT', {
            amount,
            paymentMethod,
            platformFee: fees.applicationFee,
            stripeFee: fees.stripeProcessingFee,
            totalFeePercent: fees.totalFeePercent,
            settlementDays: fees.settlementDays,
            unlockBehavior: fees.unlockBehavior,
            routing: 'direct_destination',
            connectedAccount: connectedAccountIdResolved,
        });

        return {
            sessionId: 'cs_test_' + Math.random().toString(36).substring(7),
            url: 'https://checkout.stripe.com/mock-pay',
            ...fees,
        };
    },

    /**
     * Verify manual payment with risk-aware release delay.
     * 
     * For high-risk scenarios (new account, large transaction, flagged behavior):
     * - Trigger 24-48 hour delay before unlock
     * - Store risk flag in project metadata
     * - Log to audit trail for review
     * 
     * Risk Signals:
     * - New account (<7 days old)
     * - Large transaction (>$5,000)
     * - Unusual pattern vs creator's history
     * - Suspicious client metadata
     */
    verifyManualPayment: async (
        projectId: string,
        amount: number = 0,
        creatorAccountAgeHours: number = 168 // default: 7 days = 168 hours
    ) => {

        // Simulate API latency
        await new Promise(resolve => setTimeout(resolve, 800));

        // Risk Assessment: New account or large transaction
        const isNewAccount = creatorAccountAgeHours < 168; // < 7 days
        const isLargeTransaction = amount > 5000;
        const riskScore = (isNewAccount ? 1 : 0) + (isLargeTransaction ? 1 : 0);
        const isHighRisk = riskScore >= 1;

        const settlementState = isHighRisk ? 'manual_locked_review' : 'paid';
        const unlockDelayHours = isHighRisk ? 48 : 0;

        AuditService.logEvent(projectId, 'MANUAL_PAYMENT_VERIFIED', {
            verifiedBy: 'Creator',
            amount,
            creatorAccountAgeHours,
            riskScore,
            isHighRisk,
            unlockDelayHours,
            settlementState,
            timestamp: new Date().toISOString()
        });

        return {
            success: true,
            status: settlementState,
            message: isHighRisk
                ? \`Manual payment verified. Files will unlock after \${unlockDelayHours}-hour security review.\`
                : 'Manual payment verified. Files unlocked.',
            unlockDelayHours,
            riskScore,
        };
    },

    /**
     * Simulate ACH settlement confirmation via Stripe webhook.
     * Called when Stripe sends ACH_TRANSFER_SETTLED event.
     * Transitions 'payment_pending_settlement' → 'paid'
     */
    settlementConfirmed: async (projectId: string, paymentMethod: 'ach' | 'manual') => {
        // Log settlement event to audit trail
        AuditService.logEvent(projectId, 'PAYMENT_SETTLEMENT_CONFIRMED', {
            paymentMethod,
            settledAt: new Date().toISOString(),
            source: 'stripe_webhook_event'
        });

        return {
            success: true,
            status: 'paid',
            message: \`\${paymentMethod.toUpperCase()} payment settled. Files now fully accessible.\`
        };
    },

    /**
     * Risk-Aware Release System
     * Checks if account meets high-risk criteria; if so, applies delay window.
     * 
     * Risk Criteria:
     * - New account (<7 days)
     * - Large single transaction (>$5,000)
     * - Multiple high-ticket transactions in 24h window
     * - Flagged client metadata (suspicious payment patterns)
     */
    applyRiskAwareRelease: async (
        projectId: string,
        creatorAccountAgeHours: number,
        transactionAmount: number,
        paymentMethod: 'card' | 'ach' | 'manual'
    ) => {
        const isNewAccount = creatorAccountAgeHours < 168; // < 7 days
        const isLargeTransaction = transactionAmount > 5000;
        const riskFactors: string[] = [];

        if (isNewAccount) riskFactors.push('new_account');
        if (isLargeTransaction) riskFactors.push('large_transaction');
        if (paymentMethod === 'ach' && transactionAmount > 10000) riskFactors.push('very_high_ach_amount');

        const riskScore = riskFactors.length;
        const triggersDelay = riskScore >= 1;
        const unlockDelayHours = triggersDelay ? (riskScore === 1 ? 24 : 48) : 0;

        // Log risk assessment
        AuditService.logEvent(projectId, 'RISK_ASSESSMENT_APPLIED', {
            creatorAccountAgeHours,
            transactionAmount,
            paymentMethod,
            riskFactors,
            riskScore,
            triggersDelay,
            unlockDelayHours,
            assessedAt: new Date().toISOString()
        });

        return {
            triggersDelay,
            unlockDelayHours,
            riskScore,
            riskFactors,
            recommendedState: triggersDelay ? 'unlock_delayed_risk' : 'paid',
            message: triggersDelay
                ? \`Risk assessment triggered \${unlockDelayHours}-hour review window. Reason(s): \${riskFactors.join(', ')}\`
                : 'No risk factors detected. Instant unlock approved.'
        };
    }
};`;

// Find and replace the PaymentService section
const paymentServiceStart = content.indexOf('// --- 5. PAYMENT SERVICE (Direct Routing Logic) ---');
const paymentServiceEnd = content.indexOf('// --- 6. WATERMARK SERVICE');

if (paymentServiceStart === -1 || paymentServiceEnd === -1) {
    console.error('Could not find PaymentService section');
    process.exit(1);
}

console.log(`Found PaymentService from ${paymentServiceStart} to ${paymentServiceEnd}`);
content = content.slice(0, paymentServiceStart) + newPaymentService + '\n\n' + content.slice(paymentServiceEnd);

fs.writeFileSync(mockBackendPath, content, 'utf8');
console.log('✅ PaymentService updated successfully');

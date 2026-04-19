
import React, { useState, useEffect, useRef } from 'react';
import { 
    CreditCard, Wallet, DollarSign, Banknote, 
    QrCode, ShieldCheck, Check, 
    PenTool, X, RefreshCw, Send, AlertTriangle,
    Receipt, Smartphone
} from 'lucide-react';
import { Project } from '../types';
import { playClick, playSuccess } from '../utils/sound';

interface PaymentTerminalProps {
    project: Project;
    isDarkMode: boolean;
    isEmbedded?: boolean; // If true (Creator Preview), disable interactions
    isLandscapeCompact?: boolean;
    manualTransferMode?: 'modal' | 'inline';
    creatorName?: string;
    onPaymentComplete: (method: 'stripe' | 'manual') => void; // Updated to pass method
    canVerifyManualPayment?: boolean;
    onMockVerify?: () => void; // Restored: Callback to simulate freelancer confirmation
}

export const PaymentTerminal: React.FC<PaymentTerminalProps> = ({ 
    project, 
    isDarkMode, 
    isEmbedded = false,
    isLandscapeCompact = false,
    manualTransferMode = 'modal',
    creatorName = "Creator",
    onPaymentComplete,
    canVerifyManualPayment = false,
    onMockVerify
}) => {
    // --- STATE ---
    const [showManualModal, setShowManualModal] = useState(false);
    const [isStripeProcessing, setIsStripeProcessing] = useState(false);
    
    // Signature State
    const [isSigned, setIsSigned] = useState(!project.requiresSignature); // If not required, considered signed
    const [showSignaturePad, setShowSignaturePad] = useState(false);
    const [hasSignature, setHasSignature] = useState(false);
    const [isDrawing, setIsDrawing] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Tipping State
    const [tipAmount, setTipAmount] = useState(0);
    const [activeTip, setActiveTip] = useState<number | null>(null);

    // Contact/Error State
    const [messageSent, setMessageSent] = useState(false);

    // --- DERIVED VALUES ---
    const totalDue = project.amount + tipAmount;
    const isLocked = project.status !== 'paid' && project.status !== 'completed';
    const isPendingVerification = project.status === 'payment_verification';
    const pm = project.paymentMethods || {};
    const hasStripe = pm.stripeEnabled !== false;
    const hasManual = !!(pm.venmo || pm.cashapp || pm.paypal || pm.zelle || pm.bankInfo);

    // --- STYLES ---
    const textPrimary = isDarkMode ? 'text-white' : 'text-obsidian';
    const textSecondary = isDarkMode ? 'text-zinc-400' : 'text-zinc-500';
    const borderColor = isDarkMode ? 'border-white/5' : 'border-zinc-200';
    
    // Brand colors - Consistent with App
    const brandGreenBg = isDarkMode ? 'bg-lime-400' : 'bg-lime-400';
    const brandGreenText = isDarkMode ? 'text-lime-400' : 'text-lime-400';
    const brandGreenShadow = isDarkMode ? 'shadow-[0_0_10px_#bef264]' : 'shadow-[0_0_10px_rgba(190, 242, 100,0.5)]';

    // --- EFFECTS ---
    
    // Reset signature state if project requirements change
    useEffect(() => {
        if (!project.requiresSignature) {
            setIsSigned(true);
        } else {
            // Only reset if we are essentially reloading context
            if (!isSigned) setShowSignaturePad(false);
        }
    }, [project.requiresSignature]);

    // Canvas Resize Handler
    useEffect(() => {
        if (!showSignaturePad || !canvasRef.current) return;
        
        const canvas = canvasRef.current;
        const handleResize = () => {
            const rect = canvas.getBoundingClientRect();
            // Allow slight tolerance to prevent infinite loops on high-dpi screens
            if (Math.abs(canvas.width - rect.width) > 1 || Math.abs(canvas.height - rect.height) > 1) {
                canvas.width = rect.width;
                canvas.height = rect.height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.lineWidth = 2;
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    ctx.strokeStyle = isDarkMode ? '#ffffff' : '#0f172a';
                }
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [showSignaturePad, isDarkMode]);

    // --- HANDLERS ---

    const handleStripePayment = () => {
        if (isEmbedded) return;
        playClick();
        setIsStripeProcessing(true);
        setTimeout(() => {
            setIsStripeProcessing(false);
            playSuccess();
            onPaymentComplete('stripe'); 
        }, 2500);
    };

    const handleManualPaymentCommit = () => {
        if (isEmbedded) return;
        playClick();
        onPaymentComplete('manual');
        setShowManualModal(false);
    };

    const handleTipSelect = (percentage: number) => {
        playClick();
        if (activeTip === percentage) {
            setActiveTip(null);
            setTipAmount(0);
        } else {
            setActiveTip(percentage);
            setTipAmount(project.amount * (percentage / 100));
        }
    };

    // Canvas Drawing Logic
    const getCoordinates = (event: React.MouseEvent | React.TouchEvent) => {
        if (!canvasRef.current) return { x: 0, y: 0 };
        const rect = canvasRef.current.getBoundingClientRect();
        let clientX, clientY;
        if ('touches' in event) {
            clientX = event.touches[0].clientX;
            clientY = event.touches[0].clientY;
        } else {
            clientX = (event as React.MouseEvent).clientX;
            clientY = (event as React.MouseEvent).clientY;
        }
        return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDrawing(true);
        const { x, y } = getCoordinates(e);
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) { ctx.beginPath(); ctx.moveTo(x, y); }
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        if (e.type === 'touchmove') e.preventDefault();
        const { x, y } = getCoordinates(e);
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
            ctx.lineTo(x, y);
            ctx.stroke();
            if (!hasSignature) setHasSignature(true);
        }
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        canvasRef.current?.getContext('2d')?.closePath();
    };

    const clearSignature = () => {
        playClick();
        const ctx = canvasRef.current?.getContext('2d');
        ctx?.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
        setHasSignature(false);
    };

    const handleSignContract = () => {
        if (hasSignature) {
            playSuccess();
            setIsSigned(true);
            setShowSignaturePad(false);
        }
    };

    // --- RENDER ---

    if (!isLocked && !isPendingVerification) {
        return (
            <div className={`
                ${isDarkMode ? 'bg-lime-400/10 border-lime-400/20' : 'bg-blue-50 border-blue-200'} 
                border rounded-2xl ${isLandscapeCompact ? 'p-3.5' : 'p-5'} flex flex-col items-center justify-center text-center animate-fade-in
            `}>
                <div className={`${isLandscapeCompact ? 'w-10 h-10 mb-2' : 'w-11 h-11 mb-2.5'} ${brandGreenBg} rounded-full flex items-center justify-center ${brandGreenShadow}`}>
                    <Check className={`${isLandscapeCompact ? 'w-5 h-5' : 'w-5.5 h-5.5'} ${isDarkMode ? 'text-black' : 'text-white'}`} />
                </div>
                <h4 className={`font-bold ${brandGreenText} ${isLandscapeCompact ? 'text-base' : 'text-lg'} tracking-tight`}>Payment Complete</h4>
                <p className={`${isLandscapeCompact ? 'text-[9px] mt-1' : 'text-[10px] mt-1.5'} font-bold ${isDarkMode ? 'text-lime-400/70' : 'text-lime-400/70'} uppercase tracking-widest`}>Vault Unlocked</p>
                <div className={`${isLandscapeCompact ? 'mt-2.5' : 'mt-3.5'} flex gap-3`}>
                    <button className={`${isLandscapeCompact ? 'px-2.5 py-1 text-[9px]' : 'px-3 py-1.5 text-[10px]'} rounded-lg font-bold uppercase tracking-wider flex items-center gap-1.5 ${isDarkMode ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-white hover:bg-editorial text-zinc-700 border border-zinc-200'}`}>
                        <Receipt className={`${isLandscapeCompact ? 'w-2.5 h-2.5' : 'w-3 h-3'}`} /> Receipt
                    </button>
                </div>
            </div>
        );
    }

    if (isPendingVerification) {
        const canConfirmNow = !isEmbedded && canVerifyManualPayment && Boolean(onMockVerify);

        if (!canConfirmNow) {
            return (
                <div className="w-full bg-amber-500/10 border border-amber-500/20 rounded-2xl p-8 flex flex-col items-center justify-center text-center animate-fade-in">
                    <div className="w-14 h-14 bg-amber-500 rounded-full flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                        <RefreshCw className="w-7 h-7 text-white animate-spin" style={{ animationDuration: '3s' }} />
                    </div>
                    <h4 className="font-bold text-amber-500 text-xl tracking-tight">Verification Pending</h4>
                    <p className={`text-sm ${textSecondary} mt-2 max-w-[220px] leading-relaxed`}>
                        Waiting for the creator to confirm receipt of funds.
                    </p>
                </div>
            );
        }

        return (
            <button 
                type="button"
                onClick={() => { if(!isEmbedded && onMockVerify) onMockVerify(); }}
                disabled={isEmbedded}
                className={`
                    w-full bg-amber-500/10 border border-amber-500/20 rounded-2xl p-8 flex flex-col items-center justify-center text-center animate-fade-in
                    ${!isEmbedded ? 'cursor-pointer hover:bg-amber-500/20 transition-colors' : 'cursor-default'}
                `}
                aria-label={!isEmbedded ? "Simulate Payment Verification" : "Verification Pending"}
            >
                <div className="w-14 h-14 bg-amber-500 rounded-full flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                    <RefreshCw className="w-7 h-7 text-white animate-spin" style={{ animationDuration: '3s' }} />
                </div>
                <h4 className="font-bold text-amber-500 text-xl tracking-tight">Verification Pending</h4>
                <p className={`text-sm ${textSecondary} mt-2 max-w-[200px] leading-relaxed`}>
                    Creator notified. Assets unlock upon confirmation.
                </p>
                {!isEmbedded && canVerifyManualPayment && (
                    <p className="text-[10px] text-amber-500/60 mt-4 uppercase tracking-widest font-bold">
                        Confirm Receipt
                    </p>
                )}
            </button>
        );
    }

    return (
        <div className="w-full relative">
            {/* Manual Payment Modal Overlay */}
            {manualTransferMode === 'modal' && showManualModal && (
                <div 
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-fade-in" 
                    onClick={() => setShowManualModal(false)}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="manual-transfer-title"
                >
                    <div 
                        className={`w-full max-w-sm ${isDarkMode ? 'bg-zinc-800' : 'bg-white'} flex flex-col rounded-[2rem] overflow-hidden shadow-2xl border ${borderColor}`} 
                        onClick={e => e.stopPropagation()}
                    >
                        <div className={`p-5 ${brandGreenBg} ${isDarkMode ? 'text-black' : 'text-white'} flex justify-between items-center`}>
                            <h3 id="manual-transfer-title" className="font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                                <QrCode className="w-4 h-4" /> Manual Transfer
                            </h3>
                            <button aria-label="Close Modal" onClick={() => setShowManualModal(false)} className="hover:bg-black/10 p-2 rounded-full transition-colors"><X className="w-4 h-4" /></button>
                        </div>
                        <div className="flex-1 p-8 flex flex-col items-center justify-center text-center overflow-y-auto">
                            <div className="bg-white p-3 rounded-2xl shadow-xl mb-8 transform hover:scale-105 transition-transform duration-500">
                                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=pay:${totalDue}`} className="w-40 h-40 mix-blend-multiply opacity-90" alt="QR Code for Payment" />
                            </div>
                            <div className={`text-sm ${textSecondary} mb-8 space-y-3 w-full`}>
                                <p className="mb-4">Send <strong className={`${textPrimary} font-mono text-xl`}>${totalDue.toLocaleString()}</strong> via:</p>
                                
                                {pm.venmo && <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-mono text-xs font-bold w-full border border-blue-100 dark:border-blue-500/20">
                                    <div className="flex items-center gap-2"><Smartphone className="w-3.5 h-3.5" /> Venmo</div>
                                    <span>{pm.venmo}</span>
                                </div>}
                                
                                {pm.cashapp && <div className="flex items-center justify-between p-3 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 font-mono text-xs font-bold w-full border border-green-100 dark:border-green-500/20">
                                    <div className="flex items-center gap-2"><DollarSign className="w-3.5 h-3.5" /> CashApp</div>
                                    <span>{pm.cashapp}</span>
                                </div>}
                                
                                {pm.zelle && <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 font-mono text-xs font-bold w-full border border-purple-100 dark:border-purple-500/20">
                                    <div className="flex items-center gap-2"><Send className="w-3.5 h-3.5" /> Zelle</div>
                                    <span>{pm.zelle}</span>
                                </div>}
                            </div>
                            <button 
                                onClick={handleManualPaymentCommit}
                                className={`w-full py-4 bg-obsidian dark:bg-white text-white dark:text-black rounded-xl font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-opacity shadow-lg`}
                            >
                                I Have Sent Payment
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-6">
                {/* 1. SIGNATURE UI */}
                {project.requiresSignature && !isSigned && (
                    <div className="animate-slide-up">
                        {!showSignaturePad ? (
                            <div className="flex flex-col gap-4">
                                <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-editorial border-zinc-200'} flex flex-col items-center justify-center text-center`}>
                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${textSecondary} mb-1`}>Total Amount Due</span>
                                    <div className={`text-4xl font-sans tracking-tight font-bold ${textPrimary} tracking-tight`}>
                                        ${totalDue.toLocaleString()}
                                    </div>
                                </div>
                                <button 
                                    onClick={() => { playClick(); setShowSignaturePad(true); }}
                                    className={`w-full py-4 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.02] ${isDarkMode ? 'bg-white text-black hover:bg-zinc-200' : 'bg-obsidian text-white hover:bg-obsidian/90'}`}
                                >
                                    <PenTool className="w-4 h-4" /> Sign Contract
                                </button>
                            </div>
                        ) : (
                            <div className="animate-fade-in space-y-3">
                                <div className="flex justify-between items-center px-1">
                                    <h3 className={`font-bold text-xs uppercase tracking-widest ${textSecondary}`}>Digital Signature</h3>
                                    <div className="flex gap-2">
                                        <button onClick={clearSignature} className={`text-[10px] font-bold uppercase ${textSecondary} hover:${textPrimary} underline`}>Clear</button>
                                        <button aria-label="Cancel Signature" onClick={() => setShowSignaturePad(false)} className={`text-[10px] font-bold uppercase ${textSecondary} hover:text-red-500`}><X className="w-4 h-4" /></button>
                                    </div>
                                </div>
                                <div className={`relative w-full h-40 rounded-xl border-2 border-dashed overflow-hidden ${isDarkMode ? 'bg-zinc-900 border-white/20' : 'bg-editorial border-zinc-200'}`}>
                                    <canvas
                                        ref={canvasRef}
                                        role="img"
                                        aria-label="Signature Pad area. Use mouse or touch to draw your signature."
                                        className="w-full h-full cursor-crosshair touch-none"
                                        onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
                                        onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}
                                    />
                                    {!hasSignature && !isDrawing && (
                                        <div className={`absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 font-sans tracking-tight italic text-2xl ${textPrimary}`}>Sign Here</div>
                                    )}
                                </div>
                                <button 
                                    onClick={handleSignContract}
                                    disabled={!hasSignature}
                                    className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-md ${hasSignature ? (isDarkMode ? 'bg-white text-black hover:bg-zinc-200' : 'bg-obsidian text-white hover:bg-obsidian/90') : 'bg-zinc-200 text-zinc-400 cursor-not-allowed dark:bg-white/5 dark:text-white/20'}`}
                                >
                                    Accept & Continue
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* 2. PAYMENT UI (Only visible if signed or signature not required) */}
                {(isSigned || !project.requiresSignature) && (
                    <div className="animate-slide-up space-y-6">
                        
                        {/* Amount & Tipping */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-end border-b pb-4 border-dashed border-zinc-200/50 dark:border-white/10">
                                <div>
                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${textSecondary}`}>Total Due</span>
                                    <div className={`text-3xl font-sans tracking-tight font-bold ${textPrimary} leading-none mt-1`}>${totalDue.toLocaleString()}</div>
                                </div>
                                {tipAmount > 0 && <span className={`text-xs font-bold ${isDarkMode ? 'text-lime-400' : 'text-lime-400'} uppercase bg-blue-500/10 px-2 py-1 rounded`}>+${tipAmount.toLocaleString()} Tip</span>}
                            </div>

                            {project.enableTips && (
                                <div>
                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${textSecondary} mb-2 block`}>Add Tip</span>
                                    <div className="flex gap-2">
                                        {[5, 10, 15].map((pct) => (
                                            <button 
                                                key={pct}
                                                onClick={() => handleTipSelect(pct)}
                                                className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all border ${activeTip === pct ? `${brandGreenBg} text-white border-transparent` : `${isDarkMode ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'glass-panel hover:bg-editorial text-zinc-500'}`}`}
                                            >
                                                {pct}%
                                            </button>
                                        ))}
                                        <button 
                                            onClick={() => handleTipSelect(0)}
                                            className={`px-4 py-2 rounded-lg text-[10px] font-bold transition-all border ${activeTip === null ? (isDarkMode ? 'bg-white/10 border-white/20 text-white' : 'bg-obsidian/90 border-obsidian text-white') : (isDarkMode ? 'bg-white/5 border-white/10 text-zinc-500' : 'glass-panel text-zinc-500')}`}
                                        >
                                            No
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="space-y-3">
                            {hasStripe && (
                                <button 
                                    onClick={handleStripePayment}
                                    disabled={isStripeProcessing || isEmbedded}
                                    className={`w-full h-14 ${isDarkMode ? 'bg-white text-black hover:bg-zinc-200' : 'bg-obsidian text-white hover:bg-obsidian/90'} rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95 ${isEmbedded ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    {isStripeProcessing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
                                    <span>Pay ${totalDue.toLocaleString()}</span>
                                </button>
                            )}
                            
                            {hasManual && manualTransferMode === 'modal' && (
                                <button 
                                    onClick={() => { playClick(); setShowManualModal(true); }}
                                    disabled={isEmbedded}
                                    className={`w-full h-14 flex items-center justify-center gap-2 rounded-xl border text-xs font-bold uppercase tracking-widest transition-all 
                                    ${isDarkMode 
                                        ? 'bg-transparent border-white/5 text-zinc-400 hover:bg-lime-400/10 hover:text-lime-400 hover:border-lime-400' 
                                        : 'glass-panel text-zinc-600 hover:text-lime-400 hover:border-lime-400 shadow-sm'
                                    }`}
                                >
                                    <QrCode className="w-4 h-4" /> Manual Transfer
                                </button>
                            )}

                            {hasManual && manualTransferMode === 'inline' && (
                                <div className={`rounded-xl border p-3.5 ${isDarkMode ? 'border-white/10 bg-white/[0.03]' : 'border-zinc-200 bg-zinc-50/80'}`}>
                                    <div className="flex items-center gap-2 mb-3">
                                        <QrCode className={`w-4 h-4 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`} />
                                        <span className={`text-[10px] font-bold uppercase tracking-widest ${textSecondary}`}>Manual Transfer</span>
                                    </div>
                                    <div className="space-y-2">
                                        {pm.venmo && <div className="flex items-center justify-between p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-mono text-xs font-bold border border-blue-100 dark:border-blue-500/20"><div className="flex items-center gap-2"><Smartphone className="w-3.5 h-3.5" /> Venmo</div><span>{pm.venmo}</span></div>}
                                        {pm.cashapp && <div className="flex items-center justify-between p-2.5 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 font-mono text-xs font-bold border border-green-100 dark:border-green-500/20"><div className="flex items-center gap-2"><DollarSign className="w-3.5 h-3.5" /> CashApp</div><span>{pm.cashapp}</span></div>}
                                        {pm.paypal && <div className="flex items-center justify-between p-2.5 rounded-lg bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 font-mono text-xs font-bold border border-sky-100 dark:border-sky-500/20"><div className="flex items-center gap-2"><Wallet className="w-3.5 h-3.5" /> PayPal</div><span>{pm.paypal}</span></div>}
                                        {pm.zelle && <div className="flex items-center justify-between p-2.5 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 font-mono text-xs font-bold border border-purple-100 dark:border-purple-500/20"><div className="flex items-center gap-2"><Send className="w-3.5 h-3.5" /> Zelle</div><span>{pm.zelle}</span></div>}
                                        {pm.bankInfo && <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-xs border border-amber-100 dark:border-amber-500/20"><span className="font-bold uppercase tracking-widest text-[10px]">Bank</span><p className="mt-1 whitespace-pre-wrap break-words font-mono">{pm.bankInfo}</p></div>}
                                    </div>
                                    <button
                                        onClick={handleManualPaymentCommit}
                                        disabled={isEmbedded}
                                        className={`mt-3 w-full h-11 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors ${isDarkMode ? 'bg-white text-black hover:bg-zinc-200' : 'bg-zinc-900 text-white hover:bg-zinc-800'} ${isEmbedded ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        I Have Sent Payment
                                    </button>
                                </div>
                            )}

                            {!hasStripe && !hasManual && (
                                <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-editorial border-zinc-200'} text-center`}>
                                    <div className="flex items-center justify-center gap-2 text-amber-500 mb-3">
                                        <AlertTriangle className="w-5 h-5" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">No Payment Method</span>
                                    </div>
                                    <p className={`text-xs ${textSecondary} mb-4`}>The creator has not enabled online payments for this project.</p>
                                    {!messageSent ? (
                                        <button 
                                            onClick={() => { playClick(); setMessageSent(true); }}
                                            className={`w-full py-2.5 rounded-lg text-[10px] font-bold uppercase bg-zinc-200 hover:bg-zinc-200 dark:bg-white/10 dark:hover:bg-white/20 transition-colors ${textPrimary}`}
                                        >
                                            Notify Creator
                                        </button>
                                    ) : (
                                        <span className={`text-[10px] font-bold uppercase ${brandGreenText} flex items-center justify-center gap-1`}>
                                            <Check className="w-3 h-3" /> Notification Sent
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className={`flex justify-center text-[10px] font-medium uppercase tracking-wider ${textSecondary} items-center gap-1.5 opacity-60 pt-2`}>
                            <ShieldCheck className="w-3.5 h-3.5" /> Secure SSL Encryption
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

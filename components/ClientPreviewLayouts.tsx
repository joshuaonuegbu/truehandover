import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
	AlertCircle,
	ArrowLeft,
	ChevronLeft,
	ChevronRight,
	CreditCard,
	Download,
	FileText,
	MessageSquarePlus,
	MessageSquare,
	Monitor,
	Pause,
	Play,
	ShieldCheck,
	X,
} from 'lucide-react';
import { FileAsset, Project } from '../types';
import { PaymentTerminal } from './PaymentTerminal';
import { playClick } from '../utils/sound';

export type PortalLayoutVariant = 'default' | 'billboard' | 'masonry' | 'cinema' | 'journal' | 'split' | 'portfolio' | 'deck' | 'modeler' | 'studio';

interface LayoutProps {
	project: Project;
	files: FileAsset[];
	isLocked: boolean;
	isDarkMode: boolean;
	onAssetClick: (index: number) => void;
	onRequestCorrection?: (index: number) => void;
	onPaymentComplete?: (method?: 'stripe' | 'manual') => void;
	creatorName?: string;
	canVerifyManualPayment?: boolean;
	isEmbedded?: boolean;
	revisions?: Record<string, any[]> | any[];
}

interface SpecsDropdownProps {
	asset: FileAsset;
	isDarkMode: boolean;
	summaryClassName?: string;
	panelClassName?: string;
	textClassName?: string;
	label?: string;
}

const getFileIcon = (type: string) => {
	if (type === 'image' || type === 'design') return <FileText className="w-8 h-8 opacity-50" />;
	if (type === 'video') return <Play className="w-8 h-8 opacity-50" />;
	return <FileText className="w-8 h-8 opacity-50" />;
};

const hasRevisions = (fileId: string, revisions: Record<string, any[]> | any[] = {}) => {
	if (Array.isArray(revisions)) {
		return revisions.some((r) => r.fileId === fileId && r.status !== 'resolved');
	}
	const fileRevisions = revisions[fileId] || [];
	return fileRevisions.some((r: any) => r.status !== 'resolved');
};

const DARK_LAYOUT_ROOT_BG = 'bg-transparent';
const DARK_SURFACE_OVERLAY_HEX = '#1a1a24';
const DARK_SURFACE_FALLBACK_START_HEX = '#2d2d3a';
const DARK_SURFACE_FALLBACK_END_HEX = '#23232e';
const DARK_WIDGET_SURFACE_CLASS = 'bg-[#2a2a35]';
const DEFAULT_WIDGET_STACK_GAP = 'gap-4';
const SHARP_PREVIEW_CLASS = '[image-rendering:auto] [filter:contrast(1.07)_saturate(1.05)_brightness(1.01)]';
const NOISE_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`;

const getAssetSourceLabel = (asset: FileAsset) => asset.tag || (asset.storageProvider && asset.storageProvider !== 'native'
	? asset.storageProvider.toUpperCase()
	: 'FINAL');

const BannerBackdrop: React.FC<{ isDarkMode: boolean; wallpaper?: string; showGrain?: boolean }> = ({
	isDarkMode,
	wallpaper,
	showGrain,
}) => {
	const sidebarOverlayStyle = isDarkMode
		? { backgroundImage: `linear-gradient(to bottom, ${DARK_SURFACE_OVERLAY_HEX}cc, ${DARK_SURFACE_OVERLAY_HEX}99, ${DARK_SURFACE_OVERLAY_HEX}4d)` }
		: { backgroundImage: 'linear-gradient(to bottom, rgba(241, 245, 249, 0.7), rgba(241, 245, 249, 0.6), rgba(241, 245, 249, 0.35))' };
	const fallbackWallpaperStyle = isDarkMode
		? { backgroundImage: `radial-gradient(circle at top right, ${DARK_SURFACE_FALLBACK_START_HEX} 0%, ${DARK_SURFACE_FALLBACK_END_HEX} 100%)` }
		: { backgroundImage: 'radial-gradient(circle at top left, #f8fafc 0%, #e2e8f0 100%)' };

	return (
		<>
			<div className="absolute inset-0 z-0 pointer-events-none select-none overflow-hidden">
				{wallpaper ? (
					<img
						src={wallpaper}
						className={`w-full h-full object-cover transition-all duration-700 ${isDarkMode ? 'opacity-60 grayscale-[20%]' : 'opacity-100 grayscale-0'}`}
						alt=""
						aria-hidden="true"
					/>
				) : (
					<div className="w-full h-full" style={fallbackWallpaperStyle} />
				)}
			</div>
			{showGrain ? (
				<div
					className={`absolute inset-0 z-[1] pointer-events-none ${isDarkMode ? 'opacity-85 mix-blend-overlay' : 'opacity-80 mix-blend-overlay'}`}
					style={{ backgroundImage: NOISE_SVG, filter: 'contrast(450%) brightness(110%)' }}
				/>
			) : null}
			<div className="absolute inset-0 z-[2] pointer-events-none backdrop-blur-[1px]" style={sidebarOverlayStyle} />
			<div className="absolute inset-0 z-[2] pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.1)_100%)]" />
			<div className={`absolute inset-0 z-[2] pointer-events-none ${isDarkMode ? 'shadow-[inset_0_-120px_140px_-72px_rgba(0,0,0,0.82)]' : 'shadow-[inset_0_-120px_140px_-72px_rgba(0,0,0,0.34)]'}`} />
		</>
	);
};

const SpecsDropdown: React.FC<SpecsDropdownProps> = ({
	asset,
	isDarkMode,
	summaryClassName = '',
	panelClassName = '',
	textClassName = '',
	label = 'Technical Specs',
}) => {
	const sourceLabel = getAssetSourceLabel(asset);

	return (
		<details
			className="group/specs"
			onClick={(e) => e.stopPropagation()}
			onMouseDown={(e) => e.stopPropagation()}
			onPointerDown={(e) => e.stopPropagation()}
		>
			<summary
				className={`list-none cursor-pointer flex items-center justify-between gap-2 text-xs font-bold uppercase tracking-[0.16em] ${summaryClassName}`}
				onClick={(e) => e.stopPropagation()}
				onKeyDown={(e) => e.stopPropagation()}
			>
				<span>{label}</span>
				<ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 group-open/specs:rotate-90 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`} />
			</summary>
			<div className={`mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs font-mono ${isDarkMode ? 'text-zinc-300' : 'text-zinc-600'} ${panelClassName} ${textClassName}`}>
				<div><span className="opacity-60">Type</span> <span className="uppercase">{asset.type}</span></div>
				<div><span className="opacity-60">Size</span> {asset.size}</div>
				<div><span className="opacity-60">Ver</span> {asset.version}.0</div>
				<div><span className="opacity-60">Source</span> {sourceLabel}</div>
				{asset.metadata?.resolution && <div><span className="opacity-60">Res</span> {asset.metadata.resolution}</div>}
				{asset.metadata?.colorProfile && <div><span className="opacity-60">Profile</span> {asset.metadata.colorProfile}</div>}
			</div>
		</details>
	);
};

const SpecsAlwaysPanel: React.FC<{ asset: FileAsset; isDarkMode: boolean; className?: string }> = ({
	asset,
	isDarkMode,
	className = '',
}) => {
	const sourceLabel = getAssetSourceLabel(asset);

	return (
		<div className={`rounded-xl p-3 ${isDarkMode ? 'bg-white/5' : 'bg-zinc-100'} ${className}`}>
			<p className={`text-xs font-bold uppercase tracking-[0.16em] ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Technical Specs</p>
			<div className={`mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs font-mono ${isDarkMode ? 'text-zinc-300' : 'text-zinc-600'}`}>
				<div><span className="opacity-60">Type</span> <span className="uppercase">{asset.type}</span></div>
				<div><span className="opacity-60">Size</span> {asset.size}</div>
				<div><span className="opacity-60">Ver</span> {asset.version}.0</div>
				<div><span className="opacity-60">Source</span> {sourceLabel}</div>
				{asset.metadata?.resolution && <div><span className="opacity-60">Res</span> {asset.metadata.resolution}</div>}
				{asset.metadata?.colorProfile && <div><span className="opacity-60">Profile</span> {asset.metadata.colorProfile}</div>}
			</div>
		</div>
	);
};

const LayoutPaymentCard: React.FC<{ amount: number; isDarkMode: boolean; onPay?: () => void; label?: string; size?: 'default' | 'large' }> = ({
	amount,
	isDarkMode,
	onPay,
	label,
	size = 'default',
}) => {
	const isLarge = size === 'large';

	return (
	<div className={`rounded-[2rem] border ${isLarge ? 'p-7' : 'p-6'} shadow-xl ${isDarkMode ? 'bg-charcoal border-white/[0.06]' : 'bg-white/30 border-zinc-200/40 backdrop-blur-md'}`}>
		<div className="flex items-start justify-between gap-4 mb-5">
			<div>
				<p className={`text-xs font-bold uppercase tracking-[0.16em] ${isDarkMode ? 'text-zinc-300' : 'text-zinc-500'}`}>Total Due</p>
				<p className={`${isLarge ? 'text-3xl md:text-[2.2rem] leading-none' : 'text-3xl'} font-serif ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>${amount.toLocaleString()}</p>
			</div>
			<div className={`${isLarge ? 'w-12 h-12' : 'w-11 h-11'} rounded-2xl flex items-center justify-center ${isDarkMode ? 'bg-lime-400 text-zinc-950' : 'bg-zinc-900 text-white'}`}>
				<CreditCard className={`${isLarge ? 'w-6 h-6' : 'w-5 h-5'}`} />
			</div>
		</div>
		<button
			type="button"
			onClick={onPay}
			className={`w-full ${isLarge ? 'h-12 text-sm' : 'h-11 text-xs'} rounded-xl font-bold uppercase tracking-widest transition-colors ${isDarkMode ? 'bg-lime-400 text-zinc-950 hover:bg-lime-400' : 'bg-zinc-900 text-white hover:bg-zinc-800'}`}
		>
			{label || 'Pay To Unlock'}
		</button>
		<div className={`mt-3 text-xs font-bold uppercase tracking-[0.16em] flex items-center justify-center gap-1.5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
			<ShieldCheck className="w-3.5 h-3.5" />
			Secure transaction
		</div>
	</div>
);
};

const LayoutInlineTerminal: React.FC<{
	project: Project;
	isDarkMode: boolean;
	isEmbedded?: boolean;
	creatorName?: string;
	canVerifyManualPayment?: boolean;
	onPaymentComplete?: (method?: 'stripe' | 'manual') => void;
}> = ({
	project,
	isDarkMode,
	isEmbedded,
	creatorName,
	canVerifyManualPayment,
	onPaymentComplete,
}) => {
	if (!onPaymentComplete) return null;

	return (
		<PaymentTerminal
			project={project}
			isDarkMode={isDarkMode}
			isEmbedded={isEmbedded}
			creatorName={creatorName}
			onPaymentComplete={(method) => onPaymentComplete(method)}
			canVerifyManualPayment={canVerifyManualPayment}
			onMockVerify={canVerifyManualPayment ? () => onPaymentComplete('manual') : undefined}
			manualTransferMode="inline"
		/>
	);
};

export const LayoutBillboard: React.FC<LayoutProps> = ({
	project,
	files,
	isLocked,
	isDarkMode,
	onAssetClick,
	onRequestCorrection,
	onPaymentComplete,
	creatorName,
	canVerifyManualPayment,
	isEmbedded,
	revisions = [],
}) => {
	if (!files.length) {
		return <div className="p-12 text-center text-sm opacity-70">No assets available</div>;
	}
	const bannerWallpaper = project.theme?.wallpaper;
	const bannerGrain = Boolean(project.theme?.showGrain);

	return (
		<div className={`relative w-full min-h-full overflow-hidden ${isDarkMode ? `${DARK_LAYOUT_ROOT_BG} text-white` : 'text-zinc-900'}`}>
			<div className="relative w-full h-[clamp(340px,62vh,760px)] min-h-[340px] overflow-hidden shadow-[0_14px_30px_-20px_rgba(15,23,42,0.42)]">
				<BannerBackdrop isDarkMode={isDarkMode} wallpaper={bannerWallpaper} showGrain={bannerGrain} />

				<div className="absolute inset-x-0 bottom-0 p-6 md:p-10 z-10">
					<div className="max-w-5xl">
						<p className="text-xs font-bold uppercase tracking-[0.25em] text-zinc-200 mb-2 drop-shadow-[0_3px_10px_rgba(0,0,0,0.32)]">Secure delivery</p>
						<h1 className="text-4xl md:text-6xl font-serif leading-[0.95] text-white mb-4 drop-shadow-[0_5px_14px_rgba(0,0,0,0.34)]">{project.name}</h1>
						<p className="text-sm md:text-base text-zinc-200 max-w-2xl leading-relaxed drop-shadow-[0_4px_12px_rgba(0,0,0,0.28)]">
							{project.message || 'Review the curated delivery set below. Each item opens in fullscreen with revision context.'}
						</p>
					</div>
				</div>
			</div>

			<div className="px-6 md:px-10 py-8 md:py-10 grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-8 items-start">
				<div className={`space-y-6 ${DEFAULT_WIDGET_STACK_GAP}`}>
					<div className="flex items-center justify-between">
						<h2 className={`font-bold text-sm uppercase tracking-widest ${isDarkMode ? 'text-zinc-300' : 'text-zinc-500'}`}>Assets ({files.length})</h2>
						<span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${isLocked ? 'text-amber-500 border-amber-500/40 bg-amber-500/10' : 'text-lime-400 border-lime-300/30 bg-lime-400/10'}`}>
							{isLocked ? 'Locked' : 'Unlocked'}
						</span>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
						{files.map((asset, i) => {
							const assetHasRevisions = hasRevisions(asset.id, revisions);
							return (
								<button
									key={asset.id}
									type="button"
									onClick={() => onAssetClick(i)}
									className={`group self-start text-left rounded-[2rem] overflow-hidden transition-all duration-300 hover:-translate-y-1 ${isDarkMode ? 'bg-[#171722] shadow-[0_24px_44px_-18px_rgba(0,0,0,0.75)] hover:shadow-[0_30px_52px_-18px_rgba(0,0,0,0.82)]' : 'bg-white/30 border-zinc-200/40 shadow-[0_24px_40px_-20px_rgba(0,0,0,0.45)] hover:shadow-[0_30px_50px_-20px_rgba(0,0,0,0.55)] backdrop-blur-md'}`}
								>
									<div className="relative aspect-[4/3] overflow-hidden">
										{asset.previewUrl ? (
											<img src={asset.previewUrl} className={`w-full h-full object-cover ${SHARP_PREVIEW_CLASS} transition-transform duration-500 group-hover:scale-[1.03] ${isLocked && asset.locked ? 'opacity-70' : ''}`} />
										) : (
											<div className="w-full h-full flex items-center justify-center bg-black/15">{getFileIcon(asset.type)}</div>
										)}
										<div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
										{asset.locked && isLocked && (
											<div className="absolute top-3 right-3 bg-black/40 backdrop-blur-sm p-1.5 rounded-full">
												<AlertCircle className="w-3 h-3 text-amber-400" />
											</div>
										)}
										{assetHasRevisions && (
											<div className="absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/90 text-white flex items-center gap-1">
												<MessageSquare className="w-3 h-3" /> Revision
											</div>
										)}
									</div>
									<div className={`p-4 ${isDarkMode ? 'bg-charcoal' : 'bg-white'}`}>
										<div className="flex items-center justify-between gap-3">
											<p className={`text-sm font-bold truncate ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{asset.name}</p>
											<span className={`text-xs font-mono ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>{asset.size}</span>
										</div>
										<div className="mt-2" onClick={(e) => e.stopPropagation()}>
											<SpecsDropdown
												asset={asset}
												isDarkMode={isDarkMode}
												summaryClassName={isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}
												panelClassName={`rounded-xl p-3 ${isDarkMode ? 'bg-black/15' : 'bg-white'}`}
											/>
										</div>
										<div className="mt-2 text-xs uppercase tracking-widest text-zinc-500">Asset {i + 1}</div>
										{onRequestCorrection ? (
											<button
												type="button"
												onClick={(e) => {
													e.stopPropagation();
													onRequestCorrection(i);
												}}
												onMouseDown={(e) => e.stopPropagation()}
												className={`mt-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] transition-colors ${isDarkMode ? 'border-white/15 text-zinc-300 hover:bg-white/10 hover:text-white' : 'border-zinc-300 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'}`}
											>
												<MessageSquarePlus className="w-3.5 h-3.5" />
												Request Correction
											</button>
										) : null}
									</div>
								</button>
							);
						})}
					</div>
				</div>

				{isLocked && onPaymentComplete ? (
					<div className="xl:-mt-24 relative z-20 xl:mb-8 rounded-[2rem] border p-4 md:p-5 shadow-xl bg-white/30 border-zinc-200/40 backdrop-blur-md dark:bg-[#181822]/85 dark:border-white/10">
						<LayoutInlineTerminal
							project={project}
							isDarkMode={isDarkMode}
							isEmbedded={isEmbedded}
							creatorName={creatorName}
							canVerifyManualPayment={canVerifyManualPayment}
							onPaymentComplete={onPaymentComplete}
						/>
					</div>
				) : null}
			</div>
		</div>
	);
};

export const LayoutCinema: React.FC<LayoutProps> = ({
	project,
	files,
	isLocked,
	isDarkMode,
	onAssetClick,
	onPaymentComplete,
	revisions = [],
}) => {
	const [featuredIndex, setFeaturedIndex] = useState(0);
	const activeAsset = files[featuredIndex] || files[0];
	const activeHasRevisions = activeAsset ? hasRevisions(activeAsset.id, revisions) : false;

	if (!activeAsset) return <div className="p-12 text-center">No assets available</div>;

	return (
		<div className={`relative w-full min-h-full ${isDarkMode ? `${DARK_LAYOUT_ROOT_BG} text-white` : 'text-zinc-900'} font-sans overflow-hidden`}>
			<div className="relative w-full h-[clamp(380px,70vh,820px)] bg-black text-white min-h-[380px]">
				<div className="absolute inset-0">
					<div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent z-10" />
					<div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/20 to-transparent z-10" />
					{activeAsset.previewUrl ? (
						<img
							key={activeAsset.id}
							src={activeAsset.previewUrl || undefined}
							className={`w-full h-full object-cover animate-fade-in ${activeAsset.locked && isLocked ? 'opacity-50' : ''}`}
							style={{ objectPosition: 'center 20%' }}
						/>
					) : (
						<div className="w-full h-full flex items-center justify-center bg-slate-800">
							{getFileIcon(activeAsset.type)}
						</div>
					)}
				</div>

				<div className="absolute inset-0 z-20 flex flex-col justify-center px-8 md:px-16">
					<div className="max-w-3xl animate-slide-up">
						<div className="flex items-center gap-3 mb-6 flex-wrap">
							<span className="text-zinc-200 font-bold tracking-widest uppercase text-xs">New Arrival</span>
							<div className="w-px h-4 bg-white/20" />
							<div className="flex gap-2 flex-wrap">
								<span className="px-2 py-0.5 border border-white/30 rounded text-xs font-bold text-white/70 uppercase">{activeAsset.type}</span>
								{activeAsset.metadata?.resolution && <span className="px-2 py-0.5 border border-white/30 rounded text-xs font-bold text-white/70">{activeAsset.metadata.resolution}</span>}
								{isLocked && <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/50 rounded text-xs font-bold text-amber-500 uppercase">Locked</span>}
								{activeHasRevisions && <span className="px-2 py-0.5 bg-rose-500/20 border border-rose-500/50 rounded text-xs font-bold text-rose-500 uppercase flex items-center gap-1"><MessageSquare className="w-3 h-3" /> Revision Requested</span>}
							</div>
						</div>

						<h1 className="text-4xl md:text-6xl font-semibold tracking-tighter leading-[0.9] mb-6 drop-shadow-2xl line-clamp-2">
							{activeAsset.name}
						</h1>

						<div className="flex items-center gap-4 text-sm font-medium text-gray-300 mb-8 flex-wrap">
							<span className="text-zinc-200 font-bold">Version {activeAsset.version}.0</span>
							<span>{new Date().getFullYear()}</span>
							<span>{activeAsset.size}</span>
						</div>

						<p className="text-sm md:text-base text-gray-300 max-w-xl leading-relaxed mb-10 line-clamp-3">
							{project.message || 'High-fidelity master asset ready for deployment. Secure payment required for full resolution unlock.'}
						</p>

						<div className="flex items-center gap-4 flex-wrap">
							<button
								onClick={() => onAssetClick(featuredIndex)}
								className="px-6 py-3 bg-white text-black rounded-lg font-bold text-sm md:text-base hover:bg-white/90 transition-colors flex items-center gap-2"
							>
								<Play className="w-5 h-5 fill-current" /> {activeAsset.type === 'video' ? 'Play Preview' : 'View Fullscreen'}
							</button>
							{!isLocked && activeAsset.downloadUrl && (
								<a href={activeAsset.downloadUrl} target="_blank" rel="noreferrer" className="px-6 py-3 bg-white/20 text-white rounded-lg font-bold text-sm md:text-base hover:bg-white/30 transition-colors flex items-center gap-2 backdrop-blur-md">
									<Download className="w-5 h-5" /> Download
								</a>
							)}
						</div>
					</div>
				</div>
			</div>

			<div className="relative z-20 px-4 sm:px-6 md:px-16 pb-16 -mt-8 md:-mt-12">
				<h3 className={`text-lg font-bold mb-4 drop-shadow-md ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Collection Assets ({files.length})</h3>
				<div className="flex gap-3 sm:gap-4 overflow-x-auto pb-8 snap-x snap-mandatory custom-scrollbar">
					{files.map((asset, i) => {
						const assetHasRevisions = hasRevisions(asset.id, revisions);
						return (
							<div
								key={asset.id}
								onClick={() => { playClick(); setFeaturedIndex(i); }}
								className={`
									flex-shrink-0 w-[min(68vw,280px)] sm:w-56 aspect-video rounded-xl overflow-hidden cursor-pointer relative group transition-all duration-300 snap-center shadow-lg
									${featuredIndex === i ? `ring-2 ${isDarkMode ? 'ring-white scale-105 z-10' : 'ring-black scale-105 z-10'}` : 'opacity-70 hover:opacity-100 hover:scale-105'}
								`}
							>
								{asset.previewUrl ? (
									<img src={asset.previewUrl || undefined} className="w-full h-full object-cover" />
								) : (
									<div className={`w-full h-full flex items-center justify-center ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`}>
										{getFileIcon(asset.type)}
									</div>
								)}
								<div className="absolute inset-0 bg-black/30 group-hover:bg-transparent transition-colors" />
								<div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/35 via-black/40 to-transparent">
									<h4 className="font-bold text-xs truncate text-white">{asset.name}</h4>
									<div className="mt-1" onClick={(e) => e.stopPropagation()}>
										<SpecsDropdown
											asset={asset}
											isDarkMode={true}
											summaryClassName="text-zinc-400"
											panelClassName="rounded-lg p-2.5 bg-black/30"
											textClassName="text-zinc-300"
										/>
									</div>
								</div>
								{asset.locked && isLocked && (
										<div className="absolute top-2 right-2">
										<div className="bg-black/40 backdrop-blur-md p-1 rounded-full">
											<AlertCircle className="w-3 h-3 text-amber-500" />
										</div>
									</div>
								)}
								{assetHasRevisions && (
									<div className="absolute top-2 left-2">
										<div className="bg-rose-500/90 backdrop-blur-md p-1 rounded-full">
											<MessageSquare className="w-3 h-3 text-white" />
										</div>
									</div>
								)}
							</div>
						);
					})}
				</div>

				{isLocked && (
					<div className={`mt-8 p-8 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-8 border ${isDarkMode ? 'bg-[#1a1a1a] border-white/5' : 'bg-white border-zinc-200 shadow-xl'}`}>
						<div>
							<h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Ready to unlock full access?</h3>
							<p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Complete the secure transaction to download all {files.length} master files in full resolution.</p>
						</div>
						{onPaymentComplete && (
							<button onClick={() => onPaymentComplete()} className="px-6 py-3 bg-[#e50914] text-white rounded font-bold text-sm uppercase tracking-wider hover:bg-[#f6121d] transition-colors shadow-lg shadow-red-900/20 flex items-center gap-2">
								<CreditCard className="w-4 h-4" /> Pay ${project.amount.toLocaleString()}
							</button>
						)}
					</div>
				)}
			</div>
		</div>
	);
};

export const LayoutJournal: React.FC<LayoutProps> = ({
	project,
	files,
	isLocked,
	isDarkMode,
	onAssetClick,
	onRequestCorrection,
	onPaymentComplete,
	creatorName,
	canVerifyManualPayment,
	isEmbedded,
	revisions = [],
}) => {
	const textMain = isDarkMode ? 'text-white' : 'text-slate-900';
	const textMuted = isDarkMode ? 'text-slate-400' : 'text-slate-500';
	const bg = DARK_LAYOUT_ROOT_BG;
	const surface = isDarkMode ? 'bg-[#252525]' : 'bg-white';

	return (
		<div className={`relative w-full min-h-full ${bg} ${textMain} pb-20 font-serif overflow-hidden`}>
			<div className="max-w-4xl mx-auto p-8 md:p-16">
				<header className="mb-20 text-center">
					<div className={`w-px h-12 ${isDarkMode ? 'bg-white' : 'bg-black'} mx-auto mb-6`}></div>
					<p className={`italic text-lg ${textMuted} mb-3`}>Project Delivery</p>
					<h1 className="text-4xl md:text-6xl leading-[0.9] mb-4">{project.name}</h1>
					<p className={`font-sans text-xs tracking-widest uppercase ${textMuted}`}>For {project.client.name}</p>
					<div className={`w-px h-12 ${isDarkMode ? 'bg-white' : 'bg-black'} mx-auto mt-6`}></div>
				</header>

				<div className="space-y-24">
					{files.slice(0, 3).map((file, i) => {
						const assetHasRevisions = hasRevisions(file.id, revisions);
						return (
							<div key={file.id} className={`flex flex-col ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} gap-8 md:gap-12 items-center`}>
								<div className={`flex-1 space-y-4 ${i % 2 !== 0 ? 'text-right' : ''}`}>
									<div className={`flex items-center gap-2 ${i % 2 !== 0 ? 'justify-end' : ''}`}>
										<h2 className="text-2xl md:text-3xl">{file.name}</h2>
										{assetHasRevisions && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />}
									</div>
									<SpecsDropdown
										asset={file}
										isDarkMode={isDarkMode}
										summaryClassName={`${textMuted} font-sans`}
										panelClassName={`rounded-xl p-3 ${isDarkMode ? 'bg-white/5' : 'bg-zinc-100'}`}
										textClassName={isDarkMode ? 'text-zinc-300' : 'text-zinc-600'}
									/>
									<div className={`flex items-center gap-4 ${i % 2 !== 0 ? 'justify-end' : ''}`}>
										<button
											onClick={() => onAssetClick(i)}
											className={`text-xs font-bold uppercase tracking-widest border-b ${isDarkMode ? 'border-white' : 'border-black'} pb-1 hover:opacity-50 font-sans`}
										>
											Inspect Asset {i + 1}
										</button>
										{onRequestCorrection ? (
											<button
												type="button"
												onClick={() => onRequestCorrection(i)}
												className={`text-[10px] font-bold uppercase tracking-[0.16em] border-b pb-1 ${isDarkMode ? 'border-zinc-500 text-zinc-400 hover:text-white hover:border-white' : 'border-zinc-400 text-zinc-600 hover:text-zinc-900 hover:border-zinc-900'}`}
											>
												Request Correction
											</button>
										) : null}
									</div>
								</div>
								<div className="flex-1 cursor-pointer group w-full" onClick={() => onAssetClick(i)}>
									<div className={`relative aspect-[3/4] overflow-hidden shadow-2xl rounded-lg ${surface}`}>
										{file.previewUrl ? (
											<img
												src={file.previewUrl || undefined}
												className={`w-full h-full object-cover transition-all duration-700 grayscale group-hover:grayscale-0 group-hover:scale-105 ${file.locked && isLocked ? 'opacity-80' : ''}`}
											/>
										) : (
											<div className="w-full h-full flex items-center justify-center">
												{getFileIcon(file.type)}
											</div>
										)}
										{file.locked && isLocked && (
											<div className="absolute inset-0 flex items-center justify-center">
												<div className="bg-black/35 backdrop-blur-md p-3 rounded-full">
													<AlertCircle className="w-6 h-6 text-white" />
												</div>
											</div>
										)}
										{assetHasRevisions && (
											<div className="absolute top-2 right-2">
												<div className="bg-rose-500/90 backdrop-blur-md p-2 rounded-full shadow-lg">
													<MessageSquare className="w-4 h-4 text-white" />
												</div>
											</div>
										)}
									</div>
								</div>
							</div>
						);
					})}

					{files.length > 3 && (
						<div>
							<h2 className="text-center text-2xl mb-8">The Full Collection</h2>
							<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
								{files.map((file, i) => {
									const assetHasRevisions = hasRevisions(file.id, revisions);
									return (
										<div key={file.id} onClick={() => onAssetClick(i)} className={`aspect-square ${surface} cursor-pointer overflow-hidden group relative`}>
											{file.previewUrl ? (
												<img src={file.previewUrl || undefined} className={`w-full h-full object-cover ${SHARP_PREVIEW_CLASS} group-hover:scale-105 transition-transform duration-700`} />
											) : (
												<div className="w-full h-full flex items-center justify-center">
													{getFileIcon(file.type)}
												</div>
											)}
											<div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/65 to-transparent">
												<div onClick={(e) => e.stopPropagation()}>
													<SpecsDropdown
														asset={file}
														isDarkMode={true}
														summaryClassName="text-white/75"
														panelClassName="rounded-lg p-2 bg-black/30"
														textClassName="text-white/90"
													/>
												</div>
												{onRequestCorrection ? (
													<div className="mt-2" onClick={(e) => e.stopPropagation()}>
														<button
															type="button"
															onClick={(e) => {
																e.stopPropagation();
																onRequestCorrection(i);
															}}
															className="inline-flex items-center gap-1.5 rounded-full border border-white/35 bg-black/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/90 hover:bg-black/35"
														>
															<MessageSquarePlus className="w-3 h-3" />
															Request
														</button>
													</div>
												) : null}
											</div>
											{assetHasRevisions && (
												<div className="absolute top-2 right-2 z-10">
													<div className="bg-rose-500/90 backdrop-blur-md p-1.5 rounded-full shadow-lg">
														<MessageSquare className="w-3 h-3 text-white" />
													</div>
												</div>
											)}
										</div>
									);
								})}
							</div>
						</div>
					)}

					{isLocked && onPaymentComplete ? (
						<div className={`border-t-4 ${isDarkMode ? 'border-white' : 'border-black'} pt-12 flex flex-col items-center text-center font-sans`}>
							<div className="text-4xl md:text-5xl font-serif mb-4">${project.amount.toLocaleString()}</div>
							<p className={`italic ${textMuted} mb-8 font-serif`}>Total outstanding for this collection.</p>
							<div className="w-full max-w-xl">
								<LayoutInlineTerminal
									project={project}
									isDarkMode={isDarkMode}
									isEmbedded={isEmbedded}
									creatorName={creatorName}
									canVerifyManualPayment={canVerifyManualPayment}
									onPaymentComplete={onPaymentComplete}
								/>
							</div>
						</div>
					) : null}
				</div>
			</div>
		</div>
	);
};

export const LayoutMasonry: React.FC<LayoutProps> = ({
	project,
	files,
	isLocked,
	isDarkMode,
	onAssetClick,
	onRequestCorrection,
	onPaymentComplete,
	creatorName,
	canVerifyManualPayment,
	isEmbedded,
	revisions = [],
}) => {
	const textMain = isDarkMode ? 'text-white' : 'text-slate-900';
	const textMuted = isDarkMode ? 'text-slate-400' : 'text-slate-500';
	const bg = DARK_LAYOUT_ROOT_BG;
	const [isContractPanelOpen, setIsContractPanelOpen] = useState(false);
	const [drawerTopPx, setDrawerTopPx] = useState(120);
	const masonryScrollRef = useRef<HTMLDivElement | null>(null);
	const masonryGridRef = useRef<HTMLDivElement | null>(null);
	const milestones = project.useMilestones && project.milestones?.length
		? project.milestones
		: [{ id: 'single', title: 'Project Delivery', amount: project.amount, status: isLocked ? 'locked' : 'paid', dueDate: project.dueDate }];

	useEffect(() => {
		if (!isContractPanelOpen) return;
		const handleEsc = (event: KeyboardEvent) => {
			if (event.key === 'Escape') setIsContractPanelOpen(false);
		};
		window.addEventListener('keydown', handleEsc);
		return () => window.removeEventListener('keydown', handleEsc);
	}, [isContractPanelOpen]);

	useEffect(() => {
		if (!isContractPanelOpen) return;

		const recomputeDrawerTop = () => {
			const scrollEl = masonryScrollRef.current;
			const gridEl = masonryGridRef.current;
			if (!scrollEl || !gridEl) return;

			const scrollRect = scrollEl.getBoundingClientRect();
			const gridRect = gridEl.getBoundingClientRect();
			const computedTop = Math.max(12, Math.round(gridRect.top - scrollRect.top));
			setDrawerTopPx(computedTop);
		};

		const rafId = requestAnimationFrame(() => requestAnimationFrame(recomputeDrawerTop));
		window.addEventListener('resize', recomputeDrawerTop);

		return () => {
			cancelAnimationFrame(rafId);
			window.removeEventListener('resize', recomputeDrawerTop);
		};
	}, [isContractPanelOpen, files.length, isLocked]);

	return (
		<div className={`relative w-full h-[100dvh] min-h-[100dvh] ${bg} ${textMain} transition-colors duration-500 font-sans overflow-hidden`}>
			<div ref={masonryScrollRef} className="w-full h-full overflow-y-auto overflow-x-hidden custom-scrollbar px-6 md:px-12 pt-6 md:pt-12 pb-8 md:pb-12">
				<div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
					<div>
						<div className="flex items-center gap-3 mb-2">
							<div className={`w-2 h-2 rounded-full ${isLocked ? 'bg-amber-500' : 'bg-lime-400'}`}></div>
							<span className={`text-xs font-bold uppercase tracking-widest ${textMuted}`}>{isLocked ? 'Payment Pending' : 'Collection Unlocked'}</span>
						</div>
						<h1 className="text-3xl md:text-5xl font-serif font-medium tracking-tight drop-shadow-[0_8px_20px_rgba(0,0,0,0.24)]">{project.name}</h1>
					</div>

					{isLocked && onPaymentComplete && (
						<div className="flex items-center gap-3">
							<button
								type="button"
								onClick={() => setIsContractPanelOpen((prev) => !prev)}
								className={`px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${isDarkMode ? 'border border-white/20 text-white hover:bg-white/5' : 'border border-zinc-200 text-zinc-700 hover:bg-zinc-50'}`}
								aria-expanded={isContractPanelOpen}
							>
								Review Contract
							</button>
							<button
								type="button"
								onClick={() => setIsContractPanelOpen(true)}
								className={`px-6 py-3 ${isDarkMode ? 'bg-white text-black' : 'bg-black text-white'} rounded-full text-xs font-bold uppercase shadow-lg hover:scale-105 transition-transform flex items-center gap-2`}
							>
								<CreditCard className="w-4 h-4" /> {project.requiresSignature ? 'Sign / Pay' : `Pay $${project.amount.toLocaleString()}`}
							</button>
						</div>
					)}
				</div>

				<div ref={masonryGridRef} className={`columns-1 sm:columns-2 ${isContractPanelOpen ? 'lg:columns-2 xl:columns-3 lg:pr-[560px]' : 'lg:columns-3 xl:columns-4'} gap-8 space-y-8`}>
					{files.map((asset, i) => {
						const assetHasRevisions = hasRevisions(asset.id, revisions);
						const masonryAspect = i % 5 === 0 ? 'aspect-[4/5]' : (i % 5 === 1 ? 'aspect-square' : 'aspect-[4/3]');
						return (
							<div key={asset.id} className="break-inside-avoid mb-8">
								<button
									type="button"
									onClick={() => onAssetClick(i)}
									className={`group w-full text-left rounded-[2rem] overflow-hidden transition-transform duration-300 hover:-translate-y-1 ${isDarkMode ? 'bg-[#18181f] shadow-[0_22px_40px_-22px_rgba(0,0,0,0.9)]' : 'bg-white/30 border-zinc-200/40 shadow-[0_22px_42px_-24px_rgba(0,0,0,0.45)] backdrop-blur-md'}`}
								>
									<div className={`relative ${masonryAspect} overflow-hidden`}>
										{asset.previewUrl ? (
											<img src={asset.previewUrl} className={`w-full h-full object-cover ${SHARP_PREVIEW_CLASS} transition-transform duration-700 group-hover:scale-[1.04] ${isLocked && asset.locked ? 'opacity-75' : ''}`} />
										) : (
											<div className={`w-full h-full flex items-center justify-center ${isDarkMode ? 'bg-zinc-900' : 'bg-zinc-100'}`}>{getFileIcon(asset.type)}</div>
										)}
										<div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
										{assetHasRevisions && (
											<div className="absolute top-2 left-2 bg-rose-500 text-white rounded-full px-2 py-1 text-xs font-bold uppercase tracking-wider">Rev</div>
										)}
									</div>
									<div className={`p-3 ${isDarkMode ? 'bg-charcoal' : 'bg-white'}`}>
										<div className="flex items-center justify-between gap-3">
											<p className={`text-xs font-bold truncate ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{asset.name}</p>
											<span className={`text-xs font-mono ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>{asset.size}</span>
										</div>
										<div className="mt-2" onClick={(e) => e.stopPropagation()}>
											<SpecsDropdown
												asset={asset}
												isDarkMode={isDarkMode}
												summaryClassName={isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}
												panelClassName={`rounded-lg p-2.5 ${isDarkMode ? 'bg-white/5' : 'bg-white'}`}
											/>
										</div>
										{onRequestCorrection ? (
											<div className="mt-2" onClick={(e) => e.stopPropagation()}>
												<button
													type="button"
													onClick={(e) => {
														e.stopPropagation();
														onRequestCorrection(i);
													}}
													onMouseDown={(e) => e.stopPropagation()}
													className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] transition-colors ${isDarkMode ? 'border-white/15 text-zinc-300 hover:bg-white/10 hover:text-white' : 'border-zinc-300 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'}`}
												>
													<MessageSquarePlus className="w-3.5 h-3.5" />
													Request Correction
												</button>
											</div>
										) : null}
									</div>
								</button>
							</div>
						);
					})}
				</div>
			</div>

			{isContractPanelOpen ? (
				<>
					<div className="absolute inset-0 z-40 pointer-events-none">
						<section
							className={`absolute pointer-events-auto w-[min(94vw,540px)] h-[min(72vh,620px)] rounded-[1.75rem] border overflow-hidden shadow-[0_42px_84px_-36px_rgba(0,0,0,0.75)] ${isDarkMode ? `${DARK_WIDGET_SURFACE_CLASS} border-white/[0.06] text-zinc-100` : 'bg-[#f8fafc] border-zinc-200 text-zinc-900'}`}
							style={{
								top: `${drawerTopPx}px`,
								right: 'clamp(0.75rem, 3vw, 3rem)',
								maxHeight: `calc(100dvh - ${drawerTopPx}px - 0.75rem)`,
							}}
						>
							<div className={`h-full flex flex-col ${isDarkMode ? DARK_WIDGET_SURFACE_CLASS : 'bg-[linear-gradient(165deg,#ffffff_0%,#eef2ff_70%)]'}`}>
								<div className={`px-5 py-4 border-b ${isDarkMode ? 'border-white/10' : 'border-zinc-200'} flex items-center justify-between gap-3`}>
									<div>
										<p className={`text-xs font-bold uppercase tracking-[0.16em] ${isDarkMode ? 'text-zinc-300' : 'text-zinc-500'}`}>Contract Drawer</p>
										<h3 className="mt-1 text-lg font-serif leading-tight">{project.name}</h3>
									</div>
									<button
										type="button"
										onClick={() => setIsContractPanelOpen(false)}
										className={`w-9 h-9 rounded-full border flex items-center justify-center transition-colors ${isDarkMode ? 'border-white/15 text-zinc-200 hover:bg-white/10' : 'border-zinc-300 text-zinc-700 hover:bg-zinc-100'}`}
										aria-label="Close contract panel"
									>
										<X className="w-4 h-4" />
									</button>
								</div>

								<div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4">
									<div className={`rounded-2xl border p-3.5 ${isDarkMode ? `border-white/[0.06] ${DARK_WIDGET_SURFACE_CLASS}` : 'border-zinc-200 bg-white/80'}`}>
										<p className={`text-xs font-bold uppercase tracking-[0.16em] mb-3 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Snapshot</p>
										<div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
											<div>
												<p className={`text-xs font-bold uppercase tracking-[0.16em] ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Client</p>
												<p className="mt-1 font-semibold truncate">{project.client.name}</p>
											</div>
											<div>
												<p className={`text-xs font-bold uppercase tracking-[0.16em] ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Assets</p>
												<p className="mt-1 font-semibold">{files.length}</p>
											</div>
											<div>
												<p className={`text-xs font-bold uppercase tracking-[0.16em] ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Created</p>
												<p className="mt-1 font-semibold">{new Date(project.createdAt).toLocaleDateString()}</p>
											</div>
											<div>
												<p className={`text-xs font-bold uppercase tracking-[0.16em] ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Due</p>
												<p className="mt-1 font-semibold">{project.dueDate}</p>
											</div>
										</div>
									</div>

									<div className={`rounded-2xl border p-3.5 ${isDarkMode ? `border-white/[0.06] ${DARK_WIDGET_SURFACE_CLASS}` : 'border-zinc-200 bg-white/80'}`}>
										<p className={`text-xs font-bold uppercase tracking-[0.16em] mb-3 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Milestones</p>
										<div className="space-y-2">
											{milestones.map((milestone, index) => (
												<div key={`${milestone.id}-${index}`} className={`rounded-xl border p-3 ${isDarkMode ? `border-white/[0.06] ${DARK_WIDGET_SURFACE_CLASS}` : 'border-zinc-200 bg-white'}`}>
													<div className="flex items-center justify-between gap-2">
														<p className="text-sm font-semibold truncate">{milestone.title}</p>
														<p className="text-sm font-bold">${milestone.amount.toLocaleString()}</p>
													</div>
													<p className={`mt-1 text-xs font-bold uppercase tracking-[0.16em] ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Status: {milestone.status}</p>
												</div>
											))}
										</div>
									</div>

									<div className={`rounded-2xl border p-3.5 ${isDarkMode ? `border-white/[0.06] ${DARK_WIDGET_SURFACE_CLASS}` : 'border-zinc-200 bg-white/80'}`}>
										<p className={`text-xs font-bold uppercase tracking-[0.16em] mb-2 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Terms</p>
										<p className={`text-xs leading-relaxed ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
											Access to master files is granted after payment confirmation. {project.requiresSignature ? 'Client signature is required before final release.' : 'Signature requirement is disabled for this project.'}
										</p>
									</div>
								</div>

								<div className={`px-5 py-4 border-t ${isDarkMode ? `border-white/[0.06] ${DARK_WIDGET_SURFACE_CLASS}` : 'border-zinc-200 bg-white/30 border-zinc-200/40 backdrop-blur-sm'}`}>
									<div className="flex items-center justify-between gap-3 mb-3">
										<div>
											<p className={`text-xs font-bold uppercase tracking-[0.16em] ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Total Due</p>
											<p className="mt-1 text-2xl font-serif leading-none">${project.amount.toLocaleString()}</p>
										</div>
										<button
											type="button"
											onClick={() => setIsContractPanelOpen(false)}
											className={`h-10 px-4 rounded-xl border text-xs font-bold uppercase tracking-[0.16em] ${isDarkMode ? 'border-white/15 text-zinc-200 hover:bg-white/10' : 'border-zinc-300 text-zinc-700 hover:bg-zinc-100'}`}
										>
											Close
										</button>
									</div>
									{isLocked && onPaymentComplete ? (
										<LayoutInlineTerminal
											project={project}
											isDarkMode={isDarkMode}
											isEmbedded={isEmbedded}
											creatorName={creatorName}
											canVerifyManualPayment={canVerifyManualPayment}
											onPaymentComplete={onPaymentComplete}
										/>
									) : null}
								</div>
							</div>
						</section>
					</div>
				</>
			) : null}
		</div>
	);
};

export const LayoutSplit: React.FC<LayoutProps> = ({
	project,
	files,
	isLocked,
	isDarkMode,
	onAssetClick,
	onPaymentComplete,
	revisions = [],
}) => {
	if (!files.length) return <div className="p-12 text-center text-sm opacity-70">No assets available</div>;
	const bannerWallpaper = project.theme?.wallpaper;
	const bannerGrain = Boolean(project.theme?.showGrain);

	return (
		<div className={`relative w-full min-h-screen lg:h-screen overflow-hidden ${isDarkMode ? `${DARK_LAYOUT_ROOT_BG} text-white` : 'text-zinc-900'} flex flex-col lg:flex-row`}>
			<div className="lg:w-1/2 min-h-[42dvh] lg:h-full relative overflow-hidden shadow-2xl">
				<BannerBackdrop isDarkMode={isDarkMode} wallpaper={bannerWallpaper} showGrain={bannerGrain} />
				<div className="absolute inset-x-0 bottom-0 p-6 md:p-8 z-10">
					<p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-200 mb-2 drop-shadow-[0_8px_18px_rgba(0,0,0,0.5)]">Live Preview</p>
					<h2 className="text-3xl md:text-5xl font-serif text-white leading-[0.95] drop-shadow-[0_12px_24px_rgba(0,0,0,0.52)]">{project.name}</h2>
					<p className="text-sm text-zinc-300 mt-3 max-w-xl drop-shadow-[0_8px_16px_rgba(0,0,0,0.46)]">Secure handover for global campaign assets. Watermarked previews available for inspection.</p>
				</div>
			</div>

			<div className="lg:w-1/2 p-4 sm:p-6 md:p-8 flex flex-col gap-7 lg:overflow-y-auto custom-scrollbar">
				<div className="flex items-center justify-between">
					<div>
						<p className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Client</p>
						<p className="text-lg font-bold">{project.client.name}</p>
					</div>
					<span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${isLocked ? 'text-amber-500 border-amber-500/40 bg-amber-500/10' : 'text-lime-400 border-lime-300/30 bg-lime-400/10'}`}>
						{isLocked ? 'Locked' : 'Unlocked'}
					</span>
				</div>

				<div className={`grid grid-cols-2 ${DEFAULT_WIDGET_STACK_GAP} sm:gap-4 items-start`}>
					{files.map((asset, i) => {
						const assetHasRevisions = hasRevisions(asset.id, revisions);
						return (
							<button
								key={asset.id}
								type="button"
								onClick={() => onAssetClick(i)}
								className={`group self-start text-left rounded-[2rem] overflow-hidden ${isDarkMode ? 'bg-[#12121a] shadow-[0_20px_36px_-22px_rgba(0,0,0,0.9)]' : 'bg-white/30 border-zinc-200/40 shadow-[0_20px_36px_-22px_rgba(0,0,0,0.45)] backdrop-blur-md'}`}
							>
								<div className="relative aspect-square overflow-hidden">
									{asset.previewUrl ? (
										<img src={asset.previewUrl} className={`w-full h-full object-cover ${SHARP_PREVIEW_CLASS} transition-transform duration-500 group-hover:scale-[1.04] ${asset.locked && isLocked ? 'opacity-70' : ''}`} />
									) : (
										<div className={`w-full h-full flex items-center justify-center ${isDarkMode ? 'bg-zinc-900' : 'bg-zinc-100'}`}>{getFileIcon(asset.type)}</div>
									)}
									<div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
									{assetHasRevisions && (
										<div className="absolute top-2 left-2 bg-rose-500/90 rounded-full px-2 py-1 text-xs font-bold uppercase tracking-wider text-white">Rev</div>
									)}
								</div>
								<div className={`p-3 ${isDarkMode ? 'bg-charcoal' : 'bg-white'}`}>
									<p className={`text-xs font-bold truncate ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{asset.name}</p>
									<div className="mt-2" onClick={(e) => e.stopPropagation()}>
										<SpecsDropdown
											asset={asset}
											isDarkMode={isDarkMode}
											summaryClassName={isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}
											panelClassName={`rounded-lg p-2.5 ${isDarkMode ? 'bg-white/5' : 'bg-white'}`}
										/>
									</div>
								</div>
							</button>
						);
					})}
				</div>

				{isLocked && onPaymentComplete ? <LayoutPaymentCard amount={project.amount} isDarkMode={isDarkMode} onPay={onPaymentComplete} /> : null}
			</div>
		</div>
	);
};

export const LayoutPortfolio: React.FC<LayoutProps> = ({
	project,
	files,
	isLocked,
	isDarkMode,
	onAssetClick,
	onPaymentComplete,
	revisions = [],
}) => {
	const railRef = useRef<HTMLDivElement>(null);
	const [canScrollLeft, setCanScrollLeft] = useState(false);
	const [canScrollRight, setCanScrollRight] = useState(false);
	if (!files.length) return <div className="p-12 text-center text-sm opacity-70">No assets available</div>;

	const updateRailScrollState = useCallback(() => {
		const rail = railRef.current;
		if (!rail) return;
		const maxLeft = rail.scrollWidth - rail.clientWidth;
		setCanScrollLeft(rail.scrollLeft > 2);
		setCanScrollRight(rail.scrollLeft < maxLeft - 2);
	}, []);

	useEffect(() => {
		const rail = railRef.current;
		if (!rail) return;

		updateRailScrollState();
		rail.addEventListener('scroll', updateRailScrollState, { passive: true });
		window.addEventListener('resize', updateRailScrollState);

		return () => {
			rail.removeEventListener('scroll', updateRailScrollState);
			window.removeEventListener('resize', updateRailScrollState);
		};
	}, [updateRailScrollState, files.length]);

	const scrollRail = (direction: 'left' | 'right') => {
		if (!railRef.current) return;
		if (direction === 'left' && !canScrollLeft) return;
		if (direction === 'right' && !canScrollRight) return;
		const delta = railRef.current.clientWidth * 0.8;
		railRef.current.scrollBy({ left: direction === 'left' ? -delta : delta, behavior: 'smooth' });
		playClick();
	};

	const handleRailWheel = (e: React.WheelEvent<HTMLDivElement>) => {
		if (!railRef.current) return;
		const rail = railRef.current;
		if (rail.scrollWidth <= rail.clientWidth + 1) return;
		if (Math.abs(e.deltaY) < 0.1 && Math.abs(e.deltaX) < 0.1) return;
		e.preventDefault();

 		let normalizedDeltaY = e.deltaY;
		let normalizedDeltaX = e.deltaX;
		if (e.deltaMode === 1) {
			normalizedDeltaY *= 18;
			normalizedDeltaX *= 18;
		}
		if (e.deltaMode === 2) {
			normalizedDeltaY *= rail.clientWidth * 0.9;
			normalizedDeltaX *= rail.clientWidth * 0.9;
		}

		const dominantDelta = Math.abs(normalizedDeltaY) >= Math.abs(normalizedDeltaX) ? normalizedDeltaY : normalizedDeltaX;
		if (dominantDelta === 0) return;

		const tunedDelta = Math.sign(dominantDelta) * Math.min(Math.max(Math.abs(dominantDelta) * 0.9, 20), rail.clientWidth * 0.42);
		rail.scrollBy({ left: tunedDelta, behavior: 'smooth' });
	};

	return (
		<div className={`relative w-full h-screen lg:h-screen flex flex-col ${isDarkMode ? `${DARK_LAYOUT_ROOT_BG} text-white` : 'text-zinc-900'} overflow-hidden font-sans group/portfolio`}>
			<div className={`pointer-events-none absolute inset-y-0 left-0 w-20 z-20 bg-gradient-to-r from-black/25 to-transparent transition-opacity duration-500 ${canScrollLeft ? 'opacity-100' : 'opacity-0'}`} />
			<div className="pointer-events-none absolute inset-y-0 right-0 w-20 z-20 bg-gradient-to-l from-black/25 to-transparent" />
			{canScrollLeft ? (
				<button
					type="button"
					onClick={() => scrollRail('left')}
					className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-30 p-4 rounded-full bg-black/40 text-white backdrop-blur-xl border border-white/10 opacity-85 md:opacity-0 md:group-hover/portfolio:opacity-100 transition-all hover:bg-black/35 hover:scale-110 shadow-[0_20px_38px_-16px_rgba(0,0,0,0.6)]"
				>
					<ChevronLeft className="w-5 h-5" />
				</button>
			) : null}
			{canScrollRight ? (
				<button
					type="button"
					onClick={() => scrollRail('right')}
					className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-30 p-4 rounded-full bg-black/40 text-white backdrop-blur-xl border border-white/10 opacity-85 md:opacity-0 md:group-hover/portfolio:opacity-100 transition-all hover:bg-black/35 hover:scale-110 shadow-[0_20px_38px_-16px_rgba(0,0,0,0.6)]"
				>
					<ChevronRight className="w-5 h-5" />
				</button>
			) : null}

			<div
				ref={railRef}
				onWheel={handleRailWheel}
				className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar scroll-smooth flex items-center snap-x snap-mandatory px-5 sm:px-8 md:px-16 lg:px-24 gap-6 md:gap-14"
			>
				<section className="snap-center shrink-0 w-[min(90vw,760px)] h-[min(82vh,700px)] flex flex-col justify-center px-2 sm:px-4 md:px-6">
					<p className={`text-xs font-bold uppercase tracking-[0.24em] mb-3 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Portfolio Delivery</p>
					<h2 className={`text-5xl md:text-7xl font-serif leading-[0.9] mb-5 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{project.name}</h2>
					<p className={`${isDarkMode ? 'text-zinc-300' : 'text-zinc-600'} text-base md:text-lg leading-relaxed max-w-md font-medium`}>
						A curated selection of campaign-ready assets designed for fast approvals and secure handoff.
					</p>
					<div className="mt-7 flex items-center gap-3">
						<div className={`w-10 h-10 rounded-full overflow-hidden border ${isDarkMode ? 'border-white/20' : 'border-zinc-300'}`}>
							<img src={project.client.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100"} className="w-full h-full object-cover" />
						</div>
						<div>
							<p className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Curated By</p>
							<p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{project.client.name}</p>
						</div>
					</div>
				</section>

				{files.map((asset, i) => {
					const assetHasRevisions = hasRevisions(asset.id, revisions);
					return (
						<button
							key={asset.id}
							type="button"
							onClick={() => onAssetClick(i)}
							className="snap-center shrink-0 w-[min(88vw,760px)] h-[min(82vh,700px)] relative rounded-[2rem] overflow-hidden group shadow-[0_24px_58px_-22px_rgba(0,0,0,0.78)]"
						>
							{asset.previewUrl ? (
								<img src={asset.previewUrl} className={`w-full h-full object-cover ${SHARP_PREVIEW_CLASS} transition-transform duration-700 group-hover:scale-[1.03] ${asset.locked && isLocked ? 'opacity-75' : ''}`} />
							) : (
								<div className={`w-full h-full flex items-center justify-center ${isDarkMode ? 'bg-zinc-900' : 'bg-zinc-200'}`}>{getFileIcon(asset.type)}</div>
							)}
							<div className="absolute inset-0 bg-gradient-to-t from-black/78 via-black/22 to-transparent" />
							{assetHasRevisions && (
								<div className="absolute top-4 left-4 px-2.5 py-1 rounded-full bg-rose-500/90 text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1">
									<MessageSquare className="w-3 h-3" /> Revision
								</div>
							)}
							{asset.locked && isLocked && (
								<div className="absolute top-4 right-4 bg-black/40 backdrop-blur-sm p-1.5 rounded-full">
									<AlertCircle className="w-3.5 h-3.5 text-amber-400" />
								</div>
							)}
							<div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
								<h3 className="text-2xl md:text-3xl font-serif text-white drop-shadow-[0_9px_24px_rgba(0,0,0,0.7)]">{asset.name}</h3>
								<p className="text-xs uppercase tracking-[0.2em] text-zinc-300 mt-1">Asset {String(i + 1).padStart(2, '0')}</p>
								<div className="mt-3 max-w-sm" onClick={(e) => e.stopPropagation()}>
									<SpecsDropdown
										asset={asset}
										isDarkMode={true}
										label="Details"
										summaryClassName="text-white/80"
										panelClassName="rounded-xl p-3 bg-black/30 backdrop-blur-sm"
										textClassName="text-white/90"
									/>
								</div>
							</div>
						</button>
					);
				})}

				{isLocked && onPaymentComplete ? (
					<div className="snap-center shrink-0 w-[min(92vw,560px)] h-[min(84vh,760px)] flex items-center">
						<LayoutPaymentCard amount={project.amount} isDarkMode={isDarkMode} onPay={onPaymentComplete} label="Unlock Collection" size="large" />
					</div>
				) : null}
			</div>

			<div className={`h-14 flex-shrink-0 border-t ${isDarkMode ? 'border-white/5 bg-cosmic' : 'border-zinc-200 bg-[#FDFDFD]'} flex items-center justify-between px-6 md:px-10`}>
				<div className={`text-xs uppercase font-bold tracking-widest ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>SCROLL TO EXPLORE</div>
				<div className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-black'}`}>{isLocked ? `${files.length} ITEMS LOCKED` : `${files.length} ITEMS`}</div>
			</div>
		</div>
	);
};

export const LayoutDeck: React.FC<LayoutProps> = ({
project,
files,
isLocked,
isDarkMode,
onAssetClick,
onRequestCorrection,
onPaymentComplete,
creatorName,
canVerifyManualPayment,
isEmbedded,
revisions = [],
}) => {
const [openSettlementAssetId, setOpenSettlementAssetId] = useState<string | null>(null);
if (!files.length) return <div className="p-12 text-center text-sm opacity-70">No assets available</div>;

return (
<div className={`relative w-full h-full min-h-0 overflow-hidden ${isDarkMode ? `${DARK_LAYOUT_ROOT_BG} text-white` : 'text-zinc-900'} flex flex-col font-sans`}>
<div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain snap-y snap-proximity md:snap-mandatory custom-scrollbar relative touch-pan-y">
{files.map((asset, i) => {
const assetHasRevisions = hasRevisions(asset.id, revisions);
const isSettlementOpen = openSettlementAssetId === asset.id;
return (
<section key={asset.id} className="snap-start w-full h-full min-h-full min-w-0 flex flex-col lg:flex-row group">
<div className={`w-full lg:w-1/2 h-1/2 lg:h-full min-h-0 p-6 md:p-10 lg:p-12 flex flex-col justify-center ${isDarkMode ? 'lg:border-r border-white/5' : 'lg:border-r border-zinc-200'}`}>
<div className="flex items-center gap-2 mb-auto">
<div className={`w-6 border-b ${isDarkMode ? 'border-white/30' : 'border-black/30'}`} />
<span className={`text-xs font-bold uppercase tracking-[0.16em] ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
{String(i + 1).padStart(2, '0')}
</span>
{assetHasRevisions && <span className="ml-2 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />}
</div>

<div className="my-auto lg:mt-32">
<h2 className="text-4xl md:text-5xl lg:text-6xl font-serif text-balance leading-[1.1] mb-8">{asset.name}</h2>

<div className="space-y-4 max-w-sm">
<SpecsAlwaysPanel asset={asset} isDarkMode={isDarkMode} />
<div className={`flex justify-between items-center pb-2 border-b text-xs ${isDarkMode ? 'border-white/10' : 'border-black/10'}`}>
<span className={isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}>Status</span>
<span className={`font-bold ${isLocked ? 'text-amber-400' : 'text-zinc-400'}`}>{isLocked ? 'Locked' : 'Unlocked'}</span>
</div>
</div>
</div>

<div className="mt-auto pt-8">
<div className="flex items-center gap-4 flex-wrap">
<button type="button" onClick={() => onAssetClick(i)} className={`inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] transition-transform hover:translate-x-2 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
Inspect Fullscreen <ArrowLeft className="w-4 h-4 rotate-180" />
</button>
{onRequestCorrection ? (
<button
type="button"
onClick={() => onRequestCorrection(i)}
className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] border-b pb-1 transition-colors ${isDarkMode ? 'border-zinc-500 text-zinc-400 hover:text-white hover:border-white' : 'border-zinc-400 text-zinc-600 hover:text-zinc-900 hover:border-zinc-900'}`}
>
<MessageSquarePlus className="w-3.5 h-3.5" />
Request Correction
</button>
) : null}
</div>
{isLocked && onPaymentComplete ? (
<div className={`mt-6 pt-5 border-t max-w-sm ${isDarkMode ? 'border-white/10' : 'border-black/10'}`}>
<p className={`text-xs font-bold uppercase tracking-[0.16em] ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Settlement</p>
<div className="mt-1 flex items-center justify-between gap-3">
<div>
<p className={`text-2xl font-serif leading-none ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>${project.amount.toLocaleString()}</p>
<p className={`mt-1 text-xs font-bold uppercase tracking-[0.16em] ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Total Due</p>
</div>
<button
type="button"
onClick={() => setOpenSettlementAssetId((prev) => prev === asset.id ? null : asset.id)}
aria-expanded={isSettlementOpen}
className={`h-9 md:h-10 px-4 md:px-5 rounded-xl text-xs font-bold uppercase tracking-[0.16em] transition-colors flex items-center gap-2 ${isDarkMode ? 'bg-lime-400 text-zinc-950 hover:bg-lime-400' : 'bg-zinc-900 text-white hover:bg-zinc-800'}`}
>
<CreditCard className="w-3.5 h-3.5" />
{project.requiresSignature ? (isSettlementOpen ? 'Hide Sign / Pay' : 'Sign / Pay') : (isSettlementOpen ? 'Hide Payment' : 'Pay / Unlock')}
</button>
</div>
{isSettlementOpen ? (
<div className={`mt-4 rounded-2xl border p-3 ${isDarkMode ? 'border-white/10 bg-black/20' : 'border-zinc-200 bg-white/30 border-zinc-200/40 backdrop-blur-md'}`}>
<LayoutInlineTerminal
project={project}
isDarkMode={isDarkMode}
isEmbedded={isEmbedded}
creatorName={creatorName}
canVerifyManualPayment={canVerifyManualPayment}
onPaymentComplete={onPaymentComplete}
/>
</div>
) : null}
</div>
) : null}
</div>
</div>

<button type="button" onClick={() => onAssetClick(i)} className="w-full lg:w-1/2 h-1/2 lg:h-full relative cursor-pointer overflow-hidden bg-black group-hover:bg-zinc-900 transition-colors rounded-t-3xl lg:rounded-t-none lg:rounded-r-3xl">
{asset.previewUrl ? (
<img src={asset.previewUrl} className={`w-full h-full object-cover ${SHARP_PREVIEW_CLASS} transition-transform duration-[1.5s] group-hover:scale-[1.02] ${asset.locked && isLocked ? 'opacity-90' : 'opacity-100'} ${isDarkMode ? '' : 'brightness-95 group-hover:brightness-100'}`} />
) : (
<div className="w-full h-full flex items-center justify-center bg-black/10">{getFileIcon(asset.type)}</div>
)}
{asset.locked && isLocked && (
<div className="absolute inset-0 bg-black/18 transition-colors group-hover:bg-black/10" />
)}
</button>
</section>
);
})}
</div>

<div className={`h-12 flex-shrink-0 border-t ${isDarkMode ? 'border-white/10 bg-cosmic' : 'border-zinc-200 bg-[#FDFDFD]'} flex items-center justify-between px-6 md:px-8`}>
<div className={`text-xs font-bold uppercase tracking-[0.16em] ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>SCROLL TO EXPLORE</div>
<div className={`text-xs font-bold uppercase tracking-[0.16em] ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
{isLocked ? `${files.length} ITEMS LOCKED` : `${files.length} ITEMS`}
</div>
</div>
</div>
);
};

export const LayoutModeler: React.FC<LayoutProps> = ({
	project,
	files,
	isLocked,
	isDarkMode,
	onAssetClick,
	onPaymentComplete,
}) => {
	const [activeIndex, setActiveIndex] = useState(0);
	const [rotation, setRotation] = useState({ x: 12, y: -18 });
	const active = files[activeIndex] || files[0];
	if (!active) return <div className="p-12 text-center text-sm opacity-70">No assets available</div>;

	return (
		<div className={`relative w-full min-h-full overflow-hidden font-mono ${isDarkMode ? `${DARK_LAYOUT_ROOT_BG} text-zinc-200` : 'text-zinc-800'}`}>
			<div className={`h-12 border-b px-4 flex items-center justify-between backdrop-blur-xl ${isDarkMode ? 'bg-[#0f1118]/80 border-white/10 shadow-[0_8px_18px_-10px_rgba(0,0,0,0.8)]' : 'bg-white/30 border-zinc-200/40 shadow-[0_8px_18px_-12px_rgba(0,0,0,0.24)]'}`}>
				<div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
					<Monitor className="w-4 h-4 text-lime-400" /> Modeler View
				</div>
				<div className="text-xs uppercase tracking-widest text-zinc-500">{project.name}</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] min-h-[clamp(460px,72vh,820px)]">
				<div
					className="relative overflow-hidden flex items-center justify-center"
					onMouseMove={(e) => {
						const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
						const x = (e.clientX - rect.left) / rect.width - 0.5;
						const y = (e.clientY - rect.top) / rect.height - 0.5;
						setRotation({ x: y * 24, y: -x * 24 });
					}}
				>
					<div className={`absolute inset-0 ${isDarkMode ? 'opacity-20' : 'opacity-35'} bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:32px_32px]`} />
					<button
						type="button"
						onClick={() => onAssetClick(activeIndex)}
						className="relative w-[min(88%,560px)] h-[min(72%,460px)] transition-transform duration-150"
						style={{ transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)` }}
					>
						{active.previewUrl ? <img src={active.previewUrl} className={`w-full h-full object-contain drop-shadow-[0_24px_48px_rgba(0,0,0,0.6)] ${active.locked && isLocked ? 'opacity-75' : 'brightness-105'} transition-all`} /> : <div className="w-full h-full flex items-center justify-center">{getFileIcon(active.type)}</div>}
						<div className="absolute inset-0 rounded-2xl border border-white/10 pointer-events-none" />
					</button>
				</div>

				<aside className={`border-l p-4 md:p-5 flex flex-col gap-4 ${isDarkMode ? 'border-white/10 bg-transparent' : 'border-zinc-200 bg-transparent'}`}>
					<div>
						<p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Scene Outliner</p>
						<div className="space-y-2.5">
							{files.map((asset, i) => (
								<div key={asset.id} className={`rounded-lg p-2 ${isDarkMode ? 'bg-white/[0.03]' : 'bg-zinc-50'}`}>
									<button
										type="button"
										onClick={() => { setActiveIndex(i); playClick(); }}
										className={`w-full text-left px-2 py-1.5 rounded-md text-xs transition-colors ${i === activeIndex ? 'bg-lime-400/20 text-blue-300' : (isDarkMode ? 'text-zinc-300 hover:bg-white/5' : 'text-zinc-700 hover:bg-zinc-100')}`}
									>
										{asset.name}
									</button>
									<div className="mt-2">
										<SpecsDropdown
											asset={asset}
											isDarkMode={isDarkMode}
											label="Node Specs"
											summaryClassName={isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}
											panelClassName={`rounded-md p-2 ${isDarkMode ? 'bg-black/20' : 'bg-white'}`}
											textClassName={isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}
										/>
									</div>
								</div>
							))}
						</div>
					</div>
					<div className={`rounded-xl border p-3 ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-zinc-200 bg-zinc-50'}`}>
						<SpecsDropdown
							asset={active}
							isDarkMode={isDarkMode}
							label="Active Specs"
							summaryClassName={isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}
							panelClassName={`rounded-lg p-2.5 ${isDarkMode ? 'bg-black/20' : 'bg-white'}`}
						/>
						<div className={`mt-2 text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>
							{isLocked ? 'Preview Locked' : 'Preview Unlocked'}
						</div>
					</div>
					<button type="button" onClick={() => onAssetClick(activeIndex)} className={`w-full h-10 rounded-xl border text-xs font-bold uppercase tracking-wider transition-colors ${isDarkMode ? 'border-white/15 hover:bg-white/10' : 'border-zinc-300 hover:bg-zinc-100'}`}>Open Selected</button>
					{isLocked && onPaymentComplete ? <LayoutPaymentCard amount={project.amount} isDarkMode={isDarkMode} onPay={onPaymentComplete} label="Unlock Assets" /> : null}
				</aside>
			</div>
		</div>
	);
};

export const LayoutStudio: React.FC<LayoutProps> = ({
	project,
	files,
	isLocked,
	isDarkMode,
	onAssetClick,
	onPaymentComplete,
}) => {
	const [isPlaying, setIsPlaying] = useState(false);
	const tracks = files.slice(0, 5);
	const trackColor = (_asset: FileAsset, i: number) => {
		const palette = ['bg-lime-300', 'bg-orange-400', 'bg-violet-400', 'bg-cyan-400', 'bg-pink-400'];
		return palette[i % palette.length];
	};

	return (
		<div className={`relative w-full min-h-full overflow-hidden ${isDarkMode ? `${DARK_LAYOUT_ROOT_BG} text-white` : 'text-zinc-900'}`}>
			<div className={`h-18 border-b px-4 sm:px-6 py-4 flex items-center justify-between gap-4 backdrop-blur-xl ${isDarkMode ? 'bg-[#10141f]/75 border-white/10 shadow-[0_10px_22px_-12px_rgba(0,0,0,0.8)]' : 'bg-white/30 border-zinc-200/40 shadow-[0_8px_18px_-12px_rgba(0,0,0,0.25)]'}`}>
				<div>
					<p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Studio Console</p>
					<h2 className="text-xl font-serif">{project.name}</h2>
				</div>
				<button type="button" onClick={() => setIsPlaying((p) => !p)} className="w-12 h-12 rounded-full bg-lime-400 text-white hover:bg-lime-300 flex items-center justify-center">
					{isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
				</button>
			</div>

			<div className="p-4 sm:p-5 md:p-6 space-y-3">
				{tracks.length ? tracks.map((asset, i) => (
					<button
						key={asset.id}
						type="button"
						onClick={() => onAssetClick(i)}
						className={`w-full h-24 rounded-2xl border transition-colors flex overflow-hidden group ${isDarkMode ? 'border-white/10 bg-white/5 hover:bg-white/10' : 'border-zinc-200 bg-white hover:bg-zinc-50'}`}
					>
						<div className={`w-36 sm:w-48 lg:w-56 border-r p-3 sm:p-4 text-left ${isDarkMode ? 'border-white/10' : 'border-zinc-200'}`}>
							<div className="flex items-center gap-2 mb-1">
								<span className={`w-2 h-2 rounded-full ${trackColor(asset, i)} ${isPlaying ? 'animate-pulse' : ''}`} />
								<p className="text-sm font-bold truncate">{asset.name}</p>
							</div>
							<div className="mt-2" onClick={(e) => e.stopPropagation()}>
								<SpecsDropdown
									asset={asset}
									isDarkMode={isDarkMode}
									label="Track Specs"
									summaryClassName="text-zinc-500"
									panelClassName={`rounded-lg p-2 ${isDarkMode ? 'bg-black/20' : 'bg-zinc-100'}`}
									textClassName={isDarkMode ? 'text-zinc-300' : 'text-zinc-600'}
								/>
							</div>
						</div>
						<div className="flex-1 px-3 flex items-center gap-1">
							{Array.from({ length: 48 }, (_, idx) => 14 + ((idx * 37 + i * 19) % 72)).map((h, idx) => (
								<div key={`${asset.id}-${idx}`} className={`flex-1 rounded-full ${trackColor(asset, i)} transition-all duration-300 group-hover:opacity-100 opacity-85 ${isPlaying ? 'origin-bottom scale-y-105' : ''}`} style={{ height: `${h}%` }} />
							))}
						</div>
					</button>
				)) : (
					<div className={`h-32 rounded-2xl border flex items-center justify-center text-sm text-zinc-400 ${isDarkMode ? 'border-white/10' : 'border-zinc-200'}`}>No assets available</div>
				)}
			</div>

			{isLocked && onPaymentComplete ? (
				<div className="p-6 pt-0 max-w-md mx-auto w-full">
					<LayoutPaymentCard amount={project.amount} isDarkMode={isDarkMode} onPay={onPaymentComplete} label="Unlock Master Files" />
				</div>
			) : null}
		</div>
	);
};


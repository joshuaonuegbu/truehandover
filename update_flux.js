
const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "components", "DesignShowcaseHiFi.tsx");
let content = fs.readFileSync(filePath, "utf8");

const newFluxVariant = `
const FluxVariant = ({ activeSection }: { activeSection: string }) => {
    const { projects, user } = useStore();
    const paidCount = useMemo(() => projects.filter(p => p.status === "paid").length, [projects]);
    const awaitingCount = useMemo(() => projects.filter(p => p.status === "awaiting_payment").length, [projects]);
    const activeCount = useMemo(() => projects.filter(p => p.status === "completed").length, [projects]);
    const totalCount = projects.length || 1;
    const totalRevenue = useMemo(() => projects.reduce((s, p) => s + (p.amount || 0), 0), [projects]);
    const paidRevenue = useMemo(() => projects.filter(p => p.status === "paid").reduce((s, p) => s + (p.amount || 0), 0), [projects]);
    const pendingRevenue = useMemo(() => projects.filter(p => p.status === "awaiting_payment").reduce((s, p) => s + (p.amount || 0), 0), [projects]);
    const completionRate = useMemo(() => Math.min(100, Math.round((paidCount / totalCount) * 100)), [paidCount, totalCount]);
    const runPct = useMemo(() => Math.min(95, Math.round((paidCount / totalCount) * 100)), [paidCount, totalCount]);
    const workoutPct = useMemo(() => Math.min(95, Math.round((awaitingCount / totalCount) * 100) || 10), [awaitingCount, totalCount]);
    const walkPct = useMemo(() => Math.max(5, 100 - runPct - workoutPct), [runPct, workoutPct]);

    const [fluxSection, setFluxSection] = React.useState<string>("dashboard");
    const [isDark, setIsDark] = React.useState(true);

    const bgMain = isDark ? "#111111" : "#F8FAFC";
    const bgCard = isDark ? "#1A1A1A" : "#FFFFFF";
    const bgSidebar = isDark ? "#161616" : "#E2E8F0";
    const textMain = isDark ? "text-white" : "text-slate-900";
    const textMuted = isDark ? "text-gray-500" : "text-slate-500";
    const borderMuted = isDark ? "border-white/5" : "border-slate-200";

    const accentLime = "#D9F99D";
    const accentPurple = "#C4B5FD";
    
    const statusColor = (s: string) => s === "paid" ? (isDark ? "#D9F99D" : "#65a30d") : s === "awaiting_payment" ? "#fbbf24" : s === "completed" ? (isDark ? "#C4B5FD" : "#7c3aed") : (isDark ? "#475569" : "#94a3b8");
    const statusLabel = (s: string) => s === "paid" ? "Paid" : s === "awaiting_payment" ? "Awaiting" : s === "completed" ? "Completed" : "Draft";

    const NavItem = ({ icon: Icon, label, count, active, onClick }: any) => (
        <div onClick={onClick} className={\`flex items-center gap-4 px-4 py-3 cursor-pointer group rounded-[20px] transition-all mb-1 \${active ? (isDark ? "bg-white text-black font-bold shadow-[0_0_20px_rgba(255,255,255,0.1)]" : "bg-white text-black font-bold shadow-md") : (isDark ? "text-gray-400 font-medium hover:bg-[#2A2A2A] hover:text-white" : "text-slate-500 font-medium hover:bg-white/60 hover:text-black")}\`}>
            <Icon className="w-5 h-5" />
            <span className="flex-1">{label}</span>
            {count && <span className={\`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center \${active ? (isDark ? "bg-black text-white" : "bg-slate-900 text-white") : (isDark ? "bg-[#D9F99D] text-black shadow-[0_0_10px_rgba(217,249,157,0.4)]" : "bg-[#D9F99D] text-black shadow-sm")}\`}>{count}</span>}
        </div>
    );

    return (
        <div className="flex w-full h-full font-sans overflow-hidden rounded-[24px] transition-colors duration-500" style={{ background: bgMain }}>
            {/* Sidebar */}
            <div className={\`w-[280px] shrink-0 p-6 flex flex-col rounded-r-[40px] border-r \${borderMuted} transition-colors\`} style={{ background: bgSidebar }}>
                <div className="flex items-center justify-between mb-12 px-2">
                    <div className="flex items-center gap-3">
                        <div className={\`w-10 h-10 rounded-xl flex items-center justify-center \${isDark ? "bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)]" : "bg-slate-900 text-white shadow-lg"}\`}>
                            <Zap className="w-6 h-6 fill-current" />
                        </div>
                        <span className={\`\${textMain} text-xl font-bold tracking-tight\`}>TrueHandover</span>
                    </div>
                </div>

                <div className="space-y-1 flex-1">
                    <NavItem icon={LayoutDashboard} label="Dashboard" count={String(totalCount)} active={fluxSection === "dashboard"} onClick={() => setFluxSection("dashboard")} />
                    <NavItem icon={Lock} label="Project Vault" count={awaitingCount > 0 ? String(awaitingCount) : undefined} active={fluxSection === "vault"} onClick={() => setFluxSection("vault")} />
                    <NavItem icon={Wallet} label="Invoices & Pay" active={fluxSection === "invoices"} onClick={() => setFluxSection("invoices")} />
                    <NavItem icon={Cloud} label="Storage Gateway" active={fluxSection === "storage"} onClick={() => setFluxSection("storage")} />
                    <NavItem icon={Activity} label="Activity Log" active={fluxSection === "activity"} onClick={() => setFluxSection("activity")} />
                    <NavItem icon={BarChart3} label="Reports" active={fluxSection === "reports"} onClick={() => setFluxSection("reports")} />
                    <NavItem icon={Settings} label="Settings" active={fluxSection === "settings"} onClick={() => setFluxSection("settings")} />
                </div>

                {/* Theme Toggle & Upgrade */}
                <div className="mt-8 flex flex-col gap-4">
                    <div className={\`flex items-center justify-between px-4 py-3 rounded-[20px] cursor-pointer \${isDark ? "bg-[#1A1A1A] hover:bg-[#2A2A2A]" : "bg-white hover:bg-slate-50"} transition-colors shadow-sm\`} onClick={() => setIsDark(!isDark)}>
                        <span className={\`text-sm font-bold \${textMain}\`}>{isDark ? "Dark Mode" : "Light Mode"}</span>
                        {isDark ? <Moon className="w-4 h-4 text-[#D9F99D]" /> : <Sun className="w-4 h-4 text-orange-400" />}
                    </div>
                    <div className="bg-[#D9F99D] rounded-[32px] p-6 relative overflow-hidden group cursor-pointer hover:shadow-[0_0_20px_rgba(217,249,157,0.3)] transition-shadow">
                        <div className="absolute -right-4 top-12 w-24 h-24 bg-[#a3e635] rounded-full blur-2xl opacity-60" />
                        <p className="font-bold text-lg text-black mb-1 relative z-10">Pro Gateway</p>
                        <p className="text-xs text-black/70 mb-4 leading-tight relative z-10 pr-4">Unlock advanced storage & zero-fee payments.</p>
                        <button className="w-full py-3 bg-[#1A1A1A] text-white rounded-xl text-xs font-bold hover:scale-[1.02] transition-transform relative z-10 shadow-lg">Upgrade Now</button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-10 overflow-y-auto w-full transition-colors relative">
                {/* Header */}
                <div className="flex justify-between items-start mb-10">
                    <div className="flex items-center gap-4 group cursor-pointer z-10">
                        <div className="relative">
                            <Avatar src={user.avatar || \`https://api.dicebear.com/7.x/avataaars/svg?seed=\${user.name}\`} className={\`w-14 h-14 border-2 \${isDark ? "border-[#1A1A1A] group-hover:border-[#D9F99D]" : "border-white shadow-md group-hover:border-lime-500"} transition-colors\`} />
                            <div className={\`absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 \${isDark ? "border-[#111]" : "border-[#F8FAFC]"}\`} />
                        </div>
                        <div>
                            <h2 className={\`font-bold text-xl \${textMain} flex items-center gap-2 group-hover:text-lime-500 transition-colors\`}>{user.name} <ChevronDown className="w-4 h-4" /></h2>
                            <p className={\`text-sm \${textMuted}\`}>{user.email}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 z-10">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-lime-500 transition-colors" />
                            <input type="text" placeholder="Search operations..." className={\`pl-10 pr-4 py-3.5 \${bgCard} rounded-full text-sm w-60 shadow-inner \${textMain} placeholder:\${textMuted} focus:outline-none focus:ring-1 focus:ring-lime-500 transition-all border \${borderMuted}\`} />
                        </div>
                        <button className={\`\${bgCard} w-12 h-12 rounded-full flex items-center justify-center \${textMain} hover:text-lime-500 transition-colors relative border \${borderMuted} shadow-sm\`}>
                            <Bell className="w-5 h-5" />
                            {awaitingCount > 0 && <span className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full" />}
                        </button>
                    </div>
                </div>

                {/* -- Dashboard -- */}
                {fluxSection === "dashboard" && (<>
                    <div className="flex justify-between items-end mb-8 relative z-10">
                        <div>
                            <h1 className={\`text-5xl font-bold tracking-tight mb-2 \${textMain}\`}>Business Overview</h1>
                            <p className={\`\${textMuted} font-medium\`}>Your creative studio, at a glance</p>
                        </div>
                        <button className="bg-[#D9F99D] text-black px-5 py-2.5 rounded-full text-sm font-bold shadow-[0_0_20px_rgba(217,249,157,0.3)] flex items-center gap-2 hover:scale-105 transition-transform">
                            <Plus className="w-4 h-4" /> New Handover
                        </button>
                    </div>
                    <div className="grid grid-cols-3 gap-6 mb-6 relative z-10">
                        {/* Revenue Bubble Card */}
                        <div className={\`\${bgCard} rounded-[48px] p-8 shadow-xl col-span-1 min-h-[320px] flex flex-col relative overflow-hidden border \${borderMuted}\`}>
                            <div className="flex justify-between items-center mb-4 z-10">
                                <div className={\`flex items-center gap-2 \${textMain}\`}>
                                    <div className={\`p-2 \${isDark ? "bg-white/5" : "bg-slate-100"} rounded-full\`}><DollarSign className={\`w-4 h-4 \${isDark ? "text-[#D9F99D]" : "text-lime-600"}\`} /></div>
                                    <span className="font-bold text-sm">Revenue</span>
                                </div>
                                <MoreHorizontal className="w-5 h-5 text-gray-400" />
                            </div>
                            <div className="z-10">
                                <span className={\`text-4xl font-bold bg-clip-text text-transparent \${isDark ? "bg-gradient-to-r from-[#D9F99D] to-white" : "bg-gradient-to-r from-lime-600 to-slate-900"}\`}>\${Math.round(totalRevenue / 1000)}k</span>
                                <span className={\`text-xs \${isDark ? "text-[#D9F99D]" : "text-lime-600"} font-bold ml-2\`}>{paidCount} paid</span>
                            </div>
                            <div className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 w-full h-[200px]">
                                <div className="absolute top-0 right-8 w-36 h-36 rounded-full bg-[#C4B5FD] flex items-center justify-center flex-col animate-pulse cursor-pointer hover:scale-105 transition-transform shadow-lg">
                                    <span className="font-bold text-xl text-black">\${Math.round(paidRevenue / 1000)}k</span>
                                    <span className="text-[10px] uppercase font-bold text-black/60">paid</span>
                                </div>
                                <div className={\`absolute top-10 left-4 w-24 h-24 rounded-full \${bgMain} flex items-center justify-center flex-col \${textMain} border-4 \${isDark ? "border-[#111]" : "border-[#F8FAFC]"} shadow-xl cursor-pointer hover:scale-105 transition-transform\`}>
                                    <span className="font-bold text-base">{totalCount}</span>
                                    <span className={\`text-[10px] uppercase font-bold \${isDark ? "text-white/50" : "text-slate-400"}\`}>projects</span>
                                </div>
                                <div className={\`absolute top-32 left-24 w-20 h-20 rounded-full bg-[#D9F99D] flex items-center justify-center flex-col border-4 \${isDark ? "border-[#111]" : "border-[#F8FAFC]"} shadow-lg cursor-pointer hover:scale-105 transition-transform\`}>
                                    <span className="font-bold text-base text-black">{awaitingCount}</span>
                                    <span className="text-[10px] uppercase font-bold text-black/50">pending</span>
                                </div>
                            </div>
                        </div>
                        {/* Mid column */}
                        <div className="col-span-1 grid grid-rows-2 gap-6">
                            <div className={\`\${isDark ? "bg-white text-black" : "bg-white text-slate-900"} rounded-[40px] p-7 shadow-lg flex flex-col justify-between\`}>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-lime-50 rounded-full"><Briefcase className="w-5 h-5 text-lime-600" /></div>
                                        <span className="font-bold text-sm">Active Vaults</span>
                                    </div>
                                    <MoreHorizontal className="w-5 h-5 text-gray-300" />
                                </div>
                                <div className="flex items-end justify-between">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-5xl font-bold tracking-tighter">{totalCount}</span>
                                        <span className="text-sm text-gray-400 font-bold mb-1">total</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs font-bold text-gray-900 block">{awaitingCount} locked</span>
                                        <span className="text-xs text-gray-500">{paidCount} complete</span>
                                    </div>
                                </div>
                                <div className="h-8 w-full mt-2 flex items-end gap-1 overflow-hidden opacity-50">
                                    {[3, 5, 4, 7, 4, 6, 3, 5, 8, 4, 3, 5, 6, 3, 4, 6].map((h, i) => <div key={i} className="w-full rounded-t-sm" style={{ height: h * 6 + "%", background: "#65a30d" }} />)}
                                </div>
                            </div>
                            <div className={\`\${bgCard} rounded-[40px] p-7 shadow-xl flex flex-col justify-between border \${borderMuted}\`}>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className={\`p-2 \${isDark ? "bg-white/5" : "bg-slate-100"} rounded-full\`}><TrendingUp className={\`w-5 h-5 \${isDark ? "text-[#D9F99D]" : "text-lime-600"}\`} /></div>
                                        <span className={\`font-bold text-sm \${textMain}\`}>Release Rate</span>
                                    </div>
                                    <MoreHorizontal className="w-5 h-5 text-gray-400" />
                                </div>
                                <div className="flex items-end justify-between">
                                    <div className={\`flex items-baseline gap-1 \${textMain}\`}>
                                        <span className="text-5xl font-bold tracking-tighter">{completionRate}</span>
                                        <span className="text-sm text-gray-400 font-bold mb-1">%</span>
                                    </div>
                                    <div className="text-right">
                                        <span className={\`text-xs font-bold \${textMain} block\`}>{activeCount} released</span>
                                        <span className="text-xs text-gray-400">{totalCount} handovers</span>
                                    </div>
                                </div>
                                <div className={\`w-full h-1.5 \${isDark ? "bg-gray-800" : "bg-slate-200"} rounded-full mt-2 overflow-hidden\`}>
                                    <div className={\`h-full \${isDark ? "bg-gradient-to-r from-[#D9F99D] to-[#84cc16] shadow-[0_0_10px_#D9F99D]" : "bg-gradient-to-r from-lime-400 to-lime-600"}\`} style={{ width: \`\${completionRate}%\` }} />
                                </div>
                            </div>
                        </div>
                        {/* Storage Health dot matrix */}
                        <div className={\`\${bgCard} rounded-[48px] p-8 shadow-xl col-span-1 flex flex-col justify-between border \${borderMuted}\`}>
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-3">
                                    <span className={\`font-bold \${isDark ? "bg-[#333]" : "bg-slate-100"} w-8 h-8 rounded-xl flex items-center justify-center text-xs \${isDark ? "text-[#D9F99D]" : "text-lime-600"}\`}>GB</span>
                                    <span className={\`font-bold text-sm \${textMain}\`}>Storage Limits</span>
                                </div>
                                <MoreHorizontal className="w-5 h-5 text-gray-400" />
                            </div>
                            <div className="flex items-baseline gap-2 mb-4">
                                <span className={\`text-6xl font-bold \${textMain} tracking-tighter\`}>45</span>
                                <span className="text-xl text-gray-400 font-bold">%</span>
                                <span className={\`ml-2 \${isDark ? "bg-[#D9F99D]" : "bg-lime-200"} text-black px-2.5 py-1 rounded-lg text-[10px] font-bold\`}>9.0/15 GB</span>
                            </div>
                            <div className="grid grid-cols-8 gap-y-2 gap-x-3 h-28 items-end pb-2">
                                {[runPct, workoutPct, walkPct, runPct, workoutPct, walkPct, runPct, workoutPct].map((val, i) => {
                                    const filled = Math.round((val / 100) * 8);
                                    return (
                                        <div key={i} className="flex flex-col gap-1.5 items-center">
                                            {Array.from({ length: 8 }).map((_, j) => (
                                                <div key={j} className={\`w-2.5 h-2.5 rounded-full \${8 - j <= filled ? (isDark ? "bg-[#C4B5FD] shadow-[0_0_5px_#C4B5FD]" : "bg-purple-500 shadow-sm") : (isDark ? "bg-[#2A2A2A]" : "bg-slate-200")}\`} />
                                            ))}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                    {/* Bottom row */}
                    <div className="grid grid-cols-3 gap-6 relative z-10">
                        <div className={\`col-span-1 \${isDark ? "bg-white text-black" : "bg-white text-slate-900"} rounded-[48px] p-8 shadow-xl flex flex-col justify-between\`}>
                            {[["Drive", runPct, "bg-[#C4B5FD] shadow-[0_0_10px_#C4B5FD]"], ["Dropbox", workoutPct, "bg-black"], ["Native", walkPct, "bg-[#D9F99D] shadow-[0_0_10px_#D9F99D]"]].map(([l, pct, cls], i) => (
                                <div key={i} className="mb-4 last:mb-0 group cursor-pointer">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-3xl font-bold tracking-tight">{pct}<span className="text-lg text-gray-400 ml-1">%</span></span>
                                        <span className="text-xs font-bold flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-full uppercase">{l} <div className={\`w-2 h-2 rounded-full \${cls}\`} /></span>
                                    </div>
                                    <div className="w-full h-4 rounded-full bg-slate-100 overflow-hidden">
                                        <div className={\`h-full rounded-full \${cls}\`} style={{ width: \`\${pct}%\` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className={\`col-span-2 \${bgCard} rounded-[48px] p-10 \${textMain} flex flex-col border \${borderMuted} shadow-xl overflow-hidden relative\`}>
                            <div className={\`absolute top-0 right-0 w-64 h-64 blur-3xl rounded-full pointer-events-none \${isDark ? "bg-slate-800/20" : "bg-slate-200/50"}\`} />
                            <div className="flex justify-between items-center mb-6 relative z-10">
                                <span className="font-bold text-lg">Project Revenue</span>
                                <div className={\`px-4 py-2 border \${borderMuted} rounded-full text-xs font-bold flex gap-2 items-center cursor-pointer \${isDark ? "hover:bg-white/5" : "hover:bg-slate-50"}\`}>All Time <ChevronDown className="w-3 h-3 text-gray-400" /></div>
                            </div>
                            <div className="flex gap-12 mb-6 relative z-10">
                                <div>
                                    <h3 className={\`text-4xl font-bold bg-clip-text text-transparent \${isDark ? "bg-gradient-to-r from-[#D9F99D] to-white" : "bg-gradient-to-r from-lime-600 to-slate-900"}\`}>\${Math.round(paidRevenue / 1000)}k</h3>
                                    <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">Collected</p>
                                </div>
                                <div>
                                    <h3 className={\`text-4xl font-bold bg-clip-text text-transparent \${isDark ? "bg-gradient-to-r from-[#C4B5FD] to-white" : "bg-gradient-to-r from-purple-600 to-slate-900"}\`}>\${Math.round(pendingRevenue / 1000)}k</h3>
                                    <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">Pending</p>
                                </div>
                            </div>
                            <div className="flex-1 flex items-end justify-between gap-4 h-32 relative z-10">
                                {projects.slice(0, 8).map((p, i) => {
                                    const maxAmt = Math.max(...projects.map(x => x.amount || 1), 1);
                                    const h = Math.max(10, Math.round(((p.amount || 0) / maxAmt) * 100));
                                    const gradDark = "bg-gradient-to-t from-[#D9F99D] to-[#efffcc] shadow-[0_0_20px_rgba(217,249,157,0.3)]";
                                    const gradLight = "bg-gradient-to-t from-lime-400 to-lime-200 shadow-md";
                                    return (
                                        <div key={p.id} className="flex-1 flex flex-col items-center gap-2 cursor-pointer">
                                            <div className={\`w-full rounded-t-xl transition-all \${p.status === "paid" ? (isDark ? gradDark : gradLight) : (isDark ? "bg-[#252525] hover:bg-[#333]" : "bg-slate-200 hover:bg-slate-300")}\`} style={{ height: \`\${h}%\` }} />
                                            <span className="text-[9px] uppercase font-bold text-gray-400 truncate max-w-full">{p.name.slice(0, 4)}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </>)}

                {/* -- Vault -- */}
                {fluxSection === "vault" && (<>
                    <div className="flex justify-between items-end mb-8 relative z-10">
                        <div>
                            <h1 className={\`text-5xl font-bold tracking-tight mb-2 \${textMain}\`}>Project Vault</h1>
                            <p className={\`\${textMuted} font-medium\`}>All your client deliverables, secured</p>
                        </div>
                        <button className="bg-[#D9F99D] text-black px-5 py-2.5 rounded-full text-sm font-bold shadow-[0_0_20px_rgba(217,249,157,0.3)] flex items-center gap-2 hover:scale-105 transition-transform">
                            <Plus className="w-4 h-4" /> New Handover
                        </button>
                    </div>
                    <div className="grid grid-cols-3 gap-5 relative z-10">
                        {projects.map((p) => {
                            const col = statusColor(p.status);
                            return (
                                <div key={p.id} className={\`\${bgCard} rounded-[40px] p-7 border \${borderMuted} cursor-pointer \${isDark ? "hover:border-[#D9F99D]/30 hover:shadow-[0_0_30px_rgba(217,249,157,0.08)]" : "hover:shadow-lg hover:border-lime-200"} transition-all relative overflow-hidden\`}>
                                    <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl pointer-events-none" style={{ background: col, opacity: isDark ? 0.1 : 0.05 }} />
                                    <div className="flex justify-between items-start mb-5 relative z-10">
                                        <div className="w-12 h-12 rounded-[18px] flex items-center justify-center font-black text-lg" style={{ background: col + "22", color: col }}>{p.name[0]}</div>
                                        <span className="text-[10px] font-bold px-3 py-1.5 rounded-full" style={{ background: col + "22", color: col }}>{statusLabel(p.status)}</span>
                                    </div>
                                    <h3 className={\`font-bold \${textMain} mb-1 text-lg leading-tight truncate\`}>{p.name}</h3>
                                    <p className="text-sm text-gray-400 mb-5">{p.client?.name || "Unknown Client"}</p>
                                    <div className="flex justify-between items-center">
                                        <span className="text-2xl font-bold" style={{ color: col }}>\${(p.amount || 0).toLocaleString()}</span>
                                        <span className="text-[10px] text-gray-400 font-mono">{p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", year: "2-digit" }) : "—"}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>)}
                
                {/* -- Invoices Mock -- */}
                {fluxSection === "invoices" && (<>
                    <div className="flex justify-between items-end mb-8 relative z-10">
                        <div>
                            <h1 className={\`text-5xl font-bold tracking-tight mb-2 \${textMain}\`}>Invoices & Pay</h1>
                            <p className={\`\${textMuted} font-medium\`}>Manage billing, receipts, and payouts</p>
                        </div>
                        <button className={\`\${isDark ? "bg-[#333] text-white" : "bg-slate-200 text-slate-900"} px-5 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 hover:scale-105 transition-transform\`}>
                            <DollarSign className="w-4 h-4" /> Connect Stripe
                        </button>
                    </div>
                    <div className={\`\${bgCard} rounded-[40px] border \${borderMuted} overflow-hidden p-16 flex flex-col items-center justify-center text-center\`}>
                       <Wallet className="w-16 h-16 text-gray-400 mb-4" />
                       <h3 className={\`text-xl font-bold \${textMain} mb-2\`}>Invoicing & Payments</h3>
                       <p className="text-sm text-gray-400 max-w-sm">Connect your Stripe account or add manual payment methods to let clients pay to unlock their assets directly on the preview link.</p>
                       <button className="mt-8 bg-[#D9F99D] text-black px-6 py-3 rounded-full text-sm font-bold shadow-[0_0_20px_rgba(217,249,157,0.3)] hover:scale-105 transition-transform">Get Paid Faster</button>
                    </div>
                </>)}

                {/* -- Storage Gateway Mock -- */}
                {fluxSection === "storage" && (<>
                    <div className="flex justify-between items-end mb-8 relative z-10">
                        <div>
                            <h1 className={\`text-5xl font-bold tracking-tight mb-2 \${textMain}\`}>Storage Gateway</h1>
                            <p className={\`\${textMuted} font-medium\`}>Bring Your Own Storage directly</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6 relative z-10">
                         {[{name:"Google Drive", icon: Cloud, col: "#3b82f6", linked: true}, {name:"Dropbox", icon: Box, col: "#0ea5e9", linked: false}, {name:"OneDrive", icon: Cloud, col: "#2563eb", linked: false}].map(d => (
                            <div key={d.name} className={\`\${bgCard} rounded-[32px] p-6 border \${borderMuted} flex items-center justify-between\`}>
                                <div className="flex items-center gap-4">
                                     <div className={\`w-12 h-12 rounded-2xl flex items-center justify-center\`}>
                                         <d.icon className="w-6 h-6" style={{ color: d.col }} />
                                     </div>
                                     <div>
                                         <h4 className={\`font-bold \${textMain}\`}>{d.name}</h4>
                                         <p className="text-xs text-gray-400">{d.linked ? "Connected • 54% used" : "Not connected"}</p>
                                     </div>
                                </div>
                                <button className={\`text-xs font-bold px-4 py-2 rounded-full \${d.linked ? (isDark ? "bg-[#333] text-white" : "bg-slate-200 text-slate-700") : "bg-blue-50 text-blue-600"}\`}>{d.linked ? "Manage" : "Connect"}</button>
                            </div>
                         ))}
                    </div>
                </>)}

                {/* -- Activity -- */}
                {fluxSection === "activity" && (<>
                    <div className="flex justify-between items-end mb-8 relative z-10">
                        <div>
                            <h1 className={\`text-5xl font-bold tracking-tight mb-2 \${textMain}\`}>Activity Log</h1>
                            <p className={\`\${textMuted} font-medium\`}>Every move, recorded in real time</p>
                        </div>
                    </div>
                    <div className={\`\${bgCard} rounded-[40px] border \${borderMuted} overflow-hidden\`}>
                        {projects.length > 0 ? projects.slice(0, 8).flatMap((p, i) => [
                            { icon: Eye, label: "Client Viewed", detail: \`\${p.client?.name || "Client"} · \${p.name}\`, time: "Just now", col: isDark ? accentLime : "#65a30d" },
                            { icon: CreditCard, label: "Payment Update", detail: \`\${p.name} · \$\${(p.amount || 0).toLocaleString()}\`, time: "1h ago", col: isDark ? accentPurple : "#7c3aed" },
                        ]).slice(0, 10).map((a, i) => (
                            <div key={i} className={\`flex items-center gap-5 p-5 border-b \${borderMuted} last:border-0 \${isDark ? "hover:bg-white/[0.03]" : "hover:bg-slate-50"} cursor-pointer transition-colors\`}>
                                <div className="w-11 h-11 rounded-[18px] flex items-center justify-center shrink-0" style={{ background: a.col + "22" }}>
                                    <a.icon className="w-5 h-5" style={{ color: a.col }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={\`text-sm font-bold \${textMain}\`}>{a.label}</p>
                                    <p className="text-xs text-gray-400 truncate">{a.detail}</p>
                                </div>
                                <span className="text-[10px] font-mono text-gray-400 shrink-0">{a.time}</span>
                                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: a.col, boxShadow: \`0 0 8px \${a.col}80\` }} />
                            </div>
                        )) : (
                            <div className="p-16 text-center">
                                <p className="text-gray-400 text-sm">No activity yet — events will appear here</p>
                            </div>
                        )}
                    </div>
                </>)}

                {/* -- Reports -- */}
                {fluxSection === "reports" && (<>
                    <div className="flex justify-between items-end mb-8 relative z-10">
                        <div>
                            <h1 className={\`text-5xl font-bold tracking-tight mb-2 \${textMain}\`}>Reports</h1>
                            <p className={\`\${textMuted} font-medium\`}>Your financial performance, visualised</p>
                        </div>
                        <button className={\`px-5 py-2.5 border \${borderMuted} rounded-full text-xs font-bold \${textMain} flex items-center gap-2 hover:bg-white/5 transition-colors\`}>
                            Export <Download className="w-3 h-3 text-gray-400" />
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-6 mb-6 relative z-10">
                        {[
                            { label: "Total Revenue", value: \`\$\${Math.round(totalRevenue / 1000)}k\`, sub: \`\${paidCount} paid projects\`, col: isDark ? accentLime : "#65a30d" },
                            { label: "Pending Collection", value: \`\$\${Math.round(pendingRevenue / 1000)}k\`, sub: \`\${awaitingCount} awaiting payment\`, col: isDark ? accentPurple : "#7c3aed" },
                        ].map(k => (
                            <div key={k.label} className={\`\${bgCard} rounded-[40px] p-8 border \${borderMuted}\`}>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">{k.label}</p>
                                <h2 className="text-5xl font-bold bg-clip-text text-transparent mb-2" style={{ backgroundImage: \`linear-gradient(to right,\${k.col},\${isDark ? "white" : "black"})\`, WebkitBackgroundClip: "text" }}>{k.value}</h2>
                                <p className="text-xs font-bold mb-5" style={{ color: k.col }}>{k.sub}</p>
                                <div className="flex items-end gap-1.5 h-16">
                                    {projects.slice(0, 8).map((p) => {
                                        const maxAmt = Math.max(...projects.map(x => x.amount || 1), 1);
                                        const h = Math.max(10, Math.round(((p.amount || 0) / maxAmt) * 100));
                                        return <div key={p.id} className="flex-1 rounded-t-xl" style={{ height: \`\${h}%\`, background: p.status === "paid" ? k.col : k.col + "20" }} />;
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </>)}

                {/* -- Settings -- */}
                {fluxSection === "settings" && (<>
                    <div className="mb-8 relative z-10">
                        <h1 className={\`text-5xl font-bold tracking-tight mb-2 \${textMain}\`}>Settings</h1>
                        <p className={\`\${textMuted} font-medium\`}>Manage your account &amp; preferences</p>
                    </div>
                    <div className="grid grid-cols-2 gap-6 relative z-10">
                        {[
                            { icon: User, label: "Profile", items: ["Display Name", "Email Address", "Avatar Photo", "Bio"] },
                            { icon: CreditCard, label: "Billing & Payments", items: ["Stripe Connect", "Bank Account", "Payout Schedule", "Invoicing"] },
                            { icon: Shield, label: "Security", items: ["Change Password", "Two-Factor Auth", "Active Sessions", "API Keys"] },
                            { icon: Bell, label: "Notifications", items: ["Email Alerts", "Payment Received", "Client Views", "Weekly Digest"] },
                        ].map(g => (
                            <div key={g.label} className={\`\${bgCard} rounded-[40px] p-7 border \${borderMuted}\`}>
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="w-10 h-10 rounded-[16px] flex items-center justify-center" style={{ background: (isDark ? accentLime : "#65a30d") + "22" }}>
                                        <g.icon className="w-5 h-5" style={{ color: isDark ? accentLime : "#65a30d" }} />
                                    </div>
                                    <p className={\`font-bold \${textMain}\`}>{g.label}</p>
                                </div>
                                <div className="space-y-1">
                                    {g.items.map((item, i) => (
                                        <div key={i} className={\`flex items-center justify-between py-2.5 px-3 rounded-2xl \${isDark ? "hover:bg-white/5" : "hover:bg-slate-50"} cursor-pointer group transition-colors\`}>
                                            <span className={\`text-sm \${textMuted} \${isDark ? "group-hover:text-white" : "group-hover:text-black"} transition-colors\`}>{item}</span>
                                            <ChevronRight className={\`w-4 h-4 text-gray-400 \${isDark ? "group-hover:text-[#D9F99D]" : "group-hover:text-lime-600"} transition-colors\`} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </>)}
            </div>
        </div>
    );
}
`;

// Extract old FluxVariant (simplified way by matching its declaration & finding the closing brace before the next component)
const startMatch = "const FluxVariant = ({ activeSection }: { activeSection: string }) => {";
const endMatch = "// --- 3. CAR RENTAL (Focus Flow / Electric Lime)";
   
const startIndex = content.indexOf(startMatch);
const endIndex = content.indexOf(endMatch);

if (startIndex !== -1 && endIndex !== -1) {
    const updatedContent = content.substring(0, startIndex) + newFluxVariant + "\n" + content.substring(endIndex);
    fs.writeFileSync(filePath, updatedContent, "utf8");
    console.log("Successfully updated FluxVariant.");
} else {
    console.log("Could not find start or end index.");
}


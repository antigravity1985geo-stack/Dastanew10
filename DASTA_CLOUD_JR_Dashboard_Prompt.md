# 🚀 DASTA CLOUD JR — Dashboard Redesign: KILLER PROMPT

---

## 🎯 კონტექსტი

შენ ხარ Senior UI/UX Engineer და React Developer.
გადააკეთე DASTA CLOUD JR-ის Dashboard — პატარა ქართული მაღაზიებისთვის გამიზნული SaaS ERP სისტემა.

**ტექ სტეკი:** React 18 + TypeScript + Tailwind CSS + Framer Motion + shadcn/ui + Recharts

---

## 🎨 ვიზუალური მიმართულება

**Aesthetic:** "Liquid Glass Dark" — Apple Vision Pro-ს შთაგონებული, Glassmorphism + Bento Grid.

- **ფონი:** `#0A0F1E` — ღრმა ნავი, მასზე animated gradient mesh (ლურჯი + მეწამული + ტეალი)
- **კარტები:** `backdrop-blur-xl`, `bg-white/5`, `border border-white/10`, `shadow-2xl`
- **აქცენტი:** `#3B82F6` (ლურჯი) + `#10B981` (მწვანე) + `#F59E0B` (ოქრო)
- **ფონტი:** `Outfit` (headings) + `Inter` (body) — Google Fonts
- **ანიმაცია:** Framer Motion — staggered card entrance, animated counters, hover glow

---

## 📐 Layout — Bento Grid სტრუქტურა

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER: "გამარჯობა, გიორგი 👋" + თარიღი + notification bell │
├──────────────┬──────────────┬──────────────┬────────────────┤
│  💰 შემოსავ. │  📦 სტოკი   │  🛒 შეკვ.   │  📈 მოგება    │
│  751.2 ₾     │  54 ერთ.    │  69.3 ₾     │  +12.4%       │
│  animated ↑  │  animated   │  animated   │  sparkline    │
├──────────────┴──────┬───────┴─────────────┴────────────────┤
│  🤖 AI INSIGHTS     │  📊 გაყიდვების გრაფიკი (7 დღე)      │
│  Glassmorphism card │  Recharts AreaChart + gradient fill  │
│  3 insight bullet   │                                      │
├─────────────────────┼────────────────────────────────────────┤
│  🔥 TOP პროდუქტები  │  ⚡ სწრაფი მოქმედებები               │
│  ranked list +      │  [+ შეკვეთა] [📦 მარაგი] [💳 გაყ.]   │
│  progress bars      │  [📊 ანგარიში] — animated buttons    │
├─────────────────────┴────────────────────────────────────────┤
│  📋 ბოლო ტრანზაქციები — scrollable table + status badges    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🃏 ოთხი მთავარი KPI ბარათი

თითოეული ბარათი უნდა იყოს:

```tsx
// მაგალითი ერთი ბარათისთვის
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: index * 0.1 }}
  whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(59,130,246,0.3)" }}
  className="relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6"
>
  {/* Glow accent — ზედა კუთხეში */}
  <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/20 rounded-full blur-2xl" />
  
  {/* Icon + Label */}
  <div className="flex items-center gap-2 text-white/50 text-sm mb-3">
    <Icon className="w-4 h-4" />
    <span>{label}</span>
  </div>
  
  {/* Animated Counter */}
  <AnimatedNumber value={751.2} suffix=" ₾" className="text-3xl font-bold text-white" />
  
  {/* Trend badge */}
  <div className="mt-2 flex items-center gap-1 text-emerald-400 text-sm">
    <TrendingUp className="w-3 h-3" />
    <span>+8.2% გუშინთან</span>
  </div>
</motion.div>
```

**4 ბარათი:**
1. 💰 გაყიდვების შემოსავალი — ლურჯი glow
2. 📦 მთლიანი სტოკი — მწვანე glow
3. 🛒 შეკვეთების ღირ. — ნარინჯისფერი glow
4. 📈 სუფთა მოგება — ოქრო glow

---

## 🤖 AI Insights ბარათი — "DASTA AI" (powered by JABSONA ამოიღე)

```tsx
// ახალი ბრენდი — მხოლოდ "DASTA AI"
<div className="rounded-2xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 
                backdrop-blur-xl border border-blue-500/20 p-6">
  
  {/* Header */}
  <div className="flex items-center gap-3 mb-4">
    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center animate-pulse">
      <Sparkles className="w-4 h-4 text-white" />
    </div>
    <div>
      <h3 className="text-white font-semibold">DASTA AI</h3>
      <p className="text-white/40 text-xs">ბიზნეს ინსაიტები • განახლდა ახლახანს</p>
    </div>
    <div className="ml-auto w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
  </div>

  {/* 3 insight — animated stagger */}
  {insights.map((insight, i) => (
    <motion.div key={i} initial={{ x: -10, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5 + i * 0.15 }}
      className="flex items-start gap-3 mb-3">
      <span className="text-lg">{insight.emoji}</span>
      <p className="text-white/70 text-sm leading-relaxed">{insight.text}</p>
    </motion.div>
  ))}
</div>
```

**3 insight-ის მაგალითი:**
- 📉 "STEREO BASS-ყურსასმენი ყველაზე მოთხოვნადია — მარაგი 12 ცალამდე შეავსე"
- ⚠️ "1 სახეობის პროდუქტი იწურება — გადაუდებელი შეკვეთა საჭიროა"
- 💡 "გუშინდელ გაყიდვებთან შედარებით +8.2% ზრდა — კარგი ტემპია!"

---

## ⚡ სწრაფი მოქმედებების ბარათი (Quick Actions)

```tsx
const actions = [
  { icon: Plus, label: "შეკვეთა", color: "blue", href: "/sales" },
  { icon: Package, label: "მარაგი", color: "emerald", href: "/inventory" },
  { icon: CreditCard, label: "გაყიდვა", color: "purple", href: "/pos" },
  { icon: BarChart2, label: "ანგარიში", color: "amber", href: "/reports" },
  { icon: Users, label: "კლიენტები", color: "pink", href: "/customers" },
  { icon: Bell, label: "Alerts", color: "red", href: "/alerts" },
]

// Grid 3x2, hover-ზე lift + glow ეფექტი
```

---

## 📊 გაყიდვების გრაფიკი

```tsx
// Recharts AreaChart — gradient fill + animated
<AreaChart data={weeklyData}>
  <defs>
    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4}/>
      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
    </linearGradient>
  </defs>
  <Area type="monotone" dataKey="sales" 
    stroke="#3B82F6" strokeWidth={2}
    fill="url(#salesGrad)" />
  <XAxis stroke="#ffffff20" tick={{ fill: '#ffffff40', fontSize: 11 }} />
  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12 }} />
</AreaChart>
```

---

## 🔥 TOP პროდუქტების ბარათი

```tsx
// Ranked list — animated progress bars
{topProducts.map((p, i) => (
  <div key={p.id} className="flex items-center gap-3 mb-3">
    <span className="text-white/30 text-xs w-4">#{i+1}</span>
    <div className="flex-1">
      <div className="flex justify-between mb-1">
        <span className="text-white/80 text-sm">{p.name}</span>
        <span className="text-white/50 text-xs">{p.revenue} ₾</span>
      </div>
      <motion.div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <motion.div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
          initial={{ width: 0 }}
          animate={{ width: `${p.percentage}%` }}
          transition={{ delay: 0.8 + i * 0.1, duration: 0.6 }} />
      </motion.div>
    </div>
  </div>
))}
```

---

## 🎭 Animated Background

```tsx
// App-ის root-ში — mesh gradient animation
<div className="fixed inset-0 -z-10 bg-[#0A0F1E]">
  {/* Animated blobs */}
  <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse" />
  <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl animate-pulse" 
       style={{ animationDelay: '2s' }} />
  <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-teal-600/10 rounded-full blur-3xl animate-pulse"
       style={{ animationDelay: '4s' }} />
</div>
```

---

## 📱 პატარა მაღაზიისთვის დასამატებელი ფუნქციები

ეს სექციები დაამატე Dashboard-ზე:

### 1. 💳 "დღის სალარო" ვიჯეტი
```
[ სალარო: ✅ ღიაა ] [ ნაღდი: 320₾ | ბარათი: 431₾ ] [ Z-Report ↓ ]
```

### 2. ⏰ "დღეს ვადაგასული / იწურება" banner
```
🔴 ყურადღება: 2 პროდუქტი 7 დღეში იწურება → [ნახვა]
```

### 3. 🏆 "დღის გამარჯვებული პროდუქტი"
```
🔥 STEREO BASS-ყურსასმენი — დღეს 8 ცალი გაიყიდა (+60% გუშინთან)
```

### 4. 📲 WhatsApp სწრაფი გაგზავნა
```
[ 📤 Z-Report WhatsApp-ით ] — ღილაკი, ერთი კლიკი
```

### 5. 🎯 "დღის მიზანი" Progress Bar
```
დღის სამიზნე: 1,000₾  ████████░░░░  751₾ (75%) — 249₾ დარჩა!
```

---

## ✅ სავალდებულო წესები

1. **"Powered by JABSONA" — ამოიღე სრულად.** მხოლოდ "DASTA AI" დარჩეს
2. **ყველა ტექსტი ქართულად** — ka-GE locale
3. **Dark theme only** — `#0A0F1E` background
4. **Framer Motion** — ყველა ბარათი animate-on-mount (stagger 0.1s)
5. **Animated counters** — რიცხვები "ითვლება" 0-დან საბოლოო მნიშვნელობამდე
6. **Hover states** — scale(1.02) + colored glow shadow ყველა ბარათზე
7. **Responsive** — Mobile-first, 1 column → 2 col → 4 col

---

## 🎬 Page Load ანიმაცია

```
1. ფონი იჩენს თავს (fade in, 0.3s)
2. Header — slide down (0.4s)
3. KPI ბარათები — stagger up, 0.1s delay თითოეული
4. AI card — slide in from left (0.6s)
5. Chart — fade + scale from 0.95 (0.7s)
6. Quick actions — stagger (0.8s+)
7. Counter animations — 1.5s duration, easeOut
```

---

*DASTA CLOUD JR — პატარა მაღაზიის დიდი სისტემა* 🇬🇪

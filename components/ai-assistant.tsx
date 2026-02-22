"use client";

import { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, Sparkles, AlertCircle, TrendingUp, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useWarehouseStore } from "@/hooks/use-store";
import { cn } from "@/lib/utils";

interface Message {
    role: "user" | "ai";
    content: string | React.ReactNode;
}

const QUICK_ACTIONS = [
    { label: "📦 მარაგის შემოწმება", value: "რა მარაგი გვაქვს?" },
    { label: "🧮 კალკულატორი", value: "კალკულატორი" },
    { label: "🏆 ტოპ გაყიდვადი", value: "რა არის ტოპ გაყიდვადი?" },
    { label: "💡 რჩევა", value: "მომეცი რჩევა" },
];

export function AIAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "ai",
            content: (
                <div>
                    გამარჯობა! მე ვარ თქვენი <b>Malema AI</b> ასისტენტი.
                    <br /><br />
                    შემიძლია დაგეხმაროთ ლამინატის მარაგების ანალიზში, დაგითვალოთ საჭირო რაოდენობა ან გიპოვოთ კონკრეტული დეკორი.
                </div>
            ),
        },
    ]);
    const store = useWarehouseStore();
    const scrollRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const generateAIResponse = (userText: string): React.ReactNode => {
        const text = userText.toLowerCase().trim();

        // 1. Calculator Logic
        const sqMeterMatch = text.match(/(\d+)\s*(კვადრატ|კვ|sq|m2)/);
        if (sqMeterMatch || text.includes("კალკულატორი")) {
            if (sqMeterMatch) {
                const sqMeters = parseInt(sqMeterMatch[1]);
                const sheetSize = 5.8; // standard laminate sheet size m2
                const needed = Math.ceil(sqMeters / sheetSize);
                return (
                    <div>
                        📍 <b>{sqMeters} კვ.მ</b> ფართობისთვის:<br /><br />
                        • დაგჭირდებათ დაახლოებით <b>{needed} ლისტი</b> ლამინატი.<br />
                        • გათვალისწინებულია სტანდარტული ლისტის ზომა (5.8 მ²).<br />
                        • რეკომენდებულია 5-10% მარაგის დამატება დანაკარგებისთვის.
                    </div>
                );
            }
            return "შეგიძლიათ მომწეროთ ფართობი, მაგალითად: '20 კვადრატულზე რამდენი ლისტი მინდა?' და მე დაგითვლით.";
        }

        // 2. Product Search
        if (text.includes("გვაქვს") || text.includes("არის") || text.includes("მაქვს")) {
            const searchTerms = text.replace(/(გვაქვს|არის|მაქვს|თუ|\?) /g, "").trim();
            const found = store.products.filter(p =>
                p.name.toLowerCase().includes(searchTerms) ||
                (p.category && p.category.toLowerCase().includes(searchTerms))
            );

            if (found.length > 0 && searchTerms.length > 2) {
                return (
                    <div>
                        🔍 მოიძებნა შემდეგი პროდუქცია:<br /><br />
                        {found.slice(0, 3).map(p => (
                            <div key={p.id} className="mb-2 border-b pb-1">
                                • <b>{p.name}</b>: {p.quantity} ერთ. ({p.salePrice} GEL)
                            </div>
                        ))}
                        {found.length > 3 && <div className="text-xs text-muted-foreground">...და კიდევ {found.length - 3} სხვა.</div>}
                    </div>
                );
            }
        }

        // 3. Stock Analytics
        if (text.includes("მარაგი") || text.includes("რა გვაქვს") || text.includes("ნაშთი")) {
            const lowStock = store.lowStockProducts;
            return (
                <div>
                    📊 <b>მარაგების სტატუსი:</b><br /><br />
                    • სულ საწყობშია: <b>{store.totalStock} ლისტი</b><br />
                    • კრიტიკული მარაგი: <b>{lowStock.length} სახეობა</b><br /><br />
                    {lowStock.length > 0 && (
                        <div className="text-destructive">
                            ⚠️ ყურადღება მიაქციეთ: {lowStock.slice(0, 2).map(p => p.name).join(", ")}
                        </div>
                    )}
                </div>
            );
        }

        // 4. Sales/Profit/Purchase Analytics
        if (text.includes("მოგება") || text.includes("შემოსავალი") || text.includes("ტოპ") || text.includes("გაყიდვა")) {
            const top = store.topProducts[0];
            return (
                <div>
                    💰 <b>ფინანსური მიმოხილვა:</b><br /><br />
                    • მთლიანი მოგება: <b>{store.totalProfit.toLocaleString()} GEL</b><br />
                    • ყველაზე გაყიდვადი: <b>{top ? top.name : "მონაცემები არ არის"}</b><br />
                    • შემოსავალი გაყიდვებიდან: <b>{store.totalRevenue.toLocaleString()} GEL</b>
                </div>
            );
        }

        if (text.includes("შესყიდვა") || text.includes("ვიყიდეთ") || text.includes("შემოვიდა")) {
            const lastPurchase = store.purchaseHistory[store.purchaseHistory.length - 1];
            return (
                <div>
                    🛒 <b>ბოლო შესყიდვები:</b><br /><br />
                    {lastPurchase ? (
                        <div>
                            • ბოლოს შემოვიდა: <b>{lastPurchase.productName}</b><br />
                            • რაოდენობა: <b>{lastPurchase.quantity} ერთ.</b><br />
                            • თარიღი: <b>{new Date(lastPurchase.createdAt).toLocaleDateString("ka-GE")}</b>
                        </div>
                    ) : (
                        "შესყიდვების ისტორია ცარიელია."
                    )}
                </div>
            );
        }

        // 5. Advice
        if (text.includes("რჩევა") || text.includes("რა ვქნა") || text.includes("დახმარება") || text.includes("მირჩიე")) {
            if (store.lowStockProducts.length > 0) {
                return "💡 ჩემი რჩევაა, პირველ რიგში შეავსოთ **კრიტიკული მარაგები**, რათა არ დაკარგოთ კლიენტები დეკორის არქონის გამო.";
            }
            return "💡 ყველაფერი კარგად მიდის. გირჩევთ აქცენტი გააკეთოთ **ტოპ გაყიდვადი დეკორების** პოპულარიზაციაზე.";
        }

        return (
            <div>
                უკაცრავად, ამ კითხვაზე ზუსტი პასუხი არ მაქვს.
                <br /><br />
                <b>შეგიძლიათ მკითხოთ:</b>
                <br />
                • მარაგების შესახებ (მაგ: "რა მარაგი გვაქვს?")
                <br />
                • შესყიდვების შესახებ (მაგ: "რა ვიყიდეთ ბოლოს?")
                <br />
                • კალკულატორი (მაგ: "20 კვადრატულზე რამდენი ლისტი მინდა?")
            </div>
        );
    };

    const handleSend = (textOverride?: string) => {
        const rawInput = textOverride || input;
        if (!rawInput.trim()) return;

        const userMsg: Message = { role: "user", content: rawInput };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");

        setTimeout(() => {
            const aiMsg: Message = {
                role: "ai",
                content: generateAIResponse(rawInput)
            };
            setMessages((prev) => [...prev, aiMsg]);
        }, 600);
    };

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
            {isOpen && (
                <Card className="w-[350px] sm:w-[400px] h-[550px] shadow-2xl flex flex-col border-primary/20 bg-background animate-in slide-in-from-bottom-5 duration-300">
                    <CardHeader className="p-4 border-b bg-primary/5">
                        <CardTitle className="flex items-center justify-between text-base">
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <Sparkles className="h-5 w-5 text-primary" />
                                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                    </span>
                                </div>
                                <span className="font-bold">Malema AI</span>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsOpen(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-hidden p-0 flex flex-col h-0">
                        <ScrollArea className="flex-1 p-4">
                            <div className="flex flex-col gap-4">
                                {messages.map((msg, i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            "flex flex-col max-w-[90%] rounded-2xl p-3 text-sm transition-all",
                                            msg.role === "ai"
                                                ? "bg-muted self-start rounded-tl-none border border-border text-foreground"
                                                : "bg-primary text-primary-foreground self-end rounded-tr-none shadow-sm"
                                        )}
                                    >
                                        {msg.content}
                                    </div>
                                ))}
                                <div ref={scrollRef} />
                            </div>
                        </ScrollArea>

                        {/* Quick Actions */}
                        <div className="p-3 border-t bg-muted/30">
                            <div className="flex flex-wrap gap-2">
                                {QUICK_ACTIONS.map((action) => (
                                    <Button
                                        key={action.value}
                                        variant="outline"
                                        size="sm"
                                        className="text-[10px] h-7 bg-background hover:bg-primary/5 hover:text-primary transition-colors"
                                        onClick={() => handleSend(action.value)}
                                    >
                                        {action.label}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="p-4 border-t gap-2 bg-background">
                        <Input
                            placeholder="ჰკითხეთ AI-ს..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSend()}
                            className="flex-1 rounded-full px-4"
                        />
                        <Button size="icon" onClick={() => handleSend()} disabled={!input.trim()} className="rounded-full">
                            <Send className="h-4 w-4" />
                        </Button>
                    </CardFooter>
                </Card>
            )}

            <Button
                size="lg"
                className="rounded-full h-14 w-14 shadow-xl hover:scale-105 transition-transform duration-200 bg-primary hover:bg-primary/90"
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
            </Button>
        </div>
    );
}

export function AIInsightsCard() {
    const store = useWarehouseStore();

    const insights = [
        {
            title: "მარაგის ანალიზი",
            description: store.lowStockProducts.length > 0
                ? `${store.lowStockProducts.length} სახეობის ლამინატი იწურება.`
                : "მარაგები ოპტიმალურ მდგომარეობაშია.",
            icon: AlertCircle,
            color: store.lowStockProducts.length > 0 ? "text-destructive" : "text-chart-2",
        },
        {
            title: "გაყიდვების დინამიკა",
            description: store.topProducts[0]
                ? `ყველაზე მოთხოვნადია: ${store.topProducts[0].name}`
                : "გაყიდვების ისტორია ჯერ არ არსებობს.",
            icon: TrendingUp,
            color: "text-chart-1",
        },
        {
            title: "საწყობის სტატუსი",
            description: `საწყობში ამჟამად არის ${store.totalStock} ლისტი.`,
            icon: Package,
            color: "text-chart-3",
        }
    ];

    return (
        <Card className="mb-6 border-primary/20 bg-primary/5">
            <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-primary">
                    <Sparkles className="h-5 w-5" />
                    AI ინსაითები (ლამინატი)
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {insights.map((insight, i) => (
                        <div key={i} className="flex flex-col gap-1 p-3 rounded-lg bg-background/50 border border-primary/10 transition-all hover:border-primary/30">
                            <div className="flex items-center gap-2">
                                <insight.icon className={cn("h-4 w-4", insight.color)} />
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{insight.title}</span>
                            </div>
                            <p className="text-sm font-medium">{insight.description}</p>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

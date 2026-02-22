"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { MessageSquare, X, Send, Sparkles, AlertCircle, TrendingUp, Package, Mic, MicOff, BarChart3, Navigation, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useWarehouseStore } from "@/hooks/use-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Message {
    role: "user" | "ai";
    content: string | React.ReactNode;
}

const QUICK_ACTIONS = [
    { label: "📦 მარაგი", value: "რა მარაგი გვაქვს?" },
    { label: "🧮 კალკულატორი", value: "კალკულატორი" },
    { label: "📐 დაჭრა", value: "დაჭრის დათვლა" },
    { label: "🏆 ტოპ გაყიდვადი", value: "რა არის ტოპ გაყიდვადი?" },
];

export function AIAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "ai",
            content: (
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-primary">
                        <Sparkles className="h-4 w-4" />
                        <b>სისტემა მზად არის (Level 5)</b>
                    </div>
                    გამარჯობა! მე ვარ თქვენი <b>Malema Pro Advisor</b>.
                    <br />
                    შემიძლია ვმართო აპლიკაცია, დავთვალო მოგება და მოგცეთ ბიზნეს რჩევები.
                </div>
            ),
        },
    ]);
    const store = useWarehouseStore();
    const router = useRouter();
    const pathname = usePathname();
    const scrollRef = useRef<HTMLDivElement>(null);

    // Context helper
    const getPageName = () => {
        if (pathname === "/") return "მთავარ დეშბორდზე";
        if (pathname === "/warehouse") return "საწყობში";
        if (pathname === "/sales") return "გაყიდვების გვერდზე";
        if (pathname === "/purchase") return "შესყიდვების გვერდზე";
        if (pathname === "/analytics") return "ანალიტიკაში";
        return "პროექტში";
    };

    // Navigation Detection logic
    const handleNavigation = (text: string): boolean => {
        const t = text.toLowerCase();
        if (t.includes("საწყობ") || t.includes("მარაგ")) { router.push("/warehouse"); return true; }
        if (t.includes("გაყიდვ") || t.includes("sales")) { router.push("/sales"); return true; }
        if (t.includes("შესყიდვ") || t.includes("purchase")) { router.push("/purchase"); return true; }
        if (t.includes("ანალიტიკ") || t.includes("გრაფიკ")) { router.push("/analytics"); return true; }
        if (t.includes("მთავარ") || t.includes("დეშბორდ")) { router.push("/"); return true; }
        return false;
    };

    // Speech Recognition Setup
    const startListening = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            toast.error("თქვენს ბრაუზერს არ აქვს ხმის მხარდაჭერა");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = "ka-GE";
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = () => setIsListening(false);

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInput(transcript);
            handleSend(transcript);
        };

        recognition.start();
    };

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

        // 1. Navigation Controller (Level 5)
        if (text.includes("გადადი") || text.includes("გახსენი") || text.includes("მაჩვენე") || text.includes("წადი")) {
            const success = handleNavigation(text);
            if (success) {
                return (
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-green-500">
                            <Navigation className="h-4 w-4" />
                            <b>ნავიგაცია შესრულდა</b>
                        </div>
                        თქვენ ახლა იმყოფებით <b>{getPageName()}</b>. რით შემიძლია დაგეხმაროთ აქ?
                    </div>
                );
            }
        }

        // 2. Dead Stock & Inventory BI (Level 5)
        if (text.includes("მკვდარი") || text.includes("არ იყიდება") || text.includes("ნელი")) {
            const deadProducts = store.products.filter(p => !store.sales.some(s => s.productId === p.id)).slice(0, 3);
            if (deadProducts.length > 0) {
                return (
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-orange-500">
                            <AlertCircle className="h-4 w-4" />
                            <b>მკვდარი მარაგების ანალიზი</b>
                        </div>
                        შემდეგი პროდუქტები არ გაყიდულა ბოლო პერიოდში:
                        {deadProducts.map(p => (
                            <div key={p.id} className="text-sm border rounded p-2 bg-muted/50">
                                • {p.name} ({p.quantity} ერთ. ნაშთი)
                            </div>
                        ))}
                        <p className="text-xs italic text-muted-foreground">რჩევა: განიხილეთ ფასდაკლება ან აქცია ამ პროდუქტებზე, რათა გამოათავისუფლოთ საბრუნავი თანხა.</p>
                    </div>
                );
            }
            return "ყველა პროდუქტი დინამიურად იყიდება! საწყობის ბრუნვა იდეალურია.";
        }

        // 3. Profit & Price Optimization (Level 5)
        if (text.includes("ფასი") || text.includes("ოპტიმიზაცია") || text.includes("მომგებიან") || text.includes("ზრდა")) {
            const top = store.topProducts[0];
            return (
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-primary">
                        <TrendingUp className="h-4 w-4" />
                        <b>ბიზნესის ზრდის ანალიზი</b>
                    </div>
                    ყველაზე მოთხოვნადი პროდუქტია <b>{top?.name || "არაა"}</b>.
                    <br />
                    ჩემი რჩევით, ამ პროდუქტზე შეგიძლიათ ფასი 5%-ით გაზარდოთ მოგების მარჟის გასაზრდელად.
                    <br />
                    <Button variant="link" className="p-0 h-auto text-xs justify-start" onClick={() => router.push("/analytics")}>
                        იხილეთ სრული ანალიტიკა →
                    </Button>
                </div>
            );
        }

        // 4. Cutting Optimizer Logic
        const partMatch = text.match(/(\d+)\s*(ცალი|დეტალი)?\s*(\d+)\s*[x*x]\s*(\d+)/g);
        if (partMatch || text.includes("დაჭრა") || text.includes("ოპტიმიზაცია")) {
            if (partMatch) {
                let totalArea = 0;
                const details: string[] = [];
                partMatch.forEach(m => {
                    const nums = m.match(/\d+/g);
                    if (nums && nums.length >= 3) {
                        const count = parseInt(nums[0]);
                        const w = parseInt(nums[1]);
                        const h = parseInt(nums[2]);
                        totalArea += (w * h * count) / 1000000; // to m2
                        details.push(`${count} ცალი ${w}x${h}`);
                    }
                });

                const sheetArea = 5.796; // 2800x2070
                const needed = Math.ceil(totalArea / (sheetArea * 0.85)); // 15% waste factor
                const wastePercent = Math.round((1 - (totalArea / (needed * sheetArea))) * 100);

                return (
                    <div>
                        📐 <b>დაჭრის გაანგარიშება:</b><br /><br />
                        {details.map((d, i) => <div key={i}>• {d}</div>)}
                        <br />
                        • საჭირო ფართობი: <b>{totalArea.toFixed(2)} მ²</b><br />
                        • საჭიროა: <b>{needed} ლისტი</b> (2800x2070)<br />
                        • ნარჩენი (დაახლოებით): <b>{wastePercent}%</b><br /><br />
                        <span className="text-xs text-muted-foreground italic">შენიშვნა: გათვლილია 15%-იანი დანაკარგით.</span>
                    </div>
                );
            }
            return "მომწერეთ დეტალების ზომები, მაგ: '5 ცალი 600x400 და 2 ცალი 1000x500'.";
        }

        // 5. Calculator Logic
        const sqMeterMatch = text.match(/(\d+)\s*(კვადრატ|კვ|sq|m2)/);
        if (sqMeterMatch || text.includes("კალკულატორი")) {
            if (sqMeterMatch) {
                const sqMeters = parseInt(sqMeterMatch[1]);
                const sheetSize = 5.8;
                const needed = Math.ceil(sqMeters / sheetSize);
                return (
                    <div>
                        📍 <b>{sqMeters} კვ.მ</b> ფართობისთვის:<br /><br />
                        • დაგჭირდებათ დაახლოებით <b>{needed} ლისტი</b>.<br />
                        • რეკომენდებულია 10% მარაგის დამატება.
                    </div>
                );
            }
            return "შეგიძლიათ მომწეროთ ფართობი, მაგალითად: '20 კვადრატულზე რამდენი ლისტი მინდა?'";
        }

        // 6. Product Search
        if (text.includes("გვაქვს") || text.includes("არის") || text.includes("მაქვს") || text.includes("ნახე")) {
            const searchTerms = text.replace(/(გვაქვს|არის|მაქვს|თუ|ნახე|\?) /g, "").trim();
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
                    </div>
                );
            }
        }

        // 7. Sales Processing (Level 3)
        const sellMatch = text.match(/(გაყიდე|გაყიდვა|sales?)\s*(.+)?\s*(\d+)\s*(ლისტი|ცალი|ერთეული)?/i) ||
            text.match(/(\d+)\s*(ლისტი|ცალი|ერთეული)?\s*(გაყიდე|გაყიდვა|sales?)\s*(.+)?/i);

        if (sellMatch || text.includes("გაყიდე") || text.includes("გაყიდვა")) {
            let productNameSnippet = "";
            let quantity = 0;

            if (sellMatch) {
                const nums = text.match(/\d+/);
                quantity = nums ? parseInt(nums[0]) : 0;
                productNameSnippet = text.replace(/(გაყიდე|გაყიდვა|ლისტი|ცალი|ერთეული| )/g, "").replace(/\d+/g, "").trim();
            }

            if (quantity > 0 && productNameSnippet.length > 1) {
                const product = store.products.find(p => p.name.toLowerCase().includes(productNameSnippet));

                if (product) {
                    return (
                        <div className="flex flex-col gap-2">
                            <div>
                                🛒 გსურთ გაყიდოთ <b>{quantity} ლისტი</b> პროდუქცია: <b>{product.name}</b>?
                                <br />
                                ჯამური ფასი: <b>{(product.salePrice * quantity).toLocaleString()} GEL</b>
                            </div>
                            <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white w-fit gap-2"
                                onClick={async () => {
                                    try {
                                        await store.addSale({
                                            productId: product.id,
                                            productName: product.name,
                                            category: product.category,
                                            quantity: quantity,
                                            salePrice: product.salePrice,
                                            client: "AI Sales"
                                        });
                                        setMessages(prev => [...prev, { role: "ai", content: `✅ გაყიდვა წარმატებით შესრულდა: ${product.name} (${quantity} ერთ.)` }]);
                                        toast.success("გაყიდვა შესრულდა");
                                    } catch (e: any) {
                                        setMessages(prev => [...prev, { role: "ai", content: `❌ შეცდომა: ${e.message}` }]);
                                        toast.error(e.message);
                                    }
                                }}
                            >
                                <TrendingUp className="h-4 w-4" /> დიახ, გაყიდე
                            </Button>
                        </div>
                    );
                }
                return `🔍 პროდუქტი "${productNameSnippet}" ვერ მოვიძებნა. დააზუსტეთ სახელი.`;
            }
            return "მიუთითეთ პროდუქტი და რაოდენობა, მაგ: 'გაყიდე საფირმეშე 10 ლისტი'.";
        }

        // 8. Analytics & History
        if (text.includes("მარაგი") || text.includes("რა გვაქვს") || text.includes("ნაშთი")) {
            return (
                <div>
                    📊 <b>მარაგები:</b> სულ <b>{store.totalStock}</b> ლისტი.<br />
                    ⚠️ <b>კრიტიკული:</b> {store.lowStockProducts.length} სახეობა.
                </div>
            );
        }

        if (text.includes("შესყიდვა") || text.includes("ვიყიდეთ") || text.includes("შემოვიდა")) {
            const last = store.purchaseHistory[store.purchaseHistory.length - 1];
            return (
                <div>
                    🛒 <b>ბოლო შესყიდვა:</b><br />
                    {last ? `• ${last.productName} (${last.quantity} ერთ.)` : "ისტორია ცარიელია."}
                </div>
            );
        }

        if (text.includes("მოგება") || text.includes("შემოსავალი") || text.includes("ტოპ")) {
            return (
                <div>
                    💰 <b>მოგება:</b> <b>{store.totalProfit.toLocaleString()} GEL</b><br />
                    🏆 <b>ტოპ:</b> {store.topProducts[0]?.name || "არაა"}
                </div>
            );
        }

        return (
            <div>
                უკაცრავად, ამ კითხვაზე ზუსტი პასუხი არ მაქვს.
                <br /><br />
                <b>ჰკითხეთ AI-ს:</b><br />
                • "10 ცალი 600x400 დაჭრა"<br />
                • "რა მარაგი გვაქვს?"<br />
                • "რა ვიყიდეთ ბოლოს?"
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
            setMessages((prev) => [...prev, { role: "ai", content: generateAIResponse(rawInput) }]);
        }, 600);
    };

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
            {isOpen && (
                <Card className="w-[350px] sm:w-[400px] h-[550px] shadow-2xl flex flex-col border-primary/20 bg-background animate-in slide-in-from-bottom-5 duration-300">
                    <CardHeader className="p-4 border-b bg-primary/5">
                        <CardTitle className="flex items-center justify-between text-base">
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                                <span className="font-bold">Malema Pro AI</span>
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
                                    <div key={i} className={cn("flex flex-col max-w-[90%] rounded-2xl p-3 text-sm",
                                        msg.role === "ai" ? "bg-muted self-start rounded-tl-none border" : "bg-primary text-primary-foreground self-end rounded-tr-none")}>
                                        {msg.content}
                                    </div>
                                ))}
                                <div ref={scrollRef} />
                            </div>
                        </ScrollArea>

                        <div className="p-3 border-t bg-muted/30">
                            <div className="flex flex-wrap gap-2">
                                {QUICK_ACTIONS.map((action) => (
                                    <Button key={action.value} variant="outline" size="sm" className="text-[10px] h-7 bg-background" onClick={() => handleSend(action.value)}>
                                        {action.label}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="p-4 border-t gap-2 bg-background">
                        <Button size="icon" variant={isListening ? "destructive" : "outline"} onClick={startListening} className="rounded-full shrink-0">
                            {isListening ? <MicOff className="h-4 w-4 animate-pulse" /> : <Mic className="h-4 w-4" />}
                        </Button>
                        <Input
                            placeholder="ჰკითხეთ AI-ს..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSend()}
                            className="flex-1 rounded-full"
                        />
                        <Button size="icon" onClick={() => handleSend()} disabled={!input.trim()} className="rounded-full shrink-0">
                            <Send className="h-4 w-4" />
                        </Button>
                    </CardFooter>
                </Card>
            )}

            <Button
                size="lg"
                className="rounded-full h-14 w-14 shadow-xl hover:scale-110 transition-transform duration-200 bg-primary"
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

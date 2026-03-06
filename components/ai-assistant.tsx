"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { MessageSquare, X, Send, Sparkles, AlertCircle, TrendingUp, Package, Mic, MicOff, BarChart3, Navigation, ShoppingBag, ChevronDown, ChevronUp, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useWarehouseStore } from "@/hooks/use-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { model, tools } from "@/lib/gemini";

interface Message {
    role: "user" | "ai";
    content: string | React.ReactNode;
}

const QUICK_ACTIONS = [
    { label: "📦 მარაგი", value: "რა მარაგი გვაქვს?", primary: true },
    { label: "💰 მოგება", value: "რა მოგება მაქვს?", primary: true },
    { label: "💸 ნისიები", value: "ვის აქვს ვალი?", primary: true },
    { label: "🔮 პროგნოზი", value: "მარაგის პროგნოზი", primary: true },
    { label: "📊 კლიენტები", value: "ვინ არის საუკეთესო კლიენტი?", primary: false },
    { label: "📐 დაჭრა", value: "დაჭრის დათვლა", primary: false },
    { label: "📏 კალკულატორი", value: "კალკულატორი", primary: false },
    { label: "📉 მკვდარი მარაგი", value: "მკვდარი მარაგი", primary: false },
    { label: "🛒 ბოლო შესყიდვა", value: "რა ვიყიდეთ ბოლოს?", primary: false },
    { label: "🏆 ტოპ გაყიდვადი", value: "რა არის ტოპ გაყიდვადი?", primary: false },
];


export function AIAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [input, setInput] = useState("");
    const [autoScroll, setAutoScroll] = useState(true);
    const [showAllActions, setShowAllActions] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "ai",
            content: (
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-primary">
                        <Sparkles className="h-4 w-4" />
                        <b>სისტემა მზად არის (Level 10)</b>
                    </div>
                    გამარჯობა! მე ვარ თქვენი <b>Malema Pro Advisor</b>.
                    <br />
                    შემიძლია ვმართო აპლიკაცია, დავთვალო მოგება და შევასრულო ოპერაციები.
                </div>
            ),
        },
    ]);
    const store = useWarehouseStore();
    const router = useRouter();
    const pathname = usePathname();
    const scrollRef = useRef<HTMLDivElement>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    // Chat session ref to maintain context
    const chatSession = useRef<any>(null);

    useEffect(() => {
        if (!chatSession.current && process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
            chatSession.current = model.startChat({
                tools: tools,
                history: [],
            });
        }
    }, []);

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

    const scrollToBottom = (force = false) => {
        const el = scrollAreaRef.current;
        if (!el) return;
        if (force || autoScroll) {
            el.scrollTop = el.scrollHeight;
        }
    };

    const handleScroll = () => {
        const el = scrollAreaRef.current;
        if (!el) return;
        // If user is within 100px of the bottom, keep auto-scroll on
        const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
        setAutoScroll(nearBottom);
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Force scroll to bottom when chat is opened
    useEffect(() => {
        if (isOpen) scrollToBottom(true);
    }, [isOpen]);

    const executeTool = async (call: any) => {

        const { name, args } = call;
        console.log("Executing tool:", name, args);

        switch (name) {
            case "get_inventory":
                return {
                    totalStock: store.totalStock,
                    lowStockCount: store.lowStockProducts.length,
                    products: store.products.map(p => ({ name: p.name, quantity: p.quantity, price: p.salePrice })),
                };

            case "search_product":
                const query = args.query.toLowerCase();
                const found = store.products.filter(p =>
                    p.name.toLowerCase().includes(query) ||
                    p.category.toLowerCase().includes(query)
                );
                return { results: found.map(p => ({ id: p.id, name: p.name, quantity: p.quantity, price: p.salePrice })) };

            case "add_sale":
                try {
                    await store.addSale({
                        productId: args.productId,
                        productName: args.productName,
                        category: args.category || "General",
                        quantity: args.quantity,
                        salePrice: args.salePrice,
                        paidAmount: args.paidAmount || (args.salePrice * args.quantity),
                        status: (args.status as any) || "paid",
                        client: args.client || "AI Assistant"
                    });
                    toast.success("გაყიდვა დაფიქსირდა");
                    return { success: true, message: "Sale added successfully" };
                } catch (e: any) {
                    toast.error(e.message);
                    return { success: false, error: e.message };
                }

            case "add_expense":
                try {
                    await store.addExpense({
                        amount: args.amount,
                        category: args.category || "AI Logged",
                        description: args.description,
                        date: args.date || new Date().toISOString().split('T')[0]
                    });
                    toast.success("ხარჯი დაემატა");
                    return { success: true };
                } catch (e: any) {
                    toast.error(e.message);
                    return { success: false, error: e.message };
                }

            case "get_financial_report":
                return {
                    revenue: store.totalRevenue,
                    profit: store.totalProfit,
                    expenses: store.totalExpenses,
                    netProfit: store.totalProfit - store.totalExpenses
                };

            case "navigate_to":
                const routes: Record<string, string> = {
                    dashboard: "/",
                    warehouse: "/warehouse",
                    sales: "/sales",
                    purchase: "/purchase",
                    analytics: "/analytics"
                };
                if (routes[args.page]) {
                    router.push(routes[args.page]);
                    return { success: true, navigatedTo: args.page };
                }
                return { success: false, error: "Invalid page" };

            default:
                return { error: "Tool not found" };
        }
    };

    const handleSend = async (textOverride?: string) => {
        const rawInput = textOverride || input;
        if (!rawInput.trim() || isLoading) return;

        setAutoScroll(true);
        setMessages(prev => [...prev, { role: "user", content: rawInput }]);
        setInput("");
        setIsLoading(true);

        try {
            if (!chatSession.current) {
                chatSession.current = model.startChat({
                    tools: tools,
                });
            }

            let result = await chatSession.current.sendMessage(rawInput);
            let response = result.response;
            let calls = response.functionCalls();

            // Handle function calling loop
            while (calls && calls.length > 0) {
                const toolResponses = await Promise.all(
                    calls.map(async (call: any) => ({
                        functionResponse: {
                            name: call.name,
                            response: await executeTool(call),
                        },
                    }))
                );

                result = await chatSession.current.sendMessage(toolResponses);
                response = result.response;
                calls = response.functionCalls();
            }

            const aiText = response.text();
            setMessages(prev => [...prev, { role: "ai", content: aiText }]);
        } catch (error: any) {
            console.error("AI Error:", error);
            toast.error("AI-სთან კავშირი ვერ დამყარდა");
            setMessages(prev => [...prev, { role: "ai", content: "უკაცრავად, მოხდა შეცდომა. სცადეთ მოგვიანებით." }]);
        } finally {
            setIsLoading(false);
        }
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
                        <div
                            ref={scrollAreaRef}
                            onScroll={handleScroll}
                            className="flex-1 overflow-y-auto p-4"
                        >
                            <div className="flex flex-col gap-4">
                                {messages.map((msg, i) => (
                                    <div key={i} className={cn("flex flex-col max-w-[90%] rounded-2xl p-3 text-sm",
                                        msg.role === "ai" ? "bg-muted self-start rounded-tl-none border" : "bg-primary text-primary-foreground self-end rounded-tr-none")}>
                                        {msg.content}
                                    </div>
                                ))}
                                {/* Scroll anchor */}
                                <div ref={scrollRef} />
                            </div>
                        </div>

                        <div className="p-3 border-t bg-muted/30">
                            <div className="flex flex-wrap gap-2 transition-all duration-300 ease-in-out">
                                {QUICK_ACTIONS.filter(a => a.primary || showAllActions).map((action) => (
                                    <Button key={action.value} variant="outline" size="sm" className="text-[10px] h-7 bg-background hover:bg-primary/5 hover:border-primary/30 transition-colors" onClick={() => handleSend(action.value)}>
                                        {action.label}
                                    </Button>
                                ))}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-[10px] h-7 gap-1 text-muted-foreground hover:text-primary"
                                    onClick={() => setShowAllActions(!showAllActions)}
                                >
                                    {showAllActions ? (
                                        <>ნაკლები <ChevronUp className="h-3 w-3" /></>
                                    ) : (
                                        <>მეტი <ChevronDown className="h-3 w-3" /></>
                                    )}
                                </Button>
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
                    POWERED BY JABSONA
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

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
    content: string;
}

export function AIAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "ai",
            content: "გამარჯობა! მე ვარ თქვენი AI ასისტენტი. რით შემიძლია დაგეხმაროთ ლამინატის მარაგების მართვაში?",
        },
    ]);
    const store = useWarehouseStore();
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const generateAIResponse = (userText: string) => {
        const text = userText.toLowerCase();

        // Simple logic-based responses for demonstration/prototype
        if (text.includes("მარაგი") || text.includes("რა გვაქვს") || text.includes("ლისტი")) {
            const lowStock = store.lowStockProducts.length;
            if (lowStock > 0) {
                return `ამჟამად ${lowStock} სახეობის ლამინატის ლისტი კრიტიკულ ზღვარზეა. გირჩევთ გადახედოთ დეშბორდს.`;
            }
            return `მარაგები წესრიგშია. სულ გვაქვს ${store.totalStock} ლისტი საწყობში.`;
        }

        if (text.includes("მოგება") || text.includes("შემოსავალი")) {
            return `თქვენი მთლიანი მოგება შეადგენს ${store.totalProfit.toLocaleString()} GEL-ს. ყველაზე მომგებიანია ${store.topProducts[0]?.name || "ჯერ არაფერი"}.`;
        }

        if (text.includes("რჩევა") || text.includes("რა ვქნა")) {
            if (store.lowStockProducts.length > 0) {
                return `გირჩევთ სასწრაფოდ შეავსოთ ${store.lowStockProducts[0].name}-ის მარაგი, რადგან მასზე მოთხოვნა მაღალია.`;
            }
            return "ყველაფერი სტაბილურია. გირჩევთ ყურადღება მიაქციოთ ყველაზე გაყიდვადი დეკორების მარაგს.";
        }

        return "უკაცრავად, ვერ გავიგე. შეგიძლიათ მკითხოთ მარაგების, მოგების ან რჩევების შესახებ ლამინატთან დაკავშირებით.";
    };

    const handleSend = () => {
        if (!input.trim()) return;

        const userMsg: Message = { role: "user", content: input };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");

        // Simulate AI thinking
        setTimeout(() => {
            const aiMsg: Message = {
                role: "ai",
                content: generateAIResponse(input)
            };
            setMessages((prev) => [...prev, aiMsg]);
        }, 600);
    };

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
            {isOpen && (
                <Card className="w-[350px] sm:w-[400px] h-[500px] shadow-2xl flex flex-col border-primary/20 bg-background animate-in slide-in-from-bottom-5 duration-300">
                    <CardHeader className="p-4 border-b bg-primary/5">
                        <CardTitle className="flex items-center justify-between text-base">
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-primary" />
                                <span>AI ასისტენტი</span>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsOpen(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-hidden p-0">
                        <ScrollArea className="h-full p-4" ref={scrollRef}>
                            <div className="flex flex-col gap-4">
                                {messages.map((msg, i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            "flex flex-col max-w-[85%] rounded-lg p-3 text-sm",
                                            msg.role === "ai"
                                                ? "bg-muted self-start"
                                                : "bg-primary text-primary-foreground self-end"
                                        )}
                                    >
                                        {msg.content}
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                    <CardFooter className="p-4 border-t gap-2">
                        <Input
                            placeholder="ჰკითხეთ AI-ს..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSend()}
                            className="flex-1"
                        />
                        <Button size="icon" onClick={handleSend} disabled={!input.trim()}>
                            <Send className="h-4 w-4" />
                        </Button>
                    </CardFooter>
                </Card>
            )}

            <Button
                size="lg"
                className="rounded-full h-14 w-14 shadow-xl hover:scale-105 transition-transform duration-200"
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <X /> : <MessageSquare className="h-6 w-6" />}
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

"use client";

import { useState } from "react";
import {
    LayoutDashboard,
    ShoppingCart,
    BookOpen,
    Warehouse,
    Shield,
    Users,
    Search,
    Download,
    Info,
    ChevronRight,
    TrendingUp,
    CreditCard,
    DollarSign,
    History,
    Lock,
    Cpu,
    Printer,
    ChevronDown,
    Link2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { PageHeader } from "@/components/page-header";
import { cn } from "@/lib/utils";
import { useHeaderSetup } from "@/lib/header-store";
import { printPage } from "@/lib/print";

const sections = [
    {
        id: "dashboard",
        title: "მთავარი პანელი (Dashboard)",
        icon: LayoutDashboard,
        color: "text-blue-500",
        bg: "bg-blue-500/10",
        content: [
            {
                title: "Business Insights (AI ასისტენტი)",
                desc: "AI-ზე დაფუძნებული მოკლე შეჯამება ეკრანის ზედა ნაწილში. ის ავტომატურად აანალიზებს თქვენს მონაცემებს და გაძლევთ რეკომენდაციებს (მაგ: რომელი პროდუქტი იწურება, როგორია გაყიდვების ტენდენცია)."
            },
            {
                title: "სტატისტიკის ბარათები (ზედა რიგი)",
                desc: "აქ თავმოყრილია ბიზნესის მთავარი მეტრიკები: \n• პროდუქციის ტიპი: უნიკალური პროდუქტების რაოდენობა.\n• მთლიანი სტოკი: საწყობში არსებული ნივთების ჯამი.\n• შესყიდვის ღირებულება: საწყობში არსებული საქონლის თვითღირებულება (GEL).\n• მოგება: საერთო წმინდა მოგება.\n• აქტივების ღირებულება: საწყობის პოტენციური გასაყიდი ღირებულება.\n• თანამშრომლები: რეგისტრირებული პერსონალის რაოდენობა."
            },
            {
                title: "ვიზუალური გრაფიკები (ჩარტები)",
                desc: "მარცხენა გრაფიკი აჩვენებს გაყიდვებსა და მოგებას თვეების მიხედვით. მარჯვენა წრიული გრაფიკი კი აჩვენებს პროდუქტების განაწილებას კატეგორიების მიხედვით (მაგ: რამდენი ტექნიკაა, რამდენი აქსესუარი)."
            },
            {
                title: "ტოპ პროდუქცია და მარაგი",
                desc: "ქვედა სექციაში ხედავთ ყველაზე უფრო გაყიდვად პროდუქტებს (მარცხნივ) და საწყობში ბოლოს დამატებულ ნივთებს (მარჯვნივ). აქვე გამოჩნდება წითელი გაფრთხილებები, თუ რომელიმე პროდუქტის მარაგი იწურება."
            }
        ]
    },
    {
        id: "sales",
        title: "გაყიდვების სისტემა (POS)",
        icon: ShoppingCart,
        color: "text-amber-500",
        bg: "bg-amber-500/10",
        content: [
            {
                title: "როგორ გავყიდოთ პროდუქტი (ნაბიჯები)",
                desc: "1. მოძებნეთ პროდუქტი: გამოიყენეთ საძიებო ველი (ან დააჭირეთ 'Space'-ს) ან დაასკანერეთ შტრიხკოდი.\n2. დაამატეთ კალათაში: დააჭირეთ პროდუქტის ბარათს.\n3. რაოდენობის შეცვლა: მარჯვენა პანელში (კალათაში) გამოიყენეთ + და - ღილაკები.\n4. გადახდა: ჩაწერეთ კლიენტის მიერ მოწოდებული თანხა 'გადახდილი თანხა' ველში.\n5. დაასრულეთ: დააჭირეთ მწვანე 'გაყიდვა' ღილაკს დასასრულებლად."
            },
            {
                title: "ღილაკები და მათი ფუნქციები",
                desc: "• X (წაშლა): კალათიდან კონკრეტული პროდუქტის ამოშლა.\n• ფასის რეჟიმი (საცალო/საბითუმო): კალათის ზედა მარჯვენა კუთხეში არსებული გადამრთველით იცვლება ფასები საცალოდან საბითუმოზე.\n• RS.GE ღილაკი: გაყიდვისას ავტომატურად ტვირთავს მონაცემებს შემოსავლების სამსახურში (საჭიროებს ინტეგრაციის პარამეტრებს).\n• ფისკალური ღილაკი: გაყიდვის დასრულებისას ბეჭდავს ფისკალურ ჩეკს სალარო აპარატზე."
            },
            {
                title: "ნისიები და ვალები",
                desc: "თუ 'გადახდილი თანხა' უფრო ნაკლებია ვიდრე 'ჯამი', სისტემა ავტომატურად დააფიქსირებს 'ნისიას' (ვალს), რომელიც მიებმება მითითებულ კლიენტს. ვალების ნახვა შეგიძლიათ ზედა ღილაკით: 'ვალები & ნისიები'."
            },
            {
                title: "გაჩერებული ჩეკები (Held Receipts)",
                desc: "თუ კლიენტი ყოყმანობს, შეგიძლიათ დააჭიროთ ღილაკს 'ჩეკის დაყოვნება' (ან კლავიატურაზე F9). კალათა დასუფთავდება ახალი კლიენტისთვის, ხოლო ძველი შეიქმნება როგორც პატარა ყვითელი ბარათი მარჯვენა პანელში. მის აღსადგენად დააჭირეთ 'Play' ღილაკს."
            },
            {
                title: "Z-რეპორტი და ისტორია",
                desc: "დღის ბოლოს შეგიძლიათ დააჭიროთ 'Z-რეპორტი' ღილაკს ცვლის დასახურად. 'ისტორია' ღილაკი აჩვენებს ყველა წარსულ გაყიდვას, სადაც მენეჯერს შეუძლია გაყიდვის გაუქმება ან რედაქტირება."
            }
        ]
    },
    {
        id: "inventory",
        title: "საწყობი და შესყიდვები",
        icon: Warehouse,
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
        content: [
            {
                title: "ახალი პროდუქტის დამატება",
                desc: "დააჭირეთ 'პროდუქციის დამატება' (+). შეავსეთ ველები: სახელი, შტრიხკოდი, შესყიდვის ფასი, გასაყიდი ფასი, რაოდენობა. შტრიხკოდის ველში კურსორის ჩასმისას შეგიძლიათ პირდაპირ დაასკანეროთ პროდუქტი."
            },
            {
                title: "მრავალვალუტიანობა შესყიდვისას",
                desc: "თუ საქონელს იძენთ უცხოურ ვალუტაში (USD ან EUR), შეცვალეთ 'ვალუტა' და მიუთითეთ მიმდინარე კურსი. სისტემა მაინც ლარში შეინახავს თვითღირებულებას, რაც გაგიმარტივებთ მოგების დათვლას."
            },
            {
                title: "საქონლის მიღების დავალიანება (ვალები)",
                desc: "თუ მომწოდებელს (Supplier) საქონლის ფულს სრულად არ უხდით, დამატების ფანჯარაში 'გადახდილი ნაღდით/ბარათით' ველებში მიუთითეთ რეალურად გადახდილი თანხა. დარჩენილი თანხა აისახება როგორც თქვენი ვალი მომწოდებლის მიმართ."
            },
            {
                title: "ცხრილის მართვა და ღილაკები",
                desc: "ცხრილში თითოეულ პროდუქტთან არის 3 წერტილიანი ღილაკი (რედაქტირება/წაშლა). ზედა პანელზე განთავსებულია საძიებო ველი და 'იმპორტი/ექსპორტი' ღილაკები Excel-ით მარაგების სამართავად."
            }
        ]
    },
    {
        id: "accounting",
        title: "ბუღალტერია და ფინანსები",
        icon: BookOpen,
        color: "text-indigo-500",
        bg: "bg-indigo-500/10",
        content: [
            {
                title: "ბუღალტერიის სექციები (ტაბები)",
                desc: "ზედა პანელზე შეგიძლიათ გადართოთ სხვადასხვა უწყისებს შორის: \n• დაშბორდი: ფინანსების მოკლე რეზიუმე.\n• მოგება-ზარალი (P&L): დეტალური ფინანსური ანგარიშგება.\n• ფულადი ნაკადები: სალაროსა და ბანკის მოძრაობები.\n• HR & ბიუჯეტი: ხელფასებისა და ფიქსირებული ხარჯების კონტროლი.\n• გადასახადები & ცვეთა: საგადასახადო ვალდებულებების აღრიცხვა.\n• ანგარიშთა გეგმა: სტანდარტული საბუღალტრო კოდები.\n• ხარჯები: ყველა ტიპის ხარჯის ჩამონათვალი.\n• ჟურნალი: ყველა ფინანსური ტრანზაქციის (გაყიდვის, ხარჯის, გადარიცხვის) უწყისი."
            },
            {
                title: "შიდა გადარიცხვა (ბანკი <-> სალარო)",
                desc: "გამოიყენეთ ეკრანის ზედაპირზე არსებული 'შიდა გადარიცხვა' ღილაკი, როდესაც ამოიღებთ თანხას ნაღდი სალაროდან და შეიტანთ საბანკო ანგარიშზე (ან პირიქით). ეს არ აისახება მოგება-ზარალზე, უბრალოდ ასწორებს ნაშთებს ორ ანგარიშორს შორის."
            },
            {
                title: "ბანკის იმპორტი და NBG კურსები",
                desc: "• NBG კურსები: ზედა პანელში NBG ღილაკზე დაჭერით ავტომატურად ჩამოიტვირთება ეროვნული ბანკის დღევანდელი ვალუტის კურსები (USD, EUR).\n• ბანკის იმპორტი: გაძლევთ საშუალებას Excel-ის (და ჯერჯერობით მონახაზის) ფორმატში ატვირთოთ საბანკო ამონაწერი პლატფორმაში."
            },
            {
                title: "ხარჯის დამატება",
                desc: "დააჭირეთ 'ხარჯის დამატება' (+). აირჩიეთ კატეგორია (მაგ: კომუნალური, საოფისე). თუ ირჩევთ 'ხელფასს', სისტემა გამოგიჩენთ თანამშრომლის არჩევის ველს, რათა დაუკავშიროთ ხარჯი კონკრეტულ პერსონას."
            },
            {
                title: "ფინანსური ანგარიშის ბეჭდვა (PDF)",
                desc: "დააჭირეთ '[ანგარიში (PDF)]' ღილაკს ზედა პანელზე. სისტემა დააგენერირებს პროფესიონალურ, ჩამოსატვირთ მოგება-ზარალის რეპორტს მიმდინარე თარიღისთვის, რომელიც შეიცავს საბანკო/ნაღდ ნაშთებსა და ძირითად ხარჯებს. 'ბეჭდვა' ღილაკი კი უბრალოდ ეკრანის ამონაბეჭდს აკეთებს."
            }
        ]
    },
    {
        id: "staff",
        title: "პერსონალი",
        icon: Users,
        color: "text-rose-500",
        bg: "bg-rose-500/10",
        content: [
            {
                title: "თანამშრომლების მართვა",
                desc: "აქ შეგიძლიათ დაამატოთ მოლარეები, კონსულტანტები ან მენეჯერები. თითოეულს ენიჭება 4-ნიშნა PIN კოდი."
            },
            {
                title: "PIN ავტორიზაცია",
                desc: "სისტემის გასახსნელად სამუშაო პროცესში გამოიყენება ეს PIN კოდი. ეს უზრუნველყოფს, რომ ყოველი გაყიდვა კონკრეტულ მოლარეზე დაფიქსირდეს."
            }
        ]
    },
    {
        id: "security",
        title: "უსაფრთხოება და პარამეტრები",
        icon: Shield,
        color: "text-cyan-500",
        bg: "bg-cyan-500/10",
        content: [
            {
                title: "ადმინ პანელი",
                desc: "მხოლოდ მფლობელებს და ადმინისტრატორებს აქვთ წვდომა 'ადმინ პანელზე'. აქ ხდება სრული სისტემის მომხმარებლის მართვა წვდომის დონეების (Role) მიხედვით."
            },
            {
                title: "პერიოდის ჩაკეტვა (Period Closing)",
                desc: "შედით ბუღალტერია -> უსაფრთხოების ტაბში. აირჩიეთ თარიღი და დააჭირეთ დასტურს. ამ თარიღის ჩათვლით, უკვე შემდგარი გაყიდვების ან ხარჯების რედაქტირება შეუძლებელი გახდება, რაც იცავს მონაცემებს შემთხვევითი ცვლილებისგან."
            },
            {
                title: "Audit Logs (ქმედებების ისტორია)",
                desc: "იგივე უსაფრთხოების ტაბში ჩანს ყველა მოქმედება: ვინ, რა და როდის წაშალა ან შეცვალა. თითოეულ ჩანაწერზე მაუსის მიტანით შეგიძლიათ იხილოთ ზუსტად რა მონაცემები შეიცვალა (ძველი vs ახალი ვერსია)."
            }
        ]
    },
    {
        id: "rsge",
        title: "RS.GE ინტეგრაცია",
        icon: Link2,
        color: "text-emerald-600",
        bg: "bg-emerald-500/10",
        content: [
            {
                title: "რა არის RS.GE ინტეგრაცია?",
                desc: "DASTA ინტეგრირებულია საქართველოს შემოსავლების სამსახურის პორტალთან (RS.GE). APEX-ისა და FINA-ს ანალოგიურად, შეგიძლიათ: ზედნადების გაგზავნა, დადასტურება/უარყოფა, დახურვა, ანგარიშ-ფაქტურის გაგზავნა — ყველაფერი RS.GE-ზე გადასვლის გარეშე, პირდაპირ აპლიკაციიდან."
            },
            {
                title: "გააქტივება — პარამეტრები",
                desc: "შედით ადმინ პანელი → RS.GE ინტეგრაცია. შეიყვანეთ აქაური 4 მონაცემი: 1) სერვის-მომხმარებელი (Username) 2) პაროლი 3) საიდენტიფიკაციო ნომერი (ს/ნ). შემდეგ დააჭირეთ 'კავშირის ტესტი' ღილაკს დასაკავშირებლად. ✅ ნიშანის გაჩენა ნიშნავს, რომ კავშირი წარმატებულია."
            },
            {
                title: "ავტომატური წესები (ადმინ პანელი)",
                desc: "აქ შეგიძლიათ მიუთითოთ: ნაგულისხმევი ზედნადების ტიპი (შიდა/გარე/გადაადგილება), ავტომატური გაგზავნა გაყიდვისას, ანგარიშ-ფაქტურის ავტო-გაგზავნა."
            },
            {
                title: "ზედნადების გაგზავნა გაყიდვებისას (POS)",
                desc: "გადადით გაყიდვებში. დაამატეთ პროდუქტი კალათაში. დააჭირეთ 'გადახდა/Check-out'. აქ კალათაში დააჭირეთ [RS.GE] ღილაკს. ჩაირთვება მწვანე ბლოკი, სადაც შეგიძლიათ შეავსოთ მყიდველის ს/ნ და ზედნადების ტიპი. გაყიდვის დადასტურებისას ზედნადები ავტომატურად გაიგზავნება RS.GE-ზე."
            },
            {
                title: "RS.GE სამართავი პანელი",
                desc: "RS.GE მენიუ (მარცხენა ნავიგაციაში) გაჩვენებთ ყველა გაგზავნილი ზედნადების სიას. ღილაკები:\n• [სინქრ.]: RS.GE-დან სტატუსების განახლება.\n• [დადასტურება]: მიღებული ზედნადების დადასტურება.\n• [უარყოფა]: ზედნადების უარყოფა.\n• [დახურვა]: მიწოდების შემდეგ ზედნადების დასრულება.\n• [წაშლა]: სამუშაო ვერსიის წაშლა."
            },
            {
                title: "ანგარიშ-ფაქტურა RS.GE-ზე",
                desc: "RS.GE სამართავი გვერდის ზედა ნაწილში დააჭირეთ [ანგარიშ-ფაქტურა]. შეიყვანეთ მყიდველის ს/ნ, სახელი და საქონელი/მომსახურება. დააჭირეთ [გაგზავნა RS.GE-ზე]. თუ ადმინ პანელში ავტოგაგზავნა ჩართულია, იგი ავტომატურად გაიგზავნება ზედნადებთან ერთად."
            }
        ]
    }
];

export function GuidePage() {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredSections = sections.filter(s =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.content.some(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()) || c.desc.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handlePrint = () => {
        printPage("სისტემის გზამკვლევი");
    };

    useHeaderSetup(
        "სისტემის გზამკვლევი",
        <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="gap-2 shrink-0 border-border/50 bg-white/50 hover:bg-white text-slate-700 font-bold h-9 rounded-xl shadow-sm active:scale-95 transition-all"
        >
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">ბეჭდვა</span>
        </Button>
    );

    return (
        <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 max-w-7xl mx-auto pb-32 px-4 sm:px-6 lg:px-8 pt-8">
                {/* Header Section */}
                <div className="print:hidden">
                    <PageHeader
                        title="სისტემის გზამკვლევი"
                        description="ყველაფერი რაც გჭირდებათ DASTA-ს ეფექტურად გამოყენებისთვის. დეტალური ინსტრუქციები, რჩევები და საუკეთესო პრაქტიკა თქვენი ბიზნესის ზრდისთვის."
                        hideActions
                        hideTitle
                    />
                </div>

                {/* Search Bar */}
                <div className="relative print:hidden group max-w-4xl mx-auto w-full">
                    <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                        <Search className="h-6 w-6 text-muted-foreground group-focus-within:text-primary transition-all duration-300" />
                    </div>
                    <Input
                        placeholder="მოძებნეთ ფუნქცია, ინსტრუქცია ან RS.GE..."
                        className="pl-16 h-20 rounded-[2rem] bg-card/50 backdrop-blur-xl border-2 border-muted hover:border-primary/20 focus:border-primary text-xl shadow-2xl shadow-primary/5 transition-all duration-500 placeholder:text-muted-foreground/60"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter text-muted-foreground/40 bg-muted/30 px-3 py-1.5 rounded-full border border-border/50">
                        <span className="text-primary/60">Search</span> Instant
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    {/* Navigation Sidebar (Sticky) */}
                    <div className="lg:col-span-3 space-y-3 sticky top-12 print:hidden hidden md:block">
                        <div className="mb-8 px-4 relative">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary/60 mb-2">ნავიგაცია</h3>
                            <div className="h-1.5 w-12 bg-gradient-to-r from-primary/40 to-transparent rounded-full"></div>
                        </div>
                        <nav className="flex flex-col gap-2">
                            {sections.map((s) => (
                                <a
                                    key={s.id}
                                    href={`#${s.id}`}
                                    className="flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-card hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 font-bold text-[13px] text-foreground/70 hover:text-primary group border border-transparent hover:border-primary/10 active:scale-[0.98]"
                                >
                                    <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-500 group-hover:rotate-6 group-hover:scale-110 shadow-sm", s.bg)}>
                                        <s.icon className={cn("h-5 w-5", s.color)} />
                                    </div>
                                    <span className="flex-1 text-left tracking-tight">{s.title}</span>
                                    <ChevronRight className="h-4 w-4 text-primary/0 group-hover:text-primary opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-4 group-hover:translate-x-0" />
                                </a>
                            ))}
                        </nav>

                        <Card className="mt-12 border-primary/10 bg-gradient-to-br from-primary/5 via-transparent to-transparent rounded-[2rem] overflow-hidden shadow-2xl shadow-primary/5 group">
                            <CardHeader className="p-8 pb-4">
                                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
                                    <Info className="h-6 w-6 text-primary" />
                                </div>
                                <CardTitle className="text-lg font-black tracking-tight">გჭირდებათ დახმარება?</CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 pt-0">
                                <p className="text-xs text-muted-foreground leading-relaxed mb-6 font-medium">
                                    ვერ იპოვეთ სასურველი ინფორმაცია? ჩვენი გუნდი მზადაა ნებისმიერ დროს დაგეხმაროთ.
                                </p>
                                <Button className="w-full rounded-xl font-black text-xs uppercase tracking-widest h-12 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 active:scale-95">
                                    კონტაქტი
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Content Areas */}
                    <div className="lg:col-span-9 space-y-24">
                        {filteredSections.map((s) => (
                            <div key={s.id} id={s.id} className="scroll-mt-40 relative group/section">
                                {/* Section Header */}
                                <div className="flex items-center gap-6 mb-12">
                                    <div className={cn("h-20 w-20 shrink-0 rounded-3xl flex items-center justify-center shadow-2xl shadow-primary/10 border border-border/50 bg-gradient-to-br from-white to-transparent transform transition-transform duration-700 group-hover/section:rotate-3", s.bg)}>
                                        <s.icon className={cn("h-10 w-10", s.color)} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="px-3 py-1 rounded-full bg-muted text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Module</span>
                                            <div className={cn("h-1.5 w-12 rounded-full", s.color.replace('text-', 'bg-'))} />
                                        </div>
                                        <h2 className="text-3xl sm:text-5xl font-black tracking-tighter text-foreground leading-none">{s.title}</h2>
                                    </div>
                                </div>

                                {/* Section Cards List */}
                                <div className="grid gap-6">
                                    {s.content.map((c, i) => {
                                        const highlightMatch = (text: string) => {
                                            if (!searchQuery) return text;
                                            const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
                                            return parts.map((part, i) =>
                                                part.toLowerCase() === searchQuery.toLowerCase() ?
                                                    <mark key={i} className="bg-primary/20 text-primary rounded-sm px-1 font-bold italic">{part}</mark> : part
                                            );
                                        };

                                        return (
                                            <Card key={i} className="group/item border-border/40 shadow-sm rounded-[1.5rem] hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 overflow-hidden bg-white/50 backdrop-blur-md border-r-0 border-t-0 border-b-0 border-l-[10px]" style={{ borderLeftColor: `rgba(var(--primary-rgb), ${0.1 + (i * 0.1)})` }}>
                                                <div className="p-8 sm:p-10">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <h4 className="text-xl font-black tracking-tight text-foreground group-hover/item:text-primary transition-colors duration-300">
                                                            {highlightMatch(c.title)}
                                                        </h4>
                                                        <div className="h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-all duration-300 translate-x-4 group-hover/item:translate-x-0">
                                                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                                        </div>
                                                    </div>
                                                    <div className="text-muted-foreground text-[15px] leading-8 whitespace-pre-wrap font-medium">
                                                        {highlightMatch(c.desc)}
                                                    </div>
                                                </div>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}

                        {/* Empty State */}
                        {filteredSections.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-40 px-6 text-center bg-card/30 backdrop-blur-xl rounded-[3rem] border-4 border-dashed border-muted/50">
                                <div className="bg-background shadow-2xl p-8 rounded-[2rem] mb-8 relative animate-pulse">
                                    <Search className="h-12 w-12 text-primary/40" />
                                    <div className="absolute -top-2 -right-2 h-6 w-6 bg-primary rounded-full flex items-center justify-center">
                                        <div className="h-2 w-2 bg-white rounded-full" />
                                    </div>
                                </div>
                                <h3 className="text-3xl font-black mb-4 tracking-tighter">შედეგი ვერ მოიძებნა</h3>
                                <p className="text-muted-foreground text-lg max-w-md mx-auto font-medium">
                                    სამწუხაროდ, ძიების კრიტერიუმით "{searchQuery}" ინფორმაცია არ მოიძებნა. სცადეთ სხვა სიტყვა ან გამოიყენეთ მარცხენა მენიუ.
                                </p>
                                <Button 
                                    className="mt-10 rounded-2xl h-14 px-10 font-black tracking-widest uppercase text-xs shadow-xl shadow-primary/20"
                                    onClick={() => setSearchQuery("")}
                                >
                                    ძიების გასუფთავება
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                <style jsx global>{`
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
                    
                    :root {
                        --primary-rgb: 59, 130, 246;
                    }

                    .guide-container {
                        font-family: 'Inter', sans-serif;
                    }

                    @media print {
                        .print\\:hidden { display: none !important; }
                        body { background: white !important; color: black !important; }
                        .scroll-mt-40 { scroll-margin-top: 0 !important; margin-top: 3rem; page-break-inside: avoid; }
                        .rounded-3xl, .rounded-\\[2rem\\], .rounded-\\[3rem\\] { border-radius: 12px !important; }
                        .shadow-sm, .shadow-xl, .shadow-2xl { box-shadow: none !important; border: 1px solid #eee !important; }
                        .bg-white\\/50 { background: white !important; }
                    }

                    ::selection {
                        background: rgba(var(--primary-rgb), 0.2);
                        color: rgb(var(--primary-rgb));
                    }
                `}</style>
            </div>
        </div>
    );
}

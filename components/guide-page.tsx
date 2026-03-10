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
                title: "რაარის RS.GE ინტეგრაცია?",
                desc: "DASTA ინტეგრირებულია საქართველოს შემოსავლების სამსახურის პორტალთან (RS.GE). APEX-ისა და FINA-ს ანალოგიურად, შეგიძლიათ: ზედნადების გაგზავნა, დადასტურება/უარყოფა, დახურვა, ანგარიშ-ფაქტურის გაგზავნა — ყოველაფერი RS.GE-ზე გასვლად აპლიკაციიდან."
            },
            {
                title: "გააქტივება — ადმინ პანელი საჩიროები",
                desc: "გადით ადმინ პანელი → RS.GE ინტეგრაცია. შეყვანეთ აქაური 4 მონაცემი: 1) სერვის-მომხმარებელი (Username) 2) პაროლი 3) საიდენტიფიკაციო ნომერი (ს/ნ). შემდეგ დააჭირეთ 'კავშირის ტესტი' ღილაკის გასასაკვეთლად. ✅ ნიშანის გაჩენა ნიშნავს კავშირი წარმათებულია."
            },
            {
                title: "RS.GE ღილაკი ადმინ პანელში",
                desc: "ვინაიდან გაგაკეთება: ნაგულისხმევი ზედნადების ტიპი (შიდა/გარე/გადაადგილება), ავტომატური გაგზავნა გაყიდვისას, ანგარიშ-ფაქტურას ავტომატური გაგზავნა."
            },
            {
                title: "ზედნადების გაგზავნა გაყიდვებისას (POS)",
                desc: "გადით გაყიდვა. კალათში დაამატეთ კარტში. დააჭირეთ ჩეკ-აუტი. აქ კარტაში დააჭირეთ [RS.GE] ღილაკი. ჩაირთვება მწვანე ემერალდი ბლოკი, სადაც შეგიძლიათ შეავსეთ მყიდველის ს/ნ და ზედნადების ტიპი. გაყიდვის დადასტურებისას ზედნადები ავტომატურად გაიგზავნება RS.GE-ზე."
            },
            {
                title: "RS.GE სამართავი გვერდი",
                desc: "მარცენა ავტომატური გაგზავნისა, RS.GE მენიუდან გვერდვე (პანელიდან თოვითვით სანავიგაციაში) გაგვაძლებს ყველა გაგზავნილი ზედნადებების სიას. ღილაკები: [სინქრ.] — RS.GE-დან განახლება, [დადასტურე] — მიღებულის მიერად დადასტურება, [უარყოფა] — ზედნადების უარყოფა, [დახურვა] — მიწოდების შემდეგ დახურვა, [წაშლა] — სამუშაო ზედნადების ნაკვეთი."
            },
            {
                title: "ანგარიშ-ფაქტურა RS.GE-ზე",
                desc: "RS.GE სამართავი გვერდის ზედა დააჭირეთ [ანგარიშ-ფაქტურა]. შეყვანეთ მყიდველის ს/ნ, სახელი და საქონებს/მომსახურებას. დააჭირეთ [გაგზავნა RS.GE-ზე]. თუ ადმინ პანელში ანგარიშ-ფაქტურის ავტოგაგზავნა ჩართულია, აგრეთ იგი ავტომატურად გაგზავნდება ზედნადებისთან ერთად."
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
        window.print();
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700 max-w-6xl mx-auto pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 print:hidden">
                <PageHeader
                    title="სისტემის გზამკვლევი"
                    description="ისწავლეთ DASTA-ს ყველა ფუნქცია და მართეთ თქვენი ბიზნესი ეფექტურად"
                />
                <Button
                    variant="outline"
                    className="rounded-xl flex items-center gap-2 h-12 px-6 font-bold border-2 hover:bg-primary hover:text-white transition-all shadow-lg"
                    onClick={handlePrint}
                >
                    <Printer className="h-4 w-4" />
                    PDF ჩამოტვირთვა
                </Button>
            </div>

            <div className="relative print:hidden">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    placeholder="მოძებნეთ ფუნქცია ან ინსტრუქცია..."
                    className="pl-12 h-14 rounded-2xl bg-muted/30 border-none text-lg font-medium shadow-inner"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Navigation Sidebar */}
                <div className="md:col-span-1 space-y-3 print:hidden">
                    <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground px-4 mb-4">კატეგორიები</h3>
                    {sections.map((s) => (
                        <a
                            key={s.id}
                            href={`#${s.id}`}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted/50 transition-all font-bold text-sm text-foreground/70 hover:text-primary group"
                        >
                            <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center transition-all", s.bg)}>
                                <s.icon className={cn("h-4 w-4", s.color)} />
                            </div>
                            {s.title}
                            <ChevronRight className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                        </a>
                    ))}

                    <Card className="mt-8 border-none bg-gradient-to-br from-primary/10 to-transparent rounded-2xl overflow-hidden">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">გჭირდებათ დახმარება?</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                                თუ ვერ იპოვნეთ თქვენთვის საინტერესო ფუნქცია, დაუკავშირდით მხარდაჭერის ჯგუფს.
                            </p>
                            <Button size="sm" variant="outline" className="w-full rounded-lg font-bold text-[10px] uppercase">კონტაქტი</Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content */}
                <div className="md:col-span-2 space-y-12">
                    {filteredSections.map((s) => (
                        <div key={s.id} id={s.id} className="scroll-mt-24">
                            <div className="flex items-center gap-4 mb-6">
                                <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg", s.bg)}>
                                    <s.icon className={cn("h-7 w-7", s.color)} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black tracking-tight">{s.title}</h2>
                                    <p className="text-sm text-muted-foreground font-medium">სექციის დეტალური მიმოხილვა</p>
                                </div>
                            </div>

                            <div className="grid gap-4">
                                {s.content.map((c, i) => (
                                    <Card key={i} className="border-border/50 shadow-sm rounded-2xl hover:shadow-md transition-all group overflow-hidden border-l-4" style={{ borderColor: `var(--${s.id}-color)` }}>
                                        <CardHeader className="pb-3">
                                            <div className="flex items-center justify-between">
                                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                                    <div className={cn("h-1.5 w-1.5 rounded-full", s.color.replace('text', 'bg'))} />
                                                    {c.title}
                                                </CardTitle>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-muted-foreground text-sm leading-relaxed font-medium">
                                                {c.desc}
                                            </p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    ))}

                    {filteredSections.length === 0 && (
                        <div className="text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed border-muted-foreground/20">
                            <div className="bg-muted p-4 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Info className="h-8 w-8 text-muted-foreground/50" />
                            </div>
                            <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground">შედეგი ვერ მოიძებნა</h3>
                            <p className="text-muted-foreground text-sm max-w-xs mx-auto mt-2 italic">სცადეთ სხვა საკვანძო სიტყვა ან მოძებნეთ კატეგორიების მიხედვით</p>
                        </div>
                    )}
                </div>
            </div>

            <style jsx global>{`
        @media print {
          .print\\:hidden { display: none !important; }
          body { background: white !important; color: black !important; }
          .scroll-mt-24 { scroll-margin-top: 0 !important; margin-top: 2rem; page-break-inside: avoid; }
          .rounded-2xl { border-radius: 4px !important; }
          .shadow-sm, .shadow-lg { box-shadow: none !important; border: 1px solid #eee !important; }
        }
      `}</style>
        </div>
    );
}

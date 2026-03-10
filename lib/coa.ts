export interface Account {
    code: string;
    name: string;
    type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
    parentCode?: string;
}

export const CHART_OF_ACCOUNTS: Account[] = [
    // Assets (1000s)
    { code: '1100', name: 'ფულადი სახსრები', type: 'asset' },
    { code: '1110', name: 'სალარო (GEL)', type: 'asset', parentCode: '1100' },
    { code: '1120', name: 'სალარო (ვალუტა)', type: 'asset', parentCode: '1100' },
    { code: '1210', name: 'საბანკო ანგარიშები (GEL)', type: 'asset', parentCode: '1100' },
    { code: '1220', name: 'საბანკო ანგარიშები (ვალუტა)', type: 'asset', parentCode: '1100' },
    { code: '1410', name: 'მოთხოვნები მიწოდებიდან', type: 'asset' },
    { code: '1610', name: 'სასაქონლო-მატერიალური მარაგები', type: 'asset' },
    { code: '2100', name: 'ძირითადი საშუალებები', type: 'asset' },

    // Liabilities (4000s)
    { code: '4110', name: 'ვალდებულებები მიწოდებიდან', type: 'liability' },
    { code: '4210', name: 'საგადასახადო ვალდებულებები', type: 'liability' },
    { code: '4211', name: 'დღგ-ს ვალდებულება', type: 'liability', parentCode: '4210' },

    // Equity (3000s)
    { code: '3110', name: 'საწესდებო კაპიტალი', type: 'equity' },
    { code: '3210', name: 'გაუნაწილებელი მოგება', type: 'equity' },

    // Revenue (6000s)
    { code: '6110', name: 'შემოსავლები რეალიზაციიდან', type: 'revenue' },

    // Expenses (7000s/8000s)
    { code: '7110', name: 'რეალიზებული საქონლის თვითღირებულება', type: 'expense' },
    { code: '8110', name: 'საოპერაციო ხარჯები', type: 'expense' },
    { code: '8120', name: 'ხელფასის ხარჯი', type: 'expense', parentCode: '8110' },
    { code: '8130', name: 'ქირის ხარჯი', type: 'expense', parentCode: '8110' },
    { code: '8140', name: 'კომუნალური ხარჯები', type: 'expense', parentCode: '8110' },
];

export const getAccountByCode = (code: string) => CHART_OF_ACCOUNTS.find(a => a.code === code);

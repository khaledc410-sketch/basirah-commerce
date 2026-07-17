"use client";

import { Check, LockKeyhole, Save, ShieldCheck, Store, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

export function SettingsPanel() {
  const [analyticsConsent, setAnalyticsConsent] = useState(true);
  const [retention, setRetention] = useState("180");

  function save(section: string) {
    toast.success("حُفظت الإعدادات التجريبية", { description: `${section} محفوظ محليًا للمعاينة فقط.` });
  }

  return (
    <Tabs defaultValue="store"><TabsList className="h-auto w-full flex-wrap justify-start"><TabsTrigger value="store">المتجر</TabsTrigger><TabsTrigger value="integration">التكامل</TabsTrigger><TabsTrigger value="safety">الصوت والسلامة</TabsTrigger><TabsTrigger value="privacy">الخصوصية</TabsTrigger></TabsList>
      <TabsContent className="mt-5" value="store"><Card><CardHeader><CardTitle>بيانات المتجر</CardTitle><p className="text-sm text-muted-foreground">الاسم والمنطقة واللغة الافتراضية للتقارير.</p></CardHeader><CardContent className="max-w-2xl space-y-5"><div className="space-y-2"><Label htmlFor="storeName">اسم المتجر</Label><Input defaultValue="مَدى للعناية" id="storeName" /></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="timezone">المنطقة الزمنية</Label><Input defaultValue="Asia/Riyadh" dir="ltr" id="timezone" readOnly /></div><div className="space-y-2"><Label htmlFor="currency">العملة</Label><Input defaultValue="SAR — الريال السعودي" id="currency" readOnly /></div></div><Button onClick={() => save("بيانات المتجر")}><Save />حفظ بيانات المتجر</Button></CardContent></Card></TabsContent>
      <TabsContent className="mt-5" value="integration"><div className="grid gap-5 lg:grid-cols-2"><Card><CardHeader><div className="flex items-center justify-between"><span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Store /></span><Badge className="bg-success-soft text-success hover:bg-success-soft"><Check />متصل بالعرض</Badge></div><CardTitle className="mt-3">سلة</CardTitle></CardHeader><CardContent><dl className="space-y-3 text-sm"><div className="flex justify-between gap-4"><dt className="text-muted-foreground">الحالة</dt><dd>بيانات تجريبية فقط</dd></div><div className="flex justify-between gap-4"><dt className="text-muted-foreground">تدفق السوق</dt><dd>Easy Mode مطلوب</dd></div><div className="flex justify-between gap-4"><dt className="text-muted-foreground">الكتالوج</dt><dd>3 منتجات عرض</dd></div></dl><Button className="mt-5" disabled variant="outline">الربط الحي ينتظر اختبار متجر سلة</Button></CardContent></Card><Card><CardHeader><div className="flex items-center justify-between"><span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><LockKeyhole /></span><Badge variant="secondary">متصل بالعرض</Badge></div><CardTitle className="mt-3">زد</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">مسار العرض متاح. الربط الحي ينتظر عقد OAuth ثنائي الرموز وwebhook موثّق واختبارات متجر تطوير.</p><Button className="mt-5" disabled variant="outline">الربط الحي ينتظر اختبار متجر زد</Button></CardContent></Card></div></TabsContent>
      <TabsContent className="mt-5" value="safety"><Card><CardHeader><CardTitle>صوت العلامة وحدود السلامة</CardTitle></CardHeader><CardContent className="max-w-3xl space-y-6"><div className="space-y-2"><Label htmlFor="voice">تعليمات الصياغة</Label><Textarea defaultValue="استخدم لهجة سعودية بسيطة. لا تعطِ وعودًا علاجية. لا تبالغ في النتائج. اذكر أن المعلومة غير متوفرة عند غياب المصدر." id="voice" /></div><div className="rounded-xl bg-success-soft p-4 text-sm"><p className="flex items-center gap-2 font-semibold text-success"><ShieldCheck className="size-5" />حدود غير قابلة للتعطيل</p><p className="mt-2 text-muted-foreground">المنتج المتوفر والملاءمة والسلامة ومصدر السعر والمخزون تسبق صوت العلامة وأولوية التاجر.</p></div><Button onClick={() => save("الصوت والسلامة")}><Save />حفظ التعليمات</Button></CardContent></Card></TabsContent>
      <TabsContent className="mt-5" value="privacy"><Card><CardHeader><CardTitle>الاحتفاظ والموافقة</CardTitle><p className="text-sm text-muted-foreground">إعدادات تصميمية للتحضير لـ PDPL؛ لا تمثل ادعاء امتثال قانوني.</p></CardHeader><CardContent className="max-w-3xl space-y-6"><div className="flex min-h-16 items-center justify-between gap-5 rounded-xl border p-4"><div><Label htmlFor="analyticsConsent">تحليلات بموافقة العميل</Label><p className="mt-1 text-sm text-muted-foreground">الأحداث غير الأساسية تتبع حالة الموافقة.</p></div><Switch checked={analyticsConsent} id="analyticsConsent" onCheckedChange={setAnalyticsConsent} /></div><div className="space-y-2"><Label htmlFor="retention">مدة الاحتفاظ بالمحادثات (يومًا)</Label><Input id="retention" max={365} min={30} onChange={(event) => setRetention(event.target.value)} type="number" value={retention} /></div><div className="flex flex-wrap gap-2"><Button onClick={() => save("الخصوصية")}><Save />حفظ الخصوصية</Button><Button disabled variant="outline"><Trash2 />حذف تجريبي غير متاح</Button></div></CardContent></Card></TabsContent>
    </Tabs>
  );
}

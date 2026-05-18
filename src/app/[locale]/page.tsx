import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { 
  Building2, 
  Users, 
  ShieldCheck, 
  History, 
  ArrowRight, 
  Languages,
  Sparkles,
  Zap
} from "lucide-react";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
}

function FeatureCard({ title, description, icon: Icon }: FeatureCardProps) {
  return (
    <div className="group relative rounded-2xl p-6 glassmorphism-card transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary-500/10">
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative z-10">
        <div className="inline-flex rounded-xl bg-primary-100 p-3 text-primary-600 dark:bg-primary-950/50 dark:text-primary-400 group-hover:scale-110 transition-transform duration-300">
          <Icon className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  const authT = await getTranslations("auth");
  const accT = await getTranslations("accounts");

  const isRtl = locale === "ar";
  const nextLocale = locale === "en" ? "ar" : "en";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 bg-grid-pattern relative overflow-hidden transition-colors duration-300">
      {/* Premium Ambient Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-400/20 dark:bg-primary-500/10 rounded-full filter blur-3xl animate-pulse" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-indigo-400/20 dark:bg-indigo-500/10 rounded-full filter blur-3xl animate-pulse delay-2000" />

      {/* Header / Top Navigation */}
      <header className="relative z-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-600 p-2.5 text-white shadow-lg shadow-primary-500/20">
              <Zap className="h-6 w-6 animate-pulse" />
            </div>
            <span className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
              Vibe<span className="text-gradient">CRM</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Locale Language Switcher */}
            <Link
              href="/"
              locale={nextLocale}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-gray-700 bg-white/80 hover:bg-white dark:text-gray-300 dark:bg-gray-900/80 dark:hover:bg-gray-900 shadow-sm border border-gray-200/50 dark:border-gray-800/50 transition-all hover:scale-105 cursor-pointer"
            >
              <Languages className="h-4 w-4 text-primary-500" />
              <span>{isRtl ? "English" : "العربية"}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-24 text-center">
        <div className="animate-fade-in space-y-8 max-w-3xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3.5 py-1.5 text-xs font-semibold text-primary-700 dark:bg-primary-950/30 dark:text-primary-300 border border-primary-200/30">
            <Sparkles className="h-3.5 w-3.5" />
                    <span>Next.js 15+ & Supabase Production Boilerplate</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-tight">
            Bootstrap Your Business in <span className="text-gradient-purple-amber font-black">Record Time</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            The ultimate role-governed template designed for AI-driven development. Beautiful styling, enterprise security, and 100% test-pinned consistency out of the box.
          </p>
          
          {/* Call to Actions */}
          <div className="flex flex-wrap gap-4 justify-center pt-4">
            <Link
              href="/login"
              className="rounded-full bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 px-8 py-4 text-base font-semibold text-white shadow-xl shadow-primary-500/25 hover:shadow-primary-500/30 hover:scale-[1.03] transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <span>{authT("login")}</span>
              <ArrowRight className={`h-5 w-5 ${isRtl ? "rotate-180" : ""}`} />
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-white dark:bg-gray-900 px-8 py-4 text-base font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800/80 shadow-md border border-gray-200/60 dark:border-gray-800/60 hover:scale-[1.03] transition-all cursor-pointer"
            >
              {authT("register")}
            </Link>
          </div>

          {/* Tech Stack Pills */}
          <div className="pt-12">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Powered by the absolute best</p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              {["Next.js 15+", "React 19", "Supabase", "Drizzle ORM", "Tailwind CSS v4", "TanStack Query", "next-intl", "Vitest"].map((tech) => (
                <span key={tech} className="rounded-full bg-white/60 dark:bg-gray-900/60 border border-gray-200/50 dark:border-gray-800/50 px-4 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 shadow-sm">
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Feature Grid Section */}
        <section className="mt-32 max-w-6xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white">
              Enterprise Grade Features
            </h2>
            <p className="text-base text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
              Everything you need to showcase a flawless bilingual CRM & HR system to potential customers.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard 
              title={accT("title")}
              description={isRtl ? "إدارة حسابات عملائك، شركائك، ومورديك بمرونة تامة ونظام تصنيف متكامل." : "Seamlessly manage account levels, corporate relationships, partners, and vendors in a single directory."}
              icon={Building2}
            />
            <FeatureCard 
              title={isRtl ? "جهات الاتصال" : "Contacts Directory"}
              description={isRtl ? "حفظ وإدارة جهات الاتصال الخاصة بالشركات، وربطها الذكي مع تحديد جهة الاتصال الأساسية." : "Robust tracking of key individuals, profiles, email, phone records, and dynamic links to parent accounts."}
              icon={Users}
            />
            <FeatureCard 
              title={isRtl ? "أدوار وصلاحيات دقيقة" : "Granular RBAC Gates"}
              description={isRtl ? "بوابة الأمان والتحكم بالوصول. واجهات ذكية ومتحركة تتكيف فوراً مع دور وصلاحيات كل مستخدم." : "Role-Based Access Control verified end-to-end. UI components adapt in real-time based on permissions."}
              icon={ShieldCheck}
            />
            <FeatureCard 
              title={isRtl ? "سجلات تدقيق كاملة" : "Deep Audit Logging"}
              description={isRtl ? "مراقبة وتتبع كامل للعمليات والتعديلات لضمان نزاهة وموثوقية البيانات والامتثال للأمان." : "Every single database creation, edit, and soft-delete is audited and logged, satisfying compliance targets."}
              icon={History}
            />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-200/50 dark:border-gray-800/50 bg-white/40 dark:bg-gray-950/40 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            &copy; {new Date().getFullYear()} VibeCRM. All rights reserved. Built with love for vibe-coders and AI agents.
          </p>
        </div>
      </footer>
    </div>
  );
}

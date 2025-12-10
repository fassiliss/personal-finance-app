import AppProviders from "@/components/AppProviders";

export default function MainLayout({ children }: { children: React.ReactNode }) {
    return <AppProviders>{children}</AppProviders>;
}
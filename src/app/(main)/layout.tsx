import AppProviders from "@/components/AppProviders";
import MainHeader from "@/components/MainHeader";
import MainFooter from "@/components/Footer";

export default function MainLayout({ children }: { children: React.ReactNode }) {
    return (
        <AppProviders>
            <MainHeader />
            {children}
            <MainFooter />
        </AppProviders>
    );
}
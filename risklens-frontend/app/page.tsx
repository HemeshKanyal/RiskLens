import "@/components/landing/notebook/notebook.css";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import Hero from "@/components/landing/notebook/Hero";
import Chapters from "@/components/landing/notebook/Chapters";

export default function Home() {
    return (
        <>
            <Navbar />
            <main>
                <Hero />
                <Chapters />
            </main>
            <Footer />
        </>
    );
}
